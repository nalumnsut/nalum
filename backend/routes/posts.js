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
} = require("../controllers/posts.controller");

// Routes
router.post("/", protect, uploadPostImage.array("images", 2), compressionPresets.postImage, createPost);
router.get("/", protect, getPosts);
router.get("/my/all", protect, getMyPosts);
router.get("/search", protect, searchPosts);
router.use("/:postId/comments", commentsRoutes);
router.get("/:id", protect, getPostById);
router.put("/:id", protect, uploadPostImage.array("images", 2), compressionPresets.postImage, updatePost);
router.delete("/:id", protect, deletePost);

module.exports = router;
