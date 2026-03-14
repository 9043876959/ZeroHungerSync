const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendSMS } = require('../services/smsService');

// POST /api/users/register
router.post('/register', async (req, res) => {
  try {
    const { name, contact, role, foodType, quantity, goodTill, location } = req.body;

    if (!name || !contact || !role) {
      return res.status(400).json({ error: 'Name, contact, and role are required.' });
    }

    const user = new User({
      name,
      contact,
      role,
      foodType: role === 'donor' ? foodType : null,
      quantity: role === 'donor' ? quantity : null,
      goodTill: role === 'donor' && goodTill ? new Date(goodTill) : null,
      location: location || { lat: null, lng: null },
      foodStatus: role === 'donor' ? 'AVAILABLE' : null
    });

    await user.save();

    if (role === 'donor') {
      const ngos = await User.find({ role: 'ngo', isDeleted: false });

      // ── Save in-app notifications for every NGO ──
      const notifications = ngos.map(ngo => {
        const distance = calculateDistance(
          location?.lat, location?.lng,
          ngo.location?.lat, ngo.location?.lng
        );
        return {
          donorId:     user._id,
          ngoId:       ngo._id,
          foodId:      user._id,
          message:     `New food donation available from ${name}: ${quantity} kg of ${foodType}`,
          quantity,
          distance:    parseFloat(distance.toFixed(2)),
          status:      'PENDING',
          type:        'NGO_ALERT',
          recipientId: ngo._id
        };
      });

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }

      // ── Send SMS to every registered NGO ──
      if (ngos.length > 0) {
        const ngoNumbers = ngos.map(n => n.contact).filter(Boolean);
        const expiryStr  = goodTill
          ? new Date(goodTill).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
          : 'Not set';

        const smsText =
          `[ZeroHungerSync] Food Available!\n` +
          `Donor : ${name}\n` +
          `Food  : ${foodType || 'Food'}\n` +
          `Qty   : ${quantity || 0} kg\n` +
          `Expiry: ${expiryStr}\n` +
          `Open app > Notifications to Accept.`;

        sendSMS(ngoNumbers, smsText).catch(e => console.error('SMS error:', e));
        console.log(`📱 SMS sent to ${ngoNumbers.length} NGO(s):`, ngoNumbers);
      }
    }

    res.status(201).json({ message: 'User registered successfully', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// GET /api/users
router.get('/', async (req, res) => {
  try {
    const users = await User.find({ isDeleted: false }).sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// GET /api/users/ngos
router.get('/ngos', async (req, res) => {
  try {
    const ngos = await User.find({ role: 'ngo', isDeleted: false }).sort({ createdAt: -1 });
    res.json(ngos);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// GET /api/users/donors
router.get('/donors', async (req, res) => {
  try {
    const donors = await User.find({ role: 'donor', isDeleted: false }).sort({ createdAt: -1 });
    res.json(donors);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// DELETE /api/users/:id  (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await user.softDelete();
    res.json({ message: 'User profile deleted (record preserved for audit)' });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// ── Helpers ──
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function deg2rad(deg) { return deg * (Math.PI / 180); }

module.exports = router;