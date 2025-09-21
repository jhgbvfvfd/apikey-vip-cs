import React from 'react';
import { Link } from 'react-router-dom';
import { useData, useSettings } from '../App';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Agent, Platform } from '../types';
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

const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 !pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
            <div className="h-5 w-5 text-slate-400">{icon}</div>
        </CardHeader>
        <CardContent className="!pt-0">
            <div className="text-xl font-bold text-slate-800">{value.toLocaleString()}</div>
            <p className="text-xs text-slate-500">ที่ลงทะเบียนในระบบทั้งหมด</p>
        </CardContent>
    </Card>
);

const RecentItem: React.FC<{ title: string; subtitle: string; linkTo: string }> = ({ title, subtitle, linkTo }) => (
    <Link to={linkTo} className="block hover:bg-slate-50 p-3 rounded-lg transition-colors duration-200">
        <p className="font-semibold text-slate-700">{title}</p>
        <p className="text-sm text-slate-500">{subtitle}</p>
    </Link>
);

const DashboardPage: React.FC = () => {
    const { agents, platforms, bots, applications, loading } = useData();
    const { t } = useSettings();
    
    const recentAgents = [...agents].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
    const recentPlatforms = [...platforms].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 5);


    if (loading) {
        return <div className="text-center p-10">กำลังโหลดข้อมูลแดชบอร์ด...</div>;
    }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="ตัวแทนทั้งหมด" value={agents.length} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-4.598M12 14.25a5.25 5.25 0 100-10.5 5.25 5.25 0 000 10.5z" /></svg>} />
            <StatCard title="แพลตฟอร์มทั้งหมด" value={platforms.length} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-1.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h9.75a2.25 2.25 0 012.25 2.25z" /></svg>} />
            <StatCard title="บอททั้งหมด" value={bots.length} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 22.5l-.648-1.938a3.375 3.375 0 00-2.684-2.684l-1.938-.648 1.938-.648a3.375 3.375 0 002.684-2.684l.648-1.938.648 1.938a3.375 3.375 0 002.684 2.684l1.938.648-1.938.648a3.375 3.375 0 00-2.684 2.684z" /></svg>} />
            <StatCard title="แอพทั้งหมด" value={applications.length} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5h3a1.5 1.5 0 011.5 1.5v.75h1.125A2.625 2.625 0 0118.75 6.375v11.25A2.625 2.625 0 0116.125 20.25H7.875A2.625 2.625 0 015.25 17.625V6.375A2.625 2.625 0 017.875 3.75H9V3a1.5 1.5 0 011.5-1.5zm-1.5 4.5a.75.75 0 00-.75.75v10.5c0 .414.336.75.75.75h6a.75.75 0 00.75-.75V6.75a.75.75 0 00-.75-.75h-6z" /></svg>} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>สถิติการใช้งาน</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <Line
              data={{
                labels: ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.'],
                datasets: [
                  {
                    label: 'การใช้ API',
                    data: [12, 19, 3, 5, 2, 3],
                    borderColor: 'rgb(59,130,246)',
                    backgroundColor: 'rgba(59,130,246,0.3)',
                  },
                ],
              }}
              options={{ responsive: true, maintainAspectRatio: false }}
            />
          </div>
        </CardContent>
      </Card>

       <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader><CardTitle>ตัวแทนล่าสุด</CardTitle></CardHeader>
                <CardContent className="space-y-1 !p-2">
                    {recentAgents.length > 0 ? recentAgents.map(agent => 
                        <RecentItem key={agent.id} title={agent.username} subtitle={`เข้าร่วมเมื่อ ${new Date(agent.createdAt).toLocaleDateString('th-TH')}`} linkTo="/agents" />
                    ) : <p className="text-slate-500 p-3">ยังไม่มีตัวแทน</p>}
                </CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle>แพลตฟอร์มล่าสุด</CardTitle></CardHeader>
                <CardContent className="space-y-1 !p-2">
                     {recentPlatforms.length > 0 ? recentPlatforms.map(platform => 
                        <RecentItem key={platform.id} title={platform.title} subtitle={`ID: ${platform.id}`} linkTo="/platforms" />
                    ) : <p className="text-slate-500 p-3">ยังไม่มีแพลตฟอร์ม</p>}
                </CardContent>
            </Card>
       </div>
    </div>
  );
};

export default DashboardPage;