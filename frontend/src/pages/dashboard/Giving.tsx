import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import GivingCard from "@/components/GivingCard";
import { Loader2, Heart, Send, Image as ImageIcon, X, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { trackFormSubmit, trackEvent } from "@/lib/analytics";

interface Giving {
  _id: string;
  title: string;
  content: string;
  userId: string;
  images: string[];
  status: "pending" | "viewed" | "responded";
  answer?: string;
  createdAt: string;
  updatedAt: string;
}

const Giving = () => {
  const { user } = useAuth();
  const [givings, setGivings] = useState<Giving[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    if (user?.role === "alumni") {
      fetchMyGiving();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchMyGiving = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.get("/givings/my");
      setGivings(data.data || []);
    } catch (err: any) {
      console.error("Error fetching givings:", err);
      setError(err.response?.data?.message || "Failed to load your givings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (selectedImages.length + files.length > 2) {
      toast.error("Maximum 2 images allowed");
      return;
    }

    setSelectedImages([...selectedImages, ...files]);

    // Create previews
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    if (title.length > 50) {
      toast.error("Title must be 50 characters or less");
      return;
    }

    if (content.length > 500) {
      toast.error("Content must be 500 characters or less");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      selectedImages.forEach((image) => {
        formData.append("images", image);
      });

      await api.post("/givings", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Giving submitted successfully");
      trackFormSubmit('giving_form');
      setTitle("");
      setContent("");
      setSelectedImages([]);
      setImagePreviews([]);
      fetchMyGiving();
    } catch (err: any) {
      console.error("Error submitting giving:", err);
      trackEvent('giving_submit_error');
      toast.error(err.response?.data?.message || "Failed to submit giving");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show message for students
  if (user?.role === "student") {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Heart className="h-8 w-8 text-pink-400" />
            <h1 className="text-3xl font-bold text-white">Giving</h1>
          </div>
        </div>

        <Alert className="bg-blue-900/20 border-blue-900/50">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Alumni Only</AlertTitle>
          <AlertDescription>
            The Giving feature is exclusively available for verified alumni.
            You'll have access once you graduate and verify your alumni status.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Giving</h1>
        </div>

        <div className="flex flex-col gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white/5 border border-white/10 rounded-xl p-6 h-64 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Heart className="h-8 w-8 text-pink-400" />
          <h1 className="text-3xl font-bold text-white">Giving</h1>
        </div>
      </div>

      <Alert className="bg-yellow-500/10 border-yellow-500/20 text-yellow-100">
        <AlertCircle className="h-5 w-5 text-yellow-400" />
        <AlertDescription className="ml-2 text-lg font-medium text-yellow-200">
          We are currently not accepting direct monetary donations. However, if
          you wish to contribute by sponsoring building equipment, funding
          student education, or offering internship opportunities, please let us
          know using the form below.
        </AlertDescription>
      </Alert>

      {/* Submit Giving Form */}
      <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Submit Giving</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">
                Title <span className="text-red-400">*</span>
              </label>
              <span className="text-xs text-gray-400">{title.length}/50</span>
            </div>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief title for your giving"
              maxLength={50}
              required
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">
                Content <span className="text-red-400">*</span>
              </label>
              <span className="text-xs text-gray-400">
                {content.length}/500
              </span>
            </div>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Describe your contribution or donation..."
              maxLength={500}
              rows={4}
              required
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 resize-none"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Images (Optional, Max 2)
            </label>
            {selectedImages.length < 2 && (
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                  id="giving-images"
                />
                <label
                  htmlFor="giving-images"
                  className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-white/40 transition-colors"
                >
                  <ImageIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-400">
                    Click to upload images
                  </span>
                </label>
              </div>
            )}

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-pink-600 hover:bg-pink-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit Giving
              </>
            )}
          </Button>
        </form>
      </div>

      {/* User's Givings */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">
          My Givings ({givings.length})
        </h2>

        {error && (
          <Alert variant="destructive" className="bg-red-900/20 border-red-900/50 mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {givings.length === 0 ? (
          <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-12 text-center">
            <Heart className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              No givings yet
            </h3>
            <p className="text-gray-400">
              Submit your first giving using the form above
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {givings.map((giving) => (
              <GivingCard key={giving._id} giving={giving} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Giving;
