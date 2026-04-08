import LoginForm from "@/components/admin/LoginForm";

export const metadata = {
  title: "Admin Login - Derby Digital",
};

export default function AdminLoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <h1 className="font-heading text-3xl text-white mb-2">DERBY DIGITAL</h1>
      <p className="text-white/50 font-body text-sm mb-8">Admin Dashboard</p>
      <LoginForm />
    </div>
  );
}
