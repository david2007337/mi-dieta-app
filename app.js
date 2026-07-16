const STORAGE_KEY = 'planNutriStateV1Beta';
const LEGACY_STORAGE_KEY = 'planNutriStateV1';

const breakfastOptions = [
  { value: 'Esmorzar típic', description: '100 g de pa amb pernil dolç o salat i formatge, 1 got de llet semiseca.' },
  { value: 'Esmorzar esportiu', description: 'Igual que l’anterior però amb una fruita.' }
];

const snackFixedText = '1 iogurt natural, 30 g d’avena, 1 fruita i 10 ametlles';

const baseRecipes = [
  {
    name: 'Pasta integral amb tomàquet i pollastre',
    category: 'Dinar',
    ingredients: [
      { name: 'pasta integral', grams: 100 },
      { name: 'tomàquet', grams: 80 },
      { name: 'pollastre', grams: 120 },
      { name: 'espinacs', grams: 80 }
    ],
    steps: 'Cocina la pasta i salteja el pollastre amb tomàquet i espinacs.'
  },
  {
    name: 'Arròs amb garbanzos i verdures',
    category: 'Dinar',
    ingredients: [
      { name: 'arròs', grams: 120 },
      { name: 'garbanzos', grams: 120 },
      { name: 'pimiento', grams: 80 },
      { name: 'carbassó', grams: 80 }
    ],
    steps: 'Cuina l’arròs i afegeix garbanzos i verdures saltejades.'
  },
  {
    name: 'Quinoa amb salmó i amanida',
    category: 'Sopar',
    ingredients: [
      { name: 'quinoa', grams: 100 },
      { name: 'salmó', grams: 140 },
      { name: 'amanida', grams: 80 },
      { name: 'alvocat', grams: 80 }
    ],
    steps: 'Cuina la quinoa i acompanya amb salmó i amanida.'
  },
  {
    name: 'Llenties amb verdures i carn magra',
    category: 'Sopar',
    ingredients: [
      { name: 'llenties', grams: 120 },
      { name: 'carn magra', grams: 140 },
      { name: 'pastanaga', grams: 80 },
      { name: 'api', grams: 60 }
    ],
    steps: 'Cuina les llenties i afegeix carn magra i verdures.'
  },
  {
    name: 'Avena amb iogurt i fruita',
    category: 'Esmorzar',
    ingredients: [
      { name: 'avena', grams: 70 },
      { name: 'iogurt', grams: 150 },
      { name: 'plàtan', grams: 100 }
    ],
    steps: 'Mescla l’avena amb iogurt i afegeix la fruita.'
  },
  {
    name: 'Torrades amb hummus i tomàquet',
    category: 'Berenar',
    ingredients: [
      { name: 'pa integral', grams: 80 },
      { name: 'hummus', grams: 60 },
      { name: 'tomàquet', grams: 80 }
    ],
    steps: 'Tosta el pa i afegeix hummus i tomàquet.'
  }
];

const defaultState = {
  selectedDate: null,
  weekIndex: 0,
  activeView: 'overview',
  recipeFilter: 'all',
  plan: [],
  recipes: [],
  lastSavedAt: null,
  parameters: {
    lunch: { base: 120, vegetables: 200, meat: 140, complement: 'salsa de tomàquet' },
    dinner: { base: 120, vegetables: 200, meat: 140, complement: 'salsa de tomàquet' }
  }
};

let state = loadState();
let saveTimer = null;

