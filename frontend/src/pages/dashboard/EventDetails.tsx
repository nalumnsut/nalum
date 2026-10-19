import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Calendar,
  MapPin,
  Users,
  Shapes,
  Mail,
  Phone,
  Globe,
  ThumbsUp,
  Share2,
  Link2,
  ChevronRight,
  ExternalLink,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import UserAvatar from "@/components/UserAvatar";
import api from "@/lib/api";
import { BASE_URL } from "@/lib/constants";
import { eventTypeLabel } from "@/constants/eventTypes";
import {
  EventRecord,
  formatEventDateLong,
  formatEventTime,
  ensureUrlProtocol,
  mapsUrl,
  isPastEvent,
} from "@/lib/events";
import { cn } from "@/lib/utils";

const SidebarCard = ({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-card border border-border bg-card p-6 shadow-card">
    {title && (
      <h2 className="mb-4 text-headline-md text-foreground">{title}</h2>
    )}
    {children}
  </div>
);

export default function EventDetails() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<EventRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (!eventId) return;

    setLoading(true);
    setNotFound(false);

    api
      .get(`/events/${eventId}`)
      .then((res) => {
        if (res.data.success) setEvent(res.data.data);
        else setNotFound(true);
      })
      .catch((error) => {
        console.error("Error fetching event:", error);
        setNotFound(true);
      })
      .finally(() => setLoading(false));

    api
      .get("/events/my/liked")
      .then((res) => {
        if (res.data.success)
          setLiked((res.data.data as string[]).includes(eventId));
      })
      .catch((error) => console.error("Error fetching liked events:", error));
  }, [eventId]);

  const handleToggleLike = async () => {
    if (!event) return;
    try {
      const response = await api.post(`/events/${event._id}/like`);
      if (!response.data.success) return;
      setLiked(response.data.liked);
      setEvent((prev) => (prev ? { ...prev, likes: response.data.likes } : prev));
    } catch (error) {
      console.error("Error liking event:", error);
      toast.error("Failed to upvote event");
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Could not copy the link");
    }
  };

  const handleShare = async () => {
    if (!event) return;
    // navigator.share is absent on most desktop browsers — fall back to copy.
    if (!navigator.share) return handleCopyLink();
    try {
      await navigator.share({
        title: event.title,
        text: event.description,
        url: window.location.href,
      });
    } catch {
      // User dismissed the sheet; nothing to report.
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !event) {
    return (
      <div className="mx-auto max-w-3xl py-12">
        <EmptyState
          icon={<Calendar className="mx-auto h-14 w-14 text-muted-foreground/50" />}
          title="Event not found"
          description="This event may have been removed or is no longer available."
          action={
            <Button
              onClick={() => navigate("/dashboard/events")}
              className="gap-2 rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary-hover"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Events
            </Button>
          }
        />
      </div>
    );
  }

  const past = isPastEvent(event.event_date);
  const contact = event.contact_info;
  const hasContact = !!(contact?.email || contact?.phone || contact?.website);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 text-foreground duration-500">
      <div className="mx-auto max-w-7xl pb-12">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-4 flex items-center gap-1 text-body-sm text-muted-foreground"
        >
          <Link to="/dashboard/events" className="shrink-0 hover:text-primary">
            Events
          </Link>
          <ChevronRight className="h-4 w-4 shrink-0" />
          <span className="min-w-0 flex-1 line-clamp-1 break-words text-foreground">
            {event.title}
          </span>
        </nav>

        {/* Hero */}
        <div className="relative mb-6 h-64 overflow-hidden rounded-card md:h-80">
          {event.image_url ? (
            <img
              src={`${BASE_URL}${event.image_url}`}
              alt={event.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-tertiary" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
            <span className="mb-3 inline-block rounded-full bg-primary px-3 py-1 text-label-sm uppercase tracking-wide text-primary-foreground">
              {eventTypeLabel(event.event_type)}
            </span>
            <h1 className="break-words text-headline-lg-mobile text-white md:text-headline-xl">
              {event.title}
            </h1>
            {past && (
              <p className="mt-2 text-body-sm text-white/80">
                This event has already taken place.
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main column */}
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-card border border-border bg-card p-6 shadow-card md:p-8">
              <h2 className="mb-4 text-headline-md text-foreground">
                About the Event
              </h2>
              <p className="whitespace-pre-line break-words text-body-md leading-relaxed text-muted-foreground">
                {event.description}
              </p>

              <div className="mt-6 flex items-center gap-3 border-t border-border pt-6">
                <Button
                  variant="outline"
                  aria-pressed={liked}
                  onClick={handleToggleLike}
                  className={cn(
                    "gap-2 rounded-full px-5 text-label-md",
                    liked
                      ? "border-primary text-primary"
                      : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                  )}
                >
                  <ThumbsUp className={cn("h-4 w-4", liked && "fill-current")} />
                  {event.likes} {event.likes === 1 ? "upvote" : "upvotes"}
                </Button>

                {event.registration_link && !past && (
                  <a
                    href={ensureUrlProtocol(event.registration_link)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="gap-2 rounded-full bg-primary px-6 text-label-md text-primary-foreground hover:bg-primary-hover">
                      Register Now
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                )}
              </div>
            </div>

            {/* Organizer */}
            {event.creator_name && (
              <div className="flex items-center gap-4 rounded-card border border-border bg-card p-6 shadow-card">
                <UserAvatar name={event.creator_name} size="lg" />
                <div className="min-w-0">
                  <p className="break-words text-headline-md text-foreground">
                    {event.creator_name}
                  </p>
                  <p className="text-body-sm text-muted-foreground">
                    Event Organizer
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <SidebarCard>
              <dl className="space-y-5">
                <div className="flex gap-4">
                  <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                  <div>
                    <dt className="text-label-md text-foreground">Date &amp; Time</dt>
                    <dd className="text-body-sm text-muted-foreground">
                      {formatEventDateLong(event.event_date)}
                      {event.event_time && ` • ${formatEventTime(event.event_time)}`}
                    </dd>
                  </div>
                </div>

                <div className="flex gap-4">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                  <div>
                    <dt className="text-label-md text-foreground">Venue</dt>
                    <dd className="text-body-sm text-muted-foreground">
                      {event.location}
                    </dd>
                    <a
                      href={mapsUrl(event.location)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-body-sm text-primary hover:underline"
                    >
                      View Map
                    </a>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Shapes className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                  <div>
                    <dt className="text-label-md text-foreground">Event Type</dt>
                    <dd className="text-body-sm text-muted-foreground">
                      {eventTypeLabel(event.event_type)}
                    </dd>
                  </div>
                </div>

                {event.max_participants ? (
                  <div className="flex gap-4">
                    <Users className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                    <div>
                      <dt className="text-label-md text-foreground">Capacity</dt>
                      <dd className="text-body-sm text-muted-foreground">
                        {event.max_participants} attendees
                      </dd>
                    </div>
                  </div>
                ) : null}
              </dl>
            </SidebarCard>

            {hasContact && (
              <SidebarCard title="Contact Organizer">
                <div className="space-y-3">
                  {contact?.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      className="flex items-center gap-3 text-body-sm text-muted-foreground hover:text-primary"
                    >
                      <Mail className="h-4 w-4 shrink-0" />
                      <span className="truncate">{contact.email}</span>
                    </a>
                  )}
                  {contact?.phone && (
                    <a
                      href={`tel:${contact.phone}`}
                      className="flex items-center gap-3 text-body-sm text-muted-foreground hover:text-primary"
                    >
                      <Phone className="h-4 w-4 shrink-0" />
                      <span className="truncate">{contact.phone}</span>
                    </a>
                  )}
                  {contact?.website && (
                    <a
                      href={ensureUrlProtocol(contact.website)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-body-sm text-muted-foreground hover:text-primary"
                    >
                      <Globe className="h-4 w-4 shrink-0" />
                      <span className="truncate">{contact.website}</span>
                    </a>
                  )}
                </div>
              </SidebarCard>
            )}

            <SidebarCard>
              <div className="flex items-center justify-between">
                <span className="text-headline-md text-foreground">
                  Share Event
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Share event"
                    onClick={handleShare}
                    className="rounded-full text-muted-foreground hover:text-primary"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Copy event link"
                    onClick={handleCopyLink}
                    className="rounded-full text-muted-foreground hover:text-primary"
                  >
                    <Link2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </SidebarCard>
          </div>
        </div>
      </div>
    </div>
  );
}
