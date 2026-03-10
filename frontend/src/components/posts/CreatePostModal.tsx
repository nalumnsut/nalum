import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MentionTextarea from "@/components/MentionTextarea";
import { useProfile } from "@/context/ProfileContext";
import UserAvatar from "@/components/UserAvatar";
import { Image, X } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
  onPostCreated?: () => void;
}

const CreatePostModal = ({
  open,
  onClose,
  onPostCreated,
}: CreatePostModalProps) => {
  const { profile } = useProfile();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resolverRef = useRef<(t: string) => string>((t) => t);

  const handleClose = () => {
    setTitle("");
    setContent("");
    setSelectedImages([]);
    onClose();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (selectedImages.length + files.length > 2) {
      toast.error("You can only upload a maximum of 2 images");
      return;
    }
    setSelectedImages([...selectedImages, ...files]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", resolverRef.current(content));
      selectedImages.forEach((file) => {
        formData.append("images", file);
      });

      await api.post("/posts", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Post created!");
      if (onPostCreated) onPostCreated();
      handleClose();
    } catch (error: any) {
      console.error("Error creating post:", error);
      toast.error(error.response?.data?.message || "Failed to create post");
    } finally {
      setIsLoading(false);
    }
  };

  if (!profile?.user) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] bg-slate-950 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Create a post
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3 py-4">
          <UserAvatar
            src={profile.profile_picture}
            name={profile.user.name}
            size="md"
          />
          <div>
            <h3 className="font-semibold text-lg">{profile.user.name}</h3>
            <p className="text-sm text-gray-400">Posting to Alumni Network</p>
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
            placeholder="What's on your mind? Type @ to mention someone"
            value={content}
            onChange={setContent}
            onResolverReady={(fn) => { resolverRef.current = fn; }}
            style={{ minHeight: "144px" }}
            className="focus-visible:ring-blue-500/50"
          />

          {/* Image Previews */}
          {selectedImages.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {selectedImages.map((file, index) => (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg border border-white/10"
                  />
                  <button
                    onClick={() => removeImage(index)}
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
              disabled={selectedImages.length >= 2}
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
            onClick={handleSubmit}
            disabled={isLoading || !title.trim() || !content.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? "Creating..." : "Create Post"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostModal;