function normalizeParameters(parameters = {}) {
  const fallback = defaultState.parameters;
  return {
    lunch: {
      base: Number(parameters?.lunch?.base ?? parameters?.base ?? fallback.lunch.base),
      vegetables: Number(parameters?.lunch?.vegetables ?? parameters?.vegetables ?? fallback.lunch.vegetables),
      meat: Number(parameters?.lunch?.meat ?? parameters?.meat ?? fallback.lunch.meat),
      complement: parameters?.lunch?.complement ?? parameters?.lunchComplement ?? fallback.lunch.complement
    },
    dinner: {
      base: Number(parameters?.dinner?.base ?? fallback.dinner.base),
      vegetables: Number(parameters?.dinner?.vegetables ?? fallback.dinner.vegetables),
      meat: Number(parameters?.dinner?.meat ?? fallback.dinner.meat),
      complement: parameters?.dinner?.complement ?? parameters?.dinnerComplement ?? fallback.dinner.complement
    }
  };
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!raw) {
    const plan = buildInitialPlan();
    return { ...defaultState, plan, recipes: baseRecipes.map(normalizeRecipe), selectedDate: plan[0]?.date || null };
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      ...defaultState,
      ...parsed,
      plan: parsed.plan?.length ? parsed.plan : buildInitialPlan(),
      recipes: (parsed.recipes || baseRecipes).map(normalizeRecipe),
      parameters: normalizeParameters(parsed.parameters || {}),
      selectedDate: parsed.selectedDate || (parsed.plan?.[0]?.date || null),
      lastSavedAt: parsed.lastSavedAt || null
    };
  } catch (error) {
    console.error('No s\'ha pogut carregar l\'estat', error);
    const plan = buildInitialPlan();
    return { ...defaultState, plan, recipes: baseRecipes.map(normalizeRecipe), selectedDate: plan[0]?.date || null };
  }
}

function saveState() {
  state.lastSavedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(state));
  updateSaveStatus();
}

function updateSaveStatus() {
  const statusEl = document.getElementById('saveStatus');
  if (!statusEl) return;
  if (state.lastSavedAt) {
    const savedAt = new Date(state.lastSavedAt);
    const timeLabel = savedAt.toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' });
    statusEl.textContent = `Desat • ${timeLabel}`;
  } else {
    statusEl.textContent = 'Desat localment';
  }
}

function scheduleAutosave() {
  const statusEl = document.getElementById('saveStatus');
  if (statusEl) {
    statusEl.textContent = 'Guardant…';
  }
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveState();
  }, 250);
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `plannutri-beta-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
  const statusEl = document.getElementById('saveStatus');
  if (statusEl) {
    statusEl.textContent = 'Còpia exportada';
  }
}

function importData(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      state = {
        ...defaultState,
        ...parsed,
        plan: parsed.plan?.length ? parsed.plan : buildInitialPlan(),
        recipes: (parsed.recipes || baseRecipes).map(normalizeRecipe),
        parameters: normalizeParameters(parsed.parameters || {}),
        selectedDate: parsed.selectedDate || (parsed.plan?.[0]?.date || null),
        lastSavedAt: parsed.lastSavedAt || null
      };
      saveState();
      render();
    } catch (error) {
      console.error('No s\'ha pogut importar', error);
      alert('No s\'ha pogut importar el fitxer.');
    }
  };
  reader.readAsText(file);
}

function normalizeIngredient(item) {
  if (!item) return { name: '', grams: 0 };
  if (typeof item === 'string') {
    const trimmed = item.trim();
    const match = trimmed.match(/^(.*?)\s+(\d+(?:\.\d+)?)\s*g$/i);
    if (match) {
      return { name: match[1].trim(), grams: Number(match[2]) };
    }
    return { name: trimmed, grams: 0 };
  }
  return { name: item.name || item.ingredient || '', grams: Number(item.grams || 0) };
}

function normalizeRecipeCategory(category) {
  const value = (category || '').toString().trim().toLowerCase();
  if (value.includes('esmorz') || value === 'desayuno') return 'Esmorzar';
  if (value.includes('beren') || value === 'merienda') return 'Berenar';
  if (value.includes('dinar') || value === 'comida') return 'Dinar';
  if (value.includes('sop') || value === 'cena') return 'Sopar';
  return category || 'Dinar';
}

function normalizeRecipe(recipe) {
  return {
    ...recipe,
    category: normalizeRecipeCategory(recipe.category),
    ingredients: (recipe.ingredients || []).map(normalizeIngredient).filter((ingredient) => ingredient.name)
  };
}

function formatIngredient(item) {
  if (!item || !item.name) return '';
  return item.grams > 0 ? `${item.name} (${item.grams}g)` : item.name;
}

function buildInitialPlan() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return Array.from({ length: 28 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      date: date.toISOString(),
      breakfast: '',
      snack: snackFixedText,
      snackEnabled: true,
      lunchRecipe: '',
      dinnerRecipe: '',
      notes: ''
    };
  });
}

function formatDateLabel(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('ca-ES', { weekday: 'short', day: 'numeric', month: 'short' });
}

function getEntryByDate(dateString) {
  return state.plan.find((entry) => entry.date === dateString);
}

function getWeekStartDate() {
  const base = state.selectedDate ? new Date(state.selectedDate) : new Date();
  base.setHours(0, 0, 0, 0);
  const day = base.getDay();
  const diff = (day + 6) % 7;
  const start = new Date(base);
  start.setDate(base.getDate() - diff);
  start.setDate(start.getDate() + state.weekIndex * 7);
  return start;
}

function getWeekEntries() {
  const start = getWeekStartDate();
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return state.plan.filter((entry) => {
    const entryDate = new Date(entry.date);
    entryDate.setHours(0, 0, 0, 0);
    return entryDate >= start && entryDate <= end;
  });
}

function getWeekIndexForDate(dateString) {
  const planStart = state.plan[0]?.date ? new Date(state.plan[0].date) : new Date();
  planStart.setHours(0, 0, 0, 0);
  const target = new Date(dateString);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((target - planStart) / 86400000);
  return Math.max(0, Math.floor(diffDays / 7));
}

function formatWeekRangeLabel() {
  const start = getWeekStartDate();
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return `${start.toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' })}`;
}

