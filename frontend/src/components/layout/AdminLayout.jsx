import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

export default function AdminLayout() {
  const navigate = useNavigate();
  const { darkMode, toggleTheme } = useTheme();
  const [navOpen, setNavOpen] = useState(false);
  const admin = JSON.parse(localStorage.getItem('adminUser') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  const closeNav = () => setNavOpen(false);

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-950">
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-3 sm:gap-8 min-w-0">
              <Link
                to="/admin"
                className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400 shrink-0"
                onClick={closeNav}
              >
                VMS Admin
              </Link>
              <div className="hidden md:flex items-center gap-6 lg:gap-8">
                <Link
                  to="/admin"
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  to="/"
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium"
                >
                  Kiosk
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <span className="text-sm text-gray-500 dark:text-gray-400 hidden lg:block truncate max-w-[180px]">
                {admin.name || admin.email}
              </span>
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Toggle theme"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="hidden sm:inline-flex px-3 sm:px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
              >
                Logout
              </button>
              <button
                type="button"
                onClick={() => setNavOpen((open) => !open)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Toggle menu"
                aria-expanded={navOpen}
              >
                {navOpen ? '✕' : '☰'}
              </button>
            </div>
          </div>

          {navOpen && (
            <div className="md:hidden border-t border-gray-200 dark:border-gray-800 py-3 space-y-1">
              <Link
                to="/admin"
                onClick={closeNav}
                className="block px-2 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium"
              >
                Dashboard
              </Link>
              <Link
                to="/"
                onClick={closeNav}
                className="block px-2 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium"
              >
                Kiosk
              </Link>
              <p className="px-2 pt-2 text-sm text-gray-500 dark:text-gray-400 sm:hidden">
                {admin.name || admin.email}
              </p>
              <button
                type="button"
                onClick={() => {
                  closeNav();
                  handleLogout();
                }}
                className="sm:hidden w-full text-left px-2 py-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
