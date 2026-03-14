const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const userRoutes         = require('./routes/userRoutes');
const foodRoutes         = require('./routes/foodRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('../frontend'));

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/zerohungersync';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    startCleanupJob(); // start auto-cleanup after DB connects
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ── Auto-cleanup job ──
// Runs every 5 minutes
// Deletes notifications that were ACCEPTED or EXPIRED more than 1 hour ago
function startCleanupJob() {
  const Notification = require('./models/Notification');

  async function cleanup() {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago

      const result = await Notification.deleteMany({
        status: { $in: ['ACCEPTED', 'EXPIRED'] },
        createdAt: { $lt: oneHourAgo }
      });

      if (result.deletedCount > 0) {
        console.log(`🧹 Auto-cleanup: removed ${result.deletedCount} old notification(s)`);
      }
    } catch (err) {
      console.error('❌ Cleanup error:', err.message);
    }
  }

  // Run immediately on startup
  cleanup();

  // Then run every 5 minutes
  setInterval(cleanup, 5 * 60 * 1000);

  console.log('⏰ Auto-cleanup job started (runs every 5 min, removes notifications older than 1hr)');
}

// Routes
app.use('/api/users',         userRoutes);
app.use('/api/food',          foodRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status:    'OK',
    message:   'ZeroHungerSync API is running',
    timestamp: new Date()
  });
});

// Root
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to ZeroHungerSync API' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 ZeroHungerSync server running on port ${PORT}`);
});