function renderWeekSelector() {
  const container = document.getElementById('weekSelector');
  if (!container) return;
  container.innerHTML = '';
  for (let week = 0; week < 4; week += 1) {
    const option = document.createElement('option');
    option.value = week;
    option.textContent = `Setmana ${week + 1}`;
    container.appendChild(option);
  }
  container.value = state.weekIndex;
}

function renderOverview() {
  const container = document.getElementById('overviewList');
  const label = document.getElementById('overviewWeekLabel');
  if (!container) return;

  const weekEntries = getWeekEntries();
  container.innerHTML = '';

  if (label) {
    label.textContent = `Setmana ${state.weekIndex + 1} · ${formatWeekRangeLabel()}`;
  }

  if (!weekEntries.length) {
    container.innerHTML = '<p>Encara no hi ha res per aquesta setmana.</p>';
    return;
  }

  weekEntries.forEach((entry) => {
    const dayCard = document.createElement('article');
    dayCard.className = 'overview-day-card';

    const breakfastText = entry.breakfast ? `${entry.breakfast}: ${getBreakfastDescription(entry.breakfast)}` : 'Sense definir';
    const snackText = entry.snackEnabled === false ? 'Sense berenar' : (entry.snack || snackFixedText);
    const lunchRecipe = state.recipes.find((recipe) => recipe.name === entry.lunchRecipe);
    const dinnerRecipe = state.recipes.find((recipe) => recipe.name === entry.dinnerRecipe);

    const meals = [
      { label: 'Esmorzar', value: breakfastText },
      { label: 'Dinar', value: entry.lunchRecipe || 'Sense definir', recipe: lunchRecipe },
      { label: 'Berenar', value: snackText },
      { label: 'Sopar', value: entry.dinnerRecipe || 'Sense definir', recipe: dinnerRecipe }
    ];

    dayCard.innerHTML = `
      <div class="overview-day-header">
        <h3>${formatDateLabel(entry.date)}</h3>
        <span class="overview-day-badge">${new Date(entry.date).toLocaleDateString('ca-ES', { weekday: 'long' })}</span>
      </div>
      ${meals.map((meal) => `
        <div class="overview-meal">
          <strong>${meal.label}</strong>
          <p>${meal.value}</p>
          ${meal.recipe ? `<ul class="recipe-ingredients-list">${meal.recipe.ingredients.map((ingredient) => `<li class="ingredient-pill">${formatIngredient(ingredient)}</li>`).join('')}</ul>` : ''}
        </div>
      `).join('')}
    `;

    container.appendChild(dayCard);
  });
}

