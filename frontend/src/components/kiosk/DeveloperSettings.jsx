import { useEffect, useState } from 'react';
import api, { configureApi } from '../../api/axios';
import {
  buildApiBaseUrl,
  getActiveApiBaseUrl,
  parseApiBaseUrl,
  setManualApiBaseUrl,
} from '../../config/kioskConfig';
import bundledKioskConfig from '../../config/kiosk-config.bundled.json';
import { useToast } from '../../hooks/useToast';

export default function DeveloperSettings() {
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [ip, setIp] = useState('');
  const [port, setPort] = useState('5000');
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!open) return;
    const active = getActiveApiBaseUrl();
    const parsed = parseApiBaseUrl(active);
    setIp(parsed.ip);
    setPort(parsed.port);
    setStatus('');
  }, [open]);

  const handleSave = async () => {
    if (!ip.trim()) {
      showToast('Enter a server IP address', 'error');
      return;
    }

    const apiBaseUrl = buildApiBaseUrl(ip, port);
    setManualApiBaseUrl(apiBaseUrl);
    configureApi(apiBaseUrl);
    setStatus(`Using ${apiBaseUrl}`);
    showToast('Server IP saved', 'success');
    setOpen(false);
  };

  const handleReset = () => {
    setManualApiBaseUrl('');
    const defaultUrl = bundledKioskConfig.apiBaseUrl;
    configureApi(defaultUrl);
    const parsed = parseApiBaseUrl(defaultUrl);
    setIp(parsed.ip);
    setPort(parsed.port || '5000');
    setStatus('Reset to default server');
    showToast('Reset to default server', 'success');
  };

  const handleTest = async () => {
    if (!ip.trim()) {
      showToast('Enter a server IP address', 'error');
      return;
    }

    setTesting(true);
    setStatus('');

    const testUrl = buildApiBaseUrl(ip, port);
    configureApi(testUrl);

    try {
      const { data } = await api.get('/health');
      setStatus(data?.status === 'ok' ? 'Connected successfully' : 'Server responded');
      showToast('Connection successful', 'success');
    } catch {
      setStatus('Could not reach server');
      showToast('Connection failed', 'error');
    } finally {
      configureApi(getActiveApiBaseUrl());
      setTesting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed top-3 right-3 sm:top-4 sm:right-4 z-50 flex items-center gap-1.5 sm:gap-2 rounded-xl bg-slate-800/90 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white shadow-lg backdrop-blur hover:bg-slate-700"
        aria-label="Developer settings"
      >
        <span aria-hidden>⚙️</span>
        <span>Dev</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Developer Settings</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Set the PC server IP for this kiosk tablet.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Server IP
                </label>
                <input
                  type="text"
                  value={ip}
                  onChange={(e) => setIp(e.target.value)}
                  placeholder="192.168.1.231"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Port
                </label>
                <input
                  type="text"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  placeholder="5000"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Current: <span className="font-mono">{getActiveApiBaseUrl()}</span>
              </p>

              {status && (
                <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                  {status}
                </p>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleSave}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                Save
              </button>
              <button
                type="button"
                onClick={handleTest}
                disabled={testing}
                className="w-full py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {testing ? 'Testing...' : 'Test Connection'}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="w-full rounded-2xl px-8 py-4 text-lg font-bold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Reset to Default
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
