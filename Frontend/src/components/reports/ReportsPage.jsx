import React, { useState } from 'react';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import { FileBarChart, Download, Calendar, Filter } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';

// Mock data datasets
const monthlyAdmissions = [
  { name: 'Jan', Outpatient: 45, Inpatient: 25 },
  { name: 'Feb', Outpatient: 55, Inpatient: 35 },
  { name: 'Mar', Outpatient: 65, Inpatient: 40 },
  { name: 'Apr', Outpatient: 50, Inpatient: 30 },
  { name: 'May', Outpatient: 80, Inpatient: 45 },
  { name: 'Jun', Outpatient: 95, Inpatient: 60 },
  { name: 'Jul', Outpatient: 110, Inpatient: 75 },
  { name: 'Aug', Outpatient: 125, Inpatient: 80 }
];

const departmentPerformance = [
  { name: 'Cardiology', Patients: 18, ConsultationHrs: 45 },
  { name: 'Pediatrics', Patients: 25, ConsultationHrs: 38 },
  { name: 'Orthopedics', Patients: 15, ConsultationHrs: 32 },
  { name: 'Neurology', Patients: 10, ConsultationHrs: 28 },
  { name: 'General Surgery', Patients: 12, ConsultationHrs: 55 }
];

const bloodStockReport = [
  { group: 'A+', bags: 18 },
  { group: 'A-', bags: 4 },
  { group: 'B+', bags: 22 },
  { group: 'B-', bags: 6 },
  { group: 'AB+', bags: 12 },
  { group: 'AB-', bags: 2 },
  { group: 'O+', bags: 35 },
  { group: 'O-', bags: 3 }
];

export const ReportsPage = () => {
  const [dateRange, setDateRange] = useState('month');

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Hospital Analytics & Reports</h2>
          <p className="text-xs text-slate-500">Track operations performance, outpatient flows, and financial collections</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon={Calendar}>
            Export PDF Report
          </Button>
          <Button variant="primary" size="sm" icon={Download}>
            Download CSV Log
          </Button>
        </div>
      </div>

      {/* Grid: Admissions Area Chart & Dept performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Monthly Patient Admissions" subtitle="Comparison of Inpatient admissions vs Outpatient consultation flows">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyAdmissions} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="outpatientColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="inpatientColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: '#e2e8f0' }} />
                <Legend wrapperStyle={{ fontSize: 11, pt: 10 }} />
                <Area type="monotone" dataKey="Outpatient" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#outpatientColor)" />
                <Area type="monotone" dataKey="Inpatient" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#inpatientColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Clinical Department Load Metrics" subtitle="Weekly patients count and total surgeon/doctor consultation hours">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentPerformance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: '#e2e8f0' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Patients" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Patients Treated" />
                <Bar dataKey="ConsultationHrs" fill="#10B981" radius={[4, 4, 0, 0]} name="Consultation Hours" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Blood bank report */}
      <Card title="Blood Bank Reserves Audit" subtitle="Audit bags quantity remaining in reserves repository">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bloodStockReport} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="group" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: '#e2e8f0' }} />
              <Bar dataKey="bags" fill="#EF4444" radius={[4, 4, 0, 0]} name="Bags Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};

export default ReportsPage;
