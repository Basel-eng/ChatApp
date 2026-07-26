import express from 'express';
import Users from '../models/Users.js';
import { protectRoute } from '../middleware/auth.middleware.js';
import Messages from '../models/Messages.js';
import { getReceiverSocketId, io } from '../lib/socket.js';
import mongoose from 'mongoose';
import cloudinary from '../lib/cloudinary.js';

const router = express.Router();
router.use(protectRoute);
router.get('/contacts', async (req, res) => {
  try {
    const LoggedIn = req.user._id;
    const filteruser = await Users.find({ _id: { $ne: LoggedIn } }).select(
      '-password'
    );
    res.status(200).json(filteruser);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/chats', async (req, res) => {
  try {
    const LoggedIn = new mongoose.Types.ObjectId(req.user._id);

    const messages = await Messages.find({
      $or: [{ senderId: LoggedIn }, { receiverId: LoggedIn }],
    });

    const chatpartnerIds = [
      ...new Set(
        messages.map(msg =>
          msg.senderId.toString() === LoggedIn.toString()
            ? msg.receiverId.toString()
            : msg.senderId.toString()
        )
      ),
    ];

    const chatpartners = await Users.find({
      _id: { $in: chatpartnerIds },
    }).select('-password');

    res.status(200).json(chatpartners);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const myId = req.user._id;
    const { id: userToChatId } = req.params;
    const message = await Messages.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json(message);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/send/:id', async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;

    const senderId = req.user._id;
    if (!text && !image)
      return res.status(400).json({ message: "Message can't be empty" });
    if (senderId.equals(receiverId))
      return res
        .status(400)
        .json({ message: "You can't send message to yourself" });

    const recervisExist = await Users.exists({ _id: receiverId });
    if (!recervisExist)
      return res.status(404).json({ message: 'Receiver not found' });

    let imageUrl;
    if (image) {
      const uploadedImage = await cloudinary.uploader.upload(image);
      imageUrl = uploadedImage.secure_url;
    }
    const newMessage = new Messages({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });
    await newMessage.save();
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('newMessage', newMessage);
    }
    res.status(201).json(newMessage);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
