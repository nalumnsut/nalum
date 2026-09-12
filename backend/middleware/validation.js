const validateSignup = (req, res, next) => {
  const {
    email,
    password,
    role,
    name,
    batch,
    branch,
    campus
  } = req.body;

  // Required field validation
  const requiredFields = {
    email: "Email is required",
    password: "Password is required",
    role: "Role is required",
    name: "Name is required",
    batch: "Batch is required",
    branch: "Branch is required",
    campus: "Campus is required"
  };

  for (const [field, message] of Object.entries(requiredFields)) {
    if (!req.body[field] || req.body[field].trim() === "") {
      return res.status(400).json({
        success: false,
        message
      });
    }
  }

  // Email format validation
  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: "Invalid email format"
    });
  }

  // Password length validation
  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters long"
    });
  }

  // Role validation
  if (!["student", "alumni", "faculty"].includes(role)) {
    return res.status(400).json({
      success: false,
      message: "Role must be one of 'student', 'alumni', or 'faculty'"
    });
  }

  next();
};

module.exports = { validateSignup };