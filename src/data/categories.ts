import { LifeCategory } from "../types";

export const CRESCIVE_CATEGORIES: LifeCategory[] = [
  {
    id: "knowledge-learning",
    number: 1,
    title: "Knowledge & Learning",
    iconName: "GraduationCap",
    subcategories: [
      "School",
      "Courses",
      "Reading",
      "General knowledge",
      "Languages",
      "Research",
      "Skills",
      "Critical thinking"
    ],
    color: "#38BDF8",
    glowColor: "rgba(56, 189, 248, 0.35)",
    accentGradient: "from-sky-400 to-blue-600",
    description: "Acquiring skills, expanding intellect, and compounding understanding."
  },
  {
    id: "career-work",
    number: 2,
    title: "Career & Work",
    iconName: "Briefcase",
    subcategories: [
      "Career direction",
      "Job",
      "Professional skills",
      "CV/Portfolio",
      "Networking",
      "Promotions",
      "Leadership",
      "Entrepreneurship"
    ],
    color: "#F59E0B",
    glowColor: "rgba(245, 158, 11, 0.35)",
    accentGradient: "from-amber-400 to-yellow-600",
    description: "Professional mastery, vocation, craft, and institutional leadership."
  },
  {
    id: "money-wealth",
    number: 3,
    title: "Money & Wealth",
    iconName: "Coins",
    subcategories: [
      "Income",
      "Budgeting",
      "Saving",
      "Investing",
      "Debt",
      "Financial goals",
      "Business",
      "Wealth building"
    ],
    color: "#10B981",
    glowColor: "rgba(16, 185, 129, 0.35)",
    accentGradient: "from-emerald-400 to-teal-600",
    description: "Financial autonomy, assets, resource stewardship, and freedom."
  },
  {
    id: "mind-personal-growth",
    number: 4,
    title: "Mind & Personal Growth",
    iconName: "Brain",
    subcategories: [
      "Discipline",
      "Confidence",
      "Focus",
      "Emotional intelligence",
      "Self-awareness",
      "Decision-making",
      "Resilience",
      "Mindset"
    ],
    color: "#A855F7",
    glowColor: "rgba(168, 85, 247, 0.35)",
    accentGradient: "from-purple-400 to-violet-600",
    description: "Internal fortitude, emotional regulation, clarity, and sovereign discipline."
  },
  {
    id: "health-wellness",
    number: 5,
    title: "Health & Wellness",
    iconName: "Heart",
    subcategories: [
      "Exercise",
      "Nutrition",
      "Sleep",
      "Energy",
      "Fitness",
      "Recovery",
      "Mental wellbeing",
      "Healthy routines"
    ],
    color: "#F43F5E",
    glowColor: "rgba(244, 63, 94, 0.35)",
    accentGradient: "from-rose-400 to-red-600",
    description: "Biological vitality, sustained energy, physical strength, and longevity."
  },
  {
    id: "relationships",
    number: 6,
    title: "Relationships",
    iconName: "Users",
    subcategories: [
      "Family",
      "Friends",
      "Partner",
      "Communication",
      "Social life",
      "Community",
      "Networking",
      "Meaningful connections"
    ],
    color: "#EC4899",
    glowColor: "rgba(236, 72, 153, 0.35)",
    accentGradient: "from-pink-400 to-rose-600",
    description: "Deep bonds, trust, love, honest communication, and mutual elevation."
  },
  {
    id: "creativity-expression",
    number: 7,
    title: "Creativity & Expression",
    iconName: "Palette",
    subcategories: [
      "Writing",
      "Music",
      "Art",
      "Design",
      "Photography",
      "Content creation",
      "Ideas",
      "Personal projects"
    ],
    color: "#8B5CF6",
    glowColor: "rgba(139, 92, 246, 0.35)",
    accentGradient: "from-indigo-400 to-purple-600",
    description: "Giving physical form to intuition, original thought, art, and voice."
  },
  {
    id: "business-building",
    number: 8,
    title: "Business & Building",
    iconName: "Rocket",
    subcategories: [
      "Startup ideas",
      "Projects",
      "Products",
      "Side hustles",
      "Freelancing",
      "Innovation",
      "Execution",
      "Business strategy"
    ],
    color: "#EAB308",
    glowColor: "rgba(234, 179, 8, 0.35)",
    accentGradient: "from-amber-300 to-orange-500",
    description: "Creating tangible systems, products, enterprises, and market value."
  },
  {
    id: "experiences-adventure",
    number: 9,
    title: "Experiences & Adventure",
    iconName: "Compass",
    subcategories: [
      "Travel",
      "Places to visit",
      "Hobbies",
      "Adventures",
      "New experiences",
      "Events",
      "Culture",
      "Things to try"
    ],
    color: "#14B8A6",
    glowColor: "rgba(20, 184, 166, 0.35)",
    accentGradient: "from-teal-400 to-cyan-600",
    description: "Novelty, worldview expansion, exploratory joy, and memorable journeys."
  },
  {
    id: "life-environment",
    number: 10,
    title: "Life & Environment",
    iconName: "Home",
    subcategories: [
      "Home",
      "Organization",
      "Digital environment",
      "Personal space",
      "Lifestyle",
      "Time management",
      "Daily systems"
    ],
    color: "#64748B",
    glowColor: "rgba(100, 116, 139, 0.35)",
    accentGradient: "from-slate-400 to-zinc-600",
    description: "Sanctuary, spatial harmony, minimal friction, and optimal living systems."
  },
  {
    id: "goals-direction",
    number: 11,
    title: "Goals & Direction",
    iconName: "Target",
    subcategories: [
      "Short-term goals",
      "Long-term goals",
      "Life vision",
      "Milestones",
      "Priorities",
      "Life plans",
      "Major decisions"
    ],
    color: "#E11D48",
    glowColor: "rgba(225, 29, 72, 0.35)",
    accentGradient: "from-red-400 to-rose-600",
    description: "Strategic teleology, directional compass, and non-negotiable milestones."
  },
  {
    id: "time-productivity",
    number: 12,
    title: "Time & Productivity",
    iconName: "Hourglass",
    subcategories: [
      "Daily planning",
      "Weekly planning",
      "Deep work",
      "Time allocation",
      "Routines",
      "Focus sessions",
      "Procrastination",
      "Time audits"
    ],
    color: "#D97706",
    glowColor: "rgba(217, 119, 6, 0.35)",
    accentGradient: "from-amber-500 to-yellow-600",
    description: "The precious currency of life: deliberate focus, deep work, and rhythmic discipline."
  },
  {
    id: "values-identity",
    number: 13,
    title: "Values & Identity",
    iconName: "Navigation",
    subcategories: [
      "Personal values",
      "Principles",
      "Identity",
      "Character",
      "Beliefs",
      "Strengths",
      "Weaknesses",
      "Who I'm becoming"
    ],
    color: "#D4AF37",
    glowColor: "rgba(212, 175, 55, 0.4)",
    accentGradient: "from-yellow-200 to-amber-600",
    description: "The core moral architecture, virtues, and uncompromising codes of honor."
  },
  {
    id: "contribution-impact",
    number: 14,
    title: "Contribution & Impact",
    iconName: "Sparkles",
    subcategories: [
      "Helping others",
      "Community",
      "Volunteering",
      "Leadership",
      "Social impact",
      "Legacy",
      "Causes",
      "Giving back"
    ],
    color: "#06B6D4",
    glowColor: "rgba(6, 182, 212, 0.35)",
    accentGradient: "from-cyan-400 to-teal-600",
    description: "Leaving the world, people, and community distinctly better than you found them."
  },
  {
    id: "spirituality-meaning",
    number: 15,
    title: "Spirituality & Meaning",
    iconName: "Feather",
    subcategories: [
      "Purpose",
      "Reflection",
      "Gratitude",
      "Faith",
      "Meaning",
      "Personal philosophy"
    ],
    color: "#C084FC",
    glowColor: "rgba(192, 132, 252, 0.35)",
    accentGradient: "from-purple-300 to-indigo-500",
    description: "Existential wonder, divine connection, quiet contemplation, and enduring meaning."
  }
];

export const LIFE_CONSTELLATION_NODES = [
  { id: "CAREER", label: "CAREER", angle: 0, distance: 120, color: "#F59E0B" },
  { id: "MONEY", label: "MONEY", angle: 36, distance: 135, color: "#10B981" },
  { id: "HEALTH", label: "HEALTH", angle: 72, distance: 110, color: "#F43F5E" },
  { id: "KNOWLEDGE", label: "KNOWLEDGE", angle: 108, distance: 130, color: "#38BDF8" },
  { id: "FAMILY", label: "FAMILY", angle: 144, distance: 125, color: "#EC4899" },
  { id: "RELATIONSHIPS", label: "RELATIONSHIPS", angle: 180, distance: 135, color: "#F472B6" },
  { id: "CREATIVITY", label: "CREATIVITY", angle: 216, distance: 115, color: "#8B5CF6" },
  { id: "EXPERIENCES", label: "EXPERIENCES", angle: 252, distance: 130, color: "#14B8A6" },
  { id: "IMPACT", label: "IMPACT", angle: 288, distance: 125, color: "#06B6D4" },
  { id: "VALUES", label: "VALUES", angle: 324, distance: 115, color: "#D4AF37" },
];
