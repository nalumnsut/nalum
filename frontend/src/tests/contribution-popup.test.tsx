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
    render(<ContributionPopup ready />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens one second after its public page becomes ready", () => {
    const { rerender } = render(
      <ContributionPopup ready={false} />,
    );

    act(() => vi.advanceTimersByTime(1000));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    rerender(<ContributionPopup ready />);
    act(() => vi.advanceTimersByTime(999));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAccessibleName("Batches change. Years pass.");
    expect(dialog).toHaveAccessibleDescription(/From classrooms to careers/);
  });

  it("does not close automatically", () => {
    render(<ContributionPopup ready />);
    openPopup();
    act(() => vi.advanceTimersByTime(60000));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("records the popup as shown as soon as it opens", () => {
    render(<ContributionPopup ready />);
    openPopup();

    expect(sessionStorage.getItem(CONTRIBUTION_POPUP_DISMISSED_KEY)).toBe(
      CONTRIBUTION_POPUP_DISMISSED_VALUE,
    );
  });

  it("keeps the contribution email actionable", () => {
    render(<ContributionPopup ready />);
    openPopup();

    expect(
      screen.getByRole("link", { name: "alumni@nsut.ac.in" }),
    ).toHaveAttribute("href", "mailto:alumni@nsut.ac.in");
  });

  it("shows the student-built hosting support message", () => {
    render(<ContributionPopup ready />);
    openPopup();

    expect(
      screen.getByText(/built entirely by NSUT students/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/sustain the recurring server expenses/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/We now need/)).not.toBeInTheDocument();
  });

  it("turns the support heart on when clicked", () => {
    render(<ContributionPopup ready />);
    openPopup();

    const supportButton = screen.getByRole("button", { name: "Support NALUM" });
    expect(supportButton).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(supportButton);

    expect(screen.getByRole("button", { name: "Remove support" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("the close button dismisses it", () => {
    render(<ContributionPopup ready />);
    openPopup();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(sessionStorage.getItem(CONTRIBUTION_POPUP_DISMISSED_KEY)).toBe(
      CONTRIBUTION_POPUP_DISMISSED_VALUE,
    );
  });

  it("Escape dismisses it", () => {
    render(<ContributionPopup ready />);
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
    render(<ContributionPopup ready />);
    openPopup();

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("clears the pending timer when unmounted", () => {
    const clearTimeoutSpy = vi.spyOn(window, "clearTimeout");
    const { unmount } = render(<ContributionPopup ready />);
    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("auto-opens wherever the public layout mounts it", () => {
    render(<ContributionPopup ready />);
    openPopup();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("can be reopened manually after the automatic session display", () => {
    const { rerender } = render(<ContributionPopup ready openRequest={0} />);
    openPopup();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    rerender(<ContributionPopup ready openRequest={1} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("does not auto-open again after an early manual open is closed", () => {
    const { rerender } = render(<ContributionPopup ready openRequest={0} />);

    rerender(<ContributionPopup ready openRequest={1} />);
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    act(() => vi.advanceTimersByTime(1000));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("cancels a pending popup when the public layout stops being ready", () => {
    const { rerender } = render(<ContributionPopup ready />);
    act(() => vi.advanceTimersByTime(500));
    rerender(<ContributionPopup ready={false} />);
    act(() => vi.advanceTimersByTime(500));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
