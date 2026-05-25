const User = require("../models/user/user.model"); // Mongoose model
const Profile = require("../models/user/profile.model");

// Create User
exports.create = async (userData) => {
  // Required fields for User + required profile fields
  const requiredUserFields = ["email", "password", "role","name"];

  for (const field of requiredUserFields) {
    if (!userData[field]) {
      return { error: true, message: `Missing required user field: ${field}` };
    }
  }
  try {
    // Only store fields that exist on User model
    const userPayload = {
      name: userData.name,
      email: userData.email,
      password: userData.password,
      role: userData.role,
      email_verified: userData.email_verified || false,
    };

    // Add location if provided
    if (userData.location) {
      userPayload.location = userData.location;
    }

    const user = await User.create(userPayload);
    return { error: false, data: user };
  } catch (err) {
    return { error: true, message: err.message || "Error creating user" };
  }
};

// Find one by email (case-insensitive)
exports.findOne = async (email) => {
  if (!email) {
    return { error: true, message: "Email is required" };
  }
  try {
    const data = await User.findOne({
      email: { $regex: new RegExp(`^${email}$`, "i") }, // case-insensitive
    });
    return { error: false, data };
  } catch (err) {
    return {
      error: true,
      message: err.message || "Some error occurred while searching for the User.",
    };
  }
};

// Find by user_id (if you have custom user_id field)
exports.findById = async (id) => {
  if (!id) {
    return { error: true, message: "User Id is required" };
  }
  try {
    const data = await User.findById(id);
    return { error: false, data };
  } catch (err) {
    return {
      error: true,
      message: err.message || "Some error occurred while searching for the User.",
    };
  }
};

// Update user
exports.update = async (email, changes) => {
  if (!email || !changes) {
    return { error: true, message: "Email and changes are required" };
  }
  try {
    await User.updateOne(
      { email: { $regex: new RegExp(`^${email}$`, "i") } },
      { $set: changes }
    );
    return { error: false, message: "User updated successfully" };
  } catch (err) {
    return {
      error: true,
      message: err.message,
    };
  }
};
