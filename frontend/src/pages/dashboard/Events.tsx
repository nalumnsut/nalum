import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import io from "socket.io-client";
import { Calendar, LayoutGrid, ListChecks, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterPillSelect } from "@/components/ui/FilterPillSelect";
import {
  SegmentedToggle,
  SegmentedToggleOption,
} from "@/components/ui/SegmentedToggle";
import { EmptyState } from "@/components/ui/EmptyState";
import { SmartPagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { EventRow } from "@/components/events/EventRow";
import { MyEventsPanel } from "@/components/events/MyEventsPanel";
import { FadeIn } from "@/components/ui/motion";
import api from "@/lib/api";
import { DURATION, SPRING, popVariants, switchVariants } from "@/lib/motion";
import { BASE_URL } from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";
import { EVENT_TYPES, EVENT_TYPE_LABELS } from "@/constants/eventTypes";
import { EventRecord } from "@/lib/events";

type Tab = "all" | "my";

const TAB_OPTIONS: readonly SegmentedToggleOption<Tab>[] = [
  { value: "all", label: "All Events", icon: LayoutGrid },
  { value: "my", label: "My Events", icon: ListChecks },
];

const EventRowSkeleton = () => (
  <div className="flex flex-col overflow-hidden rounded-card border border-border bg-card shadow-card md:flex-row">
    <Skeleton className="h-48 shrink-0 rounded-none md:h-auto md:w-2/5" />
    <div className="flex-1 space-y-3 p-6">
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-10 w-full" />
    </div>
  </div>
);

export default function Events() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Only alumni and faculty can host, so only they get the My Events half.
  const canHost = ["alumni", "faculty"].includes(user?.role ?? "");
  const tab: Tab = canHost && searchParams.get("tab") === "my" ? "my" : "all";

  const [events, setEvents] = useState<EventRecord[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [likedEvents, setLikedEvents] = useState<Set<string>>(new Set());

  const fetchEvents = useCallback(async (page: number, type: string) => {
    try {
      setLoading(true);
      const response = await api.get(
        `/events/approved?page=${page}&limit=9&event_type=${type}`
      );
      if (response.data.success) {
        setEvents(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab !== "all") return;
    fetchEvents(currentPage, filterType);
  }, [tab, currentPage, filterType, fetchEvents]);

  useEffect(() => {
    api
      .get("/events/my/liked")
      .then((res) => {
        if (res.data.success) setLikedEvents(new Set(res.data.data));
      })
      .catch((error) => console.error("Error fetching liked events:", error));
  }, []);

  // Admin approvals land without a page refresh.
  useEffect(() => {
    if (tab !== "all") return;

    const socket = io(BASE_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    socket.on("event:approved", (data: { title: string }) => {
      fetchEvents(currentPage, filterType);
      toast.success(`New event "${data.title}" is now available!`);
    });

    return () => {
      socket.disconnect();
    };
  }, [tab, currentPage, filterType, fetchEvents]);

  const handleToggleLike = async (eventId: string) => {
    try {
      const response = await api.post(`/events/${eventId}/like`);
      if (!response.data.success) return;

      const { liked, likes } = response.data;
      setLikedEvents((prev) => {
        const next = new Set(prev);
        if (liked) next.add(eventId);
        else next.delete(eventId);
        return next;
      });
      setEvents((prev) =>
        prev.map((event) => (event._id === eventId ? { ...event, likes } : event))
      );
    } catch (error) {
      console.error("Error liking event:", error);
      toast.error("Failed to upvote event");
    }
  };

  const setTab = (next: Tab) => {
    const params = new URLSearchParams(searchParams);
    if (next === "my") params.set("tab", "my");
    else params.delete("tab");
    setSearchParams(params, { replace: true });
  };

  return (
    // No page-level wrapper animation: the header's fade and the panel's own
    // entrance below already cover the page, and stacking a third rise on top
    // of them just moves the same pixels twice.
    <div className="text-foreground">
      <div className="mx-auto max-w-7xl pb-12">
        {/* Header — keyed on the tab so the title and its description
            cross-fade with the panel below. */}
        <FadeIn className="mb-8 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: DURATION.fast }}
            >
              <h1 className="mb-2 text-headline-lg-mobile text-primary md:text-headline-xl">
                {tab === "my" ? "My Events" : "Upcoming Events"}
              </h1>
              <p className="text-body-lg text-muted-foreground">
                {tab === "my"
                  ? "Manage your hosted events and track their approval status."
                  : "Discover networking opportunities, reunions, and workshops."}
              </p>
            </motion.div>
          </AnimatePresence>

          {canHost && (
            <SegmentedToggle
              label="Event view"
              value={tab}
              onChange={setTab}
              options={TAB_OPTIONS}
            />
          )}
        </FadeIn>

        {/* `mode="wait"` matters here: the two panels have very different
            heights, and overlapping them would make the page jump. No
            `initial={false}`: that would propagate "skip your entrance" to
            every descendant and flatten the row cascades inside. */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            variants={switchVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {tab === "my" ? (
              <MyEventsPanel />
            ) : (
              <>
                {/* Filter row */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                  <FilterPillSelect
                    value={filterType === "all" ? "" : filterType}
                    onValueChange={(value) => {
                      setFilterType(value);
                      setCurrentPage(1);
                    }}
                    onClear={() => {
                      setFilterType("all");
                      setCurrentPage(1);
                    }}
                    placeholder="All categories"
                    options={EVENT_TYPES}
                    labels={EVENT_TYPE_LABELS}
                    triggerClassName="w-[180px]"
                  />

                  {canHost && (
                    <Link
                      to="/dashboard/host-event"
                      className="hidden sm:block"
                    >
                      <Button className="gap-2 rounded-full bg-primary px-5 text-label-md text-primary-foreground hover:bg-primary-hover">
                        <Plus className="h-4 w-4" />
                        Host New Event
                      </Button>
                    </Link>
                  )}
                </div>

                {/* Listing */}
                {loading ? (
                  <div className="space-y-4">
                    <EventRowSkeleton />
                    <EventRowSkeleton />
                    <EventRowSkeleton />
                  </div>
                ) : events.length === 0 ? (
                  <EmptyState
                    icon={
                      <Calendar className="mx-auto h-14 w-14 text-muted-foreground/50" />
                    }
                    title="No events found"
                    description={
                      filterType === "all"
                        ? "Check back later for upcoming events from the alumni community."
                        : "No events in this category right now. Try clearing the filter."
                    }
                  />
                ) : (
                  <>
                    {/* Keyed on page + filter so paging or re-filtering
                        re-runs the cascade instead of swapping rows silently. */}
                    <div
                      key={`${currentPage}-${filterType}`}
                      className="space-y-4"
                    >
                      {events.map((event, index) => (
                        <EventRow
                          key={event._id}
                          event={event}
                          index={index}
                          liked={likedEvents.has(event._id)}
                          onToggleLike={handleToggleLike}
                          isOwn={
                            !!user?.email && event.creator_email === user.email
                          }
                        />
                      ))}
                    </div>

                    <div className="pt-8">
                      <SmartPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                      />
                    </div>
                  </>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Mobile host shortcut */}
      {canHost && (
        <motion.div
          variants={popVariants}
          initial="hidden"
          animate="visible"
          whileTap={{ scale: 0.9 }}
          transition={SPRING}
          className="fixed bottom-20 right-4 z-30 sm:hidden"
        >
          <Link to="/dashboard/host-event">
            <Button
              aria-label="Host a new event"
              className="h-14 w-14 rounded-full bg-primary p-0 text-primary-foreground shadow-overlay hover:bg-primary-hover"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </Link>
        </motion.div>
      )}
    </div>
  );
}
