const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DEFAULT_DISCLAIMER =
  'This AI-generated plan is for general informational purposes and should not replace advice from a qualified healthcare professional.';

const normalizeAllergies = (allergies) => {
  if (Array.isArray(allergies)) {
    return allergies.map((a) => String(a).trim()).filter(Boolean);
  }
  if (typeof allergies === 'string') {
    return allergies.split(',').map((a) => a.trim()).filter(Boolean);
  }
  return [];
};

const calculateBMI = (heightCm, weightKg) => {
  const h = Number(heightCm);
  const w = Number(weightKg);
  if (!Number.isFinite(h) || !Number.isFinite(w) || h <= 0 || w <= 0) {
    return null;
  }
  return Math.round((w / Math.pow(h / 100, 2)) * 10) / 10;
};

const buildExercisePlan = (activity, currentDisease) => {
  const activityKey = (activity || 'moderate').toLowerCase();
  const plans = {
    sedentary: [
      { activity: 'Brisk walking', duration: '15-20 minutes', frequency: '3-5 days per week', intensity: 'Low' },
      { activity: 'Standing mobility exercises', duration: '10 minutes', frequency: '5-6 days per week', intensity: 'Low' },
      { activity: 'Full-body stretching', duration: '10-15 minutes', frequency: '5 days per week', intensity: 'Low' },
      { activity: 'Breathing & relaxation practice', duration: '5-10 minutes', frequency: 'Daily', intensity: 'Low' }
    ],
    moderate: [
      { activity: 'Brisk walking', duration: '30-40 minutes', frequency: '4-5 days per week', intensity: 'Moderate' },
      { activity: 'Cycling or swimming', duration: '25-30 minutes', frequency: '3 days per week', intensity: 'Moderate' },
      { activity: 'Strength training (bodyweight / light weights)', duration: '30 minutes', frequency: '2-3 days per week', intensity: 'Moderate' },
      { activity: 'Mobility & stretching', duration: '10-15 minutes', frequency: '5 days per week', intensity: 'Low' }
    ],
    active: [
      { activity: 'Structured strength training (push / pull / legs)', duration: '45-60 minutes', frequency: '4-5 days per week', intensity: 'High' },
      { activity: 'Cardio (running / rowing / HIIT)', duration: '30-40 minutes', frequency: '3-4 days per week', intensity: 'High' },
      { activity: 'Recovery & stretching', duration: '15-20 minutes', frequency: '4 days per week', intensity: 'Low' },
      { activity: 'Active rest days with light mobility', duration: '10 minutes', frequency: '1-2 days per week', intensity: 'Low' }
    ]
  };

  const plan = plans[activityKey] || plans.moderate;
  const disease = (currentDisease || '').toLowerCase();
  const augmented = [...plan];

  if (disease.includes('hypertension') || disease.includes('blood pressure')) {
    augmented.push({
      activity: 'Low-to-moderate steady cardio only; avoid heavy isometric / straining movements',
      duration: 'As tolerated',
      frequency: 'Per clinician advice',
      intensity: 'Low-Moderate'
    });
  } else if (disease.includes('heart') || disease.includes('cholesterol')) {
    augmented.push({
      activity: 'Gradually progressive cardio with medical clearance; avoid sudden high-intensity bursts',
      duration: '20-40 minutes',
      frequency: '3-5 days per week',
      intensity: 'Low-Moderate'
    });
  } else if (disease.includes('diabetes')) {
    augmented.push({
      activity: 'Monitor blood glucose before and after exercise; keep a snack available',
      duration: 'Session dependent',
      frequency: 'Per clinician advice',
      intensity: 'Low-Moderate'
    });
  } else if (disease.includes('asthma')) {
    augmented.push({
      activity: 'Warm-up slowly, avoid cold-air bursts, and keep a rescue inhaler accessible',
      duration: 'As tolerated',
      frequency: 'Per clinician advice',
      intensity: 'Low-Moderate'
    });
  }

  return augmented;
};

