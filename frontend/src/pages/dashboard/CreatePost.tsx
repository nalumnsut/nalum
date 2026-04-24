import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/context/ProfileContext";
import UserAvatar from "@/components/UserAvatar";
import RichTextEditor from "@/components/posts/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Image, X, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { trackFormSubmit, trackEvent } from "@/lib/analytics";

const CreatePost = () => {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [content, setContent] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (selectedImages.length + files.length > 2) {
      toast.error("You can only upload a maximum of 2 images");
      return;
    }

    // Add new images
    setSelectedImages([...selectedImages, ...files]);

    // Create previews
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const extractTitle = (text: string): string => {
    // First line becomes the title
    const firstLine = text.split("\n")[0].trim();
    return firstLine.substring(0, 100); // Limit title length
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error("Please write something");
      return;
    }

    const isAlumni = (profile?.user as any)?.role === "alumni";
    if (!isAlumni) {
      toast.info("Post creation will be available for students soon. Stay tuned!");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      
      // Extract title from first line
      const title = extractTitle(content);
      formData.append("title", title);
      formData.append("content", content);
      
      selectedImages.forEach((file) => {
        formData.append("images", file);
      });

      await api.post("/posts", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Post created successfully!");
      trackFormSubmit('create_post', { has_images: selectedImages.length > 0 });
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error creating post:", error);
      trackEvent('create_post_error');
      toast.error(error.response?.data?.message || "Failed to create post");
    } finally {
      setIsLoading(false);
    }
  };

  if (!profile?.user) return null;

  const canPost = content.trim().length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Back</span>
          </button>
          <Button
            onClick={handleSubmit}
            disabled={!canPost || isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Posting...
              </>
            ) : (
              "Post"
            )}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* User Info */}
        <div className="flex items-center gap-3">
          <UserAvatar
            src={profile.profile_picture}
            name={profile.user.name}
            size="md"
          />
          <div>
            <h3 className="text-white font-semibold">{profile.user.name}</h3>
            <p className="text-sm text-gray-400">
              {profile.batch && `Class of ${profile.batch}`}
            </p>
          </div>
        </div>

        {/* Rich Text Editor */}
        <RichTextEditor
          value={content}
          onChange={setContent}
          placeholder="What do you want to talk about?&#10;&#10;First line will appear as your post title..."
          minHeight="300px"
        />

        {/* Image Upload Section */}
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />
          
          {selectedImages.length < 2 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-white/10 text-gray-400 hover:text-white hover:bg-white/5"
            >
              <Image className="h-4 w-4 mr-2" />
              Add images (max 2)
            </Button>
          )}

          {/* Image Previews */}
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg border border-white/10"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black/90 text-white rounded-full transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm text-blue-400">
          <p className="font-semibold mb-2">📝 Posting Tips:</p>
          <ul className="space-y-1 text-blue-300/80">
            <li>• Your first line will appear as the post title</li>
            <li>• Use formatting tools to make your post stand out</li>
            <li>• Posts are reviewed before being published</li>
            <li>• Keep content professional and relevant to NSUT community</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
