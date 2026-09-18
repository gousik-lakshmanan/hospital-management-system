import mongoose from 'mongoose';
import User from '../models/User.js';
import Patient from '../models/Patient.js';
import Appointment from '../models/Appointment.js';
import Bed from '../models/Bed.js';
import BedRequest from '../models/BedRequest.js';
import Medicine from '../models/Medicine.js';
import Prescription from '../models/Prescription.js';
import BloodStock from '../models/BloodStock.js';
import BloodRequest from '../models/BloodRequest.js';
import Visitor from '../models/Visitor.js';
import Bill from '../models/Bill.js';
import DietPlan from '../models/DietPlan.js';
import Notification from '../models/Notification.js';

// Format date helper (YYYY-MM-DD)
const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Format relative time helper
const formatRelativeTime = (date) => {
  if (!date) return 'Just now';
  const diffMs = Date.now() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

/**
 * Merges and normalizes recent business events into unified recent activities log.
 */
export const getRecentActivities = async (limit = 10) => {
  try {
    const [appts, bedReqs, prescs, bloodReqs, visitors, bills] = await Promise.all([
      Appointment.find().sort({ createdAt: -1 }).limit(5).select('patientName providerName type status createdAt'),
      BedRequest.find().sort({ createdAt: -1 }).limit(5).select('requesterName sectionName status createdAt'),
      Prescription.find().sort({ createdAt: -1 }).limit(5).select('patientName status prescribedByName createdAt'),
      BloodRequest.find().sort({ createdAt: -1 }).limit(5).select('requesterName bloodGroup requestedUnits status createdAt'),
      Visitor.find().sort({ createdAt: -1 }).limit(5).select('visitorName patientName status createdAt'),
      Bill.find().sort({ createdAt: -1 }).limit(5).select('invoiceNumber patientName amountPaid totalAmount paymentStatus createdAt')
    ]);

    const items = [];

    appts.forEach((a) => {
      items.push({
        id: `act-appt-${a._id}`,
        type: a.status === 'Confirmed' || a.status === 'Completed' ? 'success' : a.status === 'Cancelled' ? 'warning' : 'info',
        text: `Appointment for ${a.patientName} with ${a.providerName || 'Physician'} (${a.status})`,
        time: formatRelativeTime(a.createdAt),
        createdAt: a.createdAt || new Date()
      });
    });

    bedReqs.forEach((b) => {
      items.push({
        id: `act-bed-${b._id}`,
        type: b.status === 'approved' ? 'success' : b.status === 'rejected' ? 'warning' : 'info',
        text: `Bed request for ${b.sectionName} by ${b.requesterName} (${b.status})`,
        time: formatRelativeTime(b.createdAt),
        createdAt: b.createdAt || new Date()
      });
    });

    prescs.forEach((p) => {
      items.push({
        id: `act-presc-${p._id}`,
        type: p.status === 'Dispensed' ? 'success' : 'info',
        text: `Prescription issued for ${p.patientName} (${p.status})`,
        time: formatRelativeTime(p.createdAt),
        createdAt: p.createdAt || new Date()
      });
    });

    bloodReqs.forEach((br) => {
      items.push({
        id: `act-blood-${br._id}`,
        type: br.status === 'Approved' ? 'success' : br.status === 'Rejected' ? 'warning' : 'info',
        text: `Blood request: ${br.requestedUnits} units of ${br.bloodGroup} for ${br.requesterName} (${br.status})`,
        time: formatRelativeTime(br.createdAt),
        createdAt: br.createdAt || new Date()
      });
    });

    visitors.forEach((v) => {
      items.push({
        id: `act-vis-${v._id}`,
        type: v.status === 'Checked In' ? 'success' : v.status === 'Cancelled' ? 'warning' : 'info',
        text: `Visitor pass: ${v.visitorName} visiting ${v.patientName} (${v.status})`,
        time: formatRelativeTime(v.createdAt),
        createdAt: v.createdAt || new Date()
      });
    });

    bills.forEach((bill) => {
      items.push({
        id: `act-bill-${bill._id}`,
        type: bill.paymentStatus === 'Paid' ? 'success' : 'info',
        text: `Invoice ${bill.invoiceNumber} for ${bill.patientName}: ₹${bill.amountPaid} collected (${bill.paymentStatus})`,
        time: formatRelativeTime(bill.createdAt),
        createdAt: bill.createdAt || new Date()
      });
    });

    // Sort descending by createdAt
    items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return items.slice(0, limit);
  } catch (error) {
    console.error('Failed to aggregate recent activities:', error.message);
    return [];
  }
};

/**
 * 1. Administrator Dashboard
 */
export const getAdminDashboard = async (userId) => {
  const todayStr = getTodayDateString();
  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [
    totalPatients,
    todayAppointments,
    pendingAppointments,
    totalBeds,
    occupiedBeds,
    doctorsOnDuty,
    nursesOnDuty,
    medicines,
    bloodRequests,
    billingAggregate,
    dailyRevenueAgg,
    bedAllocationsRaw,
    recentBloodRequests,
    recentActivities,
    unreadNotifications
  ] = await Promise.all([
    Patient.countDocuments(),
    Appointment.countDocuments({ date: todayStr }),
    Appointment.countDocuments({ status: 'Pending' }),
    Bed.countDocuments(),
    Bed.countDocuments({ status: 'OCCUPIED' }),
    User.countDocuments({ role: 'doctor', isActive: true }),
    User.countDocuments({ role: 'nurse', isActive: true }),
    Medicine.find().select('quantity reorderLevel expiryDate'),
    BloodRequest.find().select('status bloodGroup requestedUnits requesterName requesterRole createdAt'),
    Bill.aggregate([
      { $match: { paymentStatus: { $ne: 'Cancelled' } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amountPaid' },
          totalOutstanding: { $sum: '$balanceAmount' }
        }
      }
    ]),
    Bill.aggregate([
      {
        $match: {
          paymentStatus: { $ne: 'Cancelled' },
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%b %d', date: '$createdAt' } },
          revenue: { $sum: '$amountPaid' }
        }
      }
    ]),
    // Bed Allocations (Last 7 Days) derived strictly from Bed.allocatedAt
    Bed.find({
      status: 'OCCUPIED',
      allocatedAt: { $gte: sevenDaysAgo, $lte: now }
    }).select('allocatedAt'),
    BloodRequest.find().sort({ createdAt: -1 }).limit(3),
    getRecentActivities(10),
    Notification.countDocuments({ recipientId: userId, isRead: false })
  ]);

  // Stage 5 pharmacy alert counts
  let lowStockCount = 0;
  let outOfStockCount = 0;
  medicines.forEach((med) => {
    const isExpired = med.expiryDate && new Date(med.expiryDate) <= now;
    if (!isExpired) {
      if (med.quantity === 0) outOfStockCount++;
      else if (med.quantity <= med.reorderLevel) lowStockCount++;
    }
  });

  const availableBeds = Math.max(0, totalBeds - occupiedBeds);
  const pendingBloodReqs = bloodRequests.filter((r) => r.status === 'Pending' || r.status === 'pending');

  const billSummary = billingAggregate[0] || { totalRevenue: 0, totalOutstanding: 0 };

  // Construct 7-day revenue chart data
  const revenueMap = {};
  dailyRevenueAgg.forEach((d) => {
    revenueMap[d._id] = d.revenue;
  });

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const bedAllocationMap = {};
  bedAllocationsRaw.forEach((b) => {
    if (b.allocatedAt) {
      const dayName = daysOfWeek[new Date(b.allocatedAt).getDay()];
      bedAllocationMap[dayName] = (bedAllocationMap[dayName] || 0) + 1;
    }
  });

  // Construct 7-day windows
  const revenueData = [];
  const admissionData = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const dayName = daysOfWeek[d.getDay()];

    revenueData.push({
      name: label,
      Revenue: revenueMap[label] || 0
    });

    admissionData.push({
      name: dayName,
      Admissions: bedAllocationMap[dayName] || 0,
      Allocations: bedAllocationMap[dayName] || 0
    });
  }

  const statMetrics = {
    totalPatients,
    todayAppointments,
    pendingAppointments,
    totalBeds,
    occupiedBeds,
    availableBeds,
    occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
    doctorsOnDuty,
    activeDoctors: doctorsOnDuty,
    nursesOnDuty,
    activeNurses: nursesOnDuty,
    pharmacyAlerts: lowStockCount + outOfStockCount,
    pendingBloodRequests: pendingBloodReqs.length,
    totalBloodRequests: bloodRequests.length,
    totalRevenue: billSummary.totalRevenue,
    totalPaid: billSummary.totalRevenue,
    totalUnpaid: billSummary.totalOutstanding,
    totalOutstanding: billSummary.totalOutstanding,
    unreadNotifications
  };

  return {
    stats: statMetrics,
    summary: statMetrics,
    charts: {
      admissionData,
      bedAllocationsLast7Days: admissionData,
      revenueData,
      revenueTrends: revenueData,
      bedOccupancy: [
        { name: 'Occupied', value: occupiedBeds, color: '#EF4444' },
        { name: 'Available', value: availableBeds, color: '#10B981' }
      ]
    },
    recentBloodRequests,
    recentActivities
  };
};