const buildHealthSafetyNotes = (questionnaire) => {
  const notes = [];
  const allergies = normalizeAllergies(questionnaire.allergies);
  const disease = (questionnaire.currentDisease || 'none').trim();
  const diseaseLower = disease.toLowerCase();

  if (allergies.length > 0) {
    notes.push(`Strictly avoid the reported allergens / restrictions: ${allergies.join(', ')}.`);
  }

  if (diseaseLower.includes('diabetes')) {
    notes.push('Monitor blood glucose regularly; prefer low glycemic index carbohydrates and discuss any meal or medication adjustments with your physician.');
  } else if (diseaseLower.includes('hypertension') || diseaseLower.includes('blood pressure')) {
    notes.push('Prioritize low-sodium foods (aim well under 2g/day), potassium-rich produce, and avoid excessive caffeine.');
  } else if (diseaseLower.includes('kidney') || diseaseLower.includes('renal')) {
    notes.push('Protein, potassium, and phosphorus may need to be restricted; consult a nephrologist or renal dietitian for precise limits before following this plan.');
  } else if (diseaseLower.includes('gastritis') || diseaseLower.includes('ulcer')) {
    notes.push('Avoid spicy, citrus, caffeine, and deep-fried foods; eat smaller, more frequent meals.');
  } else if (diseaseLower.includes('dengue') || diseaseLower.includes('typhoid') || diseaseLower.includes('malaria')) {
    notes.push('Focus on hydration, easily digestible foods, and adequate rest; follow your treating physician\'s recovery guidelines.');
  } else if (diseaseLower.includes('heart') || diseaseLower.includes('cholesterol')) {
    notes.push('Keep saturated and trans fats low, emphasize soluble fiber, and obtain medical clearance before starting any exercise routine.');
  } else if (diseaseLower.includes('asthma')) {
    notes.push('Keep a bronchodilator accessible during activity and stop exercising if wheezing or chest tightness develops.');
  } else if (diseaseLower.includes('anemia')) {
    notes.push('Include iron-rich foods with vitamin C to improve absorption; discuss iron supplementation with your doctor.');
  } else if (diseaseLower.includes('pcos') || diseaseLower.includes('thyroid')) {
    notes.push('Hormonal conditions benefit from consistent meal timing and stable carbohydrate intake; review this plan with your endocrinologist.');
  } else if (diseaseLower.includes('obesity')) {
    notes.push('Caloric targets here represent a moderate deficit; avoid crash dieting and prioritize sustainable, gradual changes.');
  } else if (disease && disease !== 'none' && disease !== 'no current disease / condition') {
    notes.push(`This plan is adapted for your reported condition (${disease}); please confirm suitability with a qualified healthcare professional.`);
  }

  notes.push('Nutritional values shown are estimates only and are not medically precise measurements.');
  notes.push('This AI-generated plan is not a medical diagnosis and does not guarantee treatment, weight loss, or disease reversal.');
  notes.push('Consult a qualified physician or clinical dietitian before starting any significant dietary or exercise change.');

  return notes;
};

const enrichStructuredFields = (questionnaire, core) => {
  const bmi = calculateBMI(questionnaire.height, questionnaire.weight);
  const weeklyMealPlan = (core.weeklyMeals || []).map((meal, idx) => ({
    day: `Day ${idx + 1}`,
    dayName: meal.day,
    breakfast: meal.breakfast || '',
    lunch: meal.lunch || '',
    dinner: meal.dinner || '',
    snacks: meal.snacks || ''
  }));

  return {
    ...core,
    summary: {
      age: Number(questionnaire.age) || 0,
      heightCm: Number(questionnaire.height) || 0,
      weightKg: Number(questionnaire.weight) || 0,
      bmi,
      dietaryType: (questionnaire.preference || 'vegetarian').toLowerCase(),
      activityLevel: (questionnaire.activity || 'moderate').toLowerCase()
    },
    dailyCalories: core.caloriesTarget,
    waterIntake: `${core.waterTarget} Liters / day`,
    weeklyMealPlan,
    exercisePlan: buildExercisePlan(questionnaire.activity, questionnaire.currentDisease),
    healthSafetyNotes: buildHealthSafetyNotes(questionnaire),
    disclaimer: DEFAULT_DISCLAIMER
  };
};

