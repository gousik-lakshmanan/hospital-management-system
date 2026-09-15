import React, { useState } from 'react';
import { Stethoscope, Plus, HelpCircle, Activity } from 'lucide-react';
import { mockDoctors } from '../../data/mockData';
import Card from '../common/Card';
import Table from '../common/Table';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Modal from '../common/Modal';

export const DoctorsPage = () => {
  const [doctors, setDoctors] = useState(mockDoctors);
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('Cardiology');
  const [email, setEmail] = useState('');
  const [room, setRoom] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!name || !email) return;

    const newDoc = {
      id: `D-${200 + doctors.length + 1}`,
      name,
      specialty,
      email,
      status: 'On Duty',
      room: room || 'Consultation Room A',
      appointmentsCount: 0
    };

    mockDoctors.push(newDoc);
    setDoctors([...mockDoctors]);
    setIsAddOpen(false);

    setName('');
    setEmail('');
    setRoom('');
  };

  const columns = [
    { header: 'Practitioner ID', accessor: 'id', cell: (row) => <span className="font-semibold">{row.id}</span> },
    { header: 'Physician Name', accessor: 'name', cell: (row) => <span className="font-semibold text-slate-800">{row.name}</span> },
    { header: 'Specialty', accessor: 'specialty', cell: (row) => <Badge variant="info">{row.specialty}</Badge> },
    { header: 'Consultation Room', accessor: 'room', cell: (row) => <span className="text-slate-500 text-xs">{row.room}</span> },
    { header: 'Active Queue Count', accessor: 'appointmentsCount', cell: (row) => <span className="font-medium text-slate-600">{row.appointmentsCount} Appts</span> },
    { header: 'Intake Status', accessor: 'status', cell: (row) => <Badge>{row.status}</Badge> }
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Medical Practitioners Directory</h2>
          <p className="text-xs text-slate-500">View duty status and scheduling counts for on-call clinical doctors</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setIsAddOpen(true)}>
          Register Practitioner
        </Button>
      </div>

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
        title="Register Practitioner Staff"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAdd}>Add Physician</Button>
          </div>
        }
      >
        <form className="space-y-4" onSubmit={handleAdd}>
          <div>
            <label className="block text-xs font-semibold text-slate-700">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dr. Ramesh Gupta"
              className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Department Specialty</label>
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
              >
                <option value="Cardiology">Cardiology</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Orthopedics">Orthopedics</option>
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
                placeholder="e.g. Cabin 104"
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. ramesh.gupta@medisync.com"
              className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DoctorsPage;
