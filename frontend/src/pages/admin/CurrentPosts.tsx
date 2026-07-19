import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import { FileText, RefreshCw, Search, Filter, Edit, Trash2, PlusCircle } from "lucide-react";
import api from "../../lib/api";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { toast } from "sonner";
import PostCardAdmin, { Post } from "../../components/posts/PostCardAdmin";
import AdminCreatePostModal from "../../components/posts/AdminCreatePostModal";
import EditPostModal from "../../components/posts/EditPostModal";

const CurrentPosts = () => {
  const location = useLocation();
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [approvalMode, setApprovalMode] = useState(0);
  const [togglingApproval, setTogglingApproval] = useState(false);
  const [highlightPostId, setHighlightPostId] = useState<string | null>(null);

  const [createPostModalOpen, setCreatePostModalOpen] = useState(false);

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchPosts();
    fetchApprovalMode();

    if (location.state?.highlightPostId) {
      setHighlightPostId(location.state.highlightPostId);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      filterPosts();
    }, 500);
    return () => clearTimeout(timer);
  }, [posts, searchTerm, statusFilter]);

  useEffect(() => {
    if (highlightPostId && filteredPosts.length > 0) {
      setTimeout(() => {
        const element = document.getElementById(`post-${highlightPostId}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(() => {
            setHighlightPostId(null);
          }, 3000);
        }
      }, 100);
    }
  }, [highlightPostId, filteredPosts]);

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
    setIsLoading(true);
    try {
      const response = await api.get("/admin/posts/all", {
        params: { page: 1, limit: 100 },
      });
      if (response.data.success) {
        setPosts(response.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch posts:", err);
      toast.error("Failed to load posts");
    } finally {
      setIsLoading(false);
    }
  };

  const filterPosts = () => {
    let filtered = [...posts];
    if (searchTerm) {
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.userId.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((post) => post.status === statusFilter);
    }
    setFilteredPosts(filtered);
  };

  const handleEditClick = (post: Post) => {
    setSelectedPost(post);
    setEditModalOpen(true);
  };

  // MISSING FUNCTION WAPAS LAYA! (Admin Route Handle Karega)
  const handleAdminEditSubmit = async (formData: FormData) => {
    if (!selectedPost) return;
    try {
      await api.put(`/admin/posts/${selectedPost._id}`, {
        title: formData.get("title") as string,
        content: formData.get("content") as string,
      });
      // Note: Admin route currently doesn't support image updates in this API call format
      // if it does, you'd send the full formData instead of extracting title/content.
    } catch (error: any) {
      throw error; // Re-throw so the modal can show the error toast
    }
  };

  const handleDeleteClick = (post: Post) => {
    setPostToDelete(post);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!postToDelete) return;
    setDeleting(true);
    try {
      const response = await api.delete(`/admin/posts/${postToDelete._id}`);
      if (response.data.success) {
        toast.success("Post deleted successfully!");
        setDeleteDialogOpen(false);
        setPostToDelete(null);
        fetchPosts();
      }
    } catch (err: any) {
      console.error("Failed to delete post:", err);
      toast.error(err.response?.data?.message || "Failed to delete post");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Current Posts</h1>
            <p className="text-gray-600 mt-2">
              {filteredPosts.length} post{filteredPosts.length !== 1 && "s"} found
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
                  togglingApproval ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
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
            <Button
              onClick={() => setCreatePostModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <PlusCircle size={18} />
              Create Post
            </Button>
            <Button
              onClick={fetchPosts}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search" className="flex items-center gap-2 mb-2">
                <Search size={16} />
                Search
              </Label>
              <Input
                id="search"
                placeholder="Search by title or author..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="status-filter" className="flex items-center gap-2 mb-2">
                <Filter size={16} />
                Status
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Posts List */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <RefreshCw className="mx-auto text-gray-400 mb-4 animate-spin" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loading posts...</h3>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
            <p className="text-gray-600">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredPosts.map((post) => (
              <PostCardAdmin
                key={post._id}
                post={post}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
                primaryButtonLabel="Edit"
                secondaryButtonLabel="Delete"
                primaryButtonIcon={Edit}
                secondaryButtonIcon={Trash2}
                isHighlighted={post._id === highlightPostId}
              />
            ))}
          </div>
        )}

        {/* Edit Post Modal */}
        <EditPostModal
          open={editModalOpen}
          post={selectedPost as any}
          userName={selectedPost?.userId?.name}
          userAvatar={selectedPost?.userId?.profile_picture}
          customSubmit={handleAdminEditSubmit} // WAPAS BHEJ DIYA VIP PASS!
          onClose={() => {
            setEditModalOpen(false);
            setSelectedPost(null);
          }}
          onPostUpdated={fetchPosts}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Post</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-gray-500 mt-2">
              Are you sure you want to delete "{postToDelete?.title}"? This action cannot be undone.
            </p>
            <div className="flex gap-3 mt-4">
              <Button
                onClick={() => setDeleteDialogOpen(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700"
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Post Modal */}
        <AdminCreatePostModal
          open={createPostModalOpen}
          onClose={() => setCreatePostModalOpen(false)}
          onPostCreated={fetchPosts}
        />
      </div>
    </AdminLayout>
  );
};

export default CurrentPosts;