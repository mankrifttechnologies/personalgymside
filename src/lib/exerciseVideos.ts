// Curated YouTube video IDs for common exercises (form tutorials)
// Falls back to a YouTube search link when no mapping exists.
const VIDEO_MAP: Record<string, string> = {
  // Chest
  'bench press': 'rT7DgCr-3pg',
  'incline press': 'SrqOu55lrYU',
  'incline bench press': 'SrqOu55lrYU',
  'dumbbell flyes': 'eozdVDA78K0',
  'dumbbell fly': 'eozdVDA78K0',
  'push-ups': 'IODxDxX7oi4',
  'push ups': 'IODxDxX7oi4',
  'pushups': 'IODxDxX7oi4',
  'cable crossover': 'taI4XduLpTk',
  'decline press': 'LfyQBUKR8SE',
  'chest press': 'gRVjAtPip0Y',
  // Back
  'lat pulldown': 'CAwf7n6Luuc',
  'barbell row': 'kBWAon7ItDw',
  'bent over row': 'kBWAon7ItDw',
  'deadlift': 'op9kVnSso6Q',
  'pull-ups': 'eGo4IYlbE5g',
  'pull ups': 'eGo4IYlbE5g',
  'pullups': 'eGo4IYlbE5g',
  'cable row': 'GZbfZ033f74',
  'seated row': 'GZbfZ033f74',
  't-bar row': 'j3Igk5nyZE4',
  // Shoulders
  'overhead press': '2yjwXTZQDDI',
  'military press': '2yjwXTZQDDI',
  'shoulder press': 'qEwKCR5JCog',
  'lateral raises': '3VcKaXpzqRo',
  'lateral raise': '3VcKaXpzqRo',
  'front raises': '-t7fuZ0KhDA',
  'rear delt flyes': 'EA7u4Q_8HQ0',
  'arnold press': '6Z15_WdXmVw',
  'shrugs': 'cJRVVxmytaM',
  // Biceps
  'barbell curl': 'kwG2ipFRgfo',
  'dumbbell curl': 'ykJmrZ5v0Oo',
  'hammer curl': 'zC3nLlEvin4',
  'preacher curl': 'fIWP-FRFNU0',
  'cable curl': '85ZX_yvHa8M',
  'concentration curl': 'Jvj2wV0vOYU',
  // Triceps
  'tricep pushdown': '2-LAMcpzODU',
  'triceps pushdown': '2-LAMcpzODU',
  'skull crushers': 'd_KZxkY_0cM',
  'dips': '6kALZikXxLc',
  'tricep dips': '6kALZikXxLc',
  'close grip bench': 'nEF0bv2FW94',
  'overhead extension': '_gsUck-7M74',
  'tricep kickbacks': 'ZpFRrcfHfZ8',
  'kickbacks': 'ZpFRrcfHfZ8',
  // Legs
  'squats': 'aclHkVaku9U',
  'squat': 'aclHkVaku9U',
  'back squat': 'aclHkVaku9U',
  'front squat': 'tlfahNdNPPI',
  'leg press': 'IZxyjW7MPJQ',
  'lunges': 'QOVaHwm-Q6U',
  'lunge': 'QOVaHwm-Q6U',
  'leg curl': '1Tq3QdYUuHs',
  'leg extension': 'YyvSfVjQeL0',
  'calf raises': '-M4-G8p8fmc',
  'romanian deadlift': 'JCXUYuzwNrM',
  'rdl': 'JCXUYuzwNrM',
  'hip thrust': 'xDmFkJxPzeM',
  // Abs
  'crunches': 'Xyd_fa5zoEU',
  'crunch': 'Xyd_fa5zoEU',
  'plank': 'pSHjTRCQxIw',
  'leg raises': 'JB2oyawG9KI',
  'leg raise': 'JB2oyawG9KI',
  'russian twists': 'wkD8rjkodUI',
  'cable crunch': '2fbujeH3F58',
  'ab wheel': 'Y4ymrkihXew',
  'mountain climbers': 'nmwgirgXLYM',
  'burpees': 'TU8QYVW0gDU',
};

function normalize(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9 -]/g, '');
}

export function getExerciseVideoId(exerciseName: string): string | null {
  const key = normalize(exerciseName);
  if (VIDEO_MAP[key]) return VIDEO_MAP[key];
  // Try removing trailing/leading words
  for (const mapKey of Object.keys(VIDEO_MAP)) {
    if (key.includes(mapKey) || mapKey.includes(key)) {
      return VIDEO_MAP[mapKey];
    }
  }
  return null;
}

export function getYouTubeSearchUrl(exerciseName: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(
    exerciseName + ' proper form tutorial'
  )}`;
}
