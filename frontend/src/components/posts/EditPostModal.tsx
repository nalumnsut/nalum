import { useState, useRef, useEffect } from "react";
import { Image, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import UserAvatar from "@/components/UserAvatar";
import MentionTextarea from "@/components/MentionTextarea";
import api from "@/lib/api";
import { BASE_URL } from "@/lib/constants";
import { toast } from "sonner";
import { useProfile } from "@/context/ProfileContext";
import type { PostFormPost } from "./PostFormModal";

interface EditPostModalProps {
  open: boolean;
  post: PostFormPost | null;
  onClose: () => void;
  onPostUpdated?: () => void;
}

const EditPostModal = ({
  open,
  post,
  onClose,
  onPostUpdated,
}: EditPostModalProps) => {
  const { profile } = useProfile();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resolverRef = useRef<(t: string) => string>((t) => t);

  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setContent(post.content);
      setExistingImages(post.images || []);
      setNewImages([]);
    }
  }, [post]);

  const handleClose = () => {
    setTitle("");
    setContent("");
    setExistingImages([]);
    setNewImages([]);
    onClose();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages = existingImages.length + newImages.length + files.length;
    if (totalImages > 2) {
      toast.error("You can only have a maximum of 2 images");
      return;
    }
    setNewImages([...newImages, ...files]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImages(newImages.filter((_, i) => i !== index));
  };

  const getImageUrl = (imagePath: string) => {
    if (imagePath.startsWith("http")) return imagePath;
    return `${BASE_URL}/uploads/posts/${imagePath}`;
  };

  const handleUpdate = async () => {
    if (!title.trim() || !content.trim() || !post) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", resolverRef.current(content));
      newImages.forEach((file) => {
        formData.append("images", file);
      });

      await api.put(`/posts/${post._id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Post updated successfully!");
      if (onPostUpdated) onPostUpdated();
      handleClose();
    } catch (error: any) {
      console.error("Error updating post:", error);
      toast.error(error.response?.data?.message || "Failed to update post");
    } finally {
      setIsLoading(false);
    }
  };

  if (!profile?.user || !post) return null;

  const totalImages = existingImages.length + newImages.length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] bg-slate-950 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Edit post</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3 py-4">
          <UserAvatar
            src={profile.profile_picture}
            name={profile.user.name}
            size="md"
          />
          <div>
            <h3 className="font-semibold text-lg">{profile.user.name}</h3>
            <p className="text-sm text-gray-400">Editing post</p>
          </div>
        </div>

        <div className="space-y-4 py-2">
          <Input
            placeholder="Post title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-blue-500/50"
          />
          <MentionTextarea
            onResolverReady={(fn) => { resolverRef.current = fn; }}
            placeholder="What's on your mind? Type @ to mention someone"
            value={content}
            onChange={setContent}
            style={{ minHeight: "144px" }}
            className="focus-visible:ring-blue-500/50"
          />

          {/* Image Previews */}
          {(existingImages.length > 0 || newImages.length > 0) && (
            <div className="grid grid-cols-2 gap-2">
              {existingImages.map((image, index) => (
                <div key={`existing-${index}`} className="relative group">
                  <img
                    src={getImageUrl(image)}
                    alt={`Existing ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg border border-white/10"
                  />
                  <button
                    onClick={() => removeExistingImage(index)}
                    className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {newImages.map((file, index) => (
                <div key={`new-${index}`} className="relative group">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`New ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg border border-white/10"
                  />
                  <button
                    onClick={() => removeNewImage(index)}
                    className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* File Input Trigger */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={totalImages >= 2}
              className="gap-2 border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white"
            >
              <Image className="h-4 w-4" />
              Add photos (max 2)
            </Button>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-white hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={isLoading || !title.trim() || !content.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? "Updating..." : "Update Post"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditPostModal;
