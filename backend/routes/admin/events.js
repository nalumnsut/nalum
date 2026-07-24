const express = require("express");
const router = express.Router();
const eventController = require("../../controllers/admin/event.controller");
const { protectAdmin } = require("../../middleware/adminAuth");
const Settings = require("../../models/admin/settings.model");
const Event = require("../../models/admin/event.model");
const uploadEventImage = require("../../config/eventImage.multer");
const { compressionPresets } = require("../../middleware/imageCompression");

// All routes are protected (admin only)
router.get("/all", protectAdmin, eventController.getAllEvents);
router.get("/pending", protectAdmin, eventController.getPendingEvents);
router.get("/:eventId", protectAdmin, eventController.getEventById);
router.post("/approve/:eventId", protectAdmin, eventController.approveEvent);
router.post("/reject/:eventId", protectAdmin, eventController.rejectEvent);
router.put("/update/:eventId", protectAdmin, uploadEventImage.single("event_image"), compressionPresets.eventImage, eventController.updateEvent);
router.delete("/delete/:eventId", protectAdmin, eventController.deleteEvent);

// Gallery management (admin only) — add/remove recap photos for any event
router.post("/:eventId/gallery", protectAdmin, uploadEventImage.array("gallery_images", 10), compressionPresets.eventImage, eventController.addGalleryPhotos);
router.delete("/:eventId/gallery", protectAdmin, eventController.removeGalleryPhoto);

// Create event as admin (auto-approved)
router.post("/create", protectAdmin, uploadEventImage.single("event_image"), compressionPresets.eventImage, async (req, res) => {
  try {
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
      creator_name,
      creator_email,
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
      creator_name,
      creator_email,
      created_by: req.admin._id, // Admin who created it
      status: "approved", // Auto-approved since admin created it
      is_active: true,
    });

    await event.save();

    res.status(201).json({
      success: true,
      message: "Event created and approved",
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

// Toggle event hosting
router.post("/settings/toggle-hosting", protectAdmin, async (req, res) => {
  try {
    const { enabled } = req.body;
    
    await Settings.findOneAndUpdate(
      { key: "allow_event_hosting" },
      { 
        value: enabled,
        description: "Allow alumni to host events",
        updated_by: req.admin._id
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: `Event hosting ${enabled ? "enabled" : "disabled"}`,
      data: { enabled }
    });
  } catch (error) {
    console.error("Error toggling event hosting:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle event hosting"
    });
  }
});

// Get event hosting status
router.get("/settings/hosting-status", protectAdmin, async (req, res) => {
  try {
    const setting = await Settings.findOne({ key: "allow_event_hosting" });
    
    res.status(200).json({
      success: true,
      data: {
        enabled: setting ? setting.value : true // Default to true
      }
    });
  } catch (error) {
    console.error("Error fetching hosting status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch hosting status"
    });
  }
});

module.exports = router;