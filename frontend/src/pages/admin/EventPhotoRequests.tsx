import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { getPhotoRequests, approvePhotoRequest, rejectPhotoRequest, EventPhotoRequest } from "../../lib/adminApi";
import { CheckCircle, XCircle, RefreshCw, Image as ImageIcon, Calendar as CalendarIcon, User } from "lucide-react";
import { BASE_URL } from "../../lib/constants";

type StatusTab = "pending" | "approved" | "rejected" | "all";

const EventPhotoRequests = () => {
  const [requests, setRequests] = useState<EventPhotoRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusTab, setStatusTab] = useState<StatusTab>("pending");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    fetchRequests();
    // Auto-refresh every 15 seconds so the queue stays current for whoever's reviewing
    const interval = setInterval(fetchRequests, 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusTab]);

  const fetchRequests = async () => {
    try {
      const response = await getPhotoRequests(statusTab);
      if (response.success) {
        setRequests(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch photo requests:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      const response = await approvePhotoRequest(requestId);
      if (response.success) {
        fetchRequests();
      } else {
        alert(response.message || "Failed to approve photo");
      }
    } catch (err) {
      console.error("Failed to approve photo request:", err);
      alert("Failed to approve photo");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      const response = await rejectPhotoRequest(requestId, rejectReason);
      if (response.success) {
        setRejectingId(null);
        setRejectReason("");
        fetchRequests();
      } else {
        alert(response.message || "Failed to reject photo");
      }
    } catch (err) {
      console.error("Failed to reject photo request:", err);
      alert("Failed to reject photo");
    } finally {
      setProcessingId(null);
    }
  };

  const eventTitle = (req: EventPhotoRequest) =>
    typeof req.event === "string" ? "Unknown event" : req.event?.title || "Unknown event";

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-amber-100 text-amber-800 border-amber-200",
      approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
      rejected: "bg-red-100 text-red-800 border-red-200",
    };
    return (
      <span className={`text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${styles[status] || ""}`}>
        {status}
      </span>
    );
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ImageIcon className="h-6 w-6" />
              Event Photo Requests
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Photos alumni submitted for events — approve to publish them to the event's public gallery.
            </p>
          </div>
          <button
            onClick={fetchRequests}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 border rounded-lg px-3 py-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          {(["pending", "approved", "rejected", "all"] as StatusTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setIsLoading(true);
                setStatusTab(tab);
              }}
              className={`text-sm font-medium px-4 py-1.5 rounded-full border capitalize transition-colors ${
                statusTab === tab
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-gray-400">Loading...</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16 text-gray-400 bg-gray-50 rounded-xl border border-dashed">
            No {statusTab !== "all" ? statusTab : ""} photo requests right now.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {requests.map((req) => (
              <div key={req._id} className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                <img
                  src={`${BASE_URL}${req.pending_image_url}`}
                  alt="Submitted"
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    {statusBadge(req.status)}
                    <span className="text-xs text-gray-400">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-900 flex items-center gap-1.5 mb-1">
                    <CalendarIcon className="h-3.5 w-3.5 text-gray-400" />
                    {eventTitle(req)}
                  </p>
                  <p className="text-sm text-gray-500 flex items-center gap-1.5 mb-3">
                    <User className="h-3.5 w-3.5 text-gray-400" />
                    {req.submitted_by_name} · {req.submitted_by_email}
                  </p>

                  {req.status === "rejected" && req.rejection_reason && (
                    <p className="text-xs text-red-600 bg-red-50 rounded-md p-2 mb-3">
                      Reason: {req.rejection_reason}
                    </p>
                  )}

                  {req.status === "pending" && (
                    <>
                      {rejectingId === req._id ? (
                        <div className="space-y-2">
                          <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Reason (optional)"
                            className="w-full text-sm border rounded-md p-2"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReject(req._id)}
                              disabled={processingId === req._id}
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-1.5 rounded-md disabled:opacity-50"
                            >
                              Confirm Reject
                            </button>
                            <button
                              onClick={() => {
                                setRejectingId(null);
                                setRejectReason("");
                              }}
                              className="flex-1 border text-sm font-medium py-1.5 rounded-md"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(req._id)}
                            disabled={processingId === req._id}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium py-1.5 rounded-md disabled:opacity-50"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => setRejectingId(req._id)}
                            disabled={processingId === req._id}
                            className="flex-1 flex items-center justify-center gap-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium py-1.5 rounded-md disabled:opacity-50"
                          >
                            <XCircle className="h-4 w-4" />
                            Reject
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default EventPhotoRequests;
