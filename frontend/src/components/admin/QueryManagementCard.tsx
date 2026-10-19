import { useState } from "react";
import { Clock, CheckCircle, Eye, MessageCircle, Send, X, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DeleteConfirmDialog } from "@/components/ui/DeleteConfirmDialog";
import { toast } from "sonner";
import api from "@/lib/api";
import { BASE_URL } from "@/lib/constants";

interface Query {
  _id: string;
  title: string;
  content: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  images: string[];
  status: "pending" | "viewed" | "responded";
  answer?: string;
  createdAt: string;
  updatedAt: string;
}

interface QueryManagementCardProps {
  query: Query;
  onStatusUpdate: () => void;
}

const QueryManagementCard = ({
  query,
  onStatusUpdate,
}: QueryManagementCardProps) => {
  const [isResponding, setIsResponding] = useState(false);
  const [response, setResponse] = useState(query.answer || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/queries/${query._id}`);
      toast.success("Query deleted successfully");
      setConfirmDeleteOpen(false);
      onStatusUpdate();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete query");
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = () => {
    switch (query.status) {
      case "pending":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "viewed":
        return (
          <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">
            <Eye className="w-3 h-3 mr-1" />
            Viewed
          </Badge>
        );
      case "responded":
        return (
          <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Responded
          </Badge>
        );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleMarkViewed = async () => {
    if (query.status !== "pending") return;

    try {
      await api.put(`/queries/${query._id}/viewed`);
      toast.success("Query marked as viewed");
      onStatusUpdate();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleSubmitResponse = async () => {
    if (!response.trim()) {
      toast.error("Please enter a response");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.put(`/queries/${query._id}/respond`, {
        answer: response,
      });
      toast.success("Response submitted successfully");
      setIsResponding(false);
      onStatusUpdate();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit response");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-bold text-gray-900">{query.title}</h3>
            {getStatusBadge()}
          </div>

          {/* Top Action Buttons */}
          {!isResponding && (
            <div className="flex gap-2">
              {query.status === "pending" && (
                <Button
                  onClick={handleMarkViewed}
                  variant="outline"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 border-0"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Mark as Viewed
                </Button>
              )}
              {query.status !== "responded" && (
                <Button
                  onClick={() => setIsResponding(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Respond
                </Button>
              )}
              <Button
                onClick={() => setConfirmDeleteOpen(true)}
                variant="outline"
                className="bg-red-50 hover:bg-red-100 text-red-600 border-red-200 p-2"
                title="Delete Query"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Content */}
        <p className="text-gray-700 mb-4 whitespace-pre-wrap">
          {query.content}
        </p>

        {/* Images */}
        {query.images && query.images.length > 0 && (
          <div
            className={`grid gap-2 mb-4 ${
              query.images.length === 1 ? "grid-cols-1" : "grid-cols-2"
            }`}
          >
            {query.images.map((image, index) => (
              <img
                key={index}
                src={`${BASE_URL}/uploads/queries/${image}`}
                alt={`Query image ${index + 1}`}
                className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() =>
                  setSelectedImage(`${BASE_URL}/uploads/queries/${image}`)
                }
              />
            ))}
          </div>
        )}

        {/* Footer Info */}
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600">
          <span className="font-medium text-gray-900">
            Author: {query.userId?.name || "Unknown user"}
          </span>
          <span>Created: {new Date(query.createdAt).toLocaleDateString()}</span>
        </div>

        {/* Existing Response */}
        {query.status === "responded" && query.answer && !isResponding && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-green-700">
                  Your Response
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setResponse(query.answer || "");
                  setIsResponding(true);
                }}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                Edit Response
              </Button>
            </div>
            <p className="text-gray-700 text-sm whitespace-pre-wrap">
              {query.answer}
            </p>
          </div>
        )}

        {/* Response Form */}
        {isResponding && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-blue-700">
                Your Response
              </label>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsResponding(false);
                  setResponse(query.answer || "");
                }}
                className="text-gray-500 hover:text-gray-900"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Enter your response to this query..."
              rows={4}
              className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 resize-none"
            />
            <Button
              onClick={handleSubmitResponse}
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? "Submitting..." : "Submit Response"}
              <Send className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Image Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Full size"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}

      <DeleteConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Delete Query?"
        description="Are you sure you want to delete this query submission?"
        isDeleting={isDeleting}
        onConfirm={handleDelete}
      />
    </>
  );
};

export default QueryManagementCard;
