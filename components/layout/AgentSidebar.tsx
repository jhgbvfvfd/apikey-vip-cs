
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
  UserGroupIcon,
  DevicePhoneMobileIcon,
} from '@heroicons/react/24/outline';

const NavIcon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="w-6 h-6">{children}</div>
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
      { to: '/apps', text: t('apps'), icon: <DevicePhoneMobileIcon className="w-6 h-6" /> },
      { to: '/profile', text: t('profile'), icon: <UserIcon className="w-6 h-6" /> },
      { to: '/usage', text: t('usage'), icon: <ChartPieIcon className="w-6 h-6" /> },
    ];
    const navLinks = [
      ...baseLinks,
      ...(agent?.parentId ? [] : [{ to: '/agents', text: t('agents'), icon: <UserGroupIcon className="w-6 h-6" /> }]),
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
        className={`w-64 flex-shrink-0 bg-white border-r border-slate-200 p-4 flex flex-col justify-between fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                <Logo className="mr-3 h-12 w-12 shadow-lg shadow-blue-200/60" />
                <h1 className="text-lg font-bold text-slate-800">Key Master</h1>
                </div>
                <button onClick={() => setIsOpen(false)} className="md:hidden text-slate-400 hover:text-slate-600">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
          
           <div className="px-3 py-4 mb-4 border-t border-b border-slate-200">
                <h2 className="text-md font-semibold text-slate-800">{agent?.username}</h2>
                <p className="text-sm text-slate-500">Agent Account</p>
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
                    <NavIcon>{link.icon}</NavIcon>
                    <span className="ml-3">{link.text}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <button onClick={handleLogout} className="flex items-center p-3 w-full text-left rounded-lg text-slate-600 hover:bg-red-500 hover:text-white transition-colors duration-200 font-medium">
          <NavIcon><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg></NavIcon>
          <span className="ml-3">{t('logout')}</span>
        </button>
      </aside>
    </>
  );
};

export default AgentSidebar;