const { PrismaClient } = require('@prisma/client');
const { sendSuccess, sendError } = require('../utils/responseHelper');

const prisma = new PrismaClient();

/**
 * Get all approval rules for the company
 * @route GET /api/approval-rules
 */
const getAllRules = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;

    const rules = await prisma.approvalRule.findMany({
      where: { companyId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        approvers: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { sequenceOrder: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Need to manually fetch Manager details if managerId exists
    // (Prisma does not easily allow conditional relational includes where fields are dynamic strings)
    const formattedRules = await Promise.all(rules.map(async (rule) => {
      let manager = null;
      if (rule.managerId) {
         manager = await prisma.user.findUnique({
           where: { id: rule.managerId },
           select: { id: true, name: true, email: true }
         });
      }
      return { ...rule, manager };
    }));

    return sendSuccess(res, 200, 'Approval rules fetched successfully', formattedRules, formattedRules.length);
  } catch (error) {
    next(error);
  }
};

/**
 * Get single approval rule by ID
 * @route GET /api/approval-rules/:id
 */
const getRuleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const rule = await prisma.approvalRule.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        approvers: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { sequenceOrder: 'asc' },
        },
      },
    });

    if (!rule || rule.companyId !== companyId) {
      return sendError(res, 404, 'Approval rule not found.');
    }

    let manager = null;
    if (rule.managerId) {
       manager = await prisma.user.findUnique({
         where: { id: rule.managerId },
         select: { id: true, name: true, email: true }
       });
    }

    return sendSuccess(res, 200, 'Approval rule fetched successfully', { ...rule, manager });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new approval rule
 * @route POST /api/approval-rules
 */
const createRule = async (req, res, next) => {
  try {
    const {
      userId,
      description,
      managerId,
      isManagerApprover,
      isSequential,
      minApprovalPercentage,
      approvers
    } = req.body;
    
    const companyId = req.user.companyId;

    // Verify user belongs to same company
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser || targetUser.companyId !== companyId) {
      return sendError(res, 400, 'Invalid user ID.');
    }

    // Verify manager if provided
    if (managerId) {
      const manager = await prisma.user.findUnique({ where: { id: managerId } });
      if (!manager || manager.companyId !== companyId) {
        return sendError(res, 400, 'Invalid manager ID.');
      }
    }

    // Verify all approvers belong to same company and sequence is unique
    const approverIds = approvers.map(a => a.userId);
    const validApprovers = await prisma.user.findMany({
      where: { id: { in: approverIds }, companyId }
    });

    if (validApprovers.length !== approverIds.length) {
      return sendError(res, 400, 'One or more invalid approver IDs.');
    }

    const sequenceOrders = approvers.map(a => a.sequenceOrder);
    if (new Set(sequenceOrders).size !== sequenceOrders.length) {
      return sendError(res, 400, 'Sequence orders for approvers must be unique.');
    }

    // Create Rule + Approvers inside a transaction
    const newRule = await prisma.$transaction(async (prisma) => {
      const rule = await prisma.approvalRule.create({
        data: {
          companyId,
          userId,
          description,
          managerId: managerId || null,
          isManagerApprover: isManagerApprover || false,
          isSequential: isSequential || false,
          minApprovalPercentage,
          approvers: {
            create: approvers.map(a => ({
              userId: a.userId,
              sequenceOrder: a.sequenceOrder,
              isRequired: a.isRequired || false
            }))
          }
        },
        include: {
          approvers: true
        }
      });
      return rule;
    });

    return sendSuccess(res, 201, 'Approval rule created successfully', newRule);
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing approval rule
 * @route PUT /api/approval-rules/:id
 */
const updateRule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      userId,
      description,
      managerId,
      isManagerApprover,
      isSequential,
      minApprovalPercentage,
      approvers
    } = req.body;
    const companyId = req.user.companyId;

    // Verify rule exists
    const existingRule = await prisma.approvalRule.findUnique({ where: { id } });
    if (!existingRule || existingRule.companyId !== companyId) {
      return sendError(res, 404, 'Approval rule not found.');
    }

    // Update inside a transaction to safely recreate approvers
    const updatedRule = await prisma.$transaction(async (prisma) => {
      // 1. Delete existing approvers if we are updating them
      if (approvers) {
        // Validate new approvers
        const approverIds = approvers.map(a => a.userId);
        const validApprovers = await prisma.user.findMany({
          where: { id: { in: approverIds }, companyId }
        });

        if (validApprovers.length !== approverIds.length) {
          throw new Error('One or more invalid approver IDs.');
        }

        const sequenceOrders = approvers.map(a => a.sequenceOrder);
        if (new Set(sequenceOrders).size !== sequenceOrders.length) {
          throw new Error('Sequence orders for approvers must be unique.');
        }

        await prisma.approvalRuleApprover.deleteMany({
          where: { approvalRuleId: id }
        });
      }

      // 2. Update rule
      const updateData = {};
      if (userId) updateData.userId = userId;
      if (description) updateData.description = description;
      if (managerId !== undefined) updateData.managerId = managerId || null;
      if (isManagerApprover !== undefined) updateData.isManagerApprover = isManagerApprover;
      if (isSequential !== undefined) updateData.isSequential = isSequential;
      if (minApprovalPercentage !== undefined) updateData.minApprovalPercentage = minApprovalPercentage;
      
      if (approvers) {
        updateData.approvers = {
          create: approvers.map(a => ({
            userId: a.userId,
            sequenceOrder: a.sequenceOrder,
            isRequired: a.isRequired || false
          }))
        };
      }

      return await prisma.approvalRule.update({
        where: { id },
        data: updateData,
        include: { approvers: true }
      });
    });

    return sendSuccess(res, 200, 'Approval rule updated successfully', updatedRule);
  } catch (error) {
    if (error.message.includes('invalid approver IDs') || error.message.includes('unique')) {
      return sendError(res, 400, error.message);
    }
    next(error);
  }
};

/**
 * Delete an approval rule
 * @route DELETE /api/approval-rules/:id
 */
const deleteRule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const ruleToDelete = await prisma.approvalRule.findUnique({ where: { id } });
    if (!ruleToDelete || ruleToDelete.companyId !== companyId) {
      return sendError(res, 404, 'Approval rule not found.');
    }

    // Approvers will be cascade-deleted because of DB constraint
    await prisma.approvalRule.delete({ where: { id } });

    return sendSuccess(res, 200, 'Approval rule deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllRules,
  getRuleById,
  createRule,
  updateRule,
  deleteRule,
};
