import React, { useState } from 'react';
import { Salad, Calendar, ChevronRight, Apple, Heart, Compass, ShieldAlert } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';

export const AIDietPlanner = () => {
  const [age, setAge] = useState('22');
  const [height, setHeight] = useState('175');
  const [weight, setWeight] = useState('70');
  const [preference, setPreference] = useState('vegetarian');
  const [allergies, setAllergies] = useState('None');
  const [activity, setActivity] = useState('moderate');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleGenerate = (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      // Simulate diet calculations based on inputs
      const weightVal = parseFloat(weight);
      const heightVal = parseFloat(height);
      const ageVal = parseFloat(age);
      
      // Harris-Benedict Equation for BMR (Male approximation)
      let bmr = 88.362 + (13.397 * weightVal) + (4.799 * heightVal) - (5.677 * ageVal);
      let multiplier = 1.2; // Sedentary
      if (activity === 'moderate') multiplier = 1.55;
      if (activity === 'active') multiplier = 1.725;
      
      const calories = Math.round(bmr * multiplier);
      const water = Math.round((weightVal * 35) / 100) / 10; // 35ml per kg of bodyweight

      const mealPlan = {
        calories: `${calories} kcal / day`,
        water: `${water} Liters / day`,
        macros: 'Carbs: 50% | Protein: 25% | Fats: 25%',
        meals: [
          { day: 'Monday', breakfast: 'Oats porridge with chia seeds and honey', lunch: 'Quinoa stir-fry with tofu and spinach', dinner: 'Whole wheat flatbread with lentil curry', snacks: 'Spiced buttermilk, roasted pumpkin seeds' },
          { day: 'Tuesday', breakfast: 'Vegetable semolina upma with almonds', lunch: 'Brown rice, mixed bean chili, tomato cucumber salad', dinner: 'Sweet potato soup with grilled cottage cheese', snacks: 'Apple slices with almond butter' },
          { day: 'Wednesday', breakfast: 'Multigrain toast with avocado mash', lunch: 'Paneer bhurji (scrambled cottage cheese) with rotis', dinner: 'Stir-fried broccoli and mushrooms with quinoa', snacks: 'Spiced roasted chickpeas, green tea' },
          { day: 'Thursday', breakfast: 'Sprouted moong dal salad with lemon dressing', lunch: 'Sautéed brown rice with vegetable curry', dinner: 'Lentil soup with whole wheat garlic bread', snacks: 'Mixed berries, walnuts' },
          { day: 'Friday', breakfast: 'Banana oats smoothie with flaxseed powder', lunch: 'Quinoa bowl with bell peppers and roasted beans', dinner: 'Stok rotis with dry potato-spinach sabzi', snacks: 'Cucumber sticks with hummus' },
          { day: 'Saturday', breakfast: 'Paneer stuffed paratha (cooked with minimal oil)', lunch: 'Chickpea spinach curry with brown rice', dinner: 'Baked vegetable bake with tomato basil sauce', snacks: 'Roasted almonds, black coffee' },
          { day: 'Sunday', breakfast: 'Poha with peanuts and fresh curry leaves', lunch: 'Millet khichdi with roasted papad and curd', dinner: 'Minestrone soup with grilled tofu skewers', snacks: 'Chia pudding with coconut milk' }
        ]
      };

      setResult(mealPlan);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl flex items-start gap-3 text-xs leading-normal">
        <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Medical Assistive Disclaimer:</span>
          <p className="mt-0.5">
            The AI Diet Planner computes estimations based on standard caloric BMR formulas. Dietary adjustments should match individual diabetic, cardiac, or renal clinical requirements. Please check with your physician before starting extreme calorie targets.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Questionnaire Form */}
        <Card title="Diet Plan Setup" subtitle="Input your physiological metrics" className="h-fit">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-500 font-semibold uppercase">Age (years)</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-semibold uppercase">Height (cm)</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 font-semibold uppercase">Weight (kg)</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 font-semibold uppercase">Dietary Type</label>
              <select
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
              <label className="block text-[10px] text-slate-500 font-semibold uppercase">Allergies / Restrictions</label>
              <input
                type="text"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="e.g. Peanuts, Gluten, Dairy"
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 font-semibold uppercase">Activity Level</label>
              <select
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                className="mt-1 w-full p-2 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
              >
                <option value="sedentary">Sedentary (No exercise)</option>
                <option value="moderate">Moderate (3-4 days exercise)</option>
                <option value="active">Active (Heavy gym workout)</option>
              </select>
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
                Submit the physiological questionnaire to create a week-long meal matrix.
              </p>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-300">
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
              <Card title="Your Custom Weekly Meal Matrix" subtitle="Generated meal guidelines based on criteria">
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
