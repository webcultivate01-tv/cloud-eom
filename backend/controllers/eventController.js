const Event = require("../models/Event");
const { cleanupUnusedImages } = require("../config/imageCleanup");

// @desc    Get all active events (for public frontend display)
// @route   GET /api/events
// @access  Public
const getActiveEvents = async (req, res) => {
  try {
    const now = new Date();
    const events = await Event.find({
      isActive: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    }).sort({ createdAt: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get ALL events including inactive (admin view)
// @route   GET /api/events/admin/all
// @access  Admin
const getAllEventsAdmin = async (req, res) => {
  try {
    const events = await Event.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create an event / announcement
// @route   POST /api/events
// @access  Admin
const createEvent = async (req, res) => {
  try {
    const { title, description, image, link, badge, expiresAt } = req.body;

    const event = await Event.create({
      title,
      description,
      image: image || "",
      link,
      badge,
      expiresAt: expiresAt || null,
      createdBy: req.user._id,
    });

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update an event
// @route   PUT /api/events/:id
// @access  Admin
const updateEvent = async (req, res) => {
  try {
    // Read the current image first — findByIdAndUpdate with new:true returns
    // the updated document, so the replaced URL is otherwise lost
    const before = await Event.findById(req.params.id).select("image").lean();

    const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (before?.image && before.image !== event.image) {
      await cleanupUnusedImages([before.image]);
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Admin
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    await cleanupUnusedImages([event.image]);
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getActiveEvents, getAllEventsAdmin, createEvent, updateEvent, deleteEvent };
