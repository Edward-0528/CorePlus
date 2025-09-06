import { supabase } from '../supabaseConfig';
import { exercises, workoutTemplates } from './workoutData';

// Seeds local static workout data (exercises + templates) into Supabase tables if not already present.
// Safe to call multiple times; uses upsert patterns.

async function seedExercises() {
  const { data: existing, error } = await supabase
    .from('exercises')
    .select('id');
  if (error) {
    console.warn('Exercise seed: fetch existing failed', error.message);
    return { success: false, error: error.message };
  }
  const existingIds = new Set((existing || []).map(e => e.id));
  const toInsert = exercises.filter(e => !existingIds.has(e.id)).map(e => ({
    id: e.id,
    name: e.name,
    type: e.type,
    muscle_groups: e.muscles || [],
    equipment: e.equipment || null,
    default_rest_seconds: e.defaultRestSeconds || null,
    default_hold_seconds: e.defaultHoldSeconds || null,
    media: e.media || null
  }));
  if (!toInsert.length) return { success: true, inserted: 0 };
  const { error: insertErr } = await supabase.from('exercises').insert(toInsert);
  if (insertErr) return { success: false, error: insertErr.message };
  return { success: true, inserted: toInsert.length };
}

function expandTemplateBlocks(tpl) {
  // Flatten blocks into workout_template_exercises compatible rows.
  const rows = [];
  tpl.blocks.forEach((block, blockIdx) => {
    if (block.type === 'straight') {
      block.exercises.forEach((ex, exIdx) => {
        rows.push({
          workout_template_id: tpl.id,
          exercise_id: ex.exerciseId,
          order_index: blockIdx * 100 + exIdx,
          sets: ex.sets || 1,
          reps: ex.reps || null,
          duration_seconds: ex.holdSeconds || null,
          rest_seconds: ex.restSeconds || null
        });
      });
    } else if (block.type === 'interval') {
      rows.push({
        workout_template_id: tpl.id,
        exercise_id: block.exerciseId || null,
        order_index: blockIdx * 100,
        sets: block.rounds,
        reps: null,
        duration_seconds: block.workSeconds,
        rest_seconds: block.restSeconds
      });
    } else if (block.type === 'flow') {
      block.poses.forEach((pose, poseIdx) => {
        rows.push({
          workout_template_id: tpl.id,
            exercise_id: pose.exerciseId,
            order_index: blockIdx * 100 + poseIdx,
            sets: 1,
            reps: null,
            duration_seconds: pose.holdSeconds || null,
            rest_seconds: null
        });
      });
    }
  });
  return rows;
}

async function seedTemplates() {
  const { data: existing, error } = await supabase
    .from('workout_templates')
    .select('id');
  if (error) {
    console.warn('Template seed: fetch existing failed', error.message);
    return { success: false, error: error.message };
  }
  const existingIds = new Set((existing || []).map(t => t.id));
  const baseInserts = workoutTemplates.filter(t => !existingIds.has(t.id)).map(t => ({
    id: t.id,
    name: t.title,
    category: t.category,
    difficulty: t.difficulty,
    estimated_duration_minutes: t.EstimatedDurationMinutes,
    metadata: null
  }));
  if (baseInserts.length) {
    const { error: insertErr } = await supabase.from('workout_templates').insert(baseInserts);
    if (insertErr) {
      return { success: false, error: insertErr.message };
    }
  }
  // Insert exercises for newly added templates
  const exerciseRows = workoutTemplates
    .filter(t => !existingIds.has(t.id))
    .flatMap(expandTemplateBlocks);
  if (exerciseRows.length) {
    const { error: exErr } = await supabase.from('workout_template_exercises').insert(exerciseRows);
    if (exErr) return { success: false, error: exErr.message };
  }
  return { success: true, inserted: baseInserts.length };
}

export async function seedWorkoutsIfNeeded() {
  try {
    const auth = await supabase.auth.getUser();
    if (!auth.data?.user) return { skipped: true, reason: 'no-auth' };
    const exRes = await seedExercises();
    const tplRes = await seedTemplates();
    return { success: true, exercises: exRes, templates: tplRes };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
