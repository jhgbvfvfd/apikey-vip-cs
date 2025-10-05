
import React, { useState } from 'react';
import { useAuth, useData, useSettings } from '../App';
import { addBot, updateBot, deleteBot } from '../services/firebaseService';
import { Bot, UsageMode } from '../types';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import LoadingState from '../components/ui/LoadingState';

const BotsPage: React.FC = () => {
    const { bots, loading, refreshData } = useData();
    const { user } = useAuth();
    const { t, notify } = useSettings();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBot, setEditingBot] = useState<Bot | null>(null);
    const [botToDelete, setBotToDelete] = useState<Bot | null>(null);
    interface BotFormState {
        name: string;
        url: string;
        tokenCost: number;
        usageModes: UsageMode[];
    }

    const createDefaultFormState = (): BotFormState => ({ name: '', url: '', tokenCost: 1, usageModes: ['token'] });

    const [newBot, setNewBot] = useState<BotFormState>(createDefaultFormState());
    const [error, setError] = useState('');

    const isAgent = user?.role === 'agent';

    const getUsageModeSummary = (modes?: UsageMode[]): string => {
        const normalized = Array.isArray(modes) ? modes : ['token'];
        const hasToken = normalized.includes('token');
        const hasDuration = normalized.includes('duration');

        if (hasToken && hasDuration) {
            return t('botUsageModesSummaryBoth');
        }

        if (hasDuration) {
            return t('botUsageModesSummaryDuration');
        }

        return t('botUsageModesSummaryToken');
    };

    const BotCard: React.FC<{ bot: Bot }> = ({ bot }) => (
        <Card className="p-3" onClick={isAgent ? () => window.open(bot.url, '_blank', 'noopener,noreferrer') : undefined}>
            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                <div>
                    <h3 className="font-semibold text-slate-800 text-md">{bot.name}</h3>
                    <a href={bot.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-700 font-mono break-all hover:underline">{bot.url}</a>
                    <p className="text-sm text-slate-500 mt-1">{t('tokenCost')}: {bot.tokenCost}</p>
                    <p className="text-xs font-medium text-blue-600 mt-2">{getUsageModeSummary(bot.usageModes)}</p>
                </div>
                <div className="flex gap-2 sm:flex-col sm:items-end">
                    <p className="text-xs text-slate-500">เพิ่มเมื่อ: {new Date(bot.addedAt).toLocaleDateString('th-TH')}</p>
                    {!isAgent && (
                        <div className="flex gap-2 mt-1">
                            <Button size="sm" variant="secondary" onClick={() => handleEdit(bot)}>{t('edit')}</Button>
                            <Button size="sm" variant="danger" onClick={() => setBotToDelete(bot)}>{t('delete')}</Button>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );

    const handleEdit = (bot: Bot) => {
        setEditingBot(bot);
        setNewBot({ name: bot.name, url: bot.url, tokenCost: bot.tokenCost, usageModes: Array.isArray(bot.usageModes) && bot.usageModes.length > 0 ? bot.usageModes : ['token'] });
        setIsModalOpen(true);
    };

    const handleSaveBot = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!newBot.usageModes || newBot.usageModes.length === 0) {
            setError(t('botUsageModesRequired'));
            return;
        }

        try {
            if (editingBot) {
                await updateBot({ id: editingBot.id, name: newBot.name, url: newBot.url, tokenCost: Number(newBot.tokenCost), addedAt: editingBot.addedAt, usageModes: newBot.usageModes });
                notify('อัปเดตบอทแล้ว');
            } else {
                const newId = `bot_${Date.now()}`;
                await addBot({ id: newId, name: newBot.name, url: newBot.url, tokenCost: Number(newBot.tokenCost), addedAt: new Date().toISOString(), usageModes: newBot.usageModes });
                notify('เพิ่มบอทแล้ว');
            }
            refreshData();
            setIsModalOpen(false);
            setNewBot(createDefaultFormState());
            setEditingBot(null);
        } catch (err) {
            setError('ไม่สามารถบันทึกบอทได้');
            console.error(err);
            notify('ไม่สามารถบันทึกบอทได้', 'error');
        }
    };

    const handleDelete = async () => {
        if (!botToDelete) return;
        try {
            await deleteBot(botToDelete.id);
            refreshData();
            notify('ลบบอทแล้ว');
        } catch (err) {
            console.error(err);
            notify('ลบบอทไม่สำเร็จ', 'error');
        }
        setBotToDelete(null);
    };
    
    return (
        <div className="space-y-6">
        <div className="flex justify-end">
            {!isAgent && <Button onClick={() => { setEditingBot(null); setNewBot(createDefaultFormState()); setIsModalOpen(true); }}>+ เพิ่มบอท</Button>}
        </div>

            {loading ? (
                <LoadingState
                    label="กำลังเรียกข้อมูลบอท"
                    helperText="เตรียมพร้อมเครื่องมือบอทล่าสุด โปรดรอสักครู่"
                    className="mx-auto my-12 max-w-md"
                />
            ) : (
                <div className="space-y-4">
                    {bots.map(bot => <BotCard key={bot.id} bot={bot} />)}
                    {bots.length === 0 && <p className="text-center p-10 text-slate-500">ยังไม่มีบอทในไดเรกทอรี</p>}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingBot ? 'แก้ไขบอท' : 'เพิ่มบอทไปยังไดเรกทอรี'}>
                <form onSubmit={handleSaveBot} className="space-y-4">
                    <Input label="ชื่อบอท" placeholder="เช่น My Awesome Bot" value={newBot.name} onChange={e => setNewBot({...newBot, name: e.target.value})} required />
                    <Input label="URL ของบอท" placeholder="เช่น https://t.me/my_bot" type="url" value={newBot.url} onChange={e => setNewBot({...newBot, url: e.target.value})} required />
                    <Input label="โทเค็นต่อครั้ง" type="number" value={newBot.tokenCost} onChange={e => setNewBot({...newBot, tokenCost: Number(e.target.value)})} required />

                    <div className="space-y-2">
                        <p className="text-sm font-medium text-slate-700">{t('botUsageModesLabel')}</p>
                        <p className="text-xs text-slate-500">{t('botUsageModesHint')}</p>
                        <div className="space-y-2 mt-2">
                            {[
                                { value: 'token' as UsageMode, label: t('botUsageModeToken'), description: t('botUsageModeTokenDesc') },
                                { value: 'duration' as UsageMode, label: t('botUsageModeDuration'), description: t('botUsageModeDurationDesc') },
                            ].map((option) => {
                                const checked = newBot.usageModes.includes(option.value);
                                return (
                                    <label
                                        key={option.value}
                                        className={`flex items-start gap-3 rounded-lg border p-3 transition ${checked ? 'border-blue-400 bg-blue-50/60 shadow-sm' : 'border-slate-200 hover:border-blue-300'}`}
                                    >
                                        <input
                                            type="checkbox"
                                            className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            checked={checked}
                                            onChange={() => {
                                                setError('');
                                                setNewBot((prev) => {
                                                    const hasMode = prev.usageModes.includes(option.value);
                                                    if (hasMode) {
                                                        if (prev.usageModes.length === 1) {
                                                            return prev;
                                                        }
                                                        const nextModes = prev.usageModes.filter((mode) => mode !== option.value);
                                                        return { ...prev, usageModes: nextModes };
                                                    }
                                                    return { ...prev, usageModes: [...prev.usageModes, option.value] };
                                                });
                                            }}
                                            disabled={isAgent}
                                        />
                                        <span>
                                            <span className="block text-sm font-medium text-slate-700">{option.label}</span>
                                            <span className="mt-0.5 block text-xs text-slate-500">{option.description}</span>
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>ยกเลิก</Button>
                        <Button type="submit">{editingBot ? 'บันทึก' : 'เพิ่มบอท'}</Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={!!botToDelete} onClose={() => setBotToDelete(null)} title="ยืนยันการลบ">
                <p className="text-slate-600 mb-4">คุณแน่ใจหรือไม่ว่าต้องการลบบอท <strong className="font-semibold text-slate-800">{botToDelete?.name}</strong>?</p>
                <div className="flex justify-end gap-3 pt-4">
                    <Button variant="secondary" onClick={() => setBotToDelete(null)}>ยกเลิก</Button>
                    <Button variant="danger" onClick={handleDelete}>ยืนยัน</Button>
                </div>
            </Modal>
        </div>
    );
};

export default BotsPage;
