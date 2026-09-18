import React, { useState, useEffect } from 'react';
import { Salad, Calendar, Compass, ShieldAlert, Activity, AlertCircle, Sparkles, Dumbbell, Droplets, Flame } from 'lucide-react';
import { useDietPlan } from '../../context/DietPlanContext';
import Card from '../common/Card';
import Button from '../common/Button';

const DISEASE_OPTIONS = [
  'No Current Disease / Condition',
  'Typhoid',
  'Dengue',
  'Malaria',
  'Diabetes',
  'Hypertension',
  'Asthma',
  'Anemia',
  'Gastritis',
  'Ulcer',
  'Kidney Disease',
  'Liver Disease',
  'Heart Disease',
  'Obesity',
  'PCOS',
  'Thyroid Disorder',
  'High Cholesterol',
  'Other'
];

const DEFAULT_DISCLAIMER =
  'This AI-generated plan is for general informational purposes and should not replace advice from a qualified healthcare professional.';

const humanizeDietType = (value) => {
  if (!value) return 'Not specified';
  const map = {
    vegetarian: 'Vegetarian',
    vegan: 'Vegan',
    'non-vegetarian': 'Non-Vegetarian',
    keto: 'Keto-Friendly',
    eggetarian: 'Eggetarian'
  };
  return map[String(value).toLowerCase()] || String(value);
};

const humanizeActivity = (value) => {
  if (!value) return 'Not specified';
  const map = {
    sedentary: 'Sedentary (No exercise)',
    light: 'Light activity',
    moderate: 'Moderate (3-4 days exercise)',
    active: 'Active (Heavy gym workout)',
    'very-active': 'Very active'
  };
  return map[String(value).toLowerCase()] || String(value);
};

const buildViewFromPlan = (plan) => {
  const summary = plan.summary || {};
  const rawMacros = plan.macros || null;
  const macroEntries = rawMacros
    ? [
        { label: 'Protein', value: rawMacros.protein },
        { label: 'Carbohydrates', value: rawMacros.carbohydrates },
        { label: 'Fats', value: rawMacros.fats },
        { label: 'Fiber', value: rawMacros.fiber }
      ].filter((m) => m.value != null && m.value !== '')
    : [];

  return {
    age: summary.age,
    heightCm: summary.heightCm,
    weightKg: summary.weightKg,
    bmi: summary.bmi,
    dietaryType: summary.dietaryType,
    activityLevel: summary.activityLevel,
    dailyCalories: plan.dailyCalories,
    waterIntake: plan.waterIntake,
    macronutrients: macroEntries,
    meals: Array.isArray(plan.weeklyMealPlan) ? plan.weeklyMealPlan : [],
    exercisePlan: Array.isArray(plan.exercisePlan) ? plan.exercisePlan : [],
    healthSafetyNotes: Array.isArray(plan.healthSafetyNotes) ? plan.healthSafetyNotes : [],
    disclaimer: plan.disclaimer || DEFAULT_DISCLAIMER,
    clinicalNote: plan.clinicalNote || '',
    currentDisease: ''
  };
};

const buildViewFromDoc = (doc) => {
  const aiSummary = doc.aiSummary || {};
  const q = doc.questionnaire || {};
  const macros = doc.macros || {};
  const meals = (Array.isArray(doc.weeklyMeals) ? doc.weeklyMeals : []).map((m, idx) => ({
    day: `Day ${idx + 1}`,
    dayName: m.day,
    breakfast: m.breakfast || '',
    lunch: m.lunch || '',
    dinner: m.dinner || '',
    snacks: m.snacks || ''
  }));

  return {
    age: q.age ?? aiSummary.age,
    heightCm: q.height ?? aiSummary.heightCm,
    weightKg: q.weight ?? aiSummary.weightKg,
    bmi: aiSummary.bmi,
    dietaryType: q.preference || aiSummary.dietaryType,
    activityLevel: q.activity || aiSummary.activityLevel,
    dailyCalories: `${doc.caloriesTarget} kcal / day`,
    waterIntake: doc.waterTarget ? `${doc.waterTarget} Liters / day` : '',
    macronutrients: [
      { label: 'Protein', value: macros.protein ? `${macros.protein}g` : '' },
      { label: 'Carbohydrates', value: macros.carbs ? `${macros.carbs}g` : '' },
      { label: 'Fats', value: macros.fats ? `${macros.fats}g` : '' },
      { label: 'Fiber', value: macros.fiber ? `${macros.fiber}g` : '' }
    ].filter((m) => m.value !== ''),
    meals,
    exercisePlan: Array.isArray(doc.exercisePlan) ? doc.exercisePlan : [],
    healthSafetyNotes: Array.isArray(doc.healthSafetyNotes) ? doc.healthSafetyNotes : [],
    disclaimer: doc.disclaimer || DEFAULT_DISCLAIMER,
    clinicalNote: doc.clinicalNote || '',
    currentDisease: q.currentDisease && q.currentDisease !== 'none'
      ? q.currentDisease
      : ''
  };
};

