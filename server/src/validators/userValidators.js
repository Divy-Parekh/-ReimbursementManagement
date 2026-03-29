const Joi = require('joi');

const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  role: Joi.string().valid('MANAGER', 'EMPLOYEE').required(),
  managerId: Joi.string().uuid().allow(null, '').optional(),
});

const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  role: Joi.string().valid('MANAGER', 'EMPLOYEE').optional(),
  managerId: Joi.string().uuid().allow(null, '').optional(),
});

module.exports = {
  createUserSchema,
  updateUserSchema,
};
