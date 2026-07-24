const express = require("express");
const router = express.Router();
const Event = require("../models/admin/event.model");
const Settings = require("../models/admin/settings.model");
const { protect } = require("../middleware/auth");
const uploadEventImage = require("../config/eventImage.multer");
const { compressionPresets } = require("../middleware/imageCompression");
const fs = require("fs");
const path = require("path");
const { notifyMentions } = require("../services/mentionHelper");

// Check if event hosting is allowed
router.get("/hosting-allowed", async (req, res) => {
  try {
    const setting = await Settings.findOne({ key: "allow_event_hosting" });
    
    res.status(200).json({
      success: true,
      data: {
        allowed: setting ? setting.value : true // Default to true
      }
    });
  } catch (error) {
    console.error("Error checking hosting status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check hosting status"
    });
  }
});

// Create a new event (Alumni only)
router.post("/create", protect, uploadEventImage.single("event_image"), compressionPresets.eventImage, async (req, res) => {
  try {
    // Check if hosting is allowed
    const hostingSetting = await Settings.findOne({ key: "allow_event_hosting" });
    if (hostingSetting && !hostingSetting.value) {
      return res.status(403).json({
        success: false,
        message: "Event hosting is currently disabled by administrators",
      });
    }

    const userId = req.user.user_id;
    const user = await require("../models/user/user.model").findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Only alumni can create events
    if (user.role !== "alumni") {
      return res.status(403).json({
        success: false,
        message: "Only alumni can host events",
      });
    }

    const {
      title,
      description,
      event_date,
      event_time,
      location,
      event_type,
      registration_link,
      max_participants,
      contact_info,
    } = req.body;

    // Parse contact_info if it's a string
    let parsedContactInfo = contact_info;
    if (typeof contact_info === 'string') {
      try {
        parsedContactInfo = JSON.parse(contact_info);
      } catch (e) {
        parsedContactInfo = contact_info;
      }
    }

    // Handle image upload
    let image_url = "";
    if (req.file) {
      image_url = `/uploads/event-images/${req.file.filename}`;
    }

    const event = new Event({
      title,
      description,
      event_date,
      event_time,
      location,
      event_type,
      image_url,
      registration_link,
      max_participants,
      contact_info: parsedContactInfo,
      created_by: userId,
      creator_name: user.name,
      creator_email: user.email,
      status: "pending", // Awaiting admin approval
    });

    await event.save();

    // Fire mention notifications (non-blocking)
    notifyMentions({
      text: description,
      senderId: userId,
      senderName: user.name,
      contextType: "event",
      contextTitle: title,
      actionUrl: `/dashboard/events`,
      entityId: event._id.toString(),
    });

    res.status(201).json({
      success: true,
      message: "Event submitted for approval",
      data: event,
    });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create event",
    });
  }
});

// Get all approved events with pagination
router.get("/approved", async (req, res) => {
  try {
    const { page = 1, limit = 9, event_type, time_frame = "upcoming" } = req.query;

    // Get today's date at start of day (local timezone)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const query = {
      status: "approved",
      is_active: true,
    };

    if (time_frame === "past") {
      query.event_date = { $lt: today };
    } else if (time_frame === "upcoming") {
      query.event_date = { $gte: today };
    }
    // time_frame === "all" → no event_date filter

    if (event_type && event_type !== "all") {
      query.event_type = event_type;
    }

    console.log("Fetching events with query:", JSON.stringify(query));

    const events = await Event.find(query)
      .sort({ event_date: time_frame === "past" ? -1 : 1 }) // Most recent past events first, upcoming events soonest first
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select("-liked_by"); // Don't send full liked_by array

    console.log(`Found ${events.length} events`);

    const total = await Event.countDocuments(query);

    res.status(200).json({
      success: true,
      data: events,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch events",
    });
  }
});

// Get most liked events for carousel
router.get("/most-liked", async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const events = await Event.find({
      status: "approved",
      is_active: true,
      event_date: { $gte: today },
    })
      .sort({ likes: -1, event_date: 1 })
      .limit(parseInt(limit))
      .select("-liked_by");

    res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error("Error fetching most liked events:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch most liked events",
    });
  }
});

