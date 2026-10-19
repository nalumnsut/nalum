import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { CheckCircle, XCircle, User, Eye } from "lucide-react";
import { toast } from "sonner";
import { useAdminApi } from "@/hooks/useAdminApi";
import {
  VerificationDetailsModal,
  type VerificationQueueItem,
} from "@/components/admin/VerificationDetailsModal";

const VerificationQueue = () => {
  const adminApi = useAdminApi();
  const [queue, setQueue] = useState<VerificationQueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] =
    useState<VerificationQueueItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [detailsItem, setDetailsItem] = useState<VerificationQueueItem | null>(
    null,
  );
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const handleViewDetails = (item: VerificationQueueItem) => {
    setDetailsItem(item);
    setShowDetailsModal(true);
  };

  const fetchQueue = async () => {
    try {
      const response = await adminApi.get<{ data: VerificationQueueItem[] }>(
        "/admin/verification/queue",
      );
      setQueue(response.data.data || []);
    } catch (err) {
      console.error("Failed to fetch queue:", err);
      toast.error("Failed to load verification queue");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApprove = async (userId: string) => {
    setActionLoading(userId);
    try {
      await adminApi.post(`/admin/verification/approve/${userId}`);
      toast.success("User verification approved!");
      fetchQueue();
    } catch (err) {
      console.error("Failed to approve:", err);
      toast.error("Failed to approve verification");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectClick = (item: VerificationQueueItem) => {
    setSelectedItem(item);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async () => {
    if (!selectedItem || !rejectReason.trim()) {
      toast.error("Please provide a reason");
      return;
    }

    setActionLoading(selectedItem.user._id);
    try {
      await adminApi.post(
        `/admin/verification/reject/${selectedItem.user._id}`,
        { reason: rejectReason },
      );
      toast.success("Verification rejected");
      setShowRejectModal(false);
      setRejectReason("");
      fetchQueue();
    } catch (err) {
      console.error("Failed to reject:", err);
      toast.error("Failed to reject verification");
    } finally {
      setActionLoading(null);
      setSelectedItem(null);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Verification Queue
          </h1>
          <p className="text-gray-600 mt-2">
            {queue.length} pending verification{queue.length !== 1 && "s"}
          </p>
        </div>

        {queue.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <User className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No pending verifications
            </h3>
            <p className="text-gray-600">
              All verification requests have been processed.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {queue.map((item) => (
              <div
                key={item._id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {item.user.name}
                    </h3>
                    <p className="text-sm text-gray-600">{item.user.email}</p>

                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Provided Name</p>
                        <p className="font-medium">
                          {item.details_provided.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Batch</p>
                        <p className="font-medium">
                          {item.details_provided.batch}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Branch</p>
                        <p className="font-medium">
                          {item.details_provided.branch}
                        </p>
                      </div>
                      {item.details_provided.roll_no && (
                        <div>
                          <p className="text-xs text-gray-500">Roll No</p>
                          <p className="font-medium">
                            {item.details_provided.roll_no}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Contact Information */}
                    {item.contact_info &&
                      (item.contact_info.phone ||
                        item.contact_info.alternate_email ||
                        item.contact_info.linkedin) && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <p className="text-xs font-semibold text-blue-900 mb-2">
                            Contact Information
                          </p>
                          <div className="space-y-1">
                            {item.contact_info.phone && (
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-blue-700 font-medium">
                                  Phone:
                                </span>
                                <span className="text-gray-700">
                                  {item.contact_info.phone}
                                </span>
                              </div>
                            )}
                            {item.contact_info.alternate_email && (
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-blue-700 font-medium">
                                  Alt Email:
                                </span>
                                <span className="text-gray-700">
                                  {item.contact_info.alternate_email}
                                </span>
                              </div>
                            )}
                            {item.contact_info.linkedin && (
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-blue-700 font-medium">
                                  LinkedIn:
                                </span>
                                <a
                                  href={item.contact_info.linkedin}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  View Profile
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                    <p className="text-xs text-gray-500 mt-4">
                      Submitted: {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleViewDetails(item)}
                      className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 font-medium text-sm transition-colors"
                    >
                      <Eye size={16} />
                      <span>View Details</span>
                    </button>
                    <button
                      onClick={() => handleApprove(item.user._id)}
                      disabled={actionLoading === item.user._id}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                    >
                      <CheckCircle size={18} />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleRejectClick(item)}
                      disabled={actionLoading === item.user._id}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
                    >
                      <XCircle size={18} />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">
                Reject Verification
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Provide a reason for rejecting {selectedItem?.user.name}'s
                verification:
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 min-h-[100px]"
                placeholder="Enter reason..."
              />
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectSubmit}
                  disabled={!rejectReason.trim() || !!actionLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Verification Details Modal */}
        <VerificationDetailsModal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          item={detailsItem}
          onApprove={handleApprove}
          onReject={handleRejectClick}
          isActionLoading={!!actionLoading}
        />
      </div>
    </AdminLayout>
  );
};

export default VerificationQueue;
