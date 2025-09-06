// Static seed workout data for strength, cardio, and yoga
// Can be expanded or replaced by API enrichment later

export const exercises = [
  {
    id: 'ex_pushup',
    name: 'Push Up',
    type: 'strength',
    muscles: ['chest', 'triceps', 'core'],
    equipment: 'bodyweight',
    defaultRestSeconds: 45,
    media: { type: 'image', url: null }
  },
  {
    id: 'ex_squat',
    name: 'Bodyweight Squat',
    type: 'strength',
    muscles: ['legs', 'glutes', 'core'],
    equipment: 'bodyweight',
    defaultRestSeconds: 45,
    media: { type: 'image', url: null }
  },
  {
    id: 'ex_plank',
    name: 'Plank Hold',
    type: 'strength',
    muscles: ['core', 'shoulders'],
    equipment: 'bodyweight',
    defaultRestSeconds: 30,
    media: { type: 'image', url: null }
  },
  {
    id: 'ex_jump_rope',
    name: 'Jump Rope',
    type: 'cardio',
    muscles: ['full body'],
    equipment: 'rope (optional)',
    defaultRestSeconds: 30,
    media: { type: 'image', url: null }
  },
  {
    id: 'ex_run_interval',
    name: 'Run Interval',
    type: 'cardio',
    muscles: ['legs', 'cardio'],
    equipment: 'none',
    defaultRestSeconds: 60,
    media: { type: 'image', url: null }
  },
  {
    id: 'ex_yoga_dog',
    name: 'Downward Dog',
    type: 'yoga',
    muscles: ['shoulders', 'hamstrings', 'calves'],
    equipment: 'mat',
    defaultHoldSeconds: 30,
    media: { type: 'image', url: null }
  },
  {
    id: 'ex_yoga_child',
    name: 'Child Pose',
    type: 'yoga',
    muscles: ['back', 'hips'],
    equipment: 'mat',
    defaultHoldSeconds: 45,
    media: { type: 'image', url: null }
  },
  {
    id: 'ex_yoga_cobra',
    name: 'Cobra',
    type: 'yoga',
    muscles: ['spine', 'core'],
    equipment: 'mat',
    defaultHoldSeconds: 25,
    media: { type: 'image', url: null }
  }
];

export const workoutTemplates = [
  {
    id: 'wt_strength_foundation',
    title: 'Strength Foundation',
    category: 'Strength',
    difficulty: 'Beginner',
    EstimatedDurationMinutes: 25,
    blocks: [
      {
        type: 'straight',
        title: 'Main Sets',
        exercises: [
          { exerciseId: 'ex_pushup', sets: 3, reps: 12, restSeconds: 45 },
          { exerciseId: 'ex_squat', sets: 3, reps: 15, restSeconds: 45 },
          { exerciseId: 'ex_plank', sets: 3, holdSeconds: 30, restSeconds: 30 }
        ]
      }
    ]
  },
  {
    id: 'wt_cardio_intervals',
    title: 'Cardio Intervals',
    category: 'Cardio',
    difficulty: 'All',
    EstimatedDurationMinutes: 20,
    blocks: [
      {
        type: 'interval',
        workSeconds: 60,
        restSeconds: 30,
        rounds: 8,
        exerciseId: 'ex_jump_rope'
      }
    ]
  },
  {
    id: 'wt_yoga_morning',
    title: 'Morning Flow',
    category: 'Yoga',
    difficulty: 'Easy',
    EstimatedDurationMinutes: 15,
    blocks: [
      {
        type: 'flow',
        poses: [
          { exerciseId: 'ex_yoga_dog', holdSeconds: 30 },
          { exerciseId: 'ex_yoga_child', holdSeconds: 45 },
          { exerciseId: 'ex_yoga_cobra', holdSeconds: 25 },
          { exerciseId: 'ex_yoga_child', holdSeconds: 45 }
        ]
      }
    ]
  }
];
