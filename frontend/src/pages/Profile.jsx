import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateProfile } from "../features/auth/authSlice";
import { toast } from "react-toastify";
import { User, Mail, Phone, Lock, Save, KeyRound } from "lucide-react";

export default function Profile() {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((s) => s.auth);
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwSection, setShowPwSection] = useState(false);

  useEffect(() => { setName(user?.name || ""); setPhone(user?.phone || ""); }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Name cannot be empty"); return; }
    if (phone && !/^\d{10}$/.test(phone.trim())) { toast.error("Enter a valid 10-digit phone number"); return; }
    const payload = { name: name.trim(), phone: phone.trim() };
    if (showPwSection) {
      if (!currentPassword) { toast.error("Enter your current password"); return; }
      if (newPassword.length < 6) { toast.error("New password must be at least 6 characters"); return; }
      if (newPassword !== confirmPassword) { toast.error("New passwords do not match"); return; }
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
    }
    const result = await dispatch(updateProfile(payload));
    if (!result.error) {
      toast.success("Profile updated successfully!");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setShowPwSection(false);
    } else { toast.error(result.payload || "Update failed"); }
  };

  const inputCls = "w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 outline-none focus:border-red-700 focus:bg-white focus:ring-4 focus:ring-red-700/10 transition-all box-border font-[inherit]";
  const iconCls = "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400";

  return (
    <div className="bg-gray-50 min-h-[80vh] px-4 py-6 sm:py-10 pb-20">
      <div className="w-full max-w-4xl mx-auto bg-transparent px-2 sm:px-6 md:px-10 py-6 md:py-10">
        {/* Avatar row */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-6 mb-8 pb-8 border-b border-gray-200">
          <div className="w-24 h-24 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-red-600 to-red-800 text-white flex items-center justify-center shrink-0 shadow-lg shadow-red-700/30 ring-4 ring-white relative overflow-hidden group">
            <span className="text-3xl sm:text-4xl font-black group-hover:scale-110 transition-transform duration-300">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </span>
            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
          <div className="mt-2 sm:mt-0 flex flex-col justify-center h-full sm:h-20">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 m-0 tracking-tight">{user?.name || "My Profile"}</h1>
            <p className="text-gray-500 text-sm sm:text-base mt-1 font-medium">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          {/* Personal Info */}
          <div className="pb-8 border-b border-gray-200">
            <h2 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center justify-center sm:justify-start gap-2">
              <User className="w-4 h-4 text-red-700" />
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-2">Full Name *</label>
                <div className="relative group">
                  <User className={`${iconCls} group-focus-within:text-red-700 transition-colors`} />
                  <input className={inputCls} placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className={iconCls} />
                  <input className={`${inputCls} bg-gray-100 text-gray-400 cursor-not-allowed`} value={user?.email || ""} readOnly />
                </div>
                <p className="text-gray-400 text-[11px] mt-1.5 font-medium flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Cannot be changed.
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Phone Number</label>
                <div className="relative group">
                  <Phone className={`${iconCls} group-focus-within:text-red-700 transition-colors`} />
                  <input className={inputCls} placeholder="10-digit mobile number" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={10} />
                </div>
              </div>
            </div>
          </div>

          {/* Password */}
          <div className="pb-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              <h2 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-red-700" />
                Password
              </h2>
              <button type="button" onClick={() => setShowPwSection((v) => !v)}
                className={`w-full sm:w-auto bg-white border rounded-xl px-5 py-2.5 text-xs font-bold cursor-pointer transition-all shadow-sm active:scale-95 ${showPwSection ? 'border-gray-300 text-gray-600 hover:bg-gray-100' : 'border-red-700 text-red-700 hover:bg-red-50 hover:shadow-red-700/10'}`}>
                {showPwSection ? "Cancel Change" : "Change Password"}
              </button>
            </div>
            
            {showPwSection && (
              <div className="flex flex-col gap-5 sm:gap-6 bg-white p-5 sm:p-7 rounded-2xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">Current Password *</label>
                  <div className="relative group">
                    <Lock className={`${iconCls} group-focus-within:text-red-700 transition-colors`} />
                    <input type="password" className={inputCls} placeholder="Enter current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">New Password *</label>
                    <div className="relative group">
                      <Lock className={`${iconCls} group-focus-within:text-red-700 transition-colors`} />
                      <input type="password" className={inputCls} placeholder="Min 6 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Confirm New Password *</label>
                    <div className="relative group">
                      <Lock className={`${iconCls} group-focus-within:text-red-700 transition-colors`} />
                      <input type="password"
                        className={`${inputCls} ${confirmPassword && confirmPassword !== newPassword ? "border-red-500 focus:border-red-500 focus:ring-red-500/10 bg-red-50" : ""}`}
                        placeholder="Repeat new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                    </div>
                    {confirmPassword && confirmPassword !== newPassword && <p className="text-red-500 text-[11px] mt-1.5 font-bold animate-pulse">Passwords do not match</p>}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={loading}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-red-700 hover:bg-red-800 text-white rounded-xl font-bold text-sm border-none cursor-pointer transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 ${loading ? "opacity-60 cursor-not-allowed transform-none" : ""}`}>
              <Save className="w-4 h-4" />
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