const buildWeeklyMealsFromAI = (meals) => {
  if (!Array.isArray(meals) || meals.length < 7) {
    return null;
  }
  const byDay = new Map();
  for (const meal of meals) {
    if (!meal || typeof meal !== 'object') {
      return null;
    }
    const day = String(meal.day || '').trim();
    if (!DAY_NAMES.includes(day)) {
      return null;
    }
    const breakfast = String(meal.breakfast || '').trim();
    const lunch = String(meal.lunch || '').trim();
    const dinner = String(meal.dinner || '').trim();
    if (!breakfast || !lunch || !dinner) {
      return null;
    }
    byDay.set(day, {
      day,
      breakfast,
      lunch,
      dinner,
      snacks: String(meal.snacks || '').trim()
    });
  }
  if (byDay.size < 7) {
    return null;
  }
  const ordered = DAY_NAMES.map((d) => byDay.get(d));
  return ordered.every(Boolean) ? ordered : null;
};

const extractJson = (text) => {
  const trimmed = String(text || '').trim();
  if (trimmed.startsWith('```')) {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced && fenced[1]) {
      return fenced[1].trim();
    }
  }
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    return trimmed;
  }
  return trimmed.slice(start, end + 1);
};

const calculateDeterministicDiet = (questionnaire) => {
  const age = Number(questionnaire.age) || 25;
  const height = Number(questionnaire.height) || 170;
  const weight = Number(questionnaire.weight) || 70;
  const gender = (questionnaire.gender || 'male').toLowerCase();
  const activity = questionnaire.activity || 'moderate';
  const preference = questionnaire.preference || 'vegetarian';
  const allergies = normalizeAllergies(questionnaire.allergies);
  const currentDisease = (questionnaire.currentDisease || 'none').trim();

  // Harris-Benedict Equation for BMR
  let bmr;
  if (gender === 'female') {
    bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
  } else {
    bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
  }

  let multiplier = 1.2;
  if (activity === 'light') multiplier = 1.375;
  else if (activity === 'moderate') multiplier = 1.55;
  else if (activity === 'active') multiplier = 1.725;
  else if (activity === 'very-active') multiplier = 1.9;

  let calories = Math.round(bmr * multiplier);
  let water = Math.round((weight * 35) / 100) / 10;
  let clinicalNote = `Customized recovery diet plan tailored for ${preference} preferences with ${activity} physical activity.`;

  const dLower = currentDisease.toLowerCase();
  let macros = { protein: Math.round(weight * 1.2), carbs: Math.round((calories * 0.5) / 4), fats: Math.round((calories * 0.25) / 9), fiber: 30 };

  if (dLower.includes('diabetes')) {
    clinicalNote = 'Low Glycemic Index (GI) focus with high soluble fiber to stabilize blood glucose spikes.';
    macros = { protein: Math.round(weight * 1.4), carbs: Math.round((calories * 0.4) / 4), fats: Math.round((calories * 0.3) / 9), fiber: 40 };
  } else if (dLower.includes('hypertension') || dLower.includes('blood pressure')) {
    clinicalNote = 'DASH-aligned dietary protocol focusing on potassium-rich foods and restricted sodium (< 2g/day).';
    macros = { protein: Math.round(weight * 1.2), carbs: Math.round((calories * 0.5) / 4), fats: Math.round((calories * 0.25) / 9), fiber: 35 };
  } else if (dLower.includes('dengue') || dLower.includes('typhoid') || dLower.includes('malaria')) {
    water = Math.max(water, 3.5);
    clinicalNote = 'High hydration and easy-to-digest light nutrient meals with electrolyte and antioxidant support.';
  } else if (dLower.includes('gastritis') || dLower.includes('ulcer')) {
    clinicalNote = 'Non-acidic, bland soothing foods. Avoid spicy, citrus, caffeine, and deep-fried items.';
  } else if (dLower.includes('kidney') || dLower.includes('renal')) {
    macros = { protein: Math.round(weight * 0.8), carbs: Math.round((calories * 0.55) / 4), fats: Math.round((calories * 0.25) / 9), fiber: 25 };
    clinicalNote = 'Controlled protein and low potassium/phosphorus foods. Consult your nephrologist for precise fluid limits.';
  } else if (dLower.includes('heart') || dLower.includes('cholesterol')) {
    clinicalNote = 'Zero saturated trans-fats, high soluble fiber, garlic, walnuts, and plant sterols for cardiovascular support.';
  } else if (dLower.includes('obesity') || dLower.includes('weight')) {
    calories = Math.max(1200, Math.round(calories * 0.85));
    macros = { protein: Math.round(weight * 1.6), carbs: Math.round((calories * 0.4) / 4), fats: Math.round((calories * 0.25) / 9), fiber: 35 };
    clinicalNote = 'Caloric deficit with high satiety protein and volume vegetables.';
  } else if (currentDisease && currentDisease !== 'none' && currentDisease !== 'No Current Disease / Condition') {
    clinicalNote = `Dietary recommendations customized to support ${currentDisease} recovery and metabolic wellness.`;
  }

  const isVeg = preference === 'vegetarian' || preference === 'vegan';

  const defaultMealsByDay = [
    {
      day: 'Monday',
      breakfast: dLower.includes('diabetes') ? 'Steel-cut oats with cinnamon, walnuts, and chia seeds' : (isVeg ? 'Oats porridge with chia seeds and almond milk' : 'Boiled egg whites with avocado whole wheat toast'),
      lunch: isVeg ? 'Quinoa stir-fry with tofu, steamed spinach, and cucumber salad' : 'Grilled chicken breast with quinoa and steamed greens',
      dinner: 'Whole wheat flatbread with yellow lentil soup (dal) and sautéed gourd',
      snacks: 'Spiced buttermilk, roasted pumpkin seeds'
    },
    {
      day: 'Tuesday',
      breakfast: 'Vegetable semolina upma with soaked almonds and green tea',
      lunch: isVeg ? 'Brown rice, mixed bean chili, tomato cucumber salad' : 'Steamed fish fillet with brown rice and mixed vegetable stew',
      dinner: 'Sweet potato soup with grilled cottage cheese or tofu',
      snacks: 'Apple slices with almond butter'
    },
    {
      day: 'Wednesday',
      breakfast: 'Multigrain toast with avocado mash and boiled egg/paneer',
      lunch: 'Paneer bhurji (or tofu scramble) with multigrain rotis & fresh green salad',
      dinner: 'Stir-fried broccoli, bell peppers and mushrooms with cooked quinoa',
      snacks: 'Spiced roasted chickpeas, herbal tea'
    },
    {
      day: 'Thursday',
      breakfast: 'Sprouted moong dal salad with lemon dressing and walnuts',
      lunch: 'Sautéed brown rice with mixed vegetable curry and homemade curd',
      dinner: 'Yellow lentil soup with steamed asparagus and baked sweet potato',
      snacks: 'Mixed berries, flaxseeds'
    },
    {
      day: 'Friday',
      breakfast: 'Banana berry oats smoothie with chia seed powder',
      lunch: 'Quinoa bowl with bell peppers, edamame, and roasted beans',
      dinner: 'Soft whole wheat rotis with dry bottle gourd / spinach sabzi',
      snacks: 'Cucumber & carrot sticks with hummus'
    },
    {
      day: 'Saturday',
      breakfast: 'Paneer or tofu stuffed paratha cooked with olive oil spray',
      lunch: isVeg ? 'Chickpea spinach curry with brown rice' : 'Grilled salmon fillet with sautéed asparagus and brown rice',
      dinner: 'Baked vegetable casserole with fresh tomato basil glaze',
      snacks: 'Roasted almonds, chamomile tea'
    },
    {
      day: 'Sunday',
      breakfast: 'Poha with roasted peanuts, turmeric, and fresh curry leaves',
      lunch: 'Millet khichdi with roasted papad and probiotic curd',
      dinner: 'Minestrone vegetable soup with grilled tofu skewers',
      snacks: 'Chia pudding with coconut or almond milk'
    }
  ];

  const core = {
    caloriesTarget: calories,
    waterTarget: water,
    macros: macros,
    clinicalNote: clinicalNote,
    weeklyMeals: defaultMealsByDay
  };

  return enrichStructuredFields(questionnaire, core);
};

