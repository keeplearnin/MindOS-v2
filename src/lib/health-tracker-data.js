// Function Health protocol tracker — static reference data + pure helpers.
// Reference ranges match Function Health's own stated optimal ranges so this
// page agrees with their dashboard. No personal results live in this file.

export const MARKERS = [
  { g: 'Heart & Lipids', id: 'ldl_c',     name: 'LDL-Cholesterol',     unit: 'mg/dL',    dir: 'below', max: 100,  scale: [50, 200] },
  { g: 'Heart & Lipids', id: 'nonhdl',    name: 'Non-HDL Cholesterol', unit: 'mg/dL',    dir: 'below', max: 130,  scale: [70, 220] },
  { g: 'Heart & Lipids', id: 'apob',      name: 'Apolipoprotein B',    unit: 'mg/dL',    dir: 'below', max: 90,   scale: [40, 160] },
  { g: 'Heart & Lipids', id: 'ldl_p',     name: 'LDL Particle Number', unit: 'nmol/L',   dir: 'below', max: 1138, scale: [600, 2200] },
  { g: 'Heart & Lipids', id: 'ldl_small', name: 'LDL Small',           unit: 'nmol/L',   dir: 'below', max: 142,  scale: [0, 500] },
  { g: 'Heart & Lipids', id: 'ldl_med',   name: 'LDL Medium',          unit: 'nmol/L',   dir: 'below', max: 215,  scale: [0, 500] },
  { g: 'Heart & Lipids', id: 'ldl_size',  name: 'LDL Peak Size',       unit: 'Å',        dir: 'above', min: 222.9, scale: [210, 235] },
  { g: 'Heart & Lipids', id: 'trig',      name: 'Triglycerides',       unit: 'mg/dL',    dir: 'below', max: 150,  scale: [40, 300] },
  { g: 'Heart & Lipids', id: 'hdl',       name: 'HDL-Cholesterol',     unit: 'mg/dL',    dir: 'above', min: 40, inc: true, scale: [20, 100] },

  { g: 'Metabolic', id: 'glucose', name: 'Glucose (fasting)', unit: 'mg/dL',  dir: 'range', min: 65, max: 99, scale: [60, 140] },
  { g: 'Metabolic', id: 'hba1c',   name: 'Hemoglobin A1c',    unit: '%',      dir: 'below', max: 5.7,          scale: [4.5, 8] },
  { g: 'Metabolic', id: 'insulin', name: 'Insulin (fasting)', unit: 'uIU/mL', dir: 'below', max: 18.4, inc: true, scale: [0, 30] },

  { g: 'Inflammation & Immune', id: 'hscrp', name: 'hs-CRP',            unit: 'mg/L',  dir: 'range', min: 0, max: 1, scale: [0, 10] },
  { g: 'Inflammation & Immune', id: 'rf',    name: 'Rheumatoid Factor', unit: 'IU/mL', dir: 'below', max: 14,        scale: [0, 40] },

  { g: 'Nutrients & Methylation', id: 'homocysteine', name: 'Homocysteine',           unit: 'umol/L', dir: 'below', max: 15.2, inc: true, scale: [4, 30] },
  { g: 'Nutrients & Methylation', id: 'omega3',       name: 'Omega-3 Total',          unit: '% by wt', dir: 'above', min: 5.4, scale: [2, 10] },
  { g: 'Nutrients & Methylation', id: 'linoleic',     name: 'Omega-6: Linoleic Acid', unit: '% by wt', dir: 'range', min: 18.6, max: 29.5, scale: [12, 35] },
  { g: 'Nutrients & Methylation', id: 'ferritin',     name: 'Ferritin',               unit: 'ng/mL',  dir: 'range', min: 38, max: 380, scale: [0, 200] },
  { g: 'Nutrients & Methylation', id: 'b12',          name: 'Vitamin B12',            unit: 'pg/mL',  dir: 'range', min: 200, max: 1100, scale: [150, 1200] },
  { g: 'Nutrients & Methylation', id: 'folate',       name: 'Folate',                 unit: 'ng/mL',  dir: 'above', min: 3.4, scale: [0, 25] },
  { g: 'Nutrients & Methylation', id: 'vitd',         name: 'Vitamin D (25-OH)',      unit: 'ng/mL',  dir: 'range', min: 30, max: 100, scale: [10, 100] },

  { g: 'Male Health', id: 'lh',   name: 'Luteinizing Hormone', unit: 'mIU/mL', dir: 'range', min: 1.5, max: 9.3, scale: [0, 20] },
  { g: 'Male Health', id: 'e2',   name: 'Estradiol (E2)',      unit: 'pg/mL',  dir: 'below', max: 39, inc: true, scale: [10, 80] },
  { g: 'Male Health', id: 'test', name: 'Testosterone, Total', unit: 'ng/dL',  dir: 'range', min: 250, max: 1100, scale: [150, 1200] },

  { g: 'Aging', id: 'bioage', name: 'Biological Age', unit: 'yrs', dir: 'below', max: null, scale: [40, 65], note: 'Target: at or below your chronological age' },
];

