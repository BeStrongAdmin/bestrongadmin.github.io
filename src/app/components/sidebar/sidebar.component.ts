import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  template: `
    <!-- Mobile Top Bar (Only visible on screens < 992px) -->
    <header class="d-lg-none d-flex align-items-center justify-content-between px-3 py-2 border-bottom border-dark" style="background-color: #08090d; position: sticky; top: 0; z-index: 1020;">
      <a routerLink="/dashboard" class="d-flex align-items-center gap-2 text-decoration-none">
        <img src="logo.jpg" alt="BeStrong Logo" class="rounded-2" style="width: 28px; height: 28px; object-fit: cover;">
        <span class="fw-bold text-light fs-6">BeStrong <span class="badge bg-dark border border-secondary text-secondary" style="font-size: 0.65rem;">ADMIN</span></span>
      </a>

      <button class="btn btn-outline-secondary btn-sm border-0 text-light" type="button" (click)="toggleMobileSidebar()">
        <i class="bi fs-4" [ngClass]="isMobileOpen() ? 'bi-x-lg' : 'bi-list'"></i>
      </button>
    </header>

    <!-- Mobile Backdrop -->
    <div *ngIf="isMobileOpen()" class="mobile-backdrop d-lg-none" (click)="closeMobileSidebar()"></div>

    <!-- Sidebar Container -->
    <aside 
      class="admin-sidebar d-flex flex-column border-end" 
      [class.mobile-open]="isMobileOpen()"
    >
      <!-- Brand & Header -->
      <div class="px-4 py-3 d-flex align-items-center justify-content-between border-bottom" style="border-color: rgba(255, 255, 255, 0.06) !important;">
        <a routerLink="/dashboard" class="d-flex align-items-center gap-2 text-decoration-none">
          <img src="logo.jpg" alt="Logo" class="rounded-2" style="width: 32px; height: 32px; object-fit: cover;">
          <div>
            <div class="fw-bold text-light tracking-tight lh-1" style="font-size: 1.05rem;">BeStrong</div>
            <small class="text-secondary" style="font-size: 0.7rem; letter-spacing: 0.5px;">ADMIN PANEL</small>
          </div>
        </a>
        <button class="btn btn-sm btn-link text-secondary d-lg-none p-0" (click)="closeMobileSidebar()">
          <i class="bi bi-x-lg fs-5"></i>
        </button>
      </div>

      <!-- Navigation Content -->
      <div class="sidebar-content flex-grow-1 px-3 py-3 overflow-y-auto">
        
        <!-- SECTION 1: GENERAL -->
        <div class="nav-category text-uppercase small fw-bold px-3 mb-2" style="color: #636b7b; font-size: 0.68rem; letter-spacing: 0.8px;">
          General
        </div>
        <ul class="nav flex-column mb-3 gap-1">
          <li class="nav-item">
            <a 
              routerLink="/dashboard" 
              routerLinkActive="active-link" 
              [routerLinkActiveOptions]="{exact: true}"
              class="nav-link-custom d-flex align-items-center gap-2 px-3 py-2 rounded-3 text-secondary text-decoration-none"
              (click)="closeMobileSidebar()"
            >
              <i class="bi bi-grid-1x2"></i>
              <span>Dashboard</span>
            </a>
          </li>
        </ul>

        <!-- SECTION 2: GESTIÓN DE RUTINAS -->
        <div class="nav-category text-uppercase small fw-bold px-3 mb-2" style="color: #636b7b; font-size: 0.68rem; letter-spacing: 0.8px;">
          Gestión de Rutinas
        </div>
        <ul class="nav flex-column mb-3 gap-1">
          <li class="nav-item">
            <a 
              routerLink="/generator" 
              routerLinkActive="active-link" 
              class="nav-link-custom d-flex align-items-center gap-2 px-3 py-2 rounded-3 text-secondary text-decoration-none"
              [class.opacity-50]="!auth.currentUser()?.isAdmin"
              (click)="closeMobileSidebar()"
            >
              <i class="bi bi-cpu"></i>
              <span>Generador Biomecánico</span>
              <i *ngIf="!auth.currentUser()?.isAdmin" class="bi bi-lock-fill ms-auto text-warning opacity-75" style="font-size: 0.75rem;" title="Bloqueado hasta aprobación"></i>
            </a>
          </li>
          <li class="nav-item">
            <a 
              routerLink="/routines" 
              routerLinkActive="active-link" 
              class="nav-link-custom d-flex align-items-center gap-2 px-3 py-2 rounded-3 text-secondary text-decoration-none"
              [class.opacity-50]="!auth.currentUser()?.isAdmin"
              (click)="closeMobileSidebar()"
            >
              <i class="bi bi-collection"></i>
              <span>Rutinas Asignadas</span>
              <i *ngIf="!auth.currentUser()?.isAdmin" class="bi bi-lock-fill ms-auto text-warning opacity-75" style="font-size: 0.75rem;" title="Bloqueado hasta aprobación"></i>
            </a>
          </li>
        </ul>

        <!-- SECTION 3: ADMINISTRACIÓN (Superadmin only) -->
        <div *ngIf="auth.currentUser()?.isSuperAdmin" class="nav-category text-uppercase small fw-bold px-3 mb-2" style="color: #636b7b; font-size: 0.68rem; letter-spacing: 0.8px;">
          Administración
        </div>
        <ul *ngIf="auth.currentUser()?.isSuperAdmin" class="nav flex-column mb-3 gap-1">
          <li class="nav-item">
            <a 
              routerLink="/admin-management" 
              routerLinkActive="active-link" 
              class="nav-link-custom d-flex align-items-center gap-2 px-3 py-2 rounded-3 text-secondary text-decoration-none"
              (click)="closeMobileSidebar()"
            >
              <i class="bi bi-shield-check"></i>
              <span>Entrenadores & Atletas</span>
            </a>
          </li>
        </ul>

        <!-- SECTION 4: ENLACES EXTERNOS -->
        <div class="nav-category text-uppercase small fw-bold px-3 mb-2" style="color: #636b7b; font-size: 0.68rem; letter-spacing: 0.8px;">
          Accesos
        </div>
        <ul class="nav flex-column mb-3 gap-1">
          <li class="nav-item">
            <a 
              routerLink="/" 
              class="nav-link-custom d-flex align-items-center gap-2 px-3 py-2 rounded-3 text-secondary text-decoration-none"
              (click)="closeMobileSidebar()"
            >
              <i class="bi bi-globe"></i>
              <span>Ver Landing Page</span>
            </a>
          </li>
          <li class="nav-item">
            <a 
              routerLink="/coaches" 
              class="nav-link-custom d-flex align-items-center gap-2 px-3 py-2 rounded-3 text-secondary text-decoration-none"
              (click)="closeMobileSidebar()"
            >
              <i class="bi bi-info-circle text-success"></i>
              <span>Landing de Coaches</span>
            </a>
          </li>
          <li class="nav-item">
            <a 
              href="https://play.google.com/store/apps/details?id=com.BeStrong&pcampaignid=web_share" 
              target="_blank" 
              rel="noopener noreferrer"
              class="nav-link-custom d-flex align-items-center gap-2 px-3 py-2 rounded-3 text-secondary text-decoration-none"
            >
              <i class="bi bi-google-play text-success"></i>
              <span>App en Google Play</span>
            </a>
          </li>
        </ul>
      </div>

      <!-- User Profile & Account Actions at Bottom -->
      <div class="p-3 border-top" style="border-color: rgba(255, 255, 255, 0.06) !important; background: rgba(0, 0, 0, 0.2);">
        <div class="d-flex align-items-center justify-content-between mb-2">
          <div class="overflow-hidden me-2">
            <div class="text-light fw-semibold small text-truncate" style="font-size: 0.85rem;">
              {{ auth.currentUser()?.displayName }}
            </div>
            <div class="text-secondary small text-truncate" style="font-size: 0.72rem;">
              {{ auth.currentUser()?.email }}
            </div>
          </div>
          <span 
            class="badge" 
            [ngClass]="auth.currentUser()?.isSuperAdmin ? 'bg-dark border border-warning text-warning' : (auth.currentUser()?.isAdmin ? 'bg-dark border border-success text-success' : 'bg-dark border border-warning text-warning')" 
            style="font-size: 0.65rem;"
          >
            {{ auth.currentUser()?.isSuperAdmin ? 'SUPERADMIN' : (auth.currentUser()?.isAdmin ? 'COACH' : 'PENDIENTE') }}
          </span>
        </div>

        <!-- Change password button -->
        <button 
          type="button" 
          class="btn btn-outline-secondary btn-sm w-100 py-1 mb-2 d-flex align-items-center justify-content-center gap-2 rounded-3 text-secondary hover-light" 
          style="font-size: 0.8rem; border-color: rgba(255, 255, 255, 0.12);" 
          (click)="openChangePasswordModal()"
        >
          <i class="bi bi-key text-warning"></i>
          <span>Cambiar Contraseña</span>
        </button>

        <button class="btn btn-outline-danger btn-sm w-100 py-1 d-flex align-items-center justify-content-center gap-2 rounded-3" style="font-size: 0.8rem;" (click)="logout()">
          <i class="bi bi-box-arrow-right"></i>
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>

    <!-- CHANGE PASSWORD MODAL FOR LOGGED-IN USERS -->
    <div *ngIf="auth.showChangePasswordModal()" class="modal-backdrop-custom d-flex align-items-center justify-content-center p-3">
      <div class="card p-4 border border-secondary border-opacity-50 shadow-2xl position-relative text-light" style="max-width: 440px; width: 100%; background-color: #0d0f15; border-radius: 1.25rem;">
        
        <button type="button" class="btn-close btn-close-white position-absolute top-0 end-0 m-3" (click)="closeChangePasswordModal()" aria-label="Close"></button>

        <div class="text-center mb-3">
          <div class="d-inline-flex align-items-center justify-content-center rounded-circle bg-dark border border-secondary p-3 mb-2 text-warning">
            <i class="bi bi-shield-lock-fill fs-3"></i>
          </div>
          <h4 class="fw-bold mb-1 text-light">Cambiar Contraseña</h4>
          <p class="text-secondary small mb-0">
            Actualiza la clave de acceso para tu cuenta <strong class="text-light">{{ auth.currentUser()?.email }}</strong>.
          </p>
        </div>

        <!-- Success message -->
        <div *ngIf="changeSuccess" class="alert alert-success d-flex align-items-center gap-2 py-2 small mb-3 border-0 bg-success bg-opacity-10 text-success rounded-3">
          <i class="bi bi-check-circle-fill flex-shrink-0 fs-5"></i>
          <div>{{ changeSuccess }}</div>
        </div>

        <!-- Error message -->
        <div *ngIf="changeError" class="alert alert-danger d-flex align-items-center gap-2 py-2 small mb-3 border-0 bg-danger bg-opacity-10 text-danger rounded-3">
          <i class="bi bi-exclamation-triangle-fill flex-shrink-0"></i>
          <div>{{ changeError }}</div>
        </div>

        <form *ngIf="!changeSuccess" (ngSubmit)="onChangePassword()">
          <div class="mb-3">
            <label class="form-label text-secondary small fw-medium">Contraseña Actual</label>
            <div class="input-group">
              <span class="input-group-text bg-dark border-secondary text-secondary">
                <i class="bi bi-lock"></i>
              </span>
              <input 
                type="password" 
                class="form-control" 
                placeholder="Tu contraseña actual" 
                [(ngModel)]="currentPassword" 
                name="currentPassword" 
                required 
                [disabled]="changingPassword"
              />
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label text-secondary small fw-medium">Nueva Contraseña (Mínimo 6 caracteres)</label>
            <div class="input-group">
              <span class="input-group-text bg-dark border-secondary text-secondary">
                <i class="bi bi-key"></i>
              </span>
              <input 
                type="password" 
                class="form-control" 
                placeholder="••••••••" 
                [(ngModel)]="newPassword" 
                name="newPassword" 
                required 
                minlength="6"
                [disabled]="changingPassword"
              />
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label text-secondary small fw-medium">Confirmar Nueva Contraseña</label>
            <div class="input-group">
              <span class="input-group-text bg-dark border-secondary text-secondary">
                <i class="bi bi-key-fill"></i>
              </span>
              <input 
                type="password" 
                class="form-control" 
                placeholder="••••••••" 
                [(ngModel)]="confirmPassword" 
                name="confirmPassword" 
                required 
                minlength="6"
                [disabled]="changingPassword"
              />
            </div>
          </div>

          <div class="mb-3 text-end">
            <button 
              type="button" 
              class="btn btn-link text-secondary text-decoration-none small p-0 hover-light" 
              style="font-size: 0.8rem;"
              (click)="onSendResetEmailDirect()"
              [disabled]="changingPassword"
            >
              <i class="bi bi-envelope me-1"></i> ¿Olvidaste tu contraseña actual? Enviar correo
            </button>
          </div>

          <button 
            type="submit" 
            class="btn btn-success text-dark w-100 py-2 fw-bold d-flex align-items-center justify-content-center gap-2 mb-2"
            style="border-radius: 12px; background-color: #00e676; border-color: #00e676;"
            [disabled]="changingPassword || !currentPassword || !newPassword || newPassword.length < 6 || newPassword !== confirmPassword"
          >
            <span *ngIf="changingPassword" class="spinner-border spinner-border-sm text-dark" role="status" aria-hidden="true"></span>
            <span>{{ changingPassword ? 'Actualizando...' : 'Actualizar Contraseña' }}</span>
          </button>
        </form>

        <button 
          *ngIf="changeSuccess" 
          type="button" 
          class="btn btn-light w-100 py-2 fw-bold rounded-3 mt-2" 
          (click)="closeChangePasswordModal()"
        >
          Cerrar
        </button>
      </div>
    </div>
  `,
  styles: [`
    .admin-sidebar {
      width: 250px;
      min-width: 250px;
      height: 100vh;
      position: sticky;
      top: 0;
      background-color: #06070a;
      border-color: rgba(255, 255, 255, 0.06) !important;
      z-index: 1030;
      transition: transform 0.3s ease;
    }

    .nav-link-custom {
      font-size: 0.88rem;
      font-weight: 500;
      transition: background-color 0.15s ease, color 0.15s ease;
      &:hover {
        background-color: rgba(255, 255, 255, 0.04);
        color: #f7fafc !important;
      }
    }

    .active-link {
      background-color: rgba(255, 255, 255, 0.08) !important;
      color: #00e676 !important;
      font-weight: 600;
    }

    .hover-light:hover {
      color: #fff !important;
    }

    .mobile-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(4px);
      z-index: 1025;
    }

    .modal-backdrop-custom {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(3, 4, 6, 0.88);
      backdrop-filter: blur(8px);
      z-index: 1060;
    }

    @media (max-width: 991.98px) {
      .admin-sidebar {
        position: fixed;
        left: 0;
        top: 0;
        bottom: 0;
        transform: translateX(-100%);
      }
      .admin-sidebar.mobile-open {
        transform: translateX(0);
      }
    }
  `]
})
export class SidebarComponent {
  public auth = inject(AuthService);
  private router = inject(Router);

