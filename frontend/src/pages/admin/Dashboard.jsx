import { useCallback, useEffect, useState } from 'react';
import { getStats, getVisitors, exportExcel, exportPDF } from '../../api/admin';
import { useToast } from '../../hooks/useToast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import VisitorDetailModal from '../../components/admin/VisitorDetailModal';
import AdminAccountsPanel from '../../components/admin/AdminAccountsPanel';
import VideoSettingsPanel from '../../components/admin/VideoSettingsPanel';
import AssessmentSettingsPanel from '../../components/admin/AssessmentSettingsPanel';
import PermitSettingsPanel from '../../components/admin/PermitSettingsPanel';
import { resolveMediaUrl } from '../../utils/mediaUrl';

export default function Dashboard() {
  const { showToast } = useToast();
  const [stats, setStats] = useState(null);
  const [visitors, setVisitors] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [exporting, setExporting] = useState(null);
  const [selectedVisitor, setSelectedVisitor] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await getStats();
      setStats(data);
    } catch {
      showToast('Failed to load stats', 'error');
    }
  }, [showToast]);

  const fetchVisitors = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = { page, limit: 15 };
        if (search) params.search = search;
        if (dateFilter) params.date = dateFilter;
        const { data } = await getVisitors(params);
        setVisitors(data.visitors);
        setPagination(data.pagination);
      } catch {
        showToast('Failed to load visitors', 'error');
      } finally {
        setLoading(false);
      }
    },
    [search, dateFilter, showToast]
  );

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    const debounce = setTimeout(() => fetchVisitors(1), 300);
    return () => clearTimeout(debounce);
  }, [fetchVisitors]);

  const handleExport = async (type) => {
    setExporting(type);
    try {
      const params = {};
      if (search) params.search = search;
      if (dateFilter) params.date = dateFilter;

      const response = type === 'excel' ? await exportExcel(params) : await exportPDF(params);
      const blob = new Blob([response.data], {
        type:
          type === 'excel'
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : 'application/pdf',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `visitors.${type === 'excel' ? 'xlsx' : 'pdf'}`;
      link.click();
      window.URL.revokeObjectURL(url);
      showToast(`Exported as ${type.toUpperCase()}`, 'success');
    } catch {
      showToast('Export failed', 'error');
    } finally {
      setExporting(null);
    }
  };

  const getPhotoUrl = (url) => resolveMediaUrl(url);

  return (
    <div className="space-y-6 sm:space-y-8">
      <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Visitors Today"
          value={stats?.visitorsToday ?? '—'}
          icon="📊"
          color="blue"
        />
        <StatCard
          title="Visitors This Month"
          value={stats?.visitorsThisMonth ?? '—'}
          icon="📅"
          color="green"
        />
        <StatCard
          title="Last Token"
          value={stats?.lastToken ?? '—'}
          subtitle={stats?.tokenDate}
          icon="🎫"
          color="purple"
        />
      </div>

      <AdminAccountsPanel />

      <VideoSettingsPanel />

      <AssessmentSettingsPanel />

      <PermitSettingsPanel />

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold">Visitor Records</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Tap any record to view full visitor details
              </p>
            </div>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, mobile, token..."
                className="w-full sm:w-auto px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none sm:min-w-[220px]"
              />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full sm:w-auto px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleExport('excel')}
                  disabled={exporting}
                  className="flex-1 sm:flex-none px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 text-sm sm:text-base"
                >
                  {exporting === 'excel' ? '...' : 'Export Excel'}
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('pdf')}
                  disabled={exporting}
                  className="flex-1 sm:flex-none px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium disabled:opacity-50 text-sm sm:text-base"
                >
                  {exporting === 'pdf' ? '...' : 'Export PDF'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : visitors.length === 0 ? (
          <p className="p-12 text-center text-gray-500">No visitors found</p>
        ) : (
          <>
            <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-800">
              {visitors.map((v) => (
                <button
                  key={v._id}
                  type="button"
                  onClick={() => setSelectedVisitor(v)}
                  className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={getPhotoUrl(v.photoUrl)}
                      alt={v.name}
                      className="w-12 h-12 rounded-full object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-mono font-bold text-blue-600 dark:text-blue-400">
                        {v.tokenNumber}
                      </p>
                      <p className="font-medium truncate">{v.name}</p>
                      <p className="text-sm text-gray-500 truncate">
                        {v.mobile} · {v.company}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(v.visitDate).toLocaleDateString()} ·{' '}
                    {new Date(v.createdAt).toLocaleTimeString()}
                  </p>
                </button>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-3 text-sm font-semibold">Token</th>
                    <th className="px-6 py-3 text-sm font-semibold">Photo</th>
                    <th className="px-6 py-3 text-sm font-semibold">Name</th>
                    <th className="px-6 py-3 text-sm font-semibold">Mobile</th>
                    <th className="px-6 py-3 text-sm font-semibold">Company</th>
                    <th className="px-6 py-3 text-sm font-semibold">Purpose</th>
                    <th className="px-6 py-3 text-sm font-semibold">Date</th>
                    <th className="px-6 py-3 text-sm font-semibold">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {visitors.map((v) => (
                    <tr
                      key={v._id}
                      onClick={() => setSelectedVisitor(v)}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/30 cursor-pointer"
                    >
                      <td className="px-6 py-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {v.tokenNumber}
                      </td>
                      <td className="px-6 py-4">
                        <img
                          src={getPhotoUrl(v.photoUrl)}
                          alt={v.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      </td>
                      <td className="px-6 py-4">{v.name}</td>
                      <td className="px-6 py-4">{v.mobile}</td>
                      <td className="px-6 py-4">{v.company}</td>
                      <td className="px-6 py-4 text-gray-500 max-w-[160px] truncate">
                        {v.purpose || '—'}
                      </td>
                      <td className="px-6 py-4">
                        {new Date(v.visitDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        {new Date(v.createdAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.pages > 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-800">
                <p className="text-sm text-gray-500 text-center sm:text-left">
                  Page {pagination.page} of {pagination.pages} ({pagination.total} total)
                </p>
                <div className="flex gap-2 justify-center sm:justify-end">
                  <button
                    type="button"
                    disabled={pagination.page <= 1}
                    onClick={() => fetchVisitors(pagination.page - 1)}
                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => fetchVisitors(pagination.page + 1)}
                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <VisitorDetailModal
        visitor={selectedVisitor}
        photoUrl={selectedVisitor ? getPhotoUrl(selectedVisitor.photoUrl) : ''}
        onClose={() => setSelectedVisitor(null)}
      />
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, color }) {
  const colors = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
  };

  return (
    <div className={`rounded-xl border p-4 sm:p-6 ${colors[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">{title}</span>
        <span className="text-xl sm:text-2xl">{icon}</span>
      </div>
      <p className="text-3xl sm:text-4xl font-bold break-words">{value}</p>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}
