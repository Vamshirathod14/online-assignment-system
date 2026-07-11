const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.post('/register', adminController.register);
router.post('/login', adminController.login);
router.get('/profile', protect, authorize('admin'), adminController.getProfile);

module.exports = router;
