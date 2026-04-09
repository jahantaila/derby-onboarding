export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
      <p className="text-gray-400 mb-8">Overview of your onboarding pipeline</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {["Total Submissions", "New", "In Progress", "Active"].map((label) => (
          <div
            key={label}
            className="bg-derby-card rounded-xl p-6 border border-white/10"
          >
            <p className="text-sm text-gray-400 mb-1">{label}</p>
            <p className="text-3xl font-bold">—</p>
          </div>
        ))}
      </div>

      <p className="text-gray-500 text-sm mt-8">Stats will be populated in a future update.</p>
    </div>
  );
}
