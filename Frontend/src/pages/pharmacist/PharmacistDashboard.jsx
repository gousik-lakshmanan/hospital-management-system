import React, { useState } from 'react';
import { Pill, Activity, ShieldAlert, Plus, Layers, Eye, CheckCircle2, ChevronRight, DollarSign } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { usePharmacy } from '../../context/PharmacyContext';
import { usePrescriptions } from '../../context/PrescriptionContext';

export const PharmacistDashboard = () => {
  const {
    medicines,
    totalFormulations,
    lowStockCount,
    outOfStockCount,
    expiringSoonCount,
    createMedicine,
    adjustStock,
  } = usePharmacy();

  const { prescriptions, dispensePrescription } = usePrescriptions();

  // Modals open states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDispenseModalOpen, setIsDispenseModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Add Medicine Form
  const [medName, setMedName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [medType, setMedType] = useState('Tablet');
  const [batchNumber, setBatchNumber] = useState('');
  const [medStock, setMedStock] = useState('');
  const [medLimit, setMedLimit] = useState('10');
  const [medPrice, setMedPrice] = useState('');
  const [medExpiry, setMedExpiry] = useState('');

  // Dispense Form
  const [dispPrescriptionId, setDispPrescriptionId] = useState('');

  // Quick replenish states
  const [replenishMedId, setReplenishMedId] = useState('');
  const [replenishQty, setReplenishQty] = useState('');

  const stats = [
    { label: 'Total Formulations', value: totalFormulations.toString(), icon: Layers, color: 'text-blue-600 bg-blue-50' },
    { label: 'Low Stock Alerts', value: lowStockCount.toString(), icon: ShieldAlert, color: 'text-amber-600 bg-amber-50' },
    { label: 'Out of Stock', value: outOfStockCount.toString(), icon: ShieldAlert, color: 'text-rose-600 bg-rose-50' },
    { label: 'Expiring Soon', value: expiringSoonCount.toString(), icon: Activity, color: 'text-pink-600 bg-pink-50' },
  ];

  const pendingPrescriptions = prescriptions.filter((pr) => pr.status === 'Pending');

  const handleAddMedicine = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!medName || !medStock || !medLimit || !medPrice || !medExpiry || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage('');

    const res = await createMedicine({
      name: medName,
      genericName: genericName || medName,
      category: medType,
      dosageForm: medType,
      batchNumber: batchNumber || `BAT-${Date.now().toString().slice(-6)}`,
      quantity: parseInt(medStock) || 0,
      reorderLevel: parseInt(medLimit) || 10,
      unitPrice: parseFloat(medPrice) || 0,
      expiryDate: medExpiry,
    });

    setIsSubmitting(false);

    if (res.success) {
      setIsAddModalOpen(false);
      setMedName('');
      setGenericName('');
      setBatchNumber('');
      setMedStock('');
      setMedLimit('10');
      setMedPrice('');
      setMedExpiry('');
    } else {
      setErrorMessage(res.message || 'Failed to add formulation');
    }
  };

  const handleQuickReplenish = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!replenishMedId || !replenishQty || isSubmitting) return;

    setIsSubmitting(true);
    await adjustStock(replenishMedId, parseInt(replenishQty));
    setIsSubmitting(false);

    setReplenishMedId('');
    setReplenishQty('');
  };

  const handleDispenseDirect = async (prescriptionId) => {
    setIsSubmitting(true);
    await dispensePrescription(prescriptionId);
    setIsSubmitting(false);
  };

  const handleDispenseModalSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!dispPrescriptionId || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage('');
    const res = await dispensePrescription(dispPrescriptionId);
    setIsSubmitting(false);

    if (res.success) {
      setIsDispenseModalOpen(false);
      setDispPrescriptionId('');
    } else {
      setErrorMessage(res.message || 'Failed to dispense prescription');
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
          <Button variant="primary" icon={Plus} onClick={() => { setIsAddModalOpen(true); setErrorMessage(''); }}>
            Add Formulation
          </Button>
          <Button variant="secondary" icon={Pill} onClick={() => { setIsDispenseModalOpen(true); setErrorMessage(''); }}>
            Dispense Medicines ({pendingPrescriptions.length})
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
          <Card title="Current Dispensary Inventory" subtitle="Live MongoDB overview of medicine stocks">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-100 font-bold">
                    <th className="p-3">Medicine</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">In-Stock</th>
                    <th className="p-3">Unit Price</th>
                    <th className="p-3">Expiry</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {medicines.map((m) => (
                    <tr key={m._id || m.id} className="hover:bg-slate-50/50">
                      <td className="p-3">
                        <span className="font-semibold text-slate-800 block">{m.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{m.genericName || m.name}</span>
                      </td>
                      <td className="p-3 text-slate-500">{m.category || m.type}</td>
                      <td className="p-3 text-slate-600 font-medium">{m.quantity ?? m.stock} units</td>
                      <td className="p-3 text-slate-600 font-medium">₹{m.unitPrice ?? m.price}</td>
                      <td className="p-3 text-slate-400">{m.expiryDate ? new Date(m.expiryDate).toLocaleDateString() : '—'}</td>
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
                  {medicines.map((m) => (
                    <option key={m._id || m.id} value={m._id || m.id}>
                      {m.name} ({m.quantity ?? m.stock} units)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-semibold">Replenish Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={replenishQty}
                  onChange={(e) => setReplenishQty(e.target.value)}
                  placeholder="e.g. 100"
                  className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
                  required
                />
              </div>
              <Button type="submit" variant="outline" size="sm" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Replenishing...' : 'Replenish Inventory'}
              </Button>
            </form>
          </Card>

          {/* Pending prescriptions */}
          <Card title="Doctor Prescriptions Alert" subtitle="Live patient pending orders">
            <div className="space-y-3">
              {pendingPrescriptions.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-4">No pending prescriptions in queue.</p>
              ) : (
                pendingPrescriptions.map((pr) => (
                  <div key={pr._id} className="p-3 border border-slate-200 rounded-xl space-y-2 bg-slate-50/50">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-xs text-slate-800">{pr.patientName}</span>
                      <Badge className="bg-amber-50 text-amber-700">Pending</Badge>
                    </div>
                    <div className="space-y-1">
                      {pr.medicines?.map((m, idx) => (
                        <div key={idx} className="text-[10px] text-slate-500 flex justify-between">
                          <span>{m.medicineName} ({m.dosage})</span>
                          <span className="font-medium text-slate-700">Qty: {m.quantity}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-[10px] text-slate-400 font-mono">Dr. {pr.prescribedByName}</span>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={ChevronRight}
                        onClick={() => handleDispenseDirect(pr._id)}
                        disabled={isSubmitting}
                      >
                        Dispense
                      </Button>
                    </div>
                  </div>
                ))
              )}
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
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button variant="primary" onClick={handleAddMedicine} disabled={isSubmitting}>
              {isSubmitting ? 'Registering...' : 'Register Medicine'}
            </Button>
          </div>
        }
      >
        <form className="space-y-4" onSubmit={handleAddMedicine}>
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              {errorMessage}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Brand Name</label>
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
              <label className="block text-xs font-semibold text-slate-700">Generic Name</label>
              <input
                type="text"
                value={genericName}
                onChange={(e) => setGenericName(e.target.value)}
                placeholder="e.g. Atorvastatin"
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Formulation Category</label>
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
                <option value="Drops">Drops</option>
                <option value="Powder">Powder</option>
                <option value="Cream">Cream</option>
                <option value="Ointment">Ointment</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Batch Number</label>
              <input
                type="text"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                placeholder="e.g. LIP-2026-01"
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Initial Stock Count</label>
              <input
                type="number"
                min="0"
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
                min="0"
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
                min="0"
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
        title="Dispense Doctor Prescriptions"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDispenseModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handleDispenseModalSubmit}
              disabled={isSubmitting || pendingPrescriptions.length === 0 || !dispPrescriptionId}
            >
              {isSubmitting ? 'Dispensing...' : 'Dispense Units'}
            </Button>
          </div>
        }
      >
        <form className="space-y-4" onSubmit={handleDispenseModalSubmit}>
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              {errorMessage}
            </div>
          )}

          {pendingPrescriptions.length === 0 ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center">
              No pending doctor prescriptions waiting to be dispensed.
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Pending Prescription Order</label>
              <select
                value={dispPrescriptionId}
                onChange={(e) => setDispPrescriptionId(e.target.value)}
                className="w-full p-2.5 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
                required
              >
                <option value="">-- Choose Pending Prescription --</option>
                {pendingPrescriptions.map((pr) => (
                  <option key={pr._id} value={pr._id}>
                    Patient: {pr.patientName} | Dr. {pr.prescribedByName} | {pr.medicines?.map((m) => `${m.medicineName} x${m.quantity}`).join(', ')}
                  </option>
                ))}
              </select>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
};

export default PharmacistDashboard;
