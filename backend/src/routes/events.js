const express = require('express');
const { queryEvents } = require('../indexer/db');

const router = express.Router();

/**
 * GET /events
 * Query params: event_type, limit (max 500), offset
 */
router.get('/', (req, res) => {
  const { event_type } = req.query;
  const limit = Math.min(parseInt(req.query.limit) || 100, 500);
  const offset = parseInt(req.query.offset) || 0;

  const events = queryEvents({ event_type, limit, offset });
  res.json({ events, count: events.length });
});

module.exports = router;
