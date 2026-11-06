export function calculateScore(difficulty, timeLimit, elapsed, isCorrect) {
  if (!isCorrect) return 0;
  
  const basePoints = difficulty * 100;
  const timeBonus = Math.max(0, (timeLimit - elapsed) / timeLimit);
  return Math.round(basePoints * (0.5 + 0.5 * timeBonus));
}

export function getDifficultyLabel(difficulty) {
  switch (difficulty) {
    case 1: return 'Easy';
    case 2: return 'Medium';
    case 3: return 'Hard';
    default: return 'Unknown';
  }
}

export function getDifficultyColor(difficulty) {
  switch (difficulty) {
    case 1: return '#4caf50';
    case 2: return '#ff9800';
    case 3: return '#f44336';
    default: return '#9e9e9e';
  }
}
