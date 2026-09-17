import mongoose from 'mongoose';
import Bill from '../models/Bill.js';
import Patient from '../models/Patient.js';

// Helper to generate unique invoiceNumber
const generateUniqueInvoiceNumber = async () => {
  const year = new Date().getFullYear();
  let isUnique = false;
  let invoiceNumber = '';
  let attempts = 0;
  while (!isUnique && attempts < 10) {
    const random6 = Math.floor(100000 + Math.random() * 900000);
    invoiceNumber = `INV-${year}-${random6}`;
    const existing = await Bill.findOne({ invoiceNumber });
    if (!existing) {
      isUnique = true;
    }
    attempts++;
  }
  if (!isUnique) {
    invoiceNumber = `INV-${year}-${Date.now().toString().slice(-6)}`;
  }
  return invoiceNumber;
};

// GET /api/billing - List invoices
export const getBills = async (req, res) => {
  try {
    const { role } = req.user;

    if (role === 'pharmacist') {
      return res.status(403).json({
        success: false,
        message: 'Pharmacists do not have access to billing records.'
      });
    }

    let filter = {};

    if (role === 'patient') {
      const patient = await Patient.findOne({ userId: req.user._id });
      if (!patient) {
        return res.status(200).json({
          success: true,
          count: 0,
          data: []
        });
      }
      filter.patientId = patient._id;
    } else {
      const { paymentStatus, patientId, search, startDate, endDate } = req.query;

      if (paymentStatus) {
        filter.paymentStatus = paymentStatus;
      }

      if (patientId && mongoose.Types.ObjectId.isValid(patientId)) {
        filter.patientId = patientId;
      }

      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) {
          filter.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          filter.createdAt.$lte = end;
        }
      }

      if (search) {
        const searchRegex = new RegExp(search, 'i');
        filter.$or = [
          { invoiceNumber: searchRegex },
          { patientName: searchRegex },
          { patientEmail: searchRegex }
        ];
      }
    }

    const bills = await Bill.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: bills.length,
      data: bills
    });
  } catch (error) {
    console.error('Error in getBills:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch billing invoices.',
      error: error.message
    });
  }
};

// GET /api/billing/my - Patient views own invoices
export const getMyBills = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }

    const bills = await Bill.find({ patientId: patient._id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: bills.length,
      data: bills
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch personal billing records.',
      error: error.message
    });
  }
};

// GET /api/billing/summary - Aggregate billing summary metrics (Admin & Receptionist)
export const getBillingSummary = async (req, res) => {
  try {
    const bills = await Bill.find();

    let totalRevenue = 0;
    let totalPaid = 0;
    let totalUnpaid = 0;
    let paidCount = 0;
    let unpaidCount = 0;
    let partiallyPaidCount = 0;

    bills.forEach((b) => {
      if (b.paymentStatus !== 'Cancelled') {
        totalRevenue += b.totalAmount || 0;
        totalPaid += b.amountPaid || 0;
        totalUnpaid += b.balanceAmount || 0;
      }
      if (b.paymentStatus === 'Paid') paidCount++;
      else if (b.paymentStatus === 'Unpaid') unpaidCount++;
      else if (b.paymentStatus === 'Partially Paid') partiallyPaidCount++;
    });

    return res.status(200).json({
      success: true,
      data: {
        totalInvoices: bills.length,
        totalRevenue,
        totalPaid,
        totalUnpaid,
        paidCount,
        unpaidCount,
        partiallyPaidCount
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to compute billing summary.',
      error: error.message
    });
  }
};

// GET /api/billing/:id - Get single invoice
export const getBillById = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.user;

    if (role === 'pharmacist') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden.'
      });
    }

    let bill = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      bill = await Bill.findById(id);
    } else {
      bill = await Bill.findOne({ invoiceNumber: id });
    }

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Billing invoice not found.'
      });
    }

    if (role === 'patient') {
      const patient = await Patient.findOne({ userId: req.user._id });
      if (!patient || bill.patientId.toString() !== patient._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only view your own billing invoices.'
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: bill
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve invoice.',
      error: error.message
    });
  }
};

// GET /api/billing/patient/:patientId - Get invoices for patient
export const getBillsByPatientId = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { role } = req.user;

    if (role === 'pharmacist') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden.'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid patient ID format.'
      });
    }

    if (role === 'patient') {
      const patient = await Patient.findOne({ userId: req.user._id });
      if (!patient || patient._id.toString() !== patientId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only view your own billing invoices.'
        });
      }
    }

    const bills = await Bill.find({ patientId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: bills.length,
      data: bills
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve invoices for patient.',
      error: error.message
    });
  }
};

