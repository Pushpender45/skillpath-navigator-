const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// 1. Get Current User Data
// Used to populate the settings page initially
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
});

// 2. Update Profile (Name, Bio, and Image)
// Note: upload.single('profilePicture') matches the field name in FormData
router.put('/profile', auth, upload.single('profilePicture'), async (req, res) => {
    try {
        const { name, bio } = req.body;
        const updateData = {};

        if (name) updateData.name = name;
        if (bio !== undefined) updateData.bio = bio;

        // If a file was uploaded, save the path in DB
        if (req.file) {
            updateData.profilePicture = `/uploads/profiles/${req.file.filename}`;
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updateData },
            { new: true }
        ).select('-password');

        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error updating profile" });
    }
});

// 3. Change Password
// Includes security check: must know the "old" password
router.put('/change-password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user.id);

        // Check if old password is correct
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Current password is incorrect" });
        }

        // Hash the new password before saving
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        await user.save();
        res.json({ message: "Password updated successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error updating password" });
    }
});

module.exports = router;
