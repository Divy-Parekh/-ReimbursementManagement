const express = require('express');
const router = express.Router();

const { 
  getAllUsers, 
  createUser, 
  updateUser, 
  deleteUser, 
  sendPassword 
} = require('../controllers/userController');

const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validate } = require('../validators/authValidators'); // Reuse validator wrapper
const { createUserSchema, updateUserSchema } = require('../validators/userValidators');

// All user management routes require ADMIN role
router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/', getAllUsers);
router.post('/', validate(createUserSchema), createUser);
router.put('/:id', validate(updateUserSchema), updateUser);
router.delete('/:id', deleteUser);
router.post('/:id/send-password', sendPassword);

module.exports = router;
