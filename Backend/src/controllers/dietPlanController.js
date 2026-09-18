import mongoose from 'mongoose';
import DietPlan from '../models/DietPlan.js';
import Patient from '../models/Patient.js';
import { generateDietPlanWithAI } from '../services/aiDietPlannerService.js';
import { createNotification } from '../services/notificationService.js';

const getDayName = () => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date().getDay()];
};

// POST /api/diet-plans - Generate and save new diet plan
export const createDietPlan = async (req, res) => {
  try {
    const {
      age,
      gender = 'male',
      height,
      weight,
      preference = 'vegetarian',
      allergies = [],
      activity = 'moderate',
      currentDisease = 'none',
      patientId
    } = req.body;

    if (!age || !height || !weight) {
      return res.status(400).json({
        success: false,
        message: 'Age, height, and weight are required to formulate a diet plan.'
      });
    }

    let targetUserId = req.user._id;
    let targetPatientId = null;
    let patientName = req.user.name || 'Patient';

    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ userId: req.user._id });
      if (patient) {
        targetPatientId = patient._id;
        patientName = patient.name;
      }
    } else if (patientId && mongoose.Types.ObjectId.isValid(patientId)) {
      const patient = await Patient.findById(patientId);
      if (patient) {
        targetPatientId = patient._id;
        targetUserId = patient.userId || req.user._id;
        patientName = patient.name;
      }
    }

    const questionnaire = {
      age: Number(age),
      gender,
      height: Number(height),
      weight: Number(weight),
      preference,
      allergies: Array.isArray(allergies) ? allergies : (typeof allergies === 'string' ? allergies.split(',').map(s => s.trim()).filter(Boolean) : []),
      activity,
      currentDisease: (currentDisease || 'none').trim()
    };

    // Generate AI/clinical plan
    const generated = await generateDietPlanWithAI(questionnaire);

    // Identify today's meal
    const todayName = getDayName();
    const todayMeal = generated.weeklyMeals.find(m => m.day === todayName) || generated.weeklyMeals[0];

    const todayTarget = {
      breakfast: todayMeal.breakfast,
      lunch: todayMeal.lunch,
      dinner: todayMeal.dinner,
      snacks: todayMeal.snacks || '',
      calories: generated.caloriesTarget,
      water: generated.waterTarget
    };

    // Deactivate existing active plans for this user/patient
    await DietPlan.updateMany(
      {
        $or: [
          { userId: targetUserId },
          ...(targetPatientId ? [{ patientId: targetPatientId }] : [])
        ],
        isActive: true
      },
      { $set: { isActive: false } }
    );

    // Create new diet plan
    const newDietPlan = await DietPlan.create({
      userId: targetUserId,
      patientId: targetPatientId,
      patientName,
      questionnaire,
      caloriesTarget: generated.caloriesTarget,
      waterTarget: generated.waterTarget,
      macros: generated.macros,
      clinicalNote: generated.clinicalNote,
      weeklyMeals: generated.weeklyMeals,
      todayTarget,
      source: req.user.role === 'patient' ? 'AI_GENERATED' : 'CLINICAL_ASSIGNED',
      assignedBy: req.user.role !== 'patient' ? req.user._id : null,
      assignedByName: req.user.role !== 'patient' ? req.user.name : '',
      isActive: true
    });

    if (req.user.role !== 'patient' && targetUserId) {
      createNotification({
        recipient: targetUserId,
        title: 'New Diet Plan Assigned',
        message: `A personalized recovery diet plan was assigned by ${req.user.name || 'Medical Staff'}.`,
        type: 'diet_plan',
        priority: 'normal',
        link: '/patient/diet-plan',
        metadata: { planId: newDietPlan._id },
        dedupeKey: `diet-assign-${newDietPlan._id}`
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Diet plan generated and recorded successfully.',
      data: newDietPlan
    });
  } catch (error) {
    console.error('Error in createDietPlan:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate diet plan.',
      error: error.message
    });
  }
};

// GET /api/diet-plans/me - Get current user's diet plans
export const getMyDietPlans = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id });
    const orConditions = [{ userId: req.user._id }];
    if (patient) {
      orConditions.push({ patientId: patient._id });
    }

    const plans = await DietPlan.find({ $or: orConditions }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: plans.length,
      data: plans
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch personal diet plans.',
      error: error.message
    });
  }
};

