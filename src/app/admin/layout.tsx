"use client";

import { usePathname, useRouter } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin";

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin");
  };

  return (
    <div className="min-h-screen bg-derby-dark">
      {!isLoginPage && (
        <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1
              className="font-heading text-xl text-white cursor-pointer"
              onClick={() => router.push("/admin/dashboard")}
            >
              DERBY DIGITAL
            </h1>
            <span className="text-white/40 text-sm font-body">
              Admin Dashboard
            </span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="text-white/50 text-sm font-body hover:text-white transition-colors"
          >
            Logout
          </button>
        </header>
      )}
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
