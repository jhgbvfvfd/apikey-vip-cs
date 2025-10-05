import React, { useState } from 'react';
import { useAuth, useData, useSettings } from '../App';
import { addWebsite, updateWebsite, deleteWebsite } from '../services/firebaseService';
import { UsageMode, Website } from '../types';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import LoadingState from '../components/ui/LoadingState';

const WebsitesPage: React.FC = () => {
    const { websites, loading, refreshData } = useData();
    const { user } = useAuth();
    const { t, notify } = useSettings();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingWebsite, setEditingWebsite] = useState<Website | null>(null);
    const [websiteToDelete, setWebsiteToDelete] = useState<Website | null>(null);
    interface WebsiteFormState {
        name: string;
        url: string;
        tokenCost: number;
        usageModes: UsageMode[];
    }

    const createDefaultFormState = (): WebsiteFormState => ({ name: '', url: '', tokenCost: 1, usageModes: ['token'] });

    const [newWebsite, setNewWebsite] = useState<WebsiteFormState>(createDefaultFormState());
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

    const WebsiteCard: React.FC<{ website: Website }> = ({ website }) => (
        <Card className="p-3" onClick={isAgent ? () => window.open(website.url, '_blank', 'noopener,noreferrer') : undefined}>
            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                <div>
                    <h3 className="font-semibold text-slate-800 text-md">{website.name}</h3>
                    <a href={website.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-700 font-mono break-all hover:underline">{website.url}</a>
                    <p className="text-sm text-slate-500 mt-1">{t('tokenCost')}: {website.tokenCost}</p>
                    <p className="text-xs font-medium text-blue-600 mt-2">{getUsageModeSummary(website.usageModes)}</p>
                </div>
                <div className="flex gap-2 sm:flex-col sm:items-end">
                    <p className="text-xs text-slate-500">เพิ่มเมื่อ: {new Date(website.addedAt).toLocaleDateString('th-TH')}</p>
                    {!isAgent && (
                        <div className="flex gap-2 mt-1">
                            <Button size="sm" variant="secondary" onClick={() => handleEdit(website)}>{t('edit')}</Button>
                            <Button size="sm" variant="danger" onClick={() => setWebsiteToDelete(website)}>{t('delete')}</Button>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );

    const handleEdit = (website: Website) => {
        setEditingWebsite(website);
        setNewWebsite({ name: website.name, url: website.url, tokenCost: website.tokenCost, usageModes: Array.isArray(website.usageModes) && website.usageModes.length > 0 ? website.usageModes : ['token'] });
        setIsModalOpen(true);
    };

    const handleSaveWebsite = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!newWebsite.usageModes || newWebsite.usageModes.length === 0) {
            setError(t('botUsageModesRequired'));
            return;
        }

        try {
            if (editingWebsite) {
                await updateWebsite({ id: editingWebsite.id, name: newWebsite.name, url: newWebsite.url, tokenCost: Number(newWebsite.tokenCost), addedAt: editingWebsite.addedAt, usageModes: newWebsite.usageModes });
                notify('อัปเดตเว็บแล้ว');
            } else {
                const newId = `web_${Date.now()}`;
                await addWebsite({ id: newId, name: newWebsite.name, url: newWebsite.url, tokenCost: Number(newWebsite.tokenCost), addedAt: new Date().toISOString(), usageModes: newWebsite.usageModes });
                notify('เพิ่มเว็บแล้ว');
            }
            refreshData();
            setIsModalOpen(false);
            setNewWebsite(createDefaultFormState());
            setEditingWebsite(null);
        } catch (err) {
            setError('ไม่สามารถบันทึกเว็บได้');
            console.error(err);
            notify('ไม่สามารถบันทึกเว็บได้', 'error');
        }
    };

    const handleDelete = async () => {
        if (!websiteToDelete) return;
        try {
            await deleteWebsite(websiteToDelete.id);
            refreshData();
            notify('ลบเว็บแล้ว');
        } catch (err) {
            console.error(err);
            notify('ลบเว็บไม่สำเร็จ', 'error');
        }
        setWebsiteToDelete(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                {!isAgent && (
                    <Button onClick={() => {
                        setEditingWebsite(null);
                        setNewWebsite(createDefaultFormState());
                        setIsModalOpen(true);
                    }}>+ เพิ่มเว็บ</Button>
                )}
            </div>

            {loading ? (
                <LoadingState
                    label="กำลังเรียกข้อมูลเว็บ"
                    helperText="กำลังซิงก์รายการเว็บล่าสุด โปรดรอสักครู่"
                    className="mx-auto my-12 max-w-md"
                />
            ) : (
                <div className="space-y-4">
                    {websites.map((website) => (
                        <WebsiteCard key={website.id} website={website} />
                    ))}
                    {websites.length === 0 && <p className="text-center p-10 text-slate-500">ยังไม่มีเว็บในไดเรกทอรี</p>}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingWebsite ? 'แก้ไขเว็บ' : 'เพิ่มเว็บไปยังไดเรกทอรี'}>
                <form onSubmit={handleSaveWebsite} className="space-y-4">
                    <Input label="ชื่อเว็บ" placeholder="เช่น My Awesome Website" value={newWebsite.name} onChange={(e) => setNewWebsite({ ...newWebsite, name: e.target.value })} required />
                    <Input label="URL ของเว็บ" placeholder="เช่น https://example.com" type="url" value={newWebsite.url} onChange={(e) => setNewWebsite({ ...newWebsite, url: e.target.value })} required />
                    <Input label="โทเค็นต่อครั้ง" type="number" value={newWebsite.tokenCost} onChange={(e) => setNewWebsite({ ...newWebsite, tokenCost: Number(e.target.value) })} required />

                    <div className="space-y-2">
                        <p className="text-sm font-medium text-slate-700">{t('botUsageModesLabel')}</p>
                        <p className="text-xs text-slate-500">{t('botUsageModesHint')}</p>
                        <div className="space-y-2 mt-2">
                            {[
                                { value: 'token' as UsageMode, label: t('botUsageModeToken'), description: t('botUsageModeTokenDesc') },
                                { value: 'duration' as UsageMode, label: t('botUsageModeDuration'), description: t('botUsageModeDurationDesc') },
                            ].map((option) => {
                                const checked = newWebsite.usageModes.includes(option.value);
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
                                                setNewWebsite((prev) => {
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
                        <Button type="submit">{editingWebsite ? 'บันทึก' : 'เพิ่มเว็บ'}</Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={!!websiteToDelete} onClose={() => setWebsiteToDelete(null)} title="ยืนยันการลบ">
                <p className="text-slate-600 mb-4">คุณแน่ใจหรือไม่ว่าต้องการลบเว็บ <strong className="font-semibold text-slate-800">{websiteToDelete?.name}</strong>?</p>
                <div className="flex justify-end gap-3 pt-4">
                    <Button variant="secondary" onClick={() => setWebsiteToDelete(null)}>ยกเลิก</Button>
                    <Button variant="danger" onClick={handleDelete}>ยืนยัน</Button>
                </div>
            </Modal>
        </div>
    );
};

export default WebsitesPage;
