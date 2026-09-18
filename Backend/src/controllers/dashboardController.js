import dashboardService from '../services/dashboardService.js';

// GET /api/dashboard - Dispatches live dashboard payload based on authenticated role and identity
export const getDashboard = async (req, res) => {
  try {
    const { role, _id } = req.user;
    let data = null;

    switch (role) {
      case 'admin':
        data = await dashboardService.getAdminDashboard(_id);
        break;
      case 'doctor':
        data = await dashboardService.getDoctorDashboard(_id);
        break;
      case 'nurse':
        data = await dashboardService.getNurseDashboard(_id);
        break;
      case 'receptionist':
        data = await dashboardService.getReceptionistDashboard(_id);
        break;
      case 'pharmacist':
        data = await dashboardService.getPharmacistDashboard(_id);
        break;
      case 'patient':
        data = await dashboardService.getPatientDashboard(_id);
        break;
      default:
        return res.status(403).json({
          success: false,
          message: 'Unknown role for dashboard.'
        });
    }

    return res.status(200).json({
      success: true,
      role,
      data
    });
  } catch (error) {
    console.error('Error in getDashboard controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard data.',
      error: error.message
    });
  }
};
