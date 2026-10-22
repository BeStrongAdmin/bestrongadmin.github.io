import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="login-wrapper min-vh-100 d-flex align-items-center justify-content-center p-3">
      <div class="card p-4 p-md-5 border border-dark shadow-2xl" style="max-width: 460px; width: 100%; background-color: #0b0c10; border-radius: 1.25rem;">
        
        <!-- Back to home -->
        <div class="mb-3 d-flex justify-content-between align-items-center">
          <a routerLink="/" class="text-secondary text-decoration-none small d-inline-flex align-items-center gap-1 hover-light">
            <i class="bi bi-arrow-left"></i> Inicio
          </a>
          <a routerLink="/coaches" class="text-secondary text-decoration-none small d-inline-flex align-items-center gap-1 hover-light">
            <i class="bi bi-info-circle text-success"></i> Beneficios Coach
          </a>
        </div>

        <!-- Header -->
        <div class="text-center mb-3">
          <div class="d-inline-flex align-items-center justify-content-center rounded-circle bg-dark border border-secondary p-3 mb-2 text-light">
            <i class="bi bi-shield-lock fs-2" [class.text-success]="mode === 'register'"></i>
          </div>
          <h2 class="fw-bold mb-1 text-light">{{ mode === 'login' ? 'Acceso Administrativo' : 'Registro de Entrenadores' }}</h2>
          <p class="text-secondary small mb-0">
            {{ mode === 'login' ? 'Panel de control para administradores y coaches' : 'Crea tu cuenta profesional para diseñar rutinas biomecánicas' }}
          </p>
        </div>

        <!-- Mode Switcher Tabs (Segmented Control) -->
        <div class="d-flex p-1 rounded-3 mb-3 border border-secondary border-opacity-25" style="background-color: #12141a;">
          <button 
            type="button" 
            class="btn btn-sm flex-fill fw-semibold rounded-2 py-2 transition-all border-0" 
            [ngClass]="mode === 'login' ? 'btn-light text-dark shadow-sm' : 'text-secondary hover-light'"
            (click)="setMode('login')"
          >
            <i class="bi bi-box-arrow-in-right me-1"></i> Iniciar Sesión
          </button>
          <button 
            type="button" 
            class="btn btn-sm flex-fill fw-semibold rounded-2 py-2 transition-all border-0" 
            [ngClass]="mode === 'register' ? 'btn-success text-dark shadow-sm fw-bold' : 'text-secondary hover-light'"
            (click)="setMode('register')"
          >
            <i class="bi bi-person-plus me-1"></i> Registrarse como Coach
          </button>
        </div>

        <!-- Error alert -->
        <div *ngIf="errorMessage" class="alert alert-danger d-flex align-items-center gap-2 py-2 small mb-3 border-0 bg-danger bg-opacity-10 text-danger" role="alert">
          <i class="bi bi-exclamation-triangle-fill flex-shrink-0"></i>
          <div>{{ errorMessage }}</div>
        </div>

        <!-- Google Button -->
        <button 
          type="button" 
          class="btn btn-outline-light w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2 mb-3 border-secondary"
          style="background-color: #12141a; border-radius: 12px;"
          (click)="onGoogleAuth()"
          [disabled]="loading || loadingGoogle"
        >
          <span *ngIf="loadingGoogle" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          <svg *ngIf="!loadingGoogle" width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>{{ loadingGoogle ? 'Conectando...' : (mode === 'login' ? 'Continuar con Google' : 'Registrarse con Google') }}</span>
        </button>

        <div class="d-flex align-items-center my-3 text-secondary">
          <hr class="flex-grow-1 border-secondary opacity-25">
          <span class="px-2 small text-uppercase" style="font-size: 0.7rem; letter-spacing: 0.5px;">
            {{ mode === 'login' ? 'o ingresa con tu correo' : 'o completa tus datos' }}
          </span>
          <hr class="flex-grow-1 border-secondary opacity-25">
        </div>

        <!-- LOGIN FORM -->
        <form *ngIf="mode === 'login'" (ngSubmit)="onLogin()">
          <div class="mb-3">
            <label class="form-label text-secondary small fw-medium">Correo Electrónico</label>
            <div class="input-group">
              <span class="input-group-text bg-dark border-secondary text-secondary">
                <i class="bi bi-envelope"></i>
              </span>
              <input 
                type="email" 
                class="form-control" 
                placeholder="coach@bestrong.com" 
                [(ngModel)]="email" 
                name="email" 
                required 
                [disabled]="loading || loadingGoogle"
              />
            </div>
          </div>

          <div class="mb-4">
            <label class="form-label text-secondary small fw-medium">Contraseña</label>
            <div class="input-group">
              <span class="input-group-text bg-dark border-secondary text-secondary">
                <i class="bi bi-lock"></i>
              </span>
              <input 
                type="password" 
                class="form-control" 
                placeholder="••••••••" 
                [(ngModel)]="password" 
                name="password" 
                required 
                [disabled]="loading || loadingGoogle"
              />
            </div>
          </div>

          <button 
            type="submit" 
            class="btn btn-light w-100 py-2 fw-bold d-flex align-items-center justify-content-center gap-2 mb-3"
            style="border-radius: 12px;"
            [disabled]="loading || loadingGoogle || !email || !password"
          >
            <span *ngIf="loading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            <span>{{ loading ? 'Iniciando sesión...' : 'Ingresar al Panel' }}</span>
          </button>
        </form>

        <!-- REGISTER FORM -->
        <form *ngIf="mode === 'register'" (ngSubmit)="onRegister()">
          <div class="mb-3">
            <label class="form-label text-secondary small fw-medium">Nombre Completo</label>
            <div class="input-group">
              <span class="input-group-text bg-dark border-secondary text-secondary">
                <i class="bi bi-person"></i>
              </span>
              <input 
                type="text" 
                class="form-control" 
                placeholder="Coach Juan Pérez" 
                [(ngModel)]="name" 
                name="name" 
                required 
                [disabled]="loading || loadingGoogle"
              />
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label text-secondary small fw-medium">Correo Electrónico</label>
            <div class="input-group">
              <span class="input-group-text bg-dark border-secondary text-secondary">
                <i class="bi bi-envelope"></i>
              </span>
              <input 
                type="email" 
                class="form-control" 
                placeholder="coach@gimnasio.com" 
                [(ngModel)]="email" 
                name="email" 
                required 
                [disabled]="loading || loadingGoogle"
              />
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label text-secondary small fw-medium">Contraseña (Mínimo 6 caracteres)</label>
            <div class="input-group">
              <span class="input-group-text bg-dark border-secondary text-secondary">
                <i class="bi bi-lock"></i>
              </span>
              <input 
                type="password" 
                class="form-control" 
                placeholder="••••••••" 
                [(ngModel)]="password" 
                name="password" 
                required 
                minlength="6"
                [disabled]="loading || loadingGoogle"
              />
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label text-secondary small fw-medium">
              WhatsApp / Teléfono <span class="text-secondary opacity-75">(Opcional, para contacto rápido)</span>
            </label>
            <div class="input-group">
              <span class="input-group-text bg-dark border-secondary text-secondary">
                <i class="bi bi-whatsapp"></i>
              </span>
              <input 
                type="tel" 
                class="form-control" 
                placeholder="+52 55 1234 5678" 
                [(ngModel)]="phone" 
                name="phone" 
                [disabled]="loading || loadingGoogle"
              />
            </div>
          </div>

          <div class="p-2 mb-3 rounded-3 border border-secondary border-opacity-25" style="background: rgba(0, 230, 118, 0.04);">
            <div class="d-flex align-items-center gap-2 text-success small" style="font-size: 0.78rem;">
              <i class="bi bi-shield-check fs-6 flex-shrink-0"></i>
              <span>Al registrarte, entrarás al panel para solicitar activación a nuestro equipo.</span>
            </div>
          </div>

          <button 
            type="submit" 
            class="btn btn-success text-dark w-100 py-2 fw-bold d-flex align-items-center justify-content-center gap-2 mb-3"
            style="border-radius: 12px; background-color: #00e676; border-color: #00e676;"
            [disabled]="loading || loadingGoogle || !email || !password || !name || password.length < 6"
          >
            <span *ngIf="loading" class="spinner-border spinner-border-sm text-dark" role="status" aria-hidden="true"></span>
            <span>{{ loading ? 'Creando cuenta...' : 'Crear Cuenta de Coach' }}</span>
          </button>
        </form>

        <!-- Athlete notice card -->
        <div class="p-3 rounded-4 border border-dark text-center mt-2" style="background: rgba(255, 255, 255, 0.03);">
          <div class="d-flex align-items-center justify-content-center gap-2 mb-1 text-light small fw-bold">
            <i class="bi bi-phone text-success"></i>
            <span>¿Eres atleta o entrenas en el gym?</span>
          </div>
          <p class="text-secondary small mb-3" style="font-size: 0.8rem; line-height: 1.4;">
            El registro de atletas y ejecución de rutinas se realiza directamente en la app móvil gratuita.
          </p>
          <a 
            href="https://play.google.com/store/apps/details?id=com.BeStrong&pcampaignid=web_share" 
            target="_blank" 
            rel="noopener noreferrer"
            class="btn btn-outline-success btn-sm w-100 py-2 d-flex align-items-center justify-content-center gap-2 rounded-3 fw-semibold"
          >
            <i class="bi bi-google-play"></i> Descargar BeStrong en Google Play
          </a>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      background: linear-gradient(135deg, #050608 0%, #0a0d14 50%, #030406 100%);
    }
    .hover-light:hover {
      color: #fff !important;
    }
    .transition-all {
      transition: all 0.2s ease;
    }
  `]
})
export class LoginComponent implements OnInit {
  mode: 'login' | 'register' = 'login';
  email = '';
  password = '';
  name = '';
  phone = '';
  loading = false;
  loadingGoogle = false;
  errorMessage = '';

  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  async ngOnInit(): Promise<void> {
    this.route.queryParams.subscribe(params => {
      if (params['mode'] === 'register' || params['tab'] === 'register') {
        this.mode = 'register';
      }
    });

    await Promise.race([
      this.auth.authReadyPromise,
      new Promise(r => setTimeout(r, 1500))
    ]);

    const user = this.auth.currentUser();
    if (user) {
      if (user.isSuperAdmin) {
        this.router.navigate(['/admin-management']);
      } else {
        this.router.navigate(['/dashboard']);
      }
    }
  }

  setMode(newMode: 'login' | 'register'): void {
    this.mode = newMode;
    this.errorMessage = '';
  }

  async onLogin(): Promise<void> {
    if (!this.email || !this.password) return;
    this.loading = true;
    this.errorMessage = '';

    try {
      const profile = await this.auth.login(this.email.trim(), this.password);
      if (profile.isSuperAdmin) {
        this.router.navigate(['/admin-management']);
      } else {
        this.router.navigate(['/dashboard']);
      }
    } catch (err: any) {
      this.errorMessage = this.translateError(err.code || err.message);
    } finally {
      this.loading = false;
    }
  }

  async onRegister(): Promise<void> {
    if (!this.email || !this.password || !this.name) return;
    this.loading = true;
    this.errorMessage = '';

    try {
      await this.auth.register(this.email.trim(), this.password, this.name.trim(), this.phone.trim());
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      this.errorMessage = this.translateError(err.code || err.message);
    } finally {
      this.loading = false;
    }
  }

  async onGoogleAuth(): Promise<void> {
    this.loadingGoogle = true;
    this.errorMessage = '';

    try {
      const profile = await this.auth.loginWithGoogle();
      if (profile.isSuperAdmin) {
        this.router.navigate(['/admin-management']);
      } else {
        this.router.navigate(['/dashboard']);
      }
    } catch (err: any) {
      this.errorMessage = this.translateError(err.code || err.message);
    } finally {
      this.loadingGoogle = false;
    }
  }

  private translateError(err: string): string {
    if (!err) return 'Ocurrió un error inesperado.';
    if (err.includes('auth/invalid-credential') || err.includes('auth/wrong-password') || err.includes('auth/user-not-found')) {
      return 'Correo o contraseña incorrectos.';
    }
    if (err.includes('auth/email-already-in-use')) {
      return 'Este correo ya está registrado. Por favor, selecciona "Iniciar Sesión".';
    }
    if (err.includes('auth/weak-password')) {
      return 'La contraseña debe tener al menos 6 caracteres.';
    }
    if (err.includes('auth/invalid-email')) {
      return 'El formato del correo electrónico no es válido.';
    }
    if (err.includes('auth/popup-closed-by-user')) {
      return 'Inicio de sesión con Google cancelado.';
    }
    return err;
  }
}
