import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth, useSettings } from '../../App';
import Logo from '../ui/Logo';
import {
  Squares2X2Icon,
  RectangleStackIcon,
  UserGroupIcon,
  KeyIcon,
  CpuChipIcon,
  BookOpenIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  LockClosedIcon,
  DocumentMagnifyingGlassIcon,
  NoSymbolIcon,
  ListBulletIcon,
  MegaphoneIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
  CommandLineIcon,
  MagnifyingGlassCircleIcon,
} from '@heroicons/react/24/outline';

const NavIcon: React.FC<{ icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }> = ({ icon: Icon }) => (
  <Icon className="w-6 h-6" />
);


interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
    const { logout } = useAuth();
    const { t } = useSettings();

    const navLinks = [
      { to: '/', text: t('dashboard'), icon: Squares2X2Icon },
      { to: '/platforms', text: t('platforms'), icon: RectangleStackIcon },
      { to: '/agents', text: t('agents'), icon: UserGroupIcon },
      { to: '/agent-menus', text: t('agentMenus'), icon: ListBulletIcon },
      { to: '/generate-key', text: t('generateKey'), icon: KeyIcon },
      { to: '/maintenance', text: t('maintenanceMenu'), icon: MegaphoneIcon },
      { to: '/bots', text: t('bots'), icon: CpuChipIcon },
      { to: '/websites', text: t('websites'), icon: GlobeAltIcon },
      { to: '/apps', text: t('apps'), icon: DevicePhoneMobileIcon },
      { to: '/api-guide', text: t('apiGuide'), icon: BookOpenIcon },
      { to: '/reports', text: t('reports'), icon: ChartBarIcon },
      { to: '/api-console', text: t('apiConsole'), icon: CommandLineIcon },
      { to: '/true-search', text: t('trueSearch'), icon: MagnifyingGlassCircleIcon },
      { to: '/logs', text: t('logs'), icon: DocumentMagnifyingGlassIcon },
      { to: '/ip-bans', text: t('ipBan'), icon: NoSymbolIcon },
      { to: '/settings', text: t('settings'), icon: Cog6ToothIcon },
      { to: '/change-password', text: t('changePassword'), icon: LockClosedIcon },
    ];
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black bg-opacity-30 z-30 md:hidden ${isOpen ? 'block' : 'hidden'}`}
        onClick={() => setIsOpen(false)}
      ></div>
      
      <aside
        className={`w-64 flex-shrink-0 bg-white border-r border-slate-200 p-4 flex flex-col justify-between fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Logo className="mr-3 h-12 w-12 shadow-lg shadow-blue-200/60" />
              <h1 className="text-lg font-bold text-slate-800">Key Master</h1>
            </div>
             <button onClick={() => setIsOpen(false)} className="md:hidden text-slate-400 hover:text-slate-600">
                 <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          
           <div className="px-3 py-4 mb-4 border-t border-b border-slate-200">
                <h2 className="text-md font-semibold text-slate-800">ผู้ดูแลระบบ</h2>
                <p className="text-sm text-slate-500">สถานะ: ออนไลน์</p>
            </div>

          <nav className="flex-1 overflow-y-auto pr-1 -mr-1">
            <ul>
              {navLinks.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center p-3 my-1 rounded-lg transition-colors duration-200 font-medium ${
                        isActive
                          ? 'bg-slate-100 text-blue-600 border-l-4 border-blue-600'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`
                    }
                  >
                    <NavIcon icon={link.icon} />
                    <span className="ml-3">{link.text}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center p-3 w-full text-left rounded-lg text-slate-600 hover:bg-red-500 hover:text-white transition-colors duration-200 font-medium"
        >
          <NavIcon icon={ArrowRightOnRectangleIcon} />
          <span className="ml-3">{t('logout')}</span>
        </button>
      </aside>
    </>
  );
};

export default Sidebar;