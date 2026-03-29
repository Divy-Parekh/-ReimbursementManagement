const express = require('express');
const router = express.Router();

const { 
  getMyExpenses, 
  getAllCompanyExpenses, 
  getExpenseSummary, 
  getExpenseById, 
  createExpense, 
  updateExpense, 
  submitExpense, 
  uploadAttachment, 
  deleteExpense 
} = require('../controllers/expenseController');

const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validate } = require('../validators/authValidators');
const { createExpenseSchema, updateExpenseSchema } = require('../validators/expenseValidators');
const { upload } = require('../middleware/uploadMiddleware');

router.use(authenticate);

// Employee routes
router.get('/my', getMyExpenses);
router.post('/', validate(createExpenseSchema), createExpense);
router.put('/:id', validate(updateExpenseSchema), updateExpense);
router.delete('/:id', deleteExpense);
router.post('/:id/submit', submitExpense);
router.post('/:id/attachments', upload, uploadAttachment);

// General route (with internal RBAC logic)
router.get('/:id', getExpenseById);

// Admin / elevated routes
router.get('/all', authorize('ADMIN', 'MANAGER'), getAllCompanyExpenses);
router.get('/summary/kpis', authorize('ADMIN', 'MANAGER'), getExpenseSummary);

module.exports = router;
