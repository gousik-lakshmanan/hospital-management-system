import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Calendar, Bed, Stethoscope, HeartHandshake, Pill, Droplet, IndianRupee, ArrowRight, UserPlus, ShieldAlert, PlusCircle, CheckCircle, Clock } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { mockActivities } from '../../data/mockData';
import { useRooms } from '../../context/RoomContext';
import { useBloodBank } from '../../context/BloodBankContext';
import BloodRequestStatusBadge from '../../components/bloodbank/BloodRequestStatusBadge';

// Chart mock data
const admissionData = [
  { name: 'Mon', Admissions: 4 },
  { name: 'Tue', Admissions: 6 },
  { name: 'Wed', Admissions: 8 },
  { name: 'Thu', Admissions: 5 },
  { name: 'Fri', Admissions: 9 },
  { name: 'Sat', Admissions: 7 },
  { name: 'Sun', Admissions: 6 }
];

const revenueData = [
  { name: 'Aug 21', Revenue: 15000 },
  { name: 'Aug 22', Revenue: 22000 },
  { name: 'Aug 23', Revenue: 18000 },
  { name: 'Aug 24', Revenue: 31000 },
  { name: 'Aug 25', Revenue: 28000 },
  { name: 'Aug 26', Revenue: 35000 },
  { name: 'Aug 27', Revenue: 42750 }
];

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { totalBeds, occupiedBeds, availableBeds } = useRooms();
  const { bloodRequests } = useBloodBank();
  const [activities, setActivities] = useState(mockActivities);

  const pendingRequests = bloodRequests.filter((r) => r.status === 'Pending' || r.status === 'pending');
  const recentRequests = bloodRequests.slice(0, 3);

  const bedOccupancyData = [
    { name: 'Occupied', value: occupiedBeds, color: '#EF4444' },
    { name: 'Available', value: availableBeds, color: '#10B981' }
  ];

  const stats = [
    { label: 'Total Patients', value: '5', change: '+2 new', icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: "Today's Appointments", value: '4', change: '1 pending', icon: Calendar, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Available Beds', value: availableBeds.toString(), change: `out of ${totalBeds}`, icon: Bed, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Occupied Beds', value: occupiedBeds.toString(), change: `${Math.round((occupiedBeds / (totalBeds || 1)) * 100)}% occupancy`, icon: Bed, color: 'text-rose-600 bg-rose-50' },
    { label: 'Doctors on Duty', value: '4', change: '1 off-duty', icon: Stethoscope, color: 'text-teal-600 bg-teal-50' },
    { label: 'Nurses on Duty', value: '3', change: '1 off-duty', icon: HeartHandshake, color: 'text-amber-600 bg-amber-50' },
    { label: 'Pharmacy Alerts', value: '2', change: 'low/out stock', icon: Pill, color: 'text-pink-600 bg-pink-50' },
    {
      label: 'Blood Requests',
      value: `${pendingRequests.length} Pending`,
      change: `${bloodRequests.length} total requests`,
      icon: Droplet,
      color: 'text-rose-600 bg-rose-50'
    },
    { label: "Today's Revenue", value: '₹42,750', change: '+18% vs yesterday', icon: IndianRupee, color: 'text-green-600 bg-green-50' }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Administrator Command Center</h2>
          <p className="text-xs text-blue-100 mt-1">Hospital-wide logistics and statistics for MediSync AI</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="text-xs font-semibold tracking-wider uppercase text-blue-50">System Active</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs flex items-center gap-4">
            <div className={`p-3 rounded-lg shrink-0 ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">{stat.label}</span>
              <span className="text-lg font-bold text-slate-800 block mt-0.5 leading-none">{stat.value}</span>
              <span className="text-[10px] text-slate-400 font-medium block mt-1">{stat.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid: Charts, Blood Requests & Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Patient Admissions" subtitle="Admissions rate this week">
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={admissionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAdmissions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: '#e2e8f0' }} />
                    <Area type="monotone" dataKey="Admissions" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorAdmissions)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card title="Revenue Trends" subtitle="Daily collections (INR)">
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: '#e2e8f0' }} />
                    <Bar dataKey="Revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Blood Requests Widget & Bed Occupancy */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Blood Requests Overview Widget */}
            <Card
              title={
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <Droplet className="w-4 h-4 text-rose-600 fill-rose-600" />
                    <span>Blood Unit Requests</span>
                  </div>
                  {pendingRequests.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      {pendingRequests.length} Pending
                    </span>
                  )}
                </div>
              }
              subtitle="Recent requests from clinical staff and patients"
            >
              <div className="space-y-3">
                {recentRequests.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    No blood unit requests recorded yet.
                  </div>
                ) : (
                  recentRequests.map((req) => (
                    <div
                      key={req.id || req._id}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800 truncate">{req.requesterName}</span>
                          <span className="text-[10px] text-slate-400 capitalize">({req.requesterRole})</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 text-[11px] mt-0.5">
                          <span className="font-bold text-rose-600">{req.bloodGroup}</span>
                          <span>•</span>
                          <span>{req.requestedUnits} Units</span>
                        </div>
                      </div>

                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <BloodRequestStatusBadge status={req.status} />
                      </div>
                    </div>
                  ))
                )}

                <button
                  type="button"
                  onClick={() => navigate('/admin/blood-bank')}
                  className="w-full mt-2 py-2 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>View All Requests in Blood Bank</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </Card>

            {/* Bed status doughnut */}
            <Card title="Bed Occupancy" subtitle="Hospital bed distribution">
              <div className="h-44 flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={bedOccupancyData} innerRadius={45} outerRadius={60} paddingAngle={3} dataKey="value">
                      {bedOccupancyData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-3 flex-wrap mt-2">
                {bedOccupancyData.map((b, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: b.color }} />
                    {b.name} ({b.value})
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Quick Actions Panel */}
          <Card title="Quick Actions Panel" subtitle="Hospital administration shortcuts">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <button
                onClick={() => navigate('/admin/patients')}
                className="p-3 border border-slate-200 rounded-xl hover:bg-slate-50 text-left transition-colors cursor-pointer group"
              >
                <UserPlus className="w-5 h-5 text-blue-600 mb-2 group-hover:scale-105 transition-transform" />
                <span className="font-semibold text-xs text-slate-800 block">Register Patient</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Admit new clinical record</span>
              </button>
              <button
                onClick={() => navigate('/admin/doctors')}
                className="p-3 border border-slate-200 rounded-xl hover:bg-slate-50 text-left transition-colors cursor-pointer group"
              >
                <PlusCircle className="w-5 h-5 text-indigo-600 mb-2 group-hover:scale-105 transition-transform" />
                <span className="font-semibold text-xs text-slate-800 block">Add Doctor</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Register practitioner</span>
              </button>
              <button
                onClick={() => navigate('/admin/nurses')}
                className="p-3 border border-slate-200 rounded-xl hover:bg-slate-50 text-left transition-colors cursor-pointer group"
              >
                <PlusCircle className="w-5 h-5 text-teal-600 mb-2 group-hover:scale-105 transition-transform" />
                <span className="font-semibold text-xs text-slate-800 block">Add Nurse</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Register nursing staff</span>
              </button>
              <button
                onClick={() => navigate('/admin/rooms')}
                className="p-3 border border-slate-200 rounded-xl hover:bg-slate-50 text-left transition-colors cursor-pointer group"
              >
                <Bed className="w-5 h-5 text-rose-600 mb-2 group-hover:scale-105 transition-transform" />
                <span className="font-semibold text-xs text-slate-800 block">Allocate Bed</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Assign room resources</span>
              </button>
              <button
                onClick={() => navigate('/admin/appointments')}
                className="p-3 border border-slate-200 rounded-xl hover:bg-slate-50 text-left transition-colors cursor-pointer group"
              >
                <Calendar className="w-5 h-5 text-amber-600 mb-2 group-hover:scale-105 transition-transform" />
                <span className="font-semibold text-xs text-slate-800 block">View Bookings</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Manage patient queues</span>
              </button>
              <button
                onClick={() => navigate('/admin/blood-bank')}
                className="p-3 border border-slate-200 rounded-xl hover:bg-slate-50 text-left transition-colors cursor-pointer group"
              >
                <Droplet className="w-5 h-5 text-red-600 mb-2 group-hover:scale-105 transition-transform" />
                <span className="font-semibold text-xs text-slate-800 block">Blood Bank</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Manage units & requests</span>
              </button>
            </div>
          </Card>
        </div>

        {/* Activity log sidebar */}
        <Card title="Recent Activity" subtitle="Realtime log updates" className="h-full">
          <div className="flow-root">
            <ul className="-mb-8">
              {activities.map((activity, actIdx) => (
                <li key={activity.id}>
                  <div className="relative pb-8">
                    {actIdx !== activities.length - 1 ? (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                          activity.type === 'success' ? 'bg-emerald-50 text-emerald-500' :
                          activity.type === 'warning' ? 'bg-amber-50 text-amber-500' :
                          'bg-blue-50 text-blue-500'
                        }`}>
                          {activity.type === 'success' ? <CheckCircle className="w-4 h-4" /> :
                           activity.type === 'warning' ? <ShieldAlert className="w-4 h-4" /> :
                           <Users className="w-4 h-4" />}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-xs text-slate-600">{activity.text}</p>
                        </div>
                        <div className="text-right text-[10px] whitespace-nowrap text-slate-400">
                          {activity.time}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