export const HABITS = [
  { grp: 'Nutrition', id: 'dinner',    label: 'Ate the protocol dinner',         hint: 'or an equivalent build: lean protein + 2 veg + whole grain', targets: ['ldl_c', 'hba1c', 'hscrp'] },
  { grp: 'Nutrition', id: 'protein',   label: 'Hit ~110 g protein',              hint: 'auto-checks when you log 110 g+ below', targets: ['bioage', 'hba1c'] },
  { grp: 'Nutrition', id: 'fiber',     label: '30 g+ fiber',                     hint: 'the biggest lever on LDL and glucose · auto-checks at 30 g logged', targets: ['ldl_c', 'ldl_p', 'glucose', 'hba1c'] },
  { grp: 'Nutrition', id: 'nosugar',   label: 'No added sugar or refined grain', hint: 'includes juice, sauces, "healthy" bars', targets: ['hba1c', 'glucose', 'trig'] },
  { grp: 'Nutrition', id: 'omega3',    label: 'Omega-3 source',                  hint: 'fatty fish, or 2 g combined EPA/DHA', targets: ['omega3', 'hscrp', 'ldl_small'] },
  { grp: 'Nutrition', id: 'plants',    label: 'Colorful veg at 2+ meals',        hint: 'polyphenols and potassium, not just volume', targets: ['hscrp', 'ldl_c'] },
  { grp: 'Nutrition', id: 'noalcohol', label: 'No alcohol',                      hint: 'alcohol raises homocysteine, CRP and triglycerides', targets: ['hscrp', 'homocysteine', 'trig'] },

  { grp: 'Supplements', id: 'bvits', label: 'B12 + folate + B6',        hint: 'methylated forms; the direct homocysteine lever', targets: ['homocysteine', 'b12', 'folate'] },
  { grp: 'Supplements', id: 'iron',  label: 'Iron-rich food + vitamin C', hint: 'lentils, spinach, red meat — paired with citrus or pepper', targets: ['ferritin'] },
  { grp: 'Supplements', id: 'vitd',  label: 'Vitamin D',                hint: 'with a fat-containing meal', targets: ['vitd'] },

  { grp: 'Movement', id: 'zone2',    label: '30+ min zone 2 cardio', hint: 'conversational pace — the LDL-particle and A1c lever', targets: ['ldl_p', 'hba1c', 'bioage'] },
  { grp: 'Movement', id: 'strength', label: 'Strength training',    hint: 'muscle is glucose disposal', targets: ['hba1c', 'insulin', 'bioage'] },
  { grp: 'Movement', id: 'walk',     label: '10 min walk after dinner', hint: 'blunts the post-meal glucose spike', targets: ['glucose', 'hba1c'] },
  { grp: 'Movement', id: 'steps',    label: '8,000+ steps',         hint: 'auto-checks when you log steps below', targets: ['ldl_c', 'glucose'] },

  { grp: 'Recovery', id: 'sleep',  label: '7+ hours sleep',        hint: 'short sleep drives CRP and glucose up · auto-checks at 7 h logged', targets: ['hscrp', 'glucose', 'bioage'] },
  { grp: 'Recovery', id: 'stress', label: '10 min stress practice', hint: 'breathwork, meditation, or a phone-free walk', targets: ['hscrp'] },
];

