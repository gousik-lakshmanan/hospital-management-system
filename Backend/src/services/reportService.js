import mongoose from 'mongoose';
import User from '../models/User.js';
import Patient from '../models/Patient.js';
import Appointment from '../models/Appointment.js';
import Room from '../models/Room.js';
import Bed from '../models/Bed.js';
import Medicine from '../models/Medicine.js';
import Prescription from '../models/Prescription.js';
import BloodStock from '../models/BloodStock.js';
import BloodDonor from '../models/BloodDonor.js';
import BloodRequest from '../models/BloodRequest.js';
import Visitor from '../models/Visitor.js';
import Bill from '../models/Bill.js';
import DietPlan from '../models/DietPlan.js';

/**
 * Helper to construct inclusive Date filter for MongoDB queries.
 */
export const buildDateFilter = (from, to, dateField = 'createdAt') => {
  const filter = {};
  if (from || to) {
    filter[dateField] = {};
    if (from) {
      const fromDate = new Date(from);
      if (!isNaN(fromDate.getTime())) {
        fromDate.setHours(0, 0, 0, 0);
        filter[dateField].$gte = fromDate;
      }
    }
    if (to) {
      const toDate = new Date(to);
      if (!isNaN(toDate.getTime())) {
        toDate.setHours(23, 59, 59, 999);
        filter[dateField].$lte = toDate;
      }
    }
    if (Object.keys(filter[dateField]).length === 0) {
      delete filter[dateField];
    }
  }
  return filter;
};

/**
 * 1. Hospital Overview Report
 */
