import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
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

        <!-- Existing Mobile Account Notice -->
        <div *ngIf="existingAccountDetected" class="p-3 mb-3 rounded-3 border border-warning border-opacity-50" style="background: rgba(255, 193, 7, 0.08);">
          <div class="d-flex align-items-start gap-2 text-warning small mb-2">
            <i class="bi bi-info-circle-fill fs-5 flex-shrink-0 mt-1"></i>
            <div>
              <div class="fw-bold mb-1">¡Esta cuenta ya existe en BeStrong!</div>
              <div class="text-secondary" style="font-size: 0.82rem; line-height: 1.4;">
                Es muy probable que te hayas registrado previamente en la app móvil. Por favor inicia sesión directamente con tu cuenta.
              </div>
            </div>
          </div>
          <button 
            type="button" 
            class="btn btn-warning text-dark btn-sm w-100 fw-bold d-flex align-items-center justify-content-center gap-1 mt-1 shadow-sm"
            (click)="switchToLoginWithCurrentEmail()"
          >
            <i class="bi bi-box-arrow-in-right"></i> Iniciar Sesión con este correo
          </button>
        </div>

        <!-- Error alert -->
        <div *ngIf="errorMessage && !existingAccountDetected" class="alert alert-danger d-flex align-items-center gap-2 py-2 small mb-3 border-0 bg-danger bg-opacity-10 text-danger" role="alert">
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

          <div class="mb-2">
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

          <!-- Forgot password link -->
          <div class="d-flex justify-content-end mb-4">
            <button 
              type="button" 
              class="btn btn-link p-0 text-success text-decoration-none small hover-light" 
              (click)="openResetModal()"
              style="font-size: 0.82rem;"
            >
              <i class="bi bi-key me-1"></i> ¿Olvidaste tu contraseña?
            </button>
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

    <!-- PASSWORD RECOVERY MODAL -->
    <div *ngIf="showResetModal()" class="modal-backdrop-custom d-flex align-items-center justify-content-center p-3">
      <div class="card p-4 border border-secondary border-opacity-50 shadow-2xl position-relative text-light" style="max-width: 440px; width: 100%; background-color: #0d0f15; border-radius: 1.25rem;">
        
        <!-- Close button -->
        <button type="button" class="btn-close btn-close-white position-absolute top-0 end-0 m-3" (click)="closeResetModal()" aria-label="Close"></button>

        <!-- STEP 1: Enter email -->
        <div *ngIf="resetStep() === 1">
          <div class="text-center mb-3">
            <div class="d-inline-flex align-items-center justify-content-center rounded-circle bg-dark border border-secondary p-3 mb-2 text-warning">
              <i class="bi bi-envelope-check fs-3"></i>
            </div>
            <h4 class="fw-bold mb-1 text-light">Recuperar Contraseña</h4>
            <p class="text-secondary small mb-0">
              Ingresa el correo asociado a tu cuenta BeStrong. Te enviaremos un código de seguridad de 6 dígitos con validez de 2 minutos.
            </p>
          </div>

          <div *ngIf="resetError()" class="alert alert-danger py-2 small mb-3 border-0 bg-danger bg-opacity-10 text-danger">
            {{ resetError() }}
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
                placeholder="tu@correo.com" 
                [(ngModel)]="resetEmail" 
                name="resetEmail" 
                required 
                [disabled]="resetLoading()"
              />
            </div>
          </div>

          <button 
            type="button" 
            class="btn btn-success text-dark w-100 py-2 fw-bold d-flex align-items-center justify-content-center gap-2 mb-2"
            style="border-radius: 12px; background-color: #00e676; border-color: #00e676;"
            (click)="onSendResetCode()"
            [disabled]="resetLoading() || !resetEmail || !resetEmail.includes('@')"
          >
            <span *ngIf="resetLoading()" class="spinner-border spinner-border-sm text-dark" role="status" aria-hidden="true"></span>
            <span>{{ resetLoading() ? 'Enviando código...' : 'Enviar Código (2 Minutos)' }}</span>
          </button>
        </div>

        <!-- STEP 2: Enter 6-digit code with 2-minute countdown -->
        <div *ngIf="resetStep() === 2">
          <div class="text-center mb-3">
            <div class="d-inline-flex align-items-center justify-content-center rounded-circle bg-dark border border-secondary p-3 mb-2 text-info">
              <i class="bi bi-shield-lock-fill fs-3"></i>
            </div>
            <h4 class="fw-bold mb-1 text-light">Código de Seguridad</h4>
            <p class="text-secondary small mb-2">
              Ingresa el código de 6 dígitos enviado a <strong class="text-light">{{ resetEmail }}</strong>.
            </p>

            <!-- Countdown Timer Badge -->
            <div class="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-2 border" 
                 [ngClass]="timerSeconds() <= 30 ? 'bg-danger bg-opacity-10 border-danger text-danger' : 'bg-success bg-opacity-10 border-success text-success'">
              <i class="bi bi-stopwatch-fill"></i>
              <span class="fw-bold" style="font-size: 1rem; letter-spacing: 1px;">{{ formatTimer() }}</span>
              <span class="small" *ngIf="timerSeconds() === 0">(Expirado)</span>
            </div>
          </div>

          <div *ngIf="resetError()" class="alert alert-danger py-2 small mb-3 border-0 bg-danger bg-opacity-10 text-danger">
            {{ resetError() }}
          </div>

          <div class="mb-3 text-center">
            <label class="form-label text-secondary small fw-medium d-block">Código de 6 Dígitos</label>
            <input 
              type="text" 
              class="form-control text-center fw-bold fs-3 text-light" 
              style="letter-spacing: 8px; background-color: #12141a; border-color: #2c3240; border-radius: 12px;"
              placeholder="••••••" 
              [(ngModel)]="resetCode" 
              name="resetCode" 
              maxlength="6"
              [disabled]="resetLoading() || timerSeconds() === 0"
              autocomplete="one-time-code"
            />
          </div>

          <button 
            type="button" 
            class="btn btn-success text-dark w-100 py-2 fw-bold d-flex align-items-center justify-content-center gap-2 mb-2"
            style="border-radius: 12px; background-color: #00e676; border-color: #00e676;"
            (click)="onVerifyCode()"
            [disabled]="resetLoading() || resetCode.trim().length !== 6 || timerSeconds() === 0"
          >
            <span *ngIf="resetLoading()" class="spinner-border spinner-border-sm text-dark" role="status" aria-hidden="true"></span>
            <span>{{ resetLoading() ? 'Verificando...' : 'Verificar Código' }}</span>
          </button>

          <div class="text-center mt-2">
            <button 
              type="button" 
              class="btn btn-link text-secondary text-decoration-none small hover-light" 
              (click)="onResendCode()"
              [disabled]="resetLoading()"
            >
              <i class="bi bi-arrow-clockwise me-1"></i> ¿No recibiste el código? Reenviar
            </button>
          </div>
        </div>

        <!-- STEP 3: Change password -->
        <div *ngIf="resetStep() === 3">
          <div class="text-center mb-3">
            <div class="d-inline-flex align-items-center justify-content-center rounded-circle bg-dark border border-secondary p-3 mb-2 text-success">
              <i class="bi bi-check2-circle fs-3"></i>
            </div>
            <h4 class="fw-bold mb-1 text-light">Nueva Contraseña</h4>
            <p class="text-secondary small mb-0">
              Código verificado exitosamente. Ingresa tu nueva contraseña para BeStrong.
            </p>
          </div>

          <div *ngIf="resetError()" class="alert alert-danger py-2 small mb-3 border-0 bg-danger bg-opacity-10 text-danger">
            {{ resetError() }}
          </div>

          <div class="mb-3">
            <label class="form-label text-secondary small fw-medium">Nueva Contraseña</label>
            <div class="input-group">
              <span class="input-group-text bg-dark border-secondary text-secondary">
                <i class="bi bi-lock"></i>
              </span>
              <input 
                type="password" 
                class="form-control" 
                placeholder="Mínimo 6 caracteres" 
                [(ngModel)]="newPassword" 
                name="newPassword" 
                required 
                minlength="6"
                [disabled]="resetLoading()"
              />
            </div>
          </div>

          <div class="mb-4">
            <label class="form-label text-secondary small fw-medium">Confirmar Nueva Contraseña</label>
            <div class="input-group">
              <span class="input-group-text bg-dark border-secondary text-secondary">
                <i class="bi bi-lock-fill"></i>
              </span>
              <input 
                type="password" 
                class="form-control" 
                placeholder="Repite la contraseña" 
                [(ngModel)]="confirmPassword" 
                name="confirmPassword" 
                required 
                minlength="6"
                [disabled]="resetLoading()"
              />
            </div>
          </div>

          <button 
            type="button" 
            class="btn btn-success text-dark w-100 py-2 fw-bold d-flex align-items-center justify-content-center gap-2 mb-2"
            style="border-radius: 12px; background-color: #00e676; border-color: #00e676;"
            (click)="onCompletePasswordReset()"
            [disabled]="resetLoading() || !newPassword || newPassword.length < 6 || newPassword !== confirmPassword"
          >
            <span *ngIf="resetLoading()" class="spinner-border spinner-border-sm text-dark" role="status" aria-hidden="true"></span>
            <span>{{ resetLoading() ? 'Guardando...' : 'Guardar Nueva Contraseña' }}</span>
          </button>
        </div>

        <!-- STEP 4: Success confirmation -->
        <div *ngIf="resetStep() === 4" class="text-center py-2">
          <div class="d-inline-flex align-items-center justify-content-center rounded-circle bg-success bg-opacity-10 border border-success p-3 mb-3 text-success">
            <i class="bi bi-check-lg fs-1"></i>
          </div>
          <h4 class="fw-bold mb-2 text-light">¡Contraseña Actualizada!</h4>
          <p class="text-secondary small mb-4" style="line-height: 1.5;">
            Tu código de seguridad ha sido validado. También te enviamos el enlace de confirmación seguro a tu correo <strong class="text-light">{{ resetEmail }}</strong> para sincronización total con Firebase.
          </p>

          <button 
            type="button" 
            class="btn btn-light w-100 py-2 fw-bold d-flex align-items-center justify-content-center gap-2"
            style="border-radius: 12px;"
            (click)="finishResetAndLogin()"
          >
            <i class="bi bi-box-arrow-in-right"></i> Iniciar Sesión Ahora
          </button>
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
    .modal-backdrop-custom {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(3, 4, 6, 0.88);
      backdrop-filter: blur(8px);
      z-index: 1050;
    }
  `]
})
export class LoginComponent implements OnInit, OnDestroy {
  mode: 'login' | 'register' = 'login';
  email = '';
  password = '';
  name = '';
  phone = '';
  loading = false;
  loadingGoogle = false;
  errorMessage = '';
  existingAccountDetected = false;

  // Password Reset Modal State
  showResetModal = signal<boolean>(false);
  resetStep = signal<1 | 2 | 3 | 4>(1);
  resetEmail = '';
  resetCode = '';
  newPassword = '';
  confirmPassword = '';
  resetLoading = signal<boolean>(false);
  resetError = signal<string>('');
  timerSeconds = signal<number>(120);
  oobCode = '';
  private timerInterval: any = null;

  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  async ngOnInit(): Promise<void> {
    this.route.queryParams.subscribe(params => {
      if (params['mode'] === 'register' || params['tab'] === 'register') {
        this.mode = 'register';
      }
      const codeParam = params['oobCode'] || params['code'];
      if (codeParam) {
        this.oobCode = codeParam;
        this.resetStep.set(3); // Abrir directamente en el paso de nueva contraseña
        this.showResetModal.set(true);
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

  ngOnDestroy(): void {
    this.stopTimer();
  }

  setMode(newMode: 'login' | 'register'): void {
    this.mode = newMode;
    this.errorMessage = '';
    this.existingAccountDetected = false;
  }

  switchToLoginWithCurrentEmail(): void {
    this.mode = 'login';
    this.password = '';
    this.existingAccountDetected = false;
    this.errorMessage = '';
  }

  async onLogin(): Promise<void> {
    if (!this.email || !this.password) return;
    this.loading = true;
    this.errorMessage = '';
    this.existingAccountDetected = false;

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
    this.existingAccountDetected = false;

    try {
      await this.auth.register(this.email.trim(), this.password, this.name.trim(), this.phone.trim());
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      const errCode = (err.code || err.message || '').toLowerCase();
      if (errCode.includes('email-already-in-use')) {
        this.existingAccountDetected = true;
      } else {
        this.errorMessage = this.translateError(err.code || err.message);
      }
    } finally {
      this.loading = false;
    }
  }

  async onGoogleAuth(): Promise<void> {
    this.loadingGoogle = true;
    this.errorMessage = '';
    this.existingAccountDetected = false;

    try {
      const profile = await this.auth.loginWithGoogle();
      if (profile.isSuperAdmin) {
        this.router.navigate(['/admin-management']);
      } else {
        this.router.navigate(['/dashboard']);
      }
    } catch (err: any) {
      const errCode = (err.code || err.message || '').toLowerCase();
      if (errCode.includes('account-exists-with-different-credential') || errCode.includes('email-already-in-use')) {
        this.existingAccountDetected = true;
      } else {
        this.errorMessage = this.translateError(err.code || err.message);
      }
    } finally {
      this.loadingGoogle = false;
    }
  }

  // --- Password Reset Modal Controls ---
  openResetModal(): void {
    this.resetEmail = this.email ? this.email.trim() : '';
    this.resetCode = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.resetError.set('');
    this.resetStep.set(1);
    this.showResetModal.set(true);
  }

  closeResetModal(): void {
    this.stopTimer();
    this.showResetModal.set(false);
    this.resetError.set('');
  }

  formatTimer(): string {
    const sVal = this.timerSeconds();
    const m = Math.floor(sVal / 60);
    const s = sVal % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  private startTimer(): void {
    this.stopTimer();
    this.timerSeconds.set(120);
    this.timerInterval = setInterval(() => {
      if (this.timerSeconds() > 0) {
        this.timerSeconds.update(s => s - 1);
      } else {
        this.stopTimer();
        this.resetError.set('El tiempo de 2 minutos ha expirado. Por favor solicita un nuevo código.');
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  async onSendResetCode(): Promise<void> {
    if (!this.resetEmail || !this.resetEmail.includes('@')) {
      this.resetError.set('Por favor ingresa un correo electrónico válido.');
      return;
    }
    this.resetLoading.set(true);
    this.resetError.set('');

    try {
      await this.auth.requestPasswordResetCode(this.resetEmail);
      this.resetStep.set(2);
      this.resetCode = '';
      this.startTimer();
    } catch (err: any) {
      this.resetError.set(err.message || 'Error al enviar código de verificación.');
    } finally {
      this.resetLoading.set(false);
    }
  }

  async onResendCode(): Promise<void> {
    this.resetCode = '';
    await this.onSendResetCode();
  }

  async onVerifyCode(): Promise<void> {
    if (this.resetCode.trim().length !== 6) {
      this.resetError.set('El código debe tener 6 dígitos.');
      return;
    }
    if (this.timerSeconds() === 0) {
      this.resetError.set('El código ha expirado (2 minutos transcurridos). Solicita uno nuevo.');
      return;
    }

    this.resetLoading.set(true);
    this.resetError.set('');

    try {
      await this.auth.verifyPasswordResetCode(this.resetEmail, this.resetCode);
      this.stopTimer();
      this.resetStep.set(3);
    } catch (err: any) {
      this.resetError.set(err.message || 'Código incorrecto o expirado.');
    } finally {
      this.resetLoading.set(false);
    }
  }

  async onCompletePasswordReset(): Promise<void> {
    if (!this.newPassword || this.newPassword.length < 6) {
      this.resetError.set('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.resetError.set('Las contraseñas no coinciden.');
      return;
    }

    this.resetLoading.set(true);
    this.resetError.set('');

    try {
      if (this.oobCode) {
        await this.auth.confirmFirebasePasswordReset(this.oobCode, this.newPassword);
      } else {
        await this.auth.completePasswordReset(this.resetEmail, this.resetCode, this.newPassword);
      }
      this.resetStep.set(4);
    } catch (err: any) {
      this.resetError.set(err.message || 'Error al guardar la nueva contraseña.');
    } finally {
      this.resetLoading.set(false);
    }
  }

  finishResetAndLogin(): void {
    this.email = this.resetEmail;
    this.password = '';
    this.closeResetModal();
    this.mode = 'login';
  }

  private translateError(err: string): string {
    if (!err) return 'Ocurrió un error inesperado.';
    if (err.includes('auth/invalid-credential') || err.includes('auth/wrong-password') || err.includes('auth/user-not-found')) {
      return 'Correo o contraseña incorrectos.';
    }
    if (err.includes('auth/email-already-in-use')) {
      return 'Este correo ya está registrado en BeStrong. Por favor inicia sesión.';
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

