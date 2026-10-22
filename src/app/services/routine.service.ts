import { Injectable } from '@angular/core';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { FirebaseService } from './firebase.service';

export interface AssignedRoutineRecord {
  code: string;
  routineName: string;
  daysCount: number;
  routine: any;
  createdAtMs: number;
  expiresAtMs: number;
  createdBy: string;
  createdByName?: string;
  timesRedeemed: number;
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
    adminName?: string
  ): Promise<{ success: boolean; code: string; expiresAt: Date }> {
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
    const expiresAtMs = now + TWO_MONTHS_MS;

    const completeRoutine = {
      ...routine,
      name: routineName,
      schemaVersion: 'bestrong_v2',
      isCustomAssigned: true,
      assignedCode: cleanCode,
      createdAt: new Date(now).toISOString(),
    };

    const docData: AssignedRoutineRecord = {
      code: cleanCode,
      routineName,
      daysCount: routine.days?.length || routine.config?.days || 3,
      routine: completeRoutine,
      createdAtMs: now,
      expiresAtMs,
      createdBy: adminUid,
      createdByName: adminName || 'Admin',
      timesRedeemed: 0,
    };

    await setDoc(docRef, docData);

    return {
      success: true,
      code: cleanCode,
      expiresAt: new Date(expiresAtMs)
    };
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
}