export const getHospitalOverviewReport = async ({ from, to } = {}) => {
  const dateFilter = buildDateFilter(from, to);
  const now = new Date();

  const [
    totalPatients,
    totalDoctors,
    totalNurses,
    totalAppointments,
    appointmentStatuses,
    totalBeds,
    occupiedBeds,
    medicines,
    bloodStocks,
    pendingBloodRequests,
    visitorCounts,
    billingAggregate,
    activeDietPlans
  ] = await Promise.all([
    Patient.countDocuments(),
    User.countDocuments({ role: 'doctor', isActive: true }),
    User.countDocuments({ role: 'nurse', isActive: true }),
    Appointment.countDocuments(dateFilter),
    Appointment.aggregate([
      ...(Object.keys(dateFilter).length > 0 ? [{ $match: dateFilter }] : []),
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    Bed.countDocuments(),
    Bed.countDocuments({ status: 'OCCUPIED' }),
    Medicine.find().select('quantity reorderLevel expiryDate isActive'),
    BloodStock.find().sort({ bloodGroup: 1 }),
    BloodRequest.countDocuments({ status: { $regex: /^pending$/i } }),
    Visitor.aggregate([
      ...(Object.keys(dateFilter).length > 0 ? [{ $match: dateFilter }] : []),
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    Bill.aggregate([
      { $match: { paymentStatus: { $ne: 'Cancelled' }, ...(dateFilter.createdAt ? { createdAt: dateFilter.createdAt } : {}) } },
      {
        $group: {
          _id: null,
          totalBilled: { $sum: '$totalAmount' },
          totalCollected: { $sum: '$amountPaid' },
          totalOutstanding: { $sum: '$balanceAmount' },
          invoiceCount: { $sum: 1 }
        }
      }
    ]),
    DietPlan.countDocuments({ isActive: true })
  ]);

  // Appointment status map
  const apptStatusMap = {};
  appointmentStatuses.forEach((s) => {
    apptStatusMap[s._id] = s.count;
  });

  // Stage 5 exact medicine categorization
  let lowStockCount = 0;
  let outOfStockCount = 0;
  let expiredCount = 0;
  let inStockCount = 0;

  medicines.forEach((med) => {
    const isExpired = med.expiryDate && new Date(med.expiryDate) <= now;
    if (isExpired) {
      expiredCount++;
    } else if (med.quantity === 0) {
      outOfStockCount++;
    } else if (med.quantity <= med.reorderLevel) {
      lowStockCount++;
    } else {
      inStockCount++;
    }
  });

  // Visitor status map
  const visStatusMap = {};
  visitorCounts.forEach((v) => {
    visStatusMap[v._id] = v.count;
  });

  const availableBeds = Math.max(0, totalBeds - occupiedBeds);
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
  const billSummary = billingAggregate[0] || { totalBilled: 0, totalCollected: 0, totalOutstanding: 0, invoiceCount: 0 };

  return {
    patients: {
      total: totalPatients,
      admitted: occupiedBeds,
      outpatients: Math.max(0, totalPatients - occupiedBeds)
    },
    beds: {
      total: totalBeds,
      occupied: occupiedBeds,
      available: availableBeds,
      occupancyRate
    },
    appointments: {
      total: totalAppointments,
      scheduled: apptStatusMap['Scheduled'] || 0,
      confirmed: apptStatusMap['Confirmed'] || 0,
      completed: apptStatusMap['Completed'] || 0,
      cancelled: apptStatusMap['Cancelled'] || 0,
      pending: apptStatusMap['Pending'] || 0
    },
    billing: {
      totalBilled: billSummary.totalBilled,
      totalRevenue: billSummary.totalCollected,
      totalPaid: billSummary.totalCollected,
      totalUnpaid: billSummary.totalOutstanding,
      totalOutstanding: billSummary.totalOutstanding,
      invoicesCount: billSummary.invoiceCount
    },
    pharmacy: {
      total: medicines.length,
      inStock: inStockCount,
      lowStock: lowStockCount,
      outOfStock: outOfStockCount,
      expired: expiredCount
    },
    bloodBank: {
      totalUnits: bloodStocks.reduce((sum, s) => sum + (s.units || 0), 0),
      criticalCount: bloodStocks.filter(s => s.units <= 2).length,
      pendingRequests: pendingBloodRequests
    },
    visitors: {
      active: visStatusMap['Checked In'] || 0,
      expected: visStatusMap['Expected'] || 0,
      checkedOut: visStatusMap['Checked Out'] || 0
    },
    staff: {
      doctors: totalDoctors,
      nurses: totalNurses
    },
    dietPlans: {
      active: activeDietPlans
    },
    totalPatients,
    totalDoctors,
    totalNurses,
    totalAppointments,
    scheduledAppointments: apptStatusMap['Scheduled'] || 0,
    confirmedAppointments: apptStatusMap['Confirmed'] || 0,
    completedAppointments: apptStatusMap['Completed'] || 0,
    cancelledAppointments: apptStatusMap['Cancelled'] || 0,
    pendingAppointments: apptStatusMap['Pending'] || 0,
    totalBeds,
    occupiedBeds,
    availableBeds,
    occupancyRate,
    totalMedicines: medicines.length,
    inStockMedicines: inStockCount,
    lowStockMedicines: lowStockCount,
    outOfStockMedicines: outOfStockCount,
    expiredMedicines: expiredCount,
    bloodStockByGroup: bloodStocks.map((b) => ({ group: b.bloodGroup, units: b.units, status: b.status })),
    pendingBloodRequests,
    activeVisitors: visStatusMap['Checked In'] || 0,
    expectedVisitors: visStatusMap['Expected'] || 0,
    checkedInVisitors: visStatusMap['Checked In'] || 0,
    checkedOutVisitors: visStatusMap['Checked Out'] || 0,
    totalInvoices: billSummary.invoiceCount,
    totalBilled: billSummary.totalBilled,
    totalRevenue: billSummary.totalCollected,
    totalPaid: billSummary.totalCollected,
    totalUnpaid: billSummary.totalOutstanding,
    totalOutstanding: billSummary.totalOutstanding,
    activeDietPlans
  };
};

/**
 * 2. Patient Report
 */
export const getPatientReport = async ({ from, to } = {}) => {
  const dateFilter = buildDateFilter(from, to);

  const [
    totalPatients,
    newPatientsCount,
    genderDist,
    bloodGroupDist,
    occupiedBeds
  ] = await Promise.all([
    Patient.countDocuments(),
    Patient.countDocuments(dateFilter),
    Patient.aggregate([
      { $group: { _id: { $toLower: '$gender' }, count: { $sum: 1 } } }
    ]),
    Patient.aggregate([
      { $match: { bloodGroup: { $exists: true, $ne: '' } } },
      { $group: { _id: '$bloodGroup', count: { $sum: 1 } } }
    ]),
    Bed.distinct('patientId', { status: 'OCCUPIED', patientId: { $ne: null } })
  ]);

  const admittedPatientsCount = occupiedBeds.length;

  return {
    totalPatients,
    newPatients: newPatientsCount,
    admittedPatients: admittedPatientsCount,
    outpatients: Math.max(0, totalPatients - admittedPatientsCount),
    genderDistribution: genderDist.map((g) => ({ gender: g._id || 'unspecified', count: g.count })),
    bloodGroupDistribution: bloodGroupDist.map((b) => ({ bloodGroup: b._id, count: b.count }))
  };
};

/**
 * 3. Appointment Report
 */
export const getAppointmentReport = async ({ from, to } = {}) => {
  const dateFilter = buildDateFilter(from, to, 'date');

  const [
    totalAppointments,
    typeBreakdown,
    statusBreakdown,
    departmentBreakdown,
    dailyAppointments
  ] = await Promise.all([
    Appointment.countDocuments(dateFilter),
    Appointment.aggregate([
      ...(Object.keys(dateFilter).length > 0 ? [{ $match: dateFilter }] : []),
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]),
    Appointment.aggregate([
      ...(Object.keys(dateFilter).length > 0 ? [{ $match: dateFilter }] : []),
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    Appointment.aggregate([
      ...(Object.keys(dateFilter).length > 0 ? [{ $match: dateFilter }] : []),
      { $match: { department: { $exists: true, $ne: '' } } },
      { $group: { _id: '$department', count: { $sum: 1 } } }
    ]),
    Appointment.aggregate([
      ...(Object.keys(dateFilter).length > 0 ? [{ $match: dateFilter }] : []),
      { $group: { _id: '$date', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $limit: 30 }
    ])
  ]);

  return {
    totalAppointments,
    byType: typeBreakdown.map((t) => ({ type: t._id || 'doctor', count: t.count })),
    byStatus: statusBreakdown.map((s) => ({ status: s._id, count: s.count })),
    byDepartment: departmentBreakdown.map((d) => ({ department: d._id, count: d.count })),
    dailyTrend: dailyAppointments.map((d) => ({ date: d._id, count: d.count }))
  };
};

/**
 * 4. Room & Bed Occupancy Report
 */
export const getBedOccupancyReport = async () => {
  const [rooms, beds] = await Promise.all([
    Room.find().sort({ roomId: 1 }),
    Bed.find()
  ]);

  const totalBeds = beds.length;
  const occupiedBeds = beds.filter((b) => b.status === 'OCCUPIED').length;
  const availableBeds = Math.max(0, totalBeds - occupiedBeds);
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  const roomBreakdown = rooms.map((r) => {
    const roomBeds = beds.filter((b) => b.roomId === r.roomId);
    const occ = roomBeds.filter((b) => b.status === 'OCCUPIED').length;
    return {
      roomId: r.roomId,
      roomName: r.name,
      roomType: r.type,
      capacity: roomBeds.length,
      occupied: occ,
      available: Math.max(0, roomBeds.length - occ),
      occupancyRate: roomBeds.length > 0 ? Math.round((occ / roomBeds.length) * 100) : 0
    };
  });

  return {
    totalRooms: rooms.length,
    totalBeds,
    occupiedBeds,
    availableBeds,
    occupancyRate,
    roomBreakdown
  };
};

/**
 * 5. Pharmacy Report
 */
export const getPharmacyReport = async ({ from, to } = {}) => {
  const dateFilter = buildDateFilter(from, to);
  const now = new Date();

  const [medicines, prescriptionStatuses, topPrescriptions] = await Promise.all([
    Medicine.find().sort({ name: 1 }),
    Prescription.aggregate([
      ...(Object.keys(dateFilter).length > 0 ? [{ $match: dateFilter }] : []),
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    Prescription.aggregate([
      ...(Object.keys(dateFilter).length > 0 ? [{ $match: dateFilter }] : []),
      { $unwind: '$medicines' },
      { $group: { _id: '$medicines.medicineName', count: { $sum: '$medicines.quantity' } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ])
  ]);

  let inStock = 0;
  let lowStock = 0;
  let outOfStock = 0;
  let expired = 0;

  medicines.forEach((med) => {
    const isExpired = med.expiryDate && new Date(med.expiryDate) <= now;
    if (isExpired) {
      expired++;
    } else if (med.quantity === 0) {
      outOfStock++;
    } else if (med.quantity <= med.reorderLevel) {
      lowStock++;
    } else {
      inStock++;
    }
  });

  const prescStatusMap = {};
  prescriptionStatuses.forEach((p) => {
    prescStatusMap[p._id] = p.count;
  });

  return {
    totalMedicines: medicines.length,
    inStock,
    lowStock,
    outOfStock,
    expired,
    summary: {
      total: medicines.length,
      inStock,
      lowStock,
      outOfStock,
      expired
    },
    medicines: medicines.map(m => ({
      _id: m._id,
      name: m.name,
      genericName: m.genericName,
      category: m.category,
      quantity: m.quantity,
      reorderLevel: m.reorderLevel,
      unitPrice: m.unitPrice,
      expiryDate: m.expiryDate
    })),
    prescriptions: {
      total: Object.values(prescStatusMap).reduce((a, b) => a + b, 0),
      pending: prescStatusMap['Pending'] || 0,
      dispensed: prescStatusMap['Dispensed'] || 0,
      cancelled: prescStatusMap['Cancelled'] || 0
    },
    topPrescribedMedicines: topPrescriptions.map((tp) => ({ name: tp._id, totalUnits: tp.count }))
  };
};

/**
 * 6. Blood Bank Report
 */
export const getBloodBankReport = async () => {
  const [stocks, donorsCount, activeDonorsCount, requestStatuses] = await Promise.all([
    BloodStock.find().sort({ bloodGroup: 1 }),
    BloodDonor.countDocuments(),
    BloodDonor.countDocuments({ status: 'Active' }),
    BloodRequest.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ])
  ]);

  const reqStatusMap = {};
  requestStatuses.forEach((r) => {
    reqStatusMap[r._id] = r.count;
  });

  const totalUnits = stocks.reduce((sum, s) => sum + (s.units || 0), 0);
  const criticalGroups = stocks.filter((s) => s.units <= 2).map((s) => s.bloodGroup);

  return {
    totalUnits,
    criticalCount: criticalGroups.length,
    criticalGroups,
    inventory: stocks.map((s) => ({
      _id: s._id,
      bloodGroup: s.bloodGroup,
      group: s.bloodGroup,
      units: s.units,
      bags: s.units,
      status: s.units <= 0 ? 'Out of Stock' : s.units <= 2 ? 'Emergency Alert' : s.units <= 5 ? 'Low Stock' : 'Normal'
    })),
    stockByGroup: stocks.map((s) => ({ group: s.bloodGroup, units: s.units, status: s.status })),
    donors: {
      total: donorsCount,
      active: activeDonorsCount
    },
    requests: {
      pending: reqStatusMap['Pending'] || reqStatusMap['pending'] || 0,
      approved: reqStatusMap['Approved'] || reqStatusMap['approved'] || 0,
      negotiated: reqStatusMap['Negotiated'] || reqStatusMap['negotiated'] || 0,
      rejected: reqStatusMap['Rejected'] || reqStatusMap['rejected'] || 0
    }
  };
};

/**
 * 7. Visitor Report
 */
export const getVisitorReport = async ({ from, to } = {}) => {
  const dateFilter = buildDateFilter(from, to, 'visitDate');

  const [totalVisitors, statusBreakdown, relationshipBreakdown, dailyVisitors] = await Promise.all([
    Visitor.countDocuments(dateFilter),
    Visitor.aggregate([
      ...(Object.keys(dateFilter).length > 0 ? [{ $match: dateFilter }] : []),
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    Visitor.aggregate([
      ...(Object.keys(dateFilter).length > 0 ? [{ $match: dateFilter }] : []),
      { $group: { _id: '$relationship', count: { $sum: 1 } } }
    ]),
    Visitor.aggregate([
      ...(Object.keys(dateFilter).length > 0 ? [{ $match: dateFilter }] : []),
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$visitDate' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 30 }
    ])
  ]);

  const statusMap = {};
  statusBreakdown.forEach((s) => {
    statusMap[s._id] = s.count;
  });

  return {
    totalVisitors,
    expected: statusMap['Expected'] || 0,
    checkedIn: statusMap['Checked In'] || 0,
    checkedOut: statusMap['Checked Out'] || 0,
    cancelled: statusMap['Cancelled'] || 0,
    byRelationship: relationshipBreakdown.map((r) => ({ relationship: r._id || 'Other', count: r.count })),
    dailyTrend: dailyVisitors.map((d) => ({ date: d._id, count: d.count }))
  };
};

/**
 * 8. Billing Report
 */
export const getBillingReport = async ({ from, to } = {}) => {
  const dateFilter = buildDateFilter(from, to);

  const [statusBreakdown, financialAggregate, dailyRevenue] = await Promise.all([
    Bill.aggregate([
      ...(Object.keys(dateFilter).length > 0 ? [{ $match: dateFilter }] : []),
      { $group: { _id: '$paymentStatus', count: { $sum: 1 } } }
    ]),
    Bill.aggregate([
      { $match: { paymentStatus: { $ne: 'Cancelled' }, ...(dateFilter.createdAt ? { createdAt: dateFilter.createdAt } : {}) } },
      {
        $group: {
          _id: null,
          subtotal: { $sum: '$subtotal' },
          discount: { $sum: '$discount' },
          tax: { $sum: '$tax' },
          totalAmount: { $sum: '$totalAmount' },
          amountPaid: { $sum: '$amountPaid' },
          balanceAmount: { $sum: '$balanceAmount' },
          totalInvoices: { $sum: 1 }
        }
      }
    ]),
    Bill.aggregate([
      { $match: { paymentStatus: { $ne: 'Cancelled' }, ...(dateFilter.createdAt ? { createdAt: dateFilter.createdAt } : {}) } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$amountPaid' },
          billed: { $sum: '$totalAmount' }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 30 }
    ])
  ]);

  const statusMap = {};
  statusBreakdown.forEach((s) => {
    statusMap[s._id] = s.count;
  });

  const totals = financialAggregate[0] || {
    subtotal: 0,
    discount: 0,
    tax: 0,
    totalAmount: 0,
    amountPaid: 0,
    balanceAmount: 0,
    totalInvoices: 0
  };

  return {
    totalInvoices: totals.totalInvoices,
    unpaidCount: statusMap['Unpaid'] || 0,
    partiallyPaidCount: statusMap['Partially Paid'] || 0,
    paidCount: statusMap['Paid'] || 0,
    cancelledCount: statusMap['Cancelled'] || 0,
    subtotal: totals.subtotal,
    discount: totals.discount,
    tax: totals.tax,
    totalBilled: totals.totalAmount,
    totalRevenue: totals.amountPaid,
    totalPaid: totals.amountPaid,
    totalUnpaid: totals.balanceAmount,
    totalOutstanding: totals.balanceAmount,
    dailyRevenue: dailyRevenue.map((d) => ({ date: d._id, revenue: d.revenue, billed: d.billed })),
    dailyTrend: dailyRevenue.map((d) => ({ date: d._id, revenue: d.revenue, billed: d.billed }))
  };
};

/**
 * 9. Diet Planning Report
 */
export const getDietPlanningReport = async () => {
  const [totalPlans, activePlans, sourceBreakdown, preferenceBreakdown, conditionBreakdown] = await Promise.all([
    DietPlan.countDocuments(),
    DietPlan.countDocuments({ isActive: true }),
    DietPlan.aggregate([
      { $group: { _id: '$source', count: { $sum: 1 } } }
    ]),
    DietPlan.aggregate([
      { $group: { _id: '$questionnaire.preference', count: { $sum: 1 } } }
    ]),
    DietPlan.aggregate([
      { $match: { 'questionnaire.currentDisease': { $exists: true, $ne: 'none' } } },
      { $group: { _id: '$questionnaire.currentDisease', count: { $sum: 1 } } }
    ])
  ]);

  const sourceMap = {};
  sourceBreakdown.forEach((s) => {
    sourceMap[s._id] = s.count;
  });

  return {
    totalPlans,
    activePlans,
    aiGenerated: sourceMap['AI_GENERATED'] || 0,
    clinicallyAssigned: sourceMap['CLINICAL_ASSIGNED'] || 0,
    byPreference: preferenceBreakdown.map((p) => ({ preference: p._id || 'standard', count: p.count })),
    byCondition: conditionBreakdown.map((c) => ({ condition: c._id, count: c.count }))
  };
};

export default {
  getHospitalOverviewReport,
  getPatientReport,
  getAppointmentReport,
  getBedOccupancyReport,
  getPharmacyReport,
  getBloodBankReport,
  getVisitorReport,
  getBillingReport,
  getDietPlanningReport
};