function renderDayGrid() {
  const container = document.getElementById('dayGrid');
  container.innerHTML = '';

  const weekEntries = getWeekEntries();
  if (!weekEntries.some((entry) => entry.date === state.selectedDate)) {
    state.selectedDate = weekEntries[0]?.date || null;
  }

  weekEntries.forEach((entry) => {
    const card = document.createElement('article');
    card.className = `day-card ${state.selectedDate === entry.date ? 'active' : ''}`;
    card.innerHTML = `
      <h3>${formatDateLabel(entry.date)}</h3>
      <p><strong>Esmorzar:</strong> ${entry.breakfast || 'Sense definir'}</p>
      <p><strong>Dinar:</strong> ${entry.lunchRecipe || 'Sense definir'}</p>
      <p><strong>Berenar:</strong> ${entry.snackEnabled === false ? 'Sense' : (entry.snack || snackFixedText)}</p>
      <p><strong>Sopar:</strong> ${entry.dinnerRecipe || 'Sense definir'}</p>
    `;
    card.addEventListener('click', () => {
      state.selectedDate = entry.date;
      saveState();
      render();
    });
    container.appendChild(card);
  });
}

function getBreakfastOptionsMarkup(selectedValue) {
  return ['<option value="">Sense definir</option>', ...breakfastOptions.map((option) => `<option value="${option.value}" ${selectedValue === option.value ? 'selected' : ''}>${option.value}</option>`)].join('');
}

function getBreakfastDescription(selectedValue) {
  const option = breakfastOptions.find((item) => item.value === selectedValue);
  return option ? option.description : '';
}

function populateForm() {
  const entry = getEntryByDate(state.selectedDate);
  const selectedDateLabel = document.getElementById('selectedDateLabel');
  selectedDateLabel.textContent = entry ? `Edita ${formatDateLabel(entry.date)}` : 'Selecciona un dia';

  const breakfastInput = document.getElementById('breakfastInput');
  const lunchRecipeInput = document.getElementById('lunchRecipeInput');
  const dinnerRecipeInput = document.getElementById('dinnerRecipeInput');
  const snackEnabledInput = document.getElementById('snackEnabled');
  const breakfastDescription = document.getElementById('breakfastDescription');

  breakfastInput.innerHTML = getBreakfastOptionsMarkup(entry?.breakfast || '');
  if (snackEnabledInput) {
    snackEnabledInput.checked = entry?.snackEnabled !== false;
  }

  const recipeOptions = ['<option value="">Sense recepta</option>', ...state.recipes.map((recipe) => `<option value="${recipe.name}" ${entry?.lunchRecipe === recipe.name ? 'selected' : ''}>${recipe.name}</option>`)].join('');
  lunchRecipeInput.innerHTML = recipeOptions;
  dinnerRecipeInput.innerHTML = recipeOptions.replace(/value="(.*?)"/g, (full, value) => {
    if (entry?.dinnerRecipe === value) {
      return `value="${value}" selected`;
    }
    return full;
  });

  document.getElementById('notesInput').value = entry?.notes || '';

  document.getElementById('paramLunchBase').value = state.parameters.lunch.base;
  document.getElementById('paramLunchVegetables').value = state.parameters.lunch.vegetables;
  document.getElementById('paramLunchMeat').value = state.parameters.lunch.meat;
  document.getElementById('paramLunchComplement').value = state.parameters.lunch.complement || '';
  document.getElementById('paramDinnerBase').value = state.parameters.dinner.base;
  document.getElementById('paramDinnerVegetables').value = state.parameters.dinner.vegetables;
  document.getElementById('paramDinnerMeat').value = state.parameters.dinner.meat;
  document.getElementById('paramDinnerComplement').value = state.parameters.dinner.complement || '';
  document.getElementById('recipeFilter').value = state.recipeFilter;

  if (breakfastDescription) {
    breakfastDescription.textContent = getBreakfastDescription(breakfastInput.value);
  }
}

