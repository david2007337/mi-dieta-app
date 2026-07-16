const STORAGE_KEY = 'planNutriStateV1';

const breakfastOptions = [
  { value: 'Esmorzar típic', description: '100 g de pa amb pernil dolç o salat i formatge, 1 got de llet semiseca.' },
  { value: 'Esmorzar esportiu', description: 'Igual que l\'anterior però amb una fruita.' }
];

const snackFixedText = '1 iogurt natural, 30 g d\'avena, 1 fruita i 10 ametlles';

const baseRecipes = [
  {
    name: 'Pasta integral con tomate y pollo',
    category: 'Comida',
    ingredients: [
      { name: 'pasta integral', grams: 100 },
      { name: 'tomate', grams: 80 },
      { name: 'pollo', grams: 120 },
      { name: 'espinacas', grams: 80 }
    ],
    steps: 'Cocina la pasta y saltea el pollo con tomate y espinacas.'
  },
  {
    name: 'Arroz con garbanzos y verduras',
    category: 'Comida',
    ingredients: [
      { name: 'arroz', grams: 120 },
      { name: 'garbanzos', grams: 120 },
      { name: 'pimiento', grams: 80 },
      { name: 'calabacín', grams: 80 }
    ],
    steps: 'Cocina el arroz y añade garbanzos y verduras salteadas.'
  },
  {
    name: 'Quinoa con salmón y ensalada',
    category: 'Cena',
    ingredients: [
      { name: 'quinoa', grams: 100 },
      { name: 'salmón', grams: 140 },
      { name: 'lechuga', grams: 80 },
      { name: 'aguacate', grams: 80 }
    ],
    steps: 'Cocina la quinoa y acompaña con salmón y ensalada.'
  },
  {
    name: 'Lentejas con verduras y carne magra',
    category: 'Cena',
    ingredients: [
      { name: 'lentejas', grams: 120 },
      { name: 'carne magra', grams: 140 },
      { name: 'zanahoria', grams: 80 },
      { name: 'apio', grams: 60 }
    ],
    steps: 'Cuece las lentejas y añade carne magra y verduras.'
  },
  {
    name: 'Avena con yogur y fruta',
    category: 'Desayuno',
    ingredients: [
      { name: 'avena', grams: 70 },
      { name: 'yogur', grams: 150 },
      { name: 'plátano', grams: 100 }
    ],
    steps: 'Mezcla la avena con yogur y añade la fruta.'
  },
  {
    name: 'Tostadas con hummus y tomate',
    category: 'Merienda',
    ingredients: [
      { name: 'pan integral', grams: 80 },
      { name: 'hummus', grams: 60 },
      { name: 'tomate', grams: 80 }
    ],
    steps: 'Tuesta el pan y añade hummus y tomate.'
  }
];

const defaultState = {
  selectedDate: null,
  weekIndex: 0,
  activeView: 'overview',
  recipeFilter: 'all',
  plan: [],
  recipes: [],
  parameters: {
    base: 120,
    vegetables: 200,
    meat: 140,
    lunchComplement: 'salsa de tomàquet',
    dinnerComplement: 'salsa de tomàquet'
  }
};

