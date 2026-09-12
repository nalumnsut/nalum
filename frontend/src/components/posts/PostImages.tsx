import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getPostImageUrl } from "@/lib/posts";

interface PostImagesProps {
  images: string[];
  alt: string;
}

const PostImages = ({ images, alt }: PostImagesProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (!images || images.length === 0) return null;

  const goToNextImage = (event?: React.MouseEvent) => {
    event?.stopPropagation();
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const goToPreviousImage = (event?: React.MouseEvent) => {
    event?.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToImage = (index: number, event?: React.MouseEvent) => {
    event?.stopPropagation();
    setCurrentImageIndex(index);
  };

  const handleImageClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedImage(getPostImageUrl(images[currentImageIndex]));
  };

  return (
    <>
      <div className="relative">
        {images.length > 1 && (
          <div className="absolute top-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
            {images.map((_, index) => (
              <div
                key={index}
                onClick={(event) => goToImage(index, event)}
                className={`h-0.5 cursor-pointer rounded-full transition-all duration-300 ${
                  index === currentImageIndex
                    ? "w-8 bg-white"
                    : "w-8 bg-white/50 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        )}

        <div
          className="group relative cursor-pointer overflow-hidden rounded-lg border border-border"
          onClick={handleImageClick}
        >
          <img
            src={getPostImageUrl(images[currentImageIndex])}
            alt={`${alt} — image ${currentImageIndex + 1} of ${images.length}`}
            className="h-auto max-h-[500px] w-full object-contain transition-transform duration-500 group-hover:scale-105"
          />

          {images.length > 1 && (
            <>
              <button
                onClick={goToPreviousImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-0 transition-opacity duration-200 hover:bg-black/70 group-hover:opacity-100"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <button
                onClick={goToNextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-0 transition-opacity duration-200 hover:bg-black/70 group-hover:opacity-100"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              <div className="absolute bottom-3 right-3 rounded-full bg-black/70 px-2.5 py-1 text-xs font-medium text-white">
                {currentImageIndex + 1} / {images.length}
              </div>
            </>
          )}
        </div>
      </div>

      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] border-none bg-black p-0">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute right-4 top-4 z-50 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70 hover:text-white/70"
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>

            {images.length > 1 && (
              <div className="absolute top-4 left-1/2 z-50 flex -translate-x-1/2 gap-2">
                {images.map((_, index) => (
                  <div
                    key={index}
                    onClick={(event) => goToImage(index, event)}
                    className={`h-1 cursor-pointer rounded-full transition-all duration-300 ${
                      index === currentImageIndex
                        ? "w-12 bg-white"
                        : "w-12 bg-white/50 hover:bg-white/70"
                    }`}
                  />
                ))}
              </div>
            )}

            <div className="relative flex h-[90vh] w-full items-center justify-center">
              <img
                src={getPostImageUrl(images[currentImageIndex])}
                alt={`${alt} — image ${currentImageIndex + 1} of ${images.length}`}
                className="max-h-full max-w-full object-contain"
              />

              {images.length > 1 && (
                <>
                  <button
                    onClick={goToPreviousImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white transition-colors hover:bg-black/70"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>

                  <button
                    onClick={goToNextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white transition-colors hover:bg-black/70"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>

                  <div className="absolute bottom-4 right-4 rounded-full bg-black/70 px-3 py-1.5 text-sm font-medium text-white">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default PostImages;
