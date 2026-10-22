import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark border-bottom border-dark" style="background-color: #141219;">
      <div class="container-fluid px-3 px-md-4">
        <!-- Brand -->
        <a class="navbar-brand d-flex align-items-center gap-2" routerLink="/dashboard">
          <i class="bi bi-lightning-charge-fill text-primary fs-4"></i>
          <span class="fw-bold tracking-tight">BeStrong <span class="badge bg-primary text-white fs-8 ms-1">PRO</span></span>
        </a>

        <!-- Toggle Button for Mobile -->
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContent" aria-controls="navbarContent" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>

        <!-- Navbar Links -->
        <div class="collapse navbar-collapse" id="navbarContent">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item">
              <a class="nav-link d-flex align-items-center gap-2" routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
                <i class="bi bi-speedometer2"></i> Dashboard
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link d-flex align-items-center gap-2" routerLink="/generator" routerLinkActive="active">
                <i class="bi bi-plus-circle-fill text-success"></i> Generador de Rutinas
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link d-flex align-items-center gap-2" routerLink="/routines" routerLinkActive="active">
                <i class="bi bi-list-task"></i> Rutinas Asignadas
              </a>
            </li>
            <li class="nav-item" *ngIf="auth.currentUser()?.isSuperAdmin">
              <a class="nav-link d-flex align-items-center gap-2" routerLink="/admin-management" routerLinkActive="active">
                <i class="bi bi-shield-lock-fill text-warning"></i> Administradores
              </a>
            </li>
          </ul>

          <!-- User profile & Logout -->
          <div class="d-flex align-items-center gap-3">
            <div class="text-end d-none d-md-block">
              <div class="small fw-semibold text-light">{{ auth.currentUser()?.displayName }}</div>
              <span class="badge" [ngClass]="auth.currentUser()?.isSuperAdmin ? 'bg-warning text-dark' : 'bg-primary text-white'">
                {{ auth.currentUser()?.isSuperAdmin ? 'Super Admin' : 'Admin' }}
              </span>
            </div>
            <button class="btn btn-outline-danger btn-sm d-flex align-items-center gap-2" (click)="logout()">
              <i class="bi bi-box-arrow-right"></i> Salir
            </button>
          </div>
        </div>
      </div>
    </nav>
  `
})
export class NavbarComponent {
  public auth = inject(AuthService);
  private router = inject(Router);

  async logout(): Promise<void> {
    await this.auth.logout();
    this.router.navigate(['/login']);
  }
}
