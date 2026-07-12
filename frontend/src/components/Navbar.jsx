import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();

  // Do not render navbar if user is not authenticated
  if (!user) return null;

  // Calculate initials from name (e.g. "Muhammad Hasnain" -> "MH")
  const initials = user.name
    ? user.name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '';

  return (
    <nav className="sticky top-0 z-50 bg-background border-b border-borderLine px-24 py-16">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand/Logo */}
        <Link 
          to="/dashboard" 
          className="flex items-center gap-8 text-textPrimary hover:text-brand transition-colors group"
        >
          {/* Custom TaskSpace Small Logo */}
          <div className="w-32 h-32 rounded-8 bg-brand flex items-center justify-center text-white shrink-0 shadow-md">
            <div className="flex gap-[2.5px]">
              <div className="flex flex-col gap-[2.5px]">
                <div className="w-[6px] h-[6px] bg-white rounded-[1px]" />
                <div className="w-[6px] h-[6px] bg-white rounded-[1px]" />
              </div>
              <div className="w-[6px] h-[14.5px] bg-white rounded-[1px]" />
            </div>
          </div>
          <span className="font-bold tracking-tight text-16">TaskSpace</span>
        </Link>

        {/* User Profile & Actions */}
        <div className="flex items-center gap-16">
          <div className="flex items-center gap-12 border-r border-borderLine pr-16">
            {/* Simple User Avatar representation */}
            <div className="w-32 h-32 rounded-full bg-brand flex items-center justify-center text-white text-12 font-bold shrink-0 shadow-inner">
              {initials || <User className="w-16 h-16" />}
            </div>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-6">
                <span className="text-textPrimary font-semibold text-14 leading-tight">{user.name}</span>
                {user.role === 'admin' && (
                  <span className="px-6 py-2 rounded-4 bg-red-950/60 border border-red-800/40 text-red-400 text-10 font-bold uppercase tracking-wider">
                    Admin
                  </span>
                )}
              </div>
              <span className="text-textMuted text-12 leading-tight mt-4">{user.email}</span>
            </div>
          </div>

          {/* Logout Action */}
          <button
            onClick={logout}
            className="flex items-center gap-8 px-12 py-8 bg-transparent hover:bg-zinc-900/60 text-textSecondary hover:text-textPrimary rounded-6 transition-all text-14 font-medium cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-16 h-16" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