// Get single event details
router.get("/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch event",
    });
  }
});

// Like/Unlike event
router.post("/:eventId/like", protect, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.user_id;

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const alreadyLiked = event.liked_by.includes(userId);

    if (alreadyLiked) {
      // Unlike
      event.liked_by = event.liked_by.filter(id => id.toString() !== userId.toString());
      event.likes = Math.max(0, event.likes - 1);
    } else {
      // Like
      event.liked_by.push(userId);
      event.likes += 1;
    }

    await event.save();

    res.status(200).json({
      success: true,
      liked: !alreadyLiked,
      likes: event.likes,
    });
  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle like",
    });
  }
});

// Get user's own events
router.get("/my/events", protect, async (req, res) => {
  try {
    const userId = req.user.user_id;

    const events = await Event.find({ created_by: userId, is_active: true })
      .sort({ createdAt: -1 })
      .select("-liked_by");

    res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error("Error fetching user events:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch events",
    });
  }
});

// Get user's liked events (just the event IDs)
router.get("/my/liked", protect, async (req, res) => {
  try {
    const userId = req.user.user_id;

    // Find all events where the user has liked them
    const likedEvents = await Event.find({
      liked_by: userId,
      is_active: true,
    }).select("_id");

    // Return just the IDs
    const likedEventIds = likedEvents.map(event => event._id.toString());

    res.status(200).json({
      success: true,
      data: likedEventIds,
    });
  } catch (error) {
    console.error("Error fetching liked events:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch liked events",
    });
  }
});

// Delete event (Owner only - soft delete)
router.delete("/delete/:eventId", protect, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.user_id;

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Only event creator can delete
    if (event.created_by.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own events",
      });
    }

    // Delete event image file if exists
    if (event.image_url) {
      const fs = require('fs');
      const imagePath = path.join(__dirname, "..", event.image_url);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Soft delete
    event.is_active = false;
    await event.save();

    res.status(200).json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete event",
    });
  }
});

// Update event (Owner only)
router.put("/update/:eventId", protect, uploadEventImage.single("event_image"), async (req, res) => {
  try {
    // Check if hosting is allowed
    const hostingSetting = await Settings.findOne({ key: "allow_event_hosting" });
    if (hostingSetting && !hostingSetting.value) {
      return res.status(403).json({
        success: false,
        message: "Event hosting is currently disabled by administrators",
      });
    }

    const { eventId } = req.params;
    const userId = req.user.user_id;

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Only event creator can update
    if (event.created_by.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own events",
      });
    }

    const {
      title,
      description,
      event_date,
      event_time,
      location,
      event_type,
      registration_link,
      max_participants,
      contact_info,
    } = req.body;

    // Parse contact_info if it's a string
    let parsedContactInfo = contact_info;
    if (typeof contact_info === 'string') {
      try {
        parsedContactInfo = JSON.parse(contact_info);
      } catch (e) {
        parsedContactInfo = contact_info;
      }
    }

    // Handle new image upload
    if (req.file) {
      // Delete old image if exists
      if (event.image_url) {
        const oldImagePath = path.join(__dirname, "..", event.image_url);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      event.image_url = `/uploads/event-images/${req.file.filename}`;
    }

    // Update fields
    event.title = title;
    event.description = description;
    event.event_date = event_date;
    event.event_time = event_time;
    event.location = location;
    event.event_type = event_type;
    event.registration_link = registration_link;
    event.max_participants = max_participants;
    event.contact_info = parsedContactInfo;

    // If event was approved, set back to pending for re-approval
    if (event.status === "approved") {
      event.status = "pending";
    }

    await event.save();

    res.status(200).json({
      success: true,
      message: event.status === "pending" ? "Event updated and submitted for re-approval" : "Event updated successfully",
      data: event,
    });
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update event",
    });
  }
});

module.exports = router;