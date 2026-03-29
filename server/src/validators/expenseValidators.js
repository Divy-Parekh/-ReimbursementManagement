const Joi = require('joi');

const VALID_CATEGORIES = ['Food', 'Travel', 'Office Supplies', 'Accommodation', 'Transportation', 'Entertainment', 'Miscellaneous'];

const createExpenseSchema = Joi.object({
  description: Joi.string().min(3).max(255).required(),
  category: Joi.string().valid(...VALID_CATEGORIES).required(),
  amount: Joi.number().positive().required(),
  currency: Joi.string().length(3).required(),
  expenseDate: Joi.date().iso().required(),
  paidBy: Joi.string().required(),
  remarks: Joi.string().allow('', null).optional(),
});

const updateExpenseSchema = Joi.object({
  description: Joi.string().min(3).max(255).optional(),
  category: Joi.string().valid(...VALID_CATEGORIES).optional(),
  amount: Joi.number().positive().optional(),
  currency: Joi.string().length(3).optional(),
  expenseDate: Joi.date().iso().optional(),
  paidBy: Joi.string().optional(),
  remarks: Joi.string().allow('', null).optional(),
});

module.exports = {
  createExpenseSchema,
  updateExpenseSchema,
};
