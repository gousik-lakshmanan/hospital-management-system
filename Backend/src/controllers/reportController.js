import reportService from '../services/reportService.js';

// GET /api/reports/overview
export const getOverviewReport = async (req, res) => {
  try {
    const from = req.query.from || req.query.startDate;
    const to = req.query.to || req.query.endDate;
    const report = await reportService.getHospitalOverviewReport({ from, to });
    return res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to generate hospital overview report.',
      error: error.message
    });
  }
};

// GET /api/reports/patients
export const getPatientsReport = async (req, res) => {
  try {
    const from = req.query.from || req.query.startDate;
    const to = req.query.to || req.query.endDate;
    const report = await reportService.getPatientReport({ from, to });
    return res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to generate patient demographics report.',
      error: error.message
    });
  }
};

// GET /api/reports/appointments
export const getAppointmentsReport = async (req, res) => {
  try {
    const from = req.query.from || req.query.startDate;
    const to = req.query.to || req.query.endDate;
    const report = await reportService.getAppointmentReport({ from, to });
    return res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to generate appointments analytics report.',
      error: error.message
    });
  }
};

// GET /api/reports/rooms
export const getRoomsReport = async (req, res) => {
  try {
    const report = await reportService.getBedOccupancyReport();
    return res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to generate room & bed occupancy report.',
      error: error.message
    });
  }
};

// GET /api/reports/pharmacy
export const getPharmacyReport = async (req, res) => {
  try {
    const from = req.query.from || req.query.startDate;
    const to = req.query.to || req.query.endDate;
    const report = await reportService.getPharmacyReport({ from, to });
    return res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to generate pharmacy inventory report.',
      error: error.message
    });
  }
};

// GET /api/reports/blood-bank
export const getBloodBankReport = async (req, res) => {
  try {
    const report = await reportService.getBloodBankReport();
    return res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to generate blood bank stock report.',
      error: error.message
    });
  }
};

// GET /api/reports/visitors
export const getVisitorsReport = async (req, res) => {
  try {
    const from = req.query.from || req.query.startDate;
    const to = req.query.to || req.query.endDate;
    const report = await reportService.getVisitorReport({ from, to });
    return res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to generate visitor flow report.',
      error: error.message
    });
  }
};

// GET /api/reports/billing
export const getBillingReport = async (req, res) => {
  try {
    const from = req.query.from || req.query.startDate;
    const to = req.query.to || req.query.endDate;
    const report = await reportService.getBillingReport({ from, to });
    return res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to generate financial billing report.',
      error: error.message
    });
  }
};

// GET /api/reports/diet-plans
export const getDietPlansReport = async (req, res) => {
  try {
    const report = await reportService.getDietPlanningReport();
    return res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to generate diet planning analytics report.',
      error: error.message
    });
  }
};
