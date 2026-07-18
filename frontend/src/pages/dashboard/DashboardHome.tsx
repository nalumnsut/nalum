import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/context/ProfileContext";
import PeopleYouMightKnow from "@/pages/dashboard/PeopleYouMightKnow";
import UpcomingEvents from "@/pages/dashboard/UpcomingEvents";
import NotificationsPopover from "@/components/NotificationsPopover";
import PostsFeed from "@/components/posts/PostsFeed";
import CreatePostModal from "@/components/posts/CreatePostModal";
import { PenSquare, Search, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

const DashboardHome = () => {
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    if (searchQuery !== debouncedQuery) {
      setIsSearching(true);
      const handler = setTimeout(() => {
        setDebouncedQuery(searchQuery);
        setIsSearching(false);
      }, 500);

      return () => {
        clearTimeout(handler);
      };
    }
  }, [searchQuery, debouncedQuery]);

  const handleStartPost = () => {
    const isAlumni = (profile?.user as any)?.role === "alumni";

    if (isAlumni) {
      setIsCreateModalOpen(true);
    } else {
      toast.info(
        "Post creation will be available for students soon. Stay tuned!"
      );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Main Content Flex */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column: Search & Feed */}
        <div className="flex-grow space-y-6">
          <div className="relative hidden md:block">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400 group-hover:text-white transition-colors pointer-events-none" />
            <input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full flex items-center gap-3 px-6 py-4 pl-14 pr-20 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 transition-all duration-200 text-lg font-medium focus:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {isSearching && (
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              )}
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="h-4 w-4 text-gray-400 hover:text-white" />
                </button>
              )}
            </div>
          </div>

          <PostsFeed
            refreshTrigger={refreshTrigger}
            searchQuery={debouncedQuery}
          />
        </div>

        {/* Right Column: Start Post, People & Events */}
        <div className="w-full lg:w-72 flex-shrink-0 space-y-6 order-first lg:order-none">
          {/* Start Post & Notifications */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={handleStartPost}
              className="relative flex-grow flex items-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl py-4 pl-12 pr-10 text-base text-white placeholder:text-gray-500 transition-all text-left"
            >
              <PenSquare className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
              <span>Start a post</span>
            </button>
            <div className="hidden sm:block">
              <NotificationsPopover />
            </div>
          </div>

          <div className="hidden lg:block space-y-6">
            <PeopleYouMightKnow />
            <UpcomingEvents />
          </div>
        </div>
      </div>

      <CreatePostModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPostCreated={() => setRefreshTrigger((prev) => prev + 1)}
      />
    </div>
  );
};

export default DashboardHome;