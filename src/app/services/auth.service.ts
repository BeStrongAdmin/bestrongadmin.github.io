import { Injectable, signal } from '@angular/core';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signInWithPopup,
  GoogleAuthProvider,
  signOut 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { FirebaseService } from './firebase.service';
import { environment } from '../../environments/environment';

export interface AdminProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  isSuperAdmin: boolean;
  isAdmin: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public currentUser = signal<AdminProfile | null>(null);
  public isLoading = signal<boolean>(true);

  constructor(private fb: FirebaseService) {
    onAuthStateChanged(this.fb.auth, async (user: User | null) => {
      this.isLoading.set(true);
      if (user) {
        const isSuper = user.uid === environment.superAdminUid;
        let isAdm = isSuper;

        if (!isSuper) {
          try {
            const adminDocRef = doc(this.fb.firestore, 'admins', user.uid);
            const adminSnap = await getDoc(adminDocRef);
            if (adminSnap.exists() && adminSnap.data()['active'] === true) {
              isAdm = true;
            }
          } catch (err) {
            console.error('Error verificando rol de administrador:', err);
          }
        }

        if (isAdm) {
          this.currentUser.set({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email?.split('@')[0] || 'Admin',
            isSuperAdmin: isSuper,
            isAdmin: isAdm
          });
        } else {
          // No es administrador autorizado
          await signOut(this.fb.auth);
          this.currentUser.set(null);
        }
      } else {
        this.currentUser.set(null);
      }
      this.isLoading.set(false);
    });
  }

  async login(email: string, pass: string): Promise<AdminProfile> {
    const cred = await signInWithEmailAndPassword(this.fb.auth, email, pass);
    const user = cred.user;
    const isSuper = user.uid === environment.superAdminUid;
    let isAdm = isSuper;

    if (!isSuper) {
      const adminDocRef = doc(this.fb.firestore, 'admins', user.uid);
      const adminSnap = await getDoc(adminDocRef);
      if (adminSnap.exists() && adminSnap.data()['active'] === true) {
        isAdm = true;
      }
    }

    if (!isAdm) {
      await signOut(this.fb.auth);
      throw new Error('Acceso denegado: Tu cuenta no tiene permisos de administrador en BeStrong.');
    }

    const profile: AdminProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0] || 'Admin',
      isSuperAdmin: isSuper,
      isAdmin: true
    };
    this.currentUser.set(profile);
    return profile;
  }

  async loginWithGoogle(): Promise<AdminProfile> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const cred = await signInWithPopup(this.fb.auth, provider);
    const user = cred.user;
    const isSuper = user.uid === environment.superAdminUid;
    let isAdm = isSuper;

    if (!isSuper) {
      const adminDocRef = doc(this.fb.firestore, 'admins', user.uid);
      const adminSnap = await getDoc(adminDocRef);
      if (adminSnap.exists() && adminSnap.data()['active'] === true) {
        isAdm = true;
      }
    }

    if (!isAdm) {
      await signOut(this.fb.auth);
      throw new Error(`Acceso denegado: Tu cuenta de Google (${user.email || user.uid}) no está autorizada como administrador en BeStrong.`);
    }

    const profile: AdminProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0] || 'Admin',
      isSuperAdmin: isSuper,
      isAdmin: true
    };
    this.currentUser.set(profile);
    return profile;
  }

  async logout(): Promise<void> {
    await signOut(this.fb.auth);
    this.currentUser.set(null);
  }
}
