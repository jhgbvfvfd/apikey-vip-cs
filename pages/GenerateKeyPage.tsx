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
import LoadingState from '../components/ui/LoadingState';
import {
    ClipboardIcon,
    CheckIcon,
    PauseIcon,
    PlayIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';

type CreatedKeyPreview = Pick<StandaloneKey, 'key' | 'usageMode' | 'tokens_remaining' | 'expiresAt' | 'durationDays'>;

const KeyRow: React.FC<{
    apiKey: StandaloneKey;
    onUpdateStatus: (key: StandaloneKey, status: 'active' | 'inactive') => void;
    onDelete: (key: StandaloneKey) => void;
}> = ({ apiKey, onUpdateStatus, onDelete }) => {
    const [copied, setCopied] = useState(false);
    const { notify, t } = useSettings();
    const usageMode: 'token' | 'duration' = apiKey.usageMode === 'duration' ? 'duration' : 'token';
    const expiresAtDate = apiKey.expiresAt ? new Date(apiKey.expiresAt) : null;
    const isExpired = usageMode === 'duration' && expiresAtDate !== null && expiresAtDate.getTime() <= Date.now();

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
        if (isExpired) {
            notify('คีย์หมดอายุแล้ว ไม่สามารถเปลี่ยนสถานะได้', 'error');
            return;
        }
        const newStatus = apiKey.status === 'active' ? 'inactive' : 'active';
        onUpdateStatus(apiKey, newStatus);
    };

    const handleDelete = () => {
        onDelete(apiKey);
    };

    return (
        <tr className="border-b border-slate-200 last:border-b-0 odd:bg-white even:bg-slate-50 hover:bg-slate-100">
            <td className="p-2 font-mono text-xs sm:text-sm text-blue-600 break-all">{apiKey.key}</td>
            <td className="p-2 text-xs sm:text-sm text-slate-600 whitespace-nowrap">
                {usageMode === 'token' ? (
                    <span className="font-medium text-slate-700">{apiKey.tokens_remaining.toLocaleString()} โทเค็น</span>
                ) : (
                    <div className="flex flex-col">
                        <span className="font-medium text-slate-700">{typeof apiKey.durationDays === 'number' ? apiKey.durationDays.toLocaleString() : '-'} วัน</span>
                        {apiKey.expiresAt && (
                            <span className="text-[11px] text-slate-500">หมดอายุ {new Date(apiKey.expiresAt).toLocaleDateString('th-TH')}</span>
                        )}
                        {isExpired && <span className="text-[11px] text-red-500">หมดอายุแล้ว</span>}
                    </div>
                )}
            </td>
            <td className="p-2 whitespace-nowrap">
                {(() => {
                    let label = t('statusActive' as any);
                    let statusColor = 'bg-green-100 text-green-800';
                    let dotColor = 'text-green-400';

                    if (isExpired) {
                        label = 'หมดอายุ';
                        statusColor = 'bg-orange-100 text-orange-800';
                        dotColor = 'text-orange-400';
                    } else if (usageMode === 'token' && apiKey.tokens_remaining <= 0) {
                        label = t('statusNoTokens' as any);
                        statusColor = 'bg-red-100 text-red-800';
                        dotColor = 'text-red-400';
                    } else if (apiKey.status !== 'active') {
                        label = t('statusInactive' as any);
                        statusColor = 'bg-slate-100 text-slate-800';
                        dotColor = 'text-slate-400';
                    }

                    return (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                            <svg className={`mr-1.5 h-2 w-2 ${dotColor}`} fill="currentColor" viewBox="0 0 8 8">
                                <circle cx={4} cy={4} r={3} />
                            </svg>
                            {label}
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
                        className={`p-1.5 rounded-md hover:bg-slate-200 text-slate-500 hover:text-slate-700 ${isExpired ? 'opacity-50 cursor-not-allowed hover:bg-transparent hover:text-slate-500' : ''}`}
                        title={isExpired ? 'คีย์หมดอายุแล้ว' : apiKey.status === 'active' ? 'ระงับคีย์' : 'เปิดใช้งาน'}
                        disabled={isExpired}
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
    const [createdKeys, setCreatedKeys] = useState<CreatedKeyPreview[]>([]);
    const [selectedPlatformId, setSelectedPlatformId] = useState(platforms[0]?.id || '');
    const [activeMenu, setActiveMenu] = useState<'create' | 'manage'>('create');
    const MIN_TOKENS = 1;
    const MAX_TOKENS = 1000;
    const MIN_DAYS = 1;
    const MAX_DAYS = 30;
    const MIN_KEYS = 1;
    const MAX_KEYS = 30;
    const [usageMode, setUsageMode] = useState<'token' | 'duration'>('token');
    const [tokens, setTokens] = useState(100);
    const [durationDays, setDurationDays] = useState(7);
    const [quantity, setQuantity] = useState(1);
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

        if (!Number.isFinite(quantity) || !Number.isInteger(quantity) || quantity < MIN_KEYS || quantity > MAX_KEYS) {
            setError(`สร้างได้ครั้งละ ${MIN_KEYS}-${MAX_KEYS} คีย์`);
            return;
        }

        const cost = Number(tokens);
        if (usageMode === 'token') {
            if (!Number.isFinite(cost) || !Number.isInteger(cost) || cost < MIN_TOKENS || cost > MAX_TOKENS) {
                setError(`กำหนดโทเค็นได้ระหว่าง ${MIN_TOKENS} - ${MAX_TOKENS}`);
                return;
            }
        } else {
            if (!Number.isFinite(durationDays) || !Number.isInteger(durationDays) || durationDays < MIN_DAYS || durationDays > MAX_DAYS) {
                setError(`กำหนดวันได้ระหว่าง ${MIN_DAYS}-${MAX_DAYS}`);
                return;
            }
        }

        try {
            const totalCreated = quantity;
            const selectedTokenCost = cost;
            const selectedDuration = durationDays;
            const timestamp = Date.now();
            const creationDate = new Date();
            const createdAt = creationDate.toISOString();
            const expiryBase = creationDate.getTime();
            const keysToCreate: (Omit<StandaloneKey, 'id'> & { id: string })[] = Array.from({ length: totalCreated }, (_, index) => {
                const keyString = generateKey(platform.prefix, platform.pattern);
                const expiresAt = usageMode === 'duration'
                    ? new Date(expiryBase + (selectedDuration || MIN_DAYS) * 24 * 60 * 60 * 1000).toISOString()
                    : undefined;
                return {
                    id: `key_${timestamp}_${index}_${Math.random().toString(36).slice(2, 8)}`,
                    key: keyString,
                    tokens_remaining: usageMode === 'token' ? selectedTokenCost : 0,
                    status: 'active',
                    createdAt,
                    platformId: platform.id,
                    platformTitle: platform.title,
                    usageMode,
                    expiresAt,
                    durationDays: usageMode === 'duration' ? selectedDuration : undefined,
                };
            });

            await Promise.all(keysToCreate.map(key => addStandaloneKey(key)));
            refreshData();
            setCreatedKeys(keysToCreate.map(({ key, usageMode: mode, tokens_remaining, expiresAt, durationDays }) => ({
                key,
                usageMode: mode,
                tokens_remaining,
                expiresAt,
                durationDays,
            })));
            setIsModalOpen(true);
            setActiveMenu('manage');
            notify(`สร้างคีย์ ${totalCreated.toLocaleString()} รายการเรียบร้อย`);
            if (usageMode === 'token') {
                setTokens(selectedTokenCost);
            }
            if (usageMode === 'duration') {
                setDurationDays(selectedDuration);
            }
            setQuantity(1);
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
        if (createdKeys.length === 0) return;
        try {
            await navigator.clipboard.writeText(createdKeys.map(k => k.key).join('\n'));
            notify(t('copySuccess'));
        } catch (err) {
            notify(t('copyFailed'), 'error');
        }
    };

    const handleCopySingle = async (value: string) => {
        try {
            await navigator.clipboard.writeText(value);
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
                                    <div className="space-y-2">
                                        <p className="text-xs uppercase tracking-[0.3em] text-blue-500 font-semibold">รูปแบบการจำกัด</p>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition-colors ${usageMode === 'token' ? 'border-blue-500 bg-blue-50/70 shadow-sm' : 'border-slate-200 hover:border-slate-300'}`}>
                                                <input
                                                    type="radio"
                                                    name="usageMode"
                                                    value="token"
                                                    checked={usageMode === 'token'}
                                                    onChange={() => setUsageMode('token')}
                                                    className="mt-1 h-4 w-4"
                                                />
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-800">คิดตามโทเค็น</p>
                                                    <p className="text-xs text-slate-500">เหมาะสำหรับการจำกัดปริมาณการใช้งานตามเครดิต</p>
                                                </div>
                                            </label>
                                            <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition-colors ${usageMode === 'duration' ? 'border-blue-500 bg-blue-50/70 shadow-sm' : 'border-slate-200 hover:border-slate-300'}`}>
                                                <input
                                                    type="radio"
                                                    name="usageMode"
                                                    value="duration"
                                                    checked={usageMode === 'duration'}
                                                    onChange={() => setUsageMode('duration')}
                                                    className="mt-1 h-4 w-4"
                                                />
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-800">จำกัดตามวัน</p>
                                                    <p className="text-xs text-slate-500">ใช้งานได้ตามจำนวนวันที่กำหนด สูงสุด {MAX_DAYS} วัน</p>
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                    {usageMode === 'token' ? (
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
                                    ) : (
                                        <div className="space-y-1">
                                            <Input
                                                label="จำนวนวันใช้งาน"
                                                type="number"
                                                min={MIN_DAYS}
                                                max={MAX_DAYS}
                                                step={1}
                                                value={durationDays}
                                                onChange={e => setDurationDays(Number(e.target.value))}
                                                required
                                            />
                                            <p className="text-xs text-slate-500">กำหนดได้ระหว่าง {MIN_DAYS} - {MAX_DAYS} วันต่อคีย์</p>
                                        </div>
                                    )}

                                    <div className="space-y-1">
                                        <Input
                                            label="จำนวนคีย์ที่ต้องการสร้าง"
                                            type="number"
                                            min={MIN_KEYS}
                                            max={MAX_KEYS}
                                            step={1}
                                            value={quantity}
                                            onChange={e => setQuantity(Number(e.target.value))}
                                            required
                                        />
                                        <p className="text-xs text-slate-500">สร้างได้ครั้งละ {MIN_KEYS} - {MAX_KEYS} คีย์</p>
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
                                        <th className="w-32 p-2 text-xs font-semibold sm:text-sm">การจำกัด</th>
                                        <th className="w-24 p-2 text-xs font-semibold sm:text-sm">สถานะ</th>
                                        <th className="w-28 p-2 text-xs font-semibold sm:text-sm">วันที่สร้าง</th>
                                        <th className="p-2 text-center text-xs font-semibold sm:text-sm">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="p-6">
                                                <LoadingState
                                                    compact
                                                    label="กำลังโหลดคีย์"
                                                    helperText="กำลังรวบรวมรายการคีย์ที่มีอยู่"
                                                    className="mx-auto max-w-xs"
                                                />
                                            </td>
                                        </tr>
                                    ) : filteredKeys.length > 0 ? (
                                        filteredKeys.map(k => (
                                            <KeyRow
                                                key={k.id}
                                                apiKey={k}
                                                onUpdateStatus={handleUpdateKeyStatus}
                                                onDelete={confirmDeleteKey}
                                            />
                                        ))
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
                <div className="space-y-4">
                    <p className="text-slate-600">คัดลอกคีย์ด้านล่างนี้ คีย์จะแสดงเพียงครั้งเดียวเท่านั้น</p>
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                        {createdKeys.map((info, index) => {
                            const durationText = typeof info.durationDays === 'number'
                                ? info.durationDays.toLocaleString()
                                : '-';
                            const usageLabel = info.usageMode === 'duration'
                                ? `ใช้งานได้ ${durationText} วัน`
                                : `โทเค็น ${info.tokens_remaining.toLocaleString()}`;
                            const expiresLabel = info.usageMode === 'duration' && info.expiresAt
                                ? `หมดอายุ ${new Date(info.expiresAt).toLocaleDateString('th-TH')}`
                                : null;
                            return (
                                <div
                                    key={`${info.key}-${index}`}
                                    className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm"
                                >
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                            <p className="font-mono text-sm sm:text-base font-medium text-blue-600 break-all">
                                                {info.key}
                                            </p>
                                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                                                <span>{usageLabel}</span>
                                                {expiresLabel && <span>{expiresLabel}</span>}
                                            </div>
                                        </div>
                                        <Button type="button" variant="secondary" onClick={() => handleCopySingle(info.key)}>
                                            คัดลอก
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                            ปิด
                        </Button>
                        <Button type="button" onClick={handleModalCopy} disabled={createdKeys.length === 0}>
                            คัดลอกทั้งหมด
                        </Button>
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