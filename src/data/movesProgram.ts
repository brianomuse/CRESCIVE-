import { ExerciseItem, WorkoutProgramDay, RecoverySuggestion } from "../types";

export const EXERCISE_DEFINITIONS: Record<string, ExerciseItem> = {
  squat: {
    id: "squat",
    name: "Bodyweight Squat",
    target: "10 REPS",
    targetReps: 10,
    isTimed: false,
    technique: "Keep your chest controlled and move through a comfortable range.",
    keyCues: [
      "Feet shoulder-width apart, toes angled slightly outward.",
      "Send hips back and down as if sitting into an invisible chair.",
      "Keep heels glued to the floor and spine tall.",
      "Drive through mid-foot and heels to return to standing.",
    ],
    steps: [
      {
        step: 1,
        label: "START POSITION",
        imageUrl: "/assets/exercises/squat_1.jpg",
        instruction: "Stand tall with feet shoulder-width apart, hands ready at chest, spine long and upright.",
      },
      {
        step: 2,
        label: "MOVEMENT POSITION",
        imageUrl: "/assets/exercises/squat_2.jpg",
        instruction: "Hinge at the hips and bend knees to 45°, lowering with control while keeping chest lifted.",
      },
      {
        step: 3,
        label: "FINISH POSITION",
        imageUrl: "/assets/exercises/squat_3.jpg",
        instruction: "Reach parallel depth with thighs horizontal to floor and heels anchored, then press back up.",
      },
    ],
    alternative: {
      name: "Controlled Chair-Assisted Squat",
      description:
        "Perform the squat tapping your hips gently to a sturdy chair or bench before standing, maintaining full balance and control.",
    },
    safetyNotice:
      "Move at your own level. Keep your knees tracking in line with your second toe. Do not force depth if you feel joint pinch.",
  },

  pushup: {
    id: "pushup",
    name: "Push-Up",
    target: "6–10 REPS",
    targetReps: 8,
    isTimed: false,
    technique: "Maintain a steady straight line from head to heels with controlled lowering.",
    keyCues: [
      "Hands positioned slightly wider than shoulder-width, fingers spread.",
      "Brace your core and glutes to prevent hip sagging.",
      "Lower smoothly with elbows tracking at roughly a 45-degree angle.",
      "Press through the entire palm to return to the starting position.",
    ],
    steps: [
      {
        step: 1,
        label: "START POSITION",
        imageUrl: "/assets/exercises/pushup_1.jpg",
        instruction: "Assume high plank position with hands flat under shoulders and body locked in a straight line.",
      },
      {
        step: 2,
        label: "MOVEMENT POSITION",
        imageUrl: "/assets/exercises/pushup_2.jpg",
        instruction: "Lower your body halfway down, elbows tracking back at 45° while bracing core and glutes.",
      },
      {
        step: 3,
        label: "FINISH POSITION",
        imageUrl: "/assets/exercises/pushup_3.jpg",
        instruction: "Descend until chest hovers just off the mat, pause briefly, and press firmly back up.",
      },
    ],
    alternative: {
      name: "Incline or Knee-Supported Push-Up",
      description:
        "Place hands on an elevated surface like a bench or wall, or lower knees to the mat while keeping your torso in a clean straight line.",
    },
    safetyNotice:
      "Stop immediately if you feel sharp shoulder or wrist strain. Adjust hand placement to find a pain-free angle.",
  },

  gluteBridge: {
    id: "gluteBridge",
    name: "Glute Bridge",
    target: "10 REPS",
    targetReps: 10,
    isTimed: false,
    technique: "Drive through your heels, squeeze at the top, and lower with control.",
    keyCues: [
      "Lie face up on the mat with knees bent and feet flat on the floor.",
      "Engage your abdomen and press down through the heels.",
      "Lift hips until thighs and torso align in a smooth diagonal.",
      "Hold for a 1-second pause at the peak, then lower steadily.",
    ],
    steps: [
      {
        step: 1,
        label: "START POSITION",
        imageUrl: "/assets/exercises/gluteBridge_1.jpg",
        instruction: "Lie on your back with knees bent at 90°, feet flat on floor hip-width apart, arms at sides.",
      },
      {
        step: 2,
        label: "MOVEMENT POSITION",
        imageUrl: "/assets/exercises/gluteBridge_2.jpg",
        instruction: "Drive through heels to lift hips halfway up, keeping ribs down and knees tracking forward.",
      },
      {
        step: 3,
        label: "FINISH POSITION",
        imageUrl: "/assets/exercises/gluteBridge_3.jpg",
        instruction: "Elevate hips until body forms a straight line from knees to shoulders; squeeze glutes firmly.",
      },
    ],
    alternative: {
      name: "Gentle Low-Range Bridge",
      description:
        "Lift your hips only to a comfortable halfway height, focusing on glute activation without hyperextending your lower back.",
    },
    safetyNotice:
      "Avoid arching excessively through the lower back. Keep the work centered in your glutes and hamstrings.",
  },

  plank: {
    id: "plank",
    name: "Forearm Plank",
    target: "20 SECONDS",
    targetSeconds: 20,
    isTimed: true,
    technique: "Engage your core, keep breathing steadily, and avoid sagging hips.",
    keyCues: [
      "Elbows directly under your shoulders, forearms resting parallel.",
      "Form one long, unbreakable line from crown of head to heels.",
      "Gently draw belly button inward toward the spine.",
      "Breathe rhythmically throughout the hold without holding your breath.",
    ],
    steps: [
      {
        step: 1,
        label: "START POSITION",
        imageUrl: "/assets/exercises/plank_1.jpg",
        instruction: "Kneel on the mat and place forearms flat on the floor with elbows directly under shoulders.",
      },
      {
        step: 2,
        label: "MOVEMENT POSITION",
        imageUrl: "/assets/exercises/plank_2.jpg",
        instruction: "Step feet back onto toes one at a time and engage your abdominal wall to brace spine.",
      },
      {
        step: 3,
        label: "FINISH POSITION",
        imageUrl: "/assets/exercises/plank_3.jpg",
        instruction: "Hold a rigid horizontal plank from head to heels, neck neutral, breathing steadily for the target duration.",
      },
    ],
    alternative: {
      name: "Shorter Duration or Knee Plank",
      description:
        "Hold for 10-15 seconds or rest knees on the mat while preserving strong abdominal bracing and a neutral neck.",
    },
    safetyNotice:
      "If your lower back starts dipping or aching, end the set early. Quality of alignment is always prioritized over time.",
  },

  reverseLunge: {
    id: "reverseLunge",
    name: "Reverse Lunge",
    target: "8 REPS / SIDE",
    targetReps: 8,
    isTimed: false,
    technique: "Step back with control, lower gently, and keep your front knee aligned.",
    keyCues: [
      "Stand tall, feet hip-distance apart, hands on hips or at chest.",
      "Step smoothly backward with one leg and lower until both knees bend ~90°.",
      "Keep front knee directly stacked over the midfoot/ankle.",
      "Push firmly off the front foot to return smoothly to standing.",
    ],
    steps: [
      {
        step: 1,
        label: "START POSITION",
        imageUrl: "/assets/exercises/reverseLunge_1.jpg",
        instruction: "Stand upright with feet hip-width apart, posture centered and tall, hands positioned at chest.",
      },
      {
        step: 2,
        label: "MOVEMENT POSITION",
        imageUrl: "/assets/exercises/reverseLunge_2.jpg",
        instruction: "Step one leg backward smoothly, lowering hips straight down while keeping torso upright.",
      },
      {
        step: 3,
        label: "FINISH POSITION",
        imageUrl: "/assets/exercises/reverseLunge_3.jpg",
        instruction: "Lower until front thigh is parallel and back knee hovers 1 inch off mat, then push back up.",
      },
    ],
    alternative: {
      name: "Supported Reverse Lunge",
      description:
        "Hold onto a sturdy wall, railing, or chair back for balance and reduce the step-back depth to a comfortable angle.",
    },
    safetyNotice:
      "Do not let the back knee slam into the floor. Maintain upright posture without leaning sideways.",
  },

  birdDog: {
    id: "birdDog",
    name: "Bird-Dog",
    target: "8 REPS / SIDE",
    targetReps: 8,
    isTimed: false,
    technique: "Extend opposite arm and leg while keeping your torso quiet and balanced.",
    keyCues: [
      "Start on all fours with hands under shoulders and knees under hips.",
      "Slowly reach right arm forward and left leg backward until level with torso.",
      "Imagine balancing a glass of water on your lower back.",
      "Pause for 1 second at full extension, return with control, and switch sides.",
    ],
    steps: [
      {
        step: 1,
        label: "START POSITION",
        imageUrl: "/assets/exercises/birdDog_1.jpg",
        instruction: "Begin in quadruped tabletop position on all fours with wrists below shoulders and knees below hips.",
      },
      {
        step: 2,
        label: "MOVEMENT POSITION",
        imageUrl: "/assets/exercises/birdDog_2.jpg",
        instruction: "Brace core and simultaneously reach opposite arm forward and leg backward halfway.",
      },
      {
        step: 3,
        label: "FINISH POSITION",
        imageUrl: "/assets/exercises/birdDog_3.jpg",
        instruction: "Extend arm and opposite leg parallel to the floor, holding 1 second without twisting the pelvis.",
      },
    ],
    alternative: {
      name: "Arm-Only or Leg-Only Reach",
      description:
        "Keep three points of contact on the floor by reaching either only the arm or only the leg until stability develops.",
    },
    safetyNotice:
      "Move slowly and deliberately. Do not fling limbs upward or twist your pelvis.",
  },

  calfRaise: {
    id: "calfRaise",
    name: "Calf Raise",
    target: "12 REPS",
    targetReps: 12,
    isTimed: false,
    technique: "Rise smoothly onto your toes, pause for a moment, and descend gently.",
    keyCues: [
      "Stand with feet hip-width apart and toes pointing straight forward.",
      "Press through the balls of both feet to lift heels as high as comfortable.",
      "Hold the top contraction for 1 full second.",
      "Lower heels with steady control over 2 full seconds.",
    ],
    steps: [
      {
        step: 1,
        label: "START POSITION",
        imageUrl: "/assets/exercises/calfRaise_1.jpg",
        instruction: "Stand with feet hip-width apart and flat on the floor, spine tall, weight centered.",
      },
      {
        step: 2,
        label: "MOVEMENT POSITION",
        imageUrl: "/assets/exercises/calfRaise_2.jpg",
        instruction: "Press through balls of both feet to begin elevating heels, stabilizing ankles.",
      },
      {
        step: 3,
        label: "FINISH POSITION",
        imageUrl: "/assets/exercises/calfRaise_3.jpg",
        instruction: "Reach highest elevation on toes, pause 1 second with calves fully engaged, then lower with control.",
      },
    ],
    alternative: {
      name: "Wall-Supported Calf Raise",
      description:
        "Rest fingertips lightly on a wall for balance and perform seated or flat-floor calf raises at a smooth tempo.",
    },
    safetyNotice:
      "Control the descent rather than bouncing off your Achilles tendons.",
  },
};

