import React, { useState } from 'react';
import { Pill, Plus, Layers, ShieldAlert, Sparkles, PlusCircle } from 'lucide-react';
import { mockMedicines, mockPatients, pharmacyService } from '../../data/mockData';
import { useAuth } from '../../hooks/useAuth';
import Card from '../common/Card';
import Table from '../common/Table';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Modal from '../common/Modal';

export const PharmacyPage = () => {
  const { currentRole } = useAuth();
  const [medicines, setMedicines] = useState(mockMedicines);
  const [patients, setPatients] = useState(mockPatients);

  // Modals open states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDispenseModalOpen, setIsDispenseModalOpen] = useState(false);

  // Add Medicine Form
  const [medName, setMedName] = useState('');
  const [medType, setMedType] = useState('Tablet');
  const [medStock, setMedStock] = useState('');
  const [medLimit, setMedLimit] = useState('');
  const [medPrice, setMedPrice] = useState('');
  const [medExpiry, setMedExpiry] = useState('');

  // Dispense Form
  const [dispPatientId, setDispPatientId] = useState('');
  const [dispMedId, setDispMedId] = useState('');
  const [dispQty, setDispQty] = useState(1);

  const handleAddMedicine = (e) => {
    e.preventDefault();
    if (!medName || !medStock || !medLimit || !medPrice || !medExpiry) return;

    pharmacyService.create({
      name: medName,
      type: medType,
      stock: medStock,
      threshold: medLimit,
      price: medPrice,
      expiryDate: medExpiry
    });

    setMedicines([...mockMedicines]);
    setIsAddModalOpen(false);

    // Clear
    setMedName('');
    setMedStock('');
    setMedLimit('');
    setMedPrice('');
    setMedExpiry('');
  };

  const handleDispenseMed = (e) => {
    e.preventDefault();
    if (!dispPatientId || !dispMedId || !dispQty) return;

    const success = pharmacyService.dispense(dispMedId, dispQty);
    if (success) {
      const pat = mockPatients.find(p => p.id === dispPatientId);
      const medObj = mockMedicines.find(m => m.id === dispMedId);
      if (pat && medObj) {
        const presc = pat.prescriptions.find(pr => pr.medicine.toLowerCase().includes(medObj.name.toLowerCase()));
        if (presc) presc.pharmacistGiven = true;
      }
      
      setMedicines([...mockMedicines]);
      setPatients([...mockPatients]);
      setIsDispenseModalOpen(false);

      // Clear
      setDispPatientId('');
      setDispMedId('');
      setDispQty(1);
    } else {
      alert('Insufficient stock to dispense!');
    }
  };

  const columns = [
    { header: 'Medicine ID', accessor: 'id', cell: (row) => <span className="font-semibold">{row.id}</span> },
    { header: 'Generic Name', accessor: 'name', cell: (row) => <span className="font-semibold text-slate-800">{row.name}</span> },
    { header: 'Type', accessor: 'type', cell: (row) => <span className="text-slate-500 font-medium">{row.type}</span> },
    { header: 'Stock Bags', accessor: 'stock', cell: (row) => <span className={`font-semibold ${row.stock === 0 ? 'text-rose-600' : (row.stock <= row.threshold ? 'text-amber-600' : 'text-slate-700')}`}>{row.stock} units</span> },
    { header: 'Unit Price', accessor: 'price', cell: (row) => <span className="text-slate-600 font-medium">₹{row.price}</span> },
    { header: 'Expiry Date', accessor: 'expiryDate', cell: (row) => <span className="text-slate-400 font-medium">{row.expiryDate}</span> },
    { header: 'Inventory Status', accessor: 'status', cell: (row) => <Badge>{row.status}</Badge> }
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Pharmacy & Medicines stock</h2>
          <p className="text-xs text-slate-500">Formulations lists, unit thresholds, and clinical dispatch controls</p>
        </div>
        {currentRole !== 'patient' && currentRole !== 'doctor' && currentRole !== 'nurse' && (
          <div className="flex gap-2">
            <Button variant="primary" icon={Plus} onClick={() => setIsAddModalOpen(true)}>
              Register Formulation
            </Button>
            {currentRole === 'pharmacist' && (
              <Button variant="secondary" icon={Pill} onClick={() => setIsDispenseModalOpen(true)}>
                Dispense Prescriptions
              </Button>
            )}
          </div>
        )}
      </div>

      <Card noPadding>
        <div className="p-4">
          <Table
            columns={columns}
            data={medicines}
            searchKey="name"
            placeholder="Search medicine by name..."
            emptyMessage="No medicines registered."
          />
        </div>
      </Card>

      {/* Add Medicine Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register Formulation Medicine"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddMedicine}>Register Medicine</Button>
          </div>
        }
      >
        <form className="space-y-4" onSubmit={handleAddMedicine}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Generic Name</label>
              <input
                type="text"
                value={medName}
                onChange={(e) => setMedName(e.target.value)}
                placeholder="e.g. Atorvastatin 10mg"
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Formulation Type</label>
              <select
                value={medType}
                onChange={(e) => setMedType(e.target.value)}
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
              >
                <option value="Tablet">Tablet</option>
                <option value="Capsule">Capsule</option>
                <option value="Syrup">Syrup</option>
                <option value="Injection">Injection</option>
                <option value="Inhaler">Inhaler</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Initial Stock</label>
              <input
                type="number"
                value={medStock}
                onChange={(e) => setMedStock(e.target.value)}
                placeholder="e.g. 500"
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Alert Threshold Limit</label>
              <input
                type="number"
                value={medLimit}
                onChange={(e) => setMedLimit(e.target.value)}
                placeholder="e.g. 100"
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Unit Price (₹)</label>
              <input
                type="number"
                step="0.01"
                value={medPrice}
                onChange={(e) => setMedPrice(e.target.value)}
                placeholder="e.g. 12.50"
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Expiry Date</label>
              <input
                type="date"
                value={medExpiry}
                onChange={(e) => setMedExpiry(e.target.value)}
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
                required
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Dispense Modal */}
      <Modal
        isOpen={isDispenseModalOpen}
        onClose={() => setIsDispenseModalOpen(false)}
        title="Dispense Medicine"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDispenseModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleDispenseMed}>Dispense Units</Button>
          </div>
        }
      >
        <form className="space-y-4" onSubmit={handleDispenseMed}>
          <div>
            <label className="block text-xs font-semibold text-slate-700">Patient Directory</label>
            <select
              value={dispPatientId}
              onChange={(e) => setDispPatientId(e.target.value)}
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
            <label className="block text-xs font-semibold text-slate-700">Inventory Formulation</label>
            <select
              value={dispMedId}
              onChange={(e) => setDispMedId(e.target.value)}
              className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
              required
            >
              <option value="">-- Choose Medicine --</option>
              {medicines.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.stock} units left)</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Quantity</label>
            <input
              type="number"
              min="1"
              value={dispQty}
              onChange={(e) => setDispQty(e.target.value)}
              className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PharmacyPage;
