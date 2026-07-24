const Event = require("../../models/admin/event.model");
const User = require("../../models/user/user.model");
const { logAdminActivity } = require("../../middleware/adminAuth");
const fs = require("fs");
const path = require("path");

// Get all events (with filters)
exports.getAllEvents = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, event_type } = req.query;

    const query = { is_active: true };
    if (status) query.status = status;
    if (event_type) query.event_type = event_type;

    const events = await Event.find(query)
      .populate("created_by", "name email role")
      .sort({ event_date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

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
      message: "An error occurred while fetching events",
    });
  }
};

// Get pending events
exports.getPendingEvents = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const events = await Event.find({ status: "pending", is_active: true })
      .populate("created_by", "name email role")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Event.countDocuments({ status: "pending", is_active: true });

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
    console.error("Error fetching pending events:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching pending events",
    });
  }
};

// Approve event
exports.approveEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { notes } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    if (event.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending events can be approved",
      });
    }

    // Update event status
    event.status = "approved";
    event.is_active = true;
    event.reviewed_by = req.admin.email;
    event.reviewed_at = new Date();
    await event.save();

    console.log("Event approved:", {
      eventId: event._id,
      title: event.title,
      status: event.status,
      is_active: event.is_active,
      event_date: event.event_date
    });

    // Log activity
    await logAdminActivity(
      req.admin.email,
      "approve_event",
      "event",
      eventId,
      {
        event_title: event.title,
        event_date: event.event_date,
        created_by: event.creator_name,
        notes: notes || "",
      },
      req.ip
    );

    // Emit socket event to notify all clients about new approved event
    const io = req.app.get('io');
    if (io) {
      io.emit('event:approved', { eventId: event._id, title: event.title });
    }

    // TODO: Send email notification to event creator

    res.status(200).json({
      success: true,
      message: "Event approved successfully",
      data: event,
    });
  } catch (error) {
    console.error("Error approving event:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while approving event",
    });
  }
};

// Reject event
exports.rejectEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    if (event.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending events can be rejected",
      });
    }

    // Update event status
    event.status = "rejected";
    event.reviewed_by = req.admin.email;
    event.reviewed_at = new Date();
    event.rejection_reason = reason;
    await event.save();

    // Log activity
    await logAdminActivity(
      req.admin.email,
      "reject_event",
      "event",
      eventId,
      {
        event_title: event.title,
        event_date: event.event_date,
        created_by: event.creator_name,
        reason,
      },
      req.ip
    );

    // TODO: Send email notification to event creator

    res.status(200).json({
      success: true,
      message: "Event rejected successfully",
      data: event,
    });
  } catch (error) {
    console.error("Error rejecting event:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while rejecting event",
    });
  }
};

// Get event by ID
exports.getEventById = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId).populate(
      "created_by",
      "name email role"
    );

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
      message: "An error occurred while fetching event",
    });
  }
};

// Delete event (soft delete)
exports.deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Delete event image file if exists
    if (event.image_url) {
      const fs = require('fs');
      const path = require('path');
      const imagePath = path.join(__dirname, "../..", event.image_url);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Soft delete
    event.is_active = false;
    await event.save();

    // Log activity
    await logAdminActivity(
      req.admin.email,
      "delete_event",
      "event",
      eventId,
      {
        event_title: event.title,
      },
      req.ip
    );

    res.status(200).json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while deleting event",
    });
  }
};

// Update event (admin can update any field)
exports.updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
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
      creator_name,
      creator_email,
      status,
      recap,
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

    // Update fields
    if (title) event.title = title;
    if (description) event.description = description;
    if (event_date) event.event_date = event_date;
    if (event_time) event.event_time = event_time;
    if (location) event.location = location;
    if (event_type) event.event_type = event_type;
    if (registration_link !== undefined) event.registration_link = registration_link;
    if (max_participants !== undefined) event.max_participants = max_participants ? parseInt(max_participants) : null;
    if (parsedContactInfo) event.contact_info = parsedContactInfo;
    if (creator_name) event.creator_name = creator_name;
    if (creator_email) event.creator_email = creator_email;
    if (status) event.status = status;
    if (recap !== undefined) event.recap = recap;

    // Handle image upload
    if (req.file) {
      event.image_url = `/uploads/event-images/${req.file.filename}`;
    }

    await event.save();

    // Log activity
    await logAdminActivity(
      req.admin.email,
      "update_event",
      "event",
      eventId,
      {
        event_title: event.title,
        changes: req.body,
      },
      req.ip
    );

    res.status(200).json({
      success: true,
      message: "Event updated successfully",
      data: event,
    });
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while updating event",
    });
  }
};

// Add photos to an event's gallery (admin only, e.g. recap photos for a completed event)
exports.addGalleryPhotos = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No photos were uploaded",
      });
    }

    const newPhotoUrls = req.files.map(
      (file) => `/uploads/event-images/${file.filename}`
    );

    event.gallery.push(...newPhotoUrls);
    await event.save();

    await logAdminActivity(
      req.admin.email,
      "add_event_gallery_photos",
      "event",
      eventId,
      { event_title: event.title, added: newPhotoUrls.length },
      req.ip
    );

    res.status(200).json({
      success: true,
      message: "Photos added to gallery",
      data: event,
    });
  } catch (error) {
    console.error("Error adding gallery photos:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while adding gallery photos",
    });
  }
};

// Remove a single photo from an event's gallery (admin only)
exports.removeGalleryPhoto = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { photo_url } = req.body;

    if (!photo_url) {
      return res.status(400).json({
        success: false,
        message: "photo_url is required",
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    event.gallery = event.gallery.filter((url) => url !== photo_url);
    await event.save();

    // Best-effort: delete the file from disk
    try {
      const filePath = path.join(__dirname, "../../", photo_url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fileError) {
      console.error("Error deleting gallery photo file:", fileError);
    }

    await logAdminActivity(
      req.admin.email,
      "remove_event_gallery_photo",
      "event",
      eventId,
      { event_title: event.title, photo_url },
      req.ip
    );

    res.status(200).json({
      success: true,
      message: "Photo removed from gallery",
      data: event,
    });
  } catch (error) {
    console.error("Error removing gallery photo:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while removing the gallery photo",
    });
  }
};