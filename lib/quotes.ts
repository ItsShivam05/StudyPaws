// Short, original encouragements (no attribution needed).
export const QUOTES = [
  "Small steps still move you forward.",
  "You don't have to finish today. You just have to begin.",
  "Slow progress is still progress.",
  "One page at a time is how books get read.",
  "Rest is part of the work, not a break from it.",
  "Be gentle with yourself — you're learning.",
  "Focus on the next twenty-five minutes. That's all.",
  "Tiny habits, repeated kindly, become big changes.",
  "The rain doesn't hurry, and it still fills rivers.",
  "Your future self is quietly cheering for you.",
  "It's okay to go slowly. Just keep going.",
  "Curiosity first, perfection later.",
  "A calm mind learns faster than a rushed one.",
  "Show up, sit down, start small.",
  "Every expert was once a beginner with a cup of tea.",
  "Today's effort is tomorrow's ease.",
  "You've done hard things before. This is one more.",
  "Clear desk, soft light, one task.",
  "Progress, not pressure.",
  "Breathe in, focus, breathe out, continue.",
  "The best time to start was earlier. The next best is now.",
  "Little by little, a little becomes a lot.",
  "Make it simple, then make it happen.",
  "You are allowed to be both a work in progress and proud.",
  "Even the moon takes it one phase at a time.",
  "Stay with the question a little longer.",
  "Quiet consistency beats loud intensity.",
  "The page is patient. So can you be.",
  "A cozy space makes room for big thoughts.",
  "Finish the sentence, then the paragraph, then the day.",
];

export function quoteOfTheDay(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0).getTime();
  const day = Math.floor((date.getTime() - start) / 86400000);
  return QUOTES[(day + date.getFullYear()) % QUOTES.length];
}