function categorizeIngredient(name) {
  const lowered = (name || '').toLowerCase();
  if (lowered.includes('pasta') || lowered.includes('arrò') || lowered.includes('arròs') || lowered.includes('llent') || lowered.includes('garbanzo') || lowered.includes('quinoa') || lowered.includes('avena')) return 'base';
  if (lowered.includes('verdura') || lowered.includes('amanida') || lowered.includes('tomàquet') || lowered.includes('tomate') || lowered.includes('api') || lowered.includes('espina') || lowered.includes('pimiento') || lowered.includes('pastanaga') || lowered.includes('carbassó') || lowered.includes('alvocat') || lowered.includes('ceba') || lowered.includes('alvocat')) return 'vegetables';
  if (lowered.includes('carn') || lowered.includes('pollastre') || lowered.includes('pavo') || lowered.includes('salmó') || lowered.includes('salmon') || lowered.includes('peix') || lowered.includes('ou') || lowered.includes('tofu')) return 'meat';
  return 'other';
}

function getRecipeCompatibility(recipe) {
  if (recipe.category === 'Esmorzar' || recipe.category === 'Berenar') {
    return null;
  }

  const targets = recipe.category === 'Sopar' ? state.parameters.dinner : state.parameters.lunch;
  const totals = { base: 0, vegetables: 0, meat: 0 };

  recipe.ingredients.forEach((ingredient) => {
    const category = categorizeIngredient(ingredient.name);
    if (category === 'base') totals.base += Number(ingredient.grams || 0);
    if (category === 'vegetables') totals.vegetables += Number(ingredient.grams || 0);
    if (category === 'meat') totals.meat += Number(ingredient.grams || 0);
  });

  const checks = [
    { label: 'Base', total: totals.base, target: targets.base },
    { label: 'Verdura', total: totals.vegetables, target: targets.vegetables },
    { label: 'Carn', total: totals.meat, target: targets.meat }
  ];

  const isAdecuada = checks.every((check) => (check.target > 0 ? Math.abs(check.total - check.target) <= check.target * 0.2 : true));
  const summary = checks.map((check) => `${check.label}: ${check.total}g / ${check.target}g`).join(' · ');
  return { isAdecuada, summary };
}

function renderRecipeList() {
  const container = document.getElementById('recipeList');
  container.innerHTML = '';

  const filteredRecipes = state.recipes.filter((recipe) => {
    if (state.recipeFilter === 'all') return true;
    const map = { breakfast: 'Esmorzar', lunch: 'Dinar', snack: 'Berenar', dinner: 'Sopar' };
    return recipe.category === map[state.recipeFilter];
  });

  if (!filteredRecipes.length) {
    container.innerHTML = '<p>Encara no hi ha receptes d\'aquest tipus.</p>';
    return;
  }

  filteredRecipes.forEach((recipe) => {
    const item = document.createElement('div');
    item.className = 'recipe-item';
    item.innerHTML = `
      <strong>${recipe.name}</strong>
      <p>${recipe.category}</p>
      <ul class="recipe-ingredients-list">
        ${recipe.ingredients.map((ingredient) => `<li class="ingredient-pill">${formatIngredient(ingredient)}</li>`).join('')}
      </ul>
      <p>${recipe.steps}</p>
    `;
    container.appendChild(item);
  });
}

