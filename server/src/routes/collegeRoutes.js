const express = require('express');
const router = express.Router();
const collegeController = require('../controllers/collegeController');
const { protect, authorize } = require('../middleware/auth');

router.get('/active', collegeController.getActiveColleges);
router.post('/', protect, authorize('admin'), collegeController.createCollege);
router.get('/', protect, authorize('admin'), collegeController.getAllColleges);
router.put('/:id/toggle-status', protect, authorize('admin'), collegeController.toggleStatus);
router.put('/:id', protect, authorize('admin'), collegeController.updateCollege);
router.delete('/:id', protect, authorize('admin'), collegeController.deleteCollege);

module.exports = router;
