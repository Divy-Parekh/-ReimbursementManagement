const express = require('express');
const router = express.Router();

const { 
  getAllRules, 
  getRuleById, 
  createRule, 
  updateRule, 
  deleteRule 
} = require('../controllers/approvalRuleController');

const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validate } = require('../validators/authValidators');
const { createApprovalRuleSchema, updateApprovalRuleSchema } = require('../validators/approvalRuleValidators');

// All endpoints require ADMIN role
router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/', getAllRules);
router.get('/:id', getRuleById);
router.post('/', validate(createApprovalRuleSchema), createRule);
router.put('/:id', validate(updateApprovalRuleSchema), updateRule);
router.delete('/:id', deleteRule);

module.exports = router;
