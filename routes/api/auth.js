const express = require("express");
const router = express.Router();
const auth = require('../../middleware/auth');

const User = require("../../models/User");

/**
 * @route   GET api/auth
 * @desc    Test auth
 * @access  Public
 */
router.get("/", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password').exec();
        res.json(user);
    } catch (error) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;