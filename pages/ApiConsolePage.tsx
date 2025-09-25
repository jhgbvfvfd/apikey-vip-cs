import React, { useEffect, useMemo, useRef } from 'react';
import { useData, useSettings } from '../App';

const ApiConsolePage: React.FC = () => {
  const { keyLogs, agents, loading } = useData();
  const { t } = useSettings();
  const consoleRef = useRef<HTMLDivElement>(null);

  const orderedLogs = useMemo(() => {
    return [...keyLogs].sort(
      (a, b) => new Date(a.usedAt).getTime() - new Date(b.usedAt).getTime(),
    );
  }, [keyLogs]);

  useEffect(() => {
    if (!consoleRef.current) return;
    consoleRef.current.scrollTo({
      top: consoleRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [orderedLogs.length]);

  return (
    <div className="flex h-full flex-col bg-slate-950 text-slate-100">
      <div className="border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-5 py-5 shadow-inner">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">{t('apiConsoleTitle')}</p>
            <h1 className="mt-2 text-2xl font-bold text-white">{t('apiConsoleDesc')}</h1>
          </div>
          <div className="flex items-center gap-3 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-300 shadow-lg shadow-black/30">
            <span className="relative inline-flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime-400 opacity-70"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-lime-300"></span>
            </span>
            {loading ? t('apiConsoleInitializing') : t('apiConsoleLive')}
          </div>
        </div>
      </div>
      <div className="relative flex-1 overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-slate-950 via-slate-950/40 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
        <div
          ref={consoleRef}
          className="relative z-10 h-full overflow-y-auto bg-black/95 px-5 py-8 font-mono text-[13px] text-lime-300 shadow-inner shadow-black/40"
        >
          {orderedLogs.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
              <span className="text-sm uppercase tracking-[0.35em] text-slate-500">{loading ? t('apiConsoleInitializing') : t('apiConsoleEmpty')}</span>
            </div>
          ) : (
            orderedLogs.map((log) => {
              const agent = agents.find((a) => a.id === log.agentId);
              const timestamp = new Date(log.usedAt).toLocaleString('th-TH', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });
              const tokenInfo =
                log.tokensUsed !== undefined
                  ? `${t('tokensUsed')}: -${log.tokensUsed}`
                  : t('apiConsoleNoTokenUsage');

              return (
                <div key={log.id} className="space-y-1 border-b border-white/5 pb-3 last:border-b-0">
                  <div className="text-xs uppercase tracking-[0.35em] text-slate-600">{timestamp}</div>
                  <div className="text-sm text-lime-300">
                    <span className="text-slate-500">agent:</span>{' '}
                    <span className="text-white">{agent?.username || 'unknown'}</span>{' '}
                    <span className="text-slate-500">ip:</span>{' '}
                    <span className="text-sky-400">{log.ip}</span>{' '}
                    <span className="text-slate-500">key:</span>{' '}
                    <span className="text-amber-300">{log.key}</span>
                  </div>
                  <div className="text-xs uppercase tracking-[0.35em] text-slate-500">{tokenInfo}</div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ApiConsolePage;
