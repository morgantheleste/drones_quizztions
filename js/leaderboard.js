const STORAGE_KEY = 'quiz_leaderboard';

export function getLeaderboard() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  try {
    const arr = JSON.parse(data);
    return arr.sort((a, b) => b.score - a.score);
  } catch (e) {
    return [];
  }
}

export function addEntry(name, score, questionsAnswered) {
  const entries = getLeaderboard();
  entries.push({
    name,
    score,
    questionsAnswered,
    date: new Date().toISOString()
  });
  entries.sort((a, b) => b.score - a.score);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function clearLeaderboard() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getTopN(n) {
  return getLeaderboard().slice(0, n);
}

export function getRankEmoji(rank) {
  return `${rank}`;
}
