import api from './api';

export const bedRequestService = {
  // POST /api/bed-requests - Patient submits a bed request for a section
  createBedRequest: async ({ sectionId }) => {
    const response = await api.post('/bed-requests', { sectionId });
    return response.data;
  },

  // GET /api/bed-requests/my - Patient views own bed requests
  getMyBedRequests: async () => {
    const response = await api.get('/bed-requests/my');
    return response.data;
  },

  // GET /api/bed-requests - Admin views all bed requests
  getAllBedRequests: async () => {
    const response = await api.get('/bed-requests');
    return response.data;
  },

  // PATCH /api/bed-requests/:id/approve - Admin approves a bed request with selected bedId
  approveBedRequest: async (requestId, bedId) => {
    const response = await api.patch(`/bed-requests/${requestId}/approve`, { bedId });
    return response.data;
  },

  // PATCH /api/bed-requests/:id/reject - Admin rejects a bed request
  rejectBedRequest: async (requestId) => {
    const response = await api.patch(`/bed-requests/${requestId}/reject`);
    return response.data;
  },
};

export default bedRequestService;
