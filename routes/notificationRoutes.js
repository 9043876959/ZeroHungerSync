const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendSMS } = require('../services/smsService');

// ── GET /api/notifications/by-phone/:phone ──
// Lookup user by phone number and return their notifications
router.get('/by-phone/:phone', async (req, res) => {
  try {
    const phone = String(req.params.phone).replace(/\D/g, '').slice(-10);
    console.log('🔍 Looking up notifications for phone:', phone);

    // Find user by matching last 10 digits of contact
    const users = await User.find({ isDeleted: false });
    const user = users.find(u =>
      String(u.contact).replace(/\D/g, '').slice(-10) === phone
    );

    if (!user) {
      return res.status(404).json({ error: 'No user found with this phone number' });
    }

    console.log(`✅ Found user: ${user.name} (${user.role})`);

    let notifications = [];

    if (user.role === 'ngo') {
      notifications = await Notification.find({
        recipientId: user._id,
        type: 'NGO_ALERT'
      })
        .populate('donorId', 'name contact foodType quantity goodTill location foodStatus')
        .populate('ngoId', 'name contact')
        .sort({ createdAt: -1 });
    } else {
      notifications = await Notification.find({
        recipientId: user._id,
        type: 'DONOR_CONFIRM'
      })
        .populate('ngoId', 'name contact location')
        .sort({ createdAt: -1 });
    }

    console.log(`📬 Found ${notifications.length} notifications for ${user.name}`);

    res.json({ user, notifications });
  } catch (err) {
    console.error('by-phone error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// ── GET /api/notifications/ngo/:ngoId ──
router.get('/ngo/:ngoId', async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipientId: req.params.ngoId,
      type: 'NGO_ALERT'
    })
      .populate('donorId', 'name contact foodType quantity goodTill location foodStatus')
      .populate('ngoId', 'name contact')
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// ── GET /api/notifications/donor/:donorId ──
router.get('/donor/:donorId', async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipientId: req.params.donorId,
      type: 'DONOR_CONFIRM'
    })
      .populate('ngoId', 'name contact location')
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// ── POST /api/notifications/accept ── NGO accepts food
router.post('/accept', async (req, res) => {
  try {
    const { ngoId, foodId, notificationId } = req.body;
    console.log('Accept request:', { ngoId, foodId, notificationId });

    const donor = await User.findById(foodId);
    if (!donor) return res.status(404).json({ error: 'Food/donor not found' });

    if (donor.foodStatus === 'LOCKED') {
      return res.status(409).json({ error: 'Food has already been accepted by another NGO' });
    }

    const ngo = await User.findById(ngoId);
    if (!ngo) return res.status(404).json({ error: 'NGO not found' });

    // Lock food
    donor.foodStatus = 'LOCKED';
    donor.lockedBy   = ngoId;
    await donor.save();

    // Update accepted notification
    await Notification.findByIdAndUpdate(notificationId, { status: 'ACCEPTED' });

    // Expire all other pending alerts for this food
    await Notification.updateMany(
      { foodId, type: 'NGO_ALERT', status: 'PENDING', _id: { $ne: notificationId } },
      { status: 'EXPIRED' }
    );

    // Save in-app confirmation for donor
    const donorNotification = new Notification({
      donorId:     donor._id,
      ngoId:       ngo._id,
      foodId:      donor._id,
      message:     `Your food donation has been accepted by ${ngo.name}! They will pick it up shortly. You can contact them at ${ngo.contact}. Thank you for your generosity!`,
      quantity:    donor.quantity,
      distance:    null,
      status:      'ACCEPTED',
      type:        'DONOR_CONFIRM',
      recipientId: donor._id
    });
    await donorNotification.save();
    console.log('✅ Donor in-app notification saved');

    // SMS to Donor
    if (donor.contact) {
      const donorSMS =
        `[ZeroHungerSync] Great news, ${donor.name}!\n` +
        `Your food (${donor.quantity || 0}kg of ${donor.foodType || 'Food'}) ` +
        `has been accepted by ${ngo.name}.\n` +
        `NGO Contact: ${ngo.contact}\n` +
        `They will pick up shortly. Thank you!`;
      sendSMS(donor.contact, donorSMS)
        .then(r => console.log('📱 Donor SMS result:', r))
        .catch(e => console.error('Donor SMS error:', e));
    }

    // SMS to NGO
    if (ngo.contact) {
      const ngoSMS =
        `[ZeroHungerSync] You accepted food!\n` +
        `Donor: ${donor.name} | Contact: ${donor.contact}\n` +
        `Food: ${donor.foodType || 'Food'} - ${donor.quantity || 0}kg\n` +
        `Please arrange pickup ASAP!`;
      sendSMS(ngo.contact, ngoSMS)
        .then(r => console.log('📱 NGO SMS result:', r))
        .catch(e => console.error('NGO SMS error:', e));
    }

    res.json({
      message: 'Food accepted successfully',
      ngo:   { name: ngo.name,   contact: ngo.contact },
      donor: { name: donor.name, contact: donor.contact }
    });
  } catch (err) {
    console.error('Accept error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// ── GET /api/notifications/debug ── see all notifications
router.get('/debug', async (req, res) => {
  try {
    const all = await Notification.find()
      .populate('donorId', 'name contact')
      .populate('ngoId',   'name contact')
      .populate('recipientId', 'name role contact')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ count: all.length, notifications: all });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/notifications/all ──
router.get('/all', async (req, res) => {
  try {
    const notifications = await Notification.find()
      .populate('donorId', 'name')
      .populate('ngoId',   'name')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

module.exports = router;