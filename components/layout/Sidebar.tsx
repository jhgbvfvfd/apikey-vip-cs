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
  <span className="relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-[rgba(26,32,72,0.85)] text-[rgba(188,210,255,0.85)] shadow-[0_10px_25px_rgba(10,0,40,0.35)]">
    <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(126,92,255,0.4),transparent_60%)]" />
    <Icon className="relative h-5 w-5" />
  </span>
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
        className={`cosmic-sidebar relative w-72 flex-shrink-0 overflow-hidden border-r border-[rgba(130,160,255,0.25)] bg-[rgba(10,14,38,0.82)] p-5 shadow-[0_30px_60px_rgba(5,0,35,0.5)] backdrop-blur-2xl flex flex-col justify-between fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(118,92,255,0.18),transparent_65%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(1px 1px at 25% 35%, rgba(255,255,255,0.45) 0, transparent 55%), radial-gradient(1px 1px at 75% 20%, rgba(255,255,255,0.35) 0, transparent 55%), radial-gradient(1px 1px at 45% 75%, rgba(255,255,255,0.3) 0, transparent 55%)' }} />
        <div className="relative flex flex-col flex-1 min-h-0">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo className="h-14 w-14" />
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-[rgba(167,196,255,0.6)]">Control</p>
                <h1 className="text-xl font-bold text-[var(--space-text-primary)]">Cosmic Key Master</h1>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="md:hidden rounded-full p-2 text-[rgba(177,202,255,0.7)] transition hover:text-white">
                 <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

           <div className="mb-6 rounded-2xl border border-[rgba(134,165,255,0.2)] bg-[rgba(18,24,58,0.75)] px-4 py-5 shadow-[0_15px_30px_rgba(8,0,40,0.35)]">
                <h2 className="text-sm font-semibold tracking-wide text-[var(--space-text-primary)]">ผู้ดูแลระบบ</h2>
                <p className="text-xs text-[rgba(177,202,255,0.75)]">สถานะ: ออนไลน์</p>
            </div>

          <nav className="flex-1 overflow-y-auto pr-1 -mr-1">
            <ul>
              {navLinks.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) =>
                      `group relative my-1 flex items-center gap-3 rounded-2xl border border-transparent px-3 py-3 font-medium transition-all duration-300 ${
                        isActive
                          ? 'border-[rgba(138,176,255,0.5)] bg-[rgba(42,52,105,0.75)] text-white shadow-[0_18px_35px_rgba(20,0,70,0.45)]'
                          : 'text-[rgba(177,202,255,0.75)] hover:border-[rgba(118,160,255,0.4)] hover:bg-[rgba(32,42,90,0.6)] hover:text-white'
                      }`
                    }
                  >
                    <NavIcon icon={link.icon} />
                    <span className="text-sm tracking-wide">{link.text}</span>
                    <span className="pointer-events-none absolute inset-y-0 left-0 w-1 rounded-full bg-gradient-to-b from-[rgba(123,92,255,0.8)] to-[rgba(44,211,255,0.8)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <button
          onClick={handleLogout}
          className="relative mt-6 flex items-center justify-between rounded-2xl border border-[rgba(255,120,170,0.35)] bg-[linear-gradient(135deg,rgba(255,121,205,0.18),rgba(60,90,190,0.15))] px-4 py-3 text-left text-[rgba(255,189,224,0.9)] transition hover:border-[rgba(255,158,206,0.55)] hover:text-white"
        >
          <span className="flex items-center gap-3">
            <span className="relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-[rgba(45,19,55,0.65)] text-white shadow-[0_12px_25px_rgba(70,0,50,0.45)]">
              <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,138,204,0.6),transparent_65%)]" />
              <ArrowRightOnRectangleIcon className="relative h-5 w-5" />
            </span>
            <span className="font-semibold tracking-wide">{t('logout')}</span>
          </span>
          <span className="text-xs uppercase tracking-[0.35em] text-[rgba(255,214,244,0.6)]">Exit</span>
        </button>
      </aside>
    </>
  );
};

export default Sidebar;