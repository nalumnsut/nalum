const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analytics.controller");

router.post("/visit", analyticsController.trackVisit);

module.exports = router;
