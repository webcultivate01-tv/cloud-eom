import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/auth/authSlice";
import { clearCart } from "../features/cart/cartSlice";
import { fetchPendingCount } from "../features/inquiry/inquirySlice";
import { toast } from "react-toastify";
import {
  LayoutDashboard, Package, ShoppingCart, Users, ShieldCheck,
  CalendarDays, Tag, Mail, Star, RefreshCw, Download, Bell,
  Home, LogOut, Menu, X, ChevronRight, Zap, CreditCard,
} from "lucide-react";

const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [
      { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/admin/orders",    icon: ShoppingCart,    label: "Orders" },
      { to: "/admin/payments",  icon: CreditCard,      label: "Payments" },
    ],
  },
  {
    label: "Catalog",
    items: [
      { to: "/admin/products",   icon: Package,      label: "Products" },
      { to: "/admin/categories", icon: Tag,          label: "Categories" },
      { to: "/admin/events",     icon: CalendarDays, label: "Events" },
    ],
  },
  {
    label: "Customers",
    items: [
      { to: "/admin/users",        icon: Users,     label: "Users" },
      { to: "/admin/inquiries",    icon: Mail,      label: "Enquiries", badge: true },
      { to: "/admin/reviews",      icon: Star,      label: "Reviews" },
      { to: "/admin/replacements", icon: RefreshCw, label: "Replacements" },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/admin/admins", icon: ShieldCheck, label: "Admin Management" },
      { to: "/admin/export", icon: Download,    label: "Data Export" },
    ],
  },
];

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const { user }   = useSelector((s) => s.auth);
  const { pendingCount } = useSelector((s) => s.inquiry);

  useEffect(() => {
    dispatch(fetchPendingCount());
    const id = setInterval(() => dispatch(fetchPendingCount()), 60_000);
    return () => clearInterval(id);
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearCart());
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const initials = user?.name?.[0]?.toUpperCase() ?? "A";

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside
        className="admin-sidebar flex flex-col sticky top-0 h-screen shrink-0 overflow-hidden z-20"
        style={{
          width: sidebarOpen ? "256px" : "68px",
          transition: "width 0.25s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* Brand row */}
        <div className="flex items-center gap-3 px-4 h-[64px] border-b border-slate-100 shrink-0">
          <div className="w-8 h-8 shrink-0 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Zap className="text-white" size={16} />
          </div>
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-slate-900 font-bold text-sm leading-tight tracking-tight truncate">
                Cloud Graphics
              </p>
              <p className="text-indigo-500 text-[10px] font-semibold truncate tracking-widest uppercase">
                Admin Console
              </p>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="ml-auto w-7 h-7 shrink-0 flex items-center justify-center rounded-lg
                       text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all duration-150"
            title="Toggle sidebar"
          >
            {sidebarOpen ? <X size={15} /> : <Menu size={15} />}
          </button>
        </div>

        {/* User badge */}
        {user && (
          <div className={`px-3 mt-4 mb-1 shrink-0 ${!sidebarOpen ? "flex justify-center" : ""}`}>
            {sidebarOpen ? (
              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-8 h-8 shrink-0 rounded-lg bg-indigo-600
                                text-white flex items-center justify-center font-bold text-sm">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-slate-800 text-sm font-semibold truncate leading-tight">{user.name}</p>
                  <p className="text-slate-400 text-[11px] truncate">
                    {user.adminRole === "superAdmin" ? "Super Admin" : "Sub Admin"}
                  </p>
                </div>
                <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full tracking-wide ${
                  user.adminRole === "superAdmin"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-indigo-100 text-indigo-700"
                }`}>
                  {user.adminRole === "superAdmin" ? "SUPER" : "ADMIN"}
                </span>
              </div>
            ) : (
              <div
                className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm"
                title={user.name}
              >
                {initials}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 flex flex-col gap-0.5 overflow-y-auto scrollbar-hide">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="mb-1">
              {sidebarOpen && (
                <p className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 select-none">
                  {section.label}
                </p>
              )}
              {!sidebarOpen && (
                <div className="my-2 mx-3 h-px bg-slate-100" />
              )}
              {section.items.map(({ to, icon: Icon, label, badge }) => (
                <NavLink
                  key={to}
                  to={to}
                  title={!sidebarOpen ? label : undefined}
                  className={({ isActive }) =>
                    `group flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium
                     transition-all duration-150 whitespace-nowrap select-none relative
                     ${!sidebarOpen ? "justify-center" : ""}
                     ${isActive
                       ? "bg-indigo-50 text-indigo-700"
                       : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                     }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-indigo-600 rounded-r-full" />
                      )}
                      <span className="shrink-0 relative">
                        <Icon size={16} strokeWidth={isActive ? 2.5 : 1.8} />
                        {badge && pendingCount > 0 && !sidebarOpen && (
                          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white
                                           text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                            {pendingCount > 9 ? "9+" : pendingCount}
                          </span>
                        )}
                      </span>
                      {sidebarOpen && <span className="flex-1">{label}</span>}
                      {sidebarOpen && badge && pendingCount > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full
                                         px-1.5 py-0.5 min-w-[20px] text-center leading-none">
                          {pendingCount > 99 ? "99+" : pendingCount}
                        </span>
                      )}
                      {sidebarOpen && !badge && isActive && (
                        <ChevronRight size={13} className="ml-auto text-indigo-400" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="px-3 pb-4 pt-3 border-t border-slate-100 flex flex-col gap-0.5 shrink-0">
          <NavLink
            to="/"
            title={!sidebarOpen ? "Back to Site" : undefined}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] text-slate-500
                        hover:text-slate-900 hover:bg-slate-50 transition-all whitespace-nowrap
                        ${!sidebarOpen ? "justify-center" : ""}`}
          >
            <Home size={16} strokeWidth={1.8} />
            {sidebarOpen && <span>Back to Site</span>}
          </NavLink>
          <button
            onClick={handleLogout}
            title={!sidebarOpen ? "Logout" : undefined}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px]
                        text-red-500 hover:text-red-700 hover:bg-red-50
                        transition-all whitespace-nowrap w-full
                        ${!sidebarOpen ? "justify-center" : ""}`}
          >
            <LogOut size={16} strokeWidth={1.8} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── Main area ───────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="bg-white border-b border-slate-200 px-6 h-[64px]
                           flex items-center justify-between sticky top-0 z-10 shadow-none shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-slate-500 text-xs font-medium hidden sm:block">Live</span>
            </div>
            <div className="h-4 w-px bg-slate-200 hidden sm:block" />
            <span className="text-slate-700 font-semibold text-sm hidden sm:block">Admin Panel</span>
          </div>

          <div className="flex items-center gap-2.5">
            <NavLink
              to="/admin/inquiries"
              className="relative w-9 h-9 flex items-center justify-center rounded-lg
                         text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
              title={pendingCount > 0 ? `${pendingCount} pending enquiries` : "Enquiries"}
            >
              <Bell size={18} />
              {pendingCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px]
                                 font-bold rounded-full flex items-center justify-center leading-none">
                  {pendingCount > 9 ? "9+" : pendingCount}
                </span>
              )}
            </NavLink>

            <div className="h-7 w-px bg-slate-100" />

            <div className="text-right hidden sm:block">
              <p className="text-slate-800 text-sm font-semibold leading-tight">{user?.name}</p>
              <p className="text-slate-400 text-[11px]">{user?.email}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-indigo-600
                            text-white flex items-center justify-center font-bold text-sm">
              {initials}
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide ${
              user?.adminRole === "superAdmin"
                ? "bg-amber-100 text-amber-700"
                : "bg-indigo-100 text-indigo-700"
            }`}>
              {user?.adminRole === "superAdmin" ? "SUPER" : "ADMIN"}
            </span>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
