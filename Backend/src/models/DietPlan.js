import mongoose from 'mongoose';

const weeklyMealSchema = new mongoose.Schema({
  day: {
    type: String,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  breakfast: { type: String, required: true, trim: true },
  lunch: { type: String, required: true, trim: true },
  dinner: { type: String, required: true, trim: true },
  snacks: { type: String, default: '', trim: true }
}, { _id: false });

const dietPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    default: null
  },
  patientName: {
    type: String,
    required: [true, 'Patient name is required'],
    trim: true
  },
  questionnaire: {
    age: { type: Number, required: true, min: 1, max: 120 },
    gender: { type: String, enum: ['male', 'female', 'other'], default: 'male', lowercase: true },
    height: { type: Number, required: true, min: 40, max: 260 }, // cm
    weight: { type: Number, required: true, min: 2, max: 300 }, // kg
    preference: {
      type: String,
      enum: ['vegetarian', 'non-vegetarian', 'vegan', 'eggetarian', 'keto'],
      default: 'vegetarian',
      lowercase: true
    },
    allergies: {
      type: [String],
      default: []
    },
    activity: {
      type: String,
      enum: ['sedentary', 'light', 'moderate', 'active', 'very-active'],
      default: 'moderate',
      lowercase: true
    },
    currentDisease: {
      type: String,
      default: 'none',
      trim: true
    }
  },
  caloriesTarget: {
    type: Number,
    required: true,
    min: 500,
    max: 6000
  },
  waterTarget: {
    type: Number,
    required: true,
    min: 0.5,
    max: 10
  },
  macros: {
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fats: { type: Number, default: 0 },
    fiber: { type: Number, default: 0 }
  },
  clinicalNote: {
    type: String,
    default: '',
    trim: true
  },
  weeklyMeals: {
    type: [weeklyMealSchema],
    default: []
  },
  todayTarget: {
    breakfast: { type: String, default: '' },
    lunch: { type: String, default: '' },
    dinner: { type: String, default: '' },
    snacks: { type: String, default: '' },
    calories: { type: Number, default: 0 },
    water: { type: Number, default: 0 }
  },
  source: {
    type: String,
    enum: ['AI_GENERATED', 'CLINICAL_ASSIGNED'],
    default: 'AI_GENERATED'
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignedByName: {
    type: String,
    default: '',
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

dietPlanSchema.index({ userId: 1, createdAt: -1 });
dietPlanSchema.index({ patientId: 1, createdAt: -1 });

const DietPlan = mongoose.model('DietPlan', dietPlanSchema);
export default DietPlan;

