import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { Check, XCircle, RefreshCw, FileText } from "lucide-react";
import api from "../../lib/api";
import PostCard from "../../components/posts/PostCard";
import { PostRecord } from "../../lib/posts";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

const PostsApproval = () => {
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<PostRecord | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvalMode, setApprovalMode] = useState(0); // 0=Manual, 1=Auto
  const [togglingApproval, setTogglingApproval] = useState(false);

  useEffect(() => {
    fetchPosts();
    fetchApprovalMode();

    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      fetchPosts();
    }, 10000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  const fetchApprovalMode = async () => {
    try {
      const response = await api.get("/admin/posts/settings/approval-status");
      if (response.data.success) {
        setApprovalMode(response.data.data.mode);
      }
    } catch (err) {
      console.error("Failed to fetch approval mode:", err);
    }
  };

  const toggleApprovalMode = async () => {
    setTogglingApproval(true);
    try {
      const newMode = approvalMode === 1 ? 0 : 1;
      await api.post("/admin/posts/settings/toggle-approval", {
        mode: newMode,
      });
      setApprovalMode(newMode);
      toast.success(
        `Post approval mode changed to ${newMode === 1 ? "Auto" : "Manual"}`
      );
    } catch (err) {
      console.error("Failed to toggle approval mode:", err);
      toast.error("Failed to toggle post approval mode");
    } finally {
      setTogglingApproval(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await api.get("/admin/posts/pending");
      if (response.data.success) {
        setPosts(response.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch pending posts:", err);
      toast.error("Failed to load pending posts");
    } finally {
      setIsLoading(false);
    }
  };

  // Manual refresh function

  const handleApproveClick = (post: PostRecord) => {
    setSelectedPost(post);
    // Open approve dialog or call approve logic
    handleApprove(post._id);
  };

  const handleRejectClick = (post: PostRecord) => {
    setSelectedPost(post);
    setShowRejectModal(true);
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await fetchPosts();
  };

  const handleApprove = async (postId: string) => {
    try {
      const response = await api.put(`/admin/posts/${postId}/approve`);
      if (response.data.success) {
        setPosts((prev) => prev.filter((p) => p._id !== postId));
        toast.success("Post approved successfully!");
      }
    } catch (err) {
      console.error("Failed to approve post:", err);
      toast.error(err.response?.data?.message || "Failed to approve post");
    }
  };

  const handleRejectSubmit = async () => {
    if (!selectedPost || !rejectReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.put(
        `/admin/posts/${selectedPost._id}/reject`,
        {
          reason: rejectReason,
        }
      );
      if (response.data.success) {
        setPosts((prev) => prev.filter((p) => p._id !== selectedPost._id));
        setShowRejectModal(false);
        setRejectReason("");
        setSelectedPost(null);
        toast.success("Post rejected successfully");
      }
    } catch (err) {
      console.error("Failed to reject post:", err);
      toast.error(err.response?.data?.message || "Failed to reject post");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && posts.length === 0) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Post Approvals
              </h1>
              <Skeleton className="h-4 w-48 mt-2" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>

          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <Skeleton className="h-8 w-3/4 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Post Approvals</h1>
            <p className="text-gray-600 mt-2">
              {posts.length} pending post{posts.length !== 1 && "s"}
              <span className="text-xs text-gray-500 ml-2">
                • Auto-refreshes every 10s
              </span>
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 pr-4 border-r border-gray-300">
              <span className="text-sm font-medium text-gray-700">
                Post Approval Mode
              </span>
              <button
                onClick={toggleApprovalMode}
                disabled={togglingApproval}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  approvalMode === 1 ? "bg-green-600" : "bg-orange-500"
                } ${
                  togglingApproval
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    approvalMode === 1 ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span
                className={`text-xs font-medium ${
                  approvalMode === 1 ? "text-green-600" : "text-orange-600"
                }`}
              >
                {approvalMode === 1 ? "Auto" : "Manual"}
              </span>
            </div>

            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              title="Refresh now"
            >
              <RefreshCw
                size={18}
                className={isLoading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No pending posts
            </h3>
            <p className="text-gray-600">All posts have been processed.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {posts.map((post, index) => (
              <PostCard
                key={post._id}
                context="admin"
                post={post}
                index={index}
                primaryAction={{ label: "Approve", icon: Check, onClick: handleApproveClick }}
                secondaryAction={{ label: "Reject", icon: XCircle, onClick: handleRejectClick }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Post</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this post. This will be
              visible to the author.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="min-h-[120px]"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectModal(false);
                setRejectReason("");
                setSelectedPost(null);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectSubmit}
              disabled={isSubmitting || !rejectReason.trim()}
            >
              {isSubmitting ? "Rejecting..." : "Reject Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default PostsApproval;