export const AIDietPlanner = () => {
  const { generateAIDietPlan, myDietPlans } = useDietPlan();

  const [age, setAge] = useState('22');
  const [height, setHeight] = useState('175');
  const [weight, setWeight] = useState('70');
  const [preference, setPreference] = useState('vegetarian');
  const [allergies, setAllergies] = useState('');
  const [activity, setActivity] = useState('moderate');
  const [selectedDisease, setSelectedDisease] = useState('No Current Disease / Condition');
  const [customDisease, setCustomDisease] = useState('');
  const [diseaseError, setDiseaseError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  // Initialize with latest saved diet plan if exists
  useEffect(() => {
    if (myDietPlans && myDietPlans.length > 0 && !result && !loading) {
      const latest = myDietPlans[0];
      setResult(buildViewFromDoc(latest));
      if (latest.questionnaire) {
        if (latest.questionnaire.age) setAge(latest.questionnaire.age.toString());
        if (latest.questionnaire.height) setHeight(latest.questionnaire.height.toString());
        if (latest.questionnaire.weight) setWeight(latest.questionnaire.weight.toString());
        if (latest.questionnaire.preference) setPreference(latest.questionnaire.preference);
        if (latest.questionnaire.activity) setActivity(latest.questionnaire.activity);
        if (Array.isArray(latest.questionnaire.allergies) && latest.questionnaire.allergies.length > 0) {
          setAllergies(latest.questionnaire.allergies.join(', '));
        }
      }
    }
  }, [myDietPlans, result, loading]);

  const handleDiseaseChange = (e) => {
    const value = e.target.value;
    setSelectedDisease(value);
    if (value !== 'Other') {
      setCustomDisease('');
      setDiseaseError('');
    }
  };

  const handleCustomDiseaseChange = (e) => {
    setCustomDisease(e.target.value);
    if (e.target.value.trim()) {
      setDiseaseError('');
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError('');
    setDiseaseError('');

    const numAge = Number(age);
    const numHeight = Number(height);
    const numWeight = Number(weight);

    if (!Number.isFinite(numAge) || numAge <= 0 || numAge > 120) {
      setError('Please enter a valid age between 1 and 120 years.');
      return;
    }
    if (!Number.isFinite(numHeight) || numHeight <= 0 || numHeight > 260) {
      setError('Please enter a valid height in centimeters (e.g. 170).');
      return;
    }
    if (!Number.isFinite(numWeight) || numWeight <= 0 || numWeight > 300) {
      setError('Please enter a valid weight in kilograms (e.g. 65).');
      return;
    }

    // Validate custom disease if "Other" is selected
    let currentDisease = '';
    if (selectedDisease === 'Other') {
      const trimmed = customDisease.trim();
      if (!trimmed) {
        setDiseaseError('Please specify the disease or health condition.');
        return;
      }
      currentDisease = trimmed;
    } else if (selectedDisease !== 'No Current Disease / Condition') {
      currentDisease = selectedDisease;
    }

    setLoading(true);

    try {
      const payload = {
        age: numAge,
        height: numHeight,
        weight: numWeight,
        dietaryType: preference,
        allergies: allergies.trim() ? allergies.trim() : [],
        activityLevel: activity,
        healthCondition: currentDisease || 'none'
      };

      const res = await generateAIDietPlan(payload);
      const view = res?.plan ? buildViewFromPlan(res.plan) : res?.data ? buildViewFromDoc(res.data) : null;
      if (view) {
        view.currentDisease = currentDisease;
        setResult(view);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to generate the AI diet plan. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const summaryMetric = (label, value) => (
    <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-center">
      <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">{label}</span>
      <span className="text-xs font-bold text-slate-800 block mt-1">{value}</span>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl flex items-start gap-3 text-xs leading-normal">
        <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
        <div>
          <span className="font-bold">Medical Assistive Disclaimer:</span>
          <p className="mt-0.5">
            The AI Diet Planner generates estimated dietary guidelines based on physiological metrics and reported health conditions. It does NOT constitute medical treatment or prescription. Always consult with a qualified physician or clinical dietitian before starting therapeutic dietary changes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Questionnaire Form */}
        <div className="space-y-4 h-fit">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <Card title="Diet Plan Setup" subtitle="Input your physiological metrics" className="h-fit">
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="diet-age" className="block text-[10px] text-slate-500 font-semibold uppercase">Age (years)</label>
                  <input
                    id="diet-age"
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="diet-height" className="block text-[10px] text-slate-500 font-semibold uppercase">Height (cm)</label>
                  <input
                    id="diet-height"
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="diet-weight" className="block text-[10px] text-slate-500 font-semibold uppercase">Weight (kg)</label>
                <input
                  id="diet-weight"
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label htmlFor="diet-preference" className="block text-[10px] text-slate-500 font-semibold uppercase">Dietary Type</label>
                <select
                  id="diet-preference"
                  value={preference}
                  onChange={(e) => setPreference(e.target.value)}
                  className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
                >
                  <option value="vegetarian">Vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="non-vegetarian">Non-Vegetarian</option>
                  <option value="keto">Keto-Friendly</option>
                </select>
              </div>

              <div>
                <label htmlFor="diet-allergies" className="block text-[10px] text-slate-500 font-semibold uppercase">Allergies / Restrictions</label>
                <input
                  id="diet-allergies"
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="e.g. Peanuts, Gluten, Dairy (optional)"
                  className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
                />
              </div>

              <div>
                <label htmlFor="diet-activity" className="block text-[10px] text-slate-500 font-semibold uppercase">Activity Level</label>
                <select
                  id="diet-activity"
                  value={activity}
                  onChange={(e) => setActivity(e.target.value)}
                  className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
                >
                  <option value="sedentary">Sedentary (No exercise)</option>
                  <option value="moderate">Moderate (3-4 days exercise)</option>
                  <option value="active">Active (Heavy gym workout)</option>
                </select>
              </div>

              {/* Optional Current Disease / Health Condition Field */}
              <div>
                <label htmlFor="diet-disease" className="block text-[10px] text-slate-500 font-semibold uppercase">
                  Current Disease / Health Condition <span className="text-slate-400 font-normal normal-case">(Optional)</span>
                </label>
                <select
                  id="diet-disease"
                  value={selectedDisease}
                  onChange={handleDiseaseChange}
                  aria-label="Current Disease / Health Condition"
                  className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
                >
                  {DISEASE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>

                {/* Manual input when "Other" is selected */}
                {selectedDisease === 'Other' && (
                  <div className="mt-2 space-y-1">
                    <input
                      type="text"
                      value={customDisease}
                      onChange={handleCustomDiseaseChange}
                      placeholder="If other type manually"
                      aria-label="Specify other health condition manually"
                      className={`w-full p-2 border ${
                        diseaseError ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200 bg-slate-50'
                      } focus:bg-white focus:outline-none rounded-lg text-xs transition-colors`}
                    />
                    {diseaseError && (
                      <p className="text-[10px] text-rose-600 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
                        {diseaseError}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                loading={loading}
                className="w-full"
                icon={Salad}
              >
                Generate Diet Plan
              </Button>
            </form>
          </Card>
        </div>

        {/* Results layout */}
        <div className="md:col-span-2 space-y-4">
          {loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center h-full flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">Generating your personalized AI diet plan...</h3>
              <p className="text-xs text-slate-400 max-w-xs mt-1 leading-normal">
                Our Gemini-powered nutrition engine is analyzing your metrics, dietary type, activity level, and health notes.
              </p>
              <div className="mt-6 w-8 h-8 animate-spin rounded-full border-2 border-blue-100 border-t-blue-600" role="status" />
            </div>
          ) : !result ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center h-full flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mb-4">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">Diet Plan Awaiting Generation</h3>
              <p className="text-xs text-slate-400 max-w-xs mt-1 leading-normal">
                Submit the physiological questionnaire to create a tailored 7-day meal and exercise plan.
              </p>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Condition Focus Banner if present */}
              {result.currentDisease && (
                <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-2.5 text-xs text-blue-900">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">
                      Diet Plan Customized for: <span className="text-blue-700">{result.currentDisease}</span>
                    </span>
                    {result.clinicalNote && (
                      <p className="text-[11px] text-blue-800 mt-0.5 leading-relaxed">
                        {result.clinicalNote}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* 1. Personalized Summary */}
              <Card title="Personalized Summary" subtitle="Metrics used to tailor your plan">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {summaryMetric('Age', result.age ? `${result.age} yrs` : '—')}
                  {summaryMetric('Height', result.heightCm ? `${result.heightCm} cm` : '—')}
                  {summaryMetric('Weight', result.weightKg ? `${result.weightKg} kg` : '—')}
                  {summaryMetric('BMI', result.bmi != null ? result.bmi : '—')}
                  {summaryMetric('Dietary Type', humanizeDietType(result.dietaryType))}
                  {summaryMetric('Activity Level', humanizeActivity(result.activityLevel))}
                </div>
                <p className="mt-3 text-[10px] text-slate-400 leading-relaxed">
                  BMI is calculated from height and weight for reference only; it is not a medical diagnosis.
                </p>
              </Card>

              {/* 2. Daily Nutrition Targets */}
              <Card title="Daily Nutrition Targets" subtitle="Estimated targets for your profile">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs text-center">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase flex items-center justify-center gap-1">
                      <Flame className="w-3 h-3 text-orange-400" /> Calories
                    </span>
                    <span className="text-sm font-bold text-slate-800 block mt-1">{result.dailyCalories}</span>
                  </div>
                  <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs text-center">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase flex items-center justify-center gap-1">
                      <Droplets className="w-3 h-3 text-blue-400" /> Water Intake
                    </span>
                    <span className="text-sm font-bold text-slate-800 block mt-1">{result.waterIntake}</span>
                  </div>
                  <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs text-center">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase">Macronutrients</span>
                    <div className="mt-1.5 space-y-1">
                      {result.macronutrients.length > 0 ? (
                        result.macronutrients.map((m) => (
                          <span key={m.label} className="text-[10px] font-bold text-slate-700 block leading-snug">
                            {m.label}: {m.value}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] font-bold text-slate-700 block">Standard Balance</span>
                      )}
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-[10px] text-slate-400 leading-relaxed">
                  Nutritional values are estimates only and should not be treated as medical precision.
                </p>
              </Card>

              {/* 3. 7-Day Meal Plan */}
              <Card
                title="7-Day Meal Plan"
                subtitle="Your personalized weekly food matrix"
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse min-w-[560px]">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                        <th className="p-3">Day</th>
                        <th className="p-3">Breakfast</th>
                        <th className="p-3">Lunch</th>
                        <th className="p-3">Dinner</th>
                        <th className="p-3">Snacks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600 align-top">
                      {result.meals.map((m, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/20">
                          <td className="p-3 font-semibold text-slate-800 whitespace-nowrap">
                            <span className="block">{m.day}</span>
                            {m.dayName && <span className="block text-[9px] font-medium text-slate-400">{m.dayName}</span>}
                          </td>
                          <td className="p-3 leading-relaxed">{m.breakfast || '—'}</td>
                          <td className="p-3 leading-relaxed">{m.lunch || '—'}</td>
                          <td className="p-3 leading-relaxed">{m.dinner || '—'}</td>
                          <td className="p-3 leading-relaxed">{m.snacks || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* 4. Exercise Plan */}
              <Card title="Exercise Plan" subtitle="Recommendations matched to your activity level">
                <div className="space-y-3">
                  {result.exercisePlan.length > 0 ? (
                    result.exercisePlan.map((ex, idx) => (
                      <div key={idx} className="flex gap-3 items-start border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <Dumbbell className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-xs text-slate-800">{ex.activity}</span>
                            {ex.intensity && (
                              <span className="text-[9px] font-semibold text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded-full">
                                {ex.intensity}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-[11px] text-slate-500">
                            {ex.duration && <span><span className="font-semibold text-slate-400">Duration:</span> {ex.duration}</span>}
                            {ex.frequency && <span><span className="font-semibold text-slate-400">Frequency:</span> {ex.frequency}</span>}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400">Exercise recommendations will appear here.</p>
                  )}
                </div>
              </Card>

              {/* 5. Health & Safety Notes */}
              <Card title="Health & Safety Notes" subtitle="Precautions to review before starting">
                <ul className="space-y-2">
                  {result.healthSafetyNotes.length > 0 ? (
                    result.healthSafetyNotes.map((note, idx) => (
                      <li key={idx} className="flex gap-2 items-start text-xs text-slate-600">
                        <Activity className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                        <span>{note}</span>
                      </li>
                    ))
                  ) : (
                    <li className="flex gap-2 items-start text-xs text-slate-600">
                      <Activity className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <span>Review this plan with a qualified healthcare professional before starting.</span>
                    </li>
                  )}
                </ul>
              </Card>

              {/* 6. Disclaimer */}
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl flex items-start gap-3 text-xs leading-normal">
                <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Disclaimer:</span>
                  <p className="mt-0.5">{result.disclaimer || DEFAULT_DISCLAIMER}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Plan is generated fresh each time from your inputs and saved to your history for later reference.</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIDietPlanner;