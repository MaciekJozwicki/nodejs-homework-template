const bcrypt = require("bcryptjs");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const gravatar = require("gravatar");
const Jimp = require("jimp");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs/promises");
const path = require("path");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const uploadDir = path.join(__dirname, "../public/avatars");

const schema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const signup = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { error } = schema.validate({ email, password });
    if (error) {
      return res
        .status(400)
        .json({ message: "Validation error", details: error.details });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(409).json({ message: "Email in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const avatarURL = gravatar.url(email, { s: "250", d: "retro" });

    const newUser = new User({
      email,
      password: hashedPassword,
      avatarURL,
    });

    const verificationToken = uuidv4();
    newUser.verificationToken = verificationToken;

    await newUser.save();

    const verificationLink = `${req.protocol}://${req.get(
      "host"
    )}/users/verify/${verificationToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Potwierdzenie rejestracji",
      text: `Kliknij ten link, aby zweryfikować swój adres email: ${verificationLink}`,
      html: `<p>Kliknij <a href="${verificationLink}">ten link</a>, aby zweryfikować swój adres email.</p>`,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({
      user: {
        email: newUser.email,
        subscription: newUser.subscription,
        avatarURL: newUser.avatarURL,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { error } = loginSchema.validate({ email, password });
    if (error) {
      return res.status(400).json(error.details);
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Email or password is wrong" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Email or password is wrong" });
    }

    const token = jwt.sign({ id: user._id }, "your_jwt_secret", {
      expiresIn: "1h",
    });
    user.token = token;
    await user.save();

    res.status(200).json({
      token,
      user: {
        email: user.email,
        subscription: user.subscription,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const logout = async (req, res) => {
  try {
    req.user.token = null;
    await req.user.save();
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    res.status(200).json({
      email: req.user.email,
      subscription: req.user.subscription,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const image = await Jimp.read(req.file.path);
    await image.cover(250, 250).writeAsync(req.file.path);

    const filename = `${req.user._id}${path.extname(req.file.originalname)}`;
    await fs.rename(req.file.path, path.join(uploadDir, filename));

    req.user.avatarURL = `/avatars/${filename}`;
    await req.user.save();

    res.status(200).json({ avatarURL: req.user.avatarURL });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const verifyUser = async (req, res) => {
    const { verificationToken } = req.params;

    try {
      const user = await User.findOne({ verificationToken });
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      if (user.verify) {
        return res.status(400).json({ message: "Verification has already been passed" });
      }
  
      user.verify = true;
      await user.save();
  
      return res.status(200).json({ message: "Verification successful" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Server error" });
    }
  };
  

const resendVerificationEmail = async (req, res) => {
  const { email } = req.body;

  const schema = Joi.object({
    email: Joi.string().email().required(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json({ message: "Validation error", details: error.details });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.verify) {
      return res
        .status(400)
        .json({ message: "Verification has already been passed" });
    }

    const verificationToken = uuidv4();
    user.verificationToken = verificationToken;
    await user.save();

    const verificationLink = `${req.protocol}://${req.get(
      "host"
    )}/api/users/verify/${verificationToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Ponowne wysłanie linka do weryfikacji",
      text: `Kliknij ten link, aby zweryfikować swój adres email: ${verificationLink}`,
      html: `<p>Kliknij <a href="${verificationLink}">ten link</a>, aby zweryfikować swój adres email.</p>`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Verification email sent" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  signup,
  login,
  logout,
  getCurrentUser,
  updateAvatar,
  verifyUser,
  resendVerificationEmail,
};
