const Role = require("../models/Role");

// CREATE
exports.createRole = async (req, res) => {
  try {
    const role = await Role.create(req.body);
    res.status(201).json(role);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// READ ALL
exports.getRoles = async (req, res) => {
  const roles = await Role.find({ isDeleted: false });
  res.json(roles);
};

// READ BY ID
exports.getRoleById = async (req, res) => {
  const role = await Role.findOne({
    _id: req.params.id,
    isDeleted: false,
  });
  if (!role) return res.status(404).json({ message: "Role not found" });
  res.json(role);
};

// UPDATE
exports.updateRole = async (req, res) => {
  const role = await Role.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(role);
};

// SOFT DELETE
exports.deleteRole = async (req, res) => {
  await Role.findByIdAndUpdate(req.params.id, { isDeleted: true });
  res.json({ message: "Role deleted (soft)" });
};