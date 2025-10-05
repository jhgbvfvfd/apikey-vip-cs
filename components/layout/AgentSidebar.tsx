
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth, useSettings } from '../../App';
import { Agent } from '../../types';
import Logo from '../ui/Logo';
import {
  UserIcon,
  ChartPieIcon,
  LockClosedIcon,
  HomeIcon,
  DocumentMagnifyingGlassIcon,
  NoSymbolIcon,
  KeyIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';

const NavIcon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className="nav-icon relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-[rgba(26,32,72,0.82)] text-[rgba(188,210,255,0.85)] shadow-[0_10px_25px_rgba(10,0,40,0.35)]">
        <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(126,92,255,0.4),transparent_60%)]" />
        <span className="relative flex items-center justify-center">{children}</span>
    </span>
);


interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const AgentSidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
    const { logout, user } = useAuth();
    const { t } = useSettings();
    const navigate = useNavigate();
    const agent = user?.data as Agent;

    const baseLinks = [
      { to: '/', text: t('dashboard'), icon: <HomeIcon className="w-6 h-6" /> },
      { to: '/my-keys', text: t('myKeys'), icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h7.5M8.25 12h7.5m-7.5 5.25h7.5M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg> },
      { to: '/generate-key', text: t('generateKey'), icon: <KeyIcon className="w-6 h-6" /> },
      { to: '/bots', text: t('bots'), icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 22.5l-.648-1.938a3.375 3.375 0 00-2.684-2.684l-1.938-.648 1.938-.648a3.375 3.375 0 002.684-2.684l.648-1.938.648 1.938a3.375 3.375 0 002.684 2.684l1.938.648-1.938.648a3.375 3.375 0 00-2.684 2.684z" /></svg> },
      { to: '/websites', text: t('websites'), icon: <GlobeAltIcon className="w-6 h-6" /> },
      { to: '/apps', text: t('apps'), icon: <DevicePhoneMobileIcon className="w-6 h-6" /> },
      { to: '/profile', text: t('profile'), icon: <UserIcon className="w-6 h-6" /> },
      { to: '/usage', text: t('usage'), icon: <ChartPieIcon className="w-6 h-6" /> },
    ];
    const navLinks = [
      ...baseLinks,
      ...(agent?.ipBanEnabled ? [{ to: '/ip-bans', text: t('ipBan'), icon: <NoSymbolIcon className="w-6 h-6" /> }] : []),
      { to: '/logs', text: t('logs'), icon: <DocumentMagnifyingGlassIcon className="w-6 h-6" /> },
      { to: '/change-password', text: t('changePassword'), icon: <LockClosedIcon className="w-6 h-6" /> },
    ];

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
        <div className="pointer-events-none absolute inset-0 opacity-35" style={{ backgroundImage: 'radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.4) 0, transparent 55%), radial-gradient(1px 1px at 75% 25%, rgba(255,255,255,0.32) 0, transparent 55%), radial-gradient(1px 1px at 55% 80%, rgba(255,255,255,0.28) 0, transparent 55%)' }} />
        <div className="relative flex flex-col flex-1 min-h-0">
            <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                <Logo className="h-14 w-14" />
                <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-[rgba(167,196,255,0.6)]">Agent</p>
                    <h1 className="text-xl font-bold text-[var(--space-text-primary)]">Cosmic Console</h1>
                </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="md:hidden rounded-full p-2 text-[rgba(177,202,255,0.7)] transition hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

           <div className="mb-6 rounded-2xl border border-[rgba(134,165,255,0.2)] bg-[rgba(18,24,58,0.75)] px-4 py-5 shadow-[0_15px_30px_rgba(8,0,40,0.35)]">
                <h2 className="text-sm font-semibold tracking-wide text-[var(--space-text-primary)]">{agent?.username}</h2>
                <p className="text-xs text-[rgba(177,202,255,0.75)]">Agent Access</p>
            </div>

          <nav className="flex-1 overflow-y-auto pr-1 -mr-1">
            <ul>
              {navLinks.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) =>
                      `sidebar-link group relative my-1 flex items-center gap-3 rounded-2xl border border-transparent px-3 py-3 font-medium transition-all duration-300 ${
                        isActive
                          ? 'border-[rgba(138,176,255,0.5)] bg-[rgba(42,52,105,0.75)] text-white shadow-[0_18px_35px_rgba(20,0,70,0.45)]'
                          : 'text-[rgba(177,202,255,0.75)] hover:border-[rgba(118,160,255,0.4)] hover:bg-[rgba(32,42,90,0.6)] hover:text-white'
                      }`
                    }
                  >
                    <NavIcon>{link.icon}</NavIcon>
                    <span className="text-sm tracking-wide">{link.text}</span>
                    <span className="pointer-events-none absolute inset-y-0 left-0 w-1 rounded-full bg-gradient-to-b from-[rgba(123,92,255,0.8)] to-[rgba(44,211,255,0.8)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <button onClick={handleLogout} className="relative mt-6 flex items-center justify-between rounded-2xl border border-[rgba(255,120,170,0.35)] bg-[linear-gradient(135deg,rgba(255,121,205,0.18),rgba(60,90,190,0.15))] px-4 py-3 text-left text-[rgba(255,189,224,0.9)] transition hover:border-[rgba(255,158,206,0.55)] hover:text-white">
          <span className="flex items-center gap-3">
            <NavIcon>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>
            </NavIcon>
            <span className="font-semibold tracking-wide">{t('logout')}</span>
          </span>
          <span className="text-xs uppercase tracking-[0.35em] text-[rgba(255,214,244,0.6)]">Exit</span>
        </button>
      </aside>
    </>
  );
};

export default AgentSidebar;