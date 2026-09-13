import { DailyChallengeItem, DailyTipItem, Joke } from "../types";
import { FUN_JOKES } from "./funZoneData";
import { EXPANDED_CHALLENGES } from "./dailyChallengesData";
import { EXPANDED_JOKES } from "./dailyJokesData";
import { EXPANDED_TIPS } from "./dailyTipsData";

// ==========================================
// 1. QUICK CHALLENGES (MASSIVE RESOURCE POOL)
// Covering Math, Science, English, Logic, General Knowledge, Geography, Technology, Patterns
// ==========================================
const BASE_CHALLENGES: DailyChallengeItem[] = [
  // Math & Patterns
  {
    id: "dc-m-1",
    category: "Math",
    question: "If a train travels at 60 mph for 2.5 hours, how far does it travel?",
    options: ["120 miles", "150 miles", "160 miles", "180 miles"],
    correctIndex: 1,
    explanation: "Distance = Speed × Time: 60 × 2.5 = 150 miles.",
  },
  {
    id: "dc-m-2",
    category: "Patterns",
    question: "What comes next in the sequence: 3, 6, 12, 24, __?",
    options: ["36", "48", "30", "52"],
    correctIndex: 1,
    explanation: "Each number is multiplied by 2: 24 × 2 = 48.",
  },
  {
    id: "dc-m-3",
    category: "Math",
    question: "What is 15% of 80?",
    options: ["10", "12", "14", "15"],
    correctIndex: 1,
    explanation: "10% of 80 is 8, 5% is 4. 8 + 4 = 12.",
  },
  {
    id: "dc-m-4",
    category: "Math",
    question: "What is the square root of 144?",
    options: ["11", "12", "13", "14"],
    correctIndex: 1,
    explanation: "12 × 12 = 144.",
  },
  {
    id: "dc-m-5",
    category: "Patterns",
    question: "Which number fits: 2, 5, 10, 17, 26, __?",
    options: ["35", "37", "39", "41"],
    correctIndex: 1,
    explanation: "The differences are consecutive odd numbers: +3, +5, +7, +9, so next is +11 (26 + 11 = 37).",
  },
  {
    id: "dc-m-6",
    category: "Math",
    question: "If 3x + 7 = 22, what is the value of x?",
    options: ["3", "5", "7", "9"],
    correctIndex: 1,
    explanation: "Subtract 7 from both sides: 3x = 15. Divide by 3: x = 5.",
  },
  {
    id: "dc-m-7",
    category: "Math",
    question: "How many degrees are in the angles of an equilateral triangle?",
    options: ["45° each", "60° each", "90° each", "120° each"],
    correctIndex: 1,
    explanation: "A triangle totals 180°. For equilateral, 180° ÷ 3 = 60° each.",
  },
  {
    id: "dc-m-8",
    category: "Math",
    question: "A pizza has 8 slices. If you eat 3/4 of the pizza, how many slices did you eat?",
    options: ["4", "5", "6", "7"],
    correctIndex: 2,
    explanation: "8 × (3/4) = 6 slices.",
  },
  {
    id: "dc-m-9",
    category: "Logic",
    question: "If five cats can catch five mice in five minutes, how many cats are needed to catch 100 mice in 100 minutes?",
    options: ["100 cats", "25 cats", "5 cats", "20 cats"],
    correctIndex: 2,
    explanation: "1 cat catches 1 mouse every 5 minutes. In 100 minutes, 1 cat catches 20 mice. So 5 cats catch 100 mice!",
  },
  {
    id: "dc-m-10",
    category: "Math",
    question: "What is the perimeter of a rectangle with length 9 cm and width 4 cm?",
    options: ["24 cm", "26 cm", "36 cm", "13 cm"],
    correctIndex: 1,
    explanation: "Perimeter = 2 × (Length + Width) = 2 × (9 + 4) = 2 × 13 = 26 cm.",
  },

  // Science & Nature
  {
    id: "dc-s-1",
    category: "Science",
    question: "What gas do plants absorb from the air during photosynthesis?",
    options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Helium"],
    correctIndex: 1,
    explanation: "Plants absorb carbon dioxide (CO2) and release oxygen (O2) in photosynthesis.",
  },
  {
    id: "dc-s-2",
    category: "Science",
    question: "What is the hardest known natural mineral on Earth?",
    options: ["Gold", "Quartz", "Diamond", "Titanium"],
    correctIndex: 2,
    explanation: "Diamond scores 10 on the Mohs hardness scale, making it the hardest natural mineral.",
  },
  {
    id: "dc-s-3",
    category: "Science",
    question: "Which organ in the human body consumes about 20% of its total energy?",
    options: ["Heart", "Liver", "Brain", "Lungs"],
    correctIndex: 2,
    explanation: "The human brain uses approximately 20% of the body's resting metabolic energy.",
  },
  {
    id: "dc-s-4",
    category: "Science",
    question: "What force keeps the planets orbiting around the Sun?",
    options: ["Magnetism", "Gravity", "Friction", "Centrifugal force"],
    correctIndex: 1,
    explanation: "The Sun's gravitational pull keeps planets safely locked in their planetary orbits.",
  },
  {
    id: "dc-s-5",
    category: "Science",
    question: "At what temperature does pure water freeze at standard atmospheric pressure?",
    options: ["0°C (32°F)", "10°C (50°F)", "-5°C (23°F)", "100°C (212°F)"],
    correctIndex: 0,
    explanation: "Pure water freezes into solid ice at 0 degrees Celsius (32 degrees Fahrenheit).",
  },
  {
    id: "dc-s-6",
    category: "Science",
    question: "What is the center of an atom called?",
    options: ["Electron", "Nucleus", "Photon", "Neutron"],
    correctIndex: 1,
    explanation: "The nucleus is the dense central core of an atom containing protons and neutrons.",
  },
  {
    id: "dc-s-7",
    category: "Science",
    question: "Which celestial body causes the ocean tides on Earth?",
    options: ["The Sun", "The Moon", "Mars", "Jupiter"],
    correctIndex: 1,
    explanation: "The gravitational pull of the Moon is the primary driver of Earth's ocean tides.",
  },
  {
    id: "dc-s-8",
    category: "Science",
    question: "What is the powerhouse organelle of the biological cell?",
    options: ["Ribosome", "Mitochondria", "Golgi apparatus", "Vacuole"],
    correctIndex: 1,
    explanation: "Mitochondria generate most of the chemical energy needed by the cell (ATP).",
  },

  // English & Vocabulary
  {
    id: "dc-e-1",
    category: "English",
    question: "Which of the following words is a synonym for 'resilient'?",
    options: ["Fragile", "Adaptable", "Tired", "Careless"],
    correctIndex: 1,
    explanation: "'Resilient' describes the ability to withstand, bounce back, and adapt to challenges.",
  },
  {
    id: "dc-e-2",
    category: "English",
    question: "What literary device is used in the phrase: 'The wind whispered through the trees'?",
    options: ["Hyperbole", "Personification", "Simile", "Irony"],
    correctIndex: 1,
    explanation: "Personification gives human characteristics (whispering) to non-human things (the wind).",
  },
  {
    id: "dc-e-3",
    category: "English",
    question: "Identify the antonym of the word 'scarce':",
    options: ["Abundant", "Rare", "Sparse", "Quiet"],
    correctIndex: 0,
    explanation: "Scarce means in short supply; abundant means existing in large quantities.",
  },
  {
    id: "dc-e-4",
    category: "English",
    question: "Which part of speech connects words, phrases, or clauses (such as 'and', 'but', 'or')?",
    options: ["Preposition", "Conjunction", "Adverb", "Interjection"],
    correctIndex: 1,
    explanation: "Conjunctions (like and, because, but, or) connect words or clauses together.",
  },
  {
    id: "dc-e-5",
    category: "English",
    question: "Choose the correct spelling:",
    options: ["Accomodate", "Acommodate", "Accommodate", "Acomodate"],
    correctIndex: 2,
    explanation: "'Accommodate' has double 'c' and double 'm'.",
  },

  // Technology & Computing
  {
    id: "dc-t-1",
    category: "Technology",
    question: "What does 'CPU' stand for in computer hardware?",
    options: ["Central Processing Unit", "Computer Power Utility", "Core Program Unit", "Central Power User"],
    correctIndex: 0,
    explanation: "CPU stands for Central Processing Unit, the primary hardware chip executing instructions.",
  },
  {
    id: "dc-t-2",
    category: "Technology",
    question: "In binary code, what two digits are used to represent all data?",
    options: ["1 and 2", "0 and 1", "0 and 9", "A and B"],
    correctIndex: 1,
    explanation: "Binary uses base-2 notation consisting entirely of 0s and 1s.",
  },
  {
    id: "dc-t-3",
    category: "Technology",
    question: "What is the primary language used to structure web pages?",
    options: ["HTML", "Python", "SQL", "C++"],
    correctIndex: 0,
    explanation: "HTML (HyperText Markup Language) provides the foundational structure of web pages.",
  },
  {
    id: "dc-t-4",
    category: "Technology",
    question: "What type of computer memory is high-speed and volatile (erased when powered down)?",
    options: ["Hard Disk (HDD)", "RAM", "ROM", "Flash Drive"],
    correctIndex: 1,
    explanation: "RAM (Random Access Memory) holds active application data temporarily while powered on.",
  },

  // Geography & General Knowledge
  {
    id: "dc-g-1",
    category: "Geography",
    question: "What is the largest ocean on planet Earth?",
    options: ["Atlantic Ocean", "Indian Ocean", "Pacific Ocean", "Arctic Ocean"],
    correctIndex: 2,
    explanation: "The Pacific Ocean covers over 60 million square miles, larger than all Earth's land combined.",
  },
  {
    id: "dc-g-2",
    category: "Geography",
    question: "Which continent is home to the Sahara Desert?",
    options: ["Asia", "Africa", "South America", "Australia"],
    correctIndex: 1,
    explanation: "The Sahara Desert is situated across northern Africa.",
  },
  {
    id: "dc-g-3",
    category: "General Knowledge",
    question: "How many continents are recognized on Earth?",
    options: ["5", "6", "7", "8"],
    correctIndex: 2,
    explanation: "The 7 continents are Africa, Antarctica, Asia, Australia/Oceania, Europe, North America, and South America.",
  },
  {
    id: "dc-g-4",
    category: "General Knowledge",
    question: "Who was the first person to step foot on the Moon in 1969?",
    options: ["Buzz Aldrin", "Neil Armstrong", "Yuri Gagarin", "Michael Collins"],
    correctIndex: 1,
    explanation: "Neil Armstrong stepped onto the lunar surface on July 20, 1969.",
  },

  // Logic & Brain Teasers
  {
    id: "dc-l-1",
    category: "Logic",
    question: "A doctor gives you 3 pills and tells you to take one every half hour. How long will the pills last?",
    options: ["30 minutes", "60 minutes", "90 minutes", "120 minutes"],
    correctIndex: 1,
    explanation: "Take Pill 1 at 0 min, Pill 2 at 30 min, and Pill 3 at 60 min. Total time is 60 minutes.",
  },
  {
    id: "dc-l-2",
    category: "Logic",
    question: "If you overtake the person in 2nd place in a footrace, what position are you in?",
    options: ["1st place", "2nd place", "3rd place", "Tied for 1st"],
    correctIndex: 1,
    explanation: "By passing the person in 2nd, you take their place as 2nd (the 1st place runner is still ahead).",
  },
  {
    id: "dc-l-3",
    category: "Logic",
    question: "Some months have 30 days, and some have 31. How many months have 28 days?",
    options: ["1 month (February)", "6 months", "All 12 months", "None"],
    correctIndex: 2,
    explanation: "All 12 months have at least 28 days!",
  },
  {
    id: "dc-l-4",
    category: "Patterns",
    question: "Look at the series: 80, 10, 70, 15, 60, __. What number should come next?",
    options: ["20", "25", "50", "30"],
    correctIndex: 0,
    explanation: "There are two alternating patterns: 80, 70, 60 (-10) and 10, 15, 20 (+5).",
  },
  {
    id: "dc-l-5",
    category: "Math",
    question: "What is 7 × 8?",
    options: ["54", "56", "58", "64"],
    correctIndex: 1,
    explanation: "7 times 8 equals 56.",
  },
  {
    id: "dc-l-6",
    category: "Science",
    question: "What is the speed of light in vacuum approximately?",
    options: ["3,000 km/s", "30,000 km/s", "300,000 km/s", "3,000,000 km/s"],
    correctIndex: 2,
    explanation: "Light travels at roughly 300,000 kilometers per second (186,000 miles/s).",
  },
  {
    id: "dc-l-7",
    category: "Geography",
    question: "Which is the longest river in the world?",
    options: ["Amazon River", "Nile River", "Mississippi River", "Yangtze River"],
    correctIndex: 1,
    explanation: "The Nile River in Africa is traditionally recognized as the longest at ~6,650 km.",
  },
  {
    id: "dc-l-8",
    category: "General Knowledge",
    question: "How many seconds are there in one hour?",
    options: ["1,800", "2,400", "3,600", "6,000"],
    correctIndex: 2,
    explanation: "60 seconds per minute × 60 minutes = 3,600 seconds.",
  },
  {
    id: "dc-l-9",
    category: "English",
    question: "A word formed by rearranging the letters of another word is called an:",
    options: ["Acronym", "Anagram", "Homophone", "Palindrome"],
    correctIndex: 1,
    explanation: "An anagram is a rearrangement of letters (e.g., 'listen' -> 'silent').",
  },
  {
    id: "dc-l-10",
    category: "Technology",
    question: "What does 'URL' stand for in web browsing?",
    options: ["Uniform Resource Locator", "Universal Routing Link", "User Request Language", "Unified Realtime Link"],
    correctIndex: 0,
    explanation: "URL stands for Uniform Resource Locator, the global address of resources on the Web.",
  },
  // Additional batch for wide coverage
  {
    id: "dc-x-1",
    category: "Science",
    question: "What chemical element has the symbol 'Fe' on the periodic table?",
    options: ["Fluorine", "Iron", "Francium", "Fermium"],
    correctIndex: 1,
    explanation: "Iron's symbol 'Fe' comes from its Latin name, 'Ferrum'.",
  },
  {
    id: "dc-x-2",
    category: "Science",
    question: "Which planet is famously known as the 'Red Planet'?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correctIndex: 1,
    explanation: "Mars appears reddish in the sky due to iron oxide (rust) on its surface.",
  },
  {
    id: "dc-x-3",
    category: "Math",
    question: "What is the sum of angles inside any four-sided quadrilateral?",
    options: ["180°", "270°", "360°", "400°"],
    correctIndex: 2,
    explanation: "Any quadrilateral can be split into two triangles, each 180°, giving 360° total.",
  },
  {
    id: "dc-x-4",
    category: "Geography",
    question: "What is the capital city of Japan?",
    options: ["Kyoto", "Osaka", "Tokyo", "Hiroshima"],
    correctIndex: 2,
    explanation: "Tokyo is the bustling capital and largest metropolitan area of Japan.",
  },
  {
    id: "dc-x-5",
    category: "English",
    question: "What do you call words that sound the same but have different meanings and spellings (e.g. 'sea' and 'see')?",
    options: ["Synonyms", "Antonyms", "Homophones", "Acronyms"],
    correctIndex: 2,
    explanation: "Homophones are words that sound identical but differ in meaning or spelling.",
  },
  {
    id: "dc-x-6",
    category: "Patterns",
    question: "Complete the sequence: 1, 4, 9, 16, 25, __?",
    options: ["30", "36", "40", "49"],
    correctIndex: 1,
    explanation: "These are consecutive squares: 1², 2², 3², 4², 5², and 6² = 36.",
  },
  {
    id: "dc-x-7",
    category: "Technology",
    question: "Which device converts digital computer signals into wireless radio frequencies in your home?",
    options: ["Monitor", "Wi-Fi Router", "RAM module", "Power supply"],
    correctIndex: 1,
    explanation: "A Wi-Fi router broadcasts and receives wireless radio data packets.",
  },
  {
    id: "dc-x-8",
    category: "Logic",
    question: "Mary's father has 5 daughters: Nana, Nene, Nini, Nono. What is the name of the fifth daughter?",
    options: ["Nunu", "Mary", "Nina", "Noelle"],
    correctIndex: 1,
    explanation: "'Mary's father has 5 daughters...' So Mary is the fifth daughter!",
  }
];

