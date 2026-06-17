import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import UserAvatar from "@/components/UserAvatar";
import { ArrowLeft, Calendar, Share2, Loader2, AlertCircle, ChevronLeft, ChevronRight, X } from "lucide-react";
import { BASE_URL } from "@/lib/constants";
import { toast } from "sonner";
import { parseFormattedText } from "@/lib/textFormatting";
import CommentSection from "@/components/comments/CommentSection";

interface Post {
  _id: string;
  title: string;
  content: string;
  images?: string[];
  userId: {
    _id: string;
    name: string;
    email: string;
    role: string;
    profile_picture?: string;
  };
  status: "pending" | "approved" | "rejected";
  rejection_reason?: string;
  createdAt: string;
  updatedAt: string;
}

const ViewPost = () => {
  const { postId } = useParams<{ postId: string }>();
  const { accessToken, user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    if (!postId) return;

    try {
      setIsLoading(true);
      setError(null);
      const { data } = await api.get(`/posts/${postId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (data.success) {
        setPost(data.data);
      } else {
        setError(data.message || "Failed to load post");
      }
    } catch (err: any) {
      console.error("Error fetching post:", err);
      setError(err.response?.data?.message || "Failed to load post");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    const postUrl = `${window.location.origin}/dashboard/posts/${postId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          text: post?.content?.substring(0, 100) + "...",
          url: postUrl,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(postUrl);
      toast.success("Link Copied!", {
        description: "Post link copied to clipboard",
      });
    }
  };

  const getImageUrl = (imagePath: string) => {
    if (imagePath.startsWith("http")) return imagePath;
    return `${BASE_URL}/uploads/posts/${imagePath}`;
  };

  const goToNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === (post?.images?.length || 0) - 1 ? 0 : prev + 1
    );
  };

  const goToPreviousImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? (post?.images?.length || 0) - 1 : prev - 1
    );
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  const handleImageClick = () => {
    if (post?.images && post.images[currentImageIndex]) {
      setSelectedImage(getImageUrl(post.images[currentImageIndex]));
    }
  };

  const isOwner = post?.userId._id === user?.id;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-black">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading post...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-black p-4">
        <Card className="max-w-md w-full bg-slate-900/50 border-red-900/30">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Post Not Found</h2>
            <p className="text-gray-400 mb-6">
              {error || "The post you're looking for doesn't exist or you don't have permission to view it."}
            </p>
            <Button
              onClick={() => navigate("/dashboard")}
              className="bg-[#800000] hover:bg-[#600000] text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-black">
      {/* Background Effects */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]" />
      </div>

      <div className="relative z-10 container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-4xl">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-white hover:bg-white/5 mb-2 sm:mb-4 -ml-2 sm:ml-0 touch-manipulation"
          >
            <ArrowLeft className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
            <span className="text-base sm:text-sm">Back</span>
          </Button>
        </div>

        {/* Post Card */}
        <Card className="bg-slate-900/50 border-white/10 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-6 md:p-8">
            {/* Post Header */}
            <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-white/10">
              <Link to={`/dashboard/alumni/${post.userId._id}`} className="flex-shrink-0">
                <UserAvatar
                  src={post.userId.profile_picture}
                  name={post.userId.name}
                  className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 border-2 border-slate-700 hover:border-[#800000] transition-colors cursor-pointer touch-manipulation"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <Link
                  to={`/dashboard/alumni/${post.userId._id}`}
                  className="hover:underline touch-manipulation"
                >
                  <h3 className="font-semibold text-white text-base sm:text-lg line-clamp-2">
                    {post.userId.name}
                  </h3>
                </Link>
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-400 mt-1">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate">{new Date(post.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric"
                  })}</span>
                </div>
                {post.status !== "approved" && (
                  <Badge
                    variant="outline"
                    className={`mt-2 text-xs ${
                      post.status === "pending"
                        ? "border-yellow-500 text-yellow-500"
                        : "border-red-500 text-red-500"
                    }`}
                  >
                    {post.status}
                  </Badge>
                )}
              </div>
              {isOwner && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/dashboard/my-posts")}
                  className="border-white/10 text-gray-300 hover:bg-white/10 text-xs sm:text-sm shrink-0 touch-manipulation h-8 sm:h-9 px-2 sm:px-3"
                >
                  <span className="hidden sm:inline">Edit Post</span>
                  <span className="sm:hidden">Edit</span>
                </Button>
              )}
            </div>

            {/* Post Content */}
            <div className="mb-4 sm:mb-6">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 sm:mb-4 leading-tight">
                {post.title}
              </h1>
              <div className="text-sm sm:text-base text-gray-300 whitespace-pre-wrap leading-relaxed space-y-1">
                {parseFormattedText(post.content)}
              </div>
            </div>

            {/* Post Images */}
            {post.images && post.images.length > 0 && (
              <div className="mb-4 sm:mb-6 relative -mx-4 sm:mx-0">
                {/* Progress Indicators - Only show if multiple images */}
                {post.images.length > 1 && (
                  <div className="absolute top-2 sm:top-3 left-1/2 transform -translate-x-1/2 z-10 flex gap-1 sm:gap-1.5">
                    {post.images.map((_, index) => (
                      <div
                        key={index}
                        onClick={() => goToImage(index)}
                        className={`h-1 sm:h-0.5 rounded-full cursor-pointer transition-all duration-300 touch-manipulation ${
                          index === currentImageIndex
                            ? "bg-white w-6 sm:w-8"
                            : "bg-white/50 w-6 sm:w-8 hover:bg-white/70"
                        }`}
                      />
                    ))}
                  </div>
                )}

                {/* Image Container */}
                <div
                  className="relative overflow-hidden sm:rounded-lg border-y sm:border border-white/10 group cursor-pointer touch-manipulation"
                  onClick={handleImageClick}
                >
                  <img
                    src={getImageUrl(post.images[currentImageIndex])}
                    alt={`Post image ${currentImageIndex + 1} of ${post.images.length}`}
                    className="w-full h-auto max-h-[400px] sm:max-h-[600px] object-contain transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Navigation Arrows - Only show if multiple images */}
                  {post.images.length > 1 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          goToPreviousImage();
                        }}
                        className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2.5 sm:p-2 rounded-full transition-all duration-200 touch-manipulation active:scale-95"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="w-5 h-5 sm:w-5 sm:h-5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          goToNextImage();
                        }}
                        className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2.5 sm:p-2 rounded-full transition-all duration-200 touch-manipulation active:scale-95"
                        aria-label="Next image"
                      >
                        <ChevronRight className="w-5 h-5 sm:w-5 sm:h-5" />
                      </button>
                    </>
                  )}

                  {/* Image Counter - Only show if multiple images */}
                  {post.images.length > 1 && (
                    <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 bg-black/70 text-white text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-medium">
                      {currentImageIndex + 1} / {post.images.length}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Rejection Reason */}
            {post.status === "rejected" && post.rejection_reason && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-950/30 border border-red-900/50 rounded-lg">
                <p className="text-xs sm:text-sm text-red-400">
                  <strong>Rejection Reason:</strong> {post.rejection_reason}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-white/10">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="gap-2 border-white/10 bg-white/10 text-white hover:bg-blue-500/20 hover:text-blue-400 hover:border-blue-500/30 transition-all duration-200 h-9 sm:h-8 px-4 sm:px-3 text-sm touch-manipulation active:scale-95"
              >
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </Button>
            </div>

            <CommentSection postId={post._id} />
          </CardContent>
        </Card>
      </div>

      {/* Image Lightbox */}
      {selectedImage && post?.images && post.images.length > 0 && (
        <Dialog
          open={!!selectedImage}
          onOpenChange={() => setSelectedImage(null)}
        >
          <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black border-none">
            {/* Close Button - TOP RIGHT */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors z-50"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Progress Indicators - TOP CENTER */}
            {post.images.length > 1 && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 flex gap-2">
                {post.images.map((_, index) => (
                  <div
                    key={index}
                    onClick={() => goToImage(index)}
                    className={`h-1 rounded-full cursor-pointer transition-all duration-300 ${
                      index === currentImageIndex
                        ? "bg-white w-12"
                        : "bg-white/50 w-12 hover:bg-white/70"
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Image Container */}
            <div className="relative w-full h-[90vh] flex items-center justify-center">
              <img
                src={getImageUrl(post.images[currentImageIndex])}
                alt={`Post image ${currentImageIndex + 1} of ${post.images.length}`}
                className="max-w-full max-h-full object-contain"
              />

              {/* Navigation Arrows */}
              {post.images.length > 1 && (
                <>
                  <button
                    onClick={goToPreviousImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>

                  <button
                    onClick={goToNextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* Image Counter */}
              {post.images.length > 1 && (
                <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1.5 rounded-full text-sm font-medium">
                  {currentImageIndex + 1} / {post.images.length}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ViewPost;
