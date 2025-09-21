import React, { useState, useEffect } from 'react';
import { useData, useSettings } from '../App';
import { StandaloneKey } from '../types';
import { addStandaloneKey, updateStandaloneKey, deleteStandaloneKey } from '../services/firebaseService';
import { generateKey } from '../utils/keyGenerator';
import Button from '../components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import PlatformTabs from '../components/ui/PlatformTabs';
import {
    ClipboardIcon,
    CheckIcon,
    PauseIcon,
    PlayIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';

const KeyRow: React.FC<{ 
    apiKey: StandaloneKey;
    onUpdateStatus: (key: StandaloneKey, status: 'active' | 'inactive') => void;
    onDelete: (key: StandaloneKey) => void;
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
        const newStatus = apiKey.status === 'active' ? 'inactive' : 'active';
        onUpdateStatus(apiKey, newStatus);
    };

    const handleDelete = () => {
        onDelete(apiKey);
    };

    return (
        <tr className="border-b border-slate-200 last:border-b-0 odd:bg-white even:bg-slate-50 hover:bg-slate-100">
            <td className="p-2 font-mono text-xs sm:text-sm text-blue-600 break-all">{apiKey.key}</td>
            <td className="p-2 text-right text-xs sm:text-sm text-slate-600 whitespace-nowrap">{apiKey.tokens_remaining.toLocaleString()}</td>
            <td className="p-2 whitespace-nowrap">
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
            <td className="p-2 text-xs sm:text-sm text-slate-600 whitespace-nowrap">{new Date(apiKey.createdAt).toLocaleDateString('th-TH')}</td>
            <td className="p-2 text-center">
                <div className="inline-flex items-center justify-center gap-1">
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
                        title={apiKey.status === 'active' ? 'ระงับคีย์' : 'เปิดใช้งาน'}
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
                        title="ลบคีย์"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            </td>
        </tr>
    );
};


