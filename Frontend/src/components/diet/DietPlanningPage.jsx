import React, { useState } from 'react';
import { Utensils, Plus, Eye, Sparkles } from 'lucide-react';
import { mockDietPlans, mockPatients } from '../../data/mockData';
import Card from '../common/Card';
import Table from '../common/Table';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Modal from '../common/Modal';
import { useNavigate } from 'react-router-dom';

export const DietPlanningPage = () => {
  const navigate = useNavigate();
  const [diets, setDiets] = useState(mockDietPlans);
  const [patients, setPatients] = useState(mockPatients);
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [patId, setPatId] = useState('');
  const [breakfast, setBreakfast] = useState('');
  const [lunch, setLunch] = useState('');
  const [dinner, setDinner] = useState('');
  const [calories, setCalories] = useState('2000 kcal');

  const handleCreate = (e) => {
    e.preventDefault();
    if (!patId || !breakfast || !lunch || !dinner) return;

    const newDiet = {
      id: patId,
      breakfast,
      lunch,
      dinner,
      snacks: 'Green tea, mixed walnuts',
      calories,
      nutrition: 'Carbs: 50% | Protein: 25% | Fats: 25%',
      waterIntake: '2.5L / 3.0L',
      streak: 1
    };

    mockDietPlans.push(newDiet);
    setDiets([...mockDietPlans]);
    setIsAddOpen(false);

    setPatId('');
    setBreakfast('');
    setLunch('');
    setDinner('');
  };

  const columns = [
    { header: 'Patient ID', accessor: 'id', cell: (row) => <span className="font-semibold">{row.id}</span> },
    {
      header: 'Patient Name',
      cell: (row) => {
        const pat = patients.find(p => p.id === row.id);
        return <span className="font-semibold text-slate-800">{pat?.name || 'External Patient'}</span>;
      }
    },
    { header: 'Daily Budget', accessor: 'calories', cell: (row) => <Badge variant="info">{row.calories}</Badge> },
    { header: 'Breakfast Target', accessor: 'breakfast', cell: (row) => <span className="text-xs text-slate-600 truncate max-w-[150px] block">{row.breakfast}</span> },
    { header: 'Lunch Target', accessor: 'lunch', cell: (row) => <span className="text-xs text-slate-600 truncate max-w-[150px] block">{row.lunch}</span> },
    { header: 'Dinner Target', accessor: 'dinner', cell: (row) => <span className="text-xs text-slate-600 truncate max-w-[150px] block">{row.dinner}</span> },
    { header: 'Water Intake', accessor: 'waterIntake', cell: (row) => <span className="text-slate-500 font-semibold">{row.waterIntake}</span> }
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Dietary Planning Directory</h2>
          <p className="text-xs text-slate-500">Track and assign recovery diet sheets to admitted patient wards</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon={Sparkles} onClick={() => navigate('/ai/diet-planner')}>
            Consult AI Planner
          </Button>
          <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsAddOpen(true)}>
            Assign Diet Sheet
          </Button>
        </div>
      </div>

      <Card noPadding>
        <div className="p-4">
          <Table
            columns={columns}
            data={diets}
            searchKey="id"
            placeholder="Search patient ID..."
            emptyMessage="No patient diet plans allocated."
          />
        </div>
      </Card>

      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Assign Patient Recovery Diet Sheet"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate}>Save Diet Sheet</Button>
          </div>
        }
      >
        <form className="space-y-4" onSubmit={handleCreate}>
          <div>
            <label className="block text-xs font-semibold text-slate-700">Patient Directory</label>
            <select
              value={patId}
              onChange={(e) => setPatId(e.target.value)}
              className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
              required
            >
              <option value="">-- Choose Patient --</option>
              {patients.filter(p => p.status !== 'Outpatient').map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.room})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Breakfast Calories & Menu</label>
            <input
              type="text"
              value={breakfast}
              onChange={(e) => setBreakfast(e.target.value)}
              placeholder="e.g. Milk with oats, banana"
              className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Lunch Calories & Menu</label>
            <input
              type="text"
              value={lunch}
              onChange={(e) => setLunch(e.target.value)}
              placeholder="e.g. Boiled rice, dal, spinach curry"
              className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Dinner Menu</label>
            <input
              type="text"
              value={dinner}
              onChange={(e) => setDinner(e.target.value)}
              placeholder="e.g. Whole wheat rotis, vegetable soup"
              className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Caloric Budget Target</label>
            <input
              type="text"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="e.g. 1800 kcal"
              className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DietPlanningPage;
