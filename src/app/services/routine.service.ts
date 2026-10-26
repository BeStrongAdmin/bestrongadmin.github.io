import { Injectable } from '@angular/core';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc,
  deleteDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { FirebaseService } from './firebase.service';

export interface RoutineTrainee {
  uid: string;
  name: string;
  email?: string;
  photoURL?: string;
  redeemedAtMs: number;
  lastWorkoutMs?: number;
  workoutsCount?: number;
  totalVolumeKg?: number;
  currentStreak?: number;
  recentPRs?: Record<string, { weight: number; reps: number; e1rm: number; exerciseName?: string; date?: string }>;
  lastSession?: {
    date: string;
    dayName: string;
    durationSeconds: number;
    volumeKg: number;
    exercisesCount: number;
  };
}

export interface WorkoutLogRecord {
  id: string;
  athleteUid: string;
  athleteName: string;
  routineCode: string;
  routineName: string;
  dayIndex: number;
  dayName: string;
  date: string;
  timestampMs: number;
  durationSeconds: number;
  totalVolumeKg: number;
  totalSets: number;
  totalReps: number;
  muscleDistribution?: Record<string, number>;
  exerciseTypeDistribution?: {
    freeWeights: number;
    cables: number;
    machines: number;
    bodyweight: number;
  };
  exercises: Array<{
    exerciseId: string;
    name: string;
    weight: number;
    reps: number;
    sets: number;
    e1rm?: number;
    equipment?: string;
  }>;
}

export interface AssignedRoutineRecord {
  code: string;
  routineName: string;
  daysCount: number;
  routine: any;
  createdAtMs: number;
  expiresAtMs: number | null;
  isIndefinite?: boolean;
  createdBy: string;
  createdByName?: string;
  timesRedeemed: number;
  trainees?: RoutineTrainee[];
  updatedAtMs?: number;
}

const COLLECTION_NAME = 'assigned_routines';
const TWO_MONTHS_MS = 60 * 24 * 60 * 60 * 1000; // 60 días

@Injectable({
  providedIn: 'root'
})
export class RoutineService {
  constructor(private fb: FirebaseService) {}

  generateRandomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = 'BST-';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async createAssignedRoutine(
    code: string,
    routineName: string,
    routine: any,
    adminUid: string,
    adminName?: string,
    isIndefinite: boolean = false
  ): Promise<{ success: boolean; code: string; expiresAt: Date | null; isIndefinite: boolean }> {
    const cleanCode = code.toUpperCase().trim();
    if (!cleanCode || cleanCode.length < 4) {
      throw new Error('El código debe tener al menos 4 caracteres.');
    }

    const docRef = doc(this.fb.firestore, COLLECTION_NAME, cleanCode);
    const existing = await getDoc(docRef);
    if (existing.exists()) {
      throw new Error(`El código "${cleanCode}" ya está en uso. Genera otro.`);
    }

    const now = Date.now();
    const expiresAtMs = isIndefinite ? null : (now + TWO_MONTHS_MS);

    const completeRoutine = {
      ...routine,
      name: routineName,
      schemaVersion: 'bestrong_v2',
      isCustomAssigned: true,
      assignedCode: cleanCode,
      isIndefinite,
      createdAt: new Date(now).toISOString(),
    };

    const docData: AssignedRoutineRecord = {
      code: cleanCode,
      routineName,
      daysCount: routine.days?.length || routine.config?.days || 3,
      routine: completeRoutine,
      createdAtMs: now,
      expiresAtMs,
      isIndefinite,
      createdBy: adminUid,
      createdByName: adminName || 'Admin',
      timesRedeemed: 0,
    };

    await setDoc(docRef, docData);

    return {
      success: true,
      code: cleanCode,
      expiresAt: expiresAtMs ? new Date(expiresAtMs) : null,
      isIndefinite
    };
  }

  async toggleRoutineIndefinite(code: string, makeIndefinite: boolean): Promise<{ isIndefinite: boolean; expiresAtMs: number | null }> {
    const docRef = doc(this.fb.firestore, COLLECTION_NAME, code);
    const now = Date.now();
    const expiresAtMs = makeIndefinite ? null : (now + TWO_MONTHS_MS);
    await updateDoc(docRef, {
      isIndefinite: makeIndefinite,
      expiresAtMs,
      updatedAtMs: now
    });
    return { isIndefinite: makeIndefinite, expiresAtMs };
  }

  async listRoutines(adminUid?: string, isSuperAdmin = false): Promise<AssignedRoutineRecord[]> {
    const colRef = collection(this.fb.firestore, COLLECTION_NAME);
    let q;
    if (isSuperAdmin || !adminUid) {
      q = query(colRef);
    } else {
      q = query(colRef, where('createdBy', '==', adminUid));
    }

    const snap = await getDocs(q);
    const list: AssignedRoutineRecord[] = [];
    snap.forEach(d => {
      list.push(d.data() as AssignedRoutineRecord);
    });

    return list.sort((a, b) => b.createdAtMs - a.createdAtMs);
  }

  async deleteRoutine(code: string): Promise<void> {
    const docRef = doc(this.fb.firestore, COLLECTION_NAME, code);
    await deleteDoc(docRef);
  }

  async getWorkoutLogsForRoutine(code: string): Promise<WorkoutLogRecord[]> {
    try {
      const logsCol = collection(this.fb.firestore, COLLECTION_NAME, code, 'workout_logs');
      const q = query(logsCol, orderBy('timestampMs', 'desc'));
      const snap = await getDocs(q);
      const list: WorkoutLogRecord[] = [];
      snap.forEach(d => {
        list.push({ id: d.id, ...d.data() } as WorkoutLogRecord);
      });
      return list;
    } catch (e) {
      console.warn('No se pudieron consultar workout_logs:', e);
      return [];
    }
  }
}
