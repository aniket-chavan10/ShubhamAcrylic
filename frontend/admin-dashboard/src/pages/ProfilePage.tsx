import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import { getMe, changePassword, listAdmins, createAdmin, deleteAdmin } from "../services/profileService";
import { User, KeyRound, UserPlus, Shield, Trash2, CheckCircle2, AlertCircle } from "lucide-react";

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passMsg, setPassMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passSubmitting, setPassSubmitting] = useState(false);

  // New admin state
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [adminMsg, setAdminMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [adminSubmitting, setAdminSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const me = await getMe();
      setCurrentUser(me);
      const list = await listAdmins();
      setAdmins(list);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg(null);
    if (newPassword !== confirmPassword) {
      setPassMsg({ type: "error", text: "New passwords do not match!" });
      return;
    }
    if (newPassword.length < 6) {
      setPassMsg({ type: "error", text: "Password must be at least 6 characters!" });
      return;
    }

    setPassSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPassMsg({ type: "success", text: "Password changed successfully!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPassMsg({ type: "error", text: err.message || "Failed to update password" });
    } finally {
      setPassSubmitting(false);
    }
  };

  const handleCreateAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminMsg(null);
    setAdminSubmitting(true);
    try {
      await createAdmin(newUsername, newEmail, newAdminPassword);
      setAdminMsg({ type: "success", text: `Admin user '${newUsername}' created successfully!` });
      setNewUsername("");
      setNewEmail("");
      setNewAdminPassword("");
      fetchData();
    } catch (err: any) {
      setAdminMsg({ type: "error", text: err.message || "Failed to create admin" });
    } finally {
      setAdminSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (id: number, username: string) => {
    if (!window.confirm(`Are you sure you want to delete admin '${username}'?`)) return;
    try {
      await deleteAdmin(id);
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to delete admin");
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Admin Profile & Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your credentials and secondary admin accounts</p>
        </div>

        {/* ── Section 1: Current User Profile Card ────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-2xl flex items-center justify-center shadow-lg">
              {currentUser?.username?.[0]?.toUpperCase() || "A"}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-800">{currentUser?.username}</h2>
                {currentUser?.isMaster ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                    <Shield size={12} /> MASTER ADMIN
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                    <User size={12} /> Standard Admin
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">{currentUser?.email}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ── Section 2: Change Password ────────────────────────────────────── */}
          <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                <KeyRound className="text-indigo-600" size={20} />
                <h3 className="text-lg font-bold text-gray-800">Change Password</h3>
              </div>

              {passMsg && (
                <div
                  className={`p-3.5 rounded-xl mb-4 text-xs font-semibold flex items-center gap-2 ${
                    passMsg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                  }`}
                >
                  {passMsg.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  {passMsg.text}
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Current Password</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={passSubmitting}
                  className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition duration-150 disabled:opacity-50 text-sm mt-2"
                >
                  {passSubmitting ? "Updating..." : "Update Password"}
                </button>
              </form>
            </div>
          </div>

          {/* ── Section 3: Create Secondary Admin ─────────────────────────────── */}
          <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                <UserPlus className="text-indigo-600" size={20} />
                <h3 className="text-lg font-bold text-gray-800">Create New Admin Account</h3>
              </div>

              {adminMsg && (
                <div
                  className={`p-3.5 rounded-xl mb-4 text-xs font-semibold flex items-center gap-2 ${
                    adminMsg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                  }`}
                >
                  {adminMsg.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  {adminMsg.text}
                </div>
              )}

              <form onSubmit={handleCreateAdminSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. client_admin"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. client@shubhamtees.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Initial Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Set starting password"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={adminSubmitting}
                  className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-lg hover:bg-emerald-700 transition duration-150 disabled:opacity-50 text-sm mt-2"
                >
                  {adminSubmitting ? "Creating..." : "Create Admin User"}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* ── Section 4: All Admin Accounts Table ─────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 pb-3 border-b border-gray-100">All Registered Admins</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-gray-800 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                        {admin.username[0]?.toUpperCase()}
                      </div>
                      {admin.username}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{admin.email}</td>
                    <td className="py-3 px-4">
                      {admin.isMaster ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                          <Shield size={10} /> MASTER
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700">
                          Standard
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {!admin.isMaster && admin.id !== currentUser?.id && (
                        <button
                          onClick={() => handleDeleteAdmin(admin.id, admin.username)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Admin"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
