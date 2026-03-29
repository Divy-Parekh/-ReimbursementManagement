const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');
const { generateToken } = require('../utils/tokenUtils');
const { generateRandomPassword } = require('../utils/passwordGenerator');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { sendForgotPasswordEmail } = require('../services/emailService');

/**
 * Handle Admin Signup
 * 1. Create company
 * 2. Create admin user
 */
const signup = async (req, res, next) => {
  try {
    const { name, email, password, country, baseCurrency } = req.body;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return sendError(res, 409, 'Email is already registered.');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Transaction to ensure both Company and User are created
    const result = await prisma.$transaction(async (prisma) => {
      // 1. Create Company
      const company = await prisma.company.create({
        data: {
          name: `${name}'s Company`, // Using name as default company name
          country,
          baseCurrency,
        },
      });

      // 2. Create Admin User
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'ADMIN',
          companyId: company.id,
        },
      });

      return { user, company };
    });

    // Generate token
    const token = generateToken(result.user);

    // Filter sensitive info
    const { password: _, ...userWithoutPassword } = result.user;

    return sendSuccess(res, 201, 'Signup successful', {
      token,
      user: {
        ...userWithoutPassword,
        baseCurrency: result.company.baseCurrency,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle Login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email including company to get base currency
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        company: {
          select: { baseCurrency: true },
        },
      },
    });

    if (!user) {
      return sendError(res, 404, 'User not found.');
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendError(res, 401, 'Invalid credentials.');
    }

    // Generate token
    const token = generateToken(user);

    // Prepare response data
    const { password: _, company, ...userWithoutPassword } = user;
    
    return sendSuccess(res, 200, 'Login successful', {
      token,
      user: {
        ...userWithoutPassword,
        baseCurrency: company.baseCurrency,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle Forgot Password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return sendError(res, 404, 'User not found.');
    }

    // Generate new random password
    const newPassword = generateRandomPassword(8);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Send email
    await sendForgotPasswordEmail(user.email, newPassword);

    return sendSuccess(res, 200, 'A new password has been sent to your email.');
  } catch (error) {
    next(error);
  }
};

/**
 * Handle Change Password (Authenticated)
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Get user with password
    const user = await prisma.user.findUnique({ where: { id: userId } });

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return sendError(res, 401, 'Current password is incorrect.');
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update DB
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return sendSuccess(res, 200, 'Password changed successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  login,
  forgotPassword,
  changePassword,
};
