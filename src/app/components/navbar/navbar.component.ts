import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark border-bottom" style="background-color: #08090d; border-color: rgba(255, 255, 255, 0.08) !important;">
      <div class="container-fluid px-3 px-md-4">
        <!-- Brand -->
        <a class="navbar-brand d-flex align-items-center gap-2" routerLink="/dashboard">
          <img src="logo.jpg" alt="Logo" class="rounded-2" style="width: 28px; height: 28px; object-fit: cover;">
          <span class="fw-bold tracking-tight text-light">BeStrong <span class="badge bg-dark border border-secondary text-secondary fs-8 ms-1">ADMIN</span></span>
        </a>

        <!-- Toggle Button for Mobile -->
        <button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContent" aria-controls="navbarContent" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>

        <!-- Navbar Links -->
        <div class="collapse navbar-collapse" id="navbarContent">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0 gap-1">
            <li class="nav-item">
              <a class="nav-link d-flex align-items-center gap-2 px-3 py-2 rounded-3 text-secondary" routerLink="/dashboard" routerLinkActive="active-nav" [routerLinkActiveOptions]="{exact: true}">
                <i class="bi bi-grid-1x2"></i> Dashboard
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link d-flex align-items-center gap-2 px-3 py-2 rounded-3 text-secondary" routerLink="/generator" routerLinkActive="active-nav">
                <i class="bi bi-cpu"></i> Generador
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link d-flex align-items-center gap-2 px-3 py-2 rounded-3 text-secondary" routerLink="/routines" routerLinkActive="active-nav">
                <i class="bi bi-collection"></i> Rutinas
              </a>
            </li>
            <li class="nav-item" *ngIf="auth.currentUser()?.isSuperAdmin">
              <a class="nav-link d-flex align-items-center gap-2 px-3 py-2 rounded-3 text-secondary" routerLink="/admin-management" routerLinkActive="active-nav">
                <i class="bi bi-shield-check"></i> Administradores
              </a>
            </li>
          </ul>

          <!-- User profile, Landing link & Logout -->
          <div class="d-flex align-items-center gap-3">
            <a routerLink="/" class="btn btn-outline-secondary btn-sm d-none d-lg-flex align-items-center gap-1 border-secondary py-1 px-2" style="font-size: 0.8rem;" title="Ver Landing Page">
              <i class="bi bi-globe"></i> Ver Landing
            </a>

            <div class="text-end d-none d-md-block">
              <div class="small fw-semibold text-light" style="font-size: 0.85rem;">{{ auth.currentUser()?.displayName }}</div>
              <span class="badge bg-dark border border-secondary text-secondary" style="font-size: 0.7rem;">
                {{ auth.currentUser()?.isSuperAdmin ? 'Superadmin' : 'Admin' }}
              </span>
            </div>

            <button class="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 border-secondary" (click)="logout()">
              <i class="bi bi-box-arrow-right"></i> Salir
            </button>
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .active-nav {
      color: #fff !important;
      background-color: rgba(255, 255, 255, 0.08);
      font-weight: 600;
    }
  `]
})
export class NavbarComponent {
  public auth = inject(AuthService);
  private router = inject(Router);

  async logout(): Promise<void> {
    await this.auth.logout();
    this.router.navigate(['/']);
  }
}
