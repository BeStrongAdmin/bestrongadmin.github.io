import { Injectable, signal } from '@angular/core';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode as verifyFirebaseResetCodeModular,
  updatePassword,
  signOut 
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { FirebaseService } from './firebase.service';
import { environment } from '../../environments/environment';

export interface AdminProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  username?: string | null;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  requestStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  phone?: string;
  roles?: Array<'superadmin' | 'coach' | 'athlete'>;
}

const FIRESTORE_TIMEOUT_MS = 3500;
// Token seguro de FormSubmit para behealthlyapp@gmail.com
const ADMIN_NOTIFICATION_TOKEN = 'e8ec8e3f31acb38db815d98f6ea917df';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public currentUser = signal<AdminProfile | null>(null);
  public isLoading = signal<boolean>(true);
  public showChangePasswordModal = signal<boolean>(false);
  public showEditProfileModal = signal<boolean>(false);

  // Respaldo en memoria para códigos PIN de 2 minutos (independiente de reglas de Firestore)
  private localResetCodes = new Map<string, { code: string; expiresAtMs: number; used: boolean; verified: boolean }>();

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
          let photoURL: string | null = user.photoURL || null;
          let username: string | null = null;

          try {
            const userSnap = await Promise.race([
              getDoc(doc(this.fb.firestore, 'users', user.uid)),
              new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Timeout user profile')), FIRESTORE_TIMEOUT_MS))
            ]);
            if (userSnap && userSnap.exists()) {
              const uData = userSnap.data();
              if (uData['photoURL']) photoURL = uData['photoURL'];
              if (uData['username']) username = uData['username'];
            }
          } catch (e) {
            // Ignorar timeout de perfil
          }

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
            photoURL,
            username,
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

  openChangePasswordModal(): void {
    this.showChangePasswordModal.set(true);
  }

  closeChangePasswordModal(): void {
    this.showChangePasswordModal.set(false);
  }

  openEditProfileModal(): void {
    this.showEditProfileModal.set(true);
  }

  closeEditProfileModal(): void {
    this.showEditProfileModal.set(false);
  }

  async checkUsernameAvailable(username: string): Promise<{ available: boolean; message?: string }> {
    const normalized = username.toLowerCase().trim();
    if (normalized.length < 3) return { available: false, message: 'El username debe tener al menos 3 caracteres.' };
    if (normalized.length > 20) return { available: false, message: 'El username no puede superar 20 caracteres.' };
    if (!/^[a-z0-9._]+$/.test(normalized)) {
      return { available: false, message: 'Solo letras minúsculas, números, punto o guion bajo.' };
    }
    if (normalized.includes('..')) return { available: false, message: 'Evita puntos consecutivos.' };

    const currentUid = this.currentUser()?.uid;
    const docRef = doc(this.fb.firestore, 'usernames', normalized);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return { available: true };
    const ownerUid = snap.data()['uid'];
    if (ownerUid === currentUid) return { available: true };
    return { available: false, message: 'Este nombre de usuario ya está registrado por otra cuenta.' };
  }

  async updateUserProfile(displayName: string, photoURL?: string, username?: string): Promise<void> {
    const authUser = this.fb.auth.currentUser;
    if (!authUser) throw new Error('No hay sesión activa.');

    const cleanName = displayName.trim().replace(/\s+/g, ' ');
    if (cleanName.length < 2) throw new Error('El nombre debe tener al menos 2 caracteres.');
    if (cleanName.length > 40) throw new Error('El nombre no puede superar 40 caracteres.');

    let normalizedUsername: string | null = null;
    if (username && username.trim().length > 0) {
      normalizedUsername = username.toLowerCase().trim();
      const check = await this.checkUsernameAvailable(normalizedUsername);
      if (!check.available) {
        throw new Error(check.message || 'Nombre de usuario no disponible.');
      }
    }

    const cleanPhoto = photoURL && photoURL.trim().length > 0 ? photoURL.trim() : null;

    // 1. Actualizar Firebase Auth Profile
    await updateProfile(authUser, {
      displayName: cleanName,
      photoURL: cleanPhoto
    });

    // 2. Actualizar /users/{uid} en Firestore
    const userDocRef = doc(this.fb.firestore, 'users', authUser.uid);
    let prevUsername: string | null = null;
    try {
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        prevUsername = userSnap.data()['usernameNormalized'] || userSnap.data()['username'] || null;
      }
    } catch (e) {
      // Ignorar si no existe
    }

    const userPatch: any = {
      uid: authUser.uid,
      displayName: cleanName,
      photoURL: cleanPhoto,
      email: authUser.email
    };

    if (normalizedUsername) {
      userPatch.username = normalizedUsername;
      userPatch.usernameNormalized = normalizedUsername;
      userPatch.usernameConfiguredAt = Date.now();

      // Si cambió de username, borrar el anterior de /usernames
      if (prevUsername && prevUsername !== normalizedUsername) {
        try {
          await deleteDoc(doc(this.fb.firestore, 'usernames', prevUsername));
        } catch (e) {
          console.warn('Error borrando username previo:', e);
        }
      }

      // Registrar nuevo en /usernames
      await setDoc(doc(this.fb.firestore, 'usernames', normalizedUsername), {
        uid: authUser.uid,
        username: normalizedUsername,
        updatedAt: Date.now()
      }, { merge: true });
    }

    await setDoc(userDocRef, userPatch, { merge: true });

    // 3. Actualizar /admins/{uid} si existe
    try {
      const adminDocRef = doc(this.fb.firestore, 'admins', authUser.uid);
      const adminSnap = await getDoc(adminDocRef);
      if (adminSnap.exists()) {
        await updateDoc(adminDocRef, {
          name: cleanName,
          photoURL: cleanPhoto
        });
      }
    } catch (e) {
      // No bloquear si la colección admins no aplica
    }

    // 4. Actualizar signal de currentUser en tiempo real
    this.currentUser.update(prev => {
      if (!prev) return null;
      return {
        ...prev,
        displayName: cleanName,
        photoURL: cleanPhoto,
        username: normalizedUsername || prev.username
      };
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
      await fetch(`https://formsubmit.co/ajax/${ADMIN_NOTIFICATION_TOKEN}`, {
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
   * Envía el enlace oficial seguro de Firebase Authentication al correo especificado.
   * Al hacer clic en el enlace, el usuario es redirigido con el token oobCode para actualizar la contraseña en Firebase Auth.
   */
  async requestPasswordResetCode(email: string): Promise<{ success: boolean; expiresAtMs: number }> {
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Por favor ingresa un correo electrónico válido.');
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://bestrongadmin.github.io';
    try {
      await sendPasswordResetEmail(this.fb.auth, cleanEmail, {
        url: `${origin}/login?tab=reset`,
        handleCodeInApp: false
      });
    } catch (err: any) {
      console.warn('sendPasswordResetEmail con ActionCodeSettings falló, reintentando en modo estándar directo:', err);
      try {
        await sendPasswordResetEmail(this.fb.auth, cleanEmail);
      } catch (fallbackErr: any) {
        console.error('Error enviando correo de restablecimiento:', fallbackErr);
        throw fallbackErr;
      }
    }

    return { success: true, expiresAtMs: Date.now() + 120000 };
  }

  async confirmFirebasePasswordReset(oobCode: string, newPassword: string): Promise<void> {
    await confirmPasswordReset(this.fb.auth, oobCode, newPassword);
  }

  async verifyFirebaseResetCode(oobCode: string): Promise<string> {
    return await verifyFirebaseResetCodeModular(this.fb.auth, oobCode);
  }

  /**
   * Valida el código de 6 dígitos ingresado por el usuario
   */
  async verifyPasswordResetCode(email: string, codeEntered: string): Promise<boolean> {
    const cleanEmail = email.toLowerCase().trim();
    const cleanCode = codeEntered.trim();
    const now = Date.now();

    let data: any = null;

    // 1. Respaldo local prioritario en memoria, sessionStorage o localStorage (respuesta instantánea en 0ms)
    data = this.localResetCodes.get(cleanEmail);
    if (!data) {
      try {
        const fromSession = sessionStorage.getItem(`bestrong_reset_${cleanEmail}`);
        if (fromSession) data = JSON.parse(fromSession);
      } catch (_) {}
    }
    if (!data) {
      try {
        const fromLocal = localStorage.getItem(`bestrong_reset_${cleanEmail}`);
        if (fromLocal) data = JSON.parse(fromLocal);
      } catch (_) {}
    }

    // 2. Si no se obtuvo de memoria/sessionStorage, consultar Firestore con timeout de 2 segundos
    if (!data) {
      try {
        const resetDocRef = doc(this.fb.firestore, 'password_resets', cleanEmail);
        const snap = await Promise.race([
          getDoc(resetDocRef),
          new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Timeout Firestore')), 2000))
        ]);
        if (snap && snap.exists()) {
          data = snap.data();
        }
      } catch (err) {
        console.warn('Firestore getDoc falló (usando respaldo local):', err);
      }
    }

    if (!data) {
      throw new Error('No hay ninguna solicitud de recuperación activa para este correo. Solicita un nuevo código.');
    }

    if (now > data.expiresAtMs) {
      throw new Error('El código ha expirado (los 2 minutos se han agotado). Por favor solicita un nuevo código.');
    }

    if (data.used === true) {
      throw new Error('Este código ya fue utilizado. Por favor solicita uno nuevo.');
    }

    if (data.code !== cleanCode) {
      throw new Error('El código ingresado es incorrecto. Revisa tu correo e intenta de nuevo.');
    }

    // Actualizar estado local y en Firestore
    data.verified = true;
    this.localResetCodes.set(cleanEmail, data);
    try {
      sessionStorage.setItem(`bestrong_reset_${cleanEmail}`, JSON.stringify(data));
      localStorage.setItem(`bestrong_reset_${cleanEmail}`, JSON.stringify(data));
    } catch (_) {}

    try {
      const resetDocRef = doc(this.fb.firestore, 'password_resets', cleanEmail);
      updateDoc(resetDocRef, { verified: true }).catch(() => {});
    } catch (_) {}

    return true;
  }

  /**
   * Completa el proceso de cambio de contraseña (desde login o recuperación)
   */
  async completePasswordReset(email: string, codeEntered: string, newPassword: string): Promise<void> {
    const cleanEmail = email.toLowerCase().trim();
    await this.verifyPasswordResetCode(cleanEmail, codeEntered);

    const localData = this.localResetCodes.get(cleanEmail);
    if (localData) {
      localData.used = true;
      this.localResetCodes.set(cleanEmail, localData);
    }
    try {
      sessionStorage.removeItem(`bestrong_reset_${cleanEmail}`);
      localStorage.removeItem(`bestrong_reset_${cleanEmail}`);
    } catch (_) {}

    try {
      const resetDocRef = doc(this.fb.firestore, 'password_resets', cleanEmail);
      updateDoc(resetDocRef, { used: true }).catch(() => {});
    } catch (_) {}

    // Si el usuario está autenticado, actualizamos directamente su contraseña en Firebase Auth:
    if (this.fb.auth.currentUser && this.fb.auth.currentUser.email?.toLowerCase() === cleanEmail) {
      await updatePassword(this.fb.auth.currentUser, newPassword);
    }
  }

  isGoogleUser(): boolean {
    const user = this.fb.auth.currentUser;
    if (!user) return false;
    const hasGoogle = user.providerData.some(p => p.providerId === 'google.com');
    const hasPassword = user.providerData.some(p => p.providerId === 'password');
    return hasGoogle && !hasPassword;
  }

  /**
   * Cambia la contraseña directamente cuando el usuario está logueado dentro del Dashboard
   */
  async changePasswordLoggedIn(currentPassword: string, newPassword: string): Promise<void> {
    const user = this.fb.auth.currentUser;
    if (!user || !user.email) {
      throw new Error('No hay una sesión activa de usuario.');
    }

    if (!newPassword || newPassword.length < 6) {
      throw new Error('La nueva contraseña debe tener al menos 6 caracteres.');
    }

    const hasPassword = user.providerData.some(p => p.providerId === 'password');

    // Si el usuario tiene proveedor de contraseña, re-autenticar con la contraseña actual
    if (hasPassword && currentPassword) {
      try {
        const credential = EmailAuthProvider.credential(user.email, currentPassword.trim());
        await reauthenticateWithCredential(user, credential);
      } catch (err: any) {
        console.warn('Fallo en re-autenticación con contraseña actual:', err);
        const code = (err?.code || err?.message || String(err)).toLowerCase();
        if (code.includes('too-many-requests')) {
          throw new Error('Demasiados intentos fallidos. Por seguridad, espera unos momentos antes de volver a intentar.');
        }
        throw new Error('La contraseña actual ingresada es incorrecta. Si no la recuerdas, pulsa "¿Olvidaste tu contraseña actual?" abajo para enviarte un enlace de restablecimiento.');
      }
    }

    // Actualizar contraseña directamente en Firebase Auth
    try {
      await updatePassword(user, newPassword);
    } catch (err: any) {
      const code = (err.code || err.message || '').toLowerCase();
      if (code.includes('requires-recent-login')) {
        throw new Error('Por seguridad de Firebase, debes volver a iniciar sesión antes de cambiar tu contraseña.');
      }
      throw err;
    }
  }

  /**
   * Envía un correo oficial de restablecimiento de contraseña de Firebase al usuario logueado
   */
  async sendResetEmailToCurrentUser(): Promise<void> {
    const user = this.fb.auth.currentUser;
    if (!user || !user.email) {
      throw new Error('No hay una sesión activa de usuario.');
    }
    await sendPasswordResetEmail(this.fb.auth, user.email);
  }

  async logout(): Promise<void> {
    await signOut(this.fb.auth);
    this.currentUser.set(null);
  }
}

