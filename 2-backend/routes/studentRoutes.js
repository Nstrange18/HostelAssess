const router = require('express').Router();
const { getStudents, updateStudentHostel } = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');

router.use(protect, requireAdmin);
router.get('/', getStudents);
router.patch('/:id/hostel', updateStudentHostel);

module.exports = router;
