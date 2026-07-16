const STORAGE_KEY = 'planNutriStateV1';

const breakfastOptions = [
  'Avena con fruta',
  'Yogur natural con frutos secos',
  'Tortilla de claras',
  'Tostadas con hummus',
  'Bowl de yogur y granola'
];

const snackOptions = [
  'Fruta fresca',
  'Yogur',
  'Puñado de frutos secos',
  'Tortitas de hummus',
  'Batido de proteína'
];

const baseRecipes = [
  {
    name: 'Pasta integral con tomate y pollo',
    category: 'Comida',
    ingredients: ['pasta integral', 'tomate', 'pollo', 'espinacas', 'aceite de oliva'],
    steps: 'Cocina la pasta y saltea el pollo con tomate y espinacas.'
  },
  {
    name: 'Arroz con garbanzos y verduras',
    category: 'Comida',
    ingredients: ['arroz', 'garbanzos', 'pimiento', 'cebolla', 'calabacín'],
    steps: 'Cocina el arroz y añade garbanzos y verduras salteadas.'
  },
  {
    name: 'Quinoa con salmon y ensalada',
    category: 'Cena',
    ingredients: ['quinoa', 'salmón', 'lechuga', 'pepino', 'aguacate'],
    steps: 'Cocina la quinoa y acompaña con salmón y ensalada.'
  },
  {
    name: 'Lentejas con verduras y carne magra',
    category: 'Cena',
    ingredients: ['lentejas', 'carne magra', 'zanahoria', 'apio', 'cebolla'],
    steps: 'Cuece las lentejas y añade carne magra y verduras.'
  },
  {
    name: 'Ensalada de garbanzos con pollo',
    category: 'Comida',
    ingredients: ['garbanzos', 'pollo', 'tomate', 'pepino', 'aceitunas'],
    steps: 'Mezcla todos los ingredientes y aliña con aceite y limón.'
  },
  {
    name: 'Tacos de pavo con quinoa',
    category: 'Cena',
    ingredients: ['pavo', 'quinoa', 'lechuga', 'tomate', 'aguacate'],
    steps: ' Cocina la quinoa y rellena con pavo y verduras.'
  }
];

const defaultState = {
  selectedDate: null,
  weekIndex: 0,
  plan: [],
  recipes: baseRecipes,
  shoppingList: []
};

let state = loadState();

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const plan = buildInitialPlan();
    return { ...defaultState, plan, recipes: baseRecipes.slice(), selectedDate: plan[0]?.date || null };
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      ...defaultState,
      ...parsed,
      plan: parsed.plan?.length ? parsed.plan : buildInitialPlan(),
      recipes: parsed.recipes?.length ? parsed.recipes : baseRecipes.slice(),
      selectedDate: parsed.selectedDate || (parsed.plan?.[0]?.date || null)
    };
  } catch (error) {
    console.error('No se pudo cargar el estado', error);
    const plan = buildInitialPlan();
    return { ...defaultState, plan, recipes: baseRecipes.slice(), selectedDate: plan[0]?.date || null };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
      snack: '',
      lunchRecipe: '',
      lunchMacros: { pasta: 0, arroz: 0, legumbres: 0, quinoa: 0, verdura: 0, carne: 0 },
      dinnerRecipe: '',
      dinnerMacros: { pasta: 0, arroz: 0, legumbres: 0, quinoa: 0, verdura: 0, carne: 0 },
      dessert: '',
      notes: ''
    };
  });
}

function formatDateLabel(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
}

function getEntryByDate(dateString) {
  return state.plan.find((entry) => entry.date === dateString);
}

function getWeekEntries() {
  const start = state.weekIndex * 7;
  return state.plan.slice(start, start + 7);
}

function renderWeekTabs() {
  const container = document.getElementById('weekTabs');
  container.innerHTML = '';

  for (let week = 0; week < 4; week += 1) {
    const btn = document.createElement('button');
    btn.className = `week-btn ${state.weekIndex === week ? 'active' : ''}`;
    btn.textContent = `Semana ${week + 1}`;
    btn.addEventListener('click', () => {
      state.weekIndex = week;
      saveState();
      render();
    });
    container.appendChild(btn);
  }
}

function renderDayGrid() {
  const container = document.getElementById('dayGrid');
  container.innerHTML = '';

  const weekEntries = getWeekEntries();
  weekEntries.forEach((entry) => {
    const card = document.createElement('article');
    card.className = `day-card ${state.selectedDate === entry.date ? 'active' : ''}`;
    card.innerHTML = `
      <h3>${formatDateLabel(entry.date)}</h3>
      <p><strong>Desayuno:</strong> ${entry.breakfast || 'Sin definir'}</p>
      <p><strong>Merienda:</strong> ${entry.snack || 'Sin definir'}</p>
      <p><strong>Comida:</strong> ${entry.lunchRecipe || 'Sin definir'}</p>
      <p><strong>Cena:</strong> ${entry.dinnerRecipe || 'Sin definir'}</p>
    `;
    card.addEventListener('click', () => {
      state.selectedDate = entry.date;
      saveState();
      render();
    });
    container.appendChild(card);
  });
}

