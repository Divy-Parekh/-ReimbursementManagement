const prisma = require('../utils/prisma');
const { sendApprovalRequestEmail, sendApprovalNotificationEmail } = require('./emailService');
const { createNotification } = require('./notificationService');

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
  const logSet = new Set();
  
  const addLog = (approverId, order) => {
    if (!logSet.has(approverId)) {
      logsToCreate.push({ expenseId, approverId, sequenceOrder: order, action: 'PENDING' });
      logSet.add(approverId);
    }
  };

  // If manager must approve first
  if (activeRule.isManagerApprover && expense.user.manager) {
    addLog(expense.user.manager.id, sequenceOrder);
    sequenceOrder++;
  }

  // Other rule-based approvers
  if (activeRule.approvers && activeRule.approvers.length > 0) {
    for (const approver of activeRule.approvers) {
      addLog(approver.userId, activeRule.isSequential ? sequenceOrder++ : sequenceOrder);
    }
  }

  // If manager is NOT first, they act as a regular concurrent/appended approver
  if (!activeRule.isManagerApprover && expense.user.manager) {
    addLog(expense.user.manager.id, activeRule.isSequential ? sequenceOrder++ : sequenceOrder);
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
      await createNotification(
        approverDb.id, 
        'New Expense Approval Request', 
        `${expense.user.name} has submitted an expense for ${expense.amount} ${expense.currency} that requires your approval.`
      );
    }
    // Notify the CFO globally
    const companyCfo = await prisma.user.findFirst({
      where: { companyId: expense.companyId, role: 'CFO' }
    });
    if (companyCfo) {
      await createNotification(
        companyCfo.id,
        'Global Approval Needed',
        `${expense.user.name} submitted an expense for ${expense.amount} ${expense.currency}. As CFO, you can override and approve it directly.`
      );
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
  const approverDb = await prisma.user.findUnique({
    where: { id: approverId }
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

  // CFO Global Override Check
  if (approverDb.role === 'CFO') {
    const finalStatus = action === 'REJECTED' ? 'REJECTED' : 'APPROVED';
    
    // Unconditionally apply decision
    await prisma.expense.update({
      where: { id: expenseId },
      data: { status: finalStatus }
    });

    // We use upsert to record the CFO's decision without collision
    await prisma.approvalLog.upsert({
      where: {
        expenseId_approverId: { expenseId, approverId }
      },
      create: {
        expenseId,
        approverId,
        action,
        comments,
        sequenceOrder: 999, // Represents CFO override
        actionAt: new Date()
      },
      update: {
        action,
        comments,
        actionAt: new Date()
      }
    });

    // Notify User
    await sendApprovalNotificationEmail(
      expense.user.email,
      expense,
      finalStatus,
      'the CFO (Executive Override)'
    );
    await createNotification(
      expense.userId,
      `Expense ${finalStatus}`,
      `Your expense for ${expense.amount} ${expense.currency} was ${finalStatus} by the CFO.`
    );
    return { status: finalStatus };
  }

  // Update Standard Log
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
    await createNotification(
      expense.userId,
      'Expense Rejected',
      `Your expense for ${expense.amount} ${expense.currency} was REJECTED by an approver.`
    );
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
           await createNotification(
             approverDb.id,
             'New Expense Approval Request',
             `${expense.user.name} has submitted an expense for ${expense.amount} ${expense.currency} that requires your approval.`
           );
        }
        return { status: 'WAITING_APPROVAL' };
      }
  }

  // 3. Evaluate Thresholds
  const approvedCount = logs.filter(l => l.action === 'APPROVED').length;
  let totalRequired = logs.length;
  
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
    await sendApprovalNotificationEmail(
      expense.user.email, 
      expense, 
      'APPROVED', 
      'all required approvers'
    );
    await createNotification(
      expense.userId,
      'Expense Approved!',
      `Your expense for ${expense.amount} ${expense.currency} was FULLY APPROVED by all required approvers.`
    );
    return { status: 'APPROVED' };
  }

  return { status: 'WAITING_APPROVAL' };
};

module.exports = {
  triggerApprovalWorkflow,
  processApprovalDecision,
};
