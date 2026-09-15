import React, { useState } from 'react';
import { Pill, Activity, ShieldAlert, Plus, Layers, Eye, CheckCircle2, ChevronRight, DollarSign } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { mockMedicines, mockPatients, pharmacyService } from '../../data/mockData';

export const PharmacistDashboard = () => {
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

  // Quick replenish states
  const [replenishMedId, setReplenishMedId] = useState('');
  const [replenishQty, setReplenishQty] = useState('');

  const stats = [
    { label: 'Total Formulations', value: medicines.length.toString(), icon: Layers, color: 'text-blue-600 bg-blue-50' },
    { label: 'Low Stock Alerts', value: medicines.filter(m => m.status === 'LOW STOCK').length.toString(), icon: ShieldAlert, color: 'text-amber-600 bg-amber-50' },
    { label: 'Out of Stock', value: medicines.filter(m => m.status === 'OUT OF STOCK').length.toString(), icon: ShieldAlert, color: 'text-rose-600 bg-rose-50' },
    { label: 'Expiring Soon', value: medicines.filter(m => m.status === 'EXPIRING SOON').length.toString(), icon: Activity, color: 'text-pink-600 bg-pink-50' }
  ];

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

    // Clear form
    setMedName('');
    setMedStock('');
    setMedLimit('');
    setMedPrice('');
    setMedExpiry('');
  };

  const handleQuickReplenish = (e) => {
    e.preventDefault();
    if (!replenishMedId || !replenishQty) return;

    pharmacyService.addStock(replenishMedId, replenishQty);
    setMedicines([...mockMedicines]);
    setReplenishMedId('');
    setReplenishQty('');
  };

  const handleDispenseMed = (e) => {
    e.preventDefault();
    if (!dispPatientId || !dispMedId || !dispQty) return;

    const success = pharmacyService.dispense(dispMedId, dispQty);
    if (success) {
      // Mark matching medicine as dispensed in patient record if applicable
      const pat = mockPatients.find(p => p.id === dispPatientId);
      const medObj = mockMedicines.find(m => m.id === dispMedId);
      if (pat && medObj) {
        const presc = pat.prescriptions.find(pr => pr.medicine.toLowerCase().includes(medObj.name.toLowerCase()));
        if (presc) presc.pharmacistGiven = true;
      }
      
      setMedicines([...mockMedicines]);
      setPatients([...mockPatients]);
      setIsDispenseModalOpen(false);

      // Clear Form
      setDispPatientId('');
      setDispMedId('');
      setDispQty(1);
    } else {
      alert('Insufficient stock to dispense this formulation quantity!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-blue-600 font-semibold tracking-wide uppercase">Pharmacy Management</span>
          <h2 className="text-xl font-bold text-slate-800 mt-1">Hello, Pharmacist John</h2>
          <p className="text-xs text-slate-500 mt-0.5">Central Pharmacy Counter B | Managing prescription inventory</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="primary" icon={Plus} onClick={() => setIsAddModalOpen(true)}>
            Add Formulation
          </Button>
          <Button variant="secondary" icon={Pill} onClick={() => setIsDispenseModalOpen(true)}>
            Dispense Medicines
          </Button>
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

      {/* Grid panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inventory Table */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Current Dispensary Inventory" subtitle="Overview of medicine stocks">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-100 font-bold">
                    <th className="p-3">Med ID</th>
                    <th className="p-3">Medicine</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">In-Stock</th>
                    <th className="p-3">Expiry</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {medicines.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-slate-700">{m.id}</td>
                      <td className="p-3 font-semibold text-slate-700">{m.name}</td>
                      <td className="p-3 text-slate-500">{m.type}</td>
                      <td className="p-3 text-slate-600 font-medium">{m.stock} units</td>
                      <td className="p-3 text-slate-400">{m.expiryDate}</td>
                      <td className="p-3">
                        <Badge>{m.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right column: Prescriptions pending & Replenish */}
        <div className="space-y-6">
          {/* Quick replenish panel */}
          <Card title="Quick Stock Replenish" subtitle="Add formulation bags instantly">
            <form onSubmit={handleQuickReplenish} className="space-y-3">
              <div>
                <label className="block text-[10px] text-slate-500 font-semibold">Select Formulation</label>
                <select
                  value={replenishMedId}
                  onChange={(e) => setReplenishMedId(e.target.value)}
                  className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
                  required
                >
                  <option value="">-- Choose Medicine --</option>
                  {medicines.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.stock} units)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-semibold">Replenish Quantity</label>
                <input
                  type="number"
                  value={replenishQty}
                  onChange={(e) => setReplenishQty(e.target.value)}
                  placeholder="e.g. 100"
                  className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
                  required
                />
              </div>
              <Button type="submit" variant="outline" size="sm" className="w-full">
                Replenish Inventory
              </Button>
            </form>
          </Card>

          {/* Pending prescriptions */}
          <Card title="Doctor Prescriptions Alert" subtitle="Admitted patient pending orders">
            <div className="space-y-3">
              {patients.filter(p => p.prescriptions && p.prescriptions.some(pr => !pr.pharmacistGiven)).map((p) => (
                <div key={p.id} className="p-3 border border-slate-200 rounded-xl space-y-2 bg-slate-50/50">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-xs text-slate-800">{p.name}</span>
                    <Badge className="bg-amber-50 text-amber-700">Pending</Badge>
                  </div>
                  <div className="space-y-1">
                    {p.prescriptions.filter(pr => !pr.pharmacistGiven).map((pr, idx) => (
                      <div key={idx} className="text-[10px] text-slate-500 flex justify-between">
                        <span>{pr.medicine} ({pr.dosage})</span>
                        <span>{pr.duration}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end pt-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={ChevronRight}
                      onClick={() => {
                        setDispPatientId(p.id);
                        // pre-select first pending medicine if matches inventory
                        const pendingMed = p.prescriptions.find(pr => !pr.pharmacistGiven);
                        const matchInInv = medicines.find(m => pendingMed?.medicine.toLowerCase().includes(m.name.toLowerCase()));
                        if (matchInInv) setDispMedId(matchInInv.id);
                        setIsDispenseModalOpen(true);
                      }}
                    >
                      Process Prescription
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Add Formulation Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Formulation Medicine to Inventory"
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
              <label className="block text-xs font-semibold text-slate-700">Medicine Generic Name</label>
              <input
                type="text"
                value={medName}
                onChange={(e) => setMedName(e.target.value)}
                placeholder="e.g. Lipitor 10mg"
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
              <label className="block text-xs font-semibold text-slate-700">Initial Stock Count</label>
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
              <label className="block text-xs font-semibold text-slate-700">Threshold Low Limit Alert</label>
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
              <label className="block text-xs font-semibold text-slate-700">Unit Price (INR)</label>
              <input
                type="number"
                step="0.01"
                value={medPrice}
                onChange={(e) => setMedPrice(e.target.value)}
                placeholder="e.g. 45.00"
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

      {/* Dispense Prescriptions Modal */}
      <Modal
        isOpen={isDispenseModalOpen}
        onClose={() => setIsDispenseModalOpen(false)}
        title="Dispense Medicine Form"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDispenseModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleDispenseMed}>Dispense Units</Button>
          </div>
        }
      >
        <form className="space-y-4" onSubmit={handleDispenseMed}>
          <div>
            <label className="block text-xs font-semibold text-slate-700">Select Patient Profile</label>
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
            <label className="block text-xs font-semibold text-slate-700">Select Inventory Formulation</label>
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
            <label className="block text-xs font-semibold text-slate-700">Dispense Quantity</label>
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

export default PharmacistDashboard;
