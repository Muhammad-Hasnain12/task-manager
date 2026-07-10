/**
 * File: src/components/Navbar.jsx
 * Overall Purpose: Universal dashboard navigation bar.
 * Connections: Displayed at the top of protected pages (Dashboard, ProjectBoard).
 */

import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, FolderGit2, User } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();

  // Do not render navbar if user is not authenticated
  if (!user) return null;

  return (
    <nav className="sticky top-0 z-50 bg-panel/80 backdrop-blur-md border-b border-borderLine px-24 py-16">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand/Logo */}
        <Link 
          to="/dashboard" 
          className="flex items-center gap-8 text-textPrimary hover:text-brand transition-colors group"
        >
          <FolderGit2 className="w-24 h-24 text-brand group-hover:scale-105 transition-transform" />
          <span className="font-semibold tracking-tight text-16">TaskSpace</span>
        </Link>

        {/* User Profile & Actions */}
        <div className="flex items-center gap-16">
          <div className="flex items-center gap-8 border-r border-borderLine pr-16">
            {/* Simple User Avatar representation */}
            <div className="w-32 h-32 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-brand text-12 font-medium">
              {user.name ? user.name.charAt(0).toUpperCase() : <User className="w-16 h-16" />}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-textPrimary font-medium text-14 leading-none">{user.name}</span>
              <span className="text-textMuted text-12 leading-none mt-4">{user.email}</span>
            </div>
          </div>

          {/* Logout Action */}
          <button
            onClick={logout}
            className="flex items-center gap-8 px-12 py-8 bg-zinc-800/50 hover:bg-zinc-800 text-textSecondary hover:text-textPrimary rounded-6 border border-borderLine transition-all text-14 font-medium"
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
