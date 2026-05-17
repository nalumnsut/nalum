const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();

const users = require("../../controllers/user.controller");

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
  
  // Block admin signup - admins can only be created via scripts
  if(role === "admin"){
    return res.status(403).json({
      err: true,
      code: 403,
      message: "Admin accounts cannot be created via signup. Contact system administrator."
    });
  }
  
  // Validate student email
  if(role === "student" && !email.endsWith("@nsut.ac.in")){
    return res.status(400).json({
      err: true,
      code: 400,
      message: "Students must use their @nsut.ac.in email address"
    });
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
