import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ContributionPopup, CONTRIBUTION_POPUP_DISMISSED_KEY } from "@/components/ContributionPopup";

describe("ContributionPopup", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    window.sessionStorage.clear();
  });

  it("waits seven seconds before opening and does not auto-close", () => {
    render(<ContributionPopup ready />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(6999));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(30000));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("dismisses with Maybe Later, close, and Escape", () => {
    const { unmount } = render(<ContributionPopup ready />);
    act(() => vi.advanceTimersByTime(7000));
    fireEvent.click(screen.getByRole("button", { name: "Maybe Later" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(sessionStorage.getItem(CONTRIBUTION_POPUP_DISMISSED_KEY)).toBe("true");

    window.sessionStorage.clear();
    const second = render(<ContributionPopup ready />);
    act(() => vi.advanceTimersByTime(7000));
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    second.unmount();

    window.sessionStorage.clear();
    render(<ContributionPopup ready />);
    act(() => vi.advanceTimersByTime(7000));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    unmount();
  });

  it("does not reopen after the session has been dismissed and cleans up timers", () => {
    window.sessionStorage.setItem(CONTRIBUTION_POPUP_DISMISSED_KEY, "true");
    const { unmount } = render(<ContributionPopup ready />);
    act(() => vi.advanceTimersByTime(7000));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    unmount();

    const setTimeoutSpy = vi.spyOn(window, "setTimeout");
    const instance = render(<ContributionPopup ready />);
    instance.unmount();
    act(() => vi.advanceTimersByTime(7000));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(setTimeoutSpy).not.toHaveBeenCalled();
  });

  it("does not render on admin routes", () => {
    window.history.pushState({}, "", "/admin-panel/dashboard");
    render(<ContributionPopup ready />);
    act(() => vi.advanceTimersByTime(7000));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    window.history.pushState({}, "", "/");
  });
});
