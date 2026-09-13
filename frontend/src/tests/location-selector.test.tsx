import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LocationSelector from "@/components/profile/LocationSelector";
import apiClient from "@/lib/api";
import { toast } from "sonner";

vi.mock("@/lib/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

const mockedApi = vi.mocked(apiClient);
const mockedToast = vi.mocked(toast);

describe("LocationSelector Component", () => {
  const onLocationChangeMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders city input, country select, and 'Use My Location' button", () => {
    render(
      <LocationSelector
        city=""
        country=""
        onLocationChange={onLocationChangeMock}
        variant="light"
      />,
    );

    expect(screen.getByLabelText(/City/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Country/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Use My Location/i }),
    ).toBeInTheDocument();
  });

  it("populates inputs, calls onLocationChange with lat/lng, and toasts success on geolocation success", async () => {
    const mockGeolocation = {
      getCurrentPosition: vi.fn().mockImplementation((success) => {
        success({
          coords: {
            latitude: 28.6139,
            longitude: 77.209,
          },
        });
      }),
    };
    Object.defineProperty(global.navigator, "geolocation", {
      value: mockGeolocation,
      configurable: true,
      writable: true,
    });

    mockedApi.post.mockResolvedValueOnce({
      data: {
        city: "New Delhi",
        country: "india",
        displayCity: "New Delhi",
        displayCountry: "India",
        normalizedCity: "new delhi",
        normalizedCountry: "india",
        lat: 28.6139,
        lng: 77.209,
      },
    });

    render(
      <LocationSelector
        city=""
        country=""
        onLocationChange={onLocationChangeMock}
        variant="light"
      />,
    );

    const button = screen.getByRole("button", { name: /Use My Location/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith("/geocode/reverse", {
        lat: 28.6139,
        lng: 77.209,
      });
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/City/i)).toHaveValue("New Delhi");
      expect(onLocationChangeMock).toHaveBeenCalledWith(
        "new delhi",
        "india",
        28.6139,
        77.209,
      );
      expect(mockedToast.success).toHaveBeenCalledWith(
        expect.stringContaining("New Delhi, India"),
      );
    });
  });

  it("shows warning toast when only city is detected", async () => {
    const mockGeolocation = {
      getCurrentPosition: vi.fn().mockImplementation((success) => {
        success({
          coords: {
            latitude: 28.6139,
            longitude: 77.209,
          },
        });
      }),
    };
    Object.defineProperty(global.navigator, "geolocation", {
      value: mockGeolocation,
      configurable: true,
      writable: true,
    });

    mockedApi.post.mockResolvedValueOnce({
      data: {
        city: "New Delhi",
        country: "",
        displayCity: "New Delhi",
        displayCountry: "",
        normalizedCity: "new delhi",
        normalizedCountry: "",
        lat: 28.6139,
        lng: 77.209,
      },
    });

    render(
      <LocationSelector
        city=""
        country=""
        onLocationChange={onLocationChangeMock}
        variant="light"
      />,
    );

    const button = screen.getByRole("button", { name: /Use My Location/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByLabelText(/City/i)).toHaveValue("New Delhi");
      expect(mockedToast.warning).toHaveBeenCalledWith(
        expect.stringContaining("City detected: New Delhi"),
      );
    });
  });

  it("shows warning toast when only country is detected", async () => {
    const mockGeolocation = {
      getCurrentPosition: vi.fn().mockImplementation((success) => {
        success({
          coords: {
            latitude: 28.6139,
            longitude: 77.209,
          },
        });
      }),
    };
    Object.defineProperty(global.navigator, "geolocation", {
      value: mockGeolocation,
      configurable: true,
      writable: true,
    });

    mockedApi.post.mockResolvedValueOnce({
      data: {
        city: "",
        country: "india",
        displayCity: "",
        displayCountry: "India",
        normalizedCity: "",
        normalizedCountry: "india",
        lat: 28.6139,
        lng: 77.209,
      },
    });

    render(
      <LocationSelector
        city=""
        country=""
        onLocationChange={onLocationChangeMock}
        variant="light"
      />,
    );

    const button = screen.getByRole("button", { name: /Use My Location/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockedToast.warning).toHaveBeenCalledWith(
        expect.stringContaining("Country detected: India"),
      );
    });
  });

  it("shows error toast when neither city nor country is detected", async () => {
    const mockGeolocation = {
      getCurrentPosition: vi.fn().mockImplementation((success) => {
        success({
          coords: {
            latitude: 0,
            longitude: 0,
          },
        });
      }),
    };
    Object.defineProperty(global.navigator, "geolocation", {
      value: mockGeolocation,
      configurable: true,
      writable: true,
    });

    mockedApi.post.mockResolvedValueOnce({
      data: {
        city: "",
        country: "",
        displayCity: "",
        displayCountry: "",
      },
    });

    render(
      <LocationSelector
        city=""
        country=""
        onLocationChange={onLocationChangeMock}
        variant="light"
      />,
    );

    const button = screen.getByRole("button", { name: /Use My Location/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockedToast.error).toHaveBeenCalledWith(
        "Could not determine your city or country. Please enter them manually.",
      );
    });
  });

  it("updates parent when city is manually typed", () => {
    render(
      <LocationSelector
        city=""
        country="india"
        onLocationChange={onLocationChangeMock}
        variant="light"
      />,
    );

    const cityInput = screen.getByLabelText(/City/i);
    fireEvent.change(cityInput, { target: { value: "Pune" } });

    expect(onLocationChangeMock).toHaveBeenCalledWith("pune", "india");
  });

  it("displays error toast when geolocation permission is denied", async () => {
    const mockGeolocation = {
      getCurrentPosition: vi.fn().mockImplementation((_, error) => {
        error(new Error("User denied Geolocation"));
      }),
    };
    Object.defineProperty(global.navigator, "geolocation", {
      value: mockGeolocation,
      configurable: true,
      writable: true,
    });

    render(
      <LocationSelector
        city=""
        country=""
        onLocationChange={onLocationChangeMock}
        variant="light"
      />,
    );

    const button = screen.getByRole("button", { name: /Use My Location/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockedToast.error).toHaveBeenCalledWith(
        "Location permission denied. Please enter your location manually.",
      );
    });
    expect(onLocationChangeMock).not.toHaveBeenCalled();
  });

  it("displays error toast when reverse geocoding API call fails", async () => {
    const mockGeolocation = {
      getCurrentPosition: vi.fn().mockImplementation((success) => {
        success({
          coords: {
            latitude: 28.6139,
            longitude: 77.209,
          },
        });
      }),
    };
    Object.defineProperty(global.navigator, "geolocation", {
      value: mockGeolocation,
      configurable: true,
      writable: true,
    });

    mockedApi.post.mockRejectedValueOnce({
      response: {
        data: { error: "Failed to reverse geocode location" },
      },
    });

    render(
      <LocationSelector
        city=""
        country=""
        onLocationChange={onLocationChangeMock}
        variant="light"
      />,
    );

    const button = screen.getByRole("button", { name: /Use My Location/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockedToast.error).toHaveBeenCalledWith(
        "Failed to reverse geocode location",
      );
    });
    expect(onLocationChangeMock).not.toHaveBeenCalled();
  });

  it("updates inputs when props change dynamically", () => {
    const { rerender } = render(
      <LocationSelector
        city="Mumbai"
        country="India"
        onLocationChange={onLocationChangeMock}
        variant="light"
      />,
    );

    expect(screen.getByLabelText(/City/i)).toHaveValue("Mumbai");

    rerender(
      <LocationSelector
        city="Bengaluru"
        country="india"
        onLocationChange={onLocationChangeMock}
        variant="light"
      />,
    );

    expect(screen.getByLabelText(/City/i)).toHaveValue("Bengaluru");
  });
});
