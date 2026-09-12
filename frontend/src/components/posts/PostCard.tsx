import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  Flag,
  GraduationCap,
  Globe,
  Heart,
  LucideIcon,
  MessageSquare,
  Pencil,
  Share2,
  ThumbsUp,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import PostImages from "@/components/posts/PostImages";
import PostMarkdown from "@/components/posts/PostMarkdown";
import UserAvatar from "@/components/UserAvatar";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useTrackPostView } from "@/hooks/useTrackPostView";
import {
  CARD_HOVER,
  CARD_TAP,
  EXIT_BLOCK,
  SPRING,
  SPRING_POP,
  blockEntrance,
} from "@/lib/motion";
import {
  PostRecord,
  PostStatus,
  PostVisibility,
  VISIBILITY_LABELS,
  getPostImageUrl,
  isPostPinned,
  likeIds,
} from "@/lib/posts";
import { cn } from "@/lib/utils";

const STATUS_PILL: Record<
  PostStatus,
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  approved: {
    label: "Approved",
    icon: CheckCircle2,
    className: "bg-success-subtle text-success",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    className: "bg-warning-subtle text-warning",
  },
  rejected: {
    label: "Rejected",
    icon: AlertTriangle,
    className: "bg-primary-subtle text-primary-subtle-foreground",
  },
};

const AUDIENCE_ICON: Record<PostVisibility, LucideIcon> = {
  everyone: Globe,
  alumni: Users,
  students: GraduationCap,
};

export type PostCardContext = "feed" | "my-posts" | "admin";

export interface PostCardAction {
  label: string;
  icon: LucideIcon;
  onClick: (post: PostRecord) => void;
}

interface PostCardProps {
  post: PostRecord;
  context: PostCardContext;
  index?: number;
  onTagClick?: (tag: string) => void;
  onDelete?: (post: PostRecord) => void;
  primaryAction?: PostCardAction;
  secondaryAction?: PostCardAction;
  isHighlighted?: boolean;
}

