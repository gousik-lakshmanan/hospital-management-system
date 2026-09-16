import React, { useState, useEffect, useCallback } from 'react';
import { Stethoscope, Plus, HelpCircle, Activity, AlertCircle, CheckCircle2 } from 'lucide-react';
import { mockDoctors } from '../../data/mockData';
import { userService } from '../../services/userService';
import Card from '../common/Card';
import Table from '../common/Table';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Modal from '../common/Modal';

export const DoctorsPage = () => {
  const [doctors, setDoctors] = useState(mockDoctors);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [specialty, setSpecialty] = useState('Cardiology');
  const [room, setRoom] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchDoctors = useCallback(async () => {
    try {
      const res = await userService.getDoctors();
      if (res?.success && Array.isArray(res.doctors) && res.doctors.length > 0) {
        setDoctors(res.doctors);
      }
    } catch (err) {
      console.warn('Could not fetch doctors from API, using fallback list', err.message);
    }
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMsg('Please provide both first and last name.');
      return;
    }

    if (!email.trim()) {
      setErrorMsg('Please provide a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        password,
        department: specialty,
        specialization: specialty,
        room: room.trim() || 'Consultation Room A',
      };

      const res = await userService.createDoctor(payload);
      if (res?.success) {
        setSuccessMsg('Doctor account created successfully.');
        setIsAddOpen(false);
        setFirstName('');
        setLastName('');
        setPhone('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setRoom('');
        await fetchDoctors();
      } else {
        setErrorMsg(res?.message || 'Failed to create doctor account.');
      }
    } catch (err) {
      console.error('Create doctor error:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to create doctor account.');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { header: 'Practitioner ID', accessor: 'id', cell: (row) => <span className="font-semibold text-xs font-mono">{row.id}</span> },
    { header: 'Physician Name', accessor: 'name', cell: (row) => <span className="font-semibold text-slate-800">{row.name}</span> },
    { header: 'Specialty', accessor: 'specialty', cell: (row) => <Badge variant="info">{row.department || row.specialty}</Badge> },
    { header: 'Consultation Room', accessor: 'room', cell: (row) => <span className="text-slate-500 text-xs">{row.room}</span> },
    { header: 'Contact Email', accessor: 'email', cell: (row) => <span className="text-slate-400 text-xs">{row.email}</span> },
    { header: 'Intake Status', accessor: 'status', cell: (row) => <Badge>{row.status || 'On Duty'}</Badge> }
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Medical Practitioners Directory</h2>
          <p className="text-xs text-slate-500">View duty status and manage clinical doctor accounts</p>
        </div>
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => {
            setIsAddOpen(true);
            setErrorMsg('');
            setSuccessMsg('');
          }}
        >
          Register Practitioner
        </Button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <Card noPadding>
        <div className="p-4">
          <Table
            columns={columns}
            data={doctors}
            searchKey="name"
            placeholder="Search doctor by name..."
            emptyMessage="No practitioners registered."
          />
        </div>
      </Card>

      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Register Practitioner Staff (Doctor Account)"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAdd} loading={submitting}>
              Create Doctor Account
            </Button>
          </div>
        }
      >
        <form className="space-y-3.5" onSubmit={handleAdd}>
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700">First Name *</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Ramesh"
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Last Name *</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Gupta"
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Email Address (Login) *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. ramesh.gupta@medisync.com"
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Password *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Confirm Password *</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Department Specialty *</label>
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
              >
                <option value="Cardiology">Cardiology</option>
                <option value="General Medicine">General Medicine</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="Dermatology">Dermatology</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Neurology">Neurology</option>
                <option value="General Surgery">General Surgery</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Room Location</label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="e.g. Consultation Room A"
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DoctorsPage;