export const DAILY_CHALLENGES: DailyChallengeItem[] = [
  ...BASE_CHALLENGES,
  ...EXPANDED_CHALLENGES,
];

// ==========================================
// 2. DAILY JOKES (ADDITIONAL FAMILY-SAFE POOL)
// Clean, funny, kid-appropriate jokes
// ==========================================
export const DAILY_JOKES_EXPANDED: Joke[] = [
  ...FUN_JOKES,
  ...EXPANDED_JOKES,
  {
    id: "dj-exp-1",
    category: "School",
    text: "Why did the teacher wear sunglasses to school?",
    punchline: "Because her students were so bright!",
    emoji: "😎",
  },
  {
    id: "dj-exp-2",
    category: "Technology",
    text: "Why did the computer squeak?",
    punchline: "Because someone clicked on the mouse!",
    emoji: "🖱️",
  },
  {
    id: "dj-exp-3",
    category: "Smart/Funny",
    text: "Why can't you trust atoms?",
    punchline: "Because they make up everything!",
    emoji: "⚛️",
  },
  {
    id: "dj-exp-4",
    category: "Dad Jokes",
    text: "What do you call cheese that isn't yours?",
    punchline: "Nacho cheese!",
    emoji: "🧀",
  },
  {
    id: "dj-exp-5",
    category: "School",
    text: "Why did the geometry book go to therapy?",
    punchline: "It had too many angles to work through.",
    emoji: "📐",
  },
  {
    id: "dj-exp-6",
    category: "Silly Jokes",
    text: "What did the zero say to the eight?",
    punchline: "Nice belt!",
    emoji: "🎱",
  },
  {
    id: "dj-exp-7",
    category: "School",
    text: "Why was the music teacher locked out of the classroom?",
    punchline: "Because her keys were inside the piano!",
    emoji: "🎹",
  },
  {
    id: "dj-exp-8",
    category: "Technology",
    text: "What kind of computer eats the most snacks?",
    punchline: "One with plenty of cookies enabled!",
    emoji: "🍪",
  },
  {
    id: "dj-exp-9",
    category: "Short Jokes",
    text: "What do clouds wear under their shorts?",
    punchline: "Thundies!",
    emoji: "⚡",
  },
  {
    id: "dj-exp-10",
    category: "Student Life",
    text: "Why did the clock get sent to the principal's office?",
    punchline: "It was tocking too much in class!",
    emoji: "⏰",
  },
  {
    id: "dj-exp-11",
    category: "Dad Jokes",
    text: "How do you organize a space party?",
    punchline: "You planet!",
    emoji: "🪐",
  },
  {
    id: "dj-exp-12",
    category: "Silly Jokes",
    text: "What does a bee use to brush its hair?",
    punchline: "A honeycomb!",
    emoji: "🐝",
  },
  {
    id: "dj-exp-13",
    category: "Smart/Funny",
    text: "Why did the scarecrow win an award?",
    punchline: "Because he was outstanding in his field!",
    emoji: "🌾",
  },
  {
    id: "dj-exp-14",
    category: "Technology",
    text: "Why did the robot go on vacation?",
    punchline: "To recharge its batteries!",
    emoji: "🤖",
  },
  {
    id: "dj-exp-15",
    category: "School",
    text: "What is a snake's favorite subject in school?",
    punchline: "Hisss-tory!",
    emoji: "🐍",
  }
];

