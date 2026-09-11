const router = require('express').Router();
const { getStudentDashboard, getAdminDashboard } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');

router.get('/student', protect, getStudentDashboard);
router.get('/admin', protect, requireAdmin, getAdminDashboard);

module.exports = router;
