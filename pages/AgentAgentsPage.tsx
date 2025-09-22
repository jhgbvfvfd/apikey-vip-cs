import React, { useMemo, useState } from 'react';
import { useData, useSettings, useAuth } from '../App';
import { Agent, CreditHistoryEntry } from '../types';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import CountdownDisplay from '../components/ui/CountdownDisplay';
import { addAgent, updateAgent, deleteAgent, setAgentBanState } from '../services/firebaseService';
import { formatCredits, hasUnlimitedCredits } from '../utils/credits';

const MAX_CREDIT_TRANSFER = 1_000_000;

const AgentAgentsPage: React.FC = () => {
  const { agents, refreshData } = useData();
  const { user, updateUserData } = useAuth();
  const { notify, t } = useSettings();
  const parent = user?.data as Agent;
  const parentUnlimited = hasUnlimitedCredits(parent);
  const myAgents = agents.filter(a => a.parentId === parent.id);

  const [isAddModal, setAddModal] = useState(false);
  const [newAgent, setNewAgent] = useState({ username: '', password: '', credits: 100, expiresAt: '' });
  const [selected, setSelected] = useState<Agent | null>(null);
  const [creditsToAdd, setCreditsToAdd] = useState(100);
  const [isCreditModal, setCreditModal] = useState(false);
  const minExpirationValue = useMemo(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const initialCredits = Number(newAgent.credits);
    let expiresAtIso: string | undefined;
    if (!Number.isFinite(initialCredits) || initialCredits <= 0) {
      notify('กรุณากรอกเครดิตเริ่มต้นมากกว่า 0', 'error');
      return;
    }
    if (initialCredits > MAX_CREDIT_TRANSFER) {
      notify(`โอนเครดิตได้ไม่เกิน ${MAX_CREDIT_TRANSFER.toLocaleString('th-TH')} ต่อครั้ง`, 'error');
      return;
    }
    if (!parentUnlimited && parent.credits < initialCredits) {
      notify('เครดิตไม่พอ', 'error');
      return;
    }
    if (newAgent.expiresAt) {
      const expiresAtDate = new Date(newAgent.expiresAt);
      if (Number.isNaN(expiresAtDate.getTime())) {
        notify('กรุณาเลือกวันและเวลาหมดอายุที่ถูกต้อง', 'error');
        return;
      }
      if (expiresAtDate.getTime() <= Date.now()) {
        notify('วันหมดอายุต้องอยู่ในอนาคต', 'error');
        return;
      }
      expiresAtIso = expiresAtDate.toISOString();
    }
    const confirmMessage = parentUnlimited
      ? 'ยืนยันสร้างตัวแทนนี้?'
      : `ยืนยันสร้างตัวแทนนี้และหักเครดิต ${initialCredits}?`;
    if (!window.confirm(confirmMessage)) return;
    const newId = `agent-${Date.now().toString(36)}`;
    const now = new Date().toISOString();
    const childHistory: CreditHistoryEntry[] = [
      {
        date: now,
        action: 'เครดิตเริ่มต้น',
        amount: initialCredits,
        balanceAfter: initialCredits,
      },
    ];
    const parentBalance = parentUnlimited ? parent.credits : parent.credits - initialCredits;
    const parentHistory: CreditHistoryEntry = {
      date: now,
      action: `โอนให้ ${newAgent.username}`,
      amount: parentUnlimited ? 0 : -initialCredits,
      balanceAfter: parentBalance,
    };
    await addAgent({
      id: newId,
      username: newAgent.username,
      password: newAgent.password,
      credits: initialCredits,
      unlimitedCredits: false,
      createdAt: now,
      keys: {},
      creditHistory: childHistory,
      status: 'active',
      parentId: parent.id,
      welcomeAcknowledged: false,
      expiresAt: expiresAtIso,
    });
    const updatedParent: Agent = {
      ...parent,
      credits: parentBalance,
      creditHistory: [...(parent.creditHistory || []), parentHistory],
    };
    await updateAgent(updatedParent);
    updateUserData(updatedParent);
    refreshData();
    setAddModal(false);
    setNewAgent({ username: '', password: '', credits: 100, expiresAt: '' });
    notify('สร้างตัวแทนแล้ว');
  };

  const openAddCredits = (agent: Agent) => {
    if (hasUnlimitedCredits(agent)) {
      notify('บัญชีนี้ใช้เครดิตไม่จำกัดอยู่แล้ว');
      return;
    }
    setSelected(agent);
    setCreditsToAdd(Math.min(100, MAX_CREDIT_TRANSFER));
    setCreditModal(true);
  };

  const handleAddCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    if (hasUnlimitedCredits(selected)) {
      notify('บัญชีนี้ใช้เครดิตไม่จำกัด ไม่ต้องเติม');
      setCreditModal(false);
      return;
    }
    if (!Number.isFinite(creditsToAdd) || creditsToAdd <= 0) {
      notify('กรุณาระบุจำนวนเครดิตมากกว่า 0', 'error');
      return;
    }
    if (creditsToAdd > MAX_CREDIT_TRANSFER) {
      notify(`โอนเครดิตได้ไม่เกิน ${MAX_CREDIT_TRANSFER.toLocaleString('th-TH')} ต่อครั้ง`, 'error');
      return;
    }
    if (!parentUnlimited && parent.credits < creditsToAdd) {
      notify('เครดิตไม่พอ', 'error');
      return;
    }
    if (!window.confirm(`หักเครดิต ${creditsToAdd} เพื่อเติมให้ ${selected.username}?`)) return;
    const now = new Date().toISOString();
    const childBalance = selected.credits + creditsToAdd;
    const parentBalance = parentUnlimited ? parent.credits : parent.credits - creditsToAdd;
    const childHistory: CreditHistoryEntry = {
      date: now,
      action: 'รับเครดิตจากตัวแทน',
      amount: creditsToAdd,
      balanceAfter: childBalance,
    };
    const parentHistory: CreditHistoryEntry = {
      date: now,
      action: `โอนให้ ${selected.username}`,
      amount: parentUnlimited ? 0 : -creditsToAdd,
      balanceAfter: parentUnlimited ? parent.credits : parentBalance,
    };
    const updatedChild: Agent = {
      ...selected,
      credits: childBalance,
      creditHistory: [...(selected.creditHistory || []), childHistory],
    };
    const updatedParent: Agent = {
      ...parent,
      credits: parentBalance,
      creditHistory: [...(parent.creditHistory || []), parentHistory],
    };
    await updateAgent(updatedChild);
    await updateAgent(updatedParent);
    updateUserData(updatedParent);
    refreshData();
    setCreditModal(false);
    notify('เติมเครดิตสำเร็จ');
  };

  const handleBan = async (agent: Agent) => {
    const targetBanState = agent.status !== 'banned';
    try {
      await setAgentBanState(agent.id, targetBanState);
      refreshData();
      notify(targetBanState ? 'แบนตัวแทนแล้ว' : 'ปลดแบนแล้ว');
    } catch (error) {
      console.error('Failed to update downstream agent ban state:', error);
      notify('ไม่สามารถอัปเดตสถานะการแบนได้', 'error');
    }
  };

  const handleDelete = async (agent: Agent) => {
    if (!window.confirm('แน่ใจหรือไม่ว่าต้องการลบตัวแทนนี้?')) return;
    await deleteAgent(agent.id);
    refreshData();
    notify('ลบตัวแทนแล้ว');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{t('agents')}</h2>
        <Button onClick={() => setAddModal(true)}>{t('add')}</Button>
      </div>
      {myAgents.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {myAgents.map(a => {
            const unlimited = hasUnlimitedCredits(a);
            return (
              <Card key={a.id}>
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <CardTitle className={`${a.status === 'banned' ? 'text-red-600' : ''} break-words`}>{a.username}</CardTitle>
                    <p className="mt-1 text-xs font-mono text-slate-400 break-all">{a.id}</p>
                  </div>
                  <div className="min-w-0 text-left sm:text-right">
                    <p className="text-lg font-bold leading-tight text-blue-600 break-words sm:text-xl">{formatCredits(a)}</p>
                    <p className="text-xs text-slate-500 sm:whitespace-nowrap">เครดิต</p>
                    {unlimited && (
                      <span className="mt-1 inline-flex items-center justify-end rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
                        ไม่จำกัดเครดิต
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {a.expiresAt ? (
                    <CountdownDisplay
                      target={a.expiresAt}
                      className="mb-3"
                      title="บัญชีหมดอายุใน"
                      expiredLabel="บัญชีนี้หมดอายุแล้ว ระบบจะลบให้อัตโนมัติ"
                      accentLabel="ลบอัตโนมัติ"
                    />
                  ) : (
                    <div className="mb-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
                      ยังไม่ได้ตั้งวันหมดอายุสำหรับบัญชีนี้
                    </div>
                  )}
                  <div className="flex gap-2 mb-2">
                    <Button size="sm" onClick={() => openAddCredits(a)} className="flex-1" disabled={unlimited}>เติมเครดิต</Button>
                    <Button size="sm" variant={a.status === 'banned' ? 'secondary' : 'danger'} onClick={() => handleBan(a)} className="flex-1">{a.status === 'banned' ? 'ปลดแบน' : 'แบน'}</Button>
                  </div>
                  {unlimited && <p className="text-xs text-slate-500 mb-2">บัญชีนี้เปิดใช้งานแบบไม่จำกัดเครดิต</p>}
                  <Button size="sm" variant="danger" onClick={() => handleDelete(a)} className="w-full">ลบ</Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <p className="text-center text-slate-500">{t('noAgents')}</p>
      )}

      <Modal isOpen={isAddModal} onClose={() => setAddModal(false)} title="เพิ่มตัวแทน">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="ชื่อผู้ใช้" value={newAgent.username} onChange={e => setNewAgent({ ...newAgent, username: e.target.value })} required />
          <Input label="รหัสผ่าน" type="password" value={newAgent.password} onChange={e => setNewAgent({ ...newAgent, password: e.target.value })} required />
          <Input
            label="เครดิตเริ่มต้น"
            type="number"
            value={newAgent.credits}
            min={0}
            max={MAX_CREDIT_TRANSFER}
            required
            onChange={e => {
              const value = Number(e.target.value);
              setNewAgent({
                ...newAgent,
                credits: Math.max(0, Math.min(MAX_CREDIT_TRANSFER, Number.isFinite(value) ? value : 0)),
              });
            }}
          />
          <p className="-mt-2 text-xs text-slate-500">บัญชีตัวแทนจะใช้งานแบบจำกัดเครดิต หากต้องการเปิดไม่จำกัดให้ติดต่อผู้ดูแลระบบ</p>
          <Input
            label="วันและเวลาหมดอายุ"
            type="datetime-local"
            value={newAgent.expiresAt}
            min={minExpirationValue}
            onChange={e => setNewAgent({ ...newAgent, expiresAt: e.target.value })}
          />
          <p className="-mt-2 text-xs text-slate-500">ระบบจะลบตัวแทนนี้ให้อัตโนมัติเมื่อครบกำหนด</p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setAddModal(false)}>ยกเลิก</Button>
            <Button type="submit">บันทึก</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isCreditModal} onClose={() => setCreditModal(false)} title="เติมเครดิต">
        <form onSubmit={handleAddCredits} className="space-y-4">
          <Input
            label="จำนวนเครดิต"
            type="number"
            value={creditsToAdd}
            min={0}
            max={MAX_CREDIT_TRANSFER}
            onChange={e => {
              const value = Number(e.target.value);
              setCreditsToAdd(Math.max(0, Math.min(MAX_CREDIT_TRANSFER, Number.isFinite(value) ? value : 0)));
            }}
            required
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setCreditModal(false)}>ยกเลิก</Button>
            <Button type="submit">เติม</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AgentAgentsPage;

