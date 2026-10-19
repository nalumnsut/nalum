import { ReactNode, useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, MessagesSquare, Search, X } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { SmartPagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import PostCard from "@/components/posts/PostCard";
import api from "@/lib/api";
import { SPRING, chipEntrance, popVariants, switchVariants } from "@/lib/motion";
import { PostRecord } from "@/lib/posts";
import { apiErrorMessage, cn } from "@/lib/utils";

const PAGE_SIZE = 10;

const RowSkeleton = () => (
  <div className="space-y-4 rounded-card border border-border bg-card p-6 shadow-card">
    <div className="flex items-center gap-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-40" />
      </div>
    </div>
    <Skeleton className="h-6 w-3/4" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-9 w-56" />
  </div>
);

interface CommunityPostsPanelProps {
  /** Hides the search field and tag chips — used by compact embeds. */
  minimal?: boolean;
  /** Pre-selected topic, e.g. arriving from a post's Topics card. */
  initialTag?: string;
  /** Page-level CTA, rendered at the right of the filter row. */
  action?: ReactNode;
}

// The "All Posts" half of the Posts page: everything the network has published,
// filterable by tag and searchable by title, tag or author.
export const CommunityPostsPanel = ({
  minimal,
  initialTag = "",
  action,
}: CommunityPostsPanelProps) => {
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [activeTag, setActiveTag] = useState(initialTag);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce the search box so every keystroke doesn't hit the API.
  useEffect(() => {
    const handle = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(handle);
  }, [search]);

  useEffect(() => {
    if (minimal) return;
    api
      .get("/posts/tags")
      .then((res) => {
        if (res.data.success) {
          setTags(res.data.data.map((entry: { tag: string }) => entry.tag));
        }
      })
      .catch((err) => console.error("Error fetching tags:", err));
  }, [minimal]);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Search has its own endpoint and returns a flat, unpaginated list.
      const endpoint = query
        ? `/posts/search?query=${encodeURIComponent(query)}`
        : `/posts?page=${page}&limit=${PAGE_SIZE}${
            activeTag ? `&tag=${encodeURIComponent(activeTag)}` : ""
          }`;

      const { data } = await api.get(endpoint);

      if (query) {
        const results: PostRecord[] = Array.isArray(data.data)
          ? data.data
          : data.data.posts;
        setPosts(
          activeTag
            ? results.filter((post) =>
                (post.tags || []).some(
                  (tag) => tag.toLowerCase() === activeTag.toLowerCase()
                )
              )
            : results
        );
        setTotalPages(1);
      } else {
        setPosts(data.data.posts);
        setTotalPages(data.data.pagination?.pages || 1);
      }
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError(apiErrorMessage(err, "Failed to load posts"));
    } finally {
      setLoading(false);
    }
  }, [query, page, activeTag]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const selectTag = (tag: string) => {
    setActiveTag((current) => (current === tag ? "" : tag));
    setPage(1);
  };

  // A tag arriving from a deep link (or a rarely-used one clicked on a row)
  // won't be in the popular list, so surface it alongside them.
  const chipTags =
    activeTag &&
    !tags.some((tag) => tag.toLowerCase() === activeTag.toLowerCase())
      ? [activeTag, ...tags]
      : tags;

  return (
    <div className="space-y-6">
      {!minimal && (
        <>
          {/* Search — the page CTA rides along so it never sits on a row of
              its own before the network has started tagging posts. */}
          <div className="flex items-center gap-3">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search posts, topics, or alumni…"
                className="h-12 w-full rounded-full border border-border bg-card pl-12 pr-12 text-body-md text-foreground shadow-card placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <AnimatePresence>
                {search && (
                  // `y: "-50%"` rather than Tailwind's `-translate-y-1/2`:
                  // framer writes the whole `transform`, so a class-based
                  // translate would be dropped the moment scale animates.
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

          {/* Tag chips — whatever the network is actually posting about */}
          {chipTags.length > 0 && (
            // Chips arrive after /posts/tags resolves, so they cascade in
            // rather than popping the layout open all at once.
            <div className="flex flex-wrap gap-2">
              <motion.button
                type="button"
                {...chipEntrance(0)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                transition={SPRING}
                onClick={() => {
                  setActiveTag("");
                  setPage(1);
                }}
                className={cn(
                  "rounded-full border px-4 py-2 text-label-md transition-colors",
                  activeTag === ""
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary hover:text-primary"
                )}
              >
                All
              </motion.button>
              {chipTags.map((tag, index) => (
                <motion.button
                  key={tag}
                  type="button"
                  {...chipEntrance(index + 1)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  transition={SPRING}
                  onClick={() => selectTag(tag)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-label-md transition-colors",
                    activeTag.toLowerCase() === tag.toLowerCase()
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary hover:text-primary"
                  )}
                >
                  {tag}
                </motion.button>
              ))}
            </div>
          )}
        </>
      )}

      {loading ? (
        <div className="space-y-4">
          <RowSkeleton />
          <RowSkeleton />
          <RowSkeleton />
        </div>
      ) : error ? (
        <EmptyState
          icon={<MessagesSquare className="mx-auto h-14 w-14 text-muted-foreground/50" />}
          title="Couldn't load posts"
          description={error}
        />
      ) : posts.length === 0 ? (
        <EmptyState
          icon={<MessagesSquare className="mx-auto h-14 w-14 text-muted-foreground/50" />}
          title={query || activeTag ? "No matching posts" : "No posts yet"}
          description={
            query || activeTag
              ? "Try a different search term or clear the topic filter."
              : "Be the first to share an update with the alumni network."
          }
        />
      ) : (
        <>
          {/* Keyed on what produced the list, so changing page, tag or query
              remounts the rows and re-runs the cascade — otherwise they would
              swap silently and the filter would feel unresponsive. */}
          <div key={`${page}-${activeTag}-${query}`} className="space-y-4">
            {posts.map((post, index) => (
              <PostCard
                key={post._id}
                context="feed"
                post={post}
                index={index}
                onTagClick={selectTag}
              />
            ))}
          </div>

          {!query && totalPages > 1 && (
            <div className="pt-4">
              <SmartPagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(next) => {
                  setPage(next);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </div>
          )}
        </>
      )}

      {/* Keeps the search spinner honest while a debounced query settles */}
      <AnimatePresence>
        {search !== query && (
          <motion.p
            variants={switchVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex items-center justify-center gap-2 text-body-sm text-muted-foreground"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            Searching…
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CommunityPostsPanel;
