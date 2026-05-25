const mongoose = require("mongoose");

// Simplified profile schema without complex duration tracking
const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Required academic information
    batch: {
      type: String,
      required: true,
    },
    branch: {
      type: String,
      required: true,
    },
    campus: {
      type: String,
      required: true,
      enum: ["Main Campus", "East Campus", "West Campus"],
    },


    location: {
      locality: {
        type: String,
        lowercase: true,
        trim: true,
      },
      city: {
        type: String,
        lowercase: true,
        trim: true,
      },
      state: {
        type: String,
        lowercase: true,
        trim: true,
      },
      country: {
        type: String,
        lowercase: true,
        trim: true,
      },
      lat: {
        type: Number,
        index: true, // Enable geospatial queries if needed later
      },
      lng: {
        type: Number,
        index: true,
      },
    },

    // Optional current employment
    current_company: {
      type: String,
    },
    current_role: {
      type: String,
    },

    // Profile picture
    profile_picture: {
      type: String, // URL or file path
    },

    // Social media links (all optional)
    social_media: {
      linkedin: String,
      github: String,
      twitter: String,
      personal_website: String,
    },

    // Optional skills and experience
    skills: [String],

    experience: [
      {
        company: String,
        role: String,
        duration: String, // Simplified to just store the string (e.g., "Jan 2020 - Dec 2022")
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Profile", profileSchema);
