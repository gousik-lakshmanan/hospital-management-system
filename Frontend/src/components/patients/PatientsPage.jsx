import React, { useState } from 'react';
import { Plus, Eye, Activity, PenTool, UserPlus, Filter } from 'lucide-react';
import { mockPatients, patientService } from '../../data/mockData';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import Card from '../common/Card';
import Table from '../common/Table';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Modal from '../common/Modal';

export const PatientsPage = () => {
  const { currentRole } = useAuth();
  const { hasPermission } = usePermissions();
  const [patients, setPatients] = useState(mockPatients);
  
  // Registration Form Modal
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [historyText, setHistoryText] = useState('');

  // Patient Detail Modal
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Vitals form
  const [isVitalsOpen, setIsVitalsOpen] = useState(false);
  const [vitalsPatientId, setVitalsPatientId] = useState('');
  const [temp, setTemp] = useState('');
  const [bp, setBp] = useState('');
  const [hr, setHr] = useState('');
  const [spo2, setSpo2] = useState('');

  // Handle register submission
  const handleRegister = (e) => {
    e.preventDefault();
    if (!name || !age || !phone) return;

    patientService.create({
      name,
      age: parseInt(age),
      gender,
      bloodGroup,
      phone,
      email,
      medicalHistory: historyText ? [historyText] : [],
      room: 'Outpatient',
      prescriptions: []
    });

    setPatients([...mockPatients]);
    setIsRegModalOpen(false);

    // Reset fields
    setName('');
    setAge('');
    setPhone('');
    setEmail('');
    setHistoryText('');
  };

  const handleOpenVitals = (p) => {
    setVitalsPatientId(p.id);
    setTemp(p.vitals.temp.replace(' °F', ''));
    setBp(p.vitals.bp.replace(' mmHg', ''));
    setHr(p.vitals.heartRate.replace(' bpm', ''));
    setSpo2(p.vitals.spo2.replace('%', ''));
    setIsVitalsOpen(true);
  };

  const handleSaveVitals = (e) => {
    e.preventDefault();
    patientService.updateVitals(vitalsPatientId, {
      temp: `${temp} °F`,
      bp: `${bp} mmHg`,
      heartRate: `${hr} bpm`,
      spo2: `${spo2}%`
    });
    setPatients([...mockPatients]);
    setIsVitalsOpen(false);
  };

  const columns = [
    { header: 'Patient ID', accessor: 'id', cell: (row) => <span className="font-semibold">{row.id}</span> },
    { header: 'Name', accessor: 'name', cell: (row) => <div className="font-semibold text-slate-800">{row.name} <span className="text-[10px] text-slate-400 font-medium block">Age: {row.age} | {row.gender}</span></div> },
    { header: 'Blood Group', accessor: 'bloodGroup', cell: (row) => <span className="font-medium text-slate-700">{row.bloodGroup}</span> },
    { header: 'Contact', accessor: 'phone', cell: (row) => <div className="text-slate-500 text-xs">{row.phone} <span className="block text-[10px] font-medium text-slate-400">{row.email}</span></div> },
    { header: 'Assigned Bed', accessor: 'room', cell: (row) => <Badge>{row.room}</Badge> },
    { header: 'Vitals Status', cell: (row) => <div className="text-[10px] text-slate-500 font-medium leading-relaxed">BP: {row.vitals.bp} <br /> SpO2: {row.vitals.spo2}</div> },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            icon={Eye}
            onClick={() => { setSelectedPatient(row); setIsDetailsOpen(true); }}
          >
            Chart
          </Button>
          {(currentRole === 'doctor' || currentRole === 'nurse') && (
            <Button
              variant="secondary"
              size="sm"
              icon={Activity}
              onClick={() => handleOpenVitals(row)}
            >
              Vitals
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4">
      {/* Title section with action button */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Clinical Patient Directory</h2>
          <p className="text-xs text-slate-500">Hospital-wide list of outpatient and admitted cases</p>
        </div>
        {(currentRole === 'admin' || currentRole === 'receptionist') && (
          <Button variant="primary" icon={UserPlus} onClick={() => setIsRegModalOpen(true)}>
            Register Patient
          </Button>
        )}
      </div>

      <Card noPadding>
        <div className="p-4">
          <Table
            columns={columns}
            data={patients}
            searchKey="name"
            placeholder="Search patient by name..."
            emptyMessage="No patient directories found."
          />
        </div>
      </Card>

      {/* Patient Registration Modal */}
      <Modal
        isOpen={isRegModalOpen}
        onClose={() => setIsRegModalOpen(false)}
        title="Register New Patient Intake"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsRegModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleRegister}>Create Intake Record</Button>
          </div>
        }
      >
        <form className="space-y-4" onSubmit={handleRegister}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Patient Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Verma"
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 35"
                  className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Blood Group</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Contact Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 98888 77777"
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700">Email Address (Optional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. rahul@example.com"
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700">Known Clinical History / Notes</label>
              <textarea
                value={historyText}
                onChange={(e) => setHistoryText(e.target.value)}
                placeholder="e.g. Chronic asthma, history of coronary stents"
                rows={3}
                className="mt-1 w-full p-2.5 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Vitals Form Modal */}
      <Modal
        isOpen={isVitalsOpen}
        onClose={() => setIsVitalsOpen(false)}
        title="Update Patient Vitals Log"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsVitalsOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveVitals}>Record Vitals</Button>
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
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Heart Rate (bpm)</label>
              <input
                type="number"
                value={hr}
                onChange={(e) => setHr(e.target.value)}
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
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
                required
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Patient Detail Profile Modal */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title="Patient Medical Profile Chart"
        size="lg"
        footer={<Button onClick={() => setIsDetailsOpen(false)}>Close Profile Chart</Button>}
      >
        {selectedPatient && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="flex justify-between items-center flex-wrap gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-900">{selectedPatient.name}</h3>
                <span className="text-xs text-slate-500">ID: {selectedPatient.id} • Room: {selectedPatient.room}</span>
              </div>
              <Badge>{selectedPatient.status}</Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Age / Gender</span>
                <span className="text-slate-700 font-semibold block mt-0.5">{selectedPatient.age} yrs / {selectedPatient.gender}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Blood Group</span>
                <span className="text-slate-700 font-semibold block mt-0.5">{selectedPatient.bloodGroup}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Contact Phone</span>
                <span className="text-slate-700 font-semibold block mt-0.5">{selectedPatient.phone}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Email</span>
                <span className="text-slate-700 font-semibold block mt-0.5 truncate">{selectedPatient.email || 'N/A'}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Vitals Measurements</h4>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 border border-slate-200 rounded-lg">
                  <span className="text-[9px] text-slate-400 font-medium block">Temperature</span>
                  <span className="font-bold text-slate-700 block mt-0.5">{selectedPatient.vitals.temp}</span>
                </div>
                <div className="p-2 border border-slate-200 rounded-lg">
                  <span className="text-[9px] text-slate-400 font-medium block">Blood Pressure</span>
                  <span className="font-bold text-slate-700 block mt-0.5">{selectedPatient.vitals.bp}</span>
                </div>
                <div className="p-2 border border-slate-200 rounded-lg">
                  <span className="text-[9px] text-slate-400 font-medium block">Heart Rate</span>
                  <span className="font-bold text-slate-700 block mt-0.5">{selectedPatient.vitals.heartRate}</span>
                </div>
                <div className="p-2 border border-slate-200 rounded-lg">
                  <span className="text-[9px] text-slate-400 font-medium block">SpO2 level</span>
                  <span className="font-bold text-slate-700 block mt-0.5">{selectedPatient.vitals.spo2}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Medication Prescriptions</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
                    <tr>
                      <th className="p-3">Medicine Generic</th>
                      <th className="p-3">Dosage Timing</th>
                      <th className="p-3">Duration</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {selectedPatient.prescriptions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-400 italic">No prescriptions found.</td>
                      </tr>
                    ) : (
                      selectedPatient.prescriptions.map((pr, idx) => (
                        <tr key={idx}>
                          <td className="p-3 font-semibold text-slate-800">{pr.medicine}</td>
                          <td className="p-3">{pr.dosage}</td>
                          <td className="p-3">{pr.duration}</td>
                          <td className="p-3">
                            <Badge>{pr.pharmacistGiven ? 'Dispensed' : 'Pending Counter'}</Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Diagnosed Medical History</h4>
              <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
                {selectedPatient.medicalHistory.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Nursing Notes</h4>
              <div className="p-3 bg-blue-50/20 border border-blue-100 rounded-xl text-xs text-slate-600 italic">
                "{selectedPatient.nursingNotes}"
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PatientsPage;
