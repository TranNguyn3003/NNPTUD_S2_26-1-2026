const User = require("../models/User");

// CREATE
exports.createUser = async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// READ ALL
exports.getUsers = async (req, res) => {
  const users = await User.find({ isDeleted: false }).populate("role");
  res.json(users);
};

// READ BY ID
exports.getUserById = async (req, res) => {
  const user = await User.findOne({
    _id: req.params.id,
    isDeleted: false,
  }).populate("role");

  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
};

// UPDATE
exports.updateUser = async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(user);
};

// SOFT DELETE
exports.deleteUser = async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { isDeleted: true });
  res.json({ message: "User deleted (soft)" });
};

// ENABLE
exports.enableUser = async (req, res) => {
  const { email, username } = req.body;

  const user = await User.findOne({ email, username, isDeleted: false });
  if (!user)
    return res.status(404).json({ message: "User not found" });

  user.status = true;
  await user.save();

  res.json({ message: "User enabled", user });
};

// DISABLE
exports.disableUser = async (req, res) => {
  const { email, username } = req.body;

  const user = await User.findOne({ email, username, isDeleted: false });
  if (!user)
    return res.status(404).json({ message: "User not found" });

  user.status = false;
  await user.save();

  res.json({ message: "User disabled", user });
};