import React, { useEffect, useState, useMemo } from 'react';
import { useAuth, useSettings, useData } from '../App';
import { Agent, IpBan } from '../types';
import { getIpBans, addIpBan, deleteIpBan } from '../services/firebaseService';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';

const IpBanPage: React.FC = () => {
  const { user } = useAuth();
  const { notify, t } = useSettings();
  const { keyLogs } = useData();
  const agent = user?.role === 'agent' ? (user.data as Agent) : null;
  const userId = user?.role === 'admin' ? 'admin' : agent?.id || '';
  const [bans, setBans] = useState<IpBan[]>([]);

  const load = async () => {
    if (!userId) return;
    const data = await getIpBans(userId);
    setBans(data);
  };

  useEffect(() => {
    if (user?.role === 'admin' || agent?.ipBanEnabled) {
      load();
    }
  }, [user, agent]);

  if (user?.role === 'agent' && !agent?.ipBanEnabled) {
    return <p className="p-4 text-center text-slate-500">{t('ipBanLocked')}</p>;
  }

  const handleDelete = async (id: string) => {
    await deleteIpBan(userId, id);
    notify(t('ipRemoved'));
    load();
  };

  const recentIps = useMemo(() => {
    const logs = user?.role === 'admin'
      ? keyLogs
      : keyLogs.filter((l) => l.agentId === agent?.id);
    const unique = Array.from(new Set(logs.map((l) => l.ip)));
    return unique.filter((ip) => !bans.some((b) => b.ip === ip));
  }, [keyLogs, user, agent, bans]);

  const banFromRecent = async (ipAddr: string) => {
    await addIpBan(userId, ipAddr);
    notify(t('ipAdded'));
    load();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('ipBanTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        {bans.length > 0 ? (
          <ul className="divide-y divide-slate-200">
            {bans.map((b) => (
              <li key={b.id} className="flex items-center justify-between py-2">
                <span className="font-mono text-blue-600">{b.ip}</span>
                <Button size="sm" variant="danger" onClick={() => handleDelete(b.id)}>
                  {t('delete')}
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-slate-500">{t('noBannedIps')}</p>
        )}

        <h3 className="mt-6 mb-2 font-semibold">{t('recentIps')}</h3>
        {recentIps.length > 0 ? (
          <ul className="divide-y divide-slate-200">
            {recentIps.map((addr) => (
              <li key={addr} className="flex items-center justify-between py-2">
                <span className="font-mono text-slate-600">{addr}</span>
                <Button size="sm" onClick={() => banFromRecent(addr)}>{t('banIp')}</Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-slate-500">{t('noRecentIps')}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default IpBanPage;