// ==========================================
// 3. USEFUL FACTS & TIPS (MASSIVE RESOURCE POOL)
// Practical, positive, and educational daily tips
// ==========================================
const BASE_TIPS: DailyTipItem[] = [
  {
    id: "tip-1",
    category: "Study",
    tag: "Feynman Technique",
    title: "Explain It Like You're Teaching a 10-Year-Old",
    tip: "If you truly want to master a concept, try explaining it in simple words without jargon. When you hit a spot where you struggle to explain simply, that is exactly where your knowledge gap is.",
    actionableStep: "Pick one concept you learned this week and write a 2-sentence summary in plain language.",
  },
  {
    id: "tip-2",
    category: "Memory",
    tag: "Spaced Repetition",
    title: "Review at Intervals, Not All at Once",
    tip: "Cramming forces facts into short-term memory that vanish in days. Reviewing material after 1 day, 3 days, and 7 days triggers the brain to move information into permanent long-term storage.",
    actionableStep: "Spend 5 minutes today reviewing something you studied 3 days ago.",
  },
  {
    id: "tip-3",
    category: "Time Management",
    tag: "The 2-Minute Rule",
    title: "If It Takes Under 2 Minutes, Do It Now",
    tip: "Small tasks like replying to an important note, hanging up your coat, or clearing a desk take more mental energy to postpone than to finish immediately. Knock them out on the spot.",
    actionableStep: "Find one 2-minute task you've been postponing and finish it right now.",
  },
  {
    id: "tip-4",
    category: "Science",
    tag: "Sleep & Brain Cleanse",
    title: "Your Brain Washes Itself While You Sleep",
    tip: "During deep sleep, the glymphatic system pumps cerebrospinal fluid through brain tissue, clearing metabolic waste like beta-amyloid proteins that accumulate during waking hours.",
    actionableStep: "Protect an 8-hour sleep window tonight to allow your brain to restore optimal clarity.",
  },
  {
    id: "tip-5",
    category: "Habits",
    tag: "Habit Stacking",
    title: "Anchor New Habits to Established Routines",
    tip: "Instead of saying 'I will read more,' say 'After I pour my morning glass of water, I will read 5 pages.' Anchoring new behaviors to existing daily habits drastically increases consistency.",
    actionableStep: "Pick one habit you want to build and attach it directly after something you already do every day.",
  },
  {
    id: "tip-6",
    category: "Technology",
    tag: "Digital Focus",
    title: "The 20-20-20 Eye Protection Rule",
    tip: "When working on screens, every 20 minutes look at an object at least 20 feet away for at least 20 seconds. This relaxes the ciliary muscles in your eyes and prevents digital eye strain.",
    actionableStep: "Glance out the window or at a far wall right now for 20 seconds to reset your focus.",
  },
  {
    id: "tip-7",
    category: "Space",
    tag: "Cosmic Perspective",
    title: "Sunlight Takes 8 Minutes to Reach You",
    tip: "Light from the Sun travels at 300,000 km/s and still takes approximately 8 minutes and 20 seconds to travel 93 million miles to Earth. When you look outside, you are seeing sunlight from the past!",
    actionableStep: "Step outside or near a window for 1 minute of natural light to boost your circadian rhythm.",
  },
  {
    id: "tip-8",
    category: "Creativity",
    tag: "Diffused Thinking",
    title: "Stuck on a Problem? Take a Walk",
    tip: "Neuroscientists found that focused problem solving engages the executive network, but true breakthrough insights often occur when the brain switches to 'diffuse mode' during walking or showering.",
    actionableStep: "Take a 5-minute movement break when solving a tricky challenge.",
  },
  {
    id: "tip-9",
    category: "Study",
    tag: "Active Recall",
    title: "Test Yourself Instead of Re-reading",
    tip: "Re-reading notes creates an illusion of competence called the recognition heuristic. Quizzing yourself with closed books forces neural pathways to strengthen through active retrieval.",
    actionableStep: "Close your notes and write down 3 key takeaways from memory.",
  },
  {
    id: "tip-10",
    category: "Science",
    tag: "Hydration & Cognition",
    title: "Even 2% Dehydration Drops Focus by 15%",
    tip: "The brain is roughly 75% water. When hydration drops by just 2%, cognitive processing speed, short-term memory, and alertness decline noticeably.",
    actionableStep: "Drink a tall glass of fresh water before starting your next focus block.",
  },
  {
    id: "tip-11",
    category: "Habits",
    tag: "Compound Growth",
    title: "1% Better Every Day = 37x Better in a Year",
    tip: "Small daily improvements feel invisible in the moment, but mathematically: (1.01)^365 = 37.78. Consistent micro-moves create massive compounding trajectories over time.",
    actionableStep: "Focus on making just one tiny 1% improvement today rather than trying to overhaul everything.",
  },
  {
    id: "tip-12",
    category: "Time Management",
    tag: "Time Boxing",
    title: "Parkinson's Law: Work Expands to Fill Time",
    tip: "If you give yourself all afternoon to write an outline, it will take all afternoon. If you set a strict 25-minute timer, your focus sharpens and you finish in 25 minutes.",
    actionableStep: "Set a clear 20-minute countdown timer for your next meaningful task.",
  }
];

