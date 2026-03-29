const Joi = require('joi');

const approverSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  sequenceOrder: Joi.number().integer().min(1).required(),
  isRequired: Joi.boolean().default(false),
});

const createApprovalRuleSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  description: Joi.string().min(5).required(),
  managerId: Joi.string().uuid().allow(null, '').optional(),
  isManagerApprover: Joi.boolean().default(false),
  isSequential: Joi.boolean().default(false),
  minApprovalPercentage: Joi.number().min(0).max(100).required(),
  approvers: Joi.array().items(approverSchema).min(1).required(),
});

const updateApprovalRuleSchema = Joi.object({
  userId: Joi.string().uuid().optional(),
  description: Joi.string().min(5).optional(),
  managerId: Joi.string().uuid().allow(null, '').optional(),
  isManagerApprover: Joi.boolean().optional(),
  isSequential: Joi.boolean().optional(),
  minApprovalPercentage: Joi.number().min(0).max(100).optional(),
  approvers: Joi.array().items(approverSchema).min(1).optional(),
});

module.exports = {
  createApprovalRuleSchema,
  updateApprovalRuleSchema,
};
