import React, { useState, useEffect, useCallback } from 'react';
import { HeartHandshake, Plus, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { mockNurses } from '../../data/mockData';
import { userService } from '../../services/userService';
import Card from '../common/Card';
import Table from '../common/Table';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Modal from '../common/Modal';

export const NursesPage = () => {
  const [nurses, setNurses] = useState(mockNurses);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dept, setDept] = useState('General Nursing');
  const [shift, setShift] = useState('Morning');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchNurses = useCallback(async () => {
    try {
      const res = await userService.getNurses();
      if (res?.success && Array.isArray(res.nurses) && res.nurses.length > 0) {
        setNurses(res.nurses);
      }
    } catch (err) {
      console.warn('Could not fetch nurses from API, using fallback list', err.message);
    }
  }, []);

  useEffect(() => {
    fetchNurses();
  }, [fetchNurses]);

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
        department: dept,
        shift: shift
      };

      const res = await userService.createNurse(payload);
      if (res?.success) {
        setSuccessMsg('Nurse account created successfully.');
        setIsAddOpen(false);
        setFirstName('');
        setLastName('');
        setPhone('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        await fetchNurses();
      } else {
        setErrorMsg(res?.message || 'Failed to create nurse account.');
      }
    } catch (err) {
      console.error('Create nurse error:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to create nurse account.');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { header: 'Nurse ID', accessor: 'id', cell: (row) => <span className="font-semibold text-xs font-mono">{row.id}</span> },
    { header: 'Nursing Staff Name', accessor: 'name', cell: (row) => <span className="font-semibold text-slate-800">{row.name}</span> },
    { header: 'Clinical Department', accessor: 'department', cell: (row) => <Badge variant="info">{row.department}</Badge> },
    { header: 'Shift Timing', accessor: 'shift', cell: (row) => <span className="text-slate-500 font-medium text-xs">{row.shift}</span> },
    { header: 'Email Address', accessor: 'email', cell: (row) => <span className="text-slate-400 text-xs">{row.email}</span> },
    { header: 'Duty Status', accessor: 'status', cell: (row) => <Badge>{row.status || 'On Duty'}</Badge> }
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Nursing Staff Directory</h2>
          <p className="text-xs text-slate-500">View roster shifts and active duty designations for head nurses</p>
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
          Register Nursing Staff
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
            data={nurses}
            searchKey="name"
            placeholder="Search nurse by name..."
            emptyMessage="No nursing staff registered."
          />
        </div>
      </Card>

      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Register Nursing Staff (Nurse Account)"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAdd} loading={submitting}>
              Create Nurse Account
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
                placeholder="e.g. Kavya"
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
                placeholder="e.g. Sundaram"
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
                placeholder="e.g. kavya.s@medisync.com"
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
                placeholder="e.g. 9876543211"
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
              <label className="block text-xs font-semibold text-slate-700">Clinical Department</label>
              <select
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
              >
                <option value="General Nursing">General Nursing</option>
                <option value="ICU">ICU Ward</option>
                <option value="General Ward">General Ward</option>
                <option value="Emergency">Emergency Room</option>
                <option value="Pediatric Ward">Pediatric Ward</option>
                <option value="Health Screening">Health Screening</option>
                <option value="Diagnostic Services">Diagnostic Services</option>
                <option value="Laboratory Support">Laboratory Support</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Shift Schedule</label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
              >
                <option value="Morning">Morning Shift</option>
                <option value="Evening">Evening Shift</option>
                <option value="Night">Night Shift</option>
                <option value="General Duty">General Duty</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default NursesPage;
