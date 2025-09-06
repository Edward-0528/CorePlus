import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { localWorkoutService } from '../services/localWorkoutService';
import { workoutPersistenceService } from '../services/workoutPersistenceService';
import { haptic } from '../utils/haptics';

const WorkoutSessionContext = createContext(null);

// Simple in-memory persistence placeholder (could wire Supabase later)
const SESSION_STORAGE_KEY = 'ACTIVE_WORKOUT_SESSION_V1';

export const WorkoutSessionProvider = ({ children }) => {
  const [activeSession, setActiveSession] = useState(null); // { templateId, phase, blockIndex, exerciseIndex, setIndex, timers }
  const [timer, setTimer] = useState({ mode: 'idle', remaining: 0, total: 0 });
  const [performedSets, setPerformedSets] = useState([]); // {exerciseId,setIndex,reps,weight,durationMs,timestamp}
  const intervalRef = useRef(null);

  // Load persisted session
  useEffect(() => {
    try {
      const raw = global.__WORKOUT_SESSION_CACHE;
      if (raw) {
        const parsed = raw;
        if (parsed?.templateId && !activeSession) {
          setActiveSession(parsed.activeSession);
          setPerformedSets(parsed.performedSets || []);
        }
      }
    } catch (e) {}
  }, []);

  // Persist on change
  useEffect(() => {
    if (activeSession) {
      global.__WORKOUT_SESSION_CACHE = { activeSession, performedSets };
    } else {
      global.__WORKOUT_SESSION_CACHE = null;
    }
  }, [activeSession, performedSets]);

  // Tick logic
  useEffect(() => {
    if (timer.mode === 'idle' || timer.remaining <= 0) return;
    intervalRef.current = setInterval(() => {
      setTimer(prev => {
        const next = { ...prev, remaining: Math.max(0, prev.remaining - 1000) };
        if (next.remaining === 0) {
          // Auto advance on completion for rest or flow hold
          handleTimerComplete(next.mode);
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [timer.mode]);

  const startSession = (templateId) => {
    const expanded = localWorkoutService.expandTemplate(templateId);
    if (!expanded) return { success: false, error: 'Template not found' };
    setActiveSession({
      templateId,
      template: expanded,
      blockIndex: 0,
      exerciseIndex: 0,
      setIndex: 0,
      startedAt: Date.now(),
      completed: false
    });
    return { success: true };
  };

  const currentBlock = activeSession ? activeSession.template.blocks[activeSession.blockIndex] : null;

  const getCurrentItem = () => {
    if (!activeSession || !currentBlock) return null;
    if (currentBlock.type === 'straight') {
      const item = currentBlock.exercises[activeSession.exerciseIndex];
      return { ...item, mode: 'strength' };
    }
    if (currentBlock.type === 'interval') {
      return { ...currentBlock, mode: 'interval' };
    }
    if (currentBlock.type === 'flow') {
      const item = currentBlock.poses[activeSession.exerciseIndex];
      return { ...item, mode: 'flow' };
    }
    return null;
  };

  const handleTimerComplete = (mode) => {
    haptic.medium();
    if (mode === 'rest' || mode === 'hold' || mode === 'work') {
      advance();
    }
  };

  const startRest = (seconds) => {
    haptic.light();
    setTimer({ mode: 'rest', remaining: seconds * 1000, total: seconds * 1000 });
  };

  const startHold = (seconds) => {
    haptic.light();
    setTimer({ mode: 'hold', remaining: seconds * 1000, total: seconds * 1000 });
  };

  const startWorkInterval = (workSeconds) => {
    haptic.light();
    setTimer({ mode: 'work', remaining: workSeconds * 1000, total: workSeconds * 1000 });
  };

  const clearTimer = () => setTimer({ mode: 'idle', remaining: 0, total: 0 });

  const advance = () => {
    // allow external pre-advance hook later
    clearTimer();
    if (!activeSession) return;
    const session = { ...activeSession };
    const block = session.template.blocks[session.blockIndex];

    if (block.type === 'straight') {
      const item = block.exercises[session.exerciseIndex];
      if (session.setIndex + 1 < item.sets) {
        session.setIndex += 1;
        setActiveSession(session);
        startRest(item.restSeconds || 45);
        return;
      }
      // move to next exercise
      session.setIndex = 0;
      if (session.exerciseIndex + 1 < block.exercises.length) {
        session.exerciseIndex += 1;
        setActiveSession(session);
        return;
      }
    } else if (block.type === 'flow') {
      if (session.exerciseIndex + 1 < block.poses.length) {
        session.exerciseIndex += 1;
        setActiveSession(session);
        const nextPose = block.poses[session.exerciseIndex];
        startHold(nextPose.holdSeconds || nextPose.exercise?.defaultHoldSeconds || 30);
        return;
      }
    } else if (block.type === 'interval') {
      // Decrement rounds
      if (!session.intervalRound) session.intervalRound = 1;
      if (session.intervalPhase !== 'rest') {
        // finished work -> start rest
        session.intervalPhase = 'rest';
        setActiveSession(session);
        setTimer({ mode: 'rest', remaining: block.restSeconds * 1000, total: block.restSeconds * 1000 });
        return;
      } else {
        // finished rest -> next round or next block
        if (session.intervalRound < block.rounds) {
          session.intervalRound += 1;
          session.intervalPhase = 'work';
          setActiveSession(session);
          startWorkInterval(block.workSeconds);
          return;
        }
      }
    }

    // Move to next block
    if (session.blockIndex + 1 < session.template.blocks.length) {
      session.blockIndex += 1;
      session.exerciseIndex = 0;
      session.setIndex = 0;
      delete session.intervalRound;
      delete session.intervalPhase;
      setActiveSession(session);
      const newBlock = session.template.blocks[session.blockIndex];
      if (newBlock.type === 'flow') {
        const firstPose = newBlock.poses[0];
        startHold(firstPose.holdSeconds || firstPose.exercise?.defaultHoldSeconds || 30);
      } else if (newBlock.type === 'interval') {
        session.intervalRound = 1;
        session.intervalPhase = 'work';
        setActiveSession(session);
        startWorkInterval(newBlock.workSeconds);
      }
      return;
    }

    // Completed session
    session.completed = true;
    session.completedAt = Date.now();
    setActiveSession(session);
  };

  const startTemplate = (templateId) => {
    const res = startSession(templateId);
    if (res.success) {
      const block = localWorkoutService.expandTemplate(templateId).blocks[0];
      if (block.type === 'flow') {
        const firstPose = block.poses[0];
        startHold(firstPose.holdSeconds || firstPose.exercise?.defaultHoldSeconds || 30);
      } else if (block.type === 'interval') {
        setActiveSession(prev => ({ ...prev, intervalRound: 1, intervalPhase: 'work' }));
        startWorkInterval(block.workSeconds);
      }
    }
    return res;
  };

  const logSet = ({ exerciseId, setIndex, reps, weight, durationMs }) => {
    setPerformedSets(prev => [...prev, { exerciseId, setIndex, reps, weight, durationMs, timestamp: Date.now() }]);
  };

  const getExerciseSetLogs = (exerciseId) => performedSets.filter(s => s.exerciseId === exerciseId);

  const completeSession = async () => {
    if (!activeSession) return;
    const completed = { ...activeSession, completed: true, completedAt: Date.now() };
    setActiveSession(completed);
    // Fire and forget persistence (could show status later)
    workoutPersistenceService.persistCompletedSession(completed, performedSets);
  };

  const stopSession = () => {
    setActiveSession(null);
    setPerformedSets([]);
    clearTimer();
  };

  // Mini session summary
  const getProgressSummary = () => {
    if (!activeSession) return null;
    const { template, blockIndex, exerciseIndex, setIndex } = activeSession;
    const totalBlocks = template.blocks.length;
    return {
      block: blockIndex + 1,
      totalBlocks,
      exerciseIndex: exerciseIndex + 1,
      currentBlockType: template.blocks[blockIndex].type,
      setIndex: setIndex + 1
    };
  };

  const value = {
    activeSession,
    timer,
    startTemplate,
    advance,
    currentItem: getCurrentItem(),
    clearTimer,
    logSet,
    getExerciseSetLogs,
    performedSets,
    completeSession,
    stopSession,
    progress: getProgressSummary()
  };

  return (
    <WorkoutSessionContext.Provider value={value}>
      {children}
    </WorkoutSessionContext.Provider>
  );
};

export const useWorkoutSession = () => useContext(WorkoutSessionContext);
