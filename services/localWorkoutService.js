import { exercises, workoutTemplates } from './workoutData';

class LocalWorkoutService {
  listTemplates(category) {
    return workoutTemplates.filter(t => !category || t.category.toLowerCase() === category.toLowerCase());
  }
  listExercises(type) {
    return exercises.filter(e => !type || e.type === type);
  }
  getTemplate(id) { return workoutTemplates.find(t => t.id === id) || null; }
  getExercise(id) { return exercises.find(e => e.id === id) || null; }
  expandTemplate(id) {
    const tpl = this.getTemplate(id);
    if (!tpl) return null;
    return {
      ...tpl,
      blocks: tpl.blocks.map(b => {
        if (b.exercises) return { ...b, exercises: b.exercises.map(x => ({ ...x, exercise: this.getExercise(x.exerciseId) })) };
        if (b.poses) return { ...b, poses: b.poses.map(x => ({ ...x, exercise: this.getExercise(x.exerciseId) })) };
        return b;
      })
    };
  }
}

export const localWorkoutService = new LocalWorkoutService();
