const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const uploadPostImage = require("../config/postImage.multer");
const { compressionPresets } = require("../middleware/imageCompression");
const commentsRoutes = require("./comments.js");
const {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  searchPosts,
  getMyPosts,
  recordView,
  recordViewsBatch,
  toggleLikePost,
  getPopularTags,
  getSimilarPosts,
} = require("../controllers/posts.controller");

// Routes
router.post("/", protect, uploadPostImage.array("images", 2), compressionPresets.postImage, createPost);
router.get("/", protect, getPosts);
router.get("/my/all", protect, getMyPosts);
router.get("/search", protect, searchPosts);
router.get("/tags", protect, getPopularTags);
router.use("/:postId/comments", commentsRoutes);
router.post("/views-batch", protect, recordViewsBatch);
router.post("/:id/view", protect, recordView);
router.get("/:id/similar", protect, getSimilarPosts);
router.get("/:id", protect, getPostById);
router.post("/:id/like", protect, toggleLikePost);
router.put("/:id", protect, uploadPostImage.array("images", 2), compressionPresets.postImage, updatePost);
router.delete("/:id", protect, deletePost);

module.exports = router;
