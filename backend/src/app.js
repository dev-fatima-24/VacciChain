require('dotenv').config();
const config = require('./config');
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const vaccinationRoutes = require('./routes/vaccination');
const verifyRoutes = require('./routes/verify');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/vaccination', vaccinationRoutes);
app.use('/verify', verifyRoutes);
app.use('/admin', adminRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

if (require.main === module) {
  initDb(config.DATABASE_PATH).then(() => {
    startPoller(config.EVENT_POLL_INTERVAL_MS);
    app.listen(config.PORT, () => console.log(`Backend running on port ${config.PORT}`));
  });
}

module.exports = app;
