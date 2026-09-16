import React, { useState } from 'react';
import { Calendar, Users, ClipboardList, CheckSquare, AlertCircle, Plus, Eye, Stethoscope, Pill, Check } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { mockPatients, patientService, mockDoctors } from '../../data/mockData';
import { useAuth } from '../../hooks/useAuth';
import { useAppointments } from '../../context/AppointmentContext';

export const DoctorDashboard = () => {
  const { user } = useAuth();
  const { appointments, updateAppointmentStatus, refreshAppointments } = useAppointments();
  
  // Scoped appointments from backend for logged-in doctor
  const doctorAppointments = appointments.filter((a) => a.type === 'doctor');

  const [patients, setPatients] = useState(mockPatients);
  
  // Consultation form states
  const [isConsultModalOpen, setIsConsultModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [prescMed, setPrescMed] = useState('');
  const [prescDosage, setPrescDosage] = useState('1-0-1');
  const [prescDuration, setPrescDuration] = useState('7 days');
  
  const [selectedPatientDetails, setSelectedPatientDetails] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const stats = [
    { label: "Today's Appointments", value: doctorAppointments.length.toString(), icon: Calendar, color: 'text-blue-600 bg-blue-50' },
    { label: 'Assigned Patients', value: '2', icon: Users, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Pending consultations', value: doctorAppointments.filter(a => a.status === 'Scheduled' || a.status === 'Confirmed').length.toString(), icon: ClipboardList, color: 'text-amber-600 bg-amber-50' },
    { label: 'Completed consultations', value: doctorAppointments.filter(a => a.status === 'Completed').length.toString(), icon: CheckSquare, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Patient Alerts', value: '1 critical', icon: AlertCircle, color: 'text-rose-600 bg-rose-50' }
  ];

  const handleOpenConsult = (patientId) => {
    setSelectedPatientId(patientId);
    setIsConsultModalOpen(true);
  };

  const handleSaveConsult = (e) => {
    e.preventDefault();
    if (!selectedPatientId || !diagnosis) return;

    // Add diagnosis/notes & prescription to mockData patient record
    const patient = mockPatients.find(p => p.id === selectedPatientId);
    if (patient) {
      patient.medicalHistory.push(diagnosis);
      if (prescMed) {
        patientService.updatePrescription(selectedPatientId, {
          medicine: prescMed,
          dosage: prescDosage,
          duration: prescDuration,
          pharmacistGiven: false
        });
      }
      // Set appointment to completed in AppointmentContext
      const app = doctorAppointments.find(a => a.patientId === selectedPatientId);
      if (app) {
        updateAppointmentStatus(app.id, 'Completed', diagnosis);
      }
      
      // Reset form
      setDiagnosis('');
      setPrescMed('');
      setSelectedPatientId('');
      setIsConsultModalOpen(false);
      setPatients([...mockPatients]);
    }
  };

  const handleViewPatientDetails = (pat) => {
    setSelectedPatientDetails(pat);
    setIsDetailsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-blue-600 font-semibold tracking-wide uppercase">Practice Overview</span>
          <h2 className="text-xl font-bold text-slate-800 mt-1">Welcome back, {user?.name || 'Dr. Arun Kumar'}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {user?.department || 'Cardiology'} Department Office | {doctorAppointments.length} consultations scheduled in queue
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" icon={Plus} onClick={() => handleOpenConsult('')}>
            New Consult Log
          </Button>
        </div>
      </div>

      {/* Stats Counter Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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

      {/* Main layout grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Appointments List */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Today's Consultation Queue" subtitle="Patient appointments for today">
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {doctorAppointments.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  No appointments remaining for today
                </div>
              ) : (
                doctorAppointments.map((app) => {
                  const patient = patients.find(p => p.id === app.patientId);
                  return (
                    <div key={app.id} className="py-3.5 flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700">
                          {app.patientName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-slate-800">{app.patientName}</h4>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                            <span>ID: {app.patientId}</span>
                            <span>•</span>
                            <span>{app.time}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge>{app.status}</Badge>
                        {app.status !== 'Completed' ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={Stethoscope}
                            onClick={() => handleOpenConsult(app.patientId)}
                          >
                            Diagnose
                          </Button>
                        ) : (
                          <span className="text-emerald-600 text-xs font-semibold flex items-center gap-0.5 px-3 py-1 bg-emerald-50 rounded-lg">
                            <Check className="w-3.5 h-3.5" /> Completed
                          </span>
                        )}
                        <Button
                          variant="white"
                          size="sm"
                          icon={Eye}
                          onClick={() => handleViewPatientDetails(patient)}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* Assigned Patients and Alerts */}
        <div className="space-y-6">
          <Card title="Patient Health Alerts" subtitle="Monitor critical signs">
            <div className="space-y-3">
              <div className="border border-rose-100 bg-rose-50/30 p-3.5 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-rose-800">BP Alert (Critical Room)</span>
                  <Badge className="bg-rose-50 text-rose-700">ICU Bed 1</Badge>
                </div>
                <p className="text-[11px] text-rose-700">
                  Patient <strong>Ananya Iyer</strong>'s heart rate spiked to 95 bpm, and SpO2 levels dropped to 94%.
                </p>
                <div className="flex justify-end pt-1">
                  <Button variant="danger" size="sm" onClick={() => handleViewPatientDetails(patients.find(p => p.id === 'P-102'))}>
                    View ICU Records
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Active Ward Patients" subtitle="Currently admitted under your care">
            <div className="space-y-3">
              {patients.filter(p => p.status === 'Admitted' || p.status === 'Critical').map(p => (
                <div key={p.id} className="p-3 border border-slate-100 rounded-xl flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <h5 className="font-semibold text-xs text-slate-800">{p.name}</h5>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">{p.room} • BP: {p.vitals.bp}</span>
                  </div>
                  <Button variant="ghost" size="sm" icon={Eye} onClick={() => handleViewPatientDetails(p)}>
                    Chart
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Consultation Diagnosis & Prescription Modal */}
      <Modal
        isOpen={isConsultModalOpen}
        onClose={() => setIsConsultModalOpen(false)}
        title="Record Clinical Consultation Log"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsConsultModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveConsult}>Save Log & Prescribe</Button>
          </div>
        }
      >
        <form className="space-y-4" onSubmit={handleSaveConsult}>
          <div>
            <label className="block text-xs font-semibold text-slate-700">Select Patient</label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
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
            <label className="block text-xs font-semibold text-slate-700">Diagnosis & Notes</label>
            <textarea
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="e.g. Mild hypertrophy, advised absolute bed rest for 3 days."
              rows={3}
              className="mt-1 w-full p-2.5 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
              required
            />
          </div>

          <div className="border-t border-slate-100 pt-3">
            <span className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
              <Pill className="w-4 h-4 text-blue-500" /> Prescribe Medication (Optional)
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-slate-500 font-semibold">Medicine Name</label>
                <input
                  type="text"
                  value={prescMed}
                  onChange={(e) => setPrescMed(e.target.value)}
                  placeholder="e.g. Telmisartan 40mg"
                  className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-semibold">Dosage (Morning-Noon-Night)</label>
                <input
                  type="text"
                  value={prescDosage}
                  onChange={(e) => setPrescDosage(e.target.value)}
                  placeholder="e.g. 1-0-1"
                  className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-semibold">Duration</label>
                <input
                  type="text"
                  value={prescDuration}
                  onChange={(e) => setPrescDuration(e.target.value)}
                  placeholder="e.g. 15 days"
                  className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
                />
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* Patient Detail Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title="Patient Medical Profile Chart"
        size="lg"
        footer={<Button onClick={() => setIsDetailsModalOpen(false)}>Close Chart</Button>}
      >
        {selectedPatientDetails && (
          <div className="space-y-6">
            <div className="flex justify-between flex-wrap gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-800">{selectedPatientDetails.name}</h3>
                <span className="text-xs text-slate-500">Patient ID: {selectedPatientDetails.id} • Room: {selectedPatientDetails.room}</span>
              </div>
              <Badge>{selectedPatientDetails.status}</Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Age / Gender</span>
                <span className="text-sm font-semibold text-slate-700 block mt-0.5">{selectedPatientDetails.age} yrs / {selectedPatientDetails.gender}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Blood Group</span>
                <span className="text-sm font-semibold text-slate-700 block mt-0.5">{selectedPatientDetails.bloodGroup}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Phone Number</span>
                <span className="text-sm font-semibold text-slate-700 block mt-0.5">{selectedPatientDetails.phone}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Admission Date</span>
                <span className="text-sm font-semibold text-slate-700 block mt-0.5">{selectedPatientDetails.admissionDate}</span>
              </div>
            </div>

            {/* Vitals */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Current Vitals</h4>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="border border-slate-200 p-2 rounded-lg">
                  <span className="text-[9px] text-slate-400 font-semibold block uppercase">Temperature</span>
                  <span className="text-xs font-bold text-slate-700 block mt-0.5">{selectedPatientDetails.vitals.temp}</span>
                </div>
                <div className="border border-slate-200 p-2 rounded-lg">
                  <span className="text-[9px] text-slate-400 font-semibold block uppercase">Blood Pressure</span>
                  <span className="text-xs font-bold text-slate-700 block mt-0.5">{selectedPatientDetails.vitals.bp}</span>
                </div>
                <div className="border border-slate-200 p-2 rounded-lg">
                  <span className="text-[9px] text-slate-400 font-semibold block uppercase">Heart Rate</span>
                  <span className="text-xs font-bold text-slate-700 block mt-0.5">{selectedPatientDetails.vitals.heartRate}</span>
                </div>
                <div className="border border-slate-200 p-2 rounded-lg">
                  <span className="text-[9px] text-slate-400 font-semibold block uppercase">SpO2 Level</span>
                  <span className="text-xs font-bold text-slate-700 block mt-0.5">{selectedPatientDetails.vitals.spo2}</span>
                </div>
              </div>
            </div>

            {/* Prescriptions */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Prescribed Medications</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2">Medicine</th>
                      <th className="px-4 py-2">Dosage</th>
                      <th className="px-4 py-2">Duration</th>
                      <th className="px-4 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {selectedPatientDetails.prescriptions.map((pr, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2.5 font-medium text-slate-800">{pr.medicine}</td>
                        <td className="px-4 py-2.5 text-slate-600">{pr.dosage}</td>
                        <td className="px-4 py-2.5 text-slate-600">{pr.duration}</td>
                        <td className="px-4 py-2.5">
                          <Badge>{pr.pharmacistGiven ? 'Dispensed' : 'Pending Pharmacy'}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Medical History */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Clinical Diagnosis History</h4>
              <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
                {selectedPatientDetails.medicalHistory.map((hist, idx) => (
                  <li key={idx}>{hist}</li>
                ))}
              </ul>
            </div>

            {/* Nursing Notes */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Head Nurse Notes</h4>
              <div className="p-3.5 bg-blue-50/30 border border-blue-100 rounded-xl text-xs text-slate-600 leading-normal italic">
                "{selectedPatientDetails.nursingNotes}"
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DoctorDashboard;
