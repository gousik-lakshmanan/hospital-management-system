import React, { useState } from 'react';
import { HeartHandshake, Plus, Clock } from 'lucide-react';
import { mockNurses } from '../../data/mockData';
import Card from '../common/Card';
import Table from '../common/Table';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Modal from '../common/Modal';

export const NursesPage = () => {
  const [nurses, setNurses] = useState(mockNurses);
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  const [name, setName] = useState('');
  const [dept, setDept] = useState('ICU');
  const [shift, setShift] = useState('Morning');
  const [email, setEmail] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!name || !email) return;

    const newNurse = {
      id: `N-${300 + nurses.length + 1}`,
      name,
      department: dept,
      shift,
      status: 'On Duty',
      email
    };

    mockNurses.push(newNurse);
    setNurses([...mockNurses]);
    setIsAddOpen(false);

    setName('');
    setEmail('');
  };

  const columns = [
    { header: 'Nurse ID', accessor: 'id', cell: (row) => <span className="font-semibold">{row.id}</span> },
    { header: 'Nursing Staff Name', accessor: 'name', cell: (row) => <span className="font-semibold text-slate-800">{row.name}</span> },
    { header: 'Clinical Department', accessor: 'department', cell: (row) => <Badge variant="info">{row.department}</Badge> },
    { header: 'Shift timing', accessor: 'shift', cell: (row) => <span className="text-slate-500 font-medium">{row.shift} Shift</span> },
    { header: 'Email Address', accessor: 'email', cell: (row) => <span className="text-slate-400 text-xs">{row.email}</span> },
    { header: 'Duty Status', accessor: 'status', cell: (row) => <Badge>{row.status}</Badge> }
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Nursing Staff Directory</h2>
          <p className="text-xs text-slate-500">View roster shifts and active duty designations for head nurses</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setIsAddOpen(true)}>
          Register Nursing Staff
        </Button>
      </div>

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
        title="Register Nursing Staff"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAdd}>Add Nurse</Button>
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
              placeholder="e.g. Nurse Priya Nair"
              className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Clinical Department</label>
              <select
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
              >
                <option value="ICU">ICU Ward</option>
                <option value="General Ward">General Ward</option>
                <option value="Emergency">Emergency Room</option>
                <option value="Pediatric Ward">Pediatric Ward</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Shift Schedule</label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
              >
                <option value="Morning">Morning Shift</option>
                <option value="Evening">Evening Shift</option>
                <option value="Night">Night Shift</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. priya.nair@medisync.com"
              className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default NursesPage;
