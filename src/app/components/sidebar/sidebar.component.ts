import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
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
              (click)="closeMobileSidebar()"
            >
              <i class="bi bi-cpu"></i>
              <span>Generador Biomecánico</span>
            </a>
          </li>
          <li class="nav-item">
            <a 
              routerLink="/routines" 
              routerLinkActive="active-link" 
              class="nav-link-custom d-flex align-items-center gap-2 px-3 py-2 rounded-3 text-secondary text-decoration-none"
              (click)="closeMobileSidebar()"
            >
              <i class="bi bi-collection"></i>
              <span>Rutinas Asignadas</span>
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

      <!-- User Profile & Logout at Bottom -->
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
          <span class="badge" [ngClass]="auth.currentUser()?.isSuperAdmin ? 'bg-dark border border-warning text-warning' : 'bg-dark border border-secondary text-secondary'" style="font-size: 0.65rem;">
            {{ auth.currentUser()?.isSuperAdmin ? 'SUPERADMIN' : 'ADMIN' }}
          </span>
        </div>

        <button class="btn btn-outline-danger btn-sm w-100 py-1 d-flex align-items-center justify-content-center gap-2 rounded-3" style="font-size: 0.8rem;" (click)="logout()">
          <i class="bi bi-box-arrow-right"></i>
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
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

    .mobile-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(4px);
      z-index: 1025;
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

  toggleMobileSidebar(): void {
    this.isMobileOpen.update(v => !v);
  }

  closeMobileSidebar(): void {
    this.isMobileOpen.set(false);
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    this.router.navigate(['/']);
  }
}
