const calculateDeterministicDiet = (questionnaire) => {
  const age = Number(questionnaire.age) || 25;
  const height = Number(questionnaire.height) || 170;
  const weight = Number(questionnaire.weight) || 70;
  const gender = (questionnaire.gender || 'male').toLowerCase();
  const activity = questionnaire.activity || 'moderate';
  const preference = questionnaire.preference || 'vegetarian';
  const allergies = Array.isArray(questionnaire.allergies) ? questionnaire.allergies : (questionnaire.allergies ? [questionnaire.allergies] : []);
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

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
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

  return {
    caloriesTarget: calories,
    waterTarget: water,
    macros: macros,
    clinicalNote: clinicalNote,
    weeklyMeals: defaultMealsByDay
  };
};

const generateDietPlanWithAI = async (questionnaire) => {
  const apiKey = process.env.AI_API_KEY;
  const modelName = process.env.AI_MODEL || 'gemini-1.5-flash';

  const basePlan = calculateDeterministicDiet(questionnaire);

  if (!apiKey) {
    return basePlan;
  }

  try {
    const prompt = `You are a clinical nutritionist and medical dietitian AI.
Generate a structured 7-day personalized meal plan and nutritional targets based on this patient questionnaire:
- Age: ${questionnaire.age}
- Gender: ${questionnaire.gender || 'male'}
- Height: ${questionnaire.height} cm
- Weight: ${questionnaire.weight} kg
- Dietary Preference: ${questionnaire.preference || 'vegetarian'}
- Known Allergies: ${Array.isArray(questionnaire.allergies) ? questionnaire.allergies.join(', ') : questionnaire.allergies || 'None'}
- Activity Level: ${questionnaire.activity || 'moderate'}
- Current Medical Condition / Disease: ${questionnaire.currentDisease || 'None'}

Return ONLY a valid JSON object (no markdown, no backticks, no extra text) with the following structure:
{
  "caloriesTarget": <number in kcal>,
  "waterTarget": <number in liters, e.g. 2.8>,
  "macros": {
    "protein": <number in grams>,
    "carbs": <number in grams>,
    "fats": <number in grams>,
    "fiber": <number in grams>
  },
  "clinicalNote": "<1-2 sentences clinical dietitian recovery rationale>",
  "weeklyMeals": [
    {
      "day": "Monday",
      "breakfast": "<detailed breakfast items>",
      "lunch": "<detailed lunch items>",
      "dinner": "<detailed dinner items>",
      "snacks": "<healthy snack items>"
    },
    { "day": "Tuesday", "breakfast": "...", "lunch": "...", "dinner": "...", "snacks": "..." },
    { "day": "Wednesday", "breakfast": "...", "lunch": "...", "dinner": "...", "snacks": "..." },
    { "day": "Thursday", "breakfast": "...", "lunch": "...", "dinner": "...", "snacks": "..." },
    { "day": "Friday", "breakfast": "...", "lunch": "...", "dinner": "...", "snacks": "..." },
    { "day": "Saturday", "breakfast": "...", "lunch": "...", "dinner": "...", "snacks": "..." },
    { "day": "Sunday", "breakfast": "...", "lunch": "...", "dinner": "...", "snacks": "..." }
  ]
}`;

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

    // Clean JSON if backticks are returned
    let cleanJson = candidateText.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.slice(7);
    }
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.slice(3);
    }
    if (cleanJson.endsWith('```')) {
      cleanJson = cleanJson.slice(0, -3);
    }
    cleanJson = cleanJson.trim();

    const parsed = JSON.parse(cleanJson);

    // Validate structure
    if (!parsed.caloriesTarget || !Array.isArray(parsed.weeklyMeals) || parsed.weeklyMeals.length < 7) {
      return basePlan;
    }

    return {
      caloriesTarget: Number(parsed.caloriesTarget) || basePlan.caloriesTarget,
      waterTarget: Number(parsed.waterTarget) || basePlan.waterTarget,
      macros: {
        protein: Number(parsed.macros?.protein) || basePlan.macros.protein,
        carbs: Number(parsed.macros?.carbs) || basePlan.macros.carbs,
        fats: Number(parsed.macros?.fats) || basePlan.macros.fats,
        fiber: Number(parsed.macros?.fiber) || basePlan.macros.fiber
      },
      clinicalNote: parsed.clinicalNote || basePlan.clinicalNote,
      weeklyMeals: parsed.weeklyMeals
    };
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

