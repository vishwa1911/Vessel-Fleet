const express = require('express');
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

const router = express.Router();

router.use(protect);

router.get('/', getSettings);
router.put('/', authorize('Admin'), updateSettings);

module.exports = router;