function buildShoppingList() {
  const items = new Map();
  const relevantWeeks = new Set([state.weekIndex, state.weekIndex + 1]);

  const add = (name, grams = 0, count = 1) => {
    if (!name) return;
    const normalized = name.trim().toLowerCase();
    const existing = items.get(normalized) || { name: name.trim(), grams: 0, count: 0 };
    existing.grams += Number(grams || 0);
    existing.count += Number(count || 0);
    items.set(normalized, existing);
  };

  state.plan.forEach((entry) => {
    if (!relevantWeeks.has(getWeekIndexForDate(entry.date))) return;

    if (entry.lunchRecipe) {
      const recipe = state.recipes.find((item) => item.name === entry.lunchRecipe);
      if (recipe) {
        recipe.ingredients.forEach((ingredient) => add(ingredient.name, Number(ingredient.grams || 0), 1));
      }
    }

    if (entry.dinnerRecipe) {
      const recipe = state.recipes.find((item) => item.name === entry.dinnerRecipe);
      if (recipe) {
        recipe.ingredients.forEach((ingredient) => add(ingredient.name, Number(ingredient.grams || 0), 1));
      }
    }
  });

  return Array.from(items.values()).map((item) => ({ name: item.name, grams: item.grams, count: item.count }));
}

function renderShoppingList() {
  const container = document.getElementById('shoppingList');
  const list = buildShoppingList();
  container.innerHTML = '';
  if (!list.length) {
    container.innerHTML = '<p>Encara no hi ha productes per aquesta setmana i la següent.</p>';
    return;
  }

  const fragment = document.createDocumentFragment();
  list.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'shopping-item';
    const gramsText = item.grams > 0 ? `${item.grams}g acumulats` : '';
    const countText = item.count > 1 ? `${item.count} vegades` : `${item.count} vegada`;
    row.innerHTML = `<strong>${item.name}</strong><span>${[gramsText, `${countText} al pla`].filter(Boolean).join(' · ')}</span>`;
    fragment.appendChild(row);
  });

  container.appendChild(fragment);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function collectRecipeIngredientRows() {
  const rows = Array.from(document.querySelectorAll('.ingredient-row'));
  return rows.map((row) => ({
    grams: row.querySelector('.ingredient-grams')?.value || '',
    name: row.querySelector('.ingredient-name')?.value || ''
  }));
}

function renderRecipeIngredientRows(rows = [{ grams: '', name: '' }]) {
  const container = document.getElementById('recipeIngredientRows');
  if (!container) return;

  container.innerHTML = rows.map((row, index) => `
    <div class="ingredient-row">
      <input class="ingredient-grams" type="number" min="0" step="1" placeholder="g" value="${escapeHtml(row.grams || '')}" />
      <input class="ingredient-name" type="text" placeholder="Ingredient" value="${escapeHtml(row.name || '')}" />
      <button class="mini-btn remove-ingredient-btn" type="button">Eliminar</button>
    </div>
  `).join('');

  container.querySelectorAll('.remove-ingredient-btn').forEach((button, index) => {
    button.addEventListener('click', () => {
      const currentRows = collectRecipeIngredientRows();
      currentRows.splice(index, 1);
      if (!currentRows.length) {
        currentRows.push({ grams: '', name: '' });
      }
      renderRecipeIngredientRows(currentRows);
    });
  });
}

function addRecipeIngredientRow() {
  const currentRows = collectRecipeIngredientRows();
  currentRows.push({ grams: '', name: '' });
  renderRecipeIngredientRows(currentRows);
}

