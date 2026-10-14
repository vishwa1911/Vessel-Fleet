const express = require('express');
const { body } = require('express-validator');
const {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect, authorize('Admin'));

router.get('/', getUsers);

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['Admin', 'Fleet Operator', 'Marine Engineer', 'Cargo Manager']).withMessage('Valid role required'),
  ],
  validate,
  createUser
);

router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;
