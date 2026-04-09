"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/submissions", label: "Submissions", icon: "📋" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Don't wrap login page with sidebar
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  async function handleLogout() {
    document.cookie = "admin_token=; path=/; max-age=0";
    router.push("/admin/login");
  }

  return (
    <div className="min-h-screen bg-derby-dark flex">
      {/* Sidebar */}
      <aside className="w-64 bg-derby-card border-r border-white/10 flex flex-col shrink-0 hidden md:flex">
        <div className="p-6 border-b border-white/10">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-derby-blue to-derby-blue-deep flex items-center justify-center font-bold text-sm">
              D
            </div>
            <span className="font-bold text-lg">Derby Digital</span>
          </Link>
          <p className="text-xs text-gray-500 mt-1">Admin Dashboard</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-derby-blue/10 text-derby-blue border border-derby-blue/20"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-400/5 transition-colors"
          >
            <span>🚪</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-derby-card border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-derby-blue to-derby-blue-deep flex items-center justify-center font-bold text-xs">
            D
          </div>
          <span className="font-bold">Derby Digital</span>
        </Link>
        <div className="flex items-center gap-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-derby-blue/10 text-derby-blue"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            className="px-2 py-1.5 text-gray-400 hover:text-red-400 text-xs"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 min-h-screen md:p-0 pt-14 md:pt-0">
        <div className="p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
