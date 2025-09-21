import React from 'react';
import { useData, useSettings } from '../App';
import { Agent } from '../types';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { updateAgent } from '../services/firebaseService';

const AgentMenusPage: React.FC = () => {
  const { agents, refreshData } = useData();
  const { notify, t } = useSettings();

  const toggleIpBan = async (agent: Agent) => {
    const updated = { ...agent, ipBanEnabled: !agent.ipBanEnabled };
    await updateAgent(updated);
    refreshData();
    notify(updated.ipBanEnabled ? t('ipBanMenuEnabled') : t('ipBanMenuDisabled'));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('agentMenus')}</CardTitle>
      </CardHeader>
      <CardContent>
        {agents.length > 0 ? (
          <ul className="divide-y divide-slate-200">
            {agents.map(a => (
              <li key={a.id} className="flex items-center justify-between py-2">
                <span>{a.username}</span>
                <Button size="sm" variant="secondary" onClick={() => toggleIpBan(a)}>
                  {a.ipBanEnabled ? t('lockIpBan') : t('unlockIpBan')}
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-slate-500">{t('noAgents')}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default AgentMenusPage;
