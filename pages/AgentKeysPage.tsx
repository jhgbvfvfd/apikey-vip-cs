

import React, { useState } from 'react';
import { useData, useAuth, useSettings } from '../App';
import { Agent, ApiKey } from '../types';
import { updateAgent } from '../services/firebaseService';
import Button from '../components/ui/Button';
import Card, { CardHeader, CardTitle } from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import {
    ClipboardIcon,
    CheckIcon,
    PauseIcon,
    PlayIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';

const KeyRow: React.FC<{ 
    apiKey: ApiKey & { platformId: string, platformTitle: string };
    onUpdateStatus: (key: ApiKey, platformId: string) => void;
    onDelete: (key: ApiKey, platformId: string) => void;
}> = ({ apiKey, onUpdateStatus, onDelete }) => {
    const [copied, setCopied] = useState(false);
    const { notify, t } = useSettings();

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(apiKey.key);
            setCopied(true);
            notify(t('copySuccess'));
        } catch (err) {
            notify(t('copyFailed'), 'error');
        } finally {
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleToggleStatus = () => {
        onUpdateStatus(apiKey, apiKey.platformId);
    };

    const handleDelete = () => {
        onDelete(apiKey, apiKey.platformId);
    };

    return (
        <tr className="border-b border-slate-200 last:border-b-0 odd:bg-white even:bg-slate-50 hover:bg-slate-100">
            <td className="p-1 font-mono text-sm text-blue-600">{apiKey.key}</td>
            <td className="p-1 text-slate-600">{apiKey.platformTitle}</td>
            <td className="p-1 text-slate-600">{apiKey.tokens_remaining.toLocaleString()}</td>
            <td className="p-1">
                {(() => {
                    const statusKey = apiKey.tokens_remaining <= 0
                        ? 'statusNoTokens'
                        : apiKey.status === 'active'
                            ? 'statusActive'
                            : 'statusInactive';
                    const statusColor = apiKey.tokens_remaining <= 0
                        ? 'bg-red-100 text-red-800'
                        : apiKey.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-slate-100 text-slate-800';
                    const dotColor = apiKey.tokens_remaining <= 0
                        ? 'text-red-400'
                        : apiKey.status === 'active'
                            ? 'text-green-400'
                            : 'text-slate-400';
                    return (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                            <svg className={`mr-1.5 h-2 w-2 ${dotColor}`} fill="currentColor" viewBox="0 0 8 8">
                                <circle cx={4} cy={4} r={3} />
                            </svg>
                            {t(statusKey as any)}
                        </span>
                    );
                })()}
            </td>
            <td className="p-1 text-slate-600">{new Date(apiKey.createdAt).toLocaleDateString('th-TH')}</td>
            <td className="p-1 text-right">
                <div className="inline-flex items-center gap-1">
                    <button
                        onClick={handleCopy}
                        className="p-1.5 rounded-md hover:bg-slate-200 text-slate-500 hover:text-slate-700"
                        title={copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
                    >
                        {copied ? (
                            <CheckIcon className="w-4 h-4 text-green-600" />
                        ) : (
                            <ClipboardIcon className="w-4 h-4" />
                        )}
                    </button>
                    <button
                        onClick={handleToggleStatus}
                        className="p-1.5 rounded-md hover:bg-slate-200 text-slate-500 hover:text-slate-700"
                        title={apiKey.status === 'active' ? 'ระงับ' : 'เปิดใช้งาน'}
                    >
                        {apiKey.status === 'active' ? (
                            <PauseIcon className="w-4 h-4" />
                        ) : (
                            <PlayIcon className="w-4 h-4" />
                        )}
                    </button>
                    <button
                        onClick={handleDelete}
                        className="p-1.5 rounded-md hover:bg-red-100 text-red-600 hover:text-red-700"
                        title="ลบ"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            </td>
        </tr>
    );
};


const AgentKeysPage: React.FC = () => {
    const { platforms, loading: dataLoading, refreshData } = useData();
    const { user, login } = useAuth();
    const { t } = useSettings();
    const agent = user?.data as Agent;

    const [isConfirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [keyToDelete, setKeyToDelete] = useState<{key: ApiKey, platformId: string} | null>(null);

    const platformMap = React.useMemo(() => new Map(platforms.map(p => [p.id, p])), [platforms]);
    const agentKeys = React.useMemo(() => {
        if (!agent || !agent.keys) return [];
        return Object.entries(agent.keys)
            .flatMap(([platformId, keys]) => 
                keys.map(k => ({
                    ...k,
                    platformId,
                    platformTitle: platformMap.get(platformId)?.title || platformId
                }))
            )
            .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [agent, platformMap]);

    const handleUpdateAgentData = async (updatedAgent: Agent) => {
        await updateAgent(updatedAgent);
        await login(agent.username, agent.password, { skipMaintenanceCheck: true });
        refreshData();
    };
    
    const handleUpdateKeyStatus = async (keyToUpdate: ApiKey, platformId: string) => {
        const updatedAgent = JSON.parse(JSON.stringify(agent));
        const keysForPlatform = updatedAgent.keys[platformId];
        const keyIndex = keysForPlatform.findIndex((k: ApiKey) => k.key === keyToUpdate.key);
        if (keyIndex > -1) {
            keysForPlatform[keyIndex].status = keysForPlatform[keyIndex].status === 'active' ? 'inactive' : 'active';
            await handleUpdateAgentData(updatedAgent);
        }
    };

    const confirmDeleteKey = (key: ApiKey, platformId: string) => {
        setKeyToDelete({ key, platformId });
        setConfirmDeleteOpen(true);
    };

    const handleDeleteKey = async () => {
        if (!keyToDelete) return;
        const { key, platformId } = keyToDelete;
        const updatedAgent = JSON.parse(JSON.stringify(agent));
        
        let keysForPlatform = updatedAgent.keys[platformId];
        keysForPlatform = keysForPlatform.filter((k: ApiKey) => k.key !== key.key);
        
        if (keysForPlatform.length > 0) {
            updatedAgent.keys[platformId] = keysForPlatform;
        } else {
            delete updatedAgent.keys[platformId];
        }

        await handleUpdateAgentData(updatedAgent);
        setConfirmDeleteOpen(false);
        setKeyToDelete(null);
    };

    return (
        <div className="space-y-6">
            <Card className="max-w-md mx-auto">
                <CardHeader><CardTitle>รายการคีย์ทั้งหมด</CardTitle></CardHeader>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500">
                            <tr>
                                <th className="p-1 font-semibold">คีย์</th>
                                <th className="p-1 font-semibold">แพลตฟอร์ม</th>
                                <th className="p-1 font-semibold">โทเค็น</th>
                                <th className="p-1 font-semibold">สถานะ</th>
                                <th className="p-1 font-semibold">วันที่สร้าง</th>
                                <th className="p-1 font-semibold text-right">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dataLoading ? <tr><td colSpan={6} className="text-center p-4">กำลังโหลดคีย์...</td></tr> : 
                            agentKeys.length > 0 ? agentKeys.map(k => <KeyRow key={k.key} apiKey={k} onUpdateStatus={handleUpdateKeyStatus} onDelete={confirmDeleteKey} />)
                            : <tr><td colSpan={6} className="text-center p-6 text-slate-500">คุณยังไม่ได้สร้างคีย์ใดๆ</td></tr>
                            }
                        </tbody>
                    </table>
                </div>
            </Card>

             <Modal isOpen={isConfirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)} title="ยืนยันการลบ">
                 <div>
                    <p className="text-slate-600 mb-4">คุณแน่ใจหรือไม่ว่าต้องการลบคีย์ <strong className="font-semibold text-slate-800 font-mono">{keyToDelete?.key.key}</strong>? การกระทำนี้ไม่สามารถย้อนกลับได้</p>
                    <div className="flex justify-end gap-3 mt-6">
                        <Button variant="secondary" onClick={() => setConfirmDeleteOpen(false)}>ยกเลิก</Button>
                        <Button variant="danger" onClick={handleDeleteKey}>ยืนยันการลบ</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AgentKeysPage;