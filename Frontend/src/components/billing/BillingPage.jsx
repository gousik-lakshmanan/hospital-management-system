import React, { useState } from 'react';
import { IndianRupee, Plus, ReceiptText, Eye, CheckCircle2, ShieldAlert } from 'lucide-react';
import { mockBills, mockPatients, billingService } from '../../data/mockData';
import { useAuth } from '../../hooks/useAuth';
import Card from '../common/Card';
import Table from '../common/Table';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Modal from '../common/Modal';

export const BillingPage = () => {
  const { currentRole } = useAuth();
  const [bills, setBills] = useState(mockBills);
  const [patients, setPatients] = useState(mockPatients);

  // Modals
  const [isAddBillOpen, setIsAddBillOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  // New Bill Form
  const [billPatientId, setBillPatientId] = useState('');
  const [roomCharges, setRoomCharges] = useState('');
  const [doctorCharges, setDoctorCharges] = useState('');
  const [medicineCharges, setMedicineCharges] = useState('');
  const [otherCharges, setOtherCharges] = useState('');

  const handleCreateBill = (e) => {
    e.preventDefault();
    if (!billPatientId) return;

    const patient = patients.find(p => p.id === billPatientId);
    if (!patient) return;

    billingService.create({
      patientName: patient.name,
      patientId: billPatientId,
      roomCharges: parseFloat(roomCharges || 0),
      doctorCharges: parseFloat(doctorCharges || 0),
      medicineCharges: parseFloat(medicineCharges || 0),
      otherCharges: parseFloat(otherCharges || 0)
    });

    setBills([...mockBills]);
    setIsAddBillOpen(false);

    // Reset
    setBillPatientId('');
    setRoomCharges('');
    setDoctorCharges('');
    setMedicineCharges('');
    setOtherCharges('');
  };

  const handlePay = (id) => {
    billingService.pay(id);
    setBills([...mockBills]);
    if (selectedInvoice && selectedInvoice.id === id) {
      setSelectedInvoice({ ...selectedInvoice, status: 'Paid' });
    }
  };

  const totalRevenue = bills.filter(b => b.status === 'Paid').reduce((acc, curr) => acc + curr.total, 0);
  const pendingRevenue = bills.filter(b => b.status === 'Pending').reduce((acc, curr) => acc + curr.total, 0);

  const columns = [
    { header: 'Invoice ID', accessor: 'id', cell: (row) => <span className="font-semibold">{row.id}</span> },
    { header: 'Patient Name', accessor: 'patientName', cell: (row) => <span className="font-semibold text-slate-800">{row.patientName}</span> },
    { header: 'Billing Date', accessor: 'date', cell: (row) => <span className="text-slate-400">{row.date}</span> },
    { header: 'Total Due (INR)', accessor: 'total', cell: (row) => <span className="font-semibold text-slate-700">₹{row.total}</span> },
    { header: 'Status', accessor: 'status', cell: (row) => <Badge>{row.status}</Badge> },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            icon={Eye}
            onClick={() => { setSelectedInvoice(row); setIsInvoiceOpen(true); }}
          >
            Invoice
          </Button>
          {row.status === 'Pending' && (currentRole === 'admin' || currentRole === 'receptionist') && (
            <Button
              variant="outline"
              size="sm"
              className="text-emerald-600 border-slate-200 hover:bg-emerald-50"
              onClick={() => handlePay(row.id)}
            >
              Mark Paid
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Financial Billing & Invoices</h2>
          <p className="text-xs text-slate-500">Collect outpatient fees, generate clinical itemized bills, and track revenue</p>
        </div>
        {(currentRole === 'admin' || currentRole === 'receptionist') && (
          <Button variant="primary" icon={Plus} onClick={() => setIsAddBillOpen(true)}>
            Generate Invoice
          </Button>
        )}
      </div>

      {/* Revenue statistics cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Total Paid Revenue</span>
            <span className="text-lg font-extrabold text-slate-800 block mt-0.5">₹{totalRevenue}</span>
          </div>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg shrink-0">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Outstanding Collections</span>
            <span className="text-lg font-extrabold text-slate-800 block mt-0.5">₹{pendingRevenue}</span>
          </div>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg shrink-0">
            <ReceiptText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Total Invoices Issued</span>
            <span className="text-lg font-extrabold text-slate-800 block mt-0.5">{bills.length} Invoices</span>
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <Card noPadding>
        <div className="p-4">
          <Table
            columns={columns}
            data={bills}
            searchKey="patientName"
            placeholder="Search patient invoices..."
            emptyMessage="No financial invoice statements logged."
          />
        </div>
      </Card>

      {/* Create Bill Modal */}
      <Modal
        isOpen={isAddBillOpen}
        onClose={() => setIsAddBillOpen(false)}
        title="Generate Patient Itemized Invoice"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddBillOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateBill}>Save Invoice</Button>
          </div>
        }
      >
        <form className="space-y-4" onSubmit={handleCreateBill}>
          <div>
            <label className="block text-xs font-semibold text-slate-700">Patient Directory</label>
            <select
              value={billPatientId}
              onChange={(e) => setBillPatientId(e.target.value)}
              className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
              required
            >
              <option value="">-- Choose Patient --</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.room})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Room / Bed Charges (₹)</label>
              <input
                type="number"
                value={roomCharges}
                onChange={(e) => setRoomCharges(e.target.value)}
                placeholder="e.g. 3500"
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Doctor Consultation Fees (₹)</label>
              <input
                type="number"
                value={doctorCharges}
                onChange={(e) => setDoctorCharges(e.target.value)}
                placeholder="e.g. 1000"
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Medication Dispensary Fees (₹)</label>
              <input
                type="number"
                value={medicineCharges}
                onChange={(e) => setMedicineCharges(e.target.value)}
                placeholder="e.g. 800"
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Other Diagnostic / Lab Fees (₹)</label>
              <input
                type="number"
                value={otherCharges}
                onChange={(e) => setOtherCharges(e.target.value)}
                placeholder="e.g. 300"
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-sm"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Invoice Details Print View Modal */}
      <Modal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        title="Hospital Itemized Bill Statement"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsInvoiceOpen(false)}>Close Statement</Button>
            {selectedInvoice?.status === 'Pending' && (currentRole === 'admin' || currentRole === 'receptionist') && (
              <Button variant="primary" onClick={() => handlePay(selectedInvoice.id)}>Mark Paid Statement</Button>
            )}
            <Button variant="white" onClick={() => window.print()}>Print Invoice</Button>
          </div>
        }
      >
        {selectedInvoice && (
          <div className="space-y-6 text-slate-700 p-2">
            {/* Invoice Top Brand */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-5">
              <div>
                <h3 className="font-bold text-lg text-slate-900 leading-none">MediSync AI Hospital</h3>
                <span className="text-[10px] text-slate-400 font-semibold block mt-1.5 uppercase">clinical itemized receipt</span>
              </div>
              <Badge>{selectedInvoice.status}</Badge>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-medium block">Invoice Number:</span>
                <span className="font-bold text-slate-800 block mt-0.5">{selectedInvoice.id}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Billing Date:</span>
                <span className="font-bold text-slate-800 block mt-0.5">{selectedInvoice.date}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Patient Name:</span>
                <span className="font-bold text-slate-800 block mt-0.5">{selectedInvoice.patientName}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Patient ID:</span>
                <span className="font-bold text-slate-800 block mt-0.5">{selectedInvoice.patientId}</span>
              </div>
            </div>

            {/* Calculations Table */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Itemized Charges Breakup</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
                    <tr>
                      <th className="p-3">Charge Category</th>
                      <th className="p-3 text-right">Amount (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                    <tr>
                      <td className="p-3">Room Boarding & Clinical Bed Allocation</td>
                      <td className="p-3 text-right">₹{selectedInvoice.roomCharges}</td>
                    </tr>
                    <tr>
                      <td className="p-3">Doctor Consultation & Ward Visit Fees</td>
                      <td className="p-3 text-right">₹{selectedInvoice.doctorCharges}</td>
                    </tr>
                    <tr>
                      <td className="p-3">Pharmacy Medicine Dispensary Fees</td>
                      <td className="p-3 text-right">₹{selectedInvoice.medicineCharges}</td>
                    </tr>
                    <tr>
                      <td className="p-3">Diagnostic Labs, Visitors Pass, & Other Overhead</td>
                      <td className="p-3 text-right">₹{selectedInvoice.otherCharges}</td>
                    </tr>
                    <tr className="bg-slate-50 font-bold text-slate-800">
                      <td className="p-3">Total Amount Due</td>
                      <td className="p-3 text-right text-base text-blue-600">₹{selectedInvoice.total}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer Signature */}
            <div className="border-t border-slate-100 pt-6 text-center text-[10px] text-slate-400 leading-normal">
              Thank you for trusting MediSync AI. For claims and insurance queries, contact billing desks.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BillingPage;
