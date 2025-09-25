import React, { useEffect, useMemo, useRef } from 'react';
import { useData } from '../App';

type ConsoleEntryLevel = 'info' | 'warning' | 'error';

interface ConsoleEntry {
  id: string;
  timestamp: string;
  label: string;
  level: ConsoleEntryLevel;
  message: string;
  metadata?: string;
}

const formatTimestamp = (input: string): string => {
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    return input;
  }
  const two = (value: number) => value.toString().padStart(2, '0');
  return `${parsed.getFullYear()}-${two(parsed.getMonth() + 1)}-${two(parsed.getDate())} ${two(parsed.getHours())}:${two(parsed.getMinutes())}:${two(parsed.getSeconds())}`;
};

const normalizeMetadata = (metadata?: unknown): string | undefined => {
  if (!metadata) {
    return undefined;
  }

  if (typeof metadata === 'string') {
    return metadata;
  }

  try {
    return JSON.stringify(metadata, null, 2);
  } catch (error) {
    return undefined;
  }
};

const ApiConsolePage: React.FC = () => {
  const { keyLogs, systemLogs, agents } = useData();
  const consoleRef = useRef<HTMLDivElement>(null);

  const entries = useMemo<ConsoleEntry[]>(() => {
    const keyEntries: ConsoleEntry[] = keyLogs.map((log) => {
      const agent = agents.find((candidate) => candidate.id === log.agentId);
      const username = agent?.username || 'unknown';
      const messageParts = [
        `agent=${username}`,
        `key=${log.key}`,
        `ip=${log.ip}`,
      ];

      if (typeof log.tokensUsed === 'number') {
        messageParts.push(`tokens=-${log.tokensUsed}`);
      }

      return {
        id: `key-${log.id}`,
        timestamp: log.usedAt,
        label: 'API',
        level: 'info',
        message: messageParts.join(' '),
      };
    });

    const systemEntries: ConsoleEntry[] = systemLogs.map((log) => {
      const level: ConsoleEntryLevel = log.level === 'error' || log.level === 'warning' ? log.level : 'info';
      const label = log.event?.toUpperCase() || 'SYSTEM';
      const metadata = normalizeMetadata(log.metadata);
      const parts: string[] = [log.message];

      if (log.ip) {
        parts.push(`ip=${log.ip}`);
      }

      if (log.actorId) {
        parts.push(`actor=${log.actorId}`);
      }

      if (Array.isArray(log.relatedAgentIds) && log.relatedAgentIds.length > 0) {
        parts.push(`related=[${log.relatedAgentIds.join(',')}]`);
      }

      return {
        id: `system-${log.id}`,
        timestamp: log.createdAt,
        label,
        level,
        message: parts.filter(Boolean).join(' ').trim(),
        metadata,
      };
    });

    return [...keyEntries, ...systemEntries].sort((a, b) => {
      const aTime = new Date(a.timestamp).getTime();
      const bTime = new Date(b.timestamp).getTime();

      if (Number.isNaN(aTime) && Number.isNaN(bTime)) {
        return a.timestamp.localeCompare(b.timestamp);
      }

      if (Number.isNaN(aTime)) {
        return -1;
      }

      if (Number.isNaN(bTime)) {
        return 1;
      }

      return aTime - bTime;
    });
  }, [agents, keyLogs, systemLogs]);

  useEffect(() => {
    if (!consoleRef.current) {
      return;
    }
    consoleRef.current.scrollTo({
      top: consoleRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [entries.length]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-black">
      <div
        ref={consoleRef}
        className="flex-1 overflow-y-auto px-5 py-6 font-mono text-sm leading-relaxed text-lime-300"
      >
        {entries.map((entry) => {
          const timestamp = formatTimestamp(entry.timestamp);
          const levelClass = entry.level === 'error'
            ? 'text-rose-400'
            : entry.level === 'warning'
              ? 'text-amber-300'
              : 'text-lime-300';

          return (
            <div key={entry.id} className="mb-4 whitespace-pre-wrap break-words">
              <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                <span>[{timestamp}]</span>
                <span className={`tracking-[0.35em] text-slate-600`}>{entry.label}</span>
                <span className={`${levelClass} font-semibold`}>{entry.level.toUpperCase()}</span>
              </div>
              <div className={`mt-1 text-sm ${levelClass}`}>
                {entry.message}
              </div>
              {entry.metadata && (
                <pre className="mt-2 max-w-full overflow-x-auto rounded border border-white/5 bg-black/60 p-3 text-[12px] leading-snug text-slate-400">
                  {entry.metadata}
                </pre>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ApiConsolePage;
