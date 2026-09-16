import api from './api';

export const profileService = {
  /**
   * Fetch current authenticated user's complete profile from MongoDB
   */
  getProfile: async () => {
    const response = await api.get('/profile/me');
    return response.data;
  },

  /**
   * Update current authenticated user's profile fields
   */
  updateProfile: async (profileData) => {
    const response = await api.put('/profile/me', profileData);
    return response.data;
  },

  /**
   * Upload or update profile picture (Base64 data URI)
   */
  updateProfilePicture: async (profilePicture) => {
    const response = await api.put('/profile/me/picture', { profilePicture });
    return response.data;
  },
};

export default profileService;