export const PostCard = ({
  post,
  context,
  index = 0,
  onTagClick,
  onDelete,
  primaryAction,
  secondaryAction,
  isHighlighted = false,
}: PostCardProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const cardRef = useRef<HTMLElement>(null);

  const [likes, setLikes] = useState<string[]>(likeIds(post));
  const [likePending, setLikePending] = useState(false);

  // A card can survive a feed refetch or be recreated from React Query's
  // cached post object after navigation. Keep the optimistic local copy in
  // step with the latest server-backed prop instead of treating the first
  // render as the permanent source of truth.
  useEffect(() => {
    setLikes(likeIds(post));
  }, [post]);

  const liked = !!user?.id && likes.includes(user.id);
  const isOwner = !!user?.id && post.userId?._id === user.id;

  useTrackPostView(cardRef, post._id, isOwner || context !== "feed");

  const comments = post.commentCount ?? 0;
  const status: PostStatus = post.status || "pending";
  const rejected = status === "rejected";
  const pinned = isPostPinned(post);
  const clickable = context === "feed";
  const visibility: PostVisibility = post.visibility || "everyone";
  const AudienceIcon = AUDIENCE_ICON[visibility];

  const attachmentUrls = (post.images || []).map(getPostImageUrl);

  const toggleLike = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (likePending || !user?.id) return;

    const previous = likes;
    setLikePending(true);
    setLikes(liked ? likes.filter((id) => id !== user.id) : [...likes, user.id]);

    try {
      const { data } = await api.post(`/posts/${post._id}/like`);
      if (data.success && Array.isArray(data.likes)) {
        setLikes(data.likes);
        // Recent posts are cached across route changes. Mark every posts query
        // stale so a remounted card cannot resurrect its pre-like payload.
        void queryClient.invalidateQueries({ queryKey: ["posts"] });
      }
    } catch (error) {
      console.error("Error liking post:", error);
      setLikes(previous);
    } finally {
      setLikePending(false);
    }
  };

  const share = async (event: React.MouseEvent) => {
    event.stopPropagation();
    const url = `${window.location.origin}/dashboard/posts/${post._id}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: post.title, url });
        return;
      } catch {
        return; // sheet dismissed
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Could not copy the link");
    }
  };

  const openPost = () => navigate(`/dashboard/posts/${post._id}`);

  const statusPill = STATUS_PILL[status];
  const StatusIcon = statusPill.icon;

  const dateLabel =
    context === "feed"
      ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
      : new Date(post.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });

  return (
    <motion.article
      ref={cardRef}
      id={`post-${post._id}`}
      role={clickable ? "link" : undefined}
      tabIndex={clickable ? 0 : undefined}
      {...blockEntrance(index)}
      whileHover={CARD_HOVER}
      whileTap={clickable ? CARD_TAP : undefined}
      exit={context !== "feed" ? EXIT_BLOCK : undefined}
      transition={SPRING}
      layout={context !== "feed"}
      onClick={clickable ? openPost : undefined}
      onKeyDown={
        clickable
          ? (event) => event.key === "Enter" && openPost()
          : undefined
      }
      className={cn(
        "rounded-card border p-5 shadow-card transition-colors sm:p-6 bg-card",
        pinned ? "border-4 border-primary" : "border-border",
        rejected && context !== "feed" && "bg-accent",
        clickable && !pinned && "cursor-pointer hover:border-primary/25",
        clickable && pinned && "cursor-pointer",
        isHighlighted && "border-4 border-tertiary animate-blink-twice"
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <UserAvatar
            src={post.userId?.profile_picture || undefined}
            name={post.userId?.name ?? "Unknown user"}
            size="md"
          />
          <div className="min-w-0">
            <p className="truncate text-label-md text-foreground">
              {post.userId?.name ?? "Unknown user"}
            </p>
            <p className="text-body-sm text-muted-foreground">{dateLabel}</p>
          </div>
        </div>

        {context !== "feed" && (
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-label-sm uppercase tracking-wide",
              statusPill.className
            )}
          >
            <StatusIcon className="h-3.5 w-3.5" />
            {statusPill.label}
          </span>
        )}
      </div>

      <h3 className="mt-4 line-clamp-2 break-words text-headline-md text-foreground transition-colors hover:text-primary">
        {post.title}
      </h3>

      <div className="mt-1.5">
        <PostMarkdown content={post.content} attachments={attachmentUrls} compact />
      </div>

      {post.images && post.images.length > 0 && (
        <div className="mt-3 max-w-md">
          <PostImages images={post.images} alt={post.title} />
        </div>
      )}

      {rejected && context !== "feed" && (
        <div className="mt-4 rounded-lg border-l-4 border-primary bg-card p-4">
          <p className="mb-1 text-label-md text-foreground">Reviewer Feedback:</p>
          <p className="text-body-sm text-muted-foreground">
            {post.rejection_reason ||
              "No specific reason was given. Review the community guidelines and resubmit."}
          </p>
        </div>
      )}

      {(post.tags || []).length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {post.tags!.map((tag) =>
            onTagClick ? (
              <motion.button
                key={tag}
                type="button"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.94 }}
                transition={SPRING}
                onClick={(event) => {
                  event.stopPropagation();
                  onTagClick(tag);
                }}
                className="ap-chip transition-colors hover:bg-primary-subtle hover:text-primary-subtle-foreground"
              >
                {tag}
              </motion.button>
            ) : (
              <span key={tag} className="ap-chip">
                {tag}
              </span>
            )
          )}
        </div>
      )}

      {context === "admin" && (
        <div className="mt-4 flex flex-wrap items-center gap-6 border-t border-border pt-4 text-body-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Eye className="h-4 w-4 text-primary" />
            <span>Views:</span>
            <span className="font-semibold text-foreground">{post.view_count || 0}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Flag className="h-4 w-4" />
            <span>Reports:</span>
            <span
              className={cn(
                "font-semibold",
                (post.report_count ?? 0) > 0 ? "text-destructive" : "text-foreground"
              )}
            >
              {post.report_count ?? 0}
            </span>
          </div>
        </div>
      )}

      {context === "feed" && (
        <div className="mt-4 flex items-center gap-1 border-t border-border pt-3">
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            transition={SPRING}
            onClick={toggleLike}
            aria-pressed={liked}
            aria-label={liked ? "Remove upvote" : "Upvote post"}
            className={cn(
              "flex items-center gap-2 rounded-full px-3 py-2 text-label-md transition-colors",
              liked
                ? "bg-primary-subtle text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-primary"
            )}
          >
            <motion.span
              key={String(liked)}
              initial={{ scale: 0.6 }}
              animate={{ scale: 1 }}
              transition={SPRING_POP}
              className="flex"
            >
              <ThumbsUp className={cn("h-4 w-4", liked && "fill-current")} />
            </motion.span>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={likes.length}
                initial={{ opacity: 0, y: liked ? 6 : -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: liked ? -6 : 6 }}
                transition={{ duration: 0.15 }}
              >
                {likes.length}
              </motion.span>
            </AnimatePresence>
          </motion.button>

          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            transition={SPRING}
            onClick={(event) => {
              event.stopPropagation();
              openPost();
            }}
            className="flex items-center gap-2 rounded-full px-3 py-2 text-label-md text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
          >
            <MessageSquare className="h-4 w-4" />
            {comments}
            <span className="hidden sm:inline">
              {comments === 1 ? "Comment" : "Comments"}
            </span>
          </motion.button>

          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            transition={SPRING}
            onClick={share}
            className="ml-auto flex items-center gap-2 rounded-full px-3 py-2 text-label-md text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Share</span>
          </motion.button>
        </div>
      )}

      {context === "my-posts" && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
          {status === "approved" ? (
            <div className="flex items-center gap-5 text-body-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Heart className="h-4 w-4" />
                {likes.length}
              </span>
              <span className="flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4" />
                {comments}
              </span>
            </div>
          ) : status === "pending" ? (
            <p className="text-body-sm italic text-muted-foreground">
              Reviewing… an administrator will publish this shortly.
            </p>
          ) : (
            <span />
          )}

          <div className="flex shrink-0 items-center gap-2">
            {status === "approved" && (
              <Button
                variant="outline"
                onClick={openPost}
                className="rounded-full border-primary px-5 text-label-md text-primary hover:bg-primary hover:text-primary-foreground"
              >
                View Post
              </Button>
            )}

            <Button
              variant={rejected ? "outline" : "ghost"}
              onClick={() => navigate(`/dashboard/posts/${post._id}/edit`)}
              className={cn(
                "gap-1.5 rounded-full text-label-md",
                rejected
                  ? "border-primary px-5 text-primary hover:bg-primary hover:text-primary-foreground"
                  : "px-3 text-muted-foreground hover:text-primary"
              )}
            >
              <Pencil className="h-4 w-4" />
              {rejected ? "Edit & Resubmit" : "Edit"}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              aria-label={status === "pending" ? "Withdraw post" : "Delete post"}
              title={status === "pending" ? "Withdraw post" : "Delete post"}
              onClick={() => onDelete?.(post)}
              className="rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {context === "admin" && (primaryAction || secondaryAction) && (
        <div className="mt-4 border-t border-border pt-4">
          <div className="flex flex-wrap gap-2">
            {primaryAction && (
              <Button
                onClick={() => primaryAction.onClick(post)}
                className="bg-primary px-4 py-2 text-primary-foreground hover:bg-primary-hover"
              >
                <primaryAction.icon className="mr-1 h-4 w-4" />
                {primaryAction.label}
              </Button>
            )}
            {secondaryAction && (
              <Button
                onClick={() => secondaryAction.onClick(post)}
                variant="destructive"
                className="px-4 py-2"
              >
                <secondaryAction.icon className="mr-1 h-4 w-4" />
                {secondaryAction.label}
              </Button>
            )}
          </div>

          <div className="mt-3 flex items-center gap-1.5 text-body-sm text-muted-foreground">
            <AudienceIcon className="h-3.5 w-3.5" />
            Visible to: {VISIBILITY_LABELS[visibility]}
          </div>
        </div>
      )}
    </motion.article>
  );
};

export default PostCard;
