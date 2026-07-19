import { useState, useEffect } from "react";
import { Heart, Search, Filter, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import GivingManagementCard from "@/components/admin/GivingManagementCard";
import AdminLayout from "@/components/admin/AdminLayout";
import api from "@/lib/api";
import { toast } from "sonner";

interface Giving {
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

const GivingManagement = () => {
  const [givings, setGivings] = useState<Giving[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    fetchGivings();
  }, [statusFilter, sortBy]);

  const fetchGivings = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (sortBy) params.append("sortBy", sortBy);
      if (searchTerm) params.append("title", searchTerm);

      const { data } = await api.get(`/givings/all?${params.toString()}`);
      setGivings(data.data || []);
    } catch (err: any) {
      console.error("Error fetching givings:", err);
      toast.error(err.response?.data?.message || "Failed to load givings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    fetchGivings();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Heart className="h-8 w-8 text-pink-400" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Giving Management
              </h1>
              <p className="text-gray-400 text-sm">
                Manage and respond to alumni contributions
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2 flex gap-2">
              <Input
                placeholder="Search by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-500"
              />
              <Button
                onClick={handleSearch}
                className="bg-pink-600 hover:bg-pink-700"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-white border-gray-200 text-gray-900">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="viewed">Viewed</SelectItem>
                <SelectItem value="responded">Responded</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="bg-white border-gray-200 text-gray-900">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="status">By Status</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Givings List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
          </div>
        ) : givings.length === 0 ? (
          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 backdrop-blur-md rounded-xl p-12 text-center shadow-sm">
            <Heart className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No givings found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "No giving submissions have been made yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {givings.map((giving) => (
              <GivingManagementCard
                key={giving._id}
                giving={giving}
                onStatusUpdate={fetchGivings}
              />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default GivingManagement;