function buildSuggestedRecipe(title, category, baseName, meatName, complement, mealType) {
  const target = mealType === 'dinner' ? state.parameters.dinner : state.parameters.lunch;
  const baseGrams = Number(target.base || 0);
  const vegetablesGrams = Number(target.vegetables || 0);
  const meatGrams = Number(target.meat || 0);
  const safeComplement = complement || target.complement || 'salsa de tomàquet';

  const ingredients = [
    { name: baseName, grams: baseGrams },
    { name: 'verdura', grams: vegetablesGrams },
    { name: meatName, grams: meatGrams },
    { name: safeComplement, grams: 50 }
  ];

  return {
    name: title,
    category,
    ingredients,
    steps: `Prepara ${baseName} amb ${meatName} i verdures; afegeix ${safeComplement} al final.`,
    generated: true
  };
}

function generateRecipeIdeas() {
  const ideas = [
    buildSuggestedRecipe('Pasta amb tomàquet i pollastre', 'Dinar', 'pasta integral', 'pollastre', state.parameters.lunch.complement || 'salsa de tomàquet', 'lunch'),
    buildSuggestedRecipe('Arròs amb llenties i verdures', 'Sopar', 'arròs', 'pollastre', state.parameters.dinner.complement || 'salsa de tomàquet', 'dinner')
  ];

  const container = document.getElementById('aiSuggestions');
  container.innerHTML = '';
  ideas.forEach((idea) => {
    const item = document.createElement('div');
    item.className = 'suggestion-item';
    item.innerHTML = `
      <strong>${idea.name}</strong>
      <p>${idea.steps}</p>
      <label class="idea-target">
        <span>Assignar a</span>
        <select class="idea-target-select">
          <option value="lunch">Dinar</option>
          <option value="dinner">Sopar</option>
        </select>
      </label>
      <button class="apply-btn" type="button">Aplicar</button>
    `;
    item.querySelector('button').addEventListener('click', () => {
      const entry = getEntryByDate(state.selectedDate);
      if (!entry) return;
      const target = item.querySelector('.idea-target-select').value;
      const recipeName = idea.name;
      const recipeCategory = target === 'dinner' ? 'Sopar' : 'Dinar';
      const recipe = normalizeRecipe({ ...idea, category: recipeCategory });

      if (target === 'dinner') {
        document.getElementById('dinnerRecipeInput').value = recipeName;
        entry.dinnerRecipe = recipeName;
      } else {
        document.getElementById('lunchRecipeInput').value = recipeName;
        entry.lunchRecipe = recipeName;
      }

      document.getElementById('notesInput').value = `Idea suggerida: ${recipeName}`;
      entry.notes = `Idea suggerida: ${recipeName}`;
      const existing = state.recipes.find((currentRecipe) => currentRecipe.name === recipeName);
      if (!existing) {
        state.recipes.unshift(recipe);
        state.recipes = state.recipes.slice(0, 12);
      }
      saveState();
      render();
    });
    container.appendChild(item);
  });
}

