import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import { getMe, changePassword, listAdmins, createAdmin, deleteAdmin } from "../services/profileService";
import { AlertCircle, CheckCircle2, KeyRound, Loader2, Shield, Trash2, User, UserPlus, Users } from "lucide-react";
import BrandLogo from "../components/BrandLogo";
import { PageLoader } from "../components/ui";

type Msg = { type: "success" | "error"; text: string } | null;

const Notice = ({ msg }: { msg: Msg }) => msg && (
  <div className={`mb-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${msg.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
    {msg.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
    {msg.text}
  </div>
);

const RoleBadge = ({ master }: { master?: boolean }) => (master
  ? <span className="a-badge bg-accent-soft text-accent-dark"><Shield className="h-3 w-3" /> Master admin</span>
  : <span className="a-badge bg-paper text-muted"><User className="h-3 w-3" /> Admin</span>);

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passMsg, setPassMsg] = useState<Msg>(null);
  const [passSubmitting, setPassSubmitting] = useState(false);

  // New admin state
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [adminMsg, setAdminMsg] = useState<Msg>(null);
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

  const pwField = (id: string, label: string, value: string, set: (v: string) => void, autoComplete: string, placeholder = "") => (
    <div>
      <label htmlFor={id} className="a-label">{label}</label>
      <input id={id} type="password" required autoComplete={autoComplete} placeholder={placeholder} value={value} onChange={(e) => set(e.target.value)} className="a-input" />
    </div>
  );

  if (loading) {
    return <AdminLayout title="My Profile"><PageLoader /></AdminLayout>;
  }

  return (
    <AdminLayout title="My Profile">
      <div className="max-w-5xl space-y-5 sm:space-y-6">
        {/* Current user */}
        <div className="a-card flex items-center gap-4 p-5 sm:p-6">
          <BrandLogo className="h-14 w-14 rounded-2xl ring-1 ring-line sm:h-16 sm:w-16" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate font-display text-xl font-bold">{currentUser?.username}</h2>
              <RoleBadge master={currentUser?.isMaster} />
            </div>
            <p className="truncate text-sm text-muted">{currentUser?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
          {/* Change password */}
          <div className="a-card p-5 sm:p-6">
            <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-bold"><KeyRound className="h-5 w-5" /> Change password</h3>
            <Notice msg={passMsg} />
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {pwField("current-password", "Current password", currentPassword, setCurrentPassword, "current-password")}
              {pwField("new-password", "New password", newPassword, setNewPassword, "new-password", "At least 6 characters")}
              {pwField("confirm-password", "Confirm new password", confirmPassword, setConfirmPassword, "new-password")}
              <button type="submit" disabled={passSubmitting} className="a-btn-primary w-full">
                {passSubmitting && <Loader2 className="h-4 w-4 animate-spin" />} {passSubmitting ? "Updating…" : "Update password"}
              </button>
            </form>
          </div>

          {/* New admin */}
          <div className="a-card p-5 sm:p-6">
            <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-bold"><UserPlus className="h-5 w-5" /> Add an admin</h3>
            <Notice msg={adminMsg} />
            <form onSubmit={handleCreateAdminSubmit} className="space-y-4">
              <div>
                <label htmlFor="new-username" className="a-label">Username</label>
                <input id="new-username" type="text" required placeholder="e.g. store_manager" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="a-input" />
              </div>
              <div>
                <label htmlFor="new-email" className="a-label">Email address</label>
                <input id="new-email" type="email" required placeholder="name@astitvacreations.shop" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="a-input" />
              </div>
              {pwField("new-admin-password", "Initial password", newAdminPassword, setNewAdminPassword, "new-password", "They can change it after signing in")}
              <button type="submit" disabled={adminSubmitting} className="a-btn-accent w-full">
                {adminSubmitting && <Loader2 className="h-4 w-4 animate-spin" />} {adminSubmitting ? "Creating…" : "Create admin"}
              </button>
            </form>
          </div>
        </div>

        {/* All admins */}
        <div className="a-card overflow-hidden">
          <h3 className="flex items-center gap-2 border-b border-line px-5 py-4 font-display text-lg font-bold sm:px-6"><Users className="h-5 w-5" /> All admins</h3>
          <ul className="divide-y divide-line">
            {admins.map((admin) => (
              <li key={admin.id} className="flex items-center gap-3 px-5 py-3 sm:px-6">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-paper text-sm font-bold">{admin.username?.[0]?.toUpperCase()}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{admin.username}{admin.id === currentUser?.id && <span className="font-normal text-muted"> (you)</span>}</p>
                  <p className="truncate text-xs text-muted">{admin.email}</p>
                </div>
                <RoleBadge master={admin.isMaster} />
                {!admin.isMaster && admin.id !== currentUser?.id ? (
                  <button onClick={() => handleDeleteAdmin(admin.id, admin.username)} className="a-icon-btn-danger -mr-2" title="Delete admin"><Trash2 className="h-4 w-4" /></button>
                ) : <span className="w-7" />}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AdminLayout>
  );

}
