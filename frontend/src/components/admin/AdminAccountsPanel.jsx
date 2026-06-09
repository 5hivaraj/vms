import { useCallback, useEffect, useState } from 'react';
import { createAdminAccount, getAdminAccounts } from '../../api/admin';
import { useToast } from '../../hooks/useToast';
import LoadingSpinner from '../common/LoadingSpinner';

export default function AdminAccountsPanel() {
  const { showToast } = useToast();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const fetchAdmins = useCallback(async () => {
    try {
      const { data } = await getAdminAccounts();
      setAdmins(data.admins);
    } catch {
      showToast('Failed to load admin accounts', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createAdminAccount(form);
      showToast('Admin account created', 'success');
      setForm({ name: '', email: '', password: '' });
      fetchAdmins();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create admin', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
      <h2 className="text-xl font-semibold mb-1">Admin Accounts</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Give staff login access to change the induction video and view visitor records.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <h3 className="font-medium text-gray-700 dark:text-gray-300">Create new admin</h3>
          <input
            type="text"
            required
            placeholder="Full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <input
            type="email"
            required
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password (min 6 characters)"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50"
          >
            {saving ? 'Creating...' : 'Create Admin Account'}
          </button>
        </form>

        <div>
          <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-4">Existing admins</h3>
          {loading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <ul className="space-y-2">
              {admins.map((admin) => (
                <li
                  key={admin._id}
                  className="px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
                >
                  <p className="font-medium">{admin.name}</p>
                  <p className="text-sm text-gray-500">{admin.email}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