export const METRICS = [
  { id: 'kcal',     label: 'Calories',        unit: 'kcal', step: '10' },
  { id: 'proteinG', label: 'Protein',         unit: 'g',  step: '1' },
  { id: 'fatG',     label: 'Fat',             unit: 'g',  step: '1' },
  { id: 'carbG',    label: 'Carbs',           unit: 'g',  step: '1' },
  { id: 'fiberG',   label: 'Fiber',           unit: 'g',  step: '1' },
  { id: 'weight',   label: 'Weight',          unit: 'kg', step: '0.1' },
  { id: 'sleepH',   label: 'Sleep',           unit: 'h',  step: '0.25' },
  { id: 'stepsN',   label: 'Steps',           unit: '',   step: '100' },
  { id: 'fbg',      label: 'Fasting glucose', unit: 'mg/dL', step: '1' },
];

export const NUTRITION = {
  calories: 2000, protein: 110, fats: 65, carbs: 240,
  objectives: [
    'Support healthy blood sugar and lipid levels',
    'Increase fiber and antioxidant intake',
    'Optimize omega-3 to omega-6 ratio',
    'Maintain steady energy throughout the day',
  ],
  lifestyle: [
    'Prioritize whole, minimally processed foods',
    'Include a variety of colorful vegetables and lean proteins',
    'Limit added sugars and refined grains',
    'Incorporate more plant-based meals during the week',
  ],
};

