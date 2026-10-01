import { useEffect, useRef, useState } from "react";
import { HandHeart, Mail } from "lucide-react";
import contributionBackground from "@/assets/contribution-popup-background.jpeg";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import "./contribution-popup.css";

export const CONTRIBUTION_POPUP_DISMISSED_KEY = "nalum-contribution-popup-dismissed";
export const CONTRIBUTION_POPUP_DISMISSED_VALUE = "2026-09";
export const CONTRIBUTION_DESTINATION = "mailto:alumni@nsut.ac.in";
const DISPLAY_DELAY_MS = 1000;

function hasBeenDismissed() {
  try {
    return window.sessionStorage.getItem(CONTRIBUTION_POPUP_DISMISSED_KEY) === CONTRIBUTION_POPUP_DISMISSED_VALUE;
  } catch {
    return false;
  }
}

function rememberShown() {
  try {
    window.sessionStorage.setItem(
      CONTRIBUTION_POPUP_DISMISSED_KEY,
      CONTRIBUTION_POPUP_DISMISSED_VALUE,
    );
  } catch {
    // Storage can be disabled by privacy settings. The dialog still works.
  }
}

interface ContributionPopupProps {
  ready?: boolean;
  openRequest?: number;
}

export function ContributionPopup({
  ready = false,
  openRequest = 0,
}: ContributionPopupProps) {
  const [open, setOpen] = useState(false);
  const [hasSupported, setHasSupported] = useState(false);
  const hasShown = useRef(false);

  useEffect(() => {
    if (openRequest <= 0) return;

    hasShown.current = true;
    rememberShown();
    setOpen(true);
  }, [openRequest]);

  useEffect(() => {
    if (!ready || hasShown.current || hasBeenDismissed()) return;

    const timer = window.setTimeout(() => {
      hasShown.current = true;
      rememberShown();
      setOpen(true);
    }, DISPLAY_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [openRequest, ready]);

  const dismiss = () => {
    rememberShown();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && dismiss()}>
      <DialogContent
        onOpenAutoFocus={(event) => event.preventDefault()}
        overlayClassName="bg-black/70 backdrop-blur-sm"
        closeClassName="contribution-close"
        className="contribution-dialog overflow-hidden rounded-[10px] border border-[#8c6548]/25 bg-[#fbf4e9] p-0 text-[#29231f] shadow-[0_24px_80px_rgba(0,0,0,.38)]"
      >
        <div className="contribution-paper relative overflow-y-auto">
          <img
            src={contributionBackground}
            alt=""
            aria-hidden="true"
            className="contribution-background"
          />

          <div className="contribution-content relative z-[1] text-center">
            <DialogTitle className="contribution-kicker">
              Batches change. Years pass.
            </DialogTitle>
            <p className="contribution-heading">The NSUT connection stays.</p>
            <div className="contribution-accent" aria-hidden="true" />

            <DialogDescription className="contribution-description">
              From classrooms to careers,
              <br />
              NSUT remains a part of our journey.
            </DialogDescription>

            <div className="contribution-support">
              <button
                type="button"
                className="contribution-support-button"
                aria-label={hasSupported ? "Remove support" : "Support NALUM"}
                aria-pressed={hasSupported}
                onClick={() => setHasSupported((supported) => !supported)}
              >
                <HandHeart />
              </button>
              <span className="contribution-support-divider" aria-hidden="true" />
              <div className="contribution-support-copy">
                <p>
                  The NALUM alumni website was built entirely by NSUT students
                  and is supported by our alumni for its hosting.
                </p>
              </div>
            </div>

            <p className="contribution-request">
              We need more alumni to step forward and help sustain the recurring
              server expenses so that we can keep it running.
            </p>

            <div className="contribution-rule" aria-hidden="true" />
            <p className="contribution-contact-label">For contributions, get in touch with:</p>
            <p className="contribution-contact-name">Prof. Ritu Sibal</p>
            <p className="contribution-contact-role">Chairperson, Alumni Affairs</p>
            <a href={CONTRIBUTION_DESTINATION} className="contribution-phone">
              <span aria-hidden="true"><Mail /></span>
              alumni@nsut.ac.in
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
