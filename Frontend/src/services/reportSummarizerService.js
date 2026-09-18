import api from './api.js';

export const reportSummarizerService = {
  summarizeReport: async (reportData) => {
    const response = await api.post('/report-summaries', reportData);
    return response.data;
  },
  getMyReportSummaries: async () => {
    const response = await api.get('/report-summaries/me');
    return response.data;
  }
};
