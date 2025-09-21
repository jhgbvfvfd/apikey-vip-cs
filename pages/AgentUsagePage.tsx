import React from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { useAuth, useData, useSettings } from '../App';
import { Agent } from '../types';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const AgentUsagePage: React.FC = () => {
  const { user } = useAuth();
  const { platforms } = useData();
  const { t } = useSettings();
  const agent = user?.data as Agent;

  const keysByPlatform = agent.keys || {};
  const allKeys = Object.values(keysByPlatform).flat();
  const totalTokens = allKeys.reduce((sum, k) => sum + k.tokens_remaining, 0);
  const totalKeys = allKeys.length;

  const platformUsage = Object.entries(keysByPlatform).map(([platformId, keys]) => {
    const platform = platforms.find(p => p.id === platformId);
    const tokens = keys.reduce((s, k) => s + k.tokens_remaining, 0);
    return {
      id: platformId,
      title: platform?.title || platformId,
      keys: keys.length,
      tokens,
    };
  });

  const creditHistory = agent.creditHistory || [];
  const chartData = {
    labels: creditHistory.map(h => new Date(h.date).toLocaleDateString('th-TH')),
    datasets: [
      {
        label: 'เครดิตคงเหลือ',
        data: creditHistory.map(h => h.balanceAfter),
        borderColor: 'rgb(59,130,246)',
        backgroundColor: 'rgba(59,130,246,0.3)',
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="!pb-2"><CardTitle>เครดิตคงเหลือ</CardTitle></CardHeader>
          <CardContent className="!pt-0"><p className="text-xl font-bold text-blue-600">{agent.credits.toLocaleString()}</p></CardContent>
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
          <CardHeader className="!pb-2"><CardTitle>รายการประวัติเครดิต</CardTitle></CardHeader>
          <CardContent className="!pt-0"><p className="text-xl font-bold text-blue-600">{creditHistory.length}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>การใช้งานตามแพลตฟอร์ม</CardTitle>
        </CardHeader>
        <CardContent>
          {platformUsage.length > 0 ? (
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="pb-2">แพลตฟอร์ม</th>
                  <th className="pb-2">จำนวนคีย์</th>
                  <th className="pb-2">โทเค็นคงเหลือ</th>
                </tr>
              </thead>
              <tbody>
                {platformUsage.map(p => (
                  <tr key={p.id} className="border-t border-slate-200">
                    <td className="py-2">{p.title}</td>
                    <td className="py-2">{p.keys}</td>
                    <td className="py-2">{p.tokens.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-slate-500 text-sm">ยังไม่มีข้อมูลการใช้งาน</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ประวัติเครดิต</CardTitle>
        </CardHeader>
        <CardContent>
          {creditHistory.length > 0 ? (
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="pb-2">วันที่</th>
                  <th className="pb-2">รายการ</th>
                  <th className="pb-2">จำนวน</th>
                  <th className="pb-2">คงเหลือหลังทำรายการ</th>
                </tr>
              </thead>
              <tbody>
                {creditHistory.slice().reverse().map((entry, idx) => (
                  <tr key={idx} className="border-t border-slate-200">
                    <td className="py-2">{new Date(entry.date).toLocaleString('th-TH')}</td>
                    <td className="py-2">{entry.action}</td>
                    <td className="py-2">{entry.amount > 0 ? `+${entry.amount}` : entry.amount}</td>
                    <td className="py-2">{entry.balanceAfter.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-slate-500 text-sm">ไม่มีประวัติเครดิต</p>
          )}
        </CardContent>
      </Card>

      {creditHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>กราฟการใช้เครดิต</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AgentUsagePage;
