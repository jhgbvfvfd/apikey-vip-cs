import React from 'react';
import { useData, useAuth, useSettings } from '../App';
import { Agent } from '../types';
import { ServerIcon } from '@heroicons/react/24/outline';

const KeyLogsPage: React.FC = () => {
  const { keyLogs, agents } = useData();
  const { user } = useAuth();
  const { t } = useSettings();

  const filteredLogs = user?.role === 'agent'
    ? keyLogs.filter((log) => log.agentId === (user.data as Agent).id)
    : keyLogs;

  return (
    <div className="p-2 sm:p-4">
      {filteredLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-2">
          <ServerIcon className="w-12 h-12 opacity-50" />
          <p>{t('noLogs')}</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="sm:hidden space-y-2 mt-2">
            {filteredLogs.map((log) => (
              <div key={log.id} className="bg-white border border-slate-200 rounded-md p-3 shadow-sm text-xs">
                <div className="font-mono break-all">{log.key}</div>
                {user?.role === 'admin' && (
                  <div className="text-slate-600">
                    {agents.find((a) => a.id === log.agentId)?.username || '-'}
                  </div>
                )}
                <div className="text-slate-500">
                  <span>{log.ip}</span>
                </div>
                {log.tokensUsed !== undefined && (
                  <div className="text-slate-500">-{log.tokensUsed} tokens</div>
                )}
                <div className="text-slate-500">
                  {new Date(log.usedAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto mt-4">
            <table className="min-w-full bg-white border border-slate-200 text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="p-2 border-b border-slate-200 text-left whitespace-nowrap">{t('key')}</th>
                  {user?.role === 'admin' && (
                    <th className="p-2 border-b border-slate-200 text-left whitespace-nowrap">{t('agents')}</th>
                  )}
                  <th className="p-2 border-b border-slate-200 text-left whitespace-nowrap">{t('ipAddress')}</th>
                  <th className="p-2 border-b border-slate-200 text-left whitespace-nowrap">{t('tokensUsed') || 'Tokens'}</th>
                  <th className="p-2 border-b border-slate-200 text-left whitespace-nowrap">{t('usedAt')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="odd:bg-white even:bg-slate-50">
                    <td className="p-2 border-b border-slate-200 font-mono whitespace-nowrap">{log.key}</td>
                    {user?.role === 'admin' && (
                      <td className="p-2 border-b border-slate-200 whitespace-nowrap">
                        {agents.find((a) => a.id === log.agentId)?.username || '-'}
                      </td>
                    )}
                    <td className="p-2 border-b border-slate-200 font-mono whitespace-nowrap">{log.ip}</td>
                    <td className="p-2 border-b border-slate-200 whitespace-nowrap">
                      {log.tokensUsed !== undefined ? `-${log.tokensUsed}` : '-'}
                    </td>
                    <td className="p-2 border-b border-slate-200 whitespace-nowrap">
                      {new Date(log.usedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default KeyLogsPage;
