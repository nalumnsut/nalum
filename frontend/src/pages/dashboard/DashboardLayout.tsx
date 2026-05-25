import { Link, Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { ProfileProvider, useProfile } from "@/context/ProfileContext";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
// import { useAuth } from "@/context/AuthContext"; // Removed unused
import { cn } from "@/lib/utils";
// import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"; // Removed
// import { Menu } from "lucide-react"; // Removed
import { Home, MessageSquare, Search, ArrowLeft, Users, SlidersHorizontal, X, GraduationCap, Calendar, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BRANCHES, CAMPUSES } from "@/constants/branches";
import UserAvatar from "@/components/UserAvatar";
import ProfileMenu from "@/components/ProfileMenu";
import nsutLogo from "@/assets/nsut-logo.svg";
import { useConversations } from "@/hooks/useConversations"; // Restored import
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api, { globalSearch } from "@/lib/api";

import { useChatContext } from "@/context/ChatContext";
import { useNotifications } from "@/context/NotificationContext";
import { useEffect, useState, useRef } from "react";
import { useLocationGuard } from "@/hooks/useLocationGuard";

const DashboardContent = () => {
  const location = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ users: any[], posts: any[] }>({ users: [], posts: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [searchTab, setSearchTab] = useState<'people' | 'posts'>('people');
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const currentQueryRef = useRef("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Mobile Search Filters
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    batch: "",
    branch: "",
    campus: "",
    company: "",
    skills: [] as string[],
    connectionFilter: "all" as "all" | "connected" | "not_connected",
  });
  const [skillInput, setSkillInput] = useState("");

  const isChatPage = location.pathname.startsWith("/dashboard/chat");
  const isConnectionsPage = location.pathname.startsWith("/dashboard/connections");
  const isNotificationsPage = location.pathname.startsWith("/dashboard/notifications");
  const { profile } = useProfile();
  // const { logout } = useAuth(); // Removed unused
  const { conversations } = useConversations(); // Restored hook usage
  const { socket } = useChatContext();
  const { unreadCount: notificationUnreadCount } = useNotifications();
  const queryClient = useQueryClient();

  // Enforce profile completion and location
  useLocationGuard();

  // Auto-focus input when search opens
  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Close search bar when switching tabs/routes
  useEffect(() => {
    setIsSearchOpen(false);
    setSearchQuery("");
    setSearchResults({ users: [], posts: [] });
    setShowMobileFilters(false);
  }, [location.pathname]);

  // Calculate total unread count
  const unreadCount = conversations.reduce((acc: number, conv: any) => acc + (conv.unreadCount || 0), 0);

  // ... (keeping existing query code) ...
  const { data: pendingRequests = [] } = useQuery({
    queryKey: ["connections", "received"],
    queryFn: async () => {
      const { data } = await api.get("/chat/connections/pending");
      return data.data;
    },
  });

  // ... (keeping existing socket code) ...
  useEffect(() => {
    if (!socket) return;
    const handleConnectionRequest = () => {
      queryClient.invalidateQueries({ queryKey: ["connections", "received"] });
    };
    socket.on("connection_request", handleConnectionRequest);
    return () => {
      socket.off("connection_request", handleConnectionRequest);
    };
  }, [socket, queryClient]);

  const hasPendingRequests = pendingRequests.length > 0;

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-slate-950 text-slate-100 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      {/* ... (background glow) ... */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]" />
      </div>

      {/* Mobile Top Bar - Main Dashboard */}
      {!isChatPage && !isNotificationsPage && (
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/10 px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={nsutLogo} alt="NSUT Alumni" width="32" height="32" className="h-8 w-8" />
            <span className={`font-bold tracking-wide text-sm transition-all duration-300 ${isSearchOpen ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>
              <span className="text-red-600">N</span>
              <span className="text-white">SUT</span>
              <span className="text-red-600"> ALUM</span>
              <span className="text-white">NI</span>
            </span>
          </div>

          <div className="flex items-center gap-2 flex-1 justify-end">
            <div className={`flex items-center bg-white/10 rounded-full transition-all duration-300 ease-in-out overflow-hidden ${isSearchOpen ? 'flex-1 mx-2 pl-3 pr-1 py-1.5 opacity-100' : 'w-0 p-0 opacity-0 border-none'}`}>
              <input
                ref={inputRef}
                type="text"
                placeholder="Search..."
                className="bg-transparent border-none outline-none text-white text-sm w-full placeholder:text-gray-400 min-w-0"
                value={searchQuery}
                onChange={(e) => {
                  const query = e.target.value;
                  setSearchQuery(query);
                  currentQueryRef.current = query;

                  if (searchDebounceRef.current) {
                    clearTimeout(searchDebounceRef.current);
                  }

                  if (query.trim().length > 0) {
                    setIsSearching(true);
                    searchDebounceRef.current = setTimeout(async () => {
                      if (currentQueryRef.current !== query) return;
                      try {
                        const results = await globalSearch(query, searchFilters);
                        if (currentQueryRef.current === query) {
                          setSearchResults(results);
                        }
                      } catch (error) {
                        console.error("Search failed", error);
                      } finally {
                        if (currentQueryRef.current === query) {
                          setIsSearching(false);
                        }
                      }
                    }, 50);
                  } else {
                    setSearchResults({ users: [], posts: [] });
                    setIsSearching(false);
                  }
                }}
                onBlur={() => {
                  // Delay closing to allow clicking on results
                  setTimeout(() => {
                    if (searchQuery.trim() === "") {
                      setIsSearchOpen(false);
                    }
                  }, 200);
                }}
              />
            </div>

            <button
              onClick={() => {
                const newState = !isSearchOpen;
                setIsSearchOpen(newState);
                if (newState) {
                  // Focus will be handled by useEffect
                } else {
                  setSearchQuery("");
                  setSearchResults({ users: [], posts: [] });
                  currentQueryRef.current = "";
                }
              }}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <Search className="h-6 w-6" />
            </button>

            <Link 
              to="/dashboard/notifications" 
              className="p-2 text-gray-400 hover:text-white transition-colors relative flex-shrink-0"
            >
              <Bell className="h-6 w-6" />
              {notificationUnreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-slate-950" />
              )}
            </Link>

            <Link to="/dashboard/chat" className="p-2 text-gray-400 hover:text-white transition-colors relative flex-shrink-0">
              <MessageSquare className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-500 ring-2 ring-slate-950" />
              )}
            </Link>
          </div>
        </div>
      )}

      {/* Vertical Search Results (Mobile) */}
      {isSearchOpen && ((searchResults.users.length > 0 || searchResults.posts.length > 0) || searchQuery.trim().length > 0) && (
        <div className="md:hidden fixed top-16 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-white/10 shadow-lg animate-in slide-in-from-top-2 duration-200 max-h-[70vh] overflow-y-auto">

          {/* Tabs - Instagram style */}
          <div className="flex border-b border-white/10 bg-black/20">
            <button
              onClick={() => setSearchTab('people')}
              className={cn(
                "flex-1 py-3 text-sm font-medium transition-colors relative",
                searchTab === 'people' 
                  ? "text-white" 
                  : "text-gray-400 hover:text-gray-300"
              )}
            >
              People ({searchResults.users.length})
              {searchTab === 'people' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
              )}
            </button>
            <button
              onClick={() => setSearchTab('posts')}
              className={cn(
                "flex-1 py-3 text-sm font-medium transition-colors relative",
                searchTab === 'posts' 
                  ? "text-white" 
                  : "text-gray-400 hover:text-gray-300"
              )}
            >
              Posts ({searchResults.posts.length})
              {searchTab === 'posts' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
              )}
            </button>
          </div>

          {/* Filter Header - Only show for people tab */}
          {searchTab === 'people' && (
            <div className="flex justify-between items-center p-3 border-b border-white/10 bg-black/20">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-400">
                  {searchResults.users.length} result{searchResults.users.length !== 1 ? 's' : ''}
                </span>
                {(searchFilters.batch || searchFilters.branch || searchFilters.campus || searchFilters.company || searchFilters.skills.length > 0 || searchFilters.connectionFilter !== "all") && (
                  <span className="flex items-center gap-1 text-xs text-blue-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                    filtered
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="h-7 px-2 text-xs hover:bg-transparent text-blue-400"
              >
                <SlidersHorizontal className="w-4 h-4 mr-1.5" />
                Filters
              </Button>
            </div>
          )}

          {/* Filter Panel */}
          {searchTab === 'people' && showMobileFilters && (
            <div className="p-3 bg-black/30 border-b border-white/10 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-white">Refine Results</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const emptyFilters = { batch: "", branch: "", campus: "", company: "", skills: [], connectionFilter: "all" as const };
                    setSearchFilters(emptyFilters);
                    setSkillInput("");
                    if (searchQuery.trim()) {
                      globalSearch(searchQuery, emptyFilters).then((results) => {
                        setSearchResults(results);
                      });
                    }
                  }}
                  className="h-5 px-2 text-xs text-red-400 hover:text-red-300"
                >
                  Reset
                </Button>
              </div>

              {/* Row 1: Batch, Company */}
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Batch (2020)"
                  value={searchFilters.batch}
                  onChange={(e) => {
                    const newFilters = { ...searchFilters, batch: e.target.value };
                    setSearchFilters(newFilters);
                    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
                    searchDebounceRef.current = setTimeout(async () => {
                      const results = await globalSearch(searchQuery, newFilters);
                      setSearchResults(results);
                    }, 300);
                  }}
                  className="h-7 bg-black/30 border-white/10 text-xs text-white"
                />
                <Input
                  placeholder="Company"
                  value={searchFilters.company}
                  onChange={(e) => {
                    const newFilters = { ...searchFilters, company: e.target.value };
                    setSearchFilters(newFilters);
                    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
                    searchDebounceRef.current = setTimeout(async () => {
                      const results = await globalSearch(searchQuery, newFilters);
                      setSearchResults(results);
                    }, 300);
                  }}
                  className="h-7 bg-black/30 border-white/10 text-xs text-white"
                />
              </div>

              {/* Row 2: Branch, Campus */}
              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={searchFilters.branch}
                  onValueChange={(val) => {
                    const newFilters = { ...searchFilters, branch: val === "all" ? "" : val };
                    setSearchFilters(newFilters);
                    globalSearch(searchQuery, newFilters).then((results) => {
                      setSearchResults(results);
                    });
                  }}
                >
                  <SelectTrigger className="h-7 bg-black/30 border-white/10 text-xs text-white">
                    <SelectValue placeholder="Branch" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-white max-h-48">
                    <SelectItem value="all">All Branches</SelectItem>
                    {BRANCHES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select
                  value={searchFilters.campus}
                  onValueChange={(val) => {
                    const newFilters = { ...searchFilters, campus: val === "all" ? "" : val };
                    setSearchFilters(newFilters);
                    globalSearch(searchQuery, newFilters).then((results) => {
                      setSearchResults(results);
                    });
                  }}
                >
                  <SelectTrigger className="h-7 bg-black/30 border-white/10 text-xs text-white">
                    <SelectValue placeholder="Campus" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-white">
                    <SelectItem value="all">All Campuses</SelectItem>
                    {CAMPUSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Row 3: Skills */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add skill..."
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && skillInput.trim()) {
                      e.preventDefault();
                      const newSkills = [...searchFilters.skills, skillInput.trim()];
                      const newFilters = { ...searchFilters, skills: newSkills };
                      setSearchFilters(newFilters);
                      setSkillInput("");
                      globalSearch(searchQuery, newFilters).then((results) => {
                        setSearchResults(results);
                      });
                    }
                  }}
                  className="h-7 bg-black/30 border-white/10 text-xs text-white flex-1"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    if (skillInput.trim()) {
                      const newSkills = [...searchFilters.skills, skillInput.trim()];
                      const newFilters = { ...searchFilters, skills: newSkills };
                      setSearchFilters(newFilters);
                      setSkillInput("");
                      globalSearch(searchQuery, newFilters).then((results) => {
                        setSearchResults(results);
                      });
                    }
                  }}
                  className="h-7 px-2 text-xs bg-blue-600 hover:bg-blue-500"
                >
                  Add
                </Button>
              </div>
              {searchFilters.skills.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {searchFilters.skills.map((skill, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="text-xs h-5 bg-white/10 text-gray-200 hover:bg-white/20 cursor-pointer"
                      onClick={() => {
                        const newSkills = searchFilters.skills.filter((_, idx) => idx !== i);
                        const newFilters = { ...searchFilters, skills: newSkills };
                        setSearchFilters(newFilters);
                        globalSearch(searchQuery, newFilters).then((results) => {
                          setSearchResults(results);
                        });
                      }}
                    >
                      {skill} <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}

              {/* Row 4: Connection Status */}
              <div className="flex gap-1">
                {(["all", "connected", "not_connected"] as const).map((status) => (
                  <Button
                    key={status}
                    size="sm"
                    variant={searchFilters.connectionFilter === status ? "default" : "outline"}
                    onClick={() => {
                      const newFilters = { ...searchFilters, connectionFilter: status };
                      setSearchFilters(newFilters);
                      globalSearch(searchQuery, newFilters).then((results) => {
                        setSearchResults(results);
                      });
                    }}
                    className={`h-6 px-2 text-xs flex-1 ${searchFilters.connectionFilter === status
                      ? "bg-blue-600 text-white"
                      : "bg-transparent border-white/20 text-gray-400 hover:text-white"
                      }`}
                  >
                    {status === "all" ? "All" : status === "connected" ? "Connected" : "Not Connected"}
                  </Button>
                ))}
              </div>
            </div>
          )}
          {/* Results List */}
          <div className="flex flex-col p-2 gap-1">
            {/* People Tab Results */}
            {searchTab === 'people' && (
              <>
                {searchResults.users.length === 0 && searchQuery.trim().length > 0 && !isSearching && (
                  <div className="p-4 text-center text-gray-400 text-sm">
                    No people found. Try adjusting filters.
                  </div>
                )}
                {searchResults.users.map((profile) => (
                  <Link
                    key={profile._id}
                    to={`/dashboard/alumni/${profile.user._id}`}
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchQuery("");
                      setSearchResults({ users: [], posts: [] });
                    }}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    <div className="relative flex-shrink-0">
                      <UserAvatar
                        src={profile.profile_picture}
                        name={profile.user.name}
                        className="h-10 w-10 border border-slate-700"
                      />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-white truncate">
                        {profile.user.name}
                      </span>
                      <span className="text-xs text-gray-400 truncate">
                        {profile.batch} • {profile.branch}
                      </span>
                    </div>
                  </Link>
                ))}
                {searchResults.users.length >= 15 && (
                  <Link
                    to={`/dashboard/alumni?search=${encodeURIComponent(searchQuery)}`}
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchQuery("");
                      setSearchResults({ users: [], posts: [] });
                    }}
                    className="p-3 text-center text-sm text-blue-400 hover:text-blue-300 hover:bg-white/5 rounded-lg transition-colors"
                  >
                    View all results →
                  </Link>
                )}
              </>
            )}
            
            {/* Posts Tab Results */}
            {searchTab === 'posts' && (
              <>
                {searchResults.posts.length === 0 && searchQuery.trim().length > 0 && !isSearching && (
                  <div className="p-4 text-center text-gray-400 text-sm">
                    No posts found matching your search.
                  </div>
                )}
                {searchResults.posts.map((post: any) => (
                  <Link
                    key={post._id}
                    to={`/dashboard/posts/${post._id}`}
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchQuery("");
                      setSearchResults({ users: [], posts: [] });
                    }}
                    className="flex flex-col gap-2 p-3 rounded-lg hover:bg-white/10 transition-colors"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    <div className="flex items-center gap-2">
                      <UserAvatar
                        src={post.userId?.profile_picture}
                        name={post.userId?.name}
                        className="h-8 w-8 border border-slate-700"
                      />
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-xs font-medium text-white truncate">
                          {post.userId?.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <h4 className="text-sm font-semibold text-white line-clamp-1">
                        {post.title}
                      </h4>
                      <p className="text-xs text-gray-400 line-clamp-2">
                        {post.content}
                      </p>
                    </div>
                  </Link>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* Mobile Top Bar - Chat Page (Back Button) */}
      {/* Only show on the main chat list page, NOT when inside a conversation (chat details) */}
      {isChatPage && !location.pathname.match(/\/dashboard\/chat\/.+/) && (
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/10 px-4 h-16 flex items-center">
          <Link to="/dashboard" className="flex items-center gap-2 text-gray-200 hover:text-white transition-colors">
            <ArrowLeft className="h-6 w-6" />
            <span className="font-medium text-lg">Back</span>
          </Link>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      {!isChatPage && !isNotificationsPage && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/90 backdrop-blur-lg border-t border-white/10 flex items-center justify-around px-2 py-2 shadow-2xl md:hidden h-16">
          <Link
            to="/dashboard"
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300",
              location.pathname === "/dashboard"
                ? "bg-blue-600/20 text-blue-400"
                : "text-gray-400 hover:text-white"
            )}
          >
            <Home className="h-5 w-5" />
            <span className="text-[10px] font-medium">Home</span>
          </Link>

          <Link
            to="/dashboard/connections"
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 relative",
              location.pathname === "/dashboard/connections"
                ? "bg-blue-600/20 text-blue-400"
                : "text-gray-400 hover:text-white"
            )}
          >
            <Users className="h-5 w-5" />
            <span className="text-[10px] font-medium">Network</span>
            {hasPendingRequests && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-blue-500 ring-2 ring-slate-950" />
            )}
          </Link>

          <Link
            to="/dashboard/posts"
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300",
              location.pathname === "/dashboard/posts"
                ? "bg-blue-600/20 text-blue-400"
                : "text-gray-400 hover:text-white"
            )}
          >
            <div className="w-6 h-6 border-2 border-current rounded-md flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-[10px] font-medium">Post</span>
          </Link>

          <Link
            to="/dashboard/events"
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300",
              location.pathname === "/dashboard/events"
                ? "bg-blue-600/20 text-blue-400"
                : "text-gray-400 hover:text-white"
            )}
          >
            <Calendar className="h-5 w-5" />
            <span className="text-[10px] font-medium">Events</span>
          </Link>

          <button
            onClick={() => setIsProfileMenuOpen(true)}
            className="flex flex-col items-center gap-1 transition-all"
          >
            <UserAvatar
              src={profile?.profile_picture}
              name={profile?.user?.name || "User"}
              size="sm"
              className={cn(
                "h-7 w-7 ring-2",
                isProfileMenuOpen
                  ? "ring-blue-500"
                  : "ring-transparent"
              )}
            />
            <span className={cn(
              "text-[10px] font-medium",
              isProfileMenuOpen
                ? "text-blue-400"
                : "text-gray-400"
            )}>Profile</span>
          </button>
        </div>
      )}

      {/* Profile Menu */}
      <ProfileMenu isOpen={isProfileMenuOpen} onClose={() => setIsProfileMenuOpen(false)} />

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <main className={cn(
        "flex-1 h-full relative z-10 scrollbar-hide",
        isChatPage || isNotificationsPage ? "overflow-hidden" : "overflow-y-auto"
      )}>
        <div className={cn(
          "relative mx-auto transition-all duration-300 min-h-full flex flex-col",
          isChatPage
            ? location.pathname.match(/\/dashboard\/chat\/.+/) ? "pt-0 pb-0 px-0 max-w-full h-full" : "pt-16 pb-0 px-0 max-w-full h-full"
            : isNotificationsPage
              ? "pt-0 pb-0 px-0 max-w-full h-full"
              : isConnectionsPage
                ? "pt-16 pb-0 px-0 max-w-full"
                : "px-4 pt-28 pb-20 md:p-8 max-w-7xl"
        )}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

const DashboardLayout = () => {
  return (
    <ProfileProvider>
      <DashboardContent />
      <PWAInstallPrompt />
    </ProfileProvider>
  );
};

export default DashboardLayout;
