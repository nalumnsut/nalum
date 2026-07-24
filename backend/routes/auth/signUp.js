const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();

const users = require("../../controllers/user.controller");

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  const minLength = 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength) {
    return "Password must be at least 8 characters long";
  }
  if (!hasUppercase) {
    return "Password must contain at least one uppercase letter (A-Z)";
  }
  if (!hasLowercase) {
    return "Password must contain at least one lowercase letter (a-z)";
  }
  if (!hasDigit) {
    return "Password must contain at least one number (0-9)";
  }
  if (!hasSpecial) {
    return "Password must contain at least one special character";
  }
  return null;
};

router.post("/",async (req,res) => {
  console.log("SignUp request received:", { body: req.body });
  
  if(!req.body.name || !req.body.email || !req.body.password || !req.body.role){
    console.log("Missing required fields:", {
      name: !!req.body.name,
      email: !!req.body.email,
      password: !!req.body.password,
      role: !!req.body.role
    });
    return res.status(400).json({
      err: true,
      code: 400,
      message: "Required fields not provided"
    });
  }
  
  const {name,email,password,role} = req.body;

  // Validate email format
  if (!validateEmail(email)) {
    return res.status(400).json({
      err: true,
      code: 400,
      message: "Please provide a valid email address"
    });
  }

  // Validate password strength
  const passwordError = validatePassword(password);
  if (passwordError) {
    return res.status(400).json({
      err: true,
      code: 400,
      message: passwordError
    });
  }
  
  // Block admin signup - admins can only be created via scripts
  if(role === "admin"){
    return res.status(403).json({
      err: true,
      code: 403,
      message: "Admin accounts cannot be created via signup. Contact system administrator."
    });
  }
  
  // Validate student email
  if (role === "student") {
    const studentEmailRegex = /^[a-z]+(?:\.[a-z]+)*\.[a-z]{2,5}\d{2}@nsut\.ac\.in$/i;
    if (!studentEmailRegex.test(email)) {
      return res.status(400).json({
        err: true,
        code: 400,
        message: "Please enter a valid student email (e.g., name.ug25@nsut.ac.in or name.lastname.ug25@nsut.ac.in)"
      });
    }
  }
  
  const existingUser = await users.findOne(email);
  if(existingUser.error){
    return res.status(500).json({
      err: true,
      code: 500,
      message: existingUser.message || "Some error occurred while searching for the User."
    });
  }
  if(existingUser.data){
    // If user exists but is not verified, allow them to resend OTP
    if(!existingUser.data.email_verified){
      return res.status(200).json({
        err: false,
        code: 200,
        message: "Account exists but not verified. Please verify your email.",
        needsVerification: true,
        email: existingUser.data.email
      });
    }
    // User exists and is verified
    return res.status(409).json({
      err: true,
      code: 409,
      message: "User with this email already exists and is verified. Please login instead."
    });
  }
  
  const hashedPassword = await bcrypt.hash(password,10);
  const newUser = await users.create({
    name,
    email,
    password: hashedPassword,
    role
  });
  if(newUser.error){
    return res.status(500).json({
      err: true,
      code: 500,
      message: newUser.message || "Error creating user"
    });
  }
  
  return res.status(201).json({
    err: false,
    code: 201,
    message: "User created successfully",
    data: {
      id: newUser.data._id,
      name: newUser.data.name,
      email: newUser.data.email,
      role: newUser.data.role
    }
  });
});
  
module.exports = router;
