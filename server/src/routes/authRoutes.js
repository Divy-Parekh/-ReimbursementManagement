const express = require('express');
const router = express.Router();

// Controllers
const { signup, login, forgotPassword, changePassword } = require('../controllers/authController');

// Middleware
const { authenticate } = require('../middleware/authMiddleware');
const { 
  validate, 
  signupSchema, 
  loginSchema, 
  forgotPasswordSchema, 
  changePasswordSchema 
} = require('../validators/authValidators');

// --- Routes ---

// Public Routes
router.post('/signup', validate(signupSchema), signup);
router.post('/login', validate(loginSchema), login);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);

// Protected Routes
router.put('/change-password', authenticate, validate(changePasswordSchema), changePassword);

module.exports = router;
