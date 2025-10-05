import React, { useState } from 'react';
import { useAuth, useData, useSettings } from '../App';
import { addApplication, updateApplication, deleteApplication } from '../services/firebaseService';
import { Application } from '../types';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import LoadingState from '../components/ui/LoadingState';

const AppsPage: React.FC = () => {
    const { applications, loading, refreshData } = useData();
    const { user } = useAuth();
    const { t, notify } = useSettings();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingApp, setEditingApp] = useState<Application | null>(null);
    const [appToDelete, setAppToDelete] = useState<Application | null>(null);
    const [newApp, setNewApp] = useState({ name: '', url: '', tokenCost: 1 });
    const [error, setError] = useState('');

    const isAgent = user?.role === 'agent';

    const AppCard: React.FC<{ app: Application }> = ({ app }) => (
        <Card className="p-3" onClick={isAgent ? () => window.open(app.url, '_blank', 'noopener,noreferrer') : undefined}>
            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                <div>
                    <h3 className="font-semibold text-slate-800 text-md">{app.name}</h3>
                    <a href={app.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-700 font-mono break-all hover:underline">{app.url}</a>
                    <p className="text-sm text-slate-500 mt-1">{t('tokenCost')}: {app.tokenCost}</p>
                </div>
                <div className="flex gap-2 sm:flex-col sm:items-end">
                    <p className="text-xs text-slate-500">เพิ่มเมื่อ: {new Date(app.addedAt).toLocaleDateString('th-TH')}</p>
                    {!isAgent && (
                        <div className="flex gap-2 mt-1">
                            <Button size="sm" variant="secondary" onClick={() => handleEdit(app)}>{t('edit')}</Button>
                            <Button size="sm" variant="danger" onClick={() => setAppToDelete(app)}>{t('delete')}</Button>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );

    const handleEdit = (app: Application) => {
        setEditingApp(app);
        setNewApp({ name: app.name, url: app.url, tokenCost: app.tokenCost });
        setIsModalOpen(true);
    };

    const handleSaveApp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            if (editingApp) {
                await updateApplication({ id: editingApp.id, name: newApp.name, url: newApp.url, tokenCost: Number(newApp.tokenCost), addedAt: editingApp.addedAt });
                notify('อัปเดตแอพแล้ว');
            } else {
                const newId = `app_${Date.now()}`;
                await addApplication({ id: newId, name: newApp.name, url: newApp.url, tokenCost: Number(newApp.tokenCost), addedAt: new Date().toISOString() });
                notify('เพิ่มแอพแล้ว');
            }
            refreshData();
            setIsModalOpen(false);
            setNewApp({ name: '', url: '', tokenCost: 1 });
            setEditingApp(null);
        } catch (err) {
            setError('ไม่สามารถบันทึกแอพได้');
            console.error(err);
            notify('ไม่สามารถบันทึกแอพได้', 'error');
        }
    };

    const handleDelete = async () => {
        if (!appToDelete) return;
        try {
            await deleteApplication(appToDelete.id);
            refreshData();
            notify('ลบแอพแล้ว');
        } catch (err) {
            console.error(err);
            notify('ลบแอพไม่สำเร็จ', 'error');
        }
        setAppToDelete(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                {!isAgent && <Button onClick={() => { setEditingApp(null); setNewApp({ name: '', url: '', tokenCost: 1 }); setIsModalOpen(true); }}>+ เพิ่มแอพ</Button>}
            </div>

            {loading ? (
                <LoadingState
                    label="กำลังเรียกข้อมูลแอพ"
                    helperText="กำลังซิงก์รายการแอพล่าสุด โปรดรอสักครู่"
                    className="mx-auto my-12 max-w-md"
                />
            ) : (
                <div className="space-y-4">
                    {applications.map(app => <AppCard key={app.id} app={app} />)}
                    {applications.length === 0 && <p className="text-center p-10 text-slate-500">ยังไม่มีแอพในไดเรกทอรี</p>}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingApp ? 'แก้ไขแอพ' : 'เพิ่มแอพไปยังไดเรกทอรี'}>
                <form onSubmit={handleSaveApp} className="space-y-4">
                    <Input label="ชื่อแอพ" placeholder="เช่น My Awesome App" value={newApp.name} onChange={e => setNewApp({ ...newApp, name: e.target.value })} required />
                    <Input label="URL ของแอพ" placeholder="เช่น https://example.com" type="url" value={newApp.url} onChange={e => setNewApp({ ...newApp, url: e.target.value })} required />
                    <Input label="โทเค็นต่อครั้ง" type="number" value={newApp.tokenCost} onChange={e => setNewApp({ ...newApp, tokenCost: Number(e.target.value) })} required />

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>ยกเลิก</Button>
                        <Button type="submit">{editingApp ? 'บันทึก' : 'เพิ่มแอพ'}</Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={!!appToDelete} onClose={() => setAppToDelete(null)} title="ยืนยันการลบ">
                <p className="text-slate-600 mb-4">คุณแน่ใจหรือไม่ว่าต้องการลบแอพ <strong className="font-semibold text-slate-800">{appToDelete?.name}</strong>?</p>
                <div className="flex justify-end gap-3 pt-4">
                    <Button variant="secondary" onClick={() => setAppToDelete(null)}>ยกเลิก</Button>
                    <Button variant="danger" onClick={handleDelete}>ยืนยัน</Button>
                </div>
            </Modal>
        </div>
    );
};

export default AppsPage;
