import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ThumbsDown, CheckCircle, Clock, User, Flag, RefreshCw, Search, Filter } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "sonner";
import api from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Report {
  _id: string;
  postId: {
    _id: string;
    title: string;
    content: string;
    userId: {
      name: string;
    };
  };
  reportedBy: {
    _id: string;
    name: string;
    email: string;
  };
  reason: string;
  description: string;
  status: string;
  createdAt: string;
}

const Reports = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchReports = async () => {
    try {
      const response = await api.get("/admin/reports");
      const allReports = response.data.data || [];

      // Filter out reports with null or invalid postId
      const validReports = allReports.filter(
        (report: any) =>
          report.postId &&
          report.postId._id &&
          report.postId.title &&
          report.postId.userId &&
          report.postId.userId.name
      );

      setReports(validReports);

      // Optionally show how many were filtered out
      const filteredCount = allReports.length - validReports.length;
      if (filteredCount > 0) {
        console.log(`Filtered out ${filteredCount} reports with deleted posts`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async (reportId: string) => {
    if (!confirm("Are you sure you want to dismiss this report?")) {
      return;
    }

    try {
      await api.post(`/admin/reports/${reportId}/dismiss`);
      toast.success("Report dismissed successfully");
      fetchReports();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to dismiss report");
    }
  };

  const handleRejectPost = (report: Report) => {
    setSelectedReport(report);
    setShowRejectDialog(true);
  };

  const confirmRejectPost = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    if (!selectedReport) return;

    try {
      await api.post(`/admin/reports/${selectedReport._id}/reject`, {
        rejectionReason,
      });
      toast.success("Post rejected successfully");
      setShowRejectDialog(false);
      setSelectedReport(null);
      setRejectionReason("");
      await fetchReports();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to reject post");
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      filterReports();
    }, 300);
    return () => clearTimeout(timer);
  }, [reports, searchTerm, statusFilter]);

  const filterReports = () => {
    let filtered = [...reports];
    if (searchTerm) {
      filtered = filtered.filter(
        (report) =>
          report.postId.title
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          report.postId.content
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          report.reportedBy.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          report.reason.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((report) => report.status === statusFilter);
    }
    setFilteredReports(filtered);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; text: string }> = {
      pending: {
        color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
        text: "Pending",
      },
      dismissed: {
        color: "bg-green-500/20 text-green-400 border-green-500/30",
        text: "Dismissed",
      },
      rejected: {
        color: "bg-red-500/20 text-red-400 border-red-500/30",
        text: "Rejected",
      },
      "post rejected": {
        color: "bg-red-500/20 text-red-400 border-red-500/30",
        text: "Post Rejected",
      },
    };

    console.log("Report status:", status);
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full border ${config.color}`}
      >
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-lg">Loading reports...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-400" />
            <div>
              <h1 className="text-3xl font-bold">Post Reports</h1>
              <p className="text-gray-600 mt-1">
                {filteredReports.length} report
                {filteredReports.length !== 1 && "s"} found
              </p>
            </div>
          </div>
          <Button
            onClick={fetchReports}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search" className="flex items-center gap-2 mb-2">
                <Search size={16} />
                Search
              </Label>
              <Input
                id="search"
                placeholder="Search by title, content, reason, or reporter..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label
                htmlFor="status-filter"
                className="flex items-center gap-2 mb-2"
              >
                <Filter size={16} />
                Status
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                  <SelectItem value="post rejected">Post Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {filteredReports.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg shadow-sm">
            <Flag className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-900 dark:text-gray-400 text-lg font-medium">No reports found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <div
                key={report._id}
                className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-600 border border-red-200">
                        {report.reason}
                      </span>
                      {getStatusBadge(report.status)}
                    </div>
                    <div
                      onClick={() =>
                        navigate("/admin-panel/current-posts", {
                          state: { highlightPostId: report.postId._id },
                        })
                      }
                      className="w-fit cursor-pointer group"
                    >
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {report.postId.title}
                      </h3>
                    </div>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {report.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <User className="w-4 h-4" />
                        <span>
                          <strong>Post by:</strong> {report.postId.userId.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Flag className="w-4 h-4" />
                        <span>
                          <strong>Reported by:</strong> {report.reportedBy.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        <span>
                          {formatDistanceToNow(new Date(report.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  {report.status === "pending" && (
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        onClick={() => handleDismiss(report._id)}
                        className="bg-green-600 hover:bg-green-700 text-white gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Dismiss
                      </Button>
                      <Button
                        onClick={() => handleRejectPost(report)}
                        className="bg-red-600 hover:bg-red-700 text-white gap-2"
                      >
                        <ThumbsDown className="w-4 h-4" />
                        Reject Post
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog
          open={showRejectDialog}
          onOpenChange={(open) => !open && setShowRejectDialog(false)}
        >
          <DialogContent className="sm:max-w-[500px] bg-slate-950 border-white/10 text-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">
                Reject Post
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <p className="text-gray-400 text-sm">
                You are about to reject the post:{" "}
                <span className="text-white font-medium">
                  {selectedReport?.postId.title}
                </span>
              </p>

              <div>
                <label
                  htmlFor="rejection-reason"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Rejection Reason
                </label>
                <Textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  required
                  placeholder="Provide a detailed reason for rejecting this post..."
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 resize-none focus-visible:ring-red-500/50"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowRejectDialog(false);
                  setSelectedReport(null);
                  setRejectionReason("");
                }}
                className="text-gray-400 hover:text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmRejectPost}
                disabled={!rejectionReason.trim()}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Confirm Reject
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default Reports;
