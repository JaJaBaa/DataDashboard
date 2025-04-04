import { useState, useEffect } from "react";
import "./App.css";

function App() {
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

  if (loading) return <div className="loading">Loading recipes...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="dashboard">
      <header>
        <h1>Spoonacular Recipe Dashboard</h1>
      </header>

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
            {cuisineOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="recipes-container">
        {filteredRecipes.length > 0 ? (
          filteredRecipes.map((recipe) => (
            <div key={recipe.id} className="recipe-card">
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
          ))
        ) : (
          <p className="no-results">No recipes found matching your criteria.</p>
        )}
      </div>
    </div>
  );
}

export default App;
