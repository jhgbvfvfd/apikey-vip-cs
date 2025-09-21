import React from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { useData, useSettings } from '../App';

const ReportsPage: React.FC = () => {
  const { agents } = useData();
  const { t } = useSettings();

  const allKeys = agents.flatMap(a => Object.values(a.keys || {}).flat());
  const totalTokens = allKeys.reduce((sum, k) => sum + k.tokens_remaining, 0);
  const totalKeys = allKeys.length;
  const totalCredits = agents.reduce((sum, a) => sum + a.credits, 0);

  const agentUsage = agents.map(a => {
    const keys = Object.values(a.keys || {}).flat();
    const tokens = keys.reduce((s, k) => s + k.tokens_remaining, 0);
    return { id: a.id, username: a.username, credits: a.credits, keys: keys.length, tokens };
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="!pb-2"><CardTitle>จำนวนตัวแทน</CardTitle></CardHeader>
          <CardContent className="!pt-0"><p className="text-xl font-bold text-blue-600">{agents.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="!pb-2"><CardTitle>จำนวนคีย์ทั้งหมด</CardTitle></CardHeader>
          <CardContent className="!pt-0"><p className="text-xl font-bold text-blue-600">{totalKeys}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="!pb-2"><CardTitle>โทเค็นคงเหลือรวม</CardTitle></CardHeader>
          <CardContent className="!pt-0"><p className="text-xl font-bold text-blue-600">{totalTokens.toLocaleString()}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="!pb-2"><CardTitle>เครดิตรวม</CardTitle></CardHeader>
          <CardContent className="!pt-0"><p className="text-xl font-bold text-blue-600">{totalCredits.toLocaleString()}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>การใช้งานตามตัวแทน</CardTitle>
        </CardHeader>
        <CardContent>
          {agentUsage.length > 0 ? (
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="pb-2">ตัวแทน</th>
                  <th className="pb-2">เครดิต</th>
                  <th className="pb-2">จำนวนคีย์</th>
                  <th className="pb-2">โทเค็นคงเหลือ</th>
                </tr>
              </thead>
              <tbody>
                {agentUsage.map(a => (
                  <tr key={a.id} className="border-t border-slate-200">
                    <td className="py-2">{a.username}</td>
                    <td className="py-2">{a.credits.toLocaleString()}</td>
                    <td className="py-2">{a.keys}</td>
                    <td className="py-2">{a.tokens.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-slate-500 text-sm">ยังไม่มีข้อมูลรายงาน</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsPage;
