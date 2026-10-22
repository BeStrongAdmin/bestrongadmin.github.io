import { Injectable, signal } from '@angular/core';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  signOut 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { FirebaseService } from './firebase.service';
import { environment } from '../../environments/environment';

export interface AdminProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  requestStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  phone?: string;
}

const FIRESTORE_TIMEOUT_MS = 3500;
const ADMIN_NOTIFICATION_EMAIL = 'behealthlyapp@gmail.com';

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
          let requestStatus: 'none' | 'pending' | 'approved' | 'rejected' = isSuper ? 'approved' : 'none';
          let phone = '';

          if (!isSuper) {
            try {
              const adminDocRef = doc(this.fb.firestore, 'admins', user.uid);
              const adminSnap = await Promise.race([
                getDoc(adminDocRef),
                new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Timeout de Firestore')), FIRESTORE_TIMEOUT_MS))
              ]);
              if (adminSnap && adminSnap.exists()) {
                const data = adminSnap.data();
                if (data['active'] === true) {
                  isAdm = true;
                  requestStatus = 'approved';
                } else {
                  requestStatus = data['requestStatus'] || 'pending';
                }
                phone = data['phone'] || '';
              }
            } catch (err) {
              console.warn('Verificación secundaria de admin no completada:', err);
            }
          }

          this.currentUser.set({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email?.split('@')[0] || 'Coach',
            isSuperAdmin: isSuper,
            isAdmin: isAdm,
            requestStatus,
            phone
          });
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
    let requestStatus: 'none' | 'pending' | 'approved' | 'rejected' = isSuper ? 'approved' : 'none';
    let phone = '';

    if (!isSuper) {
      try {
        const adminDocRef = doc(this.fb.firestore, 'admins', user.uid);
        const adminSnap = await Promise.race([
          getDoc(adminDocRef),
          new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Timeout')), FIRESTORE_TIMEOUT_MS))
        ]);
        if (adminSnap && adminSnap.exists()) {
          const data = adminSnap.data();
          if (data['active'] === true) {
            isAdm = true;
            requestStatus = 'approved';
          } else {
            requestStatus = data['requestStatus'] || 'pending';
          }
          phone = data['phone'] || '';
        }
      } catch (err) {
        console.warn('Error verificando admin en Firestore:', err);
      }
    }

    const profile: AdminProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0] || 'Coach',
      isSuperAdmin: isSuper,
      isAdmin: isAdm,
      requestStatus,
      phone
    };
    this.currentUser.set(profile);
    this.isLoading.set(false);
    return profile;
  }

  async register(email: string, pass: string, displayName: string, phone?: string): Promise<AdminProfile> {
    const cred = await createUserWithEmailAndPassword(this.fb.auth, email, pass);
    const user = cred.user;

    if (displayName) {
      try {
        await updateProfile(user, { displayName });
      } catch (e) {
        console.warn('No se pudo actualizar el nombre de perfil:', e);
      }
    }

    // Guardar registro inicial en /admins/{uid} como pendiente
    try {
      const adminDocRef = doc(this.fb.firestore, 'admins', user.uid);
      await setDoc(adminDocRef, {
        uid: user.uid,
        email: user.email,
        name: displayName || user.email?.split('@')[0] || 'Coach',
        phone: phone || '',
        role: 'admin',
        active: false, // Inactivo hasta que el Superadmin apruebe
        requestStatus: 'pending',
        requestedAtMs: Date.now(),
        createdAt: Date.now()
      }, { merge: true });
    } catch (e) {
      console.warn('No se pudo registrar documento en Firestore admins:', e);
    }

    // Notificar por correo al Superadmin
    void this.notifySuperadminNewCoach(displayName, user.email || '', phone);

    const profile: AdminProfile = {
      uid: user.uid,
      email: user.email,
      displayName: displayName || user.email?.split('@')[0] || 'Coach',
      isSuperAdmin: false,
      isAdmin: false,
      requestStatus: 'pending',
      phone: phone
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
    let requestStatus: 'none' | 'pending' | 'approved' | 'rejected' = isSuper ? 'approved' : 'none';
    let phone = '';

    if (!isSuper) {
      try {
        const adminDocRef = doc(this.fb.firestore, 'admins', user.uid);
        const adminSnap = await Promise.race([
          getDoc(adminDocRef),
          new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Timeout')), FIRESTORE_TIMEOUT_MS))
        ]);

        if (adminSnap && adminSnap.exists()) {
          const data = adminSnap.data();
          if (data['active'] === true) {
            isAdm = true;
            requestStatus = 'approved';
          } else {
            requestStatus = data['requestStatus'] || 'pending';
          }
          phone = data['phone'] || '';
        } else {
          // Usuario nuevo con Google: Registrar como coach pendiente
          requestStatus = 'pending';
          await setDoc(adminDocRef, {
            uid: user.uid,
            email: user.email,
            name: user.displayName || user.email?.split('@')[0] || 'Coach Google',
            phone: '',
            role: 'admin',
            active: false,
            requestStatus: 'pending',
            requestedAtMs: Date.now(),
            createdAt: Date.now()
          }, { merge: true });

          void this.notifySuperadminNewCoach(user.displayName || 'Coach Google', user.email || '', '');
        }
      } catch (err) {
        console.warn('Error verificando admin en Firestore:', err);
      }
    }

    const profile: AdminProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0] || 'Coach',
      isSuperAdmin: isSuper,
      isAdmin: isAdm,
      requestStatus,
      phone
    };
    this.currentUser.set(profile);
    this.isLoading.set(false);
    return profile;
  }

  async requestAdminAccess(phone?: string): Promise<void> {
    const cur = this.currentUser();
    if (!cur) throw new Error('Debes iniciar sesión para solicitar permisos.');

    try {
      const adminDocRef = doc(this.fb.firestore, 'admins', cur.uid);
      await setDoc(adminDocRef, {
        uid: cur.uid,
        email: cur.email,
        name: cur.displayName,
        phone: phone || cur.phone || '',
        active: false,
        requestStatus: 'pending',
        requestedAtMs: Date.now()
      }, { merge: true });

      // Notificar por correo
      await this.notifySuperadminNewCoach(cur.displayName || '', cur.email || '', phone || cur.phone);

      this.currentUser.set({
        ...cur,
        requestStatus: 'pending',
        phone: phone || cur.phone
      });
    } catch (err: any) {
      console.error('Error al solicitar permiso de admin:', err);
      throw new Error(err.message || 'No se pudo enviar la solicitud.');
    }
  }

  private async notifySuperadminNewCoach(name: string, email: string, phone?: string): Promise<void> {
    try {
      // 1. Guardar en colección de solicitudes en Firestore
      const user = this.fb.auth.currentUser;
      if (user) {
        const reqDocRef = doc(this.fb.firestore, 'coach_requests', user.uid);
        await setDoc(reqDocRef, {
          uid: user.uid,
          name: name || user.displayName || 'Coach',
          email: email || user.email,
          phone: phone || '',
          requestedAt: new Date().toISOString(),
          requestedAtMs: Date.now(),
          status: 'pending'
        }, { merge: true }).catch(() => {});
      }

      // 2. Disparo de notificación por correo a behealthlyapp@gmail.com vía FormSubmit AJAX
      await fetch(`https://formsubmit.co/ajax/${ADMIN_NOTIFICATION_EMAIL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          _subject: `🏋️‍♂️ Nueva Solicitud de Coach: ${name} (${email})`,
          tipo: 'SOLICITUD_ACCESO_COACH',
          nombre_coach: name,
          correo: email,
          telefono: phone || 'No especificado',
          mensaje: `Un nuevo entrenador (${name}) se ha registrado en el Panel Web BeStrong y solicita activación de permisos de administración.`,
          fecha: new Date().toLocaleString(),
          panel_url: 'https://bestrongadmin.github.io/admin-management'
        })
      }).catch(err => {
        console.warn('Notificación por FormSubmit no enviada (posible bloqueo de adblock):', err);
      });
    } catch (e) {
      console.warn('Error en notifySuperadminNewCoach:', e);
    }
  }

  async logout(): Promise<void> {
    await signOut(this.fb.auth);
    this.currentUser.set(null);
  }
}
