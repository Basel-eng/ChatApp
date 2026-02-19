import express from "express";
import bcrypt from "bcryptjs";
import Users from "../models/Users.js";
import { generateToken } from "../lib/utils.js";
import cloudinary from "../lib/cloudinary.js";
import { protectRoute } from "../middleware/auth.middleware.js";
const router = express.Router();


router.post("/signup", async (req, res) => {
  try {
    const { fullName, email, password, profilePic } = req.body;
    if (!fullName || !email || !password) {
      res.status(400).json({ message: "All fields is required" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "password length is 8 caracters" });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const salt = await bcrypt.genSalt(10);
    const newpass = await bcrypt.hash(password, salt);

    const user = new Users({
      fullName,
      email,
      password: newpass,
      profilePic,
    });
    if (user) {
      generateToken(user._id, res);
      await user.save();
      res.status(201).json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        profilePic: user.profilePic,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: "Invalid email or password" });
    }

    const user = await Users.findOne({ email });
    if (!user) {
      res.status(404).json({ message: "user not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    generateToken(user._id, res);
    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/logout", (req, res) => {
  res.cookie("jwt", "", { maxAge: 0 });
  res.status(200).json({ message: "Logged out successfully" });
});

router.put("/update-profile", protectRoute, async (req, res) => {
  try {
    const { profilePic } = req.body;
    if (!profilePic) {
      res.status(400).json({ message: "Please provide a profile picture" });
    }
    const user = req.user._id;
    const uploaders = await cloudinary.uploader.upload(profilePic);

    const updateuser = await Users.findByIdAndUpdate(
      user._id,
      { profilePic: uploaders.secure_url },
      { new: true },
    );
    res.status(200).json(updateuser);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/check", (req, res) => {
  res.status(200).json(req.body);
});

export default router;