export const RECOVERY_SUGGESTIONS: RecoverySuggestion[] = [
  {
    id: "easy-walk",
    title: "Easy Outdoor Walk",
    description: "Unstructured 15–20 minute stroll outside. Fresh air, natural light, no pace pressure.",
    duration: "15–20 min",
  },
  {
    id: "gentle-mobility",
    title: "Gentle Mobility & Stretching",
    description: "Flow through hip openers, shoulder circles, and spine stretches at a relaxing tempo.",
    duration: "10 min",
  },
  {
    id: "nature-sunlight",
    title: "Time Outdoors / Sunlight",
    description: "Step away from screens. Sit in the sun, breathe deeply, and allow your nervous system to downshift.",
    duration: "15 min",
  },
  {
    id: "mindful-relaxation",
    title: "Passive Relaxation & Decompression",
    description: "Lie flat on a mat with legs elevated or listen to calming audio to reset body and mind.",
    duration: "10 min",
  },
];

export const WORKOUT_CYCLE_DAYS: Record<number, WorkoutProgramDay> = {
  1: {
    dayNumber: 1,
    title: "DAY 1 — FOUNDATION",
    phaseName: "FOUNDATION",
    tagline: "Build basic movement quality, coordination, and postural stability.",
    isRecoveryDay: false,
    exercises: [
      {
        ...EXERCISE_DEFINITIONS.squat,
        target: "10 REPS",
        targetReps: 10,
      },
      {
        ...EXERCISE_DEFINITIONS.pushup,
        target: "6–10 REPS",
        targetReps: 8,
      },
      {
        ...EXERCISE_DEFINITIONS.gluteBridge,
        target: "10 REPS",
        targetReps: 10,
      },
      {
        ...EXERCISE_DEFINITIONS.plank,
        target: "20 SECONDS",
        targetSeconds: 20,
        isTimed: true,
      },
    ],
    speedDrill: {
      title: "SHORT SPRINT / RUNNING DRILL",
      subtitle: "Short effort. Full recovery.",
      efforts: 4,
      workSeconds: 15,
      recoverySeconds: 45,
      instructions:
        "4 short, controlled efforts with full walking recovery between each. Focus on clean mechanics rather than maximum speed.",
      warmupNote: "Always complete the Prepare warm-up before running.",
    },
  },

  2: {
    dayNumber: 2,
    title: "DAY 2 — MOVEMENT",
    phaseName: "MOVEMENT",
    tagline: "Challenge balance, unilateral stability, and multi-plane coordination.",
    isRecoveryDay: false,
    exercises: [
      {
        ...EXERCISE_DEFINITIONS.reverseLunge,
        target: "8 REPS / SIDE",
        targetReps: 8,
      },
      {
        ...EXERCISE_DEFINITIONS.pushup,
        target: "6–10 REPS",
        targetReps: 8,
      },
      {
        ...EXERCISE_DEFINITIONS.birdDog,
        target: "8 REPS / SIDE",
        targetReps: 8,
      },
      {
        ...EXERCISE_DEFINITIONS.calfRaise,
        target: "12 REPS",
        targetReps: 12,
      },
    ],
    speedDrill: {
      title: "SHORT SPRINT / RUNNING DRILL",
      subtitle: "Short effort. Full recovery.",
      efforts: 4,
      workSeconds: 15,
      recoverySeconds: 45,
      instructions:
        "4 short accelerations with generous walking recovery. Keep posture tall and arms relaxed.",
      warmupNote: "Warm muscles accelerate better and stay protected.",
    },
  },

  3: {
    dayNumber: 3,
    title: "DAY 3 — PROGRESS",
    phaseName: "PROGRESS",
    tagline: "Solidify strength stamina and reinforce movement endurance.",
    isRecoveryDay: false,
    exercises: [
      {
        ...EXERCISE_DEFINITIONS.squat,
        target: "12 REPS",
        targetReps: 12,
      },
      {
        ...EXERCISE_DEFINITIONS.pushup,
        target: "6–10 REPS",
        targetReps: 8,
      },
      {
        ...EXERCISE_DEFINITIONS.gluteBridge,
        target: "12 REPS",
        targetReps: 12,
      },
      {
        ...EXERCISE_DEFINITIONS.plank,
        target: "20–25 SECONDS",
        targetSeconds: 22,
        isTimed: true,
      },
    ],
    speedDrill: {
      title: "SHORT SPRINT / RUNNING DRILL",
      subtitle: "Short effort. Full recovery.",
      efforts: 5,
      workSeconds: 15,
      recoverySeconds: 45,
      instructions:
        "5 short efforts with full walking recovery. Listen to your body and keep form sharp.",
      warmupNote: "Progress comes from consistency, not excessive strain.",
    },
  },

  4: {
    dayNumber: 4,
    title: "DAY 4 — RECOVERY",
    phaseName: "RECOVERY",
    tagline: "Recovery is part of progress. Allow tissues to adapt and rebuild.",
    isRecoveryDay: true,
    exercises: [],
    recoverySuggestions: RECOVERY_SUGGESTIONS,
  },
};

export const WARMUP_MOVEMENTS = [
  {
    name: "Easy Walking in Place",
    duration: "30s",
    instruction: "Light rhythmic stepping to bring gentle blood flow to legs.",
  },
  {
    name: "Shoulder & Arm Circles",
    duration: "30s",
    instruction: "Smooth, wide rotations forward and backward to loosen shoulders.",
  },
  {
    name: "Gentle Leg Swings & Hip Openers",
    duration: "30s",
    instruction: "Light forward-and-back leg swings holding a wall for balance.",
  },
  {
    name: "Dynamic Torso Rotations",
    duration: "30s",
    instruction: "Gentle standing torso twists with relaxed arms.",
  },
];
