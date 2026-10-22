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

const FIRESTORE_TIMEOUT_MS = 3000;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public currentUser = signal<AdminProfile | null>(null);
  public isLoading = signal<boolean>(true);

  private authReadyResolve?: () => void;
  public authReadyPromise = new Promise<void>((resolve) => {
    this.authReadyResolve = resolve;
  });

  constructor(private fb: FirebaseService) {
    onAuthStateChanged(this.fb.auth, async (user: User | null) => {
      try {
        if (user) {
          const isSuper = user.uid === environment.superAdminUid;
          let isAdm = isSuper;

          if (!isSuper) {
            try {
              const adminDocRef = doc(this.fb.firestore, 'admins', user.uid);
              // Timeout seguro para que no se quede colgado si Firestore no responde
              const adminSnap = await Promise.race([
                getDoc(adminDocRef),
                new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Timeout de Firestore')), FIRESTORE_TIMEOUT_MS))
              ]);
              if (adminSnap && adminSnap.exists() && adminSnap.data()['active'] === true) {
                isAdm = true;
              }
            } catch (err) {
              console.warn('Verificación secundaria de admin no completada:', err);
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
            await signOut(this.fb.auth);
            this.currentUser.set(null);
          }
        } else {
          this.currentUser.set(null);
        }
      } catch (e) {
        console.error('Error procesando cambio de autenticación:', e);
        this.currentUser.set(null);
      } finally {
        this.isLoading.set(false);
        this.authReadyResolve?.();
      }
    });
  }

  async login(email: string, pass: string): Promise<AdminProfile> {
    const cred = await signInWithEmailAndPassword(this.fb.auth, email, pass);
    const user = cred.user;
    const isSuper = user.uid === environment.superAdminUid;
    let isAdm = isSuper;

    if (!isSuper) {
      try {
        const adminDocRef = doc(this.fb.firestore, 'admins', user.uid);
        const adminSnap = await Promise.race([
          getDoc(adminDocRef),
          new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Timeout')), FIRESTORE_TIMEOUT_MS))
        ]);
        if (adminSnap && adminSnap.exists() && adminSnap.data()['active'] === true) {
          isAdm = true;
        }
      } catch (err) {
        console.warn('Error verificando admin en Firestore:', err);
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
    this.isLoading.set(false);
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
      try {
        const adminDocRef = doc(this.fb.firestore, 'admins', user.uid);
        const adminSnap = await Promise.race([
          getDoc(adminDocRef),
          new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Timeout')), FIRESTORE_TIMEOUT_MS))
        ]);
        if (adminSnap && adminSnap.exists() && adminSnap.data()['active'] === true) {
          isAdm = true;
        }
      } catch (err) {
        console.warn('Error verificando admin en Firestore:', err);
      }
    }

    if (!isAdm) {
      await signOut(this.fb.auth);
      throw new Error(`Acceso denegado: La cuenta de Google (${user.email || user.uid}) no está autorizada como administrador.`);
    }

    const profile: AdminProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0] || 'Admin',
      isSuperAdmin: isSuper,
      isAdmin: true
    };
    this.currentUser.set(profile);
    this.isLoading.set(false);
    return profile;
  }

  async logout(): Promise<void> {
    await signOut(this.fb.auth);
    this.currentUser.set(null);
  }
}
