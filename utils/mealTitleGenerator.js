// Utility functions for generating elegant meal titles from multiple foods

export const generateElegantMealTitle = (foods) => {
  if (!foods || foods.length === 0) return 'Mixed Meal';
  if (foods.length === 1) return foods[0].name;

  // Categorize foods
  const categories = {
    proteins: [],
    carbs: [],
    vegetables: [],
    fruits: [],
    dairy: [],
    sauces: [],
    others: []
  };

  foods.forEach(food => {
    const name = food.name.toLowerCase();
    
    if (isProtein(name)) {
      categories.proteins.push(food.name);
    } else if (isCarb(name)) {
      categories.carbs.push(food.name);
    } else if (isVegetable(name)) {
      categories.vegetables.push(food.name);
    } else if (isFruit(name)) {
      categories.fruits.push(food.name);
    } else if (isDairy(name)) {
      categories.dairy.push(food.name);
    } else if (isSauce(name)) {
      categories.sauces.push(food.name);
    } else {
      categories.others.push(food.name);
    }
  });

  // Generate title based on main components
  const mainComponents = [];
  
  if (categories.proteins.length > 0) {
    if (categories.proteins.length === 1) {
      mainComponents.push(categories.proteins[0]);
    } else {
      mainComponents.push(`${categories.proteins[0]} & ${categories.proteins.length - 1} more protein${categories.proteins.length > 2 ? 's' : ''}`);
    }
  }

  if (categories.carbs.length > 0) {
    if (categories.carbs.length === 1) {
      mainComponents.push(categories.carbs[0]);
    } else {
      mainComponents.push(`${categories.carbs[0]} & sides`);
    }
  }

  // Special combinations
  if (categories.proteins.length > 0 && categories.carbs.length > 0) {
    const protein = categories.proteins[0];
    const carb = categories.carbs[0];
    
    // Check for common meal patterns
    if (containsAny(protein, ['beef', 'bulgogi']) && containsAny(carb, ['rice'])) {
      return `Bulgogi Bowl ${getAdditionalItemsText(foods.length - 2)}`;
    }
    if (containsAny(protein, ['chicken']) && containsAny(carb, ['rice'])) {
      return `Chicken Rice Bowl ${getAdditionalItemsText(foods.length - 2)}`;
    }
    if (containsAny(protein, ['egg']) && containsAny(carb, ['rice'])) {
      return `Egg Rice Bowl ${getAdditionalItemsText(foods.length - 2)}`;
    }
    if (containsAny(protein, ['salmon', 'fish']) && containsAny(carb, ['rice'])) {
      return `Salmon Rice Bowl ${getAdditionalItemsText(foods.length - 2)}`;
    }
  }

  // Fallback to generic patterns
  if (mainComponents.length >= 2) {
    return `${mainComponents[0]} with ${mainComponents[1]} ${getAdditionalItemsText(foods.length - 2)}`;
  } else if (mainComponents.length === 1) {
    return `${mainComponents[0]} ${getAdditionalItemsText(foods.length - 1)}`;
  }

  // Ultimate fallback
  return `Mixed Meal (${foods.length} items)`;
};

export const generateCompactFoodsList = (foods) => {
  if (!foods || foods.length === 0) return '';
  if (foods.length === 1) return foods[0].name;
  
  const names = foods.map(food => food.name);
  if (names.length <= 3) {
    return names.join(' • ');
  }
  
  return `${names.slice(0, 2).join(' • ')} • +${names.length - 2} more`;
};

// Helper functions
const isProtein = (name) => {
  const proteins = ['beef', 'chicken', 'pork', 'fish', 'salmon', 'tuna', 'egg', 'tofu', 'turkey', 'lamb', 'shrimp', 'bulgogi'];
  return proteins.some(protein => name.includes(protein));
};

const isCarb = (name) => {
  const carbs = ['rice', 'bread', 'pasta', 'noodle', 'potato', 'quinoa', 'oats', 'cereal', 'tortilla'];
  return carbs.some(carb => name.includes(carb));
};

const isVegetable = (name) => {
  const vegetables = ['broccoli', 'carrot', 'spinach', 'lettuce', 'tomato', 'cucumber', 'onion', 'pepper', 'radish', 'cabbage', 'basil', 'cilantro'];
  return vegetables.some(veg => name.includes(veg));
};

const isFruit = (name) => {
  const fruits = ['apple', 'banana', 'orange', 'berry', 'grape', 'melon', 'pineapple', 'mango', 'avocado'];
  return fruits.some(fruit => name.includes(fruit));
};

const isDairy = (name) => {
  const dairy = ['milk', 'cheese', 'yogurt', 'cream', 'butter'];
  return dairy.some(d => name.includes(d));
};

const isSauce = (name) => {
  const sauces = ['sauce', 'dressing', 'oil', 'vinegar', 'mayo', 'ketchup', 'mustard', 'soy sauce', 'sesame'];
  return sauces.some(sauce => name.includes(sauce));
};

const containsAny = (text, keywords) => {
  return keywords.some(keyword => text.toLowerCase().includes(keyword));
};

const getAdditionalItemsText = (count) => {
  if (count <= 0) return '';
  if (count === 1) return '(+1 more)';
  return `(+${count} more)`;
};
