import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import GivingRow, { GivingRecord } from "@/components/giving/GivingRow";
import { AlertCircle, Heart, ImagePlus, Loader2, Send, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { trackFormSubmit, trackEvent } from "@/lib/analytics";
import { DeleteConfirmDialog } from "@/components/ui/DeleteConfirmDialog";
import { useDelete } from "@/hooks/useDelete";

const TITLE_LIMIT = 50;
const CONTENT_LIMIT = 500;
const MAX_IMAGES = 2;

const GivingRowSkeleton = () => (
  <div className="space-y-3 rounded-card border border-border bg-card p-6 shadow-card">
    <Skeleton className="h-5 w-32 rounded-full" />
    <Skeleton className="h-6 w-2/3" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-5/6" />
  </div>
);

const PageHeader = () => (
  <div className="mb-8 border-b border-border pb-6">
    <h1 className="mb-2 text-headline-lg-mobile text-primary md:text-headline-xl">
      Giving
    </h1>
    <p className="text-body-lg text-muted-foreground">
      Support the next generation of NSUT alumni — sponsor equipment, fund
      education, or offer opportunities.
    </p>
  </div>
);

const Giving = () => {
  const { user } = useAuth();
  const [givings, setGivings] = useState<GivingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [givingToDelete, setGivingToDelete] = useState<GivingRecord | null>(null);

  const { isDeleting, confirmOpen, setConfirmOpen, confirmDelete } = useDelete({
    endpoint: givingToDelete ? `/givings/${givingToDelete._id}` : "",
    onSuccess: () => {
      setGivings((prev) => prev.filter((g) => g._id !== givingToDelete?._id));
      setGivingToDelete(null);
    },
    successMessage: "Giving submission deleted successfully",
    errorMessage: "Failed to delete giving submission",
  });

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
    if (selectedImages.length + files.length > MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    setSelectedImages([...selectedImages, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = "";
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

    if (title.length > TITLE_LIMIT) {
      toast.error(`Title must be ${TITLE_LIMIT} characters or less`);
      return;
    }

    if (content.length > CONTENT_LIMIT) {
      toast.error(`Content must be ${CONTENT_LIMIT} characters or less`);
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
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Giving submitted successfully");
      trackFormSubmit("giving_form");
      setTitle("");
      setContent("");
      setSelectedImages([]);
      setImagePreviews([]);
      fetchMyGiving();
    } catch (err: any) {
      console.error("Error submitting giving:", err);
      trackEvent("giving_submit_error");
      toast.error(err.response?.data?.message || "Failed to submit giving");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Giving submissions are alumni-only (backend 403s every other role), so
  // gate students and faculty here instead of showing a form that can never
  // succeed. Alumni fall through to the form + contributions list below.
  if (user?.role === "student" || user?.role === "faculty") {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 text-foreground duration-500">
        <div className="mx-auto max-w-7xl pb-12">
          <PageHeader />
          <EmptyState
            icon={<Heart className="mx-auto h-14 w-14 text-muted-foreground/50" />}
            title="Alumni Only"
            description={
              user?.role === "faculty"
                ? "The Giving feature is exclusively available for verified alumni."
                : "The Giving feature is exclusively available for verified alumni. You'll have access once you graduate and verify your alumni status."
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 text-foreground duration-500">
      <div className="mx-auto max-w-7xl pb-12">
        <PageHeader />

        <Alert className="mb-6 border-warning/30 bg-warning-subtle">
          <AlertCircle className="h-4 w-4 text-warning" />
          <AlertDescription className="text-body-md text-foreground">
            We are currently not accepting direct monetary donations. However,
            if you wish to contribute by sponsoring building equipment,
            funding student education, or offering internship opportunities,
            please let us know using the form below.
          </AlertDescription>
        </Alert>

        {/* Submit Giving Form */}
        <section className="rounded-card border border-border bg-card p-6 shadow-card">
          <h2 className="mb-5 border-b border-border pb-3 text-headline-md text-foreground">
            Pledge Your Support
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label htmlFor="giving-title">
                  Title <span className="text-primary">*</span>
                </Label>
                <span className="text-label-sm text-muted-foreground">
                  {title.length}/{TITLE_LIMIT}
                </span>
              </div>
              <Input
                id="giving-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief title for your contribution"
                maxLength={TITLE_LIMIT}
                required
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label htmlFor="giving-content">
                  Details <span className="text-primary">*</span>
                </Label>
                <span className="text-label-sm text-muted-foreground">
                  {content.length}/{CONTENT_LIMIT}
                </span>
              </div>
              <Textarea
                id="giving-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Describe what you'd like to contribute..."
                maxLength={CONTENT_LIMIT}
                rows={4}
                required
                className="resize-none"
              />
            </div>

            <div>
              <Label>
                Attach Photos{" "}
                <span className="font-normal text-muted-foreground">
                  (optional, up to {MAX_IMAGES})
                </span>
              </Label>
              <div className="mt-2 flex flex-wrap gap-3">
                {imagePreviews.map((preview, index) => (
                  <div
                    key={index}
                    className="group relative h-24 w-24 overflow-hidden rounded-lg border border-border"
                  >
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      aria-label="Remove image"
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}

                {selectedImages.length < MAX_IMAGES && (
                  <label
                    htmlFor="giving-images"
                    className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-primary/30 bg-muted text-center transition-colors hover:border-primary/60 hover:bg-accent"
                  >
                    <ImagePlus className="h-5 w-5 text-primary" />
                    <span className="text-label-sm text-muted-foreground">
                      Add photo
                    </span>
                  </label>
                )}
              </div>
              <input
                id="giving-images"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="sr-only"
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full gap-2 rounded-full bg-primary px-6 text-label-md text-primary-foreground hover:bg-primary-hover sm:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Giving
                  </>
                )}
              </Button>
            </div>
          </form>
        </section>

        {/* User's Givings */}
        <div className="mt-10">
          <h2 className="mb-4 text-headline-md text-foreground">
            My Contributions{" "}
            {givings.length > 0 && (
              <span className="text-muted-foreground">({givings.length})</span>
            )}
          </h2>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="space-y-4">
              <GivingRowSkeleton />
              <GivingRowSkeleton />
            </div>
          ) : givings.length === 0 ? (
            <EmptyState
              icon={<Heart className="mx-auto h-14 w-14 text-muted-foreground/50" />}
              title="No contributions yet"
              description="Submit your first giving using the form above — we'll show the response here once it's ready."
            />
          ) : (
            <div className="flex flex-col gap-4">
              {givings.map((giving) => (
                <GivingRow
                  key={giving._id}
                  giving={giving}
                  onDelete={(target) => {
                    setGivingToDelete(target);
                    setConfirmOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <DeleteConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete giving contribution?"
        description="Are you sure you want to delete this giving submission?"
        isDeleting={isDeleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default Giving;
