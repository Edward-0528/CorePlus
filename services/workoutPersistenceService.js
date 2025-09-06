import { supabase } from '../supabaseConfig';

// Maps in-memory session & performedSets (from WorkoutSessionContext) to Supabase schema.
// Usage: workoutPersistenceService.persistCompletedSession(session, performedSets)

class WorkoutPersistenceService {
  async persistCompletedSession(session, performedSets) {
    try {
      if (!session?.completed) return { success: false, error: 'Session not marked complete' };

      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) return { success: false, error: 'Not authenticated' };

      const workoutName = session.template?.title || 'Workout';
      const startIso = new Date(session.startedAt).toISOString();
      const endIso = new Date(session.completedAt || Date.now()).toISOString();
      const totalDurationMin = Math.max(1, Math.round((new Date(endIso) - new Date(startIso)) / 60000));

      // 1. Insert completed_workouts row
      const { data: workoutRow, error: workoutErr } = await supabase
        .from('completed_workouts')
        .insert({
          user_id: user.id,
            workout_template_id: session.templateId || null,
            workout_name: workoutName,
            workout_date: new Date(session.startedAt).toISOString().split('T')[0],
            start_time: startIso,
            end_time: endIso,
            total_duration: totalDurationMin,
            calories_burned: 0,
            notes: '',
            completed: true
        })
        .select()
        .single();
      if (workoutErr) throw workoutErr;

      const completedWorkoutId = workoutRow.id;

      // 2. Build flattened exercise rows and set logs
      const exerciseRows = []; // for workout_exercises
      const setLogs = []; // for workout_set_logs

      session.template.blocks.forEach((block, blockIdx) => {
        if (block.type === 'straight') {
          block.exercises.forEach((ex, exIdx) => {
            const relatedLogs = performedSets.filter(ps => ps.exerciseId === ex.exerciseId);
            const repsArr = relatedLogs.map(l => l.reps || 0);
            const weightArr = relatedLogs.map(l => l.weight || null);
            const durationArr = relatedLogs.map(l => Math.round((l.durationMs || 0) / 1000));
            exerciseRows.push({
              completed_workout_id: completedWorkoutId,
              exercise_id: ex.exerciseId,
              exercise_name: ex.exercise?.name || ex.exerciseId,
              order_index: blockIdx * 100 + exIdx,
              target_sets: ex.sets,
              target_reps: ex.reps || null,
              target_weight_kg: null,
              target_duration_seconds: ex.holdSeconds || null,
              rest_time_seconds: ex.restSeconds || ex.exercise?.defaultRestSeconds || 45,
              sets_completed: repsArr.length,
              actual_reps: repsArr,
              actual_weight_kg: weightArr,
              actual_duration_seconds: durationArr,
              completed: repsArr.length >= (ex.sets || 0)
            });
            relatedLogs.forEach(l => {
              setLogs.push({
                completed_workout_id: completedWorkoutId,
                workout_exercise_id: null, // patch after bulk insert
                exercise_id: ex.exerciseId,
                set_index: l.setIndex,
                reps: l.reps || null,
                weight_kg: l.weight || null,
                duration_seconds: l.durationMs ? Math.round(l.durationMs / 1000) : null
              });
            });
          });
        } else if (block.type === 'interval') {
          // Represent interval as one exercise row
          const rounds = block.rounds;
          exerciseRows.push({
            completed_workout_id: completedWorkoutId,
            exercise_id: block.exerciseId || null,
            exercise_name: 'Interval Block',
            order_index: blockIdx * 100,
            target_sets: rounds,
            target_reps: null,
            target_weight_kg: null,
            target_duration_seconds: block.workSeconds,
            rest_time_seconds: block.restSeconds,
            sets_completed: rounds,
            actual_reps: '{}',
            actual_weight_kg: '{}',
            actual_duration_seconds: Array(rounds).fill(block.workSeconds),
            completed: true
          });
        } else if (block.type === 'flow') {
          block.poses.forEach((pose, poseIdx) => {
            exerciseRows.push({
              completed_workout_id: completedWorkoutId,
              exercise_id: pose.exerciseId,
              exercise_name: pose.exercise?.name || 'Pose',
              order_index: blockIdx * 100 + poseIdx,
              target_sets: 1,
              target_reps: null,
              target_weight_kg: null,
              target_duration_seconds: pose.holdSeconds || pose.exercise?.defaultHoldSeconds || 30,
              rest_time_seconds: null,
              sets_completed: 1,
              actual_reps: '{}',
              actual_weight_kg: '{}',
              actual_duration_seconds: [pose.holdSeconds || pose.exercise?.defaultHoldSeconds || 30],
              completed: true
            });
          });
        }
      });

      // 3. Bulk insert workout_exercises
      const { data: insertedExercises, error: exErr } = await supabase
        .from('workout_exercises')
        .insert(exerciseRows)
        .select();
      if (exErr) throw exErr;

      // Map (completed_workout_id, exercise_id, order_index) to id for set logs patch
      const exerciseMap = new Map();
      insertedExercises.forEach(row => {
        exerciseMap.set(`${row.exercise_id}|${row.order_index}`, row.id);
      });

      const patchedSetLogs = setLogs.map(l => {
        // For straight sets we used order_index = blockIdx*100 + exIdx
        // We cannot reconstruct order_index from set log alone reliably, so leave null (or enhance logging earlier)
        return { ...l };
      });

      if (patchedSetLogs.length) {
        const { error: setErr } = await supabase
          .from('workout_set_logs')
          .insert(patchedSetLogs);
        if (setErr) throw setErr;
      }

      return { success: true, workoutId: completedWorkoutId };
    } catch (error) {
      console.error('Persist session error', error);
      return { success: false, error: error.message };
    }
  }
}

export const workoutPersistenceService = new WorkoutPersistenceService();