/**
 * 2. Doctor Dashboard
 */
export const getDoctorDashboard = async (doctorId) => {
  const todayStr = getTodayDateString();

  const [
    doctorUser,
    doctorAppointments,
    recentPrescriptions,
    medicines,
    unreadNotifications
  ] = await Promise.all([
    User.findById(doctorId).select('firstName lastName email profileId specialty department'),
    Appointment.find({ providerId: doctorId }).sort({ date: 1, time: 1 }),
    Prescription.find({ prescribedBy: doctorId }).sort({ createdAt: -1 }).limit(5),
    Medicine.find({ isActive: true }).select('name category quantity unitPrice'),
    Notification.countDocuments({ recipientId: doctorId, isRead: false })
  ]);

  const todayAppts = doctorAppointments.filter((a) => a.date === todayStr);
  const pendingRequests = doctorAppointments.filter((a) => a.status === 'Pending');
  const activeQueue = doctorAppointments.filter((a) => a.status === 'Confirmed' || a.status === 'Rescheduled');
  const completedConsultations = doctorAppointments.filter((a) => a.status === 'Completed');

  return {
    doctor: doctorUser,
    stats: {
      todayConsultations: todayAppts.length,
      totalAppointments: doctorAppointments.length,
      pendingRequests: pendingRequests.length,
      confirmedInQueue: activeQueue.length,
      completedConsultations: completedConsultations.length,
      unreadNotifications
    },
    appointments: doctorAppointments,
    todayAppointments: todayAppts,
    pendingRequests,
    activeQueue,
    recentPrescriptions,
    medicines
  };
};

