
import React, { useState } from 'react';
import { useAuth, useData, useSettings } from '../App';
import { addBot, updateBot, deleteBot } from '../services/firebaseService';
import { Bot } from '../types';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';

const BotsPage: React.FC = () => {
    const { bots, loading, refreshData } = useData();
    const { user } = useAuth();
    const { t, notify } = useSettings();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBot, setEditingBot] = useState<Bot | null>(null);
    const [botToDelete, setBotToDelete] = useState<Bot | null>(null);
    const [newBot, setNewBot] = useState({ name: '', url: '', tokenCost: 1 });
    const [error, setError] = useState('');

    const isAgent = user?.role === 'agent';

    const BotCard: React.FC<{ bot: Bot }> = ({ bot }) => (
        <Card className="p-3" onClick={isAgent ? () => window.open(bot.url, '_blank', 'noopener,noreferrer') : undefined}>
            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                <div>
                    <h3 className="font-semibold text-slate-800 text-md">{bot.name}</h3>
                    <a href={bot.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-700 font-mono break-all hover:underline">{bot.url}</a>
                    <p className="text-sm text-slate-500 mt-1">{t('tokenCost')}: {bot.tokenCost}</p>
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
        setNewBot({ name: bot.name, url: bot.url, tokenCost: bot.tokenCost });
        setIsModalOpen(true);
    };

    const handleSaveBot = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            if (editingBot) {
                await updateBot({ id: editingBot.id, name: newBot.name, url: newBot.url, tokenCost: Number(newBot.tokenCost), addedAt: editingBot.addedAt });
                notify('อัปเดตบอทแล้ว');
            } else {
                const newId = `bot_${Date.now()}`;
                await addBot({ id: newId, name: newBot.name, url: newBot.url, tokenCost: Number(newBot.tokenCost), addedAt: new Date().toISOString() });
                notify('เพิ่มบอทแล้ว');
            }
            refreshData();
            setIsModalOpen(false);
            setNewBot({ name: '', url: '', tokenCost: 1 });
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
            {!isAgent && <Button onClick={() => { setEditingBot(null); setNewBot({ name: '', url: '', tokenCost: 1 }); setIsModalOpen(true); }}>+ เพิ่มบอท</Button>}
        </div>

            {loading ? <p>กำลังโหลดบอท...</p> : (
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
