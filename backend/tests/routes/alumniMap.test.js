const express = require("express");
const request = require("supertest");

jest.mock("../../models/user/profile.model", () => ({
  aggregate: jest.fn(),
}));

const Profile = require("../../models/user/profile.model");
const alumniMapRoutes = require("../../routes/alumniMap");

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/alumni-map", alumniMapRoutes);
  return app;
};

describe("alumni map routes", () => {
  let app;

  beforeEach(() => {
    jest.resetAllMocks();
    app = buildApp();
  });

  describe("GET /api/alumni-map", () => {
    it("returns aggregated locations successfully", async () => {
      const mockLocations = [
        { city: "delhi", country: "india", count: 3, lat: 28.6139, lng: 77.209 },
        { city: "mumbai", country: "india", count: 2, lat: 19.076, lng: 72.8777 }
      ];
      Profile.aggregate.mockResolvedValue(mockLocations);

      const response = await request(app).get("/api/alumni-map");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ locations: mockLocations });
      expect(Profile.aggregate).toHaveBeenCalledTimes(1);
    });

    it("returns 500 error if aggregation fails", async () => {
      Profile.aggregate.mockRejectedValue(new Error("Database error"));

      const response = await request(app).get("/api/alumni-map");

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: "Failed to load alumni map data" });
    });
  });
});