/**
 * 3. Nurse Dashboard
 */
export const getNurseDashboard = async (nurseId) => {
  const todayStr = getTodayDateString();

  const [
    nurseUser,
    nurseAppointments,
    occupiedBeds,
    totalBeds,
    unreadNotifications
  ] = await Promise.all([
    User.findById(nurseId).select('firstName lastName email profileId department'),
    Appointment.find({ providerId: nurseId }).sort({ date: 1, time: 1 }),
    Bed.find({ status: 'OCCUPIED' }).select('roomName bedNumber patientId patientName allocatedAt'),
    Bed.countDocuments(),
    Notification.countDocuments({ recipientId: nurseId, isRead: false })
  ]);

  const pendingRequests = nurseAppointments.filter((a) => a.status === 'Pending');
  const activeQueue = nurseAppointments.filter((a) => a.status === 'Confirmed' || a.status === 'Rescheduled');

  return {
    nurse: nurseUser,
    stats: {
      pendingRequests: pendingRequests.length,
      activeQueue: activeQueue.length,
      admittedPatientsCount: occupiedBeds.length,
      totalBeds,
      availableBeds: Math.max(0, totalBeds - occupiedBeds.length),
      unreadNotifications
    },
    appointments: nurseAppointments,
    pendingRequests,
    activeQueue,
    admittedBeds: occupiedBeds
  };
};

/**
 * 4. Receptionist Dashboard
 */
