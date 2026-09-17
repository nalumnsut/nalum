import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { FileText, Loader2, PenSquare, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import PostCard from "@/components/posts/PostCard";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { SPRING, chipEntrance, popVariants } from "@/lib/motion";
import { PostRecord, PostStatus, toPlainText } from "@/lib/posts";
import { apiErrorMessage, cn } from "@/lib/utils";

type Bucket = "all" | PostStatus;

const FILTERS: { value: Bucket; label: string }[] = [
  { value: "all", label: "All Posts" },
  { value: "approved", label: "Approved" },
  { value: "pending", label: "Pending" },
  { value: "rejected", label: "Rejected" },
];

interface MyPostsPanelProps {
  /** Trims the chrome for the profile page, which supplies its own heading. */
  embedded?: boolean;
  /** Page-level CTA, rendered at the right of the filter row. */
  action?: ReactNode;
}

// The "My Posts" half of the Posts page: the author's own submissions and the
// approval state of each.
export const MyPostsPanel = ({ embedded, action }: MyPostsPanelProps) => {
  const { user } = useAuth();

  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Bucket>("all");
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<PostRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const canPost = ["alumni", "admin", "faculty"].includes(user?.role ?? "");

  const fetchMyPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get("/posts/my/all");
      setPosts(data.data.posts);
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError(apiErrorMessage(err, "Failed to load your posts"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canPost) {
      setLoading(false);
      return;
    }
    fetchMyPosts();
  }, [canPost, fetchMyPosts]);

  const counts = useMemo(
    () =>
      posts.reduce<Record<string, number>>((acc, post) => {
        const status = post.status || "pending";
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {}),
    [posts]
  );

  // The list is small (the endpoint returns everything), so both the status
  // filter and the search run locally.
  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return posts.filter((post) => {
      if (filter !== "all" && (post.status || "pending") !== filter) return false;
      if (!term) return true;
      return (
        post.title.toLowerCase().includes(term) ||
        toPlainText(post.content).toLowerCase().includes(term) ||
        (post.tags || []).some((tag) => tag.toLowerCase().includes(term))
      );
    });
  }, [posts, filter, search]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/posts/${deleteTarget._id}`);
      setPosts((prev) => prev.filter((post) => post._id !== deleteTarget._id));
      toast.success(
        deleteTarget.status === "pending" ? "Post withdrawn" : "Post deleted"
      );
      setDeleteTarget(null);
    } catch (err) {
      console.error("Error deleting post:", err);
      toast.error(apiErrorMessage(err, "Failed to delete post"));
    } finally {
      setDeleting(false);
    }
  };

  if (!canPost) {
    return (
      <EmptyState
        icon={<FileText className="mx-auto h-14 w-14 text-muted-foreground/50" />}
        title="Posting is limited for now"
        description="Publishing to the community feed is currently open to alumni and faculty."
      />
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={<FileText className="mx-auto h-14 w-14 text-muted-foreground/50" />}
        title="Couldn't load your posts"
        description={error}
        action={
          <Button
            onClick={fetchMyPosts}
            className="rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary-hover"
          >
            Try again
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {embedded && (
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-headline-md text-foreground">My Posts</h2>
          <Link to="/dashboard/posts/new">
            <Button className="gap-2 rounded-full bg-primary px-4 text-label-md text-primary-foreground hover:bg-primary-hover">
              <PenSquare className="h-4 w-4" />
              Write
            </Button>
          </Link>
        </div>
      )}

      {!embedded && (
        <>
          <div className="flex items-center gap-3">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search your posts…"
                className="h-12 w-full rounded-full border border-border bg-card pl-12 pr-12 text-body-md text-foreground shadow-card placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <AnimatePresence>
                {search && (
                  // `y: "-50%"` in motion values, not a Tailwind translate —
                  // framer owns `transform` once scale animates.
                  <motion.button
                    type="button"
                    style={{ y: "-50%" }}
                    variants={popVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    whileTap={{ scale: 0.85 }}
                    transition={SPRING}
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                    className="absolute right-4 top-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {action}
          </div>

          <div className="flex flex-wrap gap-2">
            {FILTERS.map(({ value, label }, index) => {
              const count = value === "all" ? posts.length : counts[value] || 0;
              return (
                <motion.button
                  key={value}
                  type="button"
                  {...chipEntrance(index)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  transition={SPRING}
                  onClick={() => setFilter(value)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-label-md transition-colors",
                    filter === value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary hover:text-primary"
                  )}
                >
                  {label}
                  {count > 0 && <span className="ml-1.5 opacity-70">{count}</span>}
                </motion.button>
              );
            })}
          </div>
        </>
      )}

      {visible.length === 0 ? (
        <EmptyState
          icon={<FileText className="mx-auto h-14 w-14 text-muted-foreground/50" />}
          title={posts.length === 0 ? "No posts yet" : "Nothing in this filter"}
          description={
            posts.length === 0
              ? "Share an update, a lesson learned, or a call for collaborators with the network."
              : "Try a different status or clear your search."
          }
          action={
            posts.length === 0 ? (
              <Link to="/dashboard/posts/new">
                <Button className="gap-2 rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary-hover">
                  <PenSquare className="h-4 w-4" />
                  Write your first post
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        // Keyed on the filter so switching buckets re-runs the cascade;
        // AnimatePresence lets a deleted post leave and the rest close up.
        <div key={filter} className="space-y-4">
          <AnimatePresence>
            {visible.map((post, index) => (
              <PostCard
                key={post._id}
                context="my-posts"
                post={post}
                index={index}
                onDelete={setDeleteTarget}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {deleteTarget?.status === "pending" ? "Withdraw post" : "Delete post"}
            </DialogTitle>
            <DialogDescription>
              {deleteTarget?.status === "pending"
                ? `“${deleteTarget?.title}” will be pulled from the review queue. This cannot be undone.`
                : `“${deleteTarget?.title}” will be removed for everyone. This cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 flex gap-3">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
              className="flex-1"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing…
                </>
              ) : deleteTarget?.status === "pending" ? (
                "Withdraw"
              ) : (
                "Delete"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyPostsPanel;
