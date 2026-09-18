import Notification from '../models/Notification.js';

export const seedStage8 = async () => {
  try {
    await Notification.syncIndexes();
    console.log('--- Stage 8 Seed: Notification indexes synchronized successfully ---');
  } catch (error) {
    console.error('--- Stage 8 Seed error:', error.message);
  }
};
