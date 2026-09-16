import React, { useState, useEffect } from 'react';
import { Pill, Plus, Layers, ShieldAlert, Sparkles, PlusCircle } from 'lucide-react';
import { usePharmacy } from '../../context/PharmacyContext';
import { usePrescriptions } from '../../context/PrescriptionContext';
import { useAuth } from '../../hooks/useAuth';
import { patientService } from '../../services/api';
import Card from '../common/Card';
import Table from '../common/Table';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Modal from '../common/Modal';

export const PharmacyPage = () => {
  const { currentRole } = useAuth();
  const { medicines, loading, createMedicine, adjustStock } = usePharmacy();
  const { prescriptions, dispensePrescription } = usePrescriptions();

  const [patients, setPatients] = useState([]);

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

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await patientService.getPatients();
        if (res.success && Array.isArray(res.patients)) {
          setPatients(res.patients);
        }
      } catch (err) {
        console.error('Failed to load patients for pharmacy:', err);
      }
    };

    fetchPatients();
  }, []);

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
      setErrorMessage(res.message || 'Failed to register medicine');
    }
  };

  const handleDispensePrescription = async (e) => {
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

  const pendingPrescriptions = prescriptions.filter((p) => p.status === 'Pending');

  const columns = [
    {
      header: 'Medicine Name',
      accessor: 'name',
      cell: (row) => (
        <div>
          <span className="font-semibold text-slate-800 block text-xs">{row.name}</span>
          <span className="text-[10px] text-slate-400 font-mono">{row.genericName || row.name} · {row.batchNumber}</span>
        </div>
      ),
    },
    { header: 'Category', accessor: 'type', cell: (row) => <span className="text-slate-500 font-medium text-xs">{row.category || row.type}</span> },
    {
      header: 'Available Stock',
      accessor: 'stock',
      cell: (row) => (
        <span
          className={`font-semibold text-xs ${
            row.stock === 0
              ? 'text-rose-600'
              : row.stock <= (row.reorderLevel || row.threshold)
              ? 'text-amber-600'
              : 'text-slate-700'
          }`}
        >
          {row.quantity ?? row.stock} units
        </span>
      ),
    },
    { header: 'Unit Price', accessor: 'price', cell: (row) => <span className="text-slate-600 font-medium text-xs">₹{row.unitPrice ?? row.price}</span> },
    {
      header: 'Expiry Date',
      accessor: 'expiryDate',
      cell: (row) => (
        <span className="text-slate-400 font-medium text-xs">
          {row.expiryDate ? new Date(row.expiryDate).toLocaleDateString() : '—'}
        </span>
      ),
    },
    { header: 'Inventory Status', accessor: 'status', cell: (row) => <Badge>{row.status}</Badge> },
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
            <Button variant="primary" icon={Plus} onClick={() => { setIsAddModalOpen(true); setErrorMessage(''); }}>
              Register Formulation
            </Button>
            {currentRole === 'pharmacist' && (
              <Button variant="secondary" icon={Pill} onClick={() => { setIsDispenseModalOpen(true); setErrorMessage(''); }}>
                Dispense Prescriptions ({pendingPrescriptions.length})
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
            emptyMessage={loading ? 'Loading pharmacy formulations...' : 'No medicines registered.'}
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
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
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
                placeholder="e.g. Paracetamol 500mg"
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
                placeholder="e.g. Paracetamol"
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
                placeholder="e.g. PCM-2026-99"
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Initial Stock</label>
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
              <label className="block text-xs font-semibold text-slate-700">Alert Threshold Limit</label>
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
              <label className="block text-xs font-semibold text-slate-700">Unit Price (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={medPrice}
                onChange={(e) => setMedPrice(e.target.value)}
                placeholder="e.g. 15.00"
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
        title="Dispense Doctor Prescriptions"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDispenseModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDispensePrescription}
              disabled={isSubmitting || pendingPrescriptions.length === 0 || !dispPrescriptionId}
            >
              {isSubmitting ? 'Dispensing...' : 'Dispense Prescription'}
            </Button>
          </div>
        }
      >
        <form className="space-y-4" onSubmit={handleDispensePrescription}>
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

export default PharmacyPage;
