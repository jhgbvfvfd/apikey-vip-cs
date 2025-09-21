import React, { useState } from 'react';
import { useAuth, useSettings } from '../App';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { getAdminPassword, setAdminPassword, updateAgent } from '../services/firebaseService';
import { Agent } from '../types';

const ChangePasswordPage: React.FC = () => {
  const { user, login } = useAuth();
  const { notify, t } = useSettings();
  const agent = user?.role === 'agent' ? (user.data as Agent) : null;

  const [current, setCurrent] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirm) {
      notify('รหัสผ่านใหม่ไม่ตรงกัน', 'error');
      return;
    }
    setLoading(true);
    if (user?.role === 'admin') {
      try {
        const { password: storedAdminPassword } = await getAdminPassword();
        if (current !== storedAdminPassword) {
          notify('รหัสผ่านปัจจุบันไม่ถูกต้อง', 'error');
        } else {
          await setAdminPassword(newPassword);
          notify('เปลี่ยนรหัสผ่านแล้ว');
        }
      } catch (error) {
        console.error('Failed to update admin password:', error);
        notify('ไม่สามารถบันทึกรหัสผ่านใหม่ได้ โปรดลองอีกครั้ง', 'error');
      }
    } else if (agent) {
      if (current !== agent.password) {
        notify('รหัสผ่านปัจจุบันไม่ถูกต้อง', 'error');
      } else {
        const updatedAgent = { ...agent, password: newPassword };
        await updateAgent(updatedAgent);
        await login(agent.username, newPassword, { skipMaintenanceCheck: true });
        notify('เปลี่ยนรหัสผ่านแล้ว');
      }
    }
    setLoading(false);
    setCurrent('');
    setNewPassword('');
    setConfirm('');
  };

  return (
    <div className="space-y-6">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>ตั้งรหัสผ่านใหม่</CardTitle>
        </CardHeader>
        <CardContent>
          {user?.role === 'admin' && (
            <p className="mb-4 text-xs text-slate-500">
              ชื่อผู้ใช้ของผู้ดูแลระบบจะยังคงเป็น <span className="font-semibold text-slate-700">admin</span> ระบบจะจดจำเฉพาะรหัสผ่านใหม่ที่ตั้งในหน้านี้
            </p>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="current"
              label="รหัสผ่านปัจจุบัน"
              type="password"
              value={current}
              onChange={e => setCurrent(e.target.value)}
              required
              disabled={loading}
            />
            <Input
              id="new"
              label="รหัสผ่านใหม่"
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              disabled={loading}
            />
            <Input
              id="confirm"
              label="ยืนยันรหัสผ่านใหม่"
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              disabled={loading}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChangePasswordPage;