// Seven dinners, indexed Monday=0 … Sunday=6.
export const WEEK = [
  { day: 'Monday', name: 'Grilled Salmon with Roasted Vegetables',
    kcal: 590, p: 42, f: 32, c: 32,
    benefit: 'Rich in omega-3 fats, high-quality protein, fiber, and antioxidant vitamins to support steady energy, healthy blood sugar, and cardiovascular health.',
    labs: 'Omega-3s may support healthier triglyceride levels, while the fiber and low-glycemic vegetables may help improve post-meal blood sugar control and lipid balance.',
    ing: ['170 g salmon fillet', '150 g broccoli florets', '100 g bell pepper', '150 g zucchini', '1 tbsp olive oil', '½ lemon', '1 clove garlic'],
    steps: [
      ['Prepare the vegetables', 'Heat the oven to 220°C (425°F). Toss broccoli florets, bell pepper, and zucchini with half of the olive oil and minced garlic. Spread on a baking sheet.'],
      ['Roast the vegetables', 'Roast for 20–25 minutes, turning once, until tender and lightly browned.'],
      ['Season and grill the salmon', 'Brush the salmon with the remaining olive oil and lemon juice. Grill or pan-sear 4–6 minutes per side, until opaque and cooked through.'],
      ['Serve', 'Serve the salmon with the roasted vegetables and the remaining lemon for squeezing.'],
    ] },
  { day: 'Tuesday', name: 'Lentil & Spinach Curry with Brown Rice',
    kcal: 610, p: 24, f: 14, c: 96,
    benefit: 'High in plant protein, soluble and insoluble fiber, folate, iron, potassium, and antioxidants. Slow-digesting carbohydrates for steadier energy.',
    labs: 'Fiber from lentils, spinach, tomatoes, and brown rice may help support healthier post-meal blood sugar and LDL cholesterol levels. Low in saturated fat.',
    ing: ['150 g brown rice', '75 g dry lentils', '1 tbsp olive oil', '1 onion', '2 tsp curry powder', '200 g diced tomatoes', '100 g spinach', '500 ml water'],
    steps: [
      ['Cook the brown rice', 'Rinse and cook according to package directions until tender, about 25–35 minutes.'],
      ['Sauté the curry base', 'Heat olive oil in a large pot over medium heat. Add chopped onion and curry powder; cook 4–5 minutes until softened and fragrant.'],
      ['Simmer the lentils', 'Add lentils, diced tomatoes, and water. Boil, then simmer 20–25 minutes, stirring occasionally, until lentils are tender.'],
      ['Wilt the spinach and serve', 'Stir in spinach and cook 2–3 minutes until wilted. Serve over the rice.'],
    ] },
  { day: 'Wednesday', name: 'Chicken Stir-Fry with Broccoli, Bell Peppers & Quinoa',
    kcal: 560, p: 48, f: 16, c: 56,
    benefit: 'High in lean protein and fiber, with antioxidant-rich cruciferous and colorful vegetables. Quinoa provides complex carbohydrates for steady energy.',
    labs: 'Fiber and minimally processed carbohydrates may support steadier blood sugar and improved lipid levels. Limiting sodium supports cardiovascular health.',
    ing: ['170 g chicken breast', '150 g broccoli florets', '100 g bell pepper', '185 g cooked quinoa', '1 tbsp olive oil', '1 tbsp low-sodium tamari', '1 clove garlic', '1 tsp fresh ginger'],
    steps: [
      ['Prepare the quinoa', 'Cook according to package directions and keep warm.'],
      ['Cook the chicken', 'Heat olive oil in a large skillet over medium-high heat. Add chicken and cook 5–7 minutes, stirring, until browned and cooked through.'],
      ['Stir-fry the vegetables', 'Add broccoli, bell pepper, garlic, and ginger. Stir-fry 5–6 minutes until crisp-tender.'],
      ['Finish and serve', 'Return the chicken, add tamari, and toss 1–2 minutes. Serve over the quinoa.'],
    ] },
  { day: 'Thursday', name: 'Tofu & Vegetable Sheet Pan Bake with Sweet Potatoes',
    kcal: 470, p: 25, f: 18, c: 48,
    benefit: 'A fiber-rich, plant-protein dinner with beta-carotene, antioxidants, and unsaturated fats. Slow-digesting carbohydrates plus satiety from tofu and seeds.',
    labs: 'Fiber and minimally processed carbohydrates may support steadier blood glucose and healthier lipid levels. Olive oil and pumpkin seeds contribute predominantly unsaturated fats.',
    ing: ['600 g extra-firm tofu', '600 g sweet potatoes', '300 g broccoli florets', '2 red bell peppers', '2 tbsp olive oil', '2 tbsp low-sodium tamari', '1 tsp garlic powder', '30 g pumpkin seeds'],
    steps: [
      ['Prepare the sheet pan', 'Heat oven to 220°C (425°F). Press tofu dry and cube. Cut sweet potatoes into 2 cm cubes, chop broccoli, slice peppers.'],
      ['Season', 'Place everything on a large sheet pan. Toss with olive oil, tamari, and garlic powder until evenly coated.'],
      ['Bake until tender', 'Spread in a single layer and bake 25–30 minutes, turning once halfway, until sweet potatoes are tender and tofu lightly browned.'],
      ['Finish and serve', 'Sprinkle pumpkin seeds over the top. Serves four.'],
    ] },
  { day: 'Friday', name: 'Grilled Shrimp with Garlic, Lemon & Asparagus',
    kcal: 490, p: 43, f: 17, c: 38,
    benefit: 'High-protein, fiber-rich dinner with omega-3-supportive seafood, antioxidant-rich asparagus and lemon, and steady-energy carbohydrates from quinoa.',
    labs: 'Supports healthier blood sugar through protein, fiber, and moderate quinoa portions; prioritizing shrimp over higher-saturated-fat meats may support triglyceride and lipid management.',
    ing: ['170 g shrimp, peeled and deveined', '200 g asparagus', '¾ cup cooked quinoa', '1 tbsp olive oil', '2 cloves garlic', '1 lemon', '2 tbsp fresh parsley', '¼ tsp black pepper'],
    steps: [
      ['Marinate the shrimp', 'Mince the garlic. Whisk half the olive oil with the garlic, the juice and zest of half the lemon, and black pepper. Toss the shrimp and rest 10 minutes.'],
      ['Cook quinoa and asparagus', 'Warm the quinoa. Toss asparagus with the remaining olive oil and grill or pan-sear 5–7 minutes until bright green and tender-crisp.'],
      ['Grill the shrimp', 'Grill or pan-sear 2–3 minutes per side, until opaque and cooked through.'],
      ['Finish and serve', 'Serve over the quinoa. Garnish with parsley and lemon wedges.'],
    ] },
  { day: 'Saturday', name: 'Chickpea & Vegetable Stew with Turmeric and Brown Rice',
    kcal: 620, p: 22, f: 17, c: 98,
    benefit: 'High in fiber, plant protein, antioxidants, and complex carbohydrates; supports gut health and steady energy.',
    labs: 'Fiber from chickpeas, vegetables, and brown rice may help support healthier post-meal blood sugar and LDL cholesterol. Turmeric and colorful vegetables add anti-inflammatory compounds.',
    ing: ['400 g chickpeas', '140 g brown rice', '1 tbsp olive oil', '1 onion', '2 carrots', '400 g diced tomatoes', '120 g spinach', '1 tsp turmeric'],
    steps: [
      ['Cook the brown rice', 'Rinse and simmer according to package directions until tender, 30–40 minutes.'],
      ['Sauté the vegetables', 'Heat olive oil in a large pot. Add chopped onion and sliced carrots; cook 5–7 minutes until beginning to soften.'],
      ['Simmer the stew', 'Stir in turmeric, tomatoes, and chickpeas. Simmer uncovered 15–20 minutes until carrots are tender and the stew thickens.'],
      ['Add spinach and serve', 'Fold in spinach and cook 2–3 minutes until wilted. Serve over the rice.'],
    ] },
  { day: 'Sunday', name: 'Baked Cod with Tomato, Olive & Herb Quinoa',
    kcal: 560, p: 43, f: 20, c: 53,
    benefit: 'High-protein cod supports satiety and steady energy; quinoa and vegetables provide fiber and antioxidants; olive oil and olives supply mostly unsaturated fats.',
    labs: 'Fiber, tomatoes, and unsaturated fats may support healthier blood sugar and LDL/triglyceride levels. Omega-3 fats and antioxidant-rich produce support cardiovascular health.',
    ing: ['170 g cod fillet', '½ cup quinoa', '1 cup cherry tomatoes', '30 g pitted olives', '1 tbsp olive oil', '½ lemon', '1 clove garlic', '2 tbsp fresh parsley'],
    steps: [
      ['Cook the quinoa', 'Rinse, then simmer according to package directions until tender. Fluff and set aside.'],
      ['Prepare the tomato mixture', 'Combine cherry tomatoes, olives, olive oil, minced garlic, and half the chopped parsley.'],
      ['Bake the cod', 'Place cod in a baking dish, top with the tomato mixture, squeeze over the lemon. Bake at 200°C (400°F) for 12–15 minutes until opaque and flaky.'],
      ['Finish and serve', 'Stir the remaining parsley and lemon juice into the quinoa. Serve the cod and tomatoes over the top.'],
    ] },
];

