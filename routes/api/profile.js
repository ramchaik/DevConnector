const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const { check, validationResult } = require("express-validator/check");

const Profile = require("../../models/Profile");
const User = require("../../models/User");

/**
 * @route   GET api/profile/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get("/me", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id })
      .populate("user", ["name", "avatar"])
      .lean()
      .exec();

    if (!profile) {
      return res.status(400).json({ msg: "There is no profile for this user" });
    }

    res.json(profile);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});

/**
 * @route   POST api/profile
 * @desc    Create or update a user profile
 * @access  Private
 */
router.post(
  "/",
  [
    auth,
    [
      check("status", "Status is required").not().isEmpty(),
      check("skills", "Skills is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      company,
      website,
      location,
      bio,
      status,
      githubusername,
      skills,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedin,
    } = req.body;

    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    if (skills) {
      profileFields.skills = skills.split(",").map((skill) => skill.trim());
    }

    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (facebook) profileFields.social.facebook = facebook;
    if (twitter) profileFields.social.twitter = twitter;
    if (instagram) profileFields.social.instagram = instagram;
    if (linkedin) profileFields.social.linkedin = linkedin;

    try {
      let profile = await Profile.findOne({ user: req.user.id }).lean().exec();

      if (profile) {
        // Update
        await Profile.findOneAndUpdate(
          {
            user: req.user.id,
          },
          {
            $set: profileFields,
          },
          { new: true }
        );

        return res.json(profile);
      }

      // Create
      profile = new Profile(profileFields);
      await profile.save();

      res.json(profile);
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Server Error");
    }
  }
);

/**
 * @route   GET api/profile
 * @desc    Get all profile
 * @access  Public
 */
router.get("/", async (req, res) => {
  try {
    const profiles = await Profile.find()
      .populate("user", ["name", "avatar"])
      .lean()
      .exec();

    res.json(profiles);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

/**
 * @route   GET api/profile/user/:user_id
 * @desc    Get profile by user ID
 * @access  Public
 */
router.get("/user/:user_id", async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.params.user_id })
      .populate("user", ["name", "avatar"])
      .lean()
      .exec();

    if (!profile) {
      return res.status(400).json({ msg: "Profile not found." });
    }

    res.json(profile);
  } catch (error) {
    console.error(error);
    if (error.kind == "ObjectId") {
      return res.status(400).json({ msg: "Profile not found." });
    }

    res.status(500).send("Server Error");
  }
});

/**
 * @route   DELETE api/profile
 * @desc    Delete profile, user & post
 * @access  Private
 */
router.delete("/", auth, async (req, res) => {
  try {
    // TODO: remove  - users, posts

    // Remove profile
    await Profile.findOneAndRemove({ user: req.user.id }).exec();

    // Remove user
    await User.findOneAndRemove({ _id: req.user.id }).exec();

    res.json({ msg: "User deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

/**
 * @route   PUT api/profile/experience
 * @desc    Add profile experience
 * @access  Private
 */
router.put(
  "/experience",
  [
    auth,
    [
      check("title", "Title is required").not().isEmpty(),
      check("company", "Company is required").not().isEmpty(),
      check("from", "from date is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    } = req.body;

    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id }).exec();
      if (!profile) {
        return res.status(400).json({ msg: "Profile not found" });
      }

      profile.experience.unshift(newExp);
      await profile.save();

      res.json(profile);
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Server Error");
    }
  }
);

/**
 * @route   DELETE api/profile/experience/:exp_id
 * @desc    Delete expirence from profile
 * @access  Private
 */
router.delete("/experience/:exp_id", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).exec();

    if (!profile) {
      return res.status(400).json({ msg: "Profile not found" });
    }

    const removeIndex = profile.experience
      .map((i) => i._id)
      .indexOf(req.params.exp_id);

    profile.experience.splice(removeIndex, 1);
    await profile.save();

    res.json(profile);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