let state = loadState();

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
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
      parameters: { ...defaultState.parameters, ...(parsed.parameters || {}) },
      mealPresets: {
        breakfast: [...(parsed.mealPresets?.breakfast || defaultState.mealPresets.breakfast)],
        snack: [...(parsed.mealPresets?.snack || defaultState.mealPresets.snack)]
      },
      selectedDate: parsed.selectedDate || (parsed.plan?.[0]?.date || null)
    };
  } catch (error) {
    console.error('No se pudo cargar el estado', error);
    const plan = buildInitialPlan();
    return { ...defaultState, plan, recipes: baseRecipes.map(normalizeRecipe), selectedDate: plan[0]?.date || null };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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

function normalizeRecipe(recipe) {
  return {
    ...recipe,
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
    option.textContent = `Semana ${week + 1}`;
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

    dayCard.innerHTML = `
      <div class="overview-day-header">
        <h3>${formatDateLabel(entry.date)}</h3>
        <span class="overview-day-badge">${new Date(entry.date).toLocaleDateString('ca-ES', { weekday: 'long' })}</span>
      </div>
      <div class="overview-meal">
        <strong>Esmorzar</strong>
        <p>${breakfastText}</p>
      </div>
      <div class="overview-meal">
        <strong>Berenar</strong>
        <p>${snackText}</p>
      </div>
      <div class="overview-meal">
        <strong>Dinar</strong>
        <p>${entry.lunchRecipe || 'Sense definir'}</p>
        ${lunchRecipe ? `<ul class="recipe-ingredients-list">${lunchRecipe.ingredients.map((ingredient) => `<li class="ingredient-pill">${formatIngredient(ingredient)}</li>`).join('')}</ul>` : ''}
      </div>
      <div class="overview-meal">
        <strong>Viena</strong>
        <p>${entry.dinnerRecipe || 'Sense definir'}</p>
        ${dinnerRecipe ? `<ul class="recipe-ingredients-list">${dinnerRecipe.ingredients.map((ingredient) => `<li class="ingredient-pill">${formatIngredient(ingredient)}</li>`).join('')}</ul>` : ''}
      </div>
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
      <p><strong>Berenar:</strong> ${entry.snackEnabled === false ? 'Sense' : (entry.snack || snackFixedText)}</p>
      <p><strong>Dinar:</strong> ${entry.lunchRecipe || 'Sense definir'}</p>
      <p><strong>Viena:</strong> ${entry.dinnerRecipe || 'Sense definir'}</p>
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

  const recipeOptions = ['<option value="">Sin receta</option>', ...state.recipes.map((recipe) => `<option value="${recipe.name}" ${entry?.lunchRecipe === recipe.name ? 'selected' : ''}>${recipe.name}</option>`)].join('');
  lunchRecipeInput.innerHTML = recipeOptions;
  dinnerRecipeInput.innerHTML = recipeOptions.replace(/value="(.*?)"/g, (full, value) => {
    if (entry?.dinnerRecipe === value) {
      return `value="${value}" selected`;
    }
    return full;
  });

  document.getElementById('notesInput').value = entry?.notes || '';

  document.getElementById('paramBase').value = state.parameters.base;
  document.getElementById('paramVegetables').value = state.parameters.vegetables;
  document.getElementById('paramMeat').value = state.parameters.meat;
  document.getElementById('paramLunchComplement').value = state.parameters.lunchComplement || '';
  document.getElementById('paramDinnerComplement').value = state.parameters.dinnerComplement || '';
  document.getElementById('recipeFilter').value = state.recipeFilter;

  if (breakfastDescription) {
    breakfastDescription.textContent = getBreakfastDescription(breakfastInput.value);
  }
}

function categorizeIngredient(name) {
  const lowered = (name || '').toLowerCase();
  if (lowered.includes('pasta') || lowered.includes('arroz') || lowered.includes('legumbre') || lowered.includes('lenteja') || lowered.includes('garbanzo') || lowered.includes('quinoa') || lowered.includes('avena')) return 'base';
  if (lowered.includes('verdura') || lowered.includes('ensalada') || lowered.includes('tomate') || lowered.includes('lechuga') || lowered.includes('pepino') || lowered.includes('espinaca') || lowered.includes('pimiento') || lowered.includes('zanahoria') || lowered.includes('calabacín') || lowered.includes('cebolla') || lowered.includes('aguacate')) return 'vegetables';
  if (lowered.includes('carne') || lowered.includes('pollo') || lowered.includes('pavo') || lowered.includes('salmón') || lowered.includes('salmon') || lowered.includes('pescado') || lowered.includes('huevo') || lowered.includes('tofu')) return 'meat';
  return 'other';
}

function getRecipeCompatibility(recipe) {
  if (recipe.category === 'Desayuno' || recipe.category === 'Merienda') {
    return null;
  }

  const totals = { base: 0, vegetables: 0, meat: 0 };
  recipe.ingredients.forEach((ingredient) => {
    const category = categorizeIngredient(ingredient.name);
    if (category === 'base') totals.base += Number(ingredient.grams || 0);
    if (category === 'vegetables') totals.vegetables += Number(ingredient.grams || 0);
    if (category === 'meat') totals.meat += Number(ingredient.grams || 0);
  });

  const checks = [
    {
      label: 'Base',
      total: totals.base,
      target: state.parameters.base,
      key: 'base'
    },
    {
      label: 'Verdura',
      total: totals.vegetables,
      target: state.parameters.vegetables,
      key: 'vegetables'
    },
    {
      label: 'Carne',
      total: totals.meat,
      target: state.parameters.meat,
      key: 'meat'
    }
  ];

  const isAdecuada = checks.every((check) => check.target > 0 ? Math.abs(check.total - check.target) <= check.target * 0.2 : true);
  const summary = checks.map((check) => `${check.label}: ${check.total}g / ${check.target}g`).join(' · ');
  return { isAdecuada, summary };
}

function renderRecipeList() {
  const container = document.getElementById('recipeList');
  container.innerHTML = '';

  const filteredRecipes = state.recipes.filter((recipe) => {
    if (state.recipeFilter === 'all') return true;
    const map = { breakfast: 'Desayuno', lunch: 'Comida', snack: 'Merienda', dinner: 'Cena' };
    return recipe.category === map[state.recipeFilter];
  });

  if (!filteredRecipes.length) {
    container.innerHTML = '<p>Encara no hi ha receptes.</p>';
    return;
  }

  filteredRecipes.forEach((recipe) => {
    const item = document.createElement('div');
    item.className = 'recipe-item';
    const compatibility = getRecipeCompatibility(recipe);
    item.innerHTML = `
      <strong>${recipe.name}</strong>
      <p>${recipe.category}</p>
      <ul class="recipe-ingredients-list">
        ${recipe.ingredients.map((ingredient) => `<li class="ingredient-pill">${formatIngredient(ingredient)}</li>`).join('')}
      </ul>
      <p>${recipe.steps}</p>
      ${compatibility ? `<p class="recipe-status ${compatibility.isAdecuada ? 'good' : 'warn'}">${compatibility.isAdecuada ? 'Adaptada als paràmetres' : 'No s\'adapta del tot als paràmetres'} · ${compatibility.summary}</p>` : ''}
    `;
    container.appendChild(item);
  });
}

function buildShoppingList() {
  const items = new Map();

  const add = (name, grams = 0, count = 1) => {
    if (!name) return;
    const normalized = name.trim().toLowerCase();
    const existing = items.get(normalized) || { name: name.trim(), grams: 0, count: 0 };
    existing.grams += Number(grams || 0);
    existing.count += Number(count || 0);
    items.set(normalized, existing);
  };

  state.plan.forEach((entry) => {
    if (entry.breakfast) add(entry.breakfast, 0, 1);
    if (entry.snackEnabled !== false && entry.snack) add(entry.snack, 0, 1);

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
    container.innerHTML = '<p>Encara no hi ha productes.</p>';
    return;
  }

  const fragment = document.createDocumentFragment();
  list.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'shopping-item';
    const gramsText = item.grams > 0 ? `${item.grams}g acumulados` : '';
    const countText = item.count > 1 ? `${item.count} veces` : `${item.count} vez`;
    row.innerHTML = `<strong>${item.name}</strong><span>${[gramsText, `${countText} al pla`].filter(Boolean).join(' · ')}</span>`;
    fragment.appendChild(row);
  });

  container.appendChild(fragment);
}

function buildSuggestedRecipe(title, category, baseName, meatName, complement) {
  const baseGrams = Number(state.parameters.base || 0);
  const vegetablesGrams = Number(state.parameters.vegetables || 0);
  const meatGrams = Number(state.parameters.meat || 0);
  const safeComplement = complement || 'salsa de tomàquet';

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
    buildSuggestedRecipe('Pasta amb tomàquet i pollastre', 'Comida', 'pasta integral', 'pollastre', state.parameters.lunchComplement || 'salsa de tomàquet'),
    buildSuggestedRecipe('Arròs amb llenties i verdures', 'Cena', 'arròs', 'pollastre', state.parameters.dinnerComplement || 'salsa de tomàquet')
  ];

  const container = document.getElementById('aiSuggestions');
  container.innerHTML = '';
  ideas.forEach((idea) => {
    const item = document.createElement('div');
    item.className = 'suggestion-item';
    const compatibility = getRecipeCompatibility(idea);
    item.innerHTML = `
      <strong>${idea.name}</strong>
      <p>${idea.steps}</p>
      <p class="recipe-status ${compatibility.isAdecuada ? 'good' : 'warn'}">${compatibility.summary}</p>
      <button class="apply-btn" type="button">Aplicar</button>
    `;
    item.querySelector('button').addEventListener('click', () => {
      const entry = getEntryByDate(state.selectedDate);
      if (!entry) return;
      const recipeName = idea.name;
      document.getElementById('lunchRecipeInput').value = recipeName;
      document.getElementById('notesInput').value = `Idea suggerida: ${recipeName}`;
      entry.lunchRecipe = recipeName;
      entry.notes = `Idea suggerida: ${recipeName}`;
      const existing = state.recipes.find((recipe) => recipe.name === recipeName);
      if (!existing) {
        state.recipes.unshift(normalizeRecipe(idea));
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
    saveState();
    renderView();
  });

  document.getElementById('weekSelector').addEventListener('change', (event) => {
    state.weekIndex = Number(event.target.value) || 0;
    saveState();
    render();
  });

  document.getElementById('dayForm').addEventListener('submit', (event) => {
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


  document.getElementById('recipeForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const ingredientsText = document.getElementById('recipeIngredients').value;
    const ingredients = ingredientsText
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
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
  });

  document.getElementById('recipeFilter').addEventListener('change', (event) => {
    state.recipeFilter = event.target.value;
    saveState();
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

  document.getElementById('paramsForm').addEventListener('submit', (event) => {
    event.preventDefault();
    state.parameters = {
      base: Number(document.getElementById('paramBase').value || 0),
      vegetables: Number(document.getElementById('paramVegetables').value || 0),
      meat: Number(document.getElementById('paramMeat').value || 0),
      lunchComplement: document.getElementById('paramLunchComplement').value.trim(),
      dinnerComplement: document.getElementById('paramDinnerComplement').value.trim()
    };
    saveState();
    render();
  });

  document.getElementById('generateIdeasBtn').addEventListener('click', generateRecipeIdeas);

  document.getElementById('resetBtn').addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
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
}

function init() {
  if (!state.selectedDate && state.plan.length) {
    state.selectedDate = state.plan[0].date;
  }
  document.getElementById('viewSelector').value = state.activeView;
  bindEvents();
  render();
}

init();
