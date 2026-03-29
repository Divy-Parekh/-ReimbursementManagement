const { PrismaClient } = require('@prisma/client');
const { sendApprovalRequestEmail, sendApprovalNotificationEmail } = require('./emailService');

const prisma = new PrismaClient();

/**
 * Trigger the approval workflow for a submitted expense
 * @param {string} expenseId 
 */
const triggerApprovalWorkflow = async (expenseId) => {
  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: {
      user: {
        include: {
          manager: true,
          approvalRules: {
            include: {
              approvers: {
                orderBy: { sequenceOrder: 'asc' }
              }
            }
          }
        }
      }
    }
  });

  if (!expense || expense.status !== 'SUBMITTED') {
    throw new Error('Expense not found or not in SUBMITTED state');
  }

  // 1. Determine the applicable rule
  // For simplicity, we assume one rule per user or fallback to manager.
  // In a robust system, you might filter rules based on Category or Amount.
  let activeRule = expense.user.approvalRules[0]; 

  // If no specific rule, standard manager approval 
  if (!activeRule && expense.user.manager) {
     activeRule = {
       isManagerApprover: true,
       isSequential: true,
       minApprovalPercentage: 100,
       approvers: [] // empty, manager handled below
     };
  } else if (!activeRule && !expense.user.manager) {
     // No rule and no manager -> Auto Approve
     await prisma.expense.update({
       where: { id: expenseId },
       data: { status: 'APPROVED' }
     });
     return;
  }

  // Change to WAITING_APPROVAL
  await prisma.expense.update({
    where: { id: expenseId },
    data: { status: 'WAITING_APPROVAL' }
  });

  // 2. Build the initial sequence of approvers
  let sequenceOrder = 1;
  const logsToCreate = [];

  // If manager must approve first
  if (activeRule.isManagerApprover && expense.user.manager) {
    logsToCreate.push({
      expenseId,
      approverId: expense.user.manager.id,
      sequenceOrder,
      action: 'PENDING'
    });
    sequenceOrder++;

    // If sequential, we stop here and wait for manager.
    // Otherwise, we calculate remaining logs but keep them pending.
  }

  // Other rule-based approvers
  if (activeRule.approvers && activeRule.approvers.length > 0) {
    for (const approver of activeRule.approvers) {
      logsToCreate.push({
        expenseId,
        approverId: approver.userId,
        sequenceOrder: activeRule.isSequential ? sequenceOrder++ : sequenceOrder, // keep same group order if parallel
        action: 'PENDING'
      });
    }
  }

  // 3. Create the logs 
  if (logsToCreate.length > 0) {
    await prisma.approvalLog.createMany({
      data: logsToCreate
    });

    // 4. Send email to the first approver(s)
    const minSequenceOrder = Math.min(...logsToCreate.map(l => l.sequenceOrder));
    const firstApprovers = logsToCreate.filter(l => l.sequenceOrder === minSequenceOrder);

    for (const log of firstApprovers) {
      const approverDb = await prisma.user.findUnique({ where: { id: log.approverId }});
      await sendApprovalRequestEmail(approverDb.email, approverDb.name, expense);
    }
  } else {
    // Edge case if rule is empty and no manager
    await prisma.expense.update({
      where: { id: expenseId },
      data: { status: 'APPROVED' }
    });
  }
};

/**
 * Handle an approval or rejection decision
 * @param {string} expenseId 
 * @param {string} approverId 
 * @param {string} action 'APPROVED' or 'REJECTED'
 * @param {string} comments 
 */
const processApprovalDecision = async (expenseId, approverId, action, comments) => {
  // Update the log
  const logResponse = await prisma.approvalLog.update({
    where: {
      expenseId_approverId: {
        expenseId,
        approverId
      }
    },
    data: {
      action,
      comments,
      actionAt: new Date()
    }
  });

  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: {
      user: {
        include: {
          approvalRules: {
            include: {
              approvers: true
            }
          }
        }
      },
      approvalLogs: true
    }
  });

  const rule = expense.user.approvalRules[0];
  const logs = expense.approvalLogs;

  // 1. Check for Rejection
  if (action === 'REJECTED') {
    // Hard reject immediately
    await prisma.expense.update({
      where: { id: expenseId },
      data: { status: 'REJECTED' }
    });
    
    // Notify user
    await sendApprovalNotificationEmail(expense.user.email, expense, 'REJECTED', 'an approver');
    return { status: 'REJECTED' };
  }

  // 2. Check Sequence Progression
  if (rule?.isSequential) {
      const nextSequence = logResponse.sequenceOrder + 1;
      const nextLogs = logs.filter(l => l.sequenceOrder === nextSequence && l.action === 'PENDING');
      
      if (nextLogs.length > 0) {
        // Trigger next approvers in sequence
        for (const nextLog of nextLogs) {
           const approverDb = await prisma.user.findUnique({ where: { id: nextLog.approverId }});
           await sendApprovalRequestEmail(approverDb.email, approverDb.name, expense);
        }
        return { status: 'WAITING_APPROVAL' };
      }
  }

  // 3. Evaluate Thresholds
  const approvedCount = logs.filter(l => l.action === 'APPROVED').length;
  let totalRequired = logs.length;
  
  // Calculate specific percentage threshold if parallel and defined
  let threshold = 100;
  if (rule && rule.minApprovalPercentage) {
    threshold = parseFloat(rule.minApprovalPercentage);
  }

  const currentPercentage = (approvedCount / totalRequired) * 100;

  // Check REQUIRED approvers explicitly
  let allRequiredApproved = true;
  if (rule?.approvers) {
    const requiredApprovers = rule.approvers.filter(a => a.isRequired);
    for (const reqApp of requiredApprovers) {
      const matchedLog = logs.find(l => l.approverId === reqApp.userId);
      if (!matchedLog || matchedLog.action !== 'APPROVED') {
        allRequiredApproved = false;
        break;
      }
    }
  }

  if (currentPercentage >= threshold && allRequiredApproved) {
    // Fully Approved
    await prisma.expense.update({
      where: { id: expenseId },
      data: { status: 'APPROVED' }
    });
    
    // Notify user
    await sendApprovalNotificationEmail(expense.user.email, expense, 'APPROVED', 'all required approvers');
    return { status: 'APPROVED' };
  }

  return { status: 'WAITING_APPROVAL' };
};

module.exports = {
  triggerApprovalWorkflow,
  processApprovalDecision,
};
