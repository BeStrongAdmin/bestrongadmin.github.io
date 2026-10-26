import { Injectable } from '@angular/core';
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  limit 
} from 'firebase/firestore';
import { FirebaseService } from './firebase.service';
import { RoutineService } from './routine.service';

export interface AppUser {
  uid: string;
  email?: string;
  displayName?: string;
  username?: string;
  photoURL?: string;
  createdAt?: string | number;
  xp?: number;
  level?: number;
}

export interface AdminUserRecord {
  uid: string;
  email: string;
  name: string;
  role: 'superadmin' | 'admin';
  active: boolean;
  requestStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  phone?: string;
  createdBy: string;
  createdAt: number;
  routinesCreatedCount?: number;
  traineesCount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserManagementService {
  constructor(
    private fb: FirebaseService,
    private routineService: RoutineService
  ) {}

  async listRegisteredUsers(maxLimit = 100): Promise<AppUser[]> {
    const colRef = collection(this.fb.firestore, 'users');
    const q = query(colRef, limit(maxLimit));
    const snap = await getDocs(q);
    const users: AppUser[] = [];
    snap.forEach(d => {
      const data = d.data();
      users.push({
        uid: d.id,
        email: data['email'] || '',
        displayName: data['displayName'] || data['username'] || 'Usuario BeStrong',
        username: data['username'] || '',
        photoURL: data['photoURL'] || '',
        createdAt: data['createdAt'],
        xp: data['xp'] || 0,
        level: data['level'] || 1
      });
    });
    return users;
  }

  async listAdmins(): Promise<AdminUserRecord[]> {
    try {
      const colRef = collection(this.fb.firestore, 'admins');
      const snap = await getDocs(colRef);
      const admins: AdminUserRecord[] = [];
      snap.forEach(d => {
        const data = d.data();
        admins.push({
          uid: d.id,
          email: data['email'] || '',
          name: data['name'] || 'Admin',
          role: data['role'] || 'admin',
          active: data['active'] ?? true,
          requestStatus: data['requestStatus'] || (data['active'] ? 'approved' : 'pending'),
          phone: data['phone'] || '',
          createdBy: data['createdBy'] || '',
          createdAt: data['createdAt'] || Date.now()
        });
      });

      // Añadir métricas por cada admin
      try {
        const routines = await this.routineService.listRoutines(undefined, true);
        for (const adm of admins) {
          const adminRoutines = routines.filter(r => r.createdBy === adm.uid);
          adm.routinesCreatedCount = adminRoutines.length;
          const uniqueAthletes = new Set<string>();
          adminRoutines.forEach(r => {
            r.trainees?.forEach(t => {
              const key = (t.uid && t.uid !== 'anonimo') 
                ? t.uid 
                : (t.email ? t.email.toLowerCase().trim() : (t.name || 'anonimo'));
              uniqueAthletes.add(key);
            });
          });
          adm.traineesCount = uniqueAthletes.size > 0 
            ? uniqueAthletes.size 
            : adminRoutines.reduce((acc, r) => acc + (r.timesRedeemed || 0), 0);
        }
      } catch (e) {
        console.warn('Error calculando métricas de rutinas:', e);
      }

      return admins;
    } catch (err) {
      console.warn('No se pudo leer la colección /admins (puede que aún no tenga reglas o documentos):', err);
      return [];
    }
  }

  async promoteToAdmin(user: AppUser, superAdminUid: string): Promise<void> {
    const adminRef = doc(this.fb.firestore, 'admins', user.uid);
    const newAdmin: AdminUserRecord = {
      uid: user.uid,
      email: user.email || '',
      name: user.displayName || user.username || 'Admin',
      role: 'admin',
      active: true,
      requestStatus: 'approved',
      createdBy: superAdminUid,
      createdAt: Date.now()
    };
    await setDoc(adminRef, newAdmin);
  }

  async setAdminActiveStatus(adminUid: string, active: boolean): Promise<void> {
    const adminRef = doc(this.fb.firestore, 'admins', adminUid);
    await updateDoc(adminRef, { 
      active,
      requestStatus: active ? 'approved' : 'rejected'
    });
  }

  async revokeAdmin(adminUid: string): Promise<void> {
    const adminRef = doc(this.fb.firestore, 'admins', adminUid);
    await deleteDoc(adminRef);
  }
}
