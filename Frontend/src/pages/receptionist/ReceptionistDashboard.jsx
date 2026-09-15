import React, { useState } from 'react';
import { Calendar, Users, Home, ClipboardPlus, UserCheck, AlertCircle, Plus, Eye, DollarSign } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { mockAppointments, mockPatients, mockVisitors, appointmentService, visitorService, mockDoctors } from '../../data/mockData';
import { useRooms } from '../../context/RoomContext';

export const ReceptionistDashboard = () => {
  const { availableBeds, totalBeds } = useRooms();
  const [appointments, setAppointments] = useState(mockAppointments);
  const [patients, setPatients] = useState(mockPatients);
  const [visitors, setVisitors] = useState(mockVisitors);

  // Modal open states
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [isVisModalOpen, setIsVisModalOpen] = useState(false);

  // New Appointment Form
  const [appPatientId, setAppPatientId] = useState('');
  const [appDoctorId, setAppDoctorId] = useState('');
  const [appDate, setAppDate] = useState('');
  const [appTime, setAppTime] = useState('');
  const [appDept, setAppDept] = useState('Cardiology');

  // New Visitor Form
  const [visName, setVisName] = useState('');
  const [visPhone, setVisPhone] = useState('');
  const [visPatient, setVisPatient] = useState('');

  const stats = [
    { label: "Today's Appointments", value: appointments.filter(a => a.date === '2026-08-27').length.toString(), icon: Calendar, color: 'text-blue-600 bg-blue-50' },
    { label: 'Registered Patients', value: patients.length.toString(), icon: Users, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Available Bed Spaces', value: `${availableBeds} / ${totalBeds}`, icon: Home, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Active Visitors', value: visitors.filter(v => v.status === 'Checked In').length.toString(), icon: UserCheck, color: 'text-teal-600 bg-teal-50' }
  ];

  const handleBookAppointment = (e) => {
    e.preventDefault();
    if (!appPatientId || !appDoctorId || !appDate || !appTime) return;

    appointmentService.create({
      patientId: appPatientId,
      doctorId: appDoctorId,
      date: appDate,
      time: appTime,
      department: appDept
    });

    setAppointments([...mockAppointments]);
    setIsAppModalOpen(false);
    
    // Clear form
    setAppPatientId('');
    setAppDoctorId('');
    setAppDate('');
    setAppTime('');
  };

  const handleRegisterVisitor = (e) => {
    e.preventDefault();
    if (!visName || !visPhone || !visPatient) return;

    visitorService.create({
      visitorName: visName,
      phone: visPhone,
      patientName: visPatient
    });

    setVisitors([...mockVisitors]);
    setIsVisModalOpen(false);

    // Clear form
    setVisName('');
    setVisPhone('');
    setVisPatient('');
  };

  const handleCheckOutVisitor = (id) => {
    visitorService.checkOut(id);
    setVisitors([...mockVisitors]);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-blue-600 font-semibold tracking-wide uppercase">Front Desk Operations</span>
          <h2 className="text-xl font-bold text-slate-800 mt-1">Hello, Receptionist Sarah</h2>
          <p className="text-xs text-slate-500 mt-0.5">Central Reception Hall A | Facilitating patient and visitor logs</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="primary" icon={Plus} onClick={() => setIsAppModalOpen(true)}>
            Book Appointment
          </Button>
          <Button variant="secondary" icon={Plus} onClick={() => setIsVisModalOpen(true)}>
            Issue Visitor Pass
          </Button>
        </div>
      </div>

      {/* Stats counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex items-center gap-3">
            <div className={`p-2.5 rounded-lg shrink-0 ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">{stat.label}</span>
              <span className="text-base font-bold text-slate-800 block mt-0.5">{stat.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Layout grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's appointments queue */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Today's Outpatient Appointments" subtitle="Patient visitation checklist for today">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-100 font-bold">
                    <th className="p-3">Appt ID</th>
                    <th className="p-3">Patient</th>
                    <th className="p-3">Doctor</th>
                    <th className="p-3">Time</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {appointments.slice(0, 6).map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-slate-700">{app.id}</td>
                      <td className="p-3 text-slate-600 font-medium">{app.patientName}</td>
                      <td className="p-3 text-slate-500">{app.doctorName} ({app.department})</td>
                      <td className="p-3 text-slate-500">{app.time}</td>
                      <td className="p-3">
                        <Badge>{app.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Checked-in visitors log */}
        <div className="space-y-6">
          <Card title="Visitor Passes" subtitle="Active hospital visitation passes">
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {visitors.map((v) => (
                <div key={v.id} className="p-3 border border-slate-200 rounded-xl flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <h5 className="font-semibold text-xs text-slate-800">{v.visitorName}</h5>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Visiting: {v.patientName}</span>
                    <span className="text-[9px] text-slate-500 font-semibold mt-0.5 block">{v.passId}</span>
                  </div>
                  <div className="text-right">
                    {v.status === 'Checked In' ? (
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleCheckOutVisitor(v.id)}>
                        Check Out
                      </Button>
                    ) : (
                      <Badge className="bg-slate-50 text-slate-500">Left</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Book Appointment Modal */}
      <Modal
        isOpen={isAppModalOpen}
        onClose={() => setIsAppModalOpen(false)}
        title="Schedule Patient Appointment"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAppModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleBookAppointment}>Book Slots</Button>
          </div>
        }
      >
        <form className="space-y-4" onSubmit={handleBookAppointment}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Select Patient</label>
              <select
                value={appPatientId}
                onChange={(e) => setAppPatientId(e.target.value)}
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
                required
              >
                <option value="">-- Choose Patient --</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Select Doctor</label>
              <select
                value={appDoctorId}
                onChange={(e) => setAppDoctorId(e.target.value)}
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
                required
              >
                <option value="">-- Choose Practitioner --</option>
                {mockDoctors.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Appointment Date</label>
              <input
                type="date"
                value={appDate}
                onChange={(e) => setAppDate(e.target.value)}
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Time Slot</label>
              <input
                type="text"
                value={appTime}
                onChange={(e) => setAppTime(e.target.value)}
                placeholder="e.g. 10:30 AM"
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700">Clinical Department</label>
              <select
                value={appDept}
                onChange={(e) => setAppDept(e.target.value)}
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
              >
                <option value="Cardiology">Cardiology</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="Neurology">Neurology</option>
                <option value="General Surgery">General Surgery</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>

      {/* Visitor Pass Modal */}
      <Modal
        isOpen={isVisModalOpen}
        onClose={() => setIsVisModalOpen(false)}
        title="Issue Gate Visitor Pass"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsVisModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleRegisterVisitor}>Generate Pass</Button>
          </div>
        }
      >
        <form className="space-y-4" onSubmit={handleRegisterVisitor}>
          <div>
            <label className="block text-xs font-semibold text-slate-700">Visitor Full Name</label>
            <input
              type="text"
              value={visName}
              onChange={(e) => setVisName(e.target.value)}
              placeholder="e.g. Ramesh Sharma"
              className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Phone Number</label>
            <input
              type="text"
              value={visPhone}
              onChange={(e) => setVisPhone(e.target.value)}
              placeholder="e.g. +91 98888 12345"
              className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Visiting Patient</label>
            <select
              value={visPatient}
              onChange={(e) => setVisPatient(e.target.value)}
              className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
              required
            >
              <option value="">-- Select Patient --</option>
              {patients.filter(p => p.status !== 'Outpatient').map(p => (
                <option key={p.id} value={p.name}>{p.name} ({p.room})</option>
              ))}
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ReceptionistDashboard;
