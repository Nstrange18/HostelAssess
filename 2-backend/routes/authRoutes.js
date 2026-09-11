const router = require('express').Router();
const { register, login, me, updateProfile, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema, updateProfileSchema, changePasswordSchema } = require('../validators/authSchemas');

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/me', protect, me);
router.patch('/me', protect, validate(updateProfileSchema), updateProfile);
router.patch('/password', protect, validate(changePasswordSchema), changePassword);

module.exports = router;