  public isMobileOpen = signal<boolean>(false);

  // Formulario de cambio de contraseña dentro del panel
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  changingPassword = false;
  changeError = '';
  changeSuccess = '';

  toggleMobileSidebar(): void {
    this.isMobileOpen.update(v => !v);
  }

  closeMobileSidebar(): void {
    this.isMobileOpen.set(false);
  }

  openChangePasswordModal(): void {
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.changeError = '';
    this.changeSuccess = '';
    this.auth.openChangePasswordModal();
    this.closeMobileSidebar();
  }

  closeChangePasswordModal(): void {
    this.auth.closeChangePasswordModal();
    this.changeError = '';
    this.changeSuccess = '';
  }

  async onChangePassword(): Promise<void> {
    if (!this.currentPassword || !this.newPassword) return;
    if (this.newPassword !== this.confirmPassword) {
      this.changeError = 'Las nuevas contraseñas no coinciden.';
      return;
    }

    this.changingPassword = true;
    this.changeError = '';
    this.changeSuccess = '';

    try {
      await this.auth.changePasswordLoggedIn(this.currentPassword, this.newPassword);
      this.changeSuccess = '🎉 ¡Contraseña actualizada exitosamente en tu cuenta!';
      this.currentPassword = '';
      this.newPassword = '';
      this.confirmPassword = '';
    } catch (err: any) {
      const msg = err.code || err.message || '';
      if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password')) {
        this.changeError = 'La contraseña actual ingresada es incorrecta.';
      } else if (msg.includes('auth/weak-password')) {
        this.changeError = 'La nueva contraseña debe tener al menos 6 caracteres.';
      } else {
        this.changeError = err.message || 'Error al cambiar la contraseña.';
      }
    } finally {
      this.changingPassword = false;
    }
  }

  async onSendResetEmailDirect(): Promise<void> {
    this.changingPassword = true;
    this.changeError = '';
    try {
      await this.auth.sendResetEmailToCurrentUser();
      this.changeSuccess = `📧 Se ha enviado un enlace oficial de recuperación a ${this.auth.currentUser()?.email}. Revisa tu bandeja de entrada o spam.`;
    } catch (err: any) {
      this.changeError = err.message || 'No se pudo enviar el correo de recuperación.';
    } finally {
      this.changingPassword = false;
    }
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    this.router.navigate(['/']);
  }
}

