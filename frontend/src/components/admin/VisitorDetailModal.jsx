export default function VisitorDetailModal({ visitor, photoUrl, onClose }) {
  if (!visitor) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="visitor-detail-title"
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h2 id="visitor-detail-title" className="text-xl font-bold">
            Visitor Details
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex flex-col items-center text-center">
            <img
              src={photoUrl}
              alt={visitor.name}
              className="w-32 h-32 rounded-full object-cover border-4 border-blue-500 mb-4"
            />
            <p className="text-4xl font-extrabold text-blue-600 dark:text-blue-400 font-mono tracking-widest">
              {visitor.tokenNumber}
            </p>
          </div>

          <dl className="space-y-4 text-base">
            <DetailRow label="Full Name" value={visitor.name} />
            <DetailRow label="Mobile" value={visitor.mobile} />
            <DetailRow label="Company" value={visitor.company} />
            <DetailRow label="Purpose of Visit" value={visitor.purpose || '—'} />
            <DetailRow
              label="Induction Completed"
              value={visitor.inductionCompleted ? 'Yes' : 'No'}
            />
            <DetailRow
              label="Visit Date"
              value={new Date(visitor.visitDate).toLocaleDateString()}
            />
            <DetailRow
              label="Check-in Time"
              value={new Date(visitor.createdAt).toLocaleTimeString()}
            />
            <DetailRow
              label="Registered At"
              value={new Date(visitor.createdAt).toLocaleString()}
            />
          </dl>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:gap-4 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <dt className="sm:w-40 font-medium text-gray-500 dark:text-gray-400 shrink-0">{label}</dt>
      <dd className="text-gray-900 dark:text-gray-100">{value}</dd>
    </div>
  );
}
