const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

router.get('/dashboard', protect, authorize('admin'), analyticsController.getDashboardStats);

module.exports = router;