export const DAILY_TIPS: DailyTipItem[] = [
  ...BASE_TIPS,
  ...EXPANDED_TIPS,
];

// ==========================================
// DETERMINISTIC DAILY ROTATION ALGORITHM
// Ensures the same day gets a consistent, deterministic set of activities,
// avoiding recent repetitions across calendar days.
// ==========================================
function getDaySeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getDailyChallengeForDate(dateStr: string, excludeIds: string[] = []): DailyChallengeItem {
  const pool = DAILY_CHALLENGES.filter((c) => !excludeIds.includes(c.id));
  const activePool = pool.length > 0 ? pool : DAILY_CHALLENGES;
  const seed = getDaySeed(dateStr + "-challenge");
  const index = seed % activePool.length;
  return activePool[index];
}

export function getDailyJokeForDate(dateStr: string, excludeIds: string[] = []): Joke {
  const pool = DAILY_JOKES_EXPANDED.filter((j) => !excludeIds.includes(j.id));
  const activePool = pool.length > 0 ? pool : DAILY_JOKES_EXPANDED;
  const seed = getDaySeed(dateStr + "-joke");
  const index = seed % activePool.length;
  return activePool[index];
}

export function getDailyTipForDate(dateStr: string, excludeIds: string[] = []): DailyTipItem {
  const pool = DAILY_TIPS.filter((t) => !excludeIds.includes(t.id));
  const activePool = pool.length > 0 ? pool : DAILY_TIPS;
  const seed = getDaySeed(dateStr + "-tip");
  const index = seed % activePool.length;
  return activePool[index];
}

export function getDailyGameTypeForDate(dateStr: string): "scramble" | "tap" | "riddle" {
  const seed = getDaySeed(dateStr + "-game");
  const games: Array<"scramble" | "tap" | "riddle"> = ["scramble", "tap", "riddle"];
  return games[seed % games.length];
}
