

import React, { useMemo, useState } from 'react';
import { useData, useSettings } from '../App';
import { Agent, Platform, CreditHistoryEntry, ApiKey } from '../types';
import { addAgent, updateAgent, deleteAgent, setAgentBanState } from '../services/firebaseService';
import Button from '../components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import CountdownDisplay from '../components/ui/CountdownDisplay';
import { formatCredits, hasUnlimitedCredits } from '../utils/credits';

const DEFAULT_NEW_AGENT_CREDITS = 1000;
const DEFAULT_CREDIT_INCREMENT = 100;

const AgentCard: React.FC<{
    agent: Agent;
    onViewHistory: (agent: Agent) => void;
    onManageKeys: (agent: Agent) => void;
    onAddCredits: (agent: Agent) => void;
    onDelete: (agent: Agent) => void;
    onBan: (agent: Agent) => void;
    platforms: Platform[]
}> = ({ agent, onViewHistory, onManageKeys, onAddCredits, onDelete, onBan, platforms }) => {
    const platformMap = new Map(platforms.map(p => [p.id, p]));
    const unlimited = hasUnlimitedCredits(agent);

    return (
        <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <CardTitle className={`${agent.status === 'banned' ? 'text-red-600' : ''} break-words`}>{agent.username}</CardTitle>
                    <p className="mt-1 text-xs font-mono text-slate-400 break-all">{agent.id}</p>
                </div>
                <div className="flex w-full flex-wrap items-start justify-between gap-3 sm:w-auto sm:flex-nowrap sm:justify-end">
                    <div className="min-w-0 text-left sm:text-right">
                        <p className="text-lg font-bold leading-tight text-blue-600 break-words sm:text-2xl">
                            {formatCredits(agent)}
                        </p>
                        <p className="text-xs text-slate-500 sm:whitespace-nowrap">เครดิตคงเหลือ</p>
                        {unlimited && (
                            <span className="mt-1 inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
                                ไม่จำกัดเครดิต
                            </span>
                        )}
                    </div>
                    <div className="flex w-full shrink-0 flex-wrap justify-end gap-2 sm:w-auto sm:flex-col sm:gap-1">
                        <Button
                            size="sm"
                            variant={agent.status === 'banned' ? 'secondary' : 'danger'}
                            onClick={() => onBan(agent)}
                            className="flex-1 sm:flex-none"
                        >
                            {agent.status === 'banned' ? 'ปลดแบน' : 'แบน'}
                        </Button>
                        <Button
                            size="sm"
                            variant="danger"
                            onClick={() => onDelete(agent)}
                            className="flex-1 sm:flex-none"
                        >
                            ลบ
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {agent.expiresAt ? (
                    <CountdownDisplay
                        target={agent.expiresAt}
                        className="mb-4"
                        title="ตัวแทนหมดอายุใน"
                        expiredLabel="บัญชีนี้หมดอายุแล้ว ระบบจะลบให้อัตโนมัติ"
                        accentLabel="ลบอัตโนมัติ"
                    />
                ) : (
                    <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                        ยังไม่ได้ตั้งวันหมดอายุสำหรับตัวแทนคนนี้
                    </div>
                )}
                <div className="flex flex-col gap-2 mb-4">
                    <Button onClick={() => onAddCredits(agent)} className="w-full" disabled={unlimited}>
                        เติมเครดิต
                    </Button>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Button onClick={() => onViewHistory(agent)} variant="secondary" className="w-full">ดูประวัติเครดิต</Button>
                        <Button onClick={() => onManageKeys(agent)} variant="secondary" className="w-full">จัดการคีย์</Button>
                    </div>
                </div>
                <h4 className="font-semibold text-slate-600 mb-2 text-sm">คีย์ล่าสุดที่สร้าง:</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto p-2 rounded-lg bg-slate-50 border border-slate-200">
                {agent.keys && Object.keys(agent.keys).length > 0 ? (
                    Object.entries(agent.keys).flatMap(([platformId, keys]) => 
                        keys.map(k => ({...k, platformTitle: platformMap.get(platformId)?.title || platformId }))
                    )
                    .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 5) // Show latest 5 keys across all platforms
                    .map(k => (
                        <div key={k.key} className="text-xs font-mono bg-white p-2 rounded border border-slate-200">
                            <p className="text-blue-600 truncate">{k.key}</p>
                            <div className="flex justify-between text-slate-500 mt-1">
                                <span>{k.platformTitle}</span>
                                <span>{k.tokens_remaining.toLocaleString()} โทเค็น</span>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-slate-400 text-center py-4">ยังไม่มีคีย์ที่สร้าง</p>
                )}
                </div>
            </CardContent>
        </Card>
    );
};


const ManageKeysModal: React.FC<{
    agent: Agent | null;
    platforms: Platform[];
    isOpen: boolean;
    onClose: () => void;
    onUpdateAgent: (agent: Agent) => Promise<void>;
}> = ({ agent, platforms, isOpen, onClose, onUpdateAgent }) => {
    const { notify, t } = useSettings();
    const [keyToConfirmDelete, setKeyToConfirmDelete] = useState<{key: ApiKey, platformId: string} | null>(null);
    if (!agent) return null;

    const platformMap = new Map(platforms.map(p => [p.id, p]));
    const agentKeys = Object.entries(agent.keys || {}).flatMap(([platformId, keys]) => 
        keys.map(k => ({ ...k, platformId, platformTitle: platformMap.get(platformId)?.title || platformId }))
    ).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const handleUpdateStatus = async (keyToUpdate: ApiKey, platformId: string) => {
        const updatedAgent = { ...agent, keys: { ...agent.keys } };
        const keysForPlatform = [...(updatedAgent.keys[platformId] || [])];
        const keyIndex = keysForPlatform.findIndex(k => k.key === keyToUpdate.key);
        if (keyIndex > -1) {
            const toggledStatus = keyToUpdate.status === 'active' ? 'inactive' : 'active';
            const { banLocked: _banLocked, ...keyWithoutLock } = { ...keysForPlatform[keyIndex], status: toggledStatus };
            keysForPlatform[keyIndex] = keyWithoutLock as ApiKey;
            updatedAgent.keys[platformId] = keysForPlatform;
            await onUpdateAgent(updatedAgent);
            notify(keyToUpdate.status === 'active' ? 'ระงับคีย์แล้ว' : 'เปิดใช้งานคีย์แล้ว');
        }
    };

    const handleDelete = async () => {
        if (!keyToConfirmDelete) return;
        const { key: keyToDelete, platformId } = keyToConfirmDelete;

        const updatedAgent = { ...agent, keys: { ...agent.keys } };
        let keysForPlatform = [...(updatedAgent.keys[platformId] || [])];
        keysForPlatform = keysForPlatform.filter(k => k.key !== keyToDelete.key);
        
        if(keysForPlatform.length > 0) {
            updatedAgent.keys[platformId] = keysForPlatform;
        } else {
            delete updatedAgent.keys[platformId];
        }
        
        await onUpdateAgent(updatedAgent);
        setKeyToConfirmDelete(null);
        notify('ลบคีย์แล้ว');
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={`จัดการคีย์สำหรับ ${agent.username}`}>
                <div className="max-h-[60vh] overflow-y-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="sticky top-0 bg-slate-50 text-slate-500">
                             <tr>
                                <th className="p-1 font-semibold">คีย์</th>
                                <th className="p-1 font-semibold">แพลตฟอร์ม</th>
                                <th className="p-1 font-semibold">สถานะ</th>
                                <th className="p-1 font-semibold text-center">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {agentKeys.length > 0 ? agentKeys.map(k => (
                                <tr key={k.key} className="border-b border-slate-200 last:border-b-0">
                                    <td className="p-1 font-mono text-xs text-blue-600">{k.key}</td>
                                    <td className="p-1">{k.platformTitle}</td>
                                    <td className="p-1">{k.tokens_remaining <= 0 ? t('statusNoTokens') : (k.status === 'active' ? t('statusActive') : t('statusInactive'))}</td>
                                    <td className="p-1 text-center">
                                         <Button size="sm" variant="secondary" onClick={() => handleUpdateStatus(k, k.platformId)} className="mr-2">
                                            {k.status === 'active' ? 'ระงับ' : 'เปิด'}
                                        </Button>
                                        <Button size="sm" variant="danger" onClick={() => setKeyToConfirmDelete({key: k, platformId: k.platformId})}>
                                            ลบ
                                        </Button>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={4} className="text-center p-6 text-slate-500">ไม่พบคีย์</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-end mt-6 pt-4 border-t border-slate-200">
                    <Button variant="secondary" onClick={onClose}>ปิด</Button>
                </div>
            </Modal>
             <Modal isOpen={!!keyToConfirmDelete} onClose={() => setKeyToConfirmDelete(null)} title="ยืนยันการลบ">
                 <div>
                    <p className="text-slate-600 mb-4">คุณแน่ใจหรือไม่ว่าต้องการลบคีย์ <strong className="font-semibold text-slate-800 font-mono">{keyToConfirmDelete?.key.key}</strong>? การกระทำนี้ไม่สามารถย้อนกลับได้</p>
                    <div className="flex justify-end gap-3 mt-6">
                        <Button variant="secondary" onClick={() => setKeyToConfirmDelete(null)}>ยกเลิก</Button>
                        <Button variant="danger" onClick={handleDelete}>ยืนยันการลบ</Button>
                    </div>
                </div>
            </Modal>
        </>
    )
};


const AgentsPage: React.FC = () => {
    const { agents, platforms, loading, refreshData } = useData();
    const { notify, t } = useSettings();
    const [isAddAgentModalOpen, setAddAgentModalOpen] = useState(false);
    const [isHistoryModalOpen, setHistoryModalOpen] = useState(false);
    const [isKeysModalOpen, setKeysModalOpen] = useState(false);
    const [isAddCreditsModalOpen, setAddCreditsModalOpen] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [newAgentData, setNewAgentData] = useState({ username: '', password: '', credits: DEFAULT_NEW_AGENT_CREDITS, expiresAt: '' });
    const [creditsToAdd, setCreditsToAdd] = useState(DEFAULT_CREDIT_INCREMENT);
    const [error, setError] = useState('');
    const [query, setQuery] = useState('');

    const minExpirationValue = useMemo(() => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    }, []);

    const handleAddAgent = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (agents.some(u => u.username.toLowerCase() === newAgentData.username.toLowerCase())) {
            setError("ชื่อผู้ใช้นี้มีอยู่แล้ว");
            return;
        }
        if (!newAgentData.password) {
            setError("กรุณาตั้งรหัสผ่าน");
            return;
        }

        try {
            const newId = `agent_${Date.now()}`;
            const initialCredits = Number(newAgentData.credits);
            let expiresAtIso: string | undefined;

            if (!Number.isFinite(initialCredits) || initialCredits <= 0) {
                setError('กรุณากรอกจำนวนเครดิตมากกว่า 0');
                return;
            }

            if (newAgentData.expiresAt) {
                const expiresAtDate = new Date(newAgentData.expiresAt);
                if (Number.isNaN(expiresAtDate.getTime())) {
                    setError('กรุณาเลือกวันและเวลาหมดอายุที่ถูกต้อง');
                    return;
                }
                if (expiresAtDate.getTime() <= Date.now()) {
                    setError('วันหมดอายุต้องอยู่ในอนาคต');
                    return;
                }
                expiresAtIso = expiresAtDate.toISOString();
            }

            const nowIso = new Date().toISOString();
            const initialHistoryEntry: CreditHistoryEntry = {
                date: nowIso,
                action: 'เครดิตเริ่มต้น',
                amount: initialCredits,
                balanceAfter: initialCredits,
            };

            await addAgent({
                id: newId,
                username: newAgentData.username,
                password: newAgentData.password,
                credits: initialCredits,
                unlimitedCredits: false,
                createdAt: nowIso,
                keys: {},
                creditHistory: [initialHistoryEntry],
                status: 'active',
                welcomeAcknowledged: false,
                expiresAt: expiresAtIso,
            });
            refreshData();
            setAddAgentModalOpen(false);
            setNewAgentData({ username: '', password: '', credits: DEFAULT_NEW_AGENT_CREDITS, expiresAt: '' });
            notify('สร้างตัวแทนเรียบร้อย');
        } catch (err) {
            setError('ไม่สามารถเพิ่มตัวแทนได้');
            console.error(err);
            notify('ไม่สามารถเพิ่มตัวแทนได้', 'error');
        }
    };
    
    const handleOpenHistory = (agent: Agent) => {
        setSelectedAgent(agent);
        setHistoryModalOpen(true);
    };

    const handleOpenKeys = (agent: Agent) => {
        setSelectedAgent(agent);
        setKeysModalOpen(true);
    };
    
    const handleOpenAddCredits = (agent: Agent) => {
        if (hasUnlimitedCredits(agent)) {
            notify('บัญชีนี้ใช้เครดิตไม่จำกัดอยู่แล้ว');
            return;
        }
        setSelectedAgent(agent);
        setCreditsToAdd(DEFAULT_CREDIT_INCREMENT);
        setAddCreditsModalOpen(true);
    };

    const handleAddCredits = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAgent) return;
        if (hasUnlimitedCredits(selectedAgent)) {
            notify('บัญชีนี้ใช้เครดิตไม่จำกัด ไม่จำเป็นต้องเติม');
            setAddCreditsModalOpen(false);
            return;
        }
        if (!Number.isFinite(creditsToAdd) || creditsToAdd <= 0) {
            notify('กรุณาระบุจำนวนเครดิตมากกว่า 0', 'error');
            return;
        }
        try {
            const updatedAgent = JSON.parse(JSON.stringify(selectedAgent));
            const newBalance = updatedAgent.credits + creditsToAdd;
            updatedAgent.credits = newBalance;

            const newHistoryEntry: CreditHistoryEntry = {
                date: new Date().toISOString(),
                action: `เติมเครดิตโดยแอดมิน`,
                amount: creditsToAdd,
                balanceAfter: newBalance,
            };
            updatedAgent.creditHistory = [...(updatedAgent.creditHistory || []), newHistoryEntry];

            await handleUpdateAgent(updatedAgent);
            setAddCreditsModalOpen(false);
            notify('เติมเครดิตสำเร็จ');
        } catch (err) {
            notify('เติมเครดิตไม่สำเร็จ', 'error');
        }
    };

    const handleUpdateAgent = async (agent: Agent) => {
        await updateAgent(agent);
        refreshData();
        // Also update the selected agent in state to reflect changes immediately in modal
        setSelectedAgent(agent); 
    };

    const filteredAgents = agents.filter(a => a.username.toLowerCase().includes(query.toLowerCase()));

    const handleBanAgent = async (agent: Agent) => {
        const targetBanState = agent.status !== 'banned';
        try {
            await setAgentBanState(agent.id, targetBanState);
            refreshData();
            notify(targetBanState ? 'แบนตัวแทนแล้ว' : 'ปลดแบนตัวแทนแล้ว');
        } catch (error) {
            console.error('Failed to update agent ban state:', error);
            notify('ไม่สามารถอัปเดตสถานะการแบนได้', 'error');
        }
    };
    const handleDeleteAgent = async (agent: Agent) => {
        await deleteAgent(agent.id);
        refreshData();
        notify('ลบตัวแทนแล้ว');
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <div className="flex items-center gap-2">
                    <Input
                        placeholder="ค้นหา..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        leftIcon={<MagnifyingGlassIcon className="w-4 h-4" />}
                    />
                    <Button onClick={() => setAddAgentModalOpen(true)}>+ เพิ่มตัวแทน</Button>
                </div>
            </div>

            {loading ? <p>กำลังโหลดข้อมูลตัวแทน...</p> : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredAgents.map(u => (
                        <AgentCard
                            key={u.id}
                            agent={u}
                            onViewHistory={handleOpenHistory}
                            onManageKeys={handleOpenKeys}
                            onAddCredits={handleOpenAddCredits}
                            onBan={handleBanAgent}
                            onDelete={handleDeleteAgent}
                            platforms={platforms}
                        />
                    ))}
                </div>
            )}
             { !loading && filteredAgents.length === 0 && <p className="text-slate-500 text-center py-10">ไม่พบตัวแทน</p>}

            <Modal isOpen={isAddAgentModalOpen} onClose={() => setAddAgentModalOpen(false)} title="เพิ่มตัวแทนใหม่">
                 <form onSubmit={handleAddAgent} className="space-y-4">
                    <Input label="ชื่อผู้ใช้" placeholder="เช่น agent_007" value={newAgentData.username} onChange={e => setNewAgentData({...newAgentData, username: e.target.value})} required />
                    <Input label="รหัสผ่าน" type="password" placeholder="ตั้งรหัสผ่านสำหรับตัวแทน" value={newAgentData.password} onChange={e => setNewAgentData({...newAgentData, password: e.target.value})} required />
                    <Input
                        label="เครดิตเริ่มต้น"
                        type="number"
                        placeholder="เช่น 1000"
                        value={newAgentData.credits}
                        min={0}
                        onChange={e => {
                            const value = Number(e.target.value);
                            setNewAgentData({
                                ...newAgentData,
                                credits: Math.max(0, Number.isFinite(value) ? value : 0),
                            });
                        }}
                    />
                    <Input
                        label="วันและเวลาหมดอายุ"
                        type="datetime-local"
                        value={newAgentData.expiresAt}
                        min={minExpirationValue}
                        onChange={e => setNewAgentData({ ...newAgentData, expiresAt: e.target.value })}
                    />
                    <p className="text-xs text-slate-500 -mt-2">ระบบจะลบตัวแทนนี้ให้อัตโนมัติเมื่อถึงเวลาที่กำหนด</p>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setAddAgentModalOpen(false)}>ยกเลิก</Button>
                        <Button type="submit">สร้างตัวแทน</Button>
                    </div>
                 </form>
            </Modal>
            
            <Modal isOpen={isAddCreditsModalOpen} onClose={() => setAddCreditsModalOpen(false)} title={`เติมเครดิตสำหรับ ${selectedAgent?.username}`}>
                 <form onSubmit={handleAddCredits} className="space-y-4">
                    <div>
                        <p className="text-sm text-slate-600">เครดิตปัจจุบัน: <span className="font-bold text-blue-600">{selectedAgent ? formatCredits(selectedAgent) : '-'}</span></p>
                    </div>
                    <Input
                        label="จำนวนเครดิตที่ต้องการเพิ่ม"
                        type="number"
                        placeholder="เช่น 500"
                        value={creditsToAdd}
                        min={0}
                        onChange={e => {
                            const value = Number(e.target.value);
                            setCreditsToAdd(Math.max(0, Number.isFinite(value) ? value : 0));
                        }}
                        required
                    />

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setAddCreditsModalOpen(false)}>ยกเลิก</Button>
                        <Button type="submit">ยืนยันการเติม</Button>
                    </div>
                 </form>
            </Modal>

            <Modal isOpen={isHistoryModalOpen} onClose={() => setHistoryModalOpen(false)} title={`ประวัติเครดิต: ${selectedAgent?.username}`}>
                <div className="max-h-96 overflow-y-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="sticky top-0 bg-slate-50 text-slate-500">
                            <tr>
                                <th className="p-1 font-semibold">วันที่</th>
                                <th className="p-1 font-semibold">รายการ</th>
                                <th className="p-1 font-semibold text-right">จำนวน</th>
                                <th className="p-1 font-semibold text-right">คงเหลือ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {selectedAgent?.creditHistory && selectedAgent.creditHistory.length > 0 ? (
                                [...selectedAgent.creditHistory].reverse().map((entry, index) => (
                                    <tr key={index} className="border-b border-slate-200 last:border-b-0 odd:bg-white even:bg-slate-50 hover:bg-slate-100">
                                        <td className="p-1 text-slate-500 whitespace-nowrap">{new Date(entry.date).toLocaleString('th-TH')}</td>
                                        <td className="p-1 text-slate-600">{entry.action}</td>
                                        <td className={`p-1 text-right font-semibold ${entry.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {entry.amount >= 0 ? `+${entry.amount.toLocaleString()}` : entry.amount.toLocaleString()}
                                        </td>
                                        <td className="p-1 text-right text-slate-600">{entry.balanceAfter.toLocaleString()}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="text-center p-6 text-slate-500">ไม่พบประวัติเครดิต</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                 <div className="flex justify-end mt-6 pt-4 border-t border-slate-200">
                    <Button variant="secondary" onClick={() => setHistoryModalOpen(false)}>ปิด</Button>
                </div>
            </Modal>

            <ManageKeysModal 
                agent={selectedAgent}
                platforms={platforms}
                isOpen={isKeysModalOpen}
                onClose={() => setKeysModalOpen(false)}
                onUpdateAgent={handleUpdateAgent}
            />
        </div>
    );
};

export default AgentsPage;