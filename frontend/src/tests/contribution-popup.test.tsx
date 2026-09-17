import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ContributionPopup,
  CONTRIBUTION_POPUP_DISMISSED_KEY,
  CONTRIBUTION_POPUP_DISMISSED_VALUE,
} from "@/components/ContributionPopup";

const openPopup = () => {
  act(() => vi.advanceTimersByTime(1000));
};

describe("ContributionPopup", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    window.sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("is initially absent", () => {
    render(<ContributionPopup ready pathname="/" />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens one second after the homepage becomes ready", () => {
    const { rerender } = render(
      <ContributionPopup ready={false} pathname="/" />,
    );

    act(() => vi.advanceTimersByTime(1000));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    rerender(<ContributionPopup ready pathname="/" />);
    act(() => vi.advanceTimersByTime(999));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAccessibleName("Batches change. Years pass.");
    expect(dialog).toHaveAccessibleDescription(/From classrooms to careers/);
  });

  it("does not close automatically", () => {
    render(<ContributionPopup ready pathname="/" />);
    openPopup();
    act(() => vi.advanceTimersByTime(60000));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("Maybe Later dismisses it and records the session dismissal", () => {
    render(<ContributionPopup ready pathname="/" />);
    openPopup();
    fireEvent.click(screen.getByRole("button", { name: "Maybe Later" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(sessionStorage.getItem(CONTRIBUTION_POPUP_DISMISSED_KEY)).toBe(
      CONTRIBUTION_POPUP_DISMISSED_VALUE,
    );
  });

  it("the close button dismisses it", () => {
    render(<ContributionPopup ready pathname="/" />);
    openPopup();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(sessionStorage.getItem(CONTRIBUTION_POPUP_DISMISSED_KEY)).toBe(
      CONTRIBUTION_POPUP_DISMISSED_VALUE,
    );
  });

  it("Escape dismisses it", () => {
    render(<ContributionPopup ready pathname="/" />);
    openPopup();
    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(sessionStorage.getItem(CONTRIBUTION_POPUP_DISMISSED_KEY)).toBe(
      CONTRIBUTION_POPUP_DISMISSED_VALUE,
    );
  });

  it("does not reopen after dismissal in the same session", () => {
    window.sessionStorage.setItem(
      CONTRIBUTION_POPUP_DISMISSED_KEY,
      CONTRIBUTION_POPUP_DISMISSED_VALUE,
    );
    render(<ContributionPopup ready pathname="/" />);
    openPopup();

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("clears the pending timer when unmounted", () => {
    const clearTimeoutSpy = vi.spyOn(window, "clearTimeout");
    const { unmount } = render(<ContributionPopup ready pathname="/" />);
    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not render on admin routes", () => {
    render(<ContributionPopup ready pathname="/admin-panel/dashboard" />);
    openPopup();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders on the authenticated dashboard home", () => {
    render(<ContributionPopup ready pathname="/dashboard" />);
    openPopup();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("cancels a pending homepage popup after route navigation", () => {
    const { rerender } = render(<ContributionPopup ready pathname="/" />);
    act(() => vi.advanceTimersByTime(500));
    rerender(<ContributionPopup ready pathname="/admin-panel/dashboard" />);
    act(() => vi.advanceTimersByTime(500));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
