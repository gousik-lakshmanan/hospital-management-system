import React, { useState, useEffect } from 'react';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { Download, Calendar, Activity, Pill, Droplet, Users, IndianRupee, Bed } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import reportService from '../../services/reportService';

export const ReportsPage = () => {
  const [dateRange, setDateRange] = useState('month'); // 'week' | 'month' | 'all'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [bloodReport, setBloodReport] = useState([]);
  const [pharmacyReport, setPharmacyReport] = useState(null);
  const [appointmentReport, setAppointmentReport] = useState(null);
  const [financialReport, setFinancialReport] = useState(null);

  const calculateDates = (range) => {
    if (range === 'all') return {};
    const end = new Date();
    const start = new Date();
    if (range === 'week') {
      start.setDate(end.getDate() - 7);
    } else {
      start.setDate(end.getDate() - 30);
    }
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      from: start.toISOString().split('T')[0],
      to: end.toISOString().split('T')[0]
    };
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = calculateDates(dateRange);
      const [sumRes, bloodRes, pharmRes, apptRes, finRes] = await Promise.allSettled([
        reportService.getSummary(params),
        reportService.getBloodBank(),
        reportService.getPharmacyInventory(),
        reportService.getAppointments(params),
        reportService.getFinancial(params)
      ]);

      if (sumRes.status === 'fulfilled' && sumRes.value?.success) {
        setSummaryData(sumRes.value.data);
      }
      if (bloodRes.status === 'fulfilled' && bloodRes.value?.success) {
        const bloodData = bloodRes.value.data;
        setBloodReport(bloodData?.inventory || (Array.isArray(bloodData) ? bloodData : []));
      }
      if (pharmRes.status === 'fulfilled' && pharmRes.value?.success) {
        setPharmacyReport(pharmRes.value.data);
      }
      if (apptRes.status === 'fulfilled' && apptRes.value?.success) {
        setAppointmentReport(apptRes.value.data);
      }
      if (finRes.status === 'fulfilled' && finRes.value?.success) {
        setFinancialReport(finRes.value.data);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
      setError('Unable to fetch live reporting analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  // Transform department load data
  const deptData = appointmentReport?.byDepartment ? Object.entries(appointmentReport.byDepartment).map(([dept, count]) => ({
    name: dept,
    Appointments: count
  })) : [];

  // Transform pharmacy summary
  const pharmacyPieData = pharmacyReport?.summary ? [
    { name: 'In Stock', value: pharmacyReport.summary.inStock, color: '#10B981' },
    { name: 'Low Stock', value: pharmacyReport.summary.lowStock, color: '#F59E0B' },
    { name: 'Out of Stock', value: pharmacyReport.summary.outOfStock, color: '#EF4444' },
    { name: 'Expired', value: pharmacyReport.summary.expired, color: '#6B7280' },
  ].filter(d => d.value > 0) : [];

  // Transform financial daily trends
  const financialTrends = financialReport?.dailyRevenue || [];

  const handleExportCSV = () => {
    const rows = [
      ['Metric Category', 'Key', 'Value'],
      ['Summary', 'Total Patients', String(summaryData?.patients?.total || 0)],
      ['Summary', 'Total Appointments', String(summaryData?.appointments?.total || 0)],
      ['Summary', 'Bed Occupancy %', `${summaryData?.beds?.occupancyRate || 0}%`],
      ['Summary', 'Total Revenue Collected', `₹${summaryData?.billing?.totalPaid || 0}`],
      ['Summary', 'Total Invoiced Amount', `₹${summaryData?.billing?.totalRevenue || 0}`],
      ['Summary', 'Pharmacy Low/Out Stock', String((summaryData?.pharmacy?.lowStock || 0) + (summaryData?.pharmacy?.outOfStock || 0))],
      ['Summary', 'Blood Emergency Shortages', String(summaryData?.bloodBank?.criticalCount || 0)]
    ];

    if (bloodReport && bloodReport.length > 0) {
      bloodReport.forEach(b => {
        rows.push(['Blood Bank', b.bloodGroup, `${b.units} units (${b.status || 'Normal'})`]);
      });
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.map(cell => `"${cell}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `medisync_analytics_report_${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Title & Filter Bar */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Hospital Analytics & Reports</h2>
          <p className="text-xs text-slate-500">Live clinical KPIs, bed occupancy, pharmacy inventory, and revenue analytics</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setDateRange('week')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${dateRange === 'week' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setDateRange('month')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${dateRange === 'month' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setDateRange('all')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${dateRange === 'all' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              All Time
            </button>
          </div>

          <Button variant="primary" size="sm" icon={Download} onClick={handleExportCSV}>
            Download CSV Log
          </Button>
        </div>
      </div>

      {/* Loading Banner */}
      {loading && (
        <div className="bg-blue-50/70 border border-blue-200 text-blue-700 p-3 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-600 animate-ping"></span>
            <span>Fetching live MongoDB hospital aggregations...</span>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && !loading && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl flex items-center justify-between text-xs">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={fetchReports} className="text-xs py-1 px-2.5">
            Retry
          </Button>
        </div>
      )}

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg text-blue-600 bg-blue-50 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Appointments</span>
            <span className="text-lg font-bold text-slate-800 block leading-tight mt-0.5">
              {summaryData?.appointments?.total ?? 0}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              {summaryData?.appointments?.completed ?? 0} completed
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg text-emerald-600 bg-emerald-50 shrink-0">
            <Bed className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Bed Occupancy</span>
            <span className="text-lg font-bold text-slate-800 block leading-tight mt-0.5">
              {summaryData?.beds?.occupancyRate ?? 0}%
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              {summaryData?.beds?.occupied ?? 0} / {summaryData?.beds?.total ?? 0} beds
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg text-green-600 bg-green-50 shrink-0">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Revenue Collected</span>
            <span className="text-lg font-bold text-slate-800 block leading-tight mt-0.5">
              ₹{(summaryData?.billing?.totalPaid ?? 0).toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              ₹{(summaryData?.billing?.totalUnpaid ?? 0).toLocaleString()} outstanding
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg text-rose-600 bg-rose-50 shrink-0">
            <Droplet className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Blood Inventory</span>
            <span className="text-lg font-bold text-slate-800 block leading-tight mt-0.5">
              {summaryData?.bloodBank?.totalUnits ?? 0} Units
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              {summaryData?.bloodBank?.criticalCount ?? 0} critical groups
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Admissions / Department Area Chart & Revenue Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Department Load Breakdown" subtitle="Total appointments distributed across clinical departments">
          <div className="h-72">
            {deptData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No appointment load data found for this range.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" minHeight={250}>
                <BarChart data={deptData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: '#e2e8f0' }} />
                  <Bar dataKey="Appointments" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Appointments" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card title="Financial Collections Trend" subtitle="Daily payment collections breakdown (INR)">
          <div className="h-72">
            {financialTrends.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No revenue transaction records found in this range.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" minHeight={250}>
                <AreaChart data={financialTrends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: '#e2e8f0' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" name="Revenue (₹)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* Blood Bank Reserves & Pharmacy Health Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Blood Bank Reserves Inventory" subtitle="Current available blood units across all 8 blood groups">
            <div className="h-64">
              {bloodReport.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No blood stock data available.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%" minHeight={220}>
                  <BarChart data={bloodReport} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="bloodGroup" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: '#e2e8f0' }} />
                    <Bar dataKey="units" fill="#EF4444" radius={[4, 4, 0, 0]} name="Units (Bags)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>

        <Card title="Pharmacy Stock Health" subtitle="Formulation statuses in dispensary">
          <div className="h-44 flex flex-col items-center justify-center">
            {pharmacyPieData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No medicine records found.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" minHeight={160}>
                <PieChart>
                  <Pie data={pharmacyPieData} innerRadius={45} outerRadius={60} paddingAngle={3} dataKey="value">
                    {pharmacyPieData.map((entry, idx) => (
                      <Cell key={`pharm-cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="flex justify-center gap-3 flex-wrap mt-2">
            {pharmacyPieData.map((p, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                {p.name} ({p.value})
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ReportsPage;
