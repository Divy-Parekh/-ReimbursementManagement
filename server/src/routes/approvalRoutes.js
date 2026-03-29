const express = require('express');
const router = express.Router();

const { 
  getPendingApprovals, 
  approveExpense, 
  rejectExpense, 
  getExpenseLogs 
} = require('../controllers/approvalController');

const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

// Approver/Manager routes
router.get('/pending', getPendingApprovals);
router.post('/:expenseId/approve', approveExpense);
router.post('/:expenseId/reject', rejectExpense);

// Audit logs (accessible by owner, approver, or admin)
router.get('/:expenseId/logs', getExpenseLogs);

module.exports = router;
