import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Flag,
  Info,
  MoreHorizontal,
  Pencil,
  Share2,
  ThumbsUp,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import UserAvatar from "@/components/UserAvatar";
import CommentSection from "@/components/comments/CommentSection";
import PostMarkdown from "@/components/posts/PostMarkdown";
import ReportDialog from "@/components/reports/ReportDialog";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import {
  PostAuthor,
  PostRecord,
  authorHeadline,
  bodyWithoutTitle,
  getPostImageUrl,
  likeIds,
  readingTime,
  toPlainText,
} from "@/lib/posts";
import { apiErrorMessage, cn } from "@/lib/utils";

const SidebarCard = ({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <section
    className={cn(
      "rounded-card border border-border bg-card p-6 shadow-card",
      className
    )}
  >
    {title && <h2 className="ap-overline mb-4 border-b border-border pb-3">{title}</h2>}
    {children}
  </section>
);

export default function ViewPost() {
  const { postId } = useParams<{ postId: string }>();
  const { user } = useAuth();
  const { clearPostNotifications } = useNotifications();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [post, setPost] = useState<PostRecord | null>(null);
  const [similar, setSimilar] = useState<PostRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [likes, setLikes] = useState<string[]>([]);
  const [likePending, setLikePending] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [hasReported, setHasReported] = useState(false);
  const [showAdminQueryMessage, setShowAdminQueryMessage] = useState(false);
  const clearedForPostRef = useRef<string | null>(null);
  const viewedForPostRef = useRef<string | null>(null);

  const isOwner = !!post && post.userId?._id === user?.id;
  const liked = !!user?.id && likes.includes(user.id);

  useEffect(() => {
    if (!postId) return;

    setLoading(true);
    setError(null);

    api
      .get(`/posts/${postId}`)
      .then((res) => {
        if (res.data.success) {
          setPost(res.data.data);
          setLikes(likeIds(res.data.data));
        } else {
          setError(res.data.message || "Failed to load post");
        }
      })
      .catch((err) => {
        console.error("Error fetching post:", err);
        setError(apiErrorMessage(err, "Failed to load post"));
      })
      .finally(() => setLoading(false));

    api
      .get(`/posts/${postId}/similar`)
      .then((res) => {
        if (res.data.success) setSimilar(res.data.data);
      })
      .catch((err) => console.error("Error fetching similar posts:", err));
  }, [postId]);

  // Record a view once per post, but never for the post's own author.
  useEffect(() => {
    if (!postId || !post || post._id !== postId) return;
    if (isOwner) return;
    if (viewedForPostRef.current === postId) return;

    viewedForPostRef.current = postId;
    api.post(`/posts/${postId}/view`).catch((err) => {
      console.error("Failed to record post view:", err);
      viewedForPostRef.current = null; // allow retry on a future visit if this failed
    });
  }, [post, postId, isOwner]);

  // Reading a post clears any notification that pointed at it.
  useEffect(() => {
    if (!postId || !post || post._id !== postId) return;

    const clear = async () => {
      if (
        document.visibilityState !== "visible" ||
        clearedForPostRef.current === postId
      ) {
        return;
      }
      clearedForPostRef.current = postId;
      try {
        await clearPostNotifications(postId);
      } catch (err) {
        clearedForPostRef.current = null;
        console.error("Failed to clear visited post notifications:", err);
      }
    };

    void clear();
    document.addEventListener("visibilitychange", clear);
    return () => document.removeEventListener("visibilitychange", clear);
  }, [clearPostNotifications, post, postId]);

  useEffect(() => {
    if (!post || isOwner) return;
    api
      .get(`/reports/post/${post._id}/check`)
      .then(({ data }) => setHasReported(!!data.hasReported))
      .catch((err) => console.error("Error checking report status:", err));
  }, [post, isOwner]);

  const toggleLike = async () => {
    if (!post || likePending || !user?.id) return;

    const previous = likes;
    setLikePending(true);
    setLikes(liked ? likes.filter((id) => id !== user.id) : [...likes, user.id]);

    try {
      const { data } = await api.post(`/posts/${post._id}/like`);
      if (data.success && Array.isArray(data.likes)) {
        setLikes(data.likes);
        setPost((current) => current ? { ...current, likes: data.likes } : current);
        // The dashboard's recent-posts query may still contain the post state
        // from before this detail view was opened.
        void queryClient.invalidateQueries({ queryKey: ["posts"] });
      }
    } catch (err) {
      console.error("Error toggling like:", err);
      setLikes(previous);
    } finally {
      setLikePending(false);
    }
  };

  const handleShare = async () => {
    if (!post) return;
    const url = `${window.location.origin}/dashboard/posts/${post._id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: toPlainText(post.content).slice(0, 120),
          url,
        });
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

  const handleDelete = async () => {
    if (!post) return;
    try {
      await api.delete(`/posts/${post._id}`);
      toast.success("Post deleted");
      navigate("/dashboard/posts?tab=my");
    } catch (err) {
      console.error("Error deleting post:", err);
      toast.error(apiErrorMessage(err, "Failed to delete post"));
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 pb-12">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-72 w-full rounded-card" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="mx-auto max-w-3xl py-12">
        <EmptyState
          icon={<AlertCircle className="mx-auto h-14 w-14 text-muted-foreground/50" />}
          title="Post not found"
          description={
            error ||
            "This post may have been removed, or it isn't published yet."
          }
          action={
            <Link to="/dashboard/posts">
              <Button className="gap-2 rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary-hover">
                <ArrowLeft className="h-4 w-4" />
                Back to Posts
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  const author: PostAuthor = post.userId ?? { _id: "", name: "Unknown user" };
  const isAdminPost = author.role === "admin";
  const allImages = post.images || [];
  const body = bodyWithoutTitle(post.content, post.title);
  const attachmentUrls = allImages.map(getPostImageUrl);

  // Images the author placed inline via attachment:N already render inside the
  // body — don't repeat them in the gallery underneath.
  const inlineIndexes = new Set(
    [...body.matchAll(/\(attachment:(\d+)\)/g)].map((match) => Number(match[1]) - 1)
  );
  const images = allImages.filter((_, index) => !inlineIndexes.has(index));

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 text-foreground duration-500">
      <div className="mx-auto max-w-7xl pb-12">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-4 flex items-center gap-1 text-body-sm text-muted-foreground"
        >
          <Link to="/dashboard/posts" className="shrink-0 hover:text-primary">
            Posts
          </Link>
          <ChevronRight className="h-4 w-4 shrink-0" />
          <span className="min-w-0 flex-1 line-clamp-1 break-words text-foreground">
            {post.title}
          </span>
        </nav>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Article */}
          <article className="space-y-6 lg:col-span-2">
            <div className="rounded-card border border-border bg-card p-6 shadow-card md:p-8">
              <h1 className="break-words text-headline-lg-mobile text-foreground md:text-headline-xl">
                {post.title}
              </h1>

              {/* Byline */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
                {isAdminPost ? (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setShowAdminQueryMessage((prev) => !prev)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setShowAdminQueryMessage((prev) => !prev);
                      }
                    }}
                    className="group/author flex min-w-0 cursor-pointer items-center gap-3"
                  >
                    <UserAvatar
                      src={author.profile_picture || undefined}
                      name={author.name}
                      size="md"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-label-md text-foreground transition-colors group-hover/author:text-primary">
                        {author.name}
                      </span>
                      <span className="block text-body-sm text-muted-foreground">
                        {new Date(post.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}{" "}
                        • {readingTime(post.content)} min read
                      </span>
                    </span>
                  </div>
                ) : (
                  <Link
                    to={`/dashboard/alumni/${author._id}`}
                    className="group/author flex min-w-0 items-center gap-3"
                  >
                    <UserAvatar
                      src={author.profile_picture || undefined}
                      name={author.name}
                      size="md"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-label-md text-foreground transition-colors group-hover/author:text-primary">
                        {author.name}
                      </span>
                      <span className="block text-body-sm text-muted-foreground">
                        {new Date(post.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}{" "}
                        • {readingTime(post.content)} min read
                      </span>
                    </span>
                  </Link>
                )}

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    aria-pressed={liked}
                    onClick={toggleLike}
                    className={cn(
                      "gap-2 rounded-full px-4 text-label-md",
                      liked
                        ? "border-primary text-primary"
                        : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                    )}
                  >
                    <ThumbsUp className={cn("h-4 w-4", liked && "fill-current")} />
                    {likes.length}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleShare}
                    className="gap-2 rounded-full border-border px-4 text-label-md text-muted-foreground hover:border-primary hover:text-primary"
                  >
                    <Share2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Share</span>
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="More actions"
                        className="rounded-full text-muted-foreground hover:text-primary"
                      >
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {isOwner ? (
                        <>
                          <DropdownMenuItem
                            onClick={() =>
                              navigate(`/dashboard/posts/${post._id}/edit`)
                            }
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit post
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={handleDelete}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete post
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <DropdownMenuItem
                          disabled={hasReported}
                          onClick={() => setReportOpen(true)}
                        >
                          <Flag className="mr-2 h-4 w-4" />
                          {hasReported ? "Already reported" : "Report post"}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Admin Query Message Banner if toggled */}
              {isAdminPost && showAdminQueryMessage && (
                <div className="mt-4 flex flex-col gap-2 rounded-lg border border-warning/40 bg-warning-subtle p-4 text-body-sm text-foreground sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 shrink-0 text-warning" />
                    <span>Got any queries for the admin? You can submit them on the Queries page.</span>
                  </div>
                  <Link
                    to="/dashboard/queries"
                    className="inline-flex shrink-0 items-center gap-1 text-label-sm font-semibold text-primary hover:underline"
                  >
                    Go to Queries →
                  </Link>
                </div>
              )}

              {/* Moderation state — only the author ever sees this */}
              {isOwner && post.status && post.status !== "approved" && (
                <div
                  className={cn(
                    "mt-6 rounded-lg border p-4 text-body-sm",
                    post.status === "pending"
                      ? "border-warning/30 bg-warning-subtle text-foreground"
                      : "border-primary/25 bg-accent text-foreground"
                  )}
                >
                  <p className="mb-1 text-label-md">
                    {post.status === "pending"
                      ? "Pending review"
                      : "Rejected by a reviewer"}
                  </p>
                  <p className="text-muted-foreground">
                    {post.status === "pending"
                      ? "Only you can see this post until an administrator approves it."
                      : post.rejection_reason ||
                        "No specific reason was given. Review the community guidelines and resubmit."}
                  </p>
                </div>
              )}

              {/* Body */}
              <div className="mt-6">
                <PostMarkdown content={body} attachments={attachmentUrls} />
              </div>

              {/* Attached images */}
              {images.length > 0 && (
                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {images.map((image, index) => (
                    <button
                      key={image}
                      type="button"
                      onClick={() => setLightboxIndex(index)}
                      className="group relative overflow-hidden rounded-card border border-border bg-surface-low text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <img
                        src={getPostImageUrl(image)}
                        alt={`Attachment ${index + 1}`}
                        className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Comments */}
            <div
              id="comments"
              className="rounded-card border border-border bg-card p-6 shadow-card md:p-8"
            >
              <CommentSection postId={post._id} />
            </div>
          </article>

          {/* Sidebar */}
          <aside className="space-y-6">
            <SidebarCard title="About the Author">
              <div className="text-center">
                {isAdminPost ? (
                  <div className="inline-block">
                    <UserAvatar
                      src={author.profile_picture || undefined}
                      name={author.name}
                      size="lg"
                      className="mx-auto"
                    />
                  </div>
                ) : (
                  <Link to={`/dashboard/alumni/${author._id}`} className="inline-block">
                    <UserAvatar
                      src={author.profile_picture || undefined}
                      name={author.name}
                      size="lg"
                      className="mx-auto"
                    />
                  </Link>
                )}
                <p className="mt-3 break-words text-headline-md text-foreground">
                  {author.name}
                </p>
                <p className="break-words text-body-sm text-muted-foreground">
                  {authorHeadline(author)}
                </p>
                {author.batch && (
                  <p className="mt-1 text-label-sm text-primary">
                    {author.batch}
                  </p>
                )}
                {author.bio && (
                  <p className="mt-3 break-words text-body-sm text-muted-foreground">
                    {author.bio}
                  </p>
                )}
                {isAdminPost ? (
                  <Link to="/dashboard/queries" className="mt-4 block">
                    <Button
                      variant="outline"
                      className="w-full rounded-full border-border text-label-md text-foreground hover:border-primary hover:text-primary"
                    >
                      Ask a Query
                    </Button>
                  </Link>
                ) : (
                  <Link to={`/dashboard/alumni/${author._id}`} className="mt-4 block">
                    <Button
                      variant="outline"
                      className="w-full rounded-full border-border text-label-md text-foreground hover:border-primary hover:text-primary"
                    >
                      View Profile
                    </Button>
                  </Link>
                )}
              </div>
            </SidebarCard>

            {similar.length > 0 && (
              <SidebarCard title="Similar Posts">
                <ul className="divide-y divide-border">
                  {similar.map((item) => (
                    <li key={item._id} className="py-3 first:pt-0 last:pb-0">
                      <Link
                        to={`/dashboard/posts/${item._id}`}
                        className="group block"
                      >
                        <p className="line-clamp-1 break-words text-label-md text-foreground group-hover:text-primary">
                          {item.title}
                        </p>
                        <p className="mt-1 line-clamp-2 whitespace-pre-line text-body-sm text-muted-foreground">
                          {toPlainText(item.content)}
                        </p>
                        <p className="mt-1 text-body-sm text-muted-foreground">
                          {item.userId?.name ?? "Unknown user"}
                          {item.userId?.batch && `, ${item.userId.batch}`}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </SidebarCard>
            )}

            {(post.tags || []).length > 0 && (
              <SidebarCard title="Topics">
                <div className="flex flex-wrap gap-2">
                  {post.tags!.map((tag) => (
                    <Link
                      key={tag}
                      to={`/dashboard/posts?tag=${encodeURIComponent(tag)}`}
                      className="ap-chip transition-colors hover:bg-primary-subtle hover:text-primary-subtle-foreground"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </SidebarCard>
            )}

            <section className="rounded-card border border-border bg-accent p-6">
              <h2 className="mb-2 flex items-center gap-2 text-headline-md text-primary">
                <Info className="h-5 w-5" />
                Community Guidelines
              </h2>
              <p className="text-body-sm text-muted-foreground">
                Keep discussions professional, respectful, and relevant to the
                academic nature of our alumni network. Constructive debate is
                encouraged.
              </p>
            </section>
          </aside>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && images[lightboxIndex] && (
        <Dialog open onOpenChange={() => setLightboxIndex(null)}>
          <DialogContent className="max-h-[95vh] max-w-[95vw] border-none bg-surface-inverse p-0">
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              aria-label="Close"
              className="absolute right-4 top-4 z-50 rounded-full bg-surface-inverse/70 p-2 text-surface-inverse-foreground hover:bg-surface-inverse"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="relative flex h-[85vh] w-full items-center justify-center">
              <img
                src={getPostImageUrl(images[lightboxIndex])}
                alt={`Attachment ${lightboxIndex + 1}`}
                className="max-h-full max-w-full object-contain"
              />

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Previous image"
                    onClick={() =>
                      setLightboxIndex((lightboxIndex - 1 + images.length) % images.length)
                    }
                    className="absolute left-4 rounded-full bg-surface-inverse/70 p-3 text-surface-inverse-foreground hover:bg-surface-inverse"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next image"
                    onClick={() =>
                      setLightboxIndex((lightboxIndex + 1) % images.length)
                    }
                    className="absolute right-4 rounded-full bg-surface-inverse/70 p-3 text-surface-inverse-foreground hover:bg-surface-inverse"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      <ReportDialog
        postId={post._id}
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        onReportSubmitted={() => setHasReported(true)}
      />
    </div>
  );
}
