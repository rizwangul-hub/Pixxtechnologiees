const express = require('express');
const router = express.Router();
const {
  getCustomers,
  createCustomer,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  archiveCustomer,
  restoreCustomer,
} = require('../controllers/customerController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getCustomers).post(protect, createCustomer);
router.route('/:id/archive').put(protect, archiveCustomer);
router.route('/:id/restore').put(protect, restoreCustomer);
router.route('/:id').get(protect, getCustomerById).put(protect, updateCustomer).delete(protect, deleteCustomer);

module.exports = router;