// ── Macros ──
// Each daily macro target, and the metric that feeds it. mealKey maps onto the
// per-dinner macros in WEEK.
export const MACROS = [
  { id: 'kcal',     label: 'Calories', unit: 'kcal', target: NUTRITION.calories, mealKey: 'kcal', tone: 'var(--accent)' },
  { id: 'proteinG', label: 'Protein',  unit: 'g',    target: NUTRITION.protein,  mealKey: 'p',    tone: 'var(--q2)' },
  { id: 'fatG',     label: 'Fat',      unit: 'g',    target: NUTRITION.fats,     mealKey: 'f',    tone: 'var(--q3)' },
  { id: 'carbG',    label: 'Carbs',    unit: 'g',    target: NUTRITION.carbs,    mealKey: 'c',    tone: 'var(--accent-light)' },
];

// The protocol dinner's macros count automatically once its habit is ticked —
// the plan already knows exactly what that meal contains, so asking anyone to
// re-type it would be duplicate entry. Returns null when it isn't ticked.
export function dinnerContribution(habitsArr, dateISO) {
  if (!habitsArr || !habitsArr.includes('dinner')) return null;
  return WEEK[dayIndex(dateISO)];
}

// Logged value + whatever tonight's dinner contributes. Non-destructive: the
// stored metric always holds only what the user typed.
export function macroTotal(macro, metrics, habitsArr, dateISO) {
  const raw = Number(metrics?.[macro.id]);
  const logged = isNaN(raw) ? 0 : raw;
  const meal = dinnerContribution(habitsArr, dateISO);
  const fromMeal = meal ? Number(meal[macro.mealKey]) || 0 : 0;
  return { logged, fromMeal, total: logged + fromMeal };
}

