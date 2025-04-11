import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useParams } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/recipe/:id" element={<RecipeDetail />} />
      </Routes>
    </Router>
  );
}

function Dashboard() {
  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [stats, setStats] = useState({
    totalRecipes: 0,
    averageReadyTime: 0,
    dietTypes: {},
  });

  // Replace with your actual API key
  const API_KEY = import.meta.env.VITE_SPOONACULAR_API_KEY;

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `https://api.spoonacular.com/recipes/complexSearch?apiKey=${API_KEY}&number=20&addRecipeInformation=true`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch recipes");
        }

        const data = await response.json();
        setRecipes(data.results);
        setFilteredRecipes(data.results);
        calculateStats(data.results);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, []);

  useEffect(() => {
    filterRecipes();
  }, [searchQuery, cuisine, recipes]);

  const filterRecipes = () => {
    let filtered = [...recipes];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((recipe) =>
        recipe.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by cuisine
    if (cuisine) {
      filtered = filtered.filter(
        (recipe) =>
          recipe.cuisines &&
          recipe.cuisines.some((c) => c.toLowerCase() === cuisine.toLowerCase())
      );
    }

    setFilteredRecipes(filtered);
  };

  const calculateStats = (recipeData) => {
    const totalRecipes = recipeData.length;

    // Calculate average ready time
    const totalReadyTime = recipeData.reduce(
      (sum, recipe) => sum + (recipe.readyInMinutes || 0),
      0
    );
    const averageReadyTime = Math.round(totalReadyTime / totalRecipes);

    // Count diet types
    const dietTypes = {};
    recipeData.forEach((recipe) => {
      if (recipe.diets && recipe.diets.length > 0) {
        recipe.diets.forEach((diet) => {
          dietTypes[diet] = (dietTypes[diet] || 0) + 1;
        });
      }
    });

    setStats({
      totalRecipes,
      averageReadyTime,
      dietTypes,
    });
  };

  // Available cuisines for filtering
  const cuisineOptions = [
    "Italian",
    "Mexican",
    "Asian",
    "American",
    "Mediterranean",
    "Indian",
    "French",
    "Thai",
    "Japanese",
    "Chinese",
  ];

  // Prepare data for charts
  const prepareChartData = () => {
    // Diet type distribution for pie chart
    const dietChartData = Object.entries(stats.dietTypes).map(([name, value]) => ({
      name,
      value,
    }));

    // Cooking time data for bar chart
    const cookingTimeData = [];
    const timeRanges = {
      "0-15 mins": 0,
      "16-30 mins": 0,
      "31-45 mins": 0,
      "46-60 mins": 0,
      "60+ mins": 0,
    };

    recipes.forEach((recipe) => {
      const time = recipe.readyInMinutes || 0;
      if (time <= 15) {
        timeRanges["0-15 mins"]++;
      } else if (time <= 30) {
        timeRanges["16-30 mins"]++;
      } else if (time <= 45) {
        timeRanges["31-45 mins"]++;
      } else if (time <= 60) {
        timeRanges["46-60 mins"]++;
      } else {
        timeRanges["60+ mins"]++;
      }
    });

    Object.entries(timeRanges).forEach(([range, count]) => {
      cookingTimeData.push({ name: range, count });
    });

    return {
      dietChartData,
      cookingTimeData,
    };
  };

  const { dietChartData, cookingTimeData } = recipes.length ? prepareChartData() : { dietChartData: [], cookingTimeData: [] };

  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

  if (loading) return <div className="loading">Loading recipes...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="dashboard">
      <Sidebar stats={stats} searchQuery={searchQuery} setSearchQuery={setSearchQuery} cuisine={cuisine} setCuisine={setCuisine} cuisineOptions={cuisineOptions} />

      <div className="main-content">
        <header>
          <h1>Spoonacular Recipe Dashboard</h1>
        </header>

        <div className="charts-container">
          <div className="chart-card">
            <h3>Recipe Cooking Time Distribution</h3>
            <BarChart width={500} height={300} data={cookingTimeData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
              <YAxis />
              <Tooltip />
              <Legend wrapperStyle={{ bottom: 0, left: 25 }} verticalAlign="bottom" height={36} />
              <Bar dataKey="count" fill="#e67e22" name="Number of Recipes" />
            </BarChart>
          </div>

          <div className="chart-card">
            <h3>Diet Types Distribution</h3>
            <PieChart width={500} height={300}>
              <Pie
                data={dietChartData}
                cx={200}
                cy={150}
                labelLine={true}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {dietChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </div>
        </div>

        <div className="recipes-container">
          {filteredRecipes.length > 0 ? (
            filteredRecipes.map((recipe) => (
              <Link to={`/recipe/${recipe.id}`} className="recipe-link" key={recipe.id}>
                <div className="recipe-card">
                  <img
                    src={recipe.image}
                    alt={recipe.title}
                    className="recipe-image"
                  />
                  <div className="recipe-info">
                    <h3>{recipe.title}</h3>
                    <p>Ready in: {recipe.readyInMinutes || "N/A"} minutes</p>
                    {recipe.cuisines && recipe.cuisines.length > 0 && (
                      <p>Cuisines: {recipe.cuisines.join(", ")}</p>
                    )}
                    {recipe.diets && recipe.diets.length > 0 && (
                      <p>Diets: {recipe.diets.join(", ")}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <p className="no-results">No recipes found matching your criteria.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function RecipeDetail() {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalRecipes: 0,
    averageReadyTime: 0,
    dietTypes: {},
  });

  // Replace with your actual API key
  const API_KEY = import.meta.env.VITE_SPOONACULAR_API_KEY;

  useEffect(() => {
    const fetchRecipeDetail = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `https://api.spoonacular.com/recipes/${id}/information?apiKey=${API_KEY}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch recipe details");
        }

        const data = await response.json();
        setRecipe(data);
        
        // Fetch a few recipes to populate the sidebar stats
        const recipesResponse = await fetch(
          `https://api.spoonacular.com/recipes/complexSearch?apiKey=${API_KEY}&number=5&addRecipeInformation=true`
        );
        
        if (!recipesResponse.ok) {
          throw new Error("Failed to fetch recipes for sidebar");
        }
        
        const recipesData = await recipesResponse.json();
        calculateStats(recipesData.results);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipeDetail();
  }, [id]);

  const calculateStats = (recipeData) => {
    const totalRecipes = recipeData.length;

    // Calculate average ready time
    const totalReadyTime = recipeData.reduce(
      (sum, recipe) => sum + (recipe.readyInMinutes || 0),
      0
    );
    const averageReadyTime = Math.round(totalReadyTime / totalRecipes);

    // Count diet types
    const dietTypes = {};
    recipeData.forEach((recipe) => {
      if (recipe.diets && recipe.diets.length > 0) {
        recipe.diets.forEach((diet) => {
          dietTypes[diet] = (dietTypes[diet] || 0) + 1;
        });
      }
    });

    setStats({
      totalRecipes,
      averageReadyTime,
      dietTypes,
    });
  };

  if (loading) return <div className="loading">Loading recipe details...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!recipe) return <div className="error">Recipe not found</div>;

  return (
    <div className="dashboard">
      <Sidebar stats={stats} />

      <div className="main-content">
        <header>
          <h1>Recipe Details</h1>
          <Link to="/" className="back-link">Back to Dashboard</Link>
        </header>

        <div className="recipe-detail">
          <div className="recipe-detail-header">
            <img src={recipe.image} alt={recipe.title} className="detail-image" />
            <div className="detail-header-info">
              <h2>{recipe.title}</h2>
              <div className="recipe-badges">
                {recipe.vegetarian && <span className="badge vegetarian">Vegetarian</span>}
                {recipe.vegan && <span className="badge vegan">Vegan</span>}
                {recipe.glutenFree && <span className="badge gluten-free">Gluten Free</span>}
                {recipe.dairyFree && <span className="badge dairy-free">Dairy Free</span>}
              </div>
              <p><strong>Ready in:</strong> {recipe.readyInMinutes} minutes</p>
              <p><strong>Servings:</strong> {recipe.servings}</p>
              <p><strong>Health Score:</strong> {recipe.healthScore}</p>
              {recipe.cuisines && recipe.cuisines.length > 0 && (
                <p><strong>Cuisines:</strong> {recipe.cuisines.join(", ")}</p>
              )}
              {recipe.diets && recipe.diets.length > 0 && (
                <p><strong>Diets:</strong> {recipe.diets.join(", ")}</p>
              )}
              {recipe.dishTypes && recipe.dishTypes.length > 0 && (
                <p><strong>Dish Types:</strong> {recipe.dishTypes.join(", ")}</p>
              )}
            </div>
          </div>

          <div className="recipe-summary">
            <h3>Summary</h3>
            <div dangerouslySetInnerHTML={{ __html: recipe.summary }} />
          </div>

          <div className="recipe-ingredients">
            <h3>Ingredients</h3>
            <ul>
              {recipe.extendedIngredients.map((ingredient) => (
                <li key={ingredient.id}>
                  {ingredient.original}
                </li>
              ))}
            </ul>
          </div>

          <div className="recipe-instructions">
            <h3>Instructions</h3>
            {recipe.instructions ? (
              <div dangerouslySetInnerHTML={{ __html: recipe.instructions }} />
            ) : (
              <p>No instructions available for this recipe.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ stats, searchQuery, setSearchQuery, cuisine, setCuisine, cuisineOptions }) {
  // Available cuisines for filtering
  const defaultCuisineOptions = [
    "Italian",
    "Mexican",
    "Asian",
    "American",
    "Mediterranean",
    "Indian",
    "French",
    "Thai",
    "Japanese",
    "Chinese",
  ];

  const options = cuisineOptions || defaultCuisineOptions;

  return (
    <div className="sidebar">
      <div className="stats-container">
        <div className="stat-card">
          <h3>Total Recipes</h3>
          <p>{stats.totalRecipes}</p>
        </div>
        <div className="stat-card">
          <h3>Avg. Cooking Time</h3>
          <p>{stats.averageReadyTime} minutes</p>
        </div>
        <div className="stat-card">
          <h3>Most Common Diet</h3>
          <p>
            {Object.entries(stats.dietTypes).sort(
              (a, b) => b[1] - a[1]
            )[0]?.[0] || "None"}
          </p>
        </div>
      </div>

      {setSearchQuery && setCuisine && (
        <div className="filters">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="cuisine-filter">
            <label htmlFor="cuisine-select">Filter by Cuisine:</label>
            <select
              id="cuisine-select"
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
            >
              <option value="">All Cuisines</option>
              {options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
