import React from 'react';
import { useAuth } from '../App';
import { Agent } from '../types';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
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

const AgentDashboardPage: React.FC = () => {
    const { user } = useAuth();
    const agent = user?.data as Agent;
    const keysByPlatform = agent.keys || {};
    const allKeys = Object.values(keysByPlatform).flat();
    const totalTokens = allKeys.reduce((sum, k) => sum + k.tokens_remaining, 0);
    const totalKeys = allKeys.length;
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
                    <CardHeader className="!pb-2"><CardTitle>แพลตฟอร์มที่ใช้งาน</CardTitle></CardHeader>
                    <CardContent className="!pt-0"><p className="text-xl font-bold text-blue-600">{Object.keys(keysByPlatform).length}</p></CardContent>
                </Card>
            </div>

            {creditHistory.length > 0 && (
                <Card>
                    <CardHeader><CardTitle>กราฟเครดิตคงเหลือ</CardTitle></CardHeader>
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

export default AgentDashboardPage;