export const getReceptionistDashboard = async (userId) => {
  const todayStr = getTodayDateString();

  const [
    todayAppointments,
    registeredPatients,
    totalBeds,
    occupiedBeds,
    activeVisitors,
    recentVisitors,
    unreadNotifications
  ] = await Promise.all([
    Appointment.find({ date: todayStr }).sort({ time: 1 }),
    Patient.countDocuments(),
    Bed.countDocuments(),
    Bed.countDocuments({ status: 'OCCUPIED' }),
    Visitor.countDocuments({ status: 'Checked In' }),
    Visitor.find().sort({ createdAt: -1 }).limit(5),
    Notification.countDocuments({ recipientId: userId, isRead: false })
  ]);

  return {
    stats: {
      todayAppointmentsCount: todayAppointments.length,
      registeredPatients,
      totalBeds,
      occupiedBeds,
      availableBeds: Math.max(0, totalBeds - occupiedBeds),
      activeVisitors,
      unreadNotifications
    },
    todayAppointments,
    recentVisitors
  };
};

/**
 * 5. Pharmacist Dashboard
 */
export const getPharmacistDashboard = async (userId) => {
  const now = new Date();

  const [
    medicines,
    prescriptions,
    unreadNotifications
  ] = await Promise.all([
    Medicine.find().sort({ name: 1 }),
    Prescription.find().sort({ createdAt: -1 }),
    Notification.countDocuments({ recipientId: userId, isRead: false })
  ]);

  let inStock = 0;
  let lowStock = 0;
  let outOfStock = 0;
  let expiringSoon = 0;

  medicines.forEach((med) => {
    const isExpired = med.expiryDate && new Date(med.expiryDate) <= now;
    if (isExpired) {
      expiringSoon++;
    } else if (med.quantity === 0) {
      outOfStock++;
    } else if (med.quantity <= med.reorderLevel) {
      lowStock++;
    } else {
      inStock++;
    }
  });

  const pendingPrescriptions = prescriptions.filter((p) => p.status === 'Pending');
  const dispensedPrescriptions = prescriptions.filter((p) => p.status === 'Dispensed').slice(0, 10);

  return {
    stats: {
      totalFormulations: medicines.length,
      inStock,
      lowStock,
      outOfStock,
      expiringSoon,
      pendingPrescriptionsCount: pendingPrescriptions.length,
      unreadNotifications
    },
    medicines,
    pendingPrescriptions,
    dispensedPrescriptions
  };
};

/**
 * 6. Patient Dashboard
 */
export const getPatientDashboard = async (userId) => {
  const patient = await Patient.findOne({ userId });
  const patientId = patient ? patient._id : null;

  const [
    appointments,
    prescriptions,
    bills,
    dietPlans,
    activeBed,
    visitors,
    unreadNotifications
  ] = await Promise.all([
    Appointment.find({
      $or: [
        { userId },
        ...(patientId ? [{ patientId }] : [])
      ]
    }).sort({ date: 1, time: 1 }),
    Prescription.find({
      $or: [
        ...(patientId ? [{ patientId }] : []),
        { patientName: patient?.name }
      ]
    }).sort({ createdAt: -1 }),
    Bill.find({
      $or: [
        ...(patientId ? [{ patientId }] : []),
        { patientName: patient?.name }
      ]
    }).sort({ createdAt: -1 }),
    DietPlan.find({
      $or: [
        { userId },
        ...(patientId ? [{ patientId }] : [])
      ]
    }).sort({ createdAt: -1 }),
    Bed.findOne({
      $or: [
        { patientId: userId },
        ...(patientId ? [{ patientId }] : [])
      ],
      status: 'OCCUPIED'
    }),
    Visitor.find({
      $or: [
        ...(patientId ? [{ patientId }] : []),
        { patientName: patient?.name }
      ]
    }).sort({ createdAt: -1 }),
    Notification.countDocuments({ recipientId: userId, isRead: false })
  ]);

  const activeDietPlan = dietPlans.find((d) => d.isActive) || dietPlans[0] || null;

  return {
    patient: patient || { name: 'Patient', vitals: {} },
    stats: {
      totalAppointments: appointments.length,
      totalPrescriptions: prescriptions.length,
      totalBills: bills.length,
      unreadNotifications
    },
    appointments,
    prescriptions,
    bills,
    dietPlans,
    activeDietPlan,
    allocatedBed: activeBed,
    visitors
  };
};

export default {
  getRecentActivities,
  getAdminDashboard,
  getDoctorDashboard,
  getNurseDashboard,
  getReceptionistDashboard,
  getPharmacistDashboard,
  getPatientDashboard
};