const generateDietPlanWithAI = async (questionnaire) => {
  const apiKey = process.env.AI_API_KEY;
  const modelName = process.env.AI_MODEL || 'gemini-3.1-flash-lite';

  const basePlan = calculateDeterministicDiet(questionnaire);

  if (!apiKey) {
    return basePlan;
  }

  try {
    const prompt = `You are a clinical nutritionist and medical dietitian AI.
Generate a structured 7-day personalized meal plan, exercise plan, and nutritional targets based on this patient questionnaire:
- Age: ${questionnaire.age}
- Gender: ${questionnaire.gender || 'male'}
- Height: ${questionnaire.height} cm
- Weight: ${questionnaire.weight} kg
- Dietary Preference: ${questionnaire.preference || 'vegetarian'}
- Known Allergies / Restrictions: ${normalizeAllergies(questionnaire.allergies).join(', ') || 'None'}
- Activity Level: ${questionnaire.activity || 'moderate'}
- Current Medical Condition / Disease: ${questionnaire.currentDisease || 'None'}

Dietary rules:
- Vegetarian: no meat, no fish, no poultry (dairy/eggs allowed).
- Vegan: no meat, no fish, no poultry, no dairy, no eggs.
- Non-Vegetarian: may include appropriate animal-protein options.
- Keto: prioritize low-carbohydrate foods and avoid high-carbohydrate meal suggestions.
- Never recommend foods that conflict with the listed allergies / restrictions.
- Tailor exercise recommendations to the supplied activity level (sedentary / moderate / active).

Return ONLY a valid JSON object (no markdown, no backticks, no extra text) with EXACTLY this structure:
{
  "summary": { "age": <number>, "heightCm": <number>, "weightKg": <number>, "bmi": <number>, "dietaryType": "<string>", "activityLevel": "<string>" },
  "caloriesTarget": <number in kcal>,
  "waterTarget": <number in liters, e.g. 2.8>,
  "macros": { "protein": <grams>, "carbohydrates": <grams>, "fats": <grams>, "fiber": <grams> },
  "clinicalNote": "<1-2 sentence clinical dietitian recovery rationale>",
  "weeklyMeals": [
    { "day": "Monday", "breakfast": "<items>", "lunch": "<items>", "dinner": "<items>", "snacks": "<items>" },
    { "day": "Tuesday", "breakfast": "<items>", "lunch": "<items>", "dinner": "<items>", "snacks": "<items>" },
    { "day": "Wednesday", "breakfast": "<items>", "lunch": "<items>", "dinner": "<items>", "snacks": "<items>" },
    { "day": "Thursday", "breakfast": "<items>", "lunch": "<items>", "dinner": "<items>", "snacks": "<items>" },
    { "day": "Friday", "breakfast": "<items>", "lunch": "<items>", "dinner": "<items>", "snacks": "<items>" },
    { "day": "Saturday", "breakfast": "<items>", "lunch": "<items>", "dinner": "<items>", "snacks": "<items>" },
    { "day": "Sunday", "breakfast": "<items>", "lunch": "<items>", "dinner": "<items>", "snacks": "<items>" }
  ],
  "exercisePlan": [
    { "activity": "<activity name>", "duration": "<duration>", "frequency": "<frequency>", "intensity": "<Low/Moderate/High>" }
  ],
  "healthSafetyNotes": ["<precaution 1>", "<precaution 2>"],
  "disclaimer": "<cautious healthcare disclaimer>"
}

Use the exact day names above (Monday through Sunday). Include all 7 days. The disclaimer must state that the plan is for general informational purposes and should not replace advice from a qualified healthcare professional. Use cautious language; do not claim a diagnosis, guaranteed treatment, or guaranteed weight loss.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      console.warn(`AI API returned status ${response.status}. Using clinical fallback plan.`);
      return basePlan;
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      return basePlan;
    }

    const parsed = JSON.parse(extractJson(candidateText));

    const weeklyMeals = buildWeeklyMealsFromAI(parsed.weeklyMeals);
    if (!weeklyMeals || !parsed.caloriesTarget) {
      return basePlan;
    }

    const core = {
      caloriesTarget: Number(parsed.caloriesTarget) || basePlan.caloriesTarget,
      waterTarget: Number(parsed.waterTarget) || basePlan.waterTarget,
      macros: {
        protein: Number(parsed.macros?.protein) || basePlan.macros.protein,
        carbs: Number(parsed.macros?.carbohydrates ?? parsed.macros?.carbs) || basePlan.macros.carbs,
        fats: Number(parsed.macros?.fats) || basePlan.macros.fats,
        fiber: Number(parsed.macros?.fiber) || basePlan.macros.fiber
      },
      clinicalNote: String(parsed.clinicalNote || basePlan.clinicalNote),
      weeklyMeals
    };

    const structured = enrichStructuredFields(questionnaire, core);

    if (parsed.summary && typeof parsed.summary === 'object') {
      structured.summary = {
        ...structured.summary,
        age: Number(parsed.summary.age) || structured.summary.age,
        heightCm: Number(parsed.summary.heightCm) || structured.summary.heightCm,
        weightKg: Number(parsed.summary.weightKg) || structured.summary.weightKg,
        bmi: Number(parsed.summary.bmi) || structured.summary.bmi,
        dietaryType: String(parsed.summary.dietaryType || structured.summary.dietaryType).toLowerCase(),
        activityLevel: String(parsed.summary.activityLevel || structured.summary.activityLevel).toLowerCase()
      };
    }

    if (Array.isArray(parsed.exercisePlan) && parsed.exercisePlan.length > 0) {
      structured.exercisePlan = parsed.exercisePlan
        .filter((item) => item && typeof item === 'object' && (item.activity || item.duration))
        .slice(0, 10)
        .map((item) => ({
          activity: String(item.activity || ''),
          duration: String(item.duration || ''),
          frequency: String(item.frequency || ''),
          intensity: String(item.intensity || '')
        }));
    }

    if (Array.isArray(parsed.healthSafetyNotes) && parsed.healthSafetyNotes.length > 0) {
      structured.healthSafetyNotes = parsed.healthSafetyNotes.map((n) => String(n).trim()).filter(Boolean);
    }

    if (parsed.disclaimer) {
      structured.disclaimer = String(parsed.disclaimer).trim();
    }

    return structured;
  } catch (error) {
    console.error('Error generating diet plan with AI:', error.message);
    return basePlan;
  }
};

export {
  calculateDeterministicDiet,
  generateDietPlanWithAI
};

export default {
  calculateDeterministicDiet,
  generateDietPlanWithAI
};