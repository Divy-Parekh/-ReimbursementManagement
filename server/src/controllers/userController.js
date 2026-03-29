const prisma = require('../utils/prisma');
const bcrypt = require('bcryptjs');
const { generateRandomPassword } = require('../utils/passwordGenerator');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { sendPasswordEmail } = require('../services/emailService');

/**
 * Get all users in the admin's company
 * @route GET /api/users
 */
const getAllUsers = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const { role, search } = req.query;

    const whereClause = {
      companyId,
    };

    if (role) {
      whereClause.role = role;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        managerId: true,
        manager: {
          select: { id: true, name: true }
        },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, 200, 'Users fetched successfully', users, users.length);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new user
 * @route POST /api/users
 */
const createUser = async (req, res, next) => {
  try {
    const { name, email, role, managerId } = req.body;
    const companyId = req.user.companyId;

    // Validate email uniqueness
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return sendError(res, 409, 'Email is already registered.');
    }

    // Enforce single CFO policy
    if (role === 'CFO') {
      const existingCFO = await prisma.user.findFirst({
        where: { companyId, role: 'CFO' }
      });
      if (existingCFO) {
        return sendError(res, 400, `A CFO already exists: ${existingCFO.name}. Only one CFO is allowed per company. Demote them first.`);
      }
    }

    // Generate random password and hash it
    const randomPassword = generateRandomPassword();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(randomPassword, salt);

    // If managerId provided, ensure manager belongs to same company
    if (managerId) {
      const manager = await prisma.user.findUnique({ where: { id: managerId } });
      if (!manager || manager.companyId !== companyId) {
        return sendError(res, 400, 'Invalid manager selected.');
      }
    }

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        managerId: managerId || null,
        companyId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        managerId: true,
        companyId: true,
        createdAt: true,
      }
    });

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    
    // Auto-send credentials to the newly created user
    try {
      await sendPasswordEmail(email, name, randomPassword, company?.name || 'Your Company');
    } catch (emailError) {
      console.error('Failed to send onboarding email:', emailError);
      // We don't fail the request if the email fails, but we might log it.
    }

    return sendSuccess(res, 201, 'User created and credentials emailed successfully', newUser);
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing user
 * @route PUT /api/users/:id
 */
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, role, managerId } = req.body;
    const companyId = req.user.companyId;

    // Verify user exists and belongs to same company
    const userToUpdate = await prisma.user.findUnique({ where: { id } });
    if (!userToUpdate || userToUpdate.companyId !== companyId) {
      return sendError(res, 404, 'User not found.');
    }

    if (userToUpdate.role === 'ADMIN' && role !== 'ADMIN') {
      return sendError(res, 400, 'Cannot change an ADMIN role.');
    }

    // Enforce single CFO policy
    if (role === 'CFO' && userToUpdate.role !== 'CFO') {
      const existingCFO = await prisma.user.findFirst({
        where: { companyId, role: 'CFO' }
      });
      if (existingCFO) {
        return sendError(res, 400, `A CFO already exists: ${existingCFO.name}. Only one CFO is allowed per company. Demote them first.`);
      }
    }

    // If managerId provided, ensure validity
    if (managerId && managerId !== userToUpdate.managerId) {
      if (managerId === id) {
        return sendError(res, 400, 'A user cannot be their own manager.');
      }
      const manager = await prisma.user.findUnique({ where: { id: managerId } });
      if (!manager || manager.companyId !== companyId) {
        return sendError(res, 400, 'Invalid manager selected.');
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name: name || undefined,
        role: role || undefined,
        managerId: managerId !== undefined ? (managerId || null) : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        managerId: true,
        manager: {
          select: { id: true, name: true }
        }
      }
    });

    return sendSuccess(res, 200, 'User updated successfully', updatedUser);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a user
 * @route DELETE /api/users/:id
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    if (id === req.user.id) {
      return sendError(res, 400, 'Cannot delete your own account.');
    }

    const userToDelete = await prisma.user.findUnique({ where: { id } });
    if (!userToDelete || userToDelete.companyId !== companyId) {
      return sendError(res, 404, 'User not found.');
    }

    if (userToDelete.role === 'ADMIN') {
      return sendError(res, 400, 'Cannot delete an ADMIN user.');
    }

    // Delete user
    // Note: Due to foreign key constraints, we might want to soft-delete
    // or ensure dependencies (expenses, approval rules) are handled.
    // Assuming hard delete via Prisma relation cascade rules.
    await prisma.user.delete({ where: { id } });

    return sendSuccess(res, 200, 'User deleted successfully');
  } catch (error) {
    // Basic catch for foreign key constraint errors
    if (error.code === 'P2003') {
      return sendError(res, 400, 'Cannot delete user because they have associated expenses or approval logs.');
    }
    next(error);
  }
};

/**
 * Generate a new random password and send via email
 * @route POST /api/users/:id/send-password
 */
const sendPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const user = await prisma.user.findUnique({ 
      where: { id },
      include: { company: true }
    });

    if (!user || user.companyId !== companyId) {
      return sendError(res, 404, 'User not found.');
    }

    const randomPassword = generateRandomPassword();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(randomPassword, salt);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    await sendPasswordEmail(user.email, user.name, randomPassword, user.company.name);

    return sendSuccess(res, 200, `Password sent to ${user.email}`);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  sendPassword,
};
