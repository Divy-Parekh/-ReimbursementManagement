const Joi = require('joi');

const signupSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required(),
  confirmPassword: Joi.valid(Joi.ref('password')).required().messages({
    'any.only': 'confirmPassword must match password',
  }),
  country: Joi.string().required(),
  baseCurrency: Joi.string().length(3).required().messages({
    'string.length': 'baseCurrency must be a valid 3-letter currency code',
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).max(128).required(),
  confirmNewPassword: Joi.valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'confirmNewPassword must match newPassword',
  }),
});

// Middleware factory to validate Joi schemas
const validate = (schema) => {
  return (req, res, next) => {
    // stripUnknown ensures any fields not defined in the schema (e.g. browser autofill injecting 'email') are safely discarded instead of failing validation.
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    
    if (error) {
      // Create a custom error format our central error handler understands
      const joiErr = new Error('Validation failed');
      joiErr.isJoi = true;
      joiErr.details = error.details;
      return next(joiErr);
    }
    
    req.body = value; // Replace req.body with the stripped version
    next();
  };
};

module.exports = {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  changePasswordSchema,
  validate
};