// ── Date helpers (local calendar days, Monday = 0 … Sunday = 6) ──

export function iso(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
export function todayISO() { return iso(new Date()); }
export function parseISO(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
export function addDays(s, n) { const d = parseISO(s); d.setDate(d.getDate() + n); return iso(d); }
export function dayIndex(s) { return (parseISO(s).getDay() + 6) % 7; }

// ── Marker math ──

export function bounds(m, chronoAge) {
  if (m.id === 'bioage') return { min: null, max: chronoAge || null };
  return { min: m.min != null ? m.min : null, max: m.max != null ? m.max : null };
}

export function markerStatus(m, v, chronoAge) {
  if (v == null || v === '' || isNaN(v)) return 'none';
  v = Number(v);
  const b = bounds(m, chronoAge);
  if (m.id === 'bioage') return b.max == null ? 'none' : (v <= b.max ? 'in_range' : 'above');
  if (m.dir === 'below') return (m.inc ? v <= m.max : v < m.max) ? 'in_range' : 'above';
  if (m.dir === 'above') return (m.inc ? v >= m.min : v > m.min) ? 'in_range' : 'below';
  if (v < m.min) return 'below';
  if (v > m.max) return 'above';
  return 'in_range';
}

export function targetText(m) {
  if (m.note) return m.note;
  if (m.dir === 'below') return 'Target ' + (m.inc ? '≤ ' : '< ') + m.max + ' ' + m.unit;
  if (m.dir === 'above') return 'Target ' + (m.inc ? '≥ ' : '> ') + m.min + ' ' + m.unit;
  return 'Target ' + m.min + '–' + m.max + ' ' + m.unit;
}

// Distance outside the target zone; 0 means inside it.
export function outsideBy(m, v, chronoAge) {
  v = Number(v);
  if (isNaN(v)) return null;
  const b = bounds(m, chronoAge);
  if (b.min != null && v < b.min) return b.min - v;
  if (b.max != null && v > b.max) return v - b.max;
  return 0;
}

// 'better' | 'worse' | 'flat' — judged by distance from target, not raw
// direction of travel, so a marker falling below its floor reads as worse.
export function trendOf(m, prev, last, chronoAge) {
  const a = outsideBy(m, prev, chronoAge), z = outsideBy(m, last, chronoAge);
  if (a == null || z == null) return 'flat';
  if (a === 0 && z === 0) return 'flat';
  if (z < a) return 'better';
  if (z > a) return 'worse';
  return 'flat';
}

// The daily target: hit this many of the 16 habits and the day counts as won.
export const DAILY_GOAL = 8;

const HABIT_IDS = new Set(HABITS.map(h => h.id));

// Metrics that complete a habit on their own — entering the number is the
// tick. Metrics can auto-check a habit, never un-check one: a below-threshold
// value leaves any manual tick alone.
export const METRIC_HABIT_LINKS = [
  { metric: 'proteinG', habit: 'protein', min: 110 },
  { metric: 'fiberG',   habit: 'fiber',   min: 30 },
  { metric: 'stepsN',   habit: 'steps',   min: 8000 },
  { metric: 'sleepH',   habit: 'sleep',   min: 7 },
];

export function autoHabits(metrics, habits, dateISO) {
  let next = habits;
  for (const link of METRIC_HABIT_LINKS) {
    const macro = MACROS.find(m => m.id === link.metric);
    const v = macro && dateISO
      ? macroTotal(macro, metrics, next, dateISO).total
      : Number(metrics?.[link.metric]);
    if (!isNaN(v) && v >= link.min && !next.includes(link.habit)) {
      next = [...next, link.habit];
    }
  }
  return next;
}

// Count only protocol habits — health_logs.habits may carry keys from the
// retired wellbeing checklist, which must not move the goal.
export function countHabits(habitsArr) {
  if (!habitsArr) return 0;
  return habitsArr.filter(id => HABIT_IDS.has(id)).length;
}

// Progress toward the daily goal, capped at 1 — extra habits are a bonus,
// not a requirement, so an 8-habit day and a 16-habit day both score 100%.
export function dayScore(habitsArr) {
  return Math.min(countHabits(habitsArr) / DAILY_GOAL, 1);
}