function bindEvents() {
  document.getElementById('viewSelector').addEventListener('change', (event) => {
    state.activeView = event.target.value;
    scheduleAutosave();
    renderView();
  });

  document.getElementById('weekSelector').addEventListener('change', (event) => {
    state.weekIndex = Number(event.target.value) || 0;
    scheduleAutosave();
    render();
  });

  const dayForm = document.getElementById('dayForm');
  dayForm.addEventListener('input', scheduleAutosave);
  dayForm.addEventListener('change', scheduleAutosave);
  dayForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const entry = getEntryByDate(state.selectedDate);
    if (!entry) return;

    entry.breakfast = document.getElementById('breakfastInput').value;
    entry.snack = snackFixedText;
    entry.snackEnabled = document.getElementById('snackEnabled').checked;
    entry.lunchRecipe = document.getElementById('lunchRecipeInput').value;
    entry.dinnerRecipe = document.getElementById('dinnerRecipeInput').value;
    entry.notes = document.getElementById('notesInput').value;

    saveState();
    render();
  });

  const recipeForm = document.getElementById('recipeForm');
  recipeForm.addEventListener('input', scheduleAutosave);
  recipeForm.addEventListener('change', scheduleAutosave);
  recipeForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const ingredientRows = collectRecipeIngredientRows();
    const ingredients = ingredientRows
      .map((row) => ({ name: row.name.trim(), grams: row.grams }))
      .filter((row) => row.name)
      .map(normalizeIngredient);

    const newRecipe = {
      name: document.getElementById('recipeName').value.trim(),
      category: document.getElementById('recipeCategorySelect').value,
      ingredients,
      steps: document.getElementById('recipeSteps').value.trim()
    };

    if (!newRecipe.name || !newRecipe.category || !newRecipe.ingredients.length || !newRecipe.steps) return;

    state.recipes.unshift(normalizeRecipe(newRecipe));
    state.recipes = state.recipes.slice(0, 12);
    saveState();
    render();
    event.target.reset();
    renderRecipeIngredientRows();
  });

  document.getElementById('recipeFilter').addEventListener('change', (event) => {
    state.recipeFilter = event.target.value;
    scheduleAutosave();
    renderRecipeList();
  });

  document.getElementById('breakfastInput').addEventListener('change', (event) => {
    const description = document.getElementById('breakfastDescription');
    if (description) {
      description.textContent = getBreakfastDescription(event.target.value);
    }
  });

  document.getElementById('snackEnabled').addEventListener('change', (event) => {
    const snackText = document.getElementById('snackText');
    if (snackText) {
      snackText.textContent = event.target.checked ? snackFixedText : 'Sense berenar';
    }
  });

  const paramsForm = document.getElementById('paramsForm');
  paramsForm.addEventListener('input', scheduleAutosave);
  paramsForm.addEventListener('change', scheduleAutosave);
  paramsForm.addEventListener('submit', (event) => {
    event.preventDefault();
    state.parameters = {
      lunch: {
        base: Number(document.getElementById('paramLunchBase').value || 0),
        vegetables: Number(document.getElementById('paramLunchVegetables').value || 0),
        meat: Number(document.getElementById('paramLunchMeat').value || 0),
        complement: document.getElementById('paramLunchComplement').value.trim()
      },
      dinner: {
        base: Number(document.getElementById('paramDinnerBase').value || 0),
        vegetables: Number(document.getElementById('paramDinnerVegetables').value || 0),
        meat: Number(document.getElementById('paramDinnerMeat').value || 0),
        complement: document.getElementById('paramDinnerComplement').value.trim()
      }
    };
    saveState();
    render();
  });

  document.getElementById('generateIdeasBtn').addEventListener('click', generateRecipeIdeas);
  document.getElementById('addIngredientRowBtn').addEventListener('click', () => {
    addRecipeIngredientRow();
    scheduleAutosave();
  });

  document.getElementById('exportBtn').addEventListener('click', exportData);
  document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFileInput').click());
  document.getElementById('importFileInput').addEventListener('change', (event) => {
    importData(event.target.files[0]);
    event.target.value = '';
  });

  document.getElementById('resetBtn').addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    state = loadState();
    render();
  });
}

function renderView() {
  document.getElementById('overviewView').classList.toggle('hidden', state.activeView !== 'overview');
  document.getElementById('homeView').classList.toggle('hidden', state.activeView !== 'home');
  document.getElementById('recipesView').classList.toggle('hidden', state.activeView !== 'recipes');
  document.getElementById('shoppingView').classList.toggle('hidden', state.activeView !== 'shopping');
  document.getElementById('paramsView').classList.toggle('hidden', state.activeView !== 'params');
}

function render() {
  renderView();
  renderWeekSelector();
  renderOverview();
  renderDayGrid();
  populateForm();
  renderRecipeList();
  renderShoppingList();
  updateSaveStatus();
}

function init() {
  if (!state.selectedDate && state.plan.length) {
    state.selectedDate = state.plan[0].date;
  }
  document.getElementById('viewSelector').value = state.activeView;
  renderRecipeIngredientRows();
  bindEvents();
  updateSaveStatus();
  render();
}

init();
