import { useEffect, useRef } from "react";
import api from "@/lib/api";

// How long a card must stay on screen before it counts as "viewed" —
// keeps a fast scroll-past from incrementing every card it flickers over.
const DWELL_MS = 800;
// How long to wait after the last card enters view before flushing the
// batch, so a burst of scrolling collects into one request instead of many.
const FLUSH_DEBOUNCE_MS = 1500;

// Module-level, shared across every card on the page — this is what lets
// many PostRow instances coalesce into a single batched request.
const pendingIds = new Set<string>();
const sentIds = new Set<string>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleFlush() {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    flushTimer = null;
    if (pendingIds.size === 0) return;

    const postIds = Array.from(pendingIds);
    pendingIds.clear();

    api.post("/posts/views-batch", { postIds }).catch((err) => {
      console.error("Failed to record batch post views:", err);
      // Allow a retry on a future scroll/mount if this batch failed.
      postIds.forEach((id) => sentIds.delete(id));
    });
  }, FLUSH_DEBOUNCE_MS);
}

/**
 * Observes `ref` and queues `postId` for a batched view-count increment
 * once it's been visible on screen for a short dwell time. Skips entirely
 * when `skip` is true (e.g. the viewer is the post's own author).
 */
export function useTrackPostView(
  ref: React.RefObject<Element>,
  postId: string,
  skip = false
) {
  useEffect(() => {
    const node = ref.current;
    if (!node || skip || sentIds.has(postId)) return;

    let dwellTimer: ReturnType<typeof setTimeout> | null = null;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          dwellTimer = setTimeout(() => {
            if (sentIds.has(postId)) return;
            sentIds.add(postId);
            pendingIds.add(postId);
            scheduleFlush();
            observer.disconnect();
          }, DWELL_MS);
        } else if (dwellTimer) {
          clearTimeout(dwellTimer);
          dwellTimer = null;
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(node);

    return () => {
      if (dwellTimer) clearTimeout(dwellTimer);
      observer.disconnect();
    };
  }, [ref, postId, skip]);
}