function populateForm() {
  const entry = getEntryByDate(state.selectedDate);
  const selectedDateLabel = document.getElementById('selectedDateLabel');
  selectedDateLabel.textContent = entry ? `Editar ${formatDateLabel(entry.date)}` : 'Selecciona un día';

  const breakfastInput = document.getElementById('breakfastInput');
  const snackInput = document.getElementById('snackInput');
  const lunchRecipeInput = document.getElementById('lunchRecipeInput');
  const dinnerRecipeInput = document.getElementById('dinnerRecipeInput');

  breakfastInput.innerHTML = breakfastOptions.map((value) => `<option value="${value}" ${entry?.breakfast === value ? 'selected' : ''}>${value}</option>`).join('');
  snackInput.innerHTML = snackOptions.map((value) => `<option value="${value}" ${entry?.snack === value ? 'selected' : ''}>${value}</option>`).join('');

  const recipeOptions = ['<option value="">Sin receta</option>', ...state.recipes.map((recipe) => `<option value="${recipe.name}" ${entry?.lunchRecipe === recipe.name ? 'selected' : ''}>${recipe.name}</option>`)].join('');
  lunchRecipeInput.innerHTML = recipeOptions;
  dinnerRecipeInput.innerHTML = recipeOptions.replace(/value="(.*?)"/g, (full, value) => {
    if (entry?.dinnerRecipe === value) {
      return `value="${value}" selected`;
    }
    return full;
  });

  document.getElementById('lunchPasta').value = entry?.lunchMacros?.pasta || 0;
  document.getElementById('lunchRice').value = entry?.lunchMacros?.arroz || 0;
  document.getElementById('lunchLegumes').value = entry?.lunchMacros?.legumbres || 0;
  document.getElementById('lunchQuinoa').value = entry?.lunchMacros?.quinoa || 0;
  document.getElementById('lunchVegetables').value = entry?.lunchMacros?.verdura || 0;
  document.getElementById('lunchMeat').value = entry?.lunchMacros?.carne || 0;

  document.getElementById('dinnerPasta').value = entry?.dinnerMacros?.pasta || 0;
  document.getElementById('dinnerRice').value = entry?.dinnerMacros?.arroz || 0;
  document.getElementById('dinnerLegumes').value = entry?.dinnerMacros?.legumbres || 0;
  document.getElementById('dinnerQuinoa').value = entry?.dinnerMacros?.quinoa || 0;
  document.getElementById('dinnerVegetables').value = entry?.dinnerMacros?.verdura || 0;
  document.getElementById('dinnerMeat').value = entry?.dinnerMacros?.carne || 0;

  document.getElementById('dessertInput').value = entry?.dessert || '';
  document.getElementById('notesInput').value = entry?.notes || '';
}

function renderRecipeList() {
  const container = document.getElementById('recipeList');
  container.innerHTML = '';
  state.recipes.forEach((recipe) => {
    const item = document.createElement('div');
    item.className = 'recipe-item';
    item.innerHTML = `
      <strong>${recipe.name}</strong>
      <p>${recipe.category}</p>
      <p><strong>Ingredientes:</strong> ${recipe.ingredients.join(', ')}</p>
      <p>${recipe.steps}</p>
    `;
    container.appendChild(item);
  });
}

function buildShoppingList() {
  const items = new Map();

  state.plan.forEach((entry) => {
    const add = (name, amount = 1) => {
      if (!name) return;
      const normalized = name.trim().toLowerCase();
      items.set(normalized, (items.get(normalized) || 0) + amount);
    };

    if (entry.breakfast) add(entry.breakfast, 1);
    if (entry.snack) add(entry.snack, 1);
    if (entry.dessert) add(entry.dessert, 1);

    if (entry.lunchRecipe) {
      const recipe = state.recipes.find((item) => item.name === entry.lunchRecipe);
      if (recipe) {
        recipe.ingredients.forEach((ingredient) => add(ingredient, 1));
      } else {
        add('verdura', 1);
        add('carne', 1);
      }
    }

    if (entry.dinnerRecipe) {
      const recipe = state.recipes.find((item) => item.name === entry.dinnerRecipe);
      if (recipe) {
        recipe.ingredients.forEach((ingredient) => add(ingredient, 1));
      } else {
        add('verdura', 1);
        add('carne', 1);
      }
    }
  });

  return Array.from(items.entries()).map(([name, cantidad]) => ({ name, cantidad }));
}

function renderShoppingList() {
  const container = document.getElementById('shoppingList');
  const list = buildShoppingList();
  container.innerHTML = '';
  if (!list.length) {
    container.innerHTML = '<p>No hay productos aún.</p>';
    return;
  }

  const fragment = document.createDocumentFragment();
  list.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'shopping-item';
    row.innerHTML = `<strong>${item.name}</strong><span>${item.cantidad} vez/veces en el plan</span>`;
    fragment.appendChild(row);
  });

  container.appendChild(fragment);
}

function generateRecipeIdeas() {
  const activeEntry = getEntryByDate(state.selectedDate);
  const macros = {
    pasta: Number(document.getElementById('lunchPasta').value || 0),
    arroz: Number(document.getElementById('lunchRice').value || 0),
    legumbres: Number(document.getElementById('lunchLegumes').value || 0),
    quinoa: Number(document.getElementById('lunchQuinoa').value || 0),
    verdura: Number(document.getElementById('lunchVegetables').value || 0),
    carne: Number(document.getElementById('lunchMeat').value || 0)
  };

  const ideas = [];
  if (macros.pasta > 0) {
    ideas.push({ title: 'Pasta con tomate y carne magra', description: 'Una opción rápida con tomate, hierbas y proteína.' });
  }
  if (macros.arroz > 0 && macros.legumbres > 0) {
    ideas.push({ title: 'Arroz de garbanzos con verduras', description: 'Ideal si quieres un plato contundente y equilibrado.' });
  }
  if (macros.quinoa > 0 && macros.carne > 0) {
    ideas.push({ title: 'Quinoa bowl con pollo o pavo', description: 'Perfecta para una cena ligera y rica en proteínas.' });
  }
  if (macros.verdura > 0 && macros.legumbres > 0) {
    ideas.push({ title: 'Lentejas o garbanzos con ensalada', description: 'Muy buena para un menú saludable y fácil de repetir.' });
  }
  if (!ideas.length) {
    ideas.push({ title: 'Ensalada de quinoa con aguacate', description: 'Muy adaptada si todavía no tienes una base definida.' });
    ideas.push({ title: 'Pasta con verduras y yogur griego', description: 'Plato energizante y simple.' });
  }

  const container = document.getElementById('aiSuggestions');
  container.innerHTML = '';
  ideas.slice(0, 3).forEach((idea) => {
    const item = document.createElement('div');
    item.className = 'suggestion-item';
    item.innerHTML = `
      <strong>${idea.title}</strong>
      <p>${idea.description}</p>
      <button class="apply-btn" type="button">Aplicar</button>
    `;
    item.querySelector('button').addEventListener('click', () => {
      if (!activeEntry) return;
      const recipeName = idea.title;
      document.getElementById('lunchRecipeInput').value = recipeName;
      document.getElementById('notesInput').value = `Idea sugerida: ${recipeName}`;
      activeEntry.lunchRecipe = recipeName;
      activeEntry.notes = `Idea sugerida: ${recipeName}`;
      saveState();
      render();
    });
    container.appendChild(item);
  });
}

function bindEvents() {
  document.getElementById('dayForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const entry = getEntryByDate(state.selectedDate);
    if (!entry) return;

    entry.breakfast = document.getElementById('breakfastInput').value;
    entry.snack = document.getElementById('snackInput').value;
    entry.lunchRecipe = document.getElementById('lunchRecipeInput').value;
    entry.dinnerRecipe = document.getElementById('dinnerRecipeInput').value;
    entry.lunchMacros = {
      pasta: Number(document.getElementById('lunchPasta').value || 0),
      arroz: Number(document.getElementById('lunchRice').value || 0),
      legumbres: Number(document.getElementById('lunchLegumes').value || 0),
      quinoa: Number(document.getElementById('lunchQuinoa').value || 0),
      verdura: Number(document.getElementById('lunchVegetables').value || 0),
      carne: Number(document.getElementById('lunchMeat').value || 0)
    };
    entry.dinnerMacros = {
      pasta: Number(document.getElementById('dinnerPasta').value || 0),
      arroz: Number(document.getElementById('dinnerRice').value || 0),
      legumbres: Number(document.getElementById('dinnerLegumes').value || 0),
      quinoa: Number(document.getElementById('dinnerQuinoa').value || 0),
      verdura: Number(document.getElementById('dinnerVegetables').value || 0),
      carne: Number(document.getElementById('dinnerMeat').value || 0)
    };
    entry.dessert = document.getElementById('dessertInput').value;
    entry.notes = document.getElementById('notesInput').value;

    saveState();
    render();
  });

  document.getElementById('recipeForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const newRecipe = {
      name: document.getElementById('recipeName').value.trim(),
      category: document.getElementById('recipeCategory').value.trim(),
      ingredients: document.getElementById('recipeIngredients').value.split(',').map((item) => item.trim()).filter(Boolean),
      steps: document.getElementById('recipeSteps').value.trim()
    };

    if (!newRecipe.name || !newRecipe.category || !newRecipe.ingredients.length || !newRecipe.steps) return;

    state.recipes.unshift(newRecipe);
    state.recipes = state.recipes.slice(0, 8);
    saveState();
    render();
    event.target.reset();
  });

  document.getElementById('generateIdeasBtn').addEventListener('click', generateRecipeIdeas);

  document.getElementById('resetBtn').addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    state = loadState();
    render();
  });
}

function render() {
  renderWeekTabs();
  renderDayGrid();
  populateForm();
  renderRecipeList();
  renderShoppingList();
}

function init() {
  if (!state.selectedDate && state.plan.length) {
    state.selectedDate = state.plan[0].date;
  }
  bindEvents();
  render();
}

init();
