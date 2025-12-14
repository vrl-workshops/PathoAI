import React from 'react';
import { Activity, Users, LayoutDashboard, Settings, Menu } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const NavItem = ({ id, icon: Icon, label }: { id: string; icon: any; label: string }) => (
    <button
      onClick={() => {
        onTabChange(id);
        setMobileMenuOpen(false);
      }}
      className={`flex items-center w-full px-4 py-3 mb-1 text-sm font-medium rounded-lg transition-colors ${
        activeTab === id
          ? 'bg-blue-50 text-blue-700'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <Icon className={`w-5 h-5 mr-3 ${activeTab === id ? 'text-blue-600' : 'text-gray-400'}`} />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-screen sticky top-0">
        <div className="p-6 border-b border-gray-100 flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">PathoTrack</span>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem id="patients" icon={Users} label="Patients" />
          <NavItem id="settings" icon={Settings} label="Settings" />
        </nav>
        <div className="p-4 border-t border-gray-100">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-xs font-semibold text-blue-800 uppercase tracking-wider mb-2">System Status</h4>
            <div className="flex items-center text-xs text-blue-600">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
              AI Engine Online
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center space-x-2">
           <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">PathoTrack</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-gray-600">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-gray-800 bg-opacity-50" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute right-0 top-0 bottom-0 w-64 bg-white shadow-xl p-4" onClick={e => e.stopPropagation()}>
             <nav className="flex-1 space-y-2 mt-4">
              <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
              <NavItem id="patients" icon={Users} label="Patients" />
              <NavItem id="settings" icon={Settings} label="Settings" />
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};
