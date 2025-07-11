import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Home,
  DollarSign,
  Calendar,
  BarChart2,
  Clock,
  Building,
  LogOut,
  Tag,
  Briefcase
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', to: '/dashboard', icon: Home },
  { name: 'Budget', to: '/budget', icon: DollarSign },
  { name: 'Categories', to: '/categories', icon: Tag },
  { name: 'Monthly Expenses', to: '/monthly-expenses', icon: Calendar },
  { name: 'Scenarios', to: '/scenarios', icon: BarChart2 },
  { name: 'Timeline', to: '/timeline', icon: Clock },
  { name: 'Bank Accounts', to: '/bank-accounts', icon: Building },
  { name: 'Assets', to: '/assets', icon: Briefcase }
];

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">Budget Planner</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* User */}
          <div className="flex items-center px-4 py-3 border-t border-gray-200">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-sm text-gray-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-gray-500"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;