const express = require('express');
const {
  getAlerts,
  getUnreadAlertsCount,
  evaluateAlertsManual,
  acknowledgeAlert,
  resolveAlert,
} = require('../controllers/alertController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getAlerts);
router.get('/unread-count', getUnreadAlertsCount);
router.post('/evaluate', evaluateAlertsManual);
router.put('/:id/acknowledge', acknowledgeAlert);
router.put('/:id/resolve', resolveAlert);

module.exports = router;