// POST /api/billing - Create new invoice
export const createBill = async (req, res) => {
  try {
    const { patientId, items, discount = 0, tax = 0, notes = '' } = req.body;

    if (!patientId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID and at least one billing item are required.'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid patient ID format.'
      });
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Referenced patient was not found.'
      });
    }

    // Process and validate items
    let calculatedSubtotal = 0;
    const formattedItems = items.map((item) => {
      const quantity = Math.max(1, Number(item.quantity) || 1);
      const unitPrice = Math.max(0, Number(item.unitPrice) || 0);
      const amount = quantity * unitPrice;
      calculatedSubtotal += amount;

      return {
        description: (item.description || 'Medical Service').trim(),
        category: item.category || 'Other',
        quantity,
        unitPrice,
        amount
      };
    });

    const discountVal = Math.max(0, Number(discount) || 0);
    const taxVal = Math.max(0, Number(tax) || 0);
    const totalAmount = Math.max(0, calculatedSubtotal - discountVal + taxVal);
    const balanceAmount = totalAmount;

    const invoiceNumber = await generateUniqueInvoiceNumber();

    const newBill = await Bill.create({
      invoiceNumber,
      patientId: patient._id,
      patientName: patient.name,
      patientEmail: patient.email || '',
      items: formattedItems,
      subtotal: calculatedSubtotal,
      discount: discountVal,
      tax: taxVal,
      totalAmount,
      amountPaid: 0,
      balanceAmount,
      paymentStatus: 'Unpaid',
      paymentMethod: 'Unpaid',
      paymentHistory: [],
      notes: notes.trim(),
      createdBy: req.user._id,
      createdByName: req.user.name || 'Staff Member'
    });

    return res.status(201).json({
      success: true,
      message: 'Billing invoice created successfully.',
      data: newBill
    });
  } catch (error) {
    console.error('Error in createBill:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create invoice.',
      error: error.message
    });
  }
};

// PATCH /api/billing/:id/payment - Record payment against an invoice (Admin & Receptionist only)
export const recordPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, paymentMethod = 'Cash', transactionRef = '' } = req.body;

    const paymentAmount = Number(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be a positive number greater than 0.'
      });
    }

    const filter = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { invoiceNumber: id };
    const bill = await Bill.findOne(filter);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Billing invoice not found.'
      });
    }

    if (bill.paymentStatus === 'Paid') {
      return res.status(400).json({
        success: false,
        message: 'Invoice is already fully paid.'
      });
    }

    if (bill.paymentStatus === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot record payment on a cancelled invoice.'
      });
    }

    if (paymentAmount > bill.balanceAmount) {
      return res.status(400).json({
        success: false,
        message: `Payment amount (${paymentAmount}) exceeds the remaining balance (${bill.balanceAmount}).`
      });
    }

    const willBeFullyPaid = (bill.balanceAmount - paymentAmount) === 0;
    const nextStatus = willBeFullyPaid ? 'Paid' : 'Partially Paid';

    // Atomic update
    const updated = await Bill.findOneAndUpdate(
      {
        ...filter,
        paymentStatus: { $in: ['Unpaid', 'Partially Paid'] },
        balanceAmount: { $gte: paymentAmount }
      },
      {
        $inc: {
          amountPaid: paymentAmount,
          balanceAmount: -paymentAmount
        },
        $set: {
          paymentMethod: paymentMethod || 'Cash',
          paymentStatus: nextStatus
        },
        $push: {
          paymentHistory: {
            paymentId: `PAY-${Date.now().toString().slice(-6)}`,
            amount: paymentAmount,
            paymentMethod: paymentMethod || 'Cash',
            transactionRef: transactionRef.trim(),
            paidAt: new Date(),
            recordedBy: req.user._id,
            recordedByName: req.user.name || 'Staff Member'
          }
        }
      },
      { new: true }
    );

    if (!updated) {
      return res.status(409).json({
        success: false,
        message: 'Concurrent modification conflict: Invoice balance or status changed during processing.'
      });
    }

    return res.status(200).json({
      success: true,
      message: `Payment of $${paymentAmount} recorded successfully. Status: ${nextStatus}.`,
      data: updated
    });
  } catch (error) {
    console.error('Error in recordPayment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to record payment.',
      error: error.message
    });
  }
};

// PATCH /api/billing/:id/cancel - Cancel invoice (Admin only)
export const cancelBill = async (req, res) => {
  try {
    const { id } = req.params;

    const filter = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { invoiceNumber: id };
    const bill = await Bill.findOne(filter);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Billing invoice not found.'
      });
    }

    if (bill.paymentStatus === 'Paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel an invoice that is already fully paid.'
      });
    }

    if (bill.paymentStatus === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Invoice is already cancelled.'
      });
    }

    const updated = await Bill.findOneAndUpdate(
      { ...filter, paymentStatus: { $in: ['Unpaid', 'Partially Paid'] } },
      { $set: { paymentStatus: 'Cancelled' } },
      { new: true }
    );

    if (!updated) {
      return res.status(409).json({
        success: false,
        message: 'Concurrent modification conflict: Invoice status changed.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Invoice cancelled successfully.',
      data: updated
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel invoice.',
      error: error.message
    });
  }
};
