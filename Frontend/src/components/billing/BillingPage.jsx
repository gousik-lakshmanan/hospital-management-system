import React, { useState, useEffect } from 'react';
import { IndianRupee, Plus, ReceiptText, Eye, CreditCard, XCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useBilling } from '../../context/BillingContext';
import { patientService } from '../../services/api';
import Card from '../common/Card';
import Table from '../common/Table';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Modal from '../common/Modal';

export const BillingPage = () => {
  const { currentRole } = useAuth();
  const {
    bills,
    myBills,
    summary,
    loading,
    createBill,
    recordPayment,
    cancelBill
  } = useBilling();

  const [patients, setPatients] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isAddBillOpen, setIsAddBillOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Bill Form
  const [billPatientId, setBillPatientId] = useState('');
  const [roomCharges, setRoomCharges] = useState('');
  const [doctorCharges, setDoctorCharges] = useState('');
  const [medicineCharges, setMedicineCharges] = useState('');
  const [otherCharges, setOtherCharges] = useState('');
  const [discount, setDiscount] = useState('');
  const [tax, setTax] = useState('');
  const [notes, setNotes] = useState('');

  // Payment Form
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [transactionRef, setTransactionRef] = useState('');

  const displayedBills = currentRole === 'patient' ? myBills : bills;

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await patientService.getPatients();
        if (res.success && Array.isArray(res.data)) {
          setPatients(res.data);
        }
      } catch (err) {
        console.warn('Failed to fetch patients list for billing:', err);
      }
    };
    if (currentRole === 'admin' || currentRole === 'receptionist') {
      fetchPatients();
    }
  }, [currentRole]);

  const handleCreateBill = async (e) => {
    e.preventDefault();
    if (!billPatientId) return;

    const items = [];
    const rc = parseFloat(roomCharges || 0);
    const dc = parseFloat(doctorCharges || 0);
    const mc = parseFloat(medicineCharges || 0);
    const oc = parseFloat(otherCharges || 0);

    if (rc > 0) items.push({ description: 'Room Boarding & Bed Allocation', category: 'Room & Bed', quantity: 1, unitPrice: rc, amount: rc });
    if (dc > 0) items.push({ description: 'Doctor Consultation & Round Visits', category: 'Doctor Consultation', quantity: 1, unitPrice: dc, amount: dc });
    if (mc > 0) items.push({ description: 'Pharmacy Medicine Dispensary', category: 'Pharmacy & Medication', quantity: 1, unitPrice: mc, amount: mc });
    if (oc > 0) items.push({ description: 'Diagnostic Labs & Ancillary Services', category: 'Lab Test', quantity: 1, unitPrice: oc, amount: oc });

    if (items.length === 0) {
      items.push({ description: 'General Healthcare Service Fee', category: 'Other', quantity: 1, unitPrice: 500, amount: 500 });
    }

    try {
      setSubmitting(true);
      await createBill({
        patientId: billPatientId,
        items,
        discount: parseFloat(discount || 0),
        tax: parseFloat(tax || 0),
        notes: notes.trim()
      });

      setIsAddBillOpen(false);
      setBillPatientId('');
      setRoomCharges('');
      setDoctorCharges('');
      setMedicineCharges('');
      setOtherCharges('');
      setDiscount('');
      setTax('');
      setNotes('');
    } catch (err) {
      // Error handled in context
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenPayment = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentAmount(invoice.balanceAmount ? invoice.balanceAmount.toString() : '0');
    setPaymentMethod('Cash');
    setTransactionRef('');
    setIsPaymentOpen(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoice || !paymentAmount) return;

    try {
      setSubmitting(true);
      const res = await recordPayment(selectedInvoice._id, {
        amount: parseFloat(paymentAmount),
        paymentMethod,
        transactionRef: transactionRef.trim()
      });
      setIsPaymentOpen(false);
      if (selectedInvoice && res?.data) {
        setSelectedInvoice(res.data);
      }
    } catch (err) {
      // Error handled in context
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Paid': return 'success';
      case 'Partially Paid': return 'warning';
      case 'Unpaid': return 'danger';
      case 'Cancelled': return 'default';
      default: return 'default';
    }
  };

  const canManageBilling = currentRole === 'admin' || currentRole === 'receptionist';

  const totalPaidRevenue = summary?.totalPaid || bills.filter(b => b.paymentStatus !== 'Cancelled').reduce((acc, curr) => acc + (curr.amountPaid || 0), 0);
  const totalOutstanding = summary?.totalUnpaid || bills.filter(b => b.paymentStatus !== 'Cancelled').reduce((acc, curr) => acc + (curr.balanceAmount || 0), 0);
  const totalInvoicesCount = summary?.totalInvoices || displayedBills.length;

  const columns = [
    {
      header: 'Invoice #',
      accessor: 'invoiceNumber',
      cell: (row) => <span className="font-bold text-blue-600 font-mono text-xs">{row.invoiceNumber}</span>
    },
    {
      header: 'Patient Name',
      accessor: 'patientName',
      cell: (row) => (
        <div>
          <span className="font-semibold text-slate-800 block text-xs">{row.patientName}</span>
          <span className="text-[10px] text-slate-400">{row.patientEmail || ''}</span>
        </div>
      )
    },
    {
      header: 'Billing Date',
      cell: (row) => <span className="text-xs text-slate-400">{new Date(row.createdAt).toLocaleDateString()}</span>
    },
    {
      header: 'Total (INR)',
      cell: (row) => <span className="font-bold text-slate-800 text-xs">₹{row.totalAmount}</span>
    },
    {
      header: 'Paid / Balance',
      cell: (row) => (
        <div className="text-xs">
          <span className="text-emerald-600 font-semibold block">Paid: ₹{row.amountPaid || 0}</span>
          <span className="text-rose-600 text-[10px] block">Bal: ₹{row.balanceAmount || 0}</span>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'paymentStatus',
      cell: (row) => <Badge variant={getStatusBadgeVariant(row.paymentStatus)}>{row.paymentStatus}</Badge>
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            icon={Eye}
            className="text-xs py-1 px-2 text-slate-600"
            onClick={() => { setSelectedInvoice(row); setIsInvoiceOpen(true); }}
          >
            Invoice
          </Button>
          {canManageBilling && (row.paymentStatus === 'Unpaid' || row.paymentStatus === 'Partially Paid') && (
            <Button
              variant="outline"
              size="sm"
              icon={CreditCard}
              className="text-xs py-1 px-2.5 text-emerald-600 border-slate-200 hover:bg-emerald-50"
              onClick={() => handleOpenPayment(row)}
            >
              Pay
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
          <p className="text-xs text-slate-500">
            {currentRole === 'patient'
              ? 'Review your itemized hospital invoices and payment receipts'
              : 'Collect hospital fees, generate clinical itemized bills, and track revenue'}
          </p>
        </div>
        {canManageBilling && (
          <Button variant="primary" icon={Plus} onClick={() => setIsAddBillOpen(true)}>
            Generate Invoice
          </Button>
        )}
      </div>

      {/* Revenue statistics cards (Staff only) */}
      {currentRole !== 'patient' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Total Collected Revenue</span>
              <span className="text-lg font-extrabold text-slate-800 block mt-0.5">₹{totalPaidRevenue.toLocaleString()}</span>
            </div>
          </div>
          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg shrink-0">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Outstanding Collections</span>
              <span className="text-lg font-extrabold text-slate-800 block mt-0.5">₹{totalOutstanding.toLocaleString()}</span>
            </div>
          </div>
          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg shrink-0">
              <ReceiptText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Total Invoices Issued</span>
              <span className="text-lg font-extrabold text-slate-800 block mt-0.5">{totalInvoicesCount} Invoices</span>
            </div>
          </div>
        </div>
      )}

      {/* Invoices List */}
      <Card noPadding>
        <div className="p-4">
          <Table
            columns={columns}
            data={displayedBills}
            searchKey="patientName"
            placeholder="Search invoices by patient name or number..."
            emptyMessage={loading ? "Loading financial records..." : "No financial invoice statements logged."}
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
            <Button variant="primary" loading={submitting} onClick={handleCreateBill}>Save Invoice</Button>
          </div>
        }
      >
        <form className="space-y-4" onSubmit={handleCreateBill}>
          <div>
            <label className="block text-xs font-semibold text-slate-700">Patient Directory *</label>
            <select
              value={billPatientId}
              onChange={(e) => setBillPatientId(e.target.value)}
              className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
              required
            >
              <option value="">-- Choose Patient --</option>
              {patients.map(p => (
                <option key={p._id} value={p._id}>{p.name} {p.room ? `(${p.room})` : ''} - ID: {p.patientId || p._id.slice(-6)}</option>
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
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Doctor Consultation Fees (₹)</label>
              <input
                type="number"
                value={doctorCharges}
                onChange={(e) => setDoctorCharges(e.target.value)}
                placeholder="e.g. 1000"
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Medication Dispensary Fees (₹)</label>
              <input
                type="number"
                value={medicineCharges}
                onChange={(e) => setMedicineCharges(e.target.value)}
                placeholder="e.g. 800"
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Diagnostic / Lab Fees (₹)</label>
              <input
                type="number"
                value={otherCharges}
                onChange={(e) => setOtherCharges(e.target.value)}
                placeholder="e.g. 300"
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Discount (₹)</label>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="0"
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Tax / GST (₹)</label>
              <input
                type="number"
                value={tax}
                onChange={(e) => setTax(e.target.value)}
                placeholder="0"
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Invoice Remarks / Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Inpatient admission invoice, insured under Star Health"
              className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
            />
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        title="Record Payment Collection"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsPaymentOpen(false)}>Cancel</Button>
            <Button variant="primary" loading={submitting} onClick={handleRecordPayment}>Confirm Payment</Button>
          </div>
        }
      >
        {selectedInvoice && (
          <form className="space-y-4" onSubmit={handleRecordPayment}>
            <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice:</span>
                <span className="font-bold font-mono">{selectedInvoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Patient:</span>
                <span className="font-bold">{selectedInvoice.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Remaining Balance:</span>
                <span className="font-bold text-rose-600">₹{selectedInvoice.balanceAmount}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Payment Amount (₹) *</label>
              <input
                type="number"
                max={selectedInvoice.balanceAmount}
                min="1"
                step="any"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs font-bold"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Payment Mode *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Net Banking">Net Banking</option>
                  <option value="Insurance">Insurance</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Transaction Ref / Cheque #</label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="e.g. UPI-984712"
                  className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
                />
              </div>
            </div>
          </form>
        )}
      </Modal>

      {/* Invoice Details Print View Modal */}
      <Modal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        title="Hospital Itemized Bill Statement"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsInvoiceOpen(false)}>Close Statement</Button>
            {canManageBilling && (selectedInvoice?.paymentStatus === 'Unpaid' || selectedInvoice?.paymentStatus === 'Partially Paid') && (
              <Button variant="primary" onClick={() => { setIsInvoiceOpen(false); handleOpenPayment(selectedInvoice); }}>
                Collect Payment
              </Button>
            )}
            <Button variant="white" onClick={() => window.print()}>Print Invoice</Button>
          </div>
        }
      >
        {selectedInvoice && (
          <div className="space-y-6 text-slate-700 p-2">
            {/* Invoice Top Brand */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-900 leading-none">MediSync AI Hospital</h3>
                <span className="text-[10px] text-slate-400 font-semibold block mt-1.5 uppercase">clinical itemized receipt</span>
              </div>
              <Badge variant={getStatusBadgeVariant(selectedInvoice.paymentStatus)}>{selectedInvoice.paymentStatus}</Badge>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-medium block">Invoice Number:</span>
                <span className="font-bold text-slate-800 block mt-0.5 font-mono">{selectedInvoice.invoiceNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Billing Date:</span>
                <span className="font-bold text-slate-800 block mt-0.5">{new Date(selectedInvoice.createdAt).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Patient Name:</span>
                <span className="font-bold text-slate-800 block mt-0.5">{selectedInvoice.patientName}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Patient Email:</span>
                <span className="font-bold text-slate-800 block mt-0.5">{selectedInvoice.patientEmail || '—'}</span>
              </div>
            </div>

            {/* Calculations Table */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Itemized Charges Breakup</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
                    <tr>
                      <th className="p-3">Description</th>
                      <th className="p-3">Category</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Unit Price</th>
                      <th className="p-3 text-right">Amount (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                    {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                      selectedInvoice.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-3">{item.description}</td>
                          <td className="p-3 text-[10px] text-slate-400">{item.category}</td>
                          <td className="p-3 text-center">{item.quantity}</td>
                          <td className="p-3 text-right">₹{item.unitPrice}</td>
                          <td className="p-3 text-right font-semibold text-slate-800">₹{item.amount}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="p-3 text-center text-slate-400">Standard Healthcare Services</td>
                      </tr>
                    )}
                    <tr className="bg-slate-50/50">
                      <td colSpan="4" className="p-2.5 text-right font-medium text-slate-500">Subtotal:</td>
                      <td className="p-2.5 text-right font-bold text-slate-800">₹{selectedInvoice.subtotal}</td>
                    </tr>
                    {selectedInvoice.discount > 0 && (
                      <tr className="bg-slate-50/50">
                        <td colSpan="4" className="p-2.5 text-right font-medium text-emerald-600">Discount:</td>
                        <td className="p-2.5 text-right font-bold text-emerald-600">-₹{selectedInvoice.discount}</td>
                      </tr>
                    )}
                    {selectedInvoice.tax > 0 && (
                      <tr className="bg-slate-50/50">
                        <td colSpan="4" className="p-2.5 text-right font-medium text-slate-500">Tax / GST:</td>
                        <td className="p-2.5 text-right font-bold text-slate-800">+₹{selectedInvoice.tax}</td>
                      </tr>
                    )}
                    <tr className="bg-slate-50 font-bold text-slate-800 border-t border-slate-200">
                      <td colSpan="4" className="p-3 text-right">Total Amount Due:</td>
                      <td className="p-3 text-right text-sm text-blue-600">₹{selectedInvoice.totalAmount}</td>
                    </tr>
                    <tr className="bg-emerald-50/40 text-emerald-800 font-semibold">
                      <td colSpan="4" className="p-2.5 text-right">Total Paid:</td>
                      <td className="p-2.5 text-right">₹{selectedInvoice.amountPaid || 0}</td>
                    </tr>
                    <tr className="bg-rose-50/40 text-rose-800 font-bold">
                      <td colSpan="4" className="p-2.5 text-right">Remaining Balance:</td>
                      <td className="p-2.5 text-right">₹{selectedInvoice.balanceAmount || 0}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment History */}
            {selectedInvoice.paymentHistory && selectedInvoice.paymentHistory.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Payment Receipts</h4>
                <div className="space-y-1.5">
                  {selectedInvoice.paymentHistory.map((ph, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded-lg border border-slate-100">
                      <div>
                        <span className="font-semibold text-slate-800 block">₹{ph.amount} via {ph.paymentMethod}</span>
                        <span className="text-[10px] text-slate-400">{ph.transactionRef ? `Ref: ${ph.transactionRef} • ` : ''}{new Date(ph.paidAt).toLocaleString()}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">By: {ph.recordedByName}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Signature */}
            <div className="border-t border-slate-100 pt-4 text-center text-[10px] text-slate-400 leading-normal">
              Thank you for trusting MediSync AI. For claims and insurance queries, please contact the billing desk.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BillingPage;