// GET /api/diet-plans/me/today - Get current user's today target
export const getMyTodayTarget = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id });
    const orConditions = [{ userId: req.user._id }];
    if (patient) {
      orConditions.push({ patientId: patient._id });
    }

    const activePlan = await DietPlan.findOne({
      $or: orConditions,
      isActive: true
    }).sort({ createdAt: -1 });

    if (!activePlan) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No active diet plan found.'
      });
    }

    // Refresh todayTarget dynamically according to current day of week
    const todayName = getDayName();
    const todayMeal = activePlan.weeklyMeals.find(m => m.day === todayName) || activePlan.weeklyMeals[0] || {};

    const currentTodayTarget = {
      breakfast: todayMeal.breakfast || activePlan.todayTarget?.breakfast || '',
      lunch: todayMeal.lunch || activePlan.todayTarget?.lunch || '',
      dinner: todayMeal.dinner || activePlan.todayTarget?.dinner || '',
      snacks: todayMeal.snacks || activePlan.todayTarget?.snacks || '',
      calories: activePlan.caloriesTarget,
      water: activePlan.waterTarget,
      macros: activePlan.macros,
      clinicalNote: activePlan.clinicalNote,
      currentDisease: activePlan.questionnaire?.currentDisease || 'none'
    };

    return res.status(200).json({
      success: true,
      data: currentTodayTarget
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch today target.',
      error: error.message
    });
  }
};

// GET /api/diet-plans - Directory of diet plans (Doctors, Nurses, Admins)
export const getDietPlans = async (req, res) => {
  try {
    const { patientId, search } = req.query;
    let filter = {};

    if (patientId && mongoose.Types.ObjectId.isValid(patientId)) {
      filter.patientId = patientId;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { patientName: searchRegex },
        { 'questionnaire.currentDisease': searchRegex }
      ];
    }

    const plans = await DietPlan.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: plans.length,
      data: plans
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch diet plans directory.',
      error: error.message
    });
  }
};

// POST /api/diet-plans/assign - Clinician assigns manual/tailored diet sheet to patient
export const assignDietPlan = async (req, res) => {
  try {
    const {
      patientId,
      breakfast,
      lunch,
      dinner,
      snacks = 'Green tea, mixed walnuts',
      calories = '2000 kcal',
      water = 2.5,
      clinicalNote = 'Assigned clinical recovery diet sheet'
    } = req.body;

    if (!patientId || !breakfast || !lunch || !dinner) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID, breakfast, lunch, and dinner are required to assign a diet sheet.'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid patient ID format.'
      });
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Referenced patient was not found.'
      });
    }

    const numericCalories = parseInt(calories, 10) || 2000;
    const numericWater = parseFloat(water) || 2.5;

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const weeklyMeals = days.map((day) => ({
      day,
      breakfast: breakfast.trim(),
      lunch: lunch.trim(),
      dinner: dinner.trim(),
      snacks: snacks.trim()
    }));

    const todayTarget = {
      breakfast: breakfast.trim(),
      lunch: lunch.trim(),
      dinner: dinner.trim(),
      snacks: snacks.trim(),
      calories: numericCalories,
      water: numericWater
    };

    // Deactivate previous active plans for this patient
    await DietPlan.updateMany(
      {
        $or: [
          { patientId: patient._id },
          ...(patient.userId ? [{ userId: patient.userId }] : [])
        ],
        isActive: true
      },
      { $set: { isActive: false } }
    );

    const newDietPlan = await DietPlan.create({
      userId: patient.userId || req.user._id,
      patientId: patient._id,
      patientName: patient.name,
      questionnaire: {
        age: patient.age || 30,
        gender: (patient.gender || 'male').toLowerCase(),
        height: 170,
        weight: 70,
        preference: 'vegetarian',
        allergies: patient.allergies ? (Array.isArray(patient.allergies) ? patient.allergies : [patient.allergies]) : [],
        activity: 'moderate',
        currentDisease: patient.diagnosis || patient.condition || 'none'
      },
      caloriesTarget: numericCalories,
      waterTarget: numericWater,
      macros: { protein: 75, carbs: 220, fats: 50, fiber: 28 },
      clinicalNote: clinicalNote.trim(),
      weeklyMeals,
      todayTarget,
      source: 'CLINICAL_ASSIGNED',
      assignedBy: req.user._id,
      assignedByName: req.user.name || 'Clinical Staff',
      isActive: true
    });

    return res.status(201).json({
      success: true,
      message: 'Clinical diet sheet assigned successfully.',
      data: newDietPlan
    });
  } catch (error) {
    console.error('Error in assignDietPlan:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to assign diet plan.',
      error: error.message
    });
  }
};
