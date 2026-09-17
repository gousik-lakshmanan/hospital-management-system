import React, { useState, useEffect } from 'react';
import { Utensils, Plus, Sparkles, HeartPulse } from 'lucide-react';
import { useDietPlan } from '../../context/DietPlanContext';
import { patientService } from '../../services/api';
import Card from '../common/Card';
import Table from '../common/Table';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Modal from '../common/Modal';
import { useNavigate } from 'react-router-dom';

export const DietPlanningPage = () => {
  const navigate = useNavigate();
  const { dietPlans, loading, assignDietPlan } = useDietPlan();

  const [patients, setPatients] = useState([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Modal form states
  const [patId, setPatId] = useState('');
  const [breakfast, setBreakfast] = useState('');
  const [lunch, setLunch] = useState('');
  const [dinner, setDinner] = useState('');
  const [snacks, setSnacks] = useState('Green tea, mixed walnuts');
  const [calories, setCalories] = useState('2000');
  const [water, setWater] = useState('2.5');
  const [clinicalNote, setClinicalNote] = useState('');

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await patientService.getPatients();
        if (res.success && Array.isArray(res.data)) {
          setPatients(res.data);
        }
      } catch (err) {
        console.warn('Failed to fetch patients list for diet planning:', err);
      }
    };
    fetchPatients();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!patId || !breakfast.trim() || !lunch.trim() || !dinner.trim()) return;

    try {
      setSubmitting(true);
      await assignDietPlan({
        patientId: patId,
        breakfast: breakfast.trim(),
        lunch: lunch.trim(),
        dinner: dinner.trim(),
        snacks: snacks.trim(),
        calories: parseInt(calories, 10) || 2000,
        water: parseFloat(water) || 2.5,
        clinicalNote: clinicalNote.trim()
      });

      setIsAddOpen(false);
      setPatId('');
      setBreakfast('');
      setLunch('');
      setDinner('');
      setSnacks('Green tea, mixed walnuts');
      setCalories('2000');
      setWater('2.5');
      setClinicalNote('');
    } catch (err) {
      // Error handled in context
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Patient Name',
      accessor: 'patientName',
      cell: (row) => (
        <div>
          <span className="font-semibold text-slate-800 block text-xs">{row.patientName}</span>
          <span className="text-[10px] text-slate-400 capitalize">
            {row.questionnaire?.currentDisease !== 'none' ? row.questionnaire?.currentDisease : 'General Recovery'}
          </span>
        </div>
      )
    },
    {
      header: 'Daily Budget',
      cell: (row) => <Badge variant="info">{row.caloriesTarget} kcal</Badge>
    },
    {
      header: 'Water Target',
      cell: (row) => <span className="text-slate-600 font-semibold text-xs">{row.waterTarget} L/day</span>
    },
    {
      header: 'Breakfast Target',
      cell: (row) => (
        <span className="text-xs text-slate-600 truncate max-w-[150px] block">
          {row.todayTarget?.breakfast || row.weeklyMeals?.[0]?.breakfast || '—'}
        </span>
      )
    },
    {
      header: 'Lunch Target',
      cell: (row) => (
        <span className="text-xs text-slate-600 truncate max-w-[150px] block">
          {row.todayTarget?.lunch || row.weeklyMeals?.[0]?.lunch || '—'}
        </span>
      )
    },
    {
      header: 'Dinner Target',
      cell: (row) => (
        <span className="text-xs text-slate-600 truncate max-w-[150px] block">
          {row.todayTarget?.dinner || row.weeklyMeals?.[0]?.dinner || '—'}
        </span>
      )
    },
    {
      header: 'Source',
      cell: (row) => (
        <Badge variant={row.source === 'AI_GENERATED' ? 'success' : 'default'}>
          {row.source === 'AI_GENERATED' ? 'AI Optimized' : 'Clinician Assigned'}
        </Badge>
      )
    }
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
            data={dietPlans}
            searchKey="patientName"
            placeholder="Search patient diet plans..."
            emptyMessage={loading ? "Loading diet sheets..." : "No patient diet plans allocated."}
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
            <Button variant="primary" loading={submitting} onClick={handleCreate}>Save Diet Sheet</Button>
          </div>
        }
      >
        <form className="space-y-4" onSubmit={handleCreate}>
          <div>
            <label className="block text-xs font-semibold text-slate-700">Patient Directory *</label>
            <select
              value={patId}
              onChange={(e) => setPatId(e.target.value)}
              className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
              required
            >
              <option value="">-- Choose Patient --</option>
              {patients.map(p => (
                <option key={p._id} value={p._id}>{p.name} {p.room ? `(${p.room})` : ''} - ID: {p.patientId || p._id.slice(-6)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Breakfast Calories & Menu *</label>
            <input
              type="text"
              value={breakfast}
              onChange={(e) => setBreakfast(e.target.value)}
              placeholder="e.g. Milk with oats, banana, soaked almonds"
              className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Lunch Calories & Menu *</label>
            <input
              type="text"
              value={lunch}
              onChange={(e) => setLunch(e.target.value)}
              placeholder="e.g. Boiled brown rice, dal, spinach curry, curd"
              className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Dinner Menu *</label>
            <input
              type="text"
              value={dinner}
              onChange={(e) => setDinner(e.target.value)}
              placeholder="e.g. Whole wheat rotis, vegetable clear soup"
              className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Snacks & Beverages Target</label>
            <input
              type="text"
              value={snacks}
              onChange={(e) => setSnacks(e.target.value)}
              placeholder="e.g. Green tea, mixed walnuts, spiced buttermilk"
              className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Caloric Target (kcal)</label>
              <input
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="2000"
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Water Target (Liters)</label>
              <input
                type="number"
                step="0.1"
                value={water}
                onChange={(e) => setWater(e.target.value)}
                placeholder="2.5"
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Clinical Dietitian Rationale / Notes</label>
            <textarea
              rows={2}
              value={clinicalNote}
              onChange={(e) => setClinicalNote(e.target.value)}
              placeholder="e.g. Low sodium DASH dietary protocol for hypertension"
              className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DietPlanningPage;

