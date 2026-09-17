import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, HeartHandshake, Leaf } from "lucide-react";
import nsutCampusImage from "@/assets/hero.webp";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import "./contribution-popup.css";

export const CONTRIBUTION_POPUP_DISMISSED_KEY = "nalum-contribution-popup-dismissed";
export const CONTRIBUTION_POPUP_DISMISSED_VALUE = "2026-09";
export const CONTRIBUTION_DESTINATION = "tel:+919871598390";
const DISPLAY_DELAY_MS = 1000;

function hasBeenDismissed() {
  try {
    return window.sessionStorage.getItem(CONTRIBUTION_POPUP_DISMISSED_KEY) === CONTRIBUTION_POPUP_DISMISSED_VALUE;
  } catch {
    return false;
  }
}

function rememberDismissal() {
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
  pathname?: string;
}

export function ContributionPopup({
  ready = false,
  pathname = window.location.pathname,
}: ContributionPopupProps) {
  const [open, setOpen] = useState(false);
  const hasShown = useRef(false);
  const isAdminRoute = pathname.startsWith("/admin-panel");

  useEffect(() => {
    if (isAdminRoute || !ready || hasShown.current || hasBeenDismissed()) return;

    const timer = window.setTimeout(() => {
      hasShown.current = true;
      setOpen(true);
    }, DISPLAY_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [isAdminRoute, ready]);

  useEffect(() => {
    if (isAdminRoute) setOpen(false);
  }, [isAdminRoute]);

  const dismiss = () => {
    rememberDismissal();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && dismiss()}>
      <DialogContent
        overlayClassName="bg-black/70 backdrop-blur-sm"
        closeClassName="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#fffaf2]/90 text-[#5b514a] opacity-100 hover:bg-[#f6e7d5] hover:text-[#990000]"
        className="contribution-dialog max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-[600px] overflow-hidden rounded-xl border-[#990000]/35 bg-[#fffaf2] p-0 text-[#30231d] shadow-[0_24px_80px_rgba(0,0,0,.35)] sm:rounded-2xl"
      >
        <div className="contribution-paper relative max-h-[calc(100dvh-1rem)] overflow-y-auto px-5 py-8 sm:px-12 sm:py-10">
          <img
            src={nsutCampusImage}
            alt=""
            aria-hidden="true"
            className="contribution-campus-image"
          />
          <Leaf className="absolute -left-2 -top-2 h-24 w-24 rotate-[-35deg] text-[#b97955]/25" aria-hidden="true" />
          <Leaf className="absolute -bottom-8 -right-2 h-28 w-28 rotate-[35deg] text-[#b97955]/20" aria-hidden="true" />

          <div className="relative z-[1] text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-[#990000]">Team NALUM · NSUT</p>
            <DialogTitle className="px-8 font-serif text-2xl font-semibold leading-tight text-[#30231d] sm:text-[2rem]">Batches change. Years pass.</DialogTitle>
            <p className="mt-1 font-serif text-2xl font-bold leading-tight text-[#990000] sm:text-[2rem]">The NSUT connection stays.</p>
            <DialogDescription className="mx-auto mt-5 max-w-md font-serif text-base leading-7 text-[#4e4037] sm:text-lg">
              From classrooms to careers, NSUT remains a part of our journey. <span className="font-semibold text-[#990000]">Help us carry it forward.</span>
            </DialogDescription>

            <div className="my-7 flex items-start gap-3 rounded-xl border border-[#c98962]/25 bg-[#f6e7d5]/70 p-4 text-left">
              <HeartHandshake className="mt-0.5 h-7 w-7 shrink-0 text-[#b45322]" aria-hidden="true" />
              <p className="text-sm leading-6 text-[#4e4037]">NALUM brings generations of NSUT alumni together and keeps our community connected. Built with the support of our alumni, it continues because of the community behind it.</p>
            </div>

            <p className="text-sm leading-6 text-[#4e4037]">Your contribution helps support the NALUM website and keep this connection alive.</p>
            <p className="mt-5 font-serif text-lg font-bold tracking-[0.16em] text-[#990000]">BE A PART OF THE LEGACY.</p>
            <div className="my-6 h-px bg-[#990000]/20" />
            <p className="text-sm font-semibold text-[#30231d]">For contributions and details:</p>
            <p className="mt-2 font-serif text-xl font-bold text-[#990000]">Prof. Ritu Sibal</p>
            <p className="text-sm text-[#5b514a]">Chairperson, Alumni Affairs</p>
            <a href={CONTRIBUTION_DESTINATION} className="mt-2 inline-block min-h-11 rounded-md px-2 py-2 text-base font-semibold text-[#990000] underline underline-offset-4 hover:text-[#6e0000] focus-visible:ring-2 focus-visible:ring-[#990000]">+91 98715 98390</a>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
              <button type="button" onClick={dismiss} className="min-h-11 rounded-md border border-[#990000]/50 px-5 py-2.5 text-sm font-semibold text-[#990000] transition-colors hover:bg-[#990000]/5 focus-visible:ring-2 focus-visible:ring-[#990000]">Maybe Later</button>
              <a href={CONTRIBUTION_DESTINATION} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#990000] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#6e0000] focus-visible:ring-2 focus-visible:ring-[#990000]">Donate Now <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></a>
            </div>
            <p className="mt-5 font-serif text-sm italic text-[#5b514a]">— Team NALUM, NSUT</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
