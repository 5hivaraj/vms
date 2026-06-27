import { Outlet, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { isDeveloperSettingsAvailable } from '../../config/kioskConfig';
import DeveloperSettings from '../kiosk/DeveloperSettings';

export default function KioskLayout() {
  const { darkMode, toggleTheme } = useTheme();
  const { pathname } = useLocation();
  const isFullscreenPage =
    pathname === '/induction' || pathname === '/assessment' || pathname === '/selfie';

  return (
    <div className="min-h-full flex flex-col bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-950 dark:to-gray-900">
      {isDeveloperSettingsAvailable() && <DeveloperSettings />}
      <header
        className={`no-print flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 ${
          isFullscreenPage ? 'hidden' : ''
        }`}
      >
        <h1 className="text-base sm:text-xl font-semibold text-gray-600 dark:text-gray-400 truncate pr-2">
          Visitor Check-In
        </h1>
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 sm:p-3 rounded-xl bg-white/80 dark:bg-gray-800/80 shadow-sm hover:shadow transition-shadow shrink-0"
          aria-label="Toggle theme"
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
      </header>
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
