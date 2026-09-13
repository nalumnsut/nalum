const express = require("express");
const request = require("supertest");
const axios = require("axios");

jest.mock("axios");
jest.mock("../../middleware/auth", () => ({
  protect: (req, res, next) => next(),
}));

jest.mock("../../services/geocodingQueue", () => ({
  getQueueStatus: jest.fn(),
}));

jest.mock("../../config/redis.config", () => ({
  getRedisClient: jest.fn(),
}));

const { getQueueStatus } = require("../../services/geocodingQueue");
const { getRedisClient } = require("../../config/redis.config");
const geocodeRoutes = require("../../routes/geocode");

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/geocode", geocodeRoutes);
  return app;
};

describe("geocode routes", () => {
  let app;
  let mockRedis;

  beforeEach(() => {
    jest.resetAllMocks();

    mockRedis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue("OK"),
    };
    getRedisClient.mockReturnValue(mockRedis);

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

  describe("POST /api/geocode/reverse", () => {
    it("successfully reverse geocodes valid coordinates and normalizes city/country", async () => {
      axios.get.mockResolvedValue({
        data: {
          address: {
            city: "Delhi",
            country: "India",
          },
        },
      });

      const res = await request(app)
        .post("/api/geocode/reverse")
        .send({ lat: 28.6139, lng: 77.209 });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        city: "New Delhi",
        country: "india",
        displayCity: "New Delhi",
        displayCountry: "India",
        normalizedCity: "new delhi",
        normalizedCountry: "india",
        lat: 28.6139,
        lng: 77.209,
      });

      expect(axios.get).toHaveBeenCalledWith(
        "https://nominatim.openstreetmap.org/reverse",
        expect.objectContaining({
          params: expect.objectContaining({
            lat: 28.6139,
            lon: 77.209,
            format: "json",
          }),
        }),
      );

      // Verify cached in Redis
      expect(mockRedis.set).toHaveBeenCalledTimes(1);
    });

    it("returns cached result from Redis without querying Nominatim", async () => {
      const cachedData = {
        city: "New Delhi",
        country: "india",
        displayCity: "New Delhi",
        displayCountry: "India",
        normalizedCity: "new delhi",
        normalizedCountry: "india",
        lat: 28.614,
        lng: 77.209,
      };
      mockRedis.get.mockResolvedValue(JSON.stringify(cachedData));

      const res = await request(app)
        .post("/api/geocode/reverse")
        .send({ lat: 28.614, lng: 77.209 });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(cachedData);
      expect(axios.get).not.toHaveBeenCalled();
    });

    it("falls back to town/village/suburb when city field is missing in Nominatim response", async () => {
      axios.get.mockResolvedValue({
        data: {
          address: {
            town: "Gurgaon",
            country: "India",
          },
        },
      });

      const res = await request(app)
        .post("/api/geocode/reverse")
        .send({ lat: 28.4595, lng: 77.0266 });

      expect(res.status).toBe(200);
      expect(res.body.city).toBe("Gurugram");
      expect(res.body.country).toBe("india");
    });

    it("rejects invalid or missing coordinates with 400", async () => {
      const invalidPayloads = [
        {},
        { lat: null, lng: 77.209 },
        { lat: 28.6139, lng: null },
        { lat: "invalid", lng: 77.209 },
        { lat: 28.6139, lng: "" },
        { lat: 95.0, lng: 77.209 }, // out of bounds lat > 90
        { lat: -95.0, lng: 77.209 }, // out of bounds lat < -90
        { lat: 28.6139, lng: 185.0 }, // out of bounds lng > 180
        { lat: 28.6139, lng: -185.0 }, // out of bounds lng < -180
      ];

      for (const payload of invalidPayloads) {
        const res = await request(app)
          .post("/api/geocode/reverse")
          .send(payload);

        expect(res.status).toBe(400);
      }
    });

    it("returns 404 when Nominatim returns unable to geocode and does not cache", async () => {
      axios.get.mockResolvedValue({
        data: {
          error: "Unable to geocode",
        },
      });

      const res = await request(app)
        .post("/api/geocode/reverse")
        .send({ lat: 0, lng: 0 });

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/could not determine location/i);
      expect(mockRedis.set).not.toHaveBeenCalled();
    });

    it("returns 404 when response contains no address details and does not cache", async () => {
      axios.get.mockResolvedValue({
        data: {
          address: {},
        },
      });

      const res = await request(app)
        .post("/api/geocode/reverse")
        .send({ lat: 10.0, lng: 20.0 });

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/could not determine location/i);
      expect(mockRedis.set).not.toHaveBeenCalled();
    });

    it("resolves borough or district when city is absent", async () => {
      axios.get.mockResolvedValue({
        data: {
          address: {
            borough: "Brooklyn",
            country: "United States",
          },
        },
      });

      const res = await request(app)
        .post("/api/geocode/reverse")
        .send({ lat: 40.6782, lng: -73.9442 });

      expect(res.status).toBe(200);
      expect(res.body.city).toBe("Brooklyn");
      expect(res.body.country).toBe("united states");
    });

    it("handles Nominatim 403 Forbidden with 503", async () => {
      const err = new Error("Forbidden");
      err.response = { status: 403, data: "Access blocked" };
      axios.get.mockRejectedValue(err);

      const res = await request(app)
        .post("/api/geocode/reverse")
        .send({ lat: 28.6139, lng: 77.209 });

      expect(res.status).toBe(503);
      expect(res.body.error).toMatch(/temporarily unavailable/i);
    });

    it("handles Nominatim 429 rate limit response", async () => {
      const err = new Error("Rate limit exceeded");
      err.response = { status: 429 };
      axios.get.mockRejectedValue(err);

      const res = await request(app)
        .post("/api/geocode/reverse")
        .send({ lat: 28.6139, lng: 77.209 });

      expect(res.status).toBe(429);
      expect(res.body.error).toMatch(/rate limit/i);
    });

    it("handles unexpected Nominatim errors with 500", async () => {
      axios.get.mockRejectedValue(new Error("Network connection reset"));

      const res = await request(app)
        .post("/api/geocode/reverse")
        .send({ lat: 28.6139, lng: 77.209 });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe("Failed to reverse geocode location");
    });
  });
});
