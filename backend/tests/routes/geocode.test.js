const express = require("express");
const request = require("supertest");

jest.mock("../../middleware/auth", () => ({
  protect: (req, res, next) => next(),
}));

jest.mock("../../services/geocodingQueue", () => ({
  getQueueStatus: jest.fn(),
}));

const { getQueueStatus } = require("../../services/geocodingQueue");
const geocodeRoutes = require("../../routes/geocode");

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/geocode", geocodeRoutes);
  return app;
};

describe("geocode routes", () => {
  let app;

  beforeEach(() => {
    jest.resetAllMocks();
    app = buildApp();
  });

  describe("GET /api/geocode/status", () => {
    it("returns queue status successfully", async () => {
      const mockStatus = {
        queueLength: 0,
        errorCount: 0,
        isProcessing: false,
        currentlyProcessing: null,
      };
      getQueueStatus.mockResolvedValue(mockStatus);

      const res = await request(app).get("/api/geocode/status");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, status: mockStatus });
    });

    it("returns 500 when status check fails", async () => {
      getQueueStatus.mockRejectedValue(new Error("Queue status error"));

      const res = await request(app).get("/api/geocode/status");

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: "Failed to fetch queue status" });
    });
  });
});
