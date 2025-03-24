import React from 'react';
import { FaChartLine, FaClipboardList, FaCalendarCheck, FaClock } from 'react-icons/fa';
import StatsCard from '../components/dashboard/StatsCard';
import Chart from '../components/dashboard/Chart';
import Table from '../components/common/Table';
import Card from '../components/common/Card';
import './Dashboard.css';

interface StatData {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: 'up' | 'down';
  trendValue: string;
  color: string;
}

const Dashboard: React.FC = () => {
  const statsData: StatData[] = [
    {
      title: 'Aktywne zlecenia',
      value: '145',
      icon: <FaClipboardList />,
      trend: 'up',
      trendValue: '12%',
      color: 'primary',
    },
    {
      title: 'Zakończone w tym miesiącu',
      value: '83',
      icon: <FaCalendarCheck />,
      trend: 'up',
      trendValue: '8%',
      color: 'success',
    },
    {
      title: 'Średni czas wykonania',
      value: '18 dni',
      icon: <FaClock />,
      trend: 'down',
      trendValue: '5%',
      color: 'warning',
    },
    {
      title: 'Statystyka efektywności',
      value: '87%',
      icon: <FaChartLine />,
      trend: 'up',
      trendValue: '3%',
      color: 'danger',
    },
  ];

  const recentData = [
    { id: 1, name: 'Zlecenie 001', client: 'Jan Kowalski', date: '2025-03-22', status: 'active' },
    { id: 2, name: 'Zlecenie 002', client: 'Anna Nowak', date: '2025-03-20', status: 'completed' },
    { id: 3, name: 'Zlecenie 003', client: 'Piotr Zieliński', date: '2025-03-18', status: 'pending' },
    { id: 4, name: 'Zlecenie 004', client: 'Marta Wiśniewska', date: '2025-03-15', status: 'active' },
    { id: 5, name: 'Zlecenie 005', client: 'Michał Nowicki', date: '2025-03-10', status: 'cancelled' },
  ];

  const columns = [
    { key: 'name', title: 'Nazwa', sortable: true },
    { key: 'client', title: 'Klient', sortable: true },
    {
      key: 'date',
      title: 'Data',
      sortable: true,
      render: (item: any) => new Date(item.date).toLocaleDateString('pl-PL'),
    },
    { key: 'status', title: 'Status', sortable: true },
  ];

  const chartData = {
    labels: ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec'],
    datasets: [
      {
        label: 'Zlecenia',
        data: [65, 59, 80, 81, 56, 90],
        borderColor: '#0d6efd',
        backgroundColor: 'rgba(13, 110, 253, 0.1)',
        fill: true,
      },
      {
        label: 'Skuteczność',
        data: [28, 48, 40, 69, 86, 80],
        borderColor: '#28a745',
        backgroundColor: 'rgba(40, 167, 69, 0.1)',
        fill: true,
      },
    ],
  };

  return (
    <div className="dashboard">
      <h1 className="page-title">Panel główny</h1>

      <div className="stats-grid">
        {statsData.map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            trend={stat.trend}
            trendValue={stat.trendValue}
            color={stat.color}
          />
        ))}
      </div>

      <div className="dashboard-row">
        <Card title="Analityka" className="chart-container" actions={null}>
          <Chart data={chartData} height={300} title="" />
        </Card>
      </div>

      <div className="dashboard-row">
        <Card title="Ostatnie zlecenia" actions={null}>
          <Table
            columns={columns}
            data={recentData}
            onRowClick={(item: any) => console.log('Clicked row:', item)}
          />
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
