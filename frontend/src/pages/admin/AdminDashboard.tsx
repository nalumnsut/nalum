import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Calendar, 
  FileText, 
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Shield,
  MessageSquare,
  Wallet
} from 'lucide-react';
import apiClient from '@/lib/api';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as ChartTooltip } from 'recharts';
import { useTheme } from 'next-themes';

interface DashboardStats {
  users: {
    total: number;
    students: number;
    alumni: number;
    verified_alumni: number;
    banned: number;
    recent_registrations: number;
  };
  verifications: {
    pending: number;
    verified: number;
  };
  events: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  newsletters: {
    total: number;
    total_views: number;
    total_downloads: number;
  };
  bans: {
    active: number;
    total: number;
  };
}

const AdminDashboard = () => {
  const { user, accessToken } = useAuth();
  const { theme } = useTheme();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingPostsCount, setPendingPostsCount] = useState<number | null>(null);
  const [pendingQueriesCount, setPendingQueriesCount] = useState<number | null>(null);
  const [pendingGivingsCount, setPendingGivingsCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (accessToken) {
      fetchDashboardStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;

    const interval = setInterval(async () => {
      try {
        const response = await apiClient.get(
          '/admin/statistics/dashboard',
          {
            headers: { Authorization: `Bearer ${accessToken}` }
          }
        );
        const newStats = response.data?.stats;
        if (newStats) {
          setStats(prevStats => {
            if (JSON.stringify(prevStats) === JSON.stringify(newStats)) {
              return prevStats;
            }
            return newStats;
          });
        }

        // Fetch pending posts count
        try {
          const postsResponse = await apiClient.get('/admin/posts/pending', {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          const newPostsCount = postsResponse.data.success && Array.isArray(postsResponse.data.data)
            ? postsResponse.data.data.length
            : Array.isArray(postsResponse.data) ? postsResponse.data.length : 0;
          setPendingPostsCount(newPostsCount);
        } catch (error) {
          console.error('Error background-fetching pending posts:', error);
        }

        // Fetch pending queries count
        try {
          const queriesResponse = await apiClient.get('/queries/all?status=pending', {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          const newQueriesCount = queriesResponse.data.success && Array.isArray(queriesResponse.data.data)
            ? queriesResponse.data.data.length
            : Array.isArray(queriesResponse.data) ? queriesResponse.data.length : 0;
          setPendingQueriesCount(newQueriesCount);
        } catch (error) {
          console.error('Error background-fetching pending queries:', error);
        }

        // Fetch pending givings count
        try {
          const givingsResponse = await apiClient.get('/givings/all?status=pending', {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          const newGivingsCount = givingsResponse.data.success && Array.isArray(givingsResponse.data.data)
            ? givingsResponse.data.data.length
            : Array.isArray(givingsResponse.data) ? givingsResponse.data.length : 0;
          setPendingGivingsCount(newGivingsCount);
        } catch (error) {
          console.error('Error background-fetching pending givings:', error);
        }

      } catch (error) {
        console.error('Error background-fetching dashboard stats:', error);
      }
    }, 60000); // 1 minute

    return () => clearInterval(interval);
  }, [accessToken]);

  const fetchDashboardStats = async () => {
    try {
      const response = await apiClient.get(
        '/admin/statistics/dashboard',
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      console.log('Dashboard stats response:', response.data);
      setStats(response.data.stats);

      // Fetch pending posts count
      try {
        const postsResponse = await apiClient.get('/admin/posts/pending', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (postsResponse.data.success && Array.isArray(postsResponse.data.data)) {
          setPendingPostsCount(postsResponse.data.data.length);
        } else if (Array.isArray(postsResponse.data)) {
          setPendingPostsCount(postsResponse.data.length);
        }
      } catch (error) {
        console.error('Error fetching pending posts:', error);
      }

      // Fetch pending queries count
      try {
        const queriesResponse = await apiClient.get('/queries/all?status=pending', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (queriesResponse.data.success && Array.isArray(queriesResponse.data.data)) {
          setPendingQueriesCount(queriesResponse.data.data.length);
        } else if (Array.isArray(queriesResponse.data)) {
          setPendingQueriesCount(queriesResponse.data.length);
        }
      } catch (error) {
        console.error('Error fetching pending queries:', error);
      }

      // Fetch pending givings count
      try {
        const givingsResponse = await apiClient.get('/givings/all?status=pending', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (givingsResponse.data.success && Array.isArray(givingsResponse.data.data)) {
          setPendingGivingsCount(givingsResponse.data.data.length);
        } else if (Array.isArray(givingsResponse.data)) {
          setPendingGivingsCount(givingsResponse.data.length);
        }
      } catch (error) {
        console.error('Error fetching pending givings:', error);
      }

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#800000] border-t-transparent"></div>
        </div>
      </AdminLayout>
    );
  }

  const verificationsCount = stats?.verifications.pending || 0;
  const postsCount = pendingPostsCount !== null ? pendingPostsCount : 0;
  const eventsCount = stats?.events.pending || 0;
  const queriesCount = pendingQueriesCount !== null ? pendingQueriesCount : 0;
  const givingsCount = pendingGivingsCount !== null ? pendingGivingsCount : 0;

  const students = stats?.users.students || 0;
  const alumni = stats?.users.alumni || 0;
  const verifiedAlumni = stats?.users.verified_alumni || 0;
  const bannedUsers = stats?.users.banned || 0;

  const totalUsers = students + alumni + verifiedAlumni + bannedUsers;

  const CustomTooltip = ({ active, payload, coordinate }: any) => {
    if (active && payload && payload.length && coordinate) {
      const data = payload[0].payload;
      const percent = totalUsers > 0 ? ((data.value / totalUsers) * 100).toFixed(0) : 0;
      
      // Calculate shift vector from SVG center (80, 80)
      const cx = 80;
      const cy = 80;
      const x = coordinate.x ?? cx;
      const y = coordinate.y ?? cy;
      
      const vx = x - cx;
      const vy = y - cy;
      const len = Math.sqrt(vx * vx + vy * vy);
      
      // Normalize direction vector
      const dx = len > 0 ? vx / len : 0;
      const dy = len > 0 ? vy / len : 0;
      
      // Offset shift distance (pixels) to place the tooltip over the outer arc
      const shift = 60;
      const tx = dx * shift;
      const ty = dy * shift;
      
      return (
        <div 
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-2.5 shadow-md text-xs select-none pointer-events-none"
          style={{
            transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px))`,
            transition: 'transform 0.15s ease-out',
          }}
        >
          <p className="font-semibold text-gray-900 dark:text-gray-100">{data.name}</p>
          <p className="text-gray-600 dark:text-gray-400 mt-0.5 whitespace-nowrap">
            {data.value} {data.value === 1 ? 'User' : 'Users'} ({percent}%)
          </p>
        </div>
      );
    }
    return null;
  };


  const chartData = [
    { name: 'Students', value: students, color: '#3b82f6', fill: 'url(#gradient-students)' },
    { name: 'Alumni', value: alumni, color: '#22c55e', fill: 'url(#gradient-alumni)' },
    { name: 'Verified Alumni', value: verifiedAlumni, color: '#f97316', fill: 'url(#gradient-verified)' },
    { name: 'Banned Users', value: bannedUsers, color: '#ef4444', fill: 'url(#gradient-banned)' },
  ];

  const activeChartData = chartData.filter(d => d.value > 0).length > 0
    ? chartData.filter(d => d.value > 0)
    : [{ name: 'No Users', value: 1, color: '#e5e7eb', fill: '#e5e7eb' }];

  const quickActionsList = [
    {
      id: 'verifications',
      title: `Review ${verificationsCount} Verification Requests`,
      route: '/admin-panel/verifications',
      icon: Shield,
      count: verificationsCount,
      activeColor: 'text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300',
    },
    {
      id: 'posts',
      title: `Approve ${postsCount} Pending Posts`,
      route: '/admin-panel/posts-approval',
      icon: FileText,
      count: postsCount,
      activeColor: 'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300',
    },
    {
      id: 'events',
      title: `Approve ${eventsCount} Pending Events`,
      route: '/admin-panel/events',
      icon: Calendar,
      count: eventsCount,
      activeColor: 'text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300',
    },
    {
      id: 'queries',
      title: `Respond to ${queriesCount} User Queries`,
      route: '/admin-panel/queries',
      icon: MessageSquare,
      count: queriesCount,
      activeColor: 'text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300',
    },
    {
      id: 'givings',
      title: `Review ${givingsCount} Giving Requests`,
      route: '/admin-panel/givings',
      icon: Wallet,
      count: givingsCount,
      activeColor: 'text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300',
    },
  ];

  const sortedActions = [...quickActionsList].sort((a, b) => {
    const aActive = a.count > 0;
    const bActive = b.count > 0;
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;
    return quickActionsList.indexOf(a) - quickActionsList.indexOf(b);
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-gray-600 mt-2">
            Here's what's happening with your alumni portal today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Users */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Users
              </CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {stats?.users.total || 0}
              </div>
              <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +{stats?.users.recent_registrations || 0} this month
              </p>
            </CardContent>
          </Card>

          {/* Verified Alumni */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Verified Alumni
              </CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {stats?.users.verified_alumni || 0}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {stats?.users.alumni || 0} total alumni
              </p>
            </CardContent>
          </Card>

          {/* Pending Verifications */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Pending Verifications
              </CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {stats?.verifications.pending || 0}
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-500">
                  {stats?.verifications.verified || 0} verified
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/admin-panel/verifications">
                    View Queue
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Pending Posts Approval */}
          <Card className="hover:shadow-lg transition-shadow flex flex-col justify-between">
            <div>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Pending Posts Approval
                </CardTitle>
                <FileText className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {pendingPostsCount !== null ? pendingPostsCount : 0}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Posts awaiting admin approval
                </p>
              </CardContent>
            </div>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                <Button variant="default" size="sm" className="px-1 text-center" asChild>
                  <Link to="/admin-panel/posts-approval">
                    Review Pending
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-purple-200 text-purple-600 hover:bg-purple-50 hover:text-purple-700 dark:border-purple-900/50 dark:text-purple-400 dark:hover:bg-purple-950/30 dark:hover:text-purple-300 transition-colors px-1 text-center"
                  asChild
                >
                  <Link to="/admin-panel/current-posts">
                    Current Posts
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Stats */}
          <Card>
            <CardHeader>
              <CardTitle>User Statistics</CardTitle>
              <CardDescription>Overview of user distribution</CardDescription>
            </CardHeader>
            <CardContent>
              {/* SVG definitions for simulated 3D drop-shadow and linear gradients */}
              <svg width="0" height="0" className="absolute">
                <defs>
                  {/* Soft drop-shadow filter for simulated 3D elevation */}
                  <filter id="pie-3d-shadow" x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow dx="2" dy="3.5" stdDeviation="3.5" floodOpacity="0.25" />
                  </filter>
                  
                  {/* Linear gradients for cylindrical 3D visual curvature */}
                  <linearGradient id="gradient-students" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60a5fa" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                  
                  <linearGradient id="gradient-alumni" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4ade80" />
                    <stop offset="100%" stopColor="#16a34a" />
                  </linearGradient>
                  
                  <linearGradient id="gradient-verified" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#c2410c" />
                  </linearGradient>
                  
                  <linearGradient id="gradient-banned" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f87171" />
                    <stop offset="100%" stopColor="#dc2626" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 min-h-[180px]">
                {/* Chart Container */}
                <div className="relative flex justify-center items-center h-[160px] w-[160px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={activeChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {activeChartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.fill} 
                            filter="url(#pie-3d-shadow)"
                            stroke={theme === 'dark' ? '#111827' : '#ffffff'}
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <ChartTooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Label */}
                  <div className="absolute flex flex-col items-center justify-center pointer-events-none text-center">
                    <span className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                      {totalUsers}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold mt-0.5">
                      Total Users
                    </span>
                  </div>
                </div>

                {/* Custom Legend */}
                <div className="flex-1 w-full space-y-2 max-w-[200px]">
                  {chartData.map((item) => {
                    const percent = totalUsers > 0 ? ((item.value / totalUsers) * 100).toFixed(0) : 0;
                    return (
                      <div key={item.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-2.5 h-2.5 rounded-sm shrink-0" 
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-gray-600 dark:text-gray-400 font-medium">
                            {item.name}
                          </span>
                        </div>
                        <span className="font-bold text-gray-900 dark:text-gray-100 ml-4">
                          {item.value} <span className="font-normal text-gray-400 dark:text-gray-500">({percent}%)</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Event Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Event Approval Status</CardTitle>
              <CardDescription>Event moderation overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-600" />
                    <span className="text-sm text-gray-600">Pending</span>
                  </div>
                  <span className="text-sm font-semibold">
                    {stats?.events.pending || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-600">Approved</span>
                  </div>
                  <span className="text-sm font-semibold">
                    {stats?.events.approved || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm text-gray-600">Rejected</span>
                  </div>
                  <span className="text-sm font-semibold">
                    {stats?.events.rejected || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t pt-4">
                  <span className="text-sm font-medium text-gray-700">Total Events</span>
                  <span className="text-sm font-bold">
                    {stats?.events.total || 0}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600 dark:text-gray-900 transition-colors px-1 text-center border border-transparent"
                    asChild
                  >
                    <Link to="/admin-panel/events">
                      Review Approvals
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:border-emerald-900/50 dark:text-emerald-400 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-300 transition-colors px-1 text-center"
                    asChild
                  >
                    <Link to="/admin-panel/current-events">
                      View Current Events
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Newsletters */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Newsletters</CardTitle>
                  <CardDescription>Published content</CardDescription>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.newsletters.total || 0}</div>
              <div className="mt-3 space-y-1 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Total Views:</span>
                  <span className="font-semibold">{stats?.newsletters.total_views || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Downloads:</span>
                  <span className="font-semibold">{stats?.newsletters.total_downloads || 0}</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:border-blue-900/50 dark:text-blue-400 dark:hover:bg-blue-950/30 dark:hover:text-blue-300 transition-colors"
                  asChild
                >
                  <Link to="/admin-panel/newsletters">
                    Manage
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Bans */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">User Bans</CardTitle>
                  <CardDescription>Moderation actions</CardDescription>
                </div>
                <UserX className="h-8 w-8 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.bans.active || 0}</div>
              <div className="mt-3 space-y-1 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Total Bans:</span>
                  <span className="font-semibold">{stats?.bans.total || 0}</span>
                </div>
                <div className="h-4" /> {/* Spacer to align divider with Newsletters card */}
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:text-red-300 transition-colors"
                  asChild
                >
                  <Link to="/admin-panel/banned">
                    View Banned Users
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col gap-2.5 max-h-[280px] overflow-y-auto pr-1">
                  {sortedActions.map((action) => {
                    const Icon = action.icon;
                    if (action.count > 0) {
                      return (
                        <Link
                          key={action.id}
                          to={action.route}
                          className={`flex items-center gap-2 text-sm font-medium transition-colors py-1 ${action.activeColor}`}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span>{action.title}</span>
                        </Link>
                      );
                    } else {
                      return (
                        <Link
                          key={action.id}
                          to={action.route}
                          className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-500 transition-colors py-1 opacity-60 cursor-pointer"
                        >
                          <Icon className="h-4 w-4 text-gray-300 dark:text-gray-700 shrink-0" />
                          <span>{action.title}</span>
                        </Link>
                      );
                    }
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
