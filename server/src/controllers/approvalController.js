const { PrismaClient } = require('@prisma/client');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { processApprovalDecision } = require('../services/approvalEngine');

const prisma = new PrismaClient();

/**
 * Get all pending approvals for the authenticated user (Manager/Approver)
 * @route GET /api/approvals/pending
 */
const getPendingApprovals = async (req, res, next) => {
  try {
    const approverId = req.user.id;

    const pendingLogs = await prisma.approvalLog.findMany({
      where: {
        approverId,
        action: 'PENDING',
        expense: {
          status: 'WAITING_APPROVAL'
        }
      },
      include: {
        expense: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const expenses = pendingLogs.map(log => ({
      ...log.expense,
      approvalLogId: log.id,
      sequenceOrder: log.sequenceOrder
    }));

    // In a sequential workflow, we should only return items where prior sequences are approved.
    // For simplicity, we assume processApprovalDecision handles triggering emails at the right time.
    // But to prevent UI showing future sequence items, filter here:
    
    const validExpenses = await Promise.all(expenses.map(async (exp) => {
       // Check if there are any PENDING logs for this expense with a lower sequence order
       const priorPending = await prisma.approvalLog.findFirst({
         where: {
           expenseId: exp.id,
           action: 'PENDING',
           sequenceOrder: { lt: exp.sequenceOrder }
         }
       });

       return priorPending ? null : exp;
    }));

    const finalExpenses = validExpenses.filter(e => e !== null);

    return sendSuccess(res, 200, 'Pending approvals fetched', finalExpenses, finalExpenses.length);
  } catch (error) {
    next(error);
  }
};

/**
 * Approve an expense
 * @route POST /api/approvals/:expenseId/approve
 */
const approveExpense = async (req, res, next) => {
  try {
    const { expenseId } = req.params;
    const { comments } = req.body;
    const approverId = req.user.id;

    const log = await prisma.approvalLog.findUnique({
      where: { expenseId_approverId: { expenseId, approverId } }
    });

    if (!log || log.action !== 'PENDING') {
      return sendError(res, 400, 'Invalid approval request or already processed.');
    }

    const result = await processApprovalDecision(expenseId, approverId, 'APPROVED', comments);

    return sendSuccess(res, 200, 'Expense approved successfully', { status: result.status });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject an expense
 * @route POST /api/approvals/:expenseId/reject
 */
const rejectExpense = async (req, res, next) => {
  try {
    const { expenseId } = req.params;
    const { comments } = req.body;
    const approverId = req.user.id;

    if (!comments) {
      return sendError(res, 400, 'Comments are required for rejection.');
    }

    const log = await prisma.approvalLog.findUnique({
      where: { expenseId_approverId: { expenseId, approverId } }
    });

    if (!log || log.action !== 'PENDING') {
      return sendError(res, 400, 'Invalid rejection request or already processed.');
    }

    const result = await processApprovalDecision(expenseId, approverId, 'REJECTED', comments);

    return sendSuccess(res, 200, 'Expense rejected successfully', { status: result.status });
  } catch (error) {
    next(error);
  }
};

/**
 * Get audit logs for a specific expense
 * @route GET /api/approvals/:expenseId/logs
 */
const getExpenseLogs = async (req, res, next) => {
  try {
    const { expenseId } = req.params;
    const companyId = req.user.companyId;

    // Ensure user has access (either expense owner, an approver, or admin)
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId }
    });

    if (!expense || expense.companyId !== companyId) {
       return sendError(res, 404, 'Expense not found');
    }

    if (req.user.role === 'EMPLOYEE' && expense.userId !== req.user.id) {
       // Only allow if they are an approver for this
       const isApprover = await prisma.approvalLog.findUnique({
         where: { expenseId_approverId: { expenseId, approverId: req.user.id } }
       });
       if (!isApprover) {
         return sendError(res, 403, 'Not authorized to view these logs');
       }
    }

    const logs = await prisma.approvalLog.findMany({
      where: { expenseId },
      include: {
        approver: {
          select: { id: true, name: true, email: true, role: true }
        }
      },
      orderBy: { sequenceOrder: 'asc' }
    });

    return sendSuccess(res, 200, 'Approval logs fetched successfully', logs, logs.length);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPendingApprovals,
  approveExpense,
  rejectExpense,
  getExpenseLogs,
};
