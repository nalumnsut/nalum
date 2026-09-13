import { useQuery } from "@tanstack/react-query";
import { MessagesSquare } from "lucide-react";
import { PreloadLink } from "@/components/PreloadLink";
import PostCard from "@/components/posts/PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { PostRecord } from "@/lib/posts";

const LIMIT = 5;

const RowSkeleton = () => (
  <div className="space-y-2.5 py-3">
    <div className="flex items-center gap-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-full" />
  </div>
);

export const RecentPostsCard = () => {
  const { data: posts = [], isLoading, isError } = useQuery({
    queryKey: ["posts", "recent", LIMIT],
    queryFn: async (): Promise<PostRecord[]> => {
      const { data } = await api.get(`/posts?page=1&limit=${LIMIT}`);
      return data?.data?.posts ?? [];
    },
    staleTime: 60 * 1000,
  });

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4 border-b border-border pb-3">
        <h2 className="text-headline-md text-foreground">Recent Posts</h2>
        <PreloadLink
          to="/dashboard/posts"
          className="shrink-0 text-label-md text-primary transition-colors hover:text-primary-hover"
        >
          View all
        </PreloadLink>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div className="divide-y divide-border rounded-card border border-border bg-card px-4">
            <RowSkeleton />
            <RowSkeleton />
            <RowSkeleton />
          </div>
        ) : isError || posts.length === 0 ? (
          <div className="rounded-card border border-border bg-card py-10 text-center">
            <MessagesSquare className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
            <h3 className="text-headline-md text-foreground">
              {isError ? "Couldn't load posts" : "No posts yet"}
            </h3>
            <p className="mt-1 text-body-sm text-muted-foreground">
              {isError
                ? "Try again in a moment."
                : "Be the first to share an update with the alumni network."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post, index) => (
              <PostCard key={post._id} context="feed" post={post} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentPostsCard;
