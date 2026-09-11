function calculateOverallRating(ratings) {
  const keys = ['water', 'electricity', 'sanitation', 'security', 'maintenance'];
  return Number((keys.reduce((sum, key) => sum + ratings[key], 0) / keys.length).toFixed(1));
}

module.exports = { calculateOverallRating };
