import React, { useState } from 'react';
import { Users, CheckSquare, Heart, Clock, AlertTriangle, PenTool, Activity, FileText, CheckCircle2 } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { mockPatients, patientService } from '../../data/mockData';
import { useAuth } from '../../hooks/useAuth';

export const NurseDashboard = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState(mockPatients);
  
  // Vitals form state
  const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [temp, setTemp] = useState('');
  const [bp, setBp] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [spo2, setSpo2] = useState('');
  
  // Nursing note state
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteText, setNoteText] = useState('');

  // Mock schedule checklist
  const [medSchedule, setMedSchedule] = useState([
    { id: 1, patient: 'Aarav Sharma', room: 'Ward A - Bed 3', medicine: 'Metformin 500mg', time: '09:00 AM', status: 'Given' },
    { id: 2, patient: 'Ananya Iyer', room: 'ICU - Bed 1', medicine: 'Amoxicillin 500mg', time: '10:00 AM', status: 'Pending' },
    { id: 3, patient: 'Vikram Malhotra', room: 'Private 104', medicine: 'Aspirin 75mg', time: '12:00 PM', status: 'Pending' },
    { id: 4, patient: 'Diya Patel', room: 'Emergency - Bed 2', medicine: 'Paracetamol Syrup 5ml', time: '01:00 PM', status: 'Pending' }
  ]);

  const stats = [
    { label: 'Patients Admitted', value: patients.filter(p => p.status !== 'Outpatient').length.toString(), icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Medications Scheduled', value: medSchedule.length.toString(), icon: Clock, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Pending Vitals Checks', value: patients.filter(p => p.status === 'Critical' || p.status === 'Admitted').length.toString(), icon: Activity, color: 'text-amber-600 bg-amber-50' },
    { label: 'Vitals Checked Today', value: '4', icon: CheckSquare, color: 'text-emerald-600 bg-emerald-50' }
  ];

  const handleMarkMedGiven = (id) => {
    setMedSchedule(prev => prev.map(m => m.id === id ? { ...m, status: 'Given' } : m));
  };

  const handleOpenVitals = (patientId) => {
    const pat = patients.find(p => p.id === patientId);
    if (pat) {
      setSelectedPatientId(patientId);
      setTemp(pat.vitals.temp.replace(' °F', ''));
      setBp(pat.vitals.bp.replace(' mmHg', ''));
      setHeartRate(pat.vitals.heartRate.replace(' bpm', ''));
      setSpo2(pat.vitals.spo2.replace('%', ''));
      setIsVitalsModalOpen(true);
    }
  };

  const handleSaveVitals = (e) => {
    e.preventDefault();
    if (!selectedPatientId || !temp || !bp || !heartRate || !spo2) return;

    const formattedVitals = {
      temp: `${temp} °F`,
      bp: `${bp} mmHg`,
      heartRate: `${heartRate} bpm`,
      spo2: `${spo2}%`
    };

    patientService.updateVitals(selectedPatientId, formattedVitals);
    setPatients([...mockPatients]);
    setIsVitalsModalOpen(false);
  };

  const handleOpenNotes = (patientId) => {
    setSelectedPatientId(patientId);
    const pat = patients.find(p => p.id === patientId);
    setNoteText(pat?.nursingNotes || '');
    setIsNoteModalOpen(true);
  };

  const handleSaveNotes = (e) => {
    e.preventDefault();
    const pat = mockPatients.find(p => p.id === selectedPatientId);
    if (pat) {
      pat.nursingNotes = noteText;
      setPatients([...mockPatients]);
      setIsNoteModalOpen(false);
      setNoteText('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-blue-600 font-semibold tracking-wide uppercase">Nurse Care Station</span>
          <h2 className="text-xl font-bold text-slate-800 mt-1">Hello, {user?.name || 'Nurse Anitha'}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Department: {user?.department || 'General Nursing'} | Shift: Morning Ward & Clinical Oversight
          </p>
        </div>
        <div className="flex gap-2">
          <span className="inline-flex items-center px-3 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-200 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Critical Alert: Bed ICU-101
          </span>
        </div>
      </div>

      {/* Stats */}
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

      {/* Main grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ward patient monitors */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Ward & ICU Patient Monitors" subtitle="Admitted patient metrics and nursing action controls">
            <div className="space-y-4">
              {patients.filter(p => p.status !== 'Outpatient').map(p => (
                <div key={p.id} className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm text-slate-800">{p.name}</h4>
                      <Badge className={p.status === 'Critical' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'}>
                        {p.room}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center max-w-sm mt-3">
                      <div className="bg-slate-50 py-1.5 px-2 rounded-lg border border-slate-100">
                        <span className="text-[8px] text-slate-400 font-bold block uppercase">Temp</span>
                        <span className="text-xs font-bold text-slate-700 block mt-0.5">{p.vitals.temp}</span>
                      </div>
                      <div className="bg-slate-50 py-1.5 px-2 rounded-lg border border-slate-100">
                        <span className="text-[8px] text-slate-400 font-bold block uppercase">BP</span>
                        <span className="text-xs font-bold text-slate-700 block mt-0.5">{p.vitals.bp}</span>
                      </div>
                      <div className="bg-slate-50 py-1.5 px-2 rounded-lg border border-slate-100">
                        <span className="text-[8px] text-slate-400 font-bold block uppercase">HR</span>
                        <span className="text-xs font-bold text-slate-700 block mt-0.5">{p.vitals.heartRate}</span>
                      </div>
                      <div className="bg-slate-50 py-1.5 px-2 rounded-lg border border-slate-100">
                        <span className="text-[8px] text-slate-400 font-bold block uppercase">SpO2</span>
                        <span className={`text-xs font-bold block mt-0.5 ${parseFloat(p.vitals.spo2) < 95 ? 'text-red-600' : 'text-slate-700'}`}>{p.vitals.spo2}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" icon={Activity} onClick={() => handleOpenVitals(p.id)}>
                      Log Vitals
                    </Button>
                    <Button variant="white" size="sm" icon={PenTool} onClick={() => handleOpenNotes(p.id)}>
                      Add Note
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Schedule */}
        <div className="space-y-6">
          <Card title="Medication Rounds" subtitle="Hourly medication schedules">
            <div className="space-y-3.5">
              {medSchedule.map((med) => (
                <div key={med.id} className="p-3 border border-slate-100 rounded-xl flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <h5 className="font-semibold text-xs text-slate-800">{med.patient}</h5>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">{med.medicine} • {med.time}</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5 italic">{med.room}</span>
                  </div>
                  {med.status === 'Given' ? (
                    <span className="text-emerald-600 text-xs font-semibold flex items-center gap-0.5 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Given
                    </span>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => handleMarkMedGiven(med.id)}>
                      Give
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card title="Clinical Notes Overview" subtitle="Last registered notes">
            <div className="space-y-3.5">
              {patients.filter(p => p.status !== 'Outpatient').map(p => (
                <div key={p.id} className="p-3 border border-slate-100 rounded-xl space-y-1 bg-slate-50/30">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-[10px] text-slate-700">{p.name}</span>
                    <span className="text-[9px] text-slate-400 font-medium">{p.room}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 italic leading-snug">
                    "{p.nursingNotes}"
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Log Vitals Modal */}
      <Modal
        isOpen={isVitalsModalOpen}
        onClose={() => setIsVitalsModalOpen(false)}
        title="Record Patient Vitals"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsVitalsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveVitals}>Save Vitals</Button>
          </div>
        }
      >
        <form className="space-y-4" onSubmit={handleSaveVitals}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Temperature (°F)</label>
              <input
                type="number"
                step="0.1"
                value={temp}
                onChange={(e) => setTemp(e.target.value)}
                placeholder="e.g. 98.6"
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Blood Pressure (mmHg)</label>
              <input
                type="text"
                value={bp}
                onChange={(e) => setBp(e.target.value)}
                placeholder="e.g. 120/80"
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Heart Rate (bpm)</label>
              <input
                type="number"
                value={heartRate}
                onChange={(e) => setHeartRate(e.target.value)}
                placeholder="e.g. 72"
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">SpO2 Level (%)</label>
              <input
                type="number"
                value={spo2}
                onChange={(e) => setSpo2(e.target.value)}
                placeholder="e.g. 98"
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
                required
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Nursing Note Modal */}
      <Modal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        title="Add Nursing Notes"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsNoteModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveNotes}>Save Notes</Button>
          </div>
        }
      >
        <form className="space-y-4" onSubmit={handleSaveNotes}>
          <div>
            <label className="block text-xs font-semibold text-slate-700">Nursing Notes</label>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Record care observations..."
              rows={4}
              className="mt-1 w-full p-2.5 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default NurseDashboard;
