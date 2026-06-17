const express = require("express");
const router = express.Router({ mergeParams: true });
const { protect } = require("../middleware/auth");
const {
  getComments,
  createComment,
  createReply,
  updateComment,
  deleteComment,
} = require("../controllers/comments.controller");

router.get("/", protect, getComments);
router.post("/", protect, createComment);
router.post("/:commentId/replies", protect, createReply);
router.patch("/:commentId", protect, updateComment);
router.delete("/:commentId", protect, deleteComment);

module.exports = router;