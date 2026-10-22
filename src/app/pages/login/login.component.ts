import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container d-flex align-items-center justify-content-center min-vh-100 py-4">
      <div class="card p-4 p-md-5 border border-dark shadow-lg" style="max-width: 440px; width: 100%; background-color: #141219; border-radius: 1rem;">
        <div class="text-center mb-4">
          <div class="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary p-3 mb-3 text-white">
            <i class="bi bi-lightning-charge-fill fs-2"></i>
          </div>
          <h2 class="fw-bold mb-1 text-light">BeStrong Admin</h2>
          <p class="text-secondary small">Panel Web Exclusivo para Administradores y Entrenadores</p>
        </div>

        <div *ngIf="errorMessage" class="alert alert-danger d-flex align-items-center gap-2 py-2 small" role="alert">
          <i class="bi bi-exclamation-triangle-fill flex-shrink-0"></i>
          <div>{{ errorMessage }}</div>
        </div>

        <!-- Google Sign-In Button -->
        <button 
          type="button" 
          class="btn btn-outline-light w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2 mb-3 shadow-sm border-secondary"
          style="background-color: #1a1723;"
          (click)="onLoginWithGoogle()"
          [disabled]="loading || loadingGoogle"
        >
          <span *ngIf="loadingGoogle" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          <svg *ngIf="!loadingGoogle" width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>{{ loadingGoogle ? 'Conectando con Google...' : 'Continuar con Google' }}</span>
        </button>

        <div class="d-flex align-items-center my-3 text-secondary">
          <hr class="flex-grow-1 border-secondary opacity-25">
          <span class="px-2 small text-uppercase" style="font-size: 0.72rem; letter-spacing: 0.5px;">o con correo y contraseña</span>
          <hr class="flex-grow-1 border-secondary opacity-25">
        </div>

        <form (ngSubmit)="onLogin()">
          <div class="mb-3">
            <label class="form-label text-secondary small fw-medium">Correo Electrónico</label>
            <div class="input-group">
              <span class="input-group-text bg-dark border-secondary text-secondary">
                <i class="bi bi-envelope"></i>
              </span>
              <input 
                type="email" 
                class="form-control" 
                placeholder="admin@bestrong.com" 
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
            class="btn btn-primary w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2"
            [disabled]="loading || loadingGoogle || !email || !password"
          >
            <span *ngIf="loading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            <span>{{ loading ? 'Iniciando sesión...' : 'Ingresar al Panel' }}</span>
          </button>
        </form>

        <div class="text-center mt-4">
          <p class="text-secondary small mb-0">Solo cuentas autorizadas con rol de administración en Firestore pueden acceder.</p>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  loadingGoogle = false;
  errorMessage = '';

  private auth = inject(AuthService);
  private router = inject(Router);

  async onLogin(): Promise<void> {
    if (!this.email || !this.password) return;
    this.loading = true;
    this.errorMessage = '';

    try {
      await this.auth.login(this.email, this.password);
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      this.errorMessage = err.message || 'Error al iniciar sesión. Revisa tus credenciales.';
    } finally {
      this.loading = false;
    }
  }

  async onLoginWithGoogle(): Promise<void> {
    this.loadingGoogle = true;
    this.errorMessage = '';

    try {
      await this.auth.loginWithGoogle();
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      this.errorMessage = err.message || 'Error al iniciar sesión con Google.';
    } finally {
      this.loadingGoogle = false;
    }
  }
}
