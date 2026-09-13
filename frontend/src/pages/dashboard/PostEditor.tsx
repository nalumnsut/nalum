import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Gavel, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import PostComposer, {
  PostComposerHandle,
  PostComposerInitial,
} from "@/components/posts/PostComposer";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { apiErrorMessage } from "@/lib/utils";
import { trackEvent, trackFormSubmit } from "@/lib/analytics";

interface PostEditorProps {
  mode: "create" | "edit";
}

const ALUMNI_AUDIENCE = ["everyone", "alumni"] as const;

export default function PostEditor({ mode }: PostEditorProps) {
  const navigate = useNavigate();
  const { postId } = useParams<{ postId: string }>();
  const { user } = useAuth();
  const composerRef = useRef<PostComposerHandle>(null);

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(mode === "edit");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [initial, setInitial] = useState<PostComposerInitial | undefined>(undefined);

  const canPost = ["alumni", "admin", "faculty"].includes(user?.role ?? "");
  const isAdmin = user?.role === "admin";
  const [isOwnPost, setIsOwnPost] = useState(true);

  useEffect(() => {
    if (mode !== "edit" || !postId) return;

    setLoading(true);
    api
      .get(`/posts/${postId}`)
      .then((res) => {
        if (!res.data.success) {
          setLoadError(res.data.message || "Post not found");
          return;
        }
        const post = res.data.data;
        const ownPost = post.userId?._id === user?.id;
        if (!ownPost && !isAdmin) {
          setLoadError("You can only edit your own posts.");
          return;
        }
        setIsOwnPost(ownPost);
        setInitial({
          title: post.title || "",
          content: post.content || "",
          tags: post.tags || [],
          images: post.images || [],
          visibility: post.visibility || "everyone",
        });
      })
      .catch((error) => {
        console.error("Error loading post:", error);
        setLoadError(apiErrorMessage(error, "Failed to load post"));
      })
      .finally(() => setLoading(false));
  }, [mode, postId, user?.id, isAdmin]);

  const handleSubmit = async () => {
    const formData = composerRef.current?.getFormData();
    if (!formData) return;

    setSaving(true);
    try {
      const hasImages = formData.getAll("images").length > 0;

      if (mode === "edit") {
        const editEndpoint = isAdmin ? `/admin/posts/${postId}` : `/posts/${postId}`;
        await api.put(editEndpoint, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success(
          isAdmin ? "Post updated" : "Post updated — it will reappear once reviewed"
        );
        trackFormSubmit("edit_post", { has_images: hasImages });
      } else {
        await api.post("/posts", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Post submitted for review");
        trackFormSubmit("create_post", { has_images: hasImages });
      }

      navigate(
        isAdmin && !isOwnPost ? "/admin-panel/current-posts" : "/dashboard/posts?tab=my"
      );
    } catch (error) {
      console.error("Error saving post:", error);
      trackEvent(mode === "edit" ? "edit_post_error" : "create_post_error");
      toast.error(apiErrorMessage(error, "Failed to save post"));
    } finally {
      setSaving(false);
    }
  };

  if (!canPost) {
    return (
      <div className="mx-auto max-w-3xl py-12">
        <EmptyState
          icon={<Info className="mx-auto h-14 w-14 text-muted-foreground/50" />}
          title="Posting is limited for now"
          description="Publishing to the community feed is currently open to alumni and faculty."
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

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl py-12">
        <EmptyState
          icon={<Info className="mx-auto h-14 w-14 text-muted-foreground/50" />}
          title="Can't edit this post"
          description={loadError}
          action={
            <Link to="/dashboard/posts?tab=my">
              <Button className="gap-2 rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary-hover">
                <ArrowLeft className="h-4 w-4" />
                Back to My Posts
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 text-foreground duration-500">
      <div className="mx-auto max-w-7xl pb-12">
        <div className="mb-8 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              to="/dashboard/posts"
              className="mb-2 inline-flex items-center gap-2 text-body-sm text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Posts
            </Link>
            <h1 className="text-headline-lg-mobile text-primary md:text-headline-xl">
              {mode === "edit" ? "Edit Post" : "Create Post"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={saving}
              className="rounded-full border-border px-5 text-label-md text-muted-foreground hover:border-primary hover:text-primary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="gap-2 rounded-full bg-primary px-6 text-label-md text-primary-foreground hover:bg-primary-hover"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "edit" ? "Resubmit Post" : "Publish Post"}
            </Button>
          </div>
        </div>

        <PostComposer
          ref={composerRef}
          mode={mode}
          initial={initial}
          audienceOptions={
            isAdmin ? ["everyone", "alumni", "students"] : [...ALUMNI_AUDIENCE]
          }
          sidebar={
            <>
              <section className="rounded-card border border-border bg-accent p-6">
                <h2 className="mb-3 flex items-center gap-2 text-headline-md text-primary">
                  <Gavel className="h-5 w-5" />
                  Community Guidelines
                </h2>
                <p className="text-body-sm text-muted-foreground">
                  Keep it professional. Posts using offensive language, or promoting
                  a product or service outright, are removed during review — reframe
                  promotional material as a case study or lesson learned. Repeat
                  violations can cost you posting privileges.
                </p>
              </section>

              <section className="rounded-card border border-border bg-card p-6 shadow-card">
                <h2 className="mb-3 flex items-center gap-2 text-headline-md text-foreground">
                  <Info className="h-5 w-5 text-muted-foreground" />
                  Before you publish
                </h2>
                <ul className="space-y-2 text-body-sm text-muted-foreground">
                  <li>• Every post is reviewed by an administrator before it goes live.</li>
                  <li>• Markdown is supported — headings, lists, quotes and links.</li>
                  <li>• Type @ in the body to mention another alum.</li>
                </ul>
              </section>
            </>
          }
        />
      </div>
    </div>
  );
}
