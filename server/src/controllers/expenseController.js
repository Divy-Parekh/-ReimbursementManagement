const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { convertCurrency } = require('../services/currencyService');
const { triggerApprovalWorkflow } = require('../services/approvalEngine');

const prisma = new PrismaClient();

/**
 * Get all expenses for the authenticated user
 * @route GET /api/expenses/my
 */
const getMyExpenses = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const whereClause = { userId };
    if (status) {
      whereClause.status = status;
    }

    const expenses = await prisma.expense.findMany({
      where: whereClause,
      include: {
        attachments: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return sendSuccess(res, 200, 'Expenses fetched successfully', expenses, expenses.length);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all company expenses (Admin only or elevated view)
 * @route GET /api/expenses/all
 */
const getAllCompanyExpenses = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;

    const expenses = await prisma.expense.findMany({
      where: { companyId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        attachments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, 200, 'All company expenses fetched successfully', expenses, expenses.length);
  } catch (error) {
    next(error);
  }
};

/**
 * Get expense KPIs/Summary
 * @route GET /api/expenses/summary
 */
const getExpenseSummary = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;

    const summary = await prisma.expense.groupBy({
      by: ['status'],
      where: { companyId },
      _count: { id: true },
      _sum: { convertedAmount: true },
    });

    const categories = await prisma.expense.groupBy({
      by: ['category'],
      where: { companyId, status: 'APPROVED' },
      _sum: { convertedAmount: true },
    });

    return sendSuccess(res, 200, 'Summary fetched successfully', { summary, categories });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific expense by ID
 * @route GET /api/expenses/:id
 */
const getExpenseById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        attachments: true,
        approvalLogs: {
          include: {
            approver: { select: { id: true, name: true, email: true } },
          },
          orderBy: { sequenceOrder: 'asc' },
        },
      },
    });

    if (!expense || expense.companyId !== companyId) {
      return sendError(res, 404, 'Expense not found.');
    }

    // Role-based access control check (Employees can only view their own)
    if (req.user.role === 'EMPLOYEE' && expense.userId !== req.user.id) {
       // Check if they are an approver for this expense
       const isApprover = expense.approvalLogs.some(log => log.approverId === req.user.id);
       if (!isApprover) {
         return sendError(res, 403, 'You do not have permission to view this expense.');
       }
    }

    return sendSuccess(res, 200, 'Expense fetched successfully', expense);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new expense (Defaults to DRAFT)
 * @route POST /api/expenses
 */
const createExpense = async (req, res, next) => {
  try {
    const { description, category, amount, currency, expenseDate, paidBy, remarks } = req.body;
    const userId = req.user.id;
    const companyId = req.user.companyId;

    // Get company base currency for conversion
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { baseCurrency: true },
    });

    // Convert amount to base currency
    let convertedAmount = amount;
    if (currency !== company.baseCurrency) {
      try {
        convertedAmount = await convertCurrency(amount, currency, company.baseCurrency);
      } catch (err) {
        return sendError(res, 400, 'Failed to convert currency. Check provided currency code.');
      }
    }

    const expense = await prisma.expense.create({
      data: {
        userId,
        companyId,
        description,
        category,
        amount,
        currency,
        convertedAmount,
        expenseDate: new Date(expenseDate),
        paidBy,
        remarks,
        status: 'DRAFT',
      },
    });

    return sendSuccess(res, 201, 'Expense created successfully as DRAFT.', expense);
  } catch (error) {
    next(error);
  }
};

/**
 * Update a DRAFT expense
 * @route PUT /api/expenses/:id
 */
const updateExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { description, category, amount, currency, expenseDate, paidBy, remarks } = req.body;
    const userId = req.user.id;

    const expense = await prisma.expense.findUnique({ where: { id } });

    if (!expense || expense.userId !== userId) {
      return sendError(res, 404, 'Expense not found or unauthorized.');
    }

    if (expense.status !== 'DRAFT' && expense.status !== 'REJECTED') {
      return sendError(res, 400, 'Only DRAFT or REJECTED expenses can be updated.');
    }

    const updateData = {
      description,
      category,
      amount,
      currency,
      expenseDate: expenseDate ? new Date(expenseDate) : undefined,
      paidBy,
      remarks,
    };

    // Recalculate converted amount if amount or currency changes
    if (amount !== undefined || currency !== undefined) {
      const company = await prisma.company.findUnique({
        where: { id: expense.companyId },
        select: { baseCurrency: true },
      });

      const newAmount = amount !== undefined ? amount : expense.amount;
      const newCurrency = currency !== undefined ? currency : expense.currency;

      if (newCurrency !== company.baseCurrency) {
        try {
          updateData.convertedAmount = await convertCurrency(newAmount, newCurrency, company.baseCurrency);
        } catch (err) {
          return sendError(res, 400, 'Failed to convert currency.');
        }
      } else {
        updateData.convertedAmount = newAmount;
      }
    }

    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: updateData,
    });

    return sendSuccess(res, 200, 'Expense updated successfully.', updatedExpense);
  } catch (error) {
    next(error);
  }
};

/**
 * Submit an expense (Transitions DRAFT -> SUBMITTED -> Workflow)
 * @route POST /api/expenses/:id/submit
 */
const submitExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const expense = await prisma.expense.findUnique({ where: { id } });

    if (!expense || expense.userId !== userId) {
      return sendError(res, 404, 'Expense not found or unauthorized.');
    }

    if (expense.status !== 'DRAFT' && expense.status !== 'REJECTED') {
      return sendError(res, 400, 'Expense is already submitted.');
    }

    // Update to SUBMITTED
    await prisma.expense.update({
      where: { id },
      data: { status: 'SUBMITTED' },
    });

    // Clear previous logs if resubmitting a rejected request
    await prisma.approvalLog.deleteMany({
      where: { expenseId: id }
    });

    // Trigger Approval Workflow 
    await triggerApprovalWorkflow(id);

    return sendSuccess(res, 200, 'Expense submitted and approval workflow triggered.');
  } catch (error) {
    next(error);
  }
};

/**
 * Upload attachments (e.g., receipts) to an expense
 * @route POST /api/expenses/:id/attachments
 */
const uploadAttachment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!req.file) {
      return sendError(res, 400, 'No file uploaded.');
    }

    const expense = await prisma.expense.findUnique({ where: { id } });

    if (!expense || expense.userId !== userId) {
      // Clean up uploaded file if unauthorized
      fs.unlinkSync(req.file.path);
      return sendError(res, 404, 'Expense not found or unauthorized.');
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    const attachment = await prisma.expenseAttachment.create({
      data: {
        expenseId: id,
        fileUrl,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
      },
    });

    return sendSuccess(res, 201, 'Attachment uploaded successfully.', attachment);
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    next(error);
  }
};

/**
 * Delete a draft expense
 * @route DELETE /api/expenses/:id
 */
const deleteExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const expense = await prisma.expense.findUnique({ 
      where: { id },
      include: { attachments: true }
    });

    if (!expense || expense.userId !== userId) {
      return sendError(res, 404, 'Expense not found or unauthorized.');
    }

    if (expense.status !== 'DRAFT' && expense.status !== 'REJECTED') {
      return sendError(res, 400, 'You can only delete DRAFT or REJECTED expenses.');
    }

    // Delete associated physical files
    expense.attachments.forEach(att => {
      const filename = path.basename(att.fileUrl);
      const filePath = path.join(__dirname, '..', '..', 'uploads', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    await prisma.expense.delete({ where: { id } });

    return sendSuccess(res, 200, 'Expense deleted successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyExpenses,
  getAllCompanyExpenses,
  getExpenseSummary,
  getExpenseById,
  createExpense,
  updateExpense,
  submitExpense,
  uploadAttachment,
  deleteExpense,
};
