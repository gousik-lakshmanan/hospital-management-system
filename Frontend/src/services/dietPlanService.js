import api from './api';

export const dietPlanService = {
  createDietPlan: async (questionnaire) => {
    const response = await api.post('/diet-plans', questionnaire);
    return response.data;
  },

  generateAIDietPlan: async (payload) => {
    const response = await api.post('/diet-plans/ai-generate', payload);
    return response.data;
  },

  getMyDietPlans: async () => {
    const response = await api.get('/diet-plans/me');
    return response.data;
  },

  getMyTodayTarget: async () => {
    const response = await api.get('/diet-plans/me/today');
    return response.data;
  },

  getDietPlans: async (params = {}) => {
    const response = await api.get('/diet-plans', { params });
    return response.data;
  },

  assignDietPlan: async (planData) => {
    const response = await api.post('/diet-plans/assign', planData);
    return response.data;
  }
};

export default dietPlanService;
