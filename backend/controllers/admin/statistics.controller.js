const User = require("../../models/user/user.model");
const Ban = require("../../models/admin/ban.model");
const Event = require("../../models/admin/event.model");
const Newsletter = require("../../models/admin/newsletter.model");
const VerificationQueue = require("../../models/verificationQueue.model");
const AdminActivity = require("../../models/admin/adminActivity.model");
const Post = require("../../models/posts/post.model");
const PageVisit = require("../../models/pageVisit.model");

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    console.log('[Dashboard Stats] Fetching statistics...');
    
    // User statistics (excluding banned users from user statistics counts)
    const totalUsers = await User.countDocuments({ banned: { $ne: true } });
    const totalStudents = await User.countDocuments({ role: "student", banned: { $ne: true } });
    const totalAlumni = await User.countDocuments({ role: "alumni", banned: { $ne: true } });
    const verifiedAlumni = await User.countDocuments({ role: "alumni", verified_alumni: true, banned: { $ne: true } });
    const bannedUsers = await User.countDocuments({ banned: true });

    console.log('[Dashboard Stats] User stats:', { totalUsers, totalStudents, totalAlumni, verifiedAlumni, bannedUsers });

    // Website Visit statistics (Pre-login vs Post-login)
    const preLoginVisits = await PageVisit.countDocuments({ is_authenticated: false });
    const postLoginVisits = await PageVisit.countDocuments({ is_authenticated: true });
    const totalVisits = preLoginVisits + postLoginVisits;

    // Post View statistics
    const totalPosts = await Post.countDocuments();
    const totalPostViewsAggregate = await Post.aggregate([
      { $group: { _id: null, total: { $sum: "$view_count" } } },
    ]);
    const totalPostViews = totalPostViewsAggregate[0]?.total || 0;

    // Verification statistics
    const pendingVerifications = await VerificationQueue.countDocuments({status: "pending"});
    console.log('[Dashboard Stats] Pending verifications:', pendingVerifications);

    // Event statistics
    const totalEvents = await Event.countDocuments();
    const pendingEvents = await Event.countDocuments({ status: "pending" });
    const approvedEvents = await Event.countDocuments({ status: "approved" });
    const rejectedEvents = await Event.countDocuments({ status: "rejected" });

    console.log('[Dashboard Stats] Event stats:', { totalEvents, pendingEvents, approvedEvents, rejectedEvents });

    // Newsletter statistics
    const totalNewsletters = await Newsletter.countDocuments({ is_active: true });
    const totalNewsletterViews = await Newsletter.aggregate([
      { $match: { is_active: true } },
      { $group: { _id: null, total: { $sum: "$view_count" } } },
    ]);
    const totalNewsletterDownloads = await Newsletter.aggregate([
      { $match: { is_active: true } },
      { $group: { _id: null, total: { $sum: "$download_count" } } },
    ]);

    console.log('[Dashboard Stats] Newsletter stats:', { totalNewsletters, views: totalNewsletterViews, downloads: totalNewsletterDownloads });

    // Recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentRegistrations = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    console.log('[Dashboard Stats] Recent registrations (30 days):', recentRegistrations);

    // Active bans (current bans that are active)
    const activeBans = await Ban.countDocuments({
      is_active: true,
      $or: [
        { ban_expires_at: null }, // permanent bans
        { ban_expires_at: { $gt: new Date() } } // temporary bans not yet expired
      ]
    });

    console.log('[Dashboard Stats] Active bans:', activeBans);

    // Recent admin activities (last 10)
    const recentActivities = await AdminActivity.find()
      .sort({ createdAt: -1 })
      .limit(10);

    const stats = {
      users: {
        total: totalUsers,
        students: totalStudents,
        alumni: totalAlumni,
        verified_alumni: verifiedAlumni,
        banned: bannedUsers,
        recent_registrations: recentRegistrations,
      },
      verifications: {
        pending: pendingVerifications,
        verified: verifiedAlumni,
      },
      events: {
        total: totalEvents,
        pending: pendingEvents,
        approved: approvedEvents,
        rejected: rejectedEvents,
      },
      newsletters: {
        total: totalNewsletters,
        total_views: totalNewsletterViews[0]?.total || 0,
        total_downloads: totalNewsletterDownloads[0]?.total || 0,
      },
      bans: {
        active: activeBans,
        total: bannedUsers,
      },
      website_visits: {
        total: totalVisits,
        pre_login: preLoginVisits,
        post_login: postLoginVisits,
      },
      posts: {
        total: totalPosts,
        total_views: totalPostViews,
      },
    };

    console.log('[Dashboard Stats] Final stats object:', JSON.stringify(stats, null, 2));

    res.status(200).json({
      success: true,
      stats: stats,
      recent_activities: recentActivities,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching statistics",
      error: error.message,
    });
  }
};

// Get user registration graph data (last 30 days)
exports.getRegistrationGraph = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const registrations = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          banned: { $ne: true },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    res.status(200).json({
      success: true,
      data: registrations,
    });
  } catch (error) {
    console.error("Error fetching registration graph:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching registration data",
    });
  }
};

// Get all users with pagination and filters
exports.getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      role,
      verified,
      banned,
      search,
    } = req.query;

    const query = {};

    if (role) query.role = role;
    if (verified !== undefined) query.verified_alumni = verified === "true";
    if (banned !== undefined) query.banned = banned === "true";
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("name email role verified_alumni banned ban_expires_at createdAt")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching users",
    });
  }
};
