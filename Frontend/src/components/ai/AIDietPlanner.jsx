import React, { useState, useEffect } from 'react';
import { Salad, Calendar, ChevronRight, Apple, Heart, Compass, ShieldAlert, Activity, AlertCircle, Sparkles } from 'lucide-react';
import { useDietPlan } from '../../context/DietPlanContext';
import Card from '../common/Card';
import Button from '../common/Button';

export const DISEASE_OPTIONS = [
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

export const AIDietPlanner = () => {
  const { generateDietPlan, myDietPlans } = useDietPlan();

  const [age, setAge] = useState('22');
  const [height, setHeight] = useState('175');
  const [weight, setWeight] = useState('70');
  const [preference, setPreference] = useState('vegetarian');
  const [allergies, setAllergies] = useState('None');
  const [activity, setActivity] = useState('moderate');
  const [selectedDisease, setSelectedDisease] = useState('No Current Disease / Condition');
  const [customDisease, setCustomDisease] = useState('');
  const [diseaseError, setDiseaseError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Initialize with latest saved diet plan if exists
  useEffect(() => {
    if (myDietPlans && myDietPlans.length > 0 && !result) {
      const latest = myDietPlans[0];
      setResult({
        calories: `${latest.caloriesTarget} kcal / day`,
        water: `${latest.waterTarget} Liters / day`,
        macros: typeof latest.macros === 'object'
          ? `Carbs: ${latest.macros.carbs || 0}g | Protein: ${latest.macros.protein || 0}g | Fats: ${latest.macros.fats || 0}g | Fiber: ${latest.macros.fiber || 0}g`
          : latest.macros || 'Standard Macronutrient Balance',
        currentDisease: latest.questionnaire?.currentDisease !== 'none' ? latest.questionnaire?.currentDisease : '',
        clinicalNote: latest.clinicalNote,
        meals: latest.weeklyMeals || []
      });
      if (latest.questionnaire) {
        if (latest.questionnaire.age) setAge(latest.questionnaire.age.toString());
        if (latest.questionnaire.height) setHeight(latest.questionnaire.height.toString());
        if (latest.questionnaire.weight) setWeight(latest.questionnaire.weight.toString());
        if (latest.questionnaire.preference) setPreference(latest.questionnaire.preference);
        if (latest.questionnaire.activity) setActivity(latest.questionnaire.activity);
      }
    }
  }, [myDietPlans]);

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

    setDiseaseError('');
    setLoading(true);

    try {
      const questionnaire = {
        age: Number(age) || 25,
        height: Number(height) || 170,
        weight: Number(weight) || 70,
        preference,
        allergies: allergies === 'None' || !allergies.trim() ? [] : [allergies.trim()],
        activity,
        currentDisease: currentDisease || 'none'
      };

      const res = await generateDietPlan(questionnaire);
      if (res?.data) {
        const data = res.data;
        setResult({
          calories: `${data.caloriesTarget} kcal / day`,
          water: `${data.waterTarget} Liters / day`,
          macros: typeof data.macros === 'object'
            ? `Carbs: ${data.macros.carbs || 0}g | Protein: ${data.macros.protein || 0}g | Fats: ${data.macros.fats || 0}g | Fiber: ${data.macros.fiber || 0}g`
            : data.macros || 'Balanced',
          currentDisease: data.questionnaire?.currentDisease !== 'none' ? data.questionnaire?.currentDisease : '',
          clinicalNote: data.clinicalNote,
          meals: data.weeklyMeals || []
        });
      }
    } catch (err) {
      console.error('Error generating diet plan:', err);
    } finally {
      setLoading(false);
    }
  };


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
                placeholder="e.g. Peanuts, Gluten, Dairy"
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

        {/* Results layout */}
        <div className="md:col-span-2 space-y-4">
          {!result ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center h-full flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mb-4">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">Diet Plan Awaiting Generation</h3>
              <p className="text-xs text-slate-400 max-w-xs mt-1 leading-normal">
                Submit the physiological questionnaire to create a tailored weekly meal matrix.
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

              {/* Daily budgets */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs text-center">
                  <span className="text-[9px] text-slate-400 font-bold block uppercase">Calorie Target</span>
                  <span className="text-sm font-bold text-slate-800 block mt-1">{result.calories}</span>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs text-center">
                  <span className="text-[9px] text-slate-400 font-bold block uppercase">Water Target</span>
                  <span className="text-sm font-bold text-slate-800 block mt-1">{result.water}</span>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs text-center">
                  <span className="text-[9px] text-slate-400 font-bold block uppercase">Macronutrients</span>
                  <span className="text-[10px] font-bold text-slate-700 block mt-1.5 leading-snug">{result.macros}</span>
                </div>
              </div>

              {/* Weekly Matrix list */}
              <Card
                title="Your Custom Weekly Meal Matrix"
                subtitle={result.currentDisease ? `Tailored meal guidelines considering ${result.currentDisease}` : "Generated meal guidelines based on criteria"}
              >
                <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                  {result.meals.map((m, idx) => (
                    <div key={idx} className="border-b border-slate-100 pb-3 last:border-b-0 last:pb-0 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-3 bg-blue-600 rounded-xs" />
                        <h4 className="font-bold text-xs text-slate-800">{m.day}</h4>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-600 pl-3">
                        <div>
                          <span className="font-bold text-[9px] text-slate-400 uppercase tracking-wider block">Breakfast</span>
                          <span className="mt-0.5 block leading-relaxed">{m.breakfast}</span>
                        </div>
                        <div>
                          <span className="font-bold text-[9px] text-slate-400 uppercase tracking-wider block">Lunch</span>
                          <span className="mt-0.5 block leading-relaxed">{m.lunch}</span>
                        </div>
                        <div>
                          <span className="font-bold text-[9px] text-slate-400 uppercase tracking-wider block">Dinner</span>
                          <span className="mt-0.5 block leading-relaxed">{m.dinner}</span>
                        </div>
                        <div>
                          <span className="font-bold text-[9px] text-slate-400 uppercase tracking-wider block">Snack Target</span>
                          <span className="mt-0.5 block leading-relaxed">{m.snacks}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIDietPlanner;
