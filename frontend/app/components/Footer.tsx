export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-gray-100 px-6 py-5 lg:px-8">
      <div className="flex flex-col gap-2 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-600">
            LeaveFlow
          </span>
          <span>•</span>
          <span>Leave Management Platform</span>
        </div>

        <div className="flex items-center gap-3">
          <span>Secure</span>
          <span>•</span>
          <span>Organized</span>
          <span>•</span>
          <span>2026</span>
        </div>
      </div>
    </footer>
  );
}