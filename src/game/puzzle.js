export function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

export function getDailyPuzzle(puzzles, dateStr = null) {
  const date = dateStr ?? getTodayDateString();
  const seed = [...date].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return puzzles[seed % puzzles.length];
}
