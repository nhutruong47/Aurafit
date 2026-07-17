import { useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { clearCurrentUser } from '../../store/authSlice';
import { useAppDispatch } from '../../store/hooks';
import ToastContainer from '../ui/ToastContainer';

export default function StaffLayout({ currentUser }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);

  // If not staff, redirect
  if (!currentUser || (currentUser.role !== 'STAFF' && currentUser.role !== 'ADMIN')) {
    return <Navigate to="/" replace />;
  }

  const handleLogout = () => {
    dispatch(clearCurrentUser());
    localStorage.removeItem('aurafitCurrentUser');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/account');
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'orders', label: 'Orders', icon: 'list_alt' },
    { id: 'pickup', label: 'Pickup', icon: 'local_shipping' },
    { id: 'return', label: 'Return', icon: 'undo' },
    { id: 'profile', label: 'Profile', icon: 'manage_accounts' },
  ];

  const currentTab = new URLSearchParams(location.search).get('tab') || 'dashboard';

  const handleNavClick = (tabId) => {
    navigate(`/staff?tab=${tabId}`);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 text-gray-900 font-sans">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-gray-200 bg-white">
        <div className="flex h-16 items-center px-6 border-b border-gray-200 bg-gray-900 text-white">
          <span className="text-lg font-bold tracking-wider">AuraFit Staff</span>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                currentTab === item.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="border-t border-gray-200 p-4 relative">
          <button
            onClick={() => setProfileOpen((prev) => !prev)}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="material-symbols-outlined text-gray-400">account_circle</span>
              <span className="truncate">{currentUser.fullName || currentUser.email}</span>
            </div>
            <span className="material-symbols-outlined text-gray-400 text-[18px]">
              {profileOpen ? 'expand_less' : 'expand_more'}
            </span>
          </button>

          {profileOpen && (
            <div className="absolute bottom-full left-4 right-4 mb-2 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900 truncate">{currentUser.fullName || 'Staff'}</p>
                <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Logout
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden flex flex-col bg-gray-50">
        <header className="flex h-16 shrink-0 items-center border-b border-gray-200 bg-white px-8">
          <h1 className="text-xl font-semibold text-gray-800 capitalize">
            {navItems.find(i => i.id === currentTab)?.label || 'Dashboard'}
          </h1>
        </header>
        <div className="flex-1 overflow-auto p-8">
          <Outlet context={{ currentTab }} />
        </div>
      </main>
      <ToastContainer />
    </div>
  );
}
