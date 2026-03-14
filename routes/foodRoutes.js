const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Notification = require('../models/Notification');

// POST /api/food - create food donation (standalone)
router.post('/', async (req, res) => {
  try {
    const { donorId, foodType, quantity, goodTill, location } = req.body;
    const donor = await User.findById(donorId);
    if (!donor || donor.role !== 'donor') {
      return res.status(404).json({ error: 'Donor not found' });
    }
    donor.foodType = foodType;
    donor.quantity = quantity;
    donor.goodTill = goodTill ? new Date(goodTill) : null;
    donor.location = location || donor.location;
    donor.foodStatus = 'AVAILABLE';
    donor.lockedBy = null;
    await donor.save();
    res.json({ message: 'Food donation created', donor });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// PATCH /api/food/:id/status - update food status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, ngoId } = req.body;
    const food = await User.findById(req.params.id);
    if (!food) return res.status(404).json({ error: 'Food/donor not found' });

    if (food.foodStatus === 'LOCKED' && status === 'LOCKED') {
      return res.status(409).json({ error: 'Food is already locked by another NGO' });
    }

    food.foodStatus = status;
    if (status === 'LOCKED' && ngoId) {
      food.lockedBy = ngoId;
    }
    if (status === 'AVAILABLE') {
      food.lockedBy = null;
    }
    await food.save();
    res.json({ message: 'Food status updated', food });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// GET /api/food/available - list available food
router.get('/available', async (req, res) => {
  try {
    const food = await User.find({ role: 'donor', foodStatus: 'AVAILABLE', isDeleted: false });
    res.json(food);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

module.exports = router;
