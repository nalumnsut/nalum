import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import AdminLayout from "../../components/admin/AdminLayout";
import { Button } from "../../components/ui/button";
import { EmptyState } from "../../components/ui/EmptyState";
import PostComposer, {
  PostComposerHandle,
  PostComposerInitial,
} from "../../components/posts/PostComposer";
import api from "../../lib/api";
import { apiErrorMessage } from "../../lib/utils";

interface AdminPostEditorProps {
  mode: "create" | "edit";
}

const AdminPostEditor = ({ mode }: AdminPostEditorProps) => {
  const navigate = useNavigate();
  const { postId } = useParams<{ postId: string }>();
  const composerRef = useRef<PostComposerHandle>(null);

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(mode === "edit");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [initial, setInitial] = useState<PostComposerInitial | undefined>(undefined);

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
  }, [mode, postId]);

  const handleSubmit = async () => {
    const formData = composerRef.current?.getFormData();
    if (!formData) return;

    setSaving(true);
    try {
      if (mode === "edit") {
        await api.put(`/admin/posts/${postId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Post updated");
      } else {
        await api.post("/posts", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Post created");
      }

      navigate("/admin-panel/current-posts");
    } catch (error) {
      console.error("Error saving post:", error);
      toast.error(apiErrorMessage(error, "Failed to save post"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      {loading ? (
        <div className="flex justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : loadError ? (
        <EmptyState
          title="Can't edit this post"
          description={loadError}
          action={
            <Button
              onClick={() => navigate("/admin-panel/current-posts")}
              className="gap-2 rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary-hover"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Current Posts
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <button
                onClick={() => navigate("/admin-panel/current-posts")}
                className="mb-2 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Current Posts
              </button>
              <h1 className="text-3xl font-bold text-gray-900">
                {mode === "edit" ? "Edit Post" : "Create Post"}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => navigate("/admin-panel/current-posts")}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={saving} className="gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === "edit" ? "Save Changes" : "Publish Post"}
              </Button>
            </div>
          </div>

          <PostComposer
            ref={composerRef}
            mode={mode}
            initial={initial}
            audienceOptions={["everyone", "alumni", "students"]}
            enableSpecialMentions={mode === "create"}
          />
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminPostEditor;
