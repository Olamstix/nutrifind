# NutriFind 🥗
**Recipe Finder & Nutrition Tracker** — WDD 330 Final Project

## Setup Instructions

### 1. Install Node.js
Download from https://nodejs.org (LTS version)

### 2. Open your terminal / command prompt
Navigate to this project folder:
```
cd path/to/nutrifind
```

### 3. Add your API keys
Open the `.env` file in the project root and replace the placeholder values:
```
VITE_RECIPE_APP_ID=your_actual_recipe_app_id
VITE_RECIPE_APP_KEY=your_actual_recipe_app_key
VITE_NUTRITION_APP_ID=your_actual_nutrition_app_id
VITE_NUTRITION_APP_KEY=your_actual_nutrition_app_key
```

### 4. Install dependencies
```
npm install
```

### 5. Run the app
```
npm run dev
```

Open your browser to http://localhost:3000

---

## Features (Weeks 5 & 6)
- Recipe search with live results from Edamam API
- Dietary filters (vegan, gluten-free, keto, etc.)
- Full nutrition breakdown per recipe
- Serving size adjuster (recalculates all values)
- Save/favorite recipes (localStorage)
- Daily meal log with macro progress bars
- Custom daily nutrition targets
- Search history chips (sessionStorage)

## APIs Used
- [Edamam Recipe Search API](https://developer.edamam.com/edamam-recipe-api)
- [Edamam Nutrition Analysis API](https://developer.edamam.com/edamam-nutrition-api)
