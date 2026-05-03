const express = require('express');
const {
  addPayment,
  getPayments,
  getPaymentSummary
} = require('../controllers/payments');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router
  .route('/')
  .get(getPayments)
  .post(addPayment);

router.get('/summary', authorize('admin', 'payment_manager'), getPaymentSummary);

module.exports = router;
