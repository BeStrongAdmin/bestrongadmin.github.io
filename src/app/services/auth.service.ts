import { Injectable, signal } from '@angular/core';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  updatePassword,
  signOut 
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
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
  roles?: Array<'superadmin' | 'coach' | 'athlete'>;
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

  public isSuperAdminUid(uid: string | null | undefined): boolean {
    if (!uid) return false;
    const list: string[] = (environment as any).superAdminUids || [environment.superAdminUid];
    return list.includes(uid) || uid === environment.superAdminUid;
  }

  constructor(private fb: FirebaseService) {
    onAuthStateChanged(this.fb.auth, async (user: User | null) => {
      try {
        if (user) {
          const isSuper = this.isSuperAdminUid(user.uid);
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
    const isSuper = this.isSuperAdminUid(user.uid);
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
    const isSuper = this.isSuperAdminUid(user.uid);
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
        active: true, // Auto-activación instantánea como coach
        role: 'coach',
        roles: ['athlete', 'coach'],
        requestStatus: 'approved',
        activatedAtMs: Date.now(),
        requestedAtMs: Date.now()
      }, { merge: true });

      // Notificar por correo al Superadmin (behealthlyapp@gmail.com)
      await this.notifySuperadminNewCoach(cur.displayName || '', cur.email || '', phone || cur.phone, true);

      this.currentUser.set({
        ...cur,
        isAdmin: true,
        requestStatus: 'approved',
        roles: ['athlete', 'coach'],
        phone: phone || cur.phone
      });
    } catch (err: any) {
      console.error('Error al activar permisos de coach:', err);
      throw new Error(err.message || 'No se pudo activar el acceso.');
    }
  }

  private async notifySuperadminNewCoach(name: string, email: string, phone?: string, instantActivated = false): Promise<void> {
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
          status: instantActivated ? 'approved' : 'pending'
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
          _subject: instantActivated ? `🏋️‍♂️ ¡Nuevo Coach Activado!: ${name} (${email})` : `🏋️‍♂️ Nueva Solicitud de Coach: ${name} (${email})`,
          tipo: instantActivated ? 'NUEVO_COACH_ACTIVADO' : 'SOLICITUD_ACCESO_COACH',
          nombre_coach: name,
          correo: email,
          telefono: phone || 'No especificado',
          mensaje: `El usuario ${name} (${email}) ha activado su cuenta como Coach en el Panel Web BeStrong y ya puede generar y asignar rutinas.`,
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

  /**
   * Genera y envía un código de 6 dígitos que expira en 2 minutos (120s)
   * Guardado en Firestore en password_resets/{email}
   */
  async requestPasswordResetCode(email: string): Promise<{ success: boolean; expiresAtMs: number }> {
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Por favor ingresa un correo electrónico válido.');
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const now = Date.now();
    const expiresAtMs = now + 120000; // 2 minutos exactos

    try {
      // 1. Guardar código en Firestore
      const resetDocRef = doc(this.fb.firestore, 'password_resets', cleanEmail);
      await setDoc(resetDocRef, {
        email: cleanEmail,
        code,
        createdAtMs: now,
        expiresAtMs,
        used: false,
        verified: false
      });

      // 2. Enviar email con el código de 6 dígitos vía FormSubmit AJAX
      await fetch(`https://formsubmit.co/ajax/${cleanEmail}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          _subject: `🔐 Tu Código de Seguridad BeStrong: ${code}`,
          tipo: 'RECUPERACION_CONTRASENA_BESTRONG',
          codigo_de_verificacion: code,
          validez_minutos: '2 minutos',
          mensaje: `Hola, recibimos una solicitud para cambiar tu contraseña en BeStrong. Tu código de seguridad es: ${code}. Expira en 2 minutos. Si tú no solicitaste esto, ignora este mensaje.`,
          fecha: new Date().toLocaleString()
        })
      }).catch(err => {
        console.warn('FormSubmit no enviado para código de recuperación:', err);
      });

      // 3. Disparo en paralelo de recuperación nativa de Firebase Auth
      sendPasswordResetEmail(this.fb.auth, cleanEmail).catch(() => {});

      return { success: true, expiresAtMs };
    } catch (err: any) {
      console.error('Error al generar código de restablecimiento:', err);
      throw new Error(err.message || 'Error al enviar código de verificación.');
    }
  }

  /**
   * Valida el código de 6 dígitos ingresado por el usuario
   */
  async verifyPasswordResetCode(email: string, codeEntered: string): Promise<boolean> {
    const cleanEmail = email.toLowerCase().trim();
    const cleanCode = codeEntered.trim();
    const resetDocRef = doc(this.fb.firestore, 'password_resets', cleanEmail);
    const snap = await getDoc(resetDocRef);

    if (!snap.exists()) {
      throw new Error('No hay ninguna solicitud de recuperación activa para este correo. Solicita un nuevo código.');
    }

    const data = snap.data();
    const now = Date.now();

    if (now > data['expiresAtMs']) {
      throw new Error('El código ha expirado (los 2 minutos se han agotado). Por favor solicita un nuevo código.');
    }

    if (data['used'] === true) {
      throw new Error('Este código ya fue utilizado. Por favor solicita uno nuevo.');
    }

    if (data['code'] !== cleanCode) {
      throw new Error('El código ingresado es incorrecto. Revisa tu correo e intenta de nuevo.');
    }

    await updateDoc(resetDocRef, { verified: true });
    return true;
  }

  /**
   * Completa el proceso de cambio de contraseña
   */
  async completePasswordReset(email: string, codeEntered: string, newPassword: string): Promise<void> {
    const cleanEmail = email.toLowerCase().trim();
    await this.verifyPasswordResetCode(cleanEmail, codeEntered);

    const resetDocRef = doc(this.fb.firestore, 'password_resets', cleanEmail);
    await updateDoc(resetDocRef, { used: true });

    // Si el usuario está autenticado, actualizamos directamente su contraseña en Firebase Auth:
    if (this.fb.auth.currentUser && this.fb.auth.currentUser.email?.toLowerCase() === cleanEmail) {
      await updatePassword(this.fb.auth.currentUser, newPassword);
    }
  }

  async logout(): Promise<void> {
    await signOut(this.fb.auth);
    this.currentUser.set(null);
  }
}
