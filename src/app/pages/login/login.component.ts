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
    <div class="container d-flex align-items-center justify-content-center min-vh-100">
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
                [disabled]="loading"
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
                [disabled]="loading"
              />
            </div>
          </div>

          <button 
            type="submit" 
            class="btn btn-primary w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2"
            [disabled]="loading || !email || !password"
          >
            <span *ngIf="loading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            <span>{{ loading ? 'Iniciando sesión...' : 'Ingresar al Panel' }}</span>
          </button>
        </form>

        <div class="text-center mt-4">
          <p class="text-secondary small mb-0">Solo cuentas autorizadas con rol de administración pueden acceder.</p>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
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
}
