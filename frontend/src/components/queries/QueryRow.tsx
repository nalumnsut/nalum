import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Eye, MessageCircle, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BASE_URL } from "@/lib/constants";
import { blockEntrance } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface QueryRecord {
  _id: string;
  title: string;
  content: string;
  images: string[];
  status: "pending" | "viewed" | "responded";
  answer?: string;
  createdAt: string;
}

const STATUS_PILL: Record<
  QueryRecord["status"],
  { label: string; icon: typeof Clock; className: string }
> = {
  pending: {
    label: "Awaiting Review",
    icon: Clock,
    className: "bg-warning-subtle text-warning",
  },
  viewed: {
    label: "Under Review",
    icon: Eye,
    className: "bg-secondary text-secondary-foreground",
  },
  responded: {
    label: "Answered",
    icon: CheckCircle2,
    className: "bg-success-subtle text-success",
  },
};

// Legacy mention token written by the resolver on submit: @[Name](userId).
const MENTION_PATTERN = /@\[([^\]]+)\]\(([^)]+)\)/g;

function renderContent(text: string) {
  const segments = text.split(MENTION_PATTERN);
  const nodes: (string | JSX.Element)[] = [];
  for (let i = 0; i < segments.length; i += 3) {
    if (segments[i]) nodes.push(segments[i]);
    if (segments[i + 1] && segments[i + 2]) {
      nodes.push(
        <Link
          key={`mention-${i}`}
          to={`/dashboard/alumni/${segments[i + 2]}`}
          className="font-medium text-primary hover:underline"
        >
          @{segments[i + 1]}
        </Link>
      );
    }
  }
  return nodes;
}

interface QueryRowProps {
  query: QueryRecord;
  /** Position in the list — staggers this row's entrance behind the one above. */
  index?: number;
  /** Omitted on read-only lists; this page only ever shows the viewer's own queries. */
  onDelete?: (query: QueryRecord) => void;
}

// A single submitted query: status, the question itself, any attached
// photos, and the admin's answer once one exists.
export const QueryRow = ({ query, index = 0, onDelete }: QueryRowProps) => {
  const [lightbox, setLightbox] = useState<string | null>(null);

  const pill = STATUS_PILL[query.status];
  const PillIcon = pill.icon;

  return (
    <>
      <motion.article
        {...blockEntrance(index)}
        className="rounded-card border border-border bg-card p-5 shadow-card sm:p-6"
      >
        <div className="mb-3 flex items-start justify-between gap-4">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-label-sm uppercase tracking-wide",
              pill.className
            )}
          >
            <PillIcon className="h-3.5 w-3.5" />
            {pill.label}
          </span>
          <div className="flex shrink-0 items-center gap-1">
            <span className="text-body-sm text-muted-foreground">
              {new Date(query.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Delete query"
                title="Delete query"
                onClick={() => onDelete(query)}
                className="rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <h3 className="break-words text-headline-md text-foreground">{query.title}</h3>
        <p className="mt-1.5 whitespace-pre-wrap break-words text-body-md text-muted-foreground">
          {renderContent(query.content)}
        </p>

        {query.images.length > 0 && (
          <div
            className={cn(
              "mt-4 grid gap-2",
              query.images.length === 1
                ? "grid-cols-1 sm:max-w-xs"
                : "grid-cols-2"
            )}
          >
            {query.images.map((image, index) => (
              <button
                type="button"
                key={image}
                onClick={() =>
                  setLightbox(`${BASE_URL}/uploads/queries/${image}`)
                }
                className="group overflow-hidden rounded-lg border border-border"
              >
                <img
                  src={`${BASE_URL}/uploads/queries/${image}`}
                  alt={`Attachment ${index + 1} for ${query.title}`}
                  loading="lazy"
                  className="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </button>
            ))}
          </div>
        )}

        {query.status === "responded" && query.answer ? (
          <div className="mt-4 rounded-lg border-l-4 border-success bg-success-subtle p-4">
            <div className="mb-1.5 flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-success" />
              <span className="text-label-md text-success">
                Admin Response
              </span>
            </div>
            <p className="whitespace-pre-wrap break-words text-body-sm text-foreground">
              {query.answer}
            </p>
          </div>
        ) : (
          <p className="mt-4 text-body-sm italic text-muted-foreground">
            {query.status === "viewed"
              ? "An administrator is looking into this — the response will appear here."
              : "Submitted — an administrator will review it shortly."}
          </p>
        )}
      </motion.article>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            aria-label="Close image"
            onClick={() => setLightbox(null)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={lightbox}
            alt="Query attachment"
            className="max-h-full max-w-full rounded-lg object-contain"
          />
        </div>
      )}
    </>
  );
};

export default QueryRow;
