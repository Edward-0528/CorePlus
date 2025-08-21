import { supabase } from '../supabaseConfig';
import { workoutService } from './workoutService';

// Simple adaptive plan generator
export const planService = {
  // options: { preview: boolean }
  async generatePlanForUser(userId, profile, options = {}) {
    const { preview = false } = options;
    // profile: { goal, experience, daysAvailablePerWeek, sessionLengthMinutes, preferredSplit, equipment }
    const days = Math.max(2, Math.min(6, profile.daysAvailablePerWeek || 3));
    const split = chooseSplit(profile.experience, days, profile.preferredSplit);

    const plan = {
      user_id: userId,
      name: `${profile.goal || 'Fitness'} Plan`,
      start_date: new Date().toISOString(),
      duration_weeks: 12,
      metadata: {
        goal: profile.goal,
        experience: profile.experience,
        daysPerWeek: days,
        sessionLengthMinutes: profile.sessionLengthMinutes || 30,
        split
      }
    };

    // Generate workouts for 1 week as a template
    const weekWorkouts = [];
    const templates = getTemplatesForSplit(split, profile.goal, profile.equipment);
    for (let d = 0; d < days; d++) {
      const template = templates[d % templates.length];
      const workout = buildWorkoutFromTemplate(template, profile.sessionLengthMinutes || 30);
      weekWorkouts.push({ week: 1, day: d, workout });
    }

    // If preview requested, don't persist to Supabase — return generated plan and workouts
    if (preview) {
      return { success: true, preview: true, plan: { ...plan, workouts: weekWorkouts }, workouts: weekWorkouts };
    }

    // Store plan and workouts in Supabase
    const { data: planData, error: planError } = await supabase
      .from('workout_plans')
      .insert([{ user_id: userId, name: plan.name, start_date: plan.start_date, duration_weeks: plan.duration_weeks, plan_metadata: plan.metadata }])
      .select()
      .single();

    if (planError) {
      console.error('Error creating plan:', planError);
      return { success: false, error: planError.message };
    }

    const planId = planData.id;

    const workoutRows = weekWorkouts.map(w => ({
      plan_id: planId,
      week_number: w.week,
      day_of_week: w.day,
      workout_json: w.workout
    }));

    const { error: workoutsError } = await supabase
      .from('plan_workouts')
      .insert(workoutRows);

    if (workoutsError) {
      console.error('Error inserting plan workouts:', workoutsError);
      return { success: false, error: workoutsError.message };
    }

    return { success: true, planId, plan: planData };
  },

  async fetchActivePlan(userId) {
    const { data, error } = await supabase
      .from('workout_plans')
      .select(`*, plan_workouts (*)`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching active plan:', error);
      return { success: false, error: error.message };
    }

    return { success: true, plan: data && data[0] };
  }
};

// Helper functions
function chooseSplit(experience, days, preferredSplit) {
  if (preferredSplit && preferredSplit !== 'auto') return preferredSplit;
  if (days <= 3) return 'fullbody';
  if (days === 4) return 'upper_lower';
  return 'push_pull_legs';
}

function getTemplatesForSplit(split, goal, equipment) {
  const templates = {
    fullbody: [
      {
        name: 'Full Body A',
        exercises: [
          { name: 'Squat or Goblet Squat', type: 'compound' },
          { name: 'Push (Bench/Push-up)', type: 'compound' },
          { name: 'Row (Dumbbell/Bodyweight Row)', type: 'compound' },
          { name: 'Hip Hinge (Deadlift/Romanian Deadlift)', type: 'compound' },
          { name: 'Core', type: 'accessory' }
        ]
      },
      {
        name: 'Full Body B',
        exercises: [
          { name: 'Lunge or Step-up', type: 'compound' },
          { name: 'Overhead Press', type: 'compound' },
          { name: 'Pull (Pull-up or Band Row)', type: 'compound' },
          { name: 'Accessory', type: 'accessory' },
          { name: 'Mobility', type: 'accessory' }
        ]
      }
    ],
    upper_lower: [
      { name: 'Upper A', exercises: [{ name: 'Bench/Push-up' }, { name: 'Row' }, { name: 'Accessory' }] },
      { name: 'Lower A', exercises: [{ name: 'Squat' }, { name: 'Hinge' }, { name: 'Accessory' }] }
    ],
    push_pull_legs: [
      { name: 'Push', exercises: [{ name: 'Bench/Push-up' }, { name: 'Overhead' }, { name: 'Accessory' }] },
      { name: 'Pull', exercises: [{ name: 'Row' }, { name: 'Pull-up' }, { name: 'Accessory' }] },
      { name: 'Legs', exercises: [{ name: 'Squat' }, { name: 'Hinge' }, { name: 'Accessory' }] }
    ]
  };

  return templates[split] || templates.fullbody;
}

function buildWorkoutFromTemplate(template, sessionLength) {
  // Very simple fill - can be improved with sets/reps/tempo
  const exercises = template.exercises.slice(0, 6).map(ex => ({
    name: ex.name,
    sets: ex.sets || 3,
    reps: ex.reps || (ex.type === 'compound' ? 6 + Math.floor(Math.random() * 7) : 8 + Math.floor(Math.random() * 6)),
    rest: ex.rest || 60
  }));

  return {
    title: template.name,
    durationMinutes: sessionLength,
    exercises,
    notes: template.notes || ''
  };
}