const GenerateKeyPage: React.FC = () => {
    const { platforms, standaloneKeys, loading, refreshData } = useData();
    const { notify, t } = useSettings();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [keyToDelete, setKeyToDelete] = useState<StandaloneKey | null>(null);
    const [generatedKey, setGeneratedKey] = useState('');
    const [selectedPlatformId, setSelectedPlatformId] = useState(platforms[0]?.id || '');
    const [activeMenu, setActiveMenu] = useState<'create' | 'manage'>('create');
    const MIN_TOKENS = 1;
    const MAX_TOKENS = 1000;
    const [tokens, setTokens] = useState(100);
    const [error, setError] = useState('');

    const handleGenerateKey = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!selectedPlatformId) {
            setError('กรุณาเลือกแพลตฟอร์ม');
            return;
        }

        const platform = platforms.find(p => p.id === selectedPlatformId);
        if (!platform) {
            setError('เลือกแพลตฟอร์มไม่ถูกต้อง');
            return;
        }

        const cost = Number(tokens);
        if (!Number.isFinite(cost) || cost < MIN_TOKENS || cost > MAX_TOKENS) {
            setError(`กำหนดโทเค็นได้ระหว่าง ${MIN_TOKENS} - ${MAX_TOKENS}`);
            return;
        }

        try {
            const newKeyString = generateKey(platform.prefix, platform.pattern);
            const newKeyObject: Omit<StandaloneKey, 'id'> & { id: string } = {
                id: `key_${Date.now()}`,
                key: newKeyString,
                tokens_remaining: cost,
                status: 'active',
                createdAt: new Date().toISOString(),
                platformId: platform.id,
                platformTitle: platform.title,
            };
            await addStandaloneKey(newKeyObject);
            refreshData();
            setGeneratedKey(newKeyString);
            setIsModalOpen(true);
            setActiveMenu('manage');
            notify('สร้างคีย์เรียบร้อย');
        } catch (err) {
            setError('ไม่สามารถสร้างคีย์ได้');
            console.error(err);
            notify('ไม่สามารถสร้างคีย์ได้', 'error');
        }
    };

    const handleUpdateKeyStatus = async (key: StandaloneKey, status: 'active' | 'inactive') => {
        const updatedKey = { ...key, status };
        await updateStandaloneKey(updatedKey);
        refreshData();
        notify(status === 'active' ? 'เปิดใช้งานคีย์แล้ว' : 'ระงับคีย์แล้ว');
    };

    const confirmDeleteKey = (key: StandaloneKey) => {
        setKeyToDelete(key);
        setConfirmDeleteOpen(true);
    };

    const handleDeleteKey = async () => {
        if (!keyToDelete) return;
        try {
            await deleteStandaloneKey(keyToDelete.id);
            refreshData();
            setConfirmDeleteOpen(false);
            setKeyToDelete(null);
            notify('ลบคีย์แล้ว');
        } catch (err) {
            notify('ลบคีย์ไม่สำเร็จ', 'error');
        }
    };

    const handleModalCopy = async () => {
        try {
            await navigator.clipboard.writeText(generatedKey);
            notify(t('copySuccess'));
        } catch (err) {
            notify(t('copyFailed'), 'error');
        }
    };
    
    useEffect(() => {
        if (platforms.length > 0 && !selectedPlatformId) {
            setSelectedPlatformId(platforms[0].id);
        }
    }, [platforms, selectedPlatformId]);

    const filteredKeys = standaloneKeys.filter(k => k.platformId === selectedPlatformId);

    return (
        <div className="space-y-6">
            <div className="md:hidden">
                <div className="flex items-center rounded-full border border-slate-200 bg-white p-1 text-sm font-medium text-slate-500 shadow-sm">
                    <button
                        className={`flex-1 rounded-full px-3 py-2 transition-colors ${activeMenu === 'create' ? 'bg-blue-500 text-white shadow' : 'hover:text-slate-700'}`}
                        onClick={() => setActiveMenu('create')}
                    >
                        สร้างคีย์
                    </button>
                    <button
                        className={`flex-1 rounded-full px-3 py-2 transition-colors ${activeMenu === 'manage' ? 'bg-blue-500 text-white shadow' : 'hover:text-slate-700'}`}
                        onClick={() => setActiveMenu('manage')}
                    >
                        จัดการคีย์ที่สร้าง
                    </button>
                </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2 md:items-start">
                <div className={`${activeMenu === 'create' ? 'block' : 'hidden'} md:block`}>
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md space-y-6">
                        <div className="space-y-2">
                            <p className="text-xs uppercase tracking-[0.45em] text-blue-500 font-semibold animate-fade-up">ADMIN BOT</p>
                            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-400 animate-gradient-x">CSCODE</h1>
                            <p className="text-sm text-slate-500">
                                ศูนย์ควบคุมการสร้างคีย์ที่ออกแบบมาเพื่อให้คุณทำงานได้รวดเร็วในทุกอุปกรณ์
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-inner">
                            <div className="space-y-3">
                                <p className="text-xs uppercase tracking-[0.3em] text-blue-500 font-semibold">เลือกแพลตฟอร์ม</p>
                                <h2 className="text-lg font-semibold text-slate-800">เลือกแพลตฟอร์มสำหรับสร้างคีย์ของคุณ</h2>
                                <div className="pt-1">
                                    <PlatformTabs platforms={platforms} selected={selectedPlatformId} onSelect={setSelectedPlatformId} />
                                </div>
                            </div>
                        </div>

                        <Card className="shadow-md">
                            <CardHeader className="bg-slate-50/80">
                                <CardTitle>สร้างคีย์ใหม่</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleGenerateKey} className="space-y-4">
                                    <div className="space-y-1">
                                        <Input
                                            label="จำนวนโทเค็นต่อคีย์"
                                            type="number"
                                            min={MIN_TOKENS}
                                            max={MAX_TOKENS}
                                            step={1}
                                            value={tokens}
                                            onChange={e => setTokens(Number(e.target.value))}
                                            required
                                        />
                                        <p className="text-xs text-slate-500">
                                            กำหนดได้ระหว่าง {MIN_TOKENS.toLocaleString()} - {MAX_TOKENS.toLocaleString()} โทเค็นต่อคีย์
                                        </p>
                                    </div>
                                    {error && <p className="text-red-500 text-sm">{error}</p>}
                                    <div className="flex justify-end pt-2">
                                        <Button type="submit" disabled={platforms.length === 0}>สร้าง</Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className={`${activeMenu === 'manage' ? 'block' : 'hidden'} md:block`}>
                    <Card className="h-full mx-auto max-w-md sm:max-w-lg md:max-w-none md:mx-0">
                        <CardHeader>
                            <CardTitle>คีย์ที่สร้างแล้ว</CardTitle>
                        </CardHeader>
                        <div className="overflow-x-auto">
                            <table className="w-full table-fixed text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500">
                                    <tr>
                                        <th className="w-40 p-2 text-xs font-semibold sm:text-sm">คีย์</th>
                                        <th className="w-16 p-2 text-xs font-semibold sm:text-sm text-right">โทเค็น</th>
                                        <th className="w-24 p-2 text-xs font-semibold sm:text-sm">สถานะ</th>
                                        <th className="w-28 p-2 text-xs font-semibold sm:text-sm">วันที่สร้าง</th>
                                        <th className="p-2 text-center text-xs font-semibold sm:text-sm">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan={5} className="text-center p-4">กำลังโหลดคีย์...</td></tr>
                                    ) : filteredKeys.length > 0 ? (
                                        filteredKeys.map(k => <KeyRow key={k.id} apiKey={k} onUpdateStatus={handleUpdateKeyStatus} onDelete={confirmDeleteKey} />)
                                    ) : (
                                        <tr><td colSpan={5} className="text-center p-6 text-slate-500">ยังไม่มีการสร้างคีย์ทั่วไป</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="สร้างคีย์สำเร็จ">
                <div>
                    <p className="text-slate-600 mb-4">คัดลอกคีย์ด้านล่างนี้ คีย์จะแสดงเพียงครั้งเดียวเท่านั้น</p>
                    <div className="bg-slate-100 p-4 rounded-lg font-mono text-blue-600 break-all border border-slate-200">
                        {generatedKey}
                    </div>
                     <div className="flex justify-end mt-6">
                        <Button onClick={handleModalCopy}>คัดลอกไปยังคลิปบอร์ด</Button>
                    </div>
                </div>
            </Modal>
             <Modal isOpen={isConfirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)} title="ยืนยันการลบ">
                 <div>
                    <p className="text-slate-600 mb-4">คุณแน่ใจหรือไม่ว่าต้องการลบคีย์ <strong className="font-semibold text-slate-800 font-mono">{keyToDelete?.key}</strong>? การกระทำนี้ไม่สามารถย้อนกลับได้</p>
                    <div className="flex justify-end gap-3 mt-6">
                        <Button variant="secondary" onClick={() => setConfirmDeleteOpen(false)}>ยกเลิก</Button>
                        <Button variant="danger" onClick={handleDeleteKey}>ยืนยันการลบ</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default GenerateKeyPage;