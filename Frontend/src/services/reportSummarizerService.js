import api from './api.js';

export const reportSummarizerService = {
  analyzeReport: async (file) => {
    const formData = new FormData();
    formData.append('report', file);
    const response = await api.post('/report-summaries', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  getMyReportSummaries: async () => {
    const response = await api.get('/report-summaries/me');
    return response.data;
  }
};

export default reportSummarizerService;