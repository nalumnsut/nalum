import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { getAllUsers, banUser, unbanUser, User } from "../../lib/adminApi";
import { Ban, Search, UserCheck, Trash2 } from "lucide-react";
import api from "../../lib/api";
import { DeleteConfirmDialog } from "../../components/ui/DeleteConfirmDialog";

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [bannedFilter, setBannedFilter] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState("");
  const [showBanModal, setShowBanModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [banDuration, setBanDuration] = useState("7d");
  const [banReason, setBanReason] = useState("");
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeletingUser(true);
    try {
      await api.delete(`/admin/users/${userToDelete._id}`);
      alert("User account deactivated/deleted successfully");
      setDeleteUserDialogOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to deactivate user");
    } finally {
      setIsDeletingUser(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, bannedFilter, verifiedFilter]);

  const fetchUsers = async () => {
    try {
      const response = await getAllUsers({
        search,
        role: roleFilter || undefined,
        banned: bannedFilter === "" ? undefined : bannedFilter === "banned" ? true : false,
        verified: verifiedFilter === "" ? undefined : verifiedFilter === "verified" ? true : false,
        limit: 50,
      });
      if (response.success) {
        setUsers(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBanClick = (user: User) => {
    setSelectedUser(user);
    setShowBanModal(true);
  };

  const handleBanSubmit = async () => {
    if (!selectedUser || !banReason.trim()) {
      alert("Please provide a reason");
      return;
    }

    try {
      await banUser(selectedUser._id, banDuration, banReason);
      alert("User banned successfully");
      setShowBanModal(false);
      setBanReason("");
      fetchUsers();
    } catch (err) {
      const error = err as Error;
      alert(err.response?.data?.message || "Failed to ban user");
    }
  };

  const handleUnban = async (user: User) => {
    if (!confirm(`Are you sure you want to unban ${user.name}?`)) {
      return;
    }

    try {
      await unbanUser(user._id);
      alert("User unbanned successfully");
      fetchUsers();
    } catch (err) {
      const error = err as Error;
      alert(err.response?.data?.message || "Failed to unban user");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">Manage and moderate users</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
              <option value="">All Roles</option>
              <option value="student">Student</option>
              <option value="alumni">Alumni</option>
              <option value="faculty">Faculty</option>
              <option value="admin">Admin</option>
            </select>
            <select
              value={verifiedFilter}
              onChange={(e) => setVerifiedFilter(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
              <option value="">All Verification</option>
              <option value="verified">Verified Only</option>
              <option value="unverified">Unverified Only</option>
            </select>
            <select
              value={bannedFilter}
              onChange={(e) => setBannedFilter(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
              <option value="">All Users</option>
              <option value="banned">Banned Only</option>
              <option value="unbanned">Unbanned Only</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === "admin" ? "bg-purple-100 text-purple-800" :
                      user.role === "alumni" ? "bg-blue-100 text-blue-800" :
                      user.role === "faculty" ? "bg-amber-100 text-amber-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.banned ? (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Banned
                      </span>
                    ) : user.verified_alumni ? (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Verified
                      </span>
                    ) : (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Unverified
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm flex items-center gap-3">
                    {user.role !== "admin" && (
                      <>
                        {user.banned ? (
                          <button
                            onClick={() => handleUnban(user)}
                            className="text-green-600 hover:text-green-900 flex items-center space-x-1"
                          >
                            <UserCheck size={16} />
                            <span>Unban</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBanClick(user)}
                            className="text-red-600 hover:text-red-900 flex items-center space-x-1"
                          >
                            <Ban size={16} />
                            <span>Ban</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setUserToDelete(user);
                            setDeleteUserDialogOpen(true);
                          }}
                          className="text-gray-500 hover:text-red-600 flex items-center space-x-1"
                          title="Deactivate/Delete User Account"
                        >
                          <Trash2 size={16} />
                          <span>Delete</span>
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Ban Modal */}
        {showBanModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">Ban User</h3>
              <p className="text-sm text-gray-600 mb-4">
                Ban {selectedUser.name} ({selectedUser.email})
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                  <select
                    value={banDuration}
                    onChange={(e) => setBanDuration(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg p-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="24h">24 Hours</option>
                    <option value="7d">7 Days</option>
                    <option value="30d">30 Days</option>
                    <option value="365d">1 Year</option>
                    <option value="permanent">Permanent</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                  <textarea
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg p-3 min-h-[100px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Enter reason for ban..."
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowBanModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBanSubmit}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Ban User
                </button>
              </div>
            </div>
          </div>
        )}

        <DeleteConfirmDialog
          open={deleteUserDialogOpen}
          onOpenChange={setDeleteUserDialogOpen}
          title="Deactivate/Delete User Account?"
          description={`Are you sure you want to deactivate ${userToDelete?.name}'s account and soft-delete their content?`}
          isDeleting={isDeletingUser}
          onConfirm={handleDeleteUser}
        />
      </div>
    </AdminLayout>
  );
};

export default UserManagement;
