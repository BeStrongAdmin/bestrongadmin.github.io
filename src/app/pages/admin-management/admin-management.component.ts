import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { AuthService } from '../../services/auth.service';
import { UserManagementService, AdminUserRecord, AppUser } from '../../services/user-management.service';

@Component({
  selector: 'app-admin-management',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>

    <div class="container-fluid px-3 px-md-4 py-4">
      <!-- Title -->
      <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 class="h3 fw-bold mb-1 text-light">Gestión de Administradores</h1>
          <p class="text-secondary mb-0">Control de acceso exclusivo del Superadmin. Otorga o revoca permisos a entrenadores.</p>
        </div>
      </div>

      <!-- Feedback alert -->
      <div *ngIf="feedbackMsg" class="alert alert-info alert-dismissible fade show" role="alert">
        {{ feedbackMsg }}
        <button type="button" class="btn-close" (click)="feedbackMsg = ''"></button>
      </div>

      <!-- Navigation tabs between Current Admins and App Users -->
      <ul class="nav nav-tabs mb-4">
        <li class="nav-item">
          <button 
            class="nav-link py-3 px-4 d-flex align-items-center gap-2" 
            [class.active]="activeTab === 'admins'" 
            (click)="activeTab = 'admins'"
          >
            <i class="bi bi-shield-check text-warning"></i>
            <span>Administradores Activos ({{ admins.length }})</span>
          </button>
        </li>
        <li class="nav-item">
          <button 
            class="nav-link py-3 px-4 d-flex align-items-center gap-2" 
            [class.active]="activeTab === 'users'" 
            (click)="activeTab = 'users'"
          >
            <i class="bi bi-person-plus-fill text-primary"></i>
            <span>Promover Usuario Registrado en App</span>
          </button>
        </li>
      </ul>

      <!-- TAB 1: Current Admins -->
      <div *ngIf="activeTab === 'admins'">
        <div class="card border border-dark" style="background-color: #141219;">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-dark">
                <tr>
                  <th>Administrador</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th class="text-center">Rutinas Creadas</th>
                  <th class="text-center">Usuarios Entrenando</th>
                  <th class="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <!-- Superadmin main row -->
                <tr class="table-dark">
                  <td>
                    <div class="fw-bold text-warning">{{ auth.currentUser()?.displayName }} (Tú)</div>
                    <div class="small text-secondary">Propietario / Superadmin</div>
                  </td>
                  <td class="text-secondary">{{ auth.currentUser()?.email }}</td>
                  <td><span class="badge bg-warning text-dark">Super Admin</span></td>
                  <td><span class="badge bg-success">Activo Permanente</span></td>
                  <td class="text-center fw-bold">-</td>
                  <td class="text-center fw-bold">-</td>
                  <td class="text-end"><span class="badge bg-secondary">Sin restricciones</span></td>
                </tr>

                <!-- Additional admins -->
                <tr *ngFor="let adm of admins">
                  <td>
                    <div class="fw-semibold text-light">{{ adm.name }}</div>
                    <div class="small text-secondary">UID: {{ adm.uid }}</div>
                  </td>
                  <td class="text-secondary">{{ adm.email }}</td>
                  <td><span class="badge bg-primary">Admin</span></td>
                  <td>
                    <span class="badge" [ngClass]="adm.active ? 'bg-success' : 'bg-danger'">
                      {{ adm.active ? 'Activo' : 'Inactivo / Suspendido' }}
                    </span>
                  </td>
                  <td class="text-center fw-bold">{{ adm.routinesCreatedCount || 0 }}</td>
                  <td class="text-center fw-bold text-success">{{ adm.traineesCount || 0 }}</td>
                  <td class="text-end">
                    <div class="btn-group btn-group-sm">
                      <button 
                        class="btn" 
                        [ngClass]="adm.active ? 'btn-outline-warning' : 'btn-outline-success'"
                        (click)="toggleAdminStatus(adm)"
                      >
                        {{ adm.active ? 'Desactivar' : 'Activar' }}
                      </button>
                      <button class="btn btn-outline-danger" (click)="revokeAdmin(adm)">
                        <i class="bi bi-trash"></i> Revocar
                      </button>
                    </div>
                  </td>
                </tr>

                <tr *ngIf="admins.length === 0">
                  <td colspan="7" class="text-center py-4 text-secondary">
                    No hay administradores adicionales registrados. Ve a la pestaña "Promover Usuario Registrado en App".
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 2: App Users list to promote -->
      <div *ngIf="activeTab === 'users'">
        <div class="card border border-dark p-3 mb-4" style="background-color: #141219;">
          <div class="row g-2 align-items-center">
            <div class="col-12 col-md-8">
              <div class="input-group">
                <span class="input-group-text bg-dark border-secondary text-secondary">
                  <i class="bi bi-search"></i>
                </span>
                <input 
                  type="text" 
                  class="form-control" 
                  placeholder="Filtrar por nombre, correo o username..." 
                  [(ngModel)]="userSearchQuery"
                >
              </div>
            </div>
            <div class="col-12 col-md-4 text-md-end">
              <button class="btn btn-outline-secondary w-100 w-md-auto d-flex align-items-center justify-content-center gap-2" (click)="loadAppUsers()">
                <i class="bi bi-arrow-clockwise"></i> Recargar Usuarios
              </button>
            </div>
          </div>
        </div>

        <div class="card border border-dark" style="background-color: #141219;">
          <div *ngIf="loadingUsers" class="text-center py-5">
            <div class="spinner-border text-primary" role="status"></div>
            <div class="small text-secondary mt-2">Cargando usuarios registrados en la app móvil...</div>
          </div>

          <div *ngIf="!loadingUsers" class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-dark">
                <tr>
                  <th>Usuario</th>
                  <th>Username</th>
                  <th>Correo</th>
                  <th>Nivel / XP</th>
                  <th class="text-end">Acción</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let u of filteredAppUsers">
                  <td>
                    <div class="d-flex align-items-center gap-2">
                      <div class="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-dark fw-bold" style="width: 36px; height: 36px;">
                        {{ (u.displayName || u.username || 'U').charAt(0).toUpperCase() }}
                      </div>
                      <div>
                        <div class="fw-semibold text-light">{{ u.displayName }}</div>
                        <div class="small text-secondary font-monospace">{{ u.uid }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="text-secondary">{{ u.username || '-' }}</td>
                  <td class="text-secondary">{{ u.email || 'Sin correo público' }}</td>
                  <td>
                    <span class="badge bg-dark border border-secondary text-light">Nivel {{ u.level || 1 }}</span>
                    <span class="small text-secondary ms-1">{{ u.xp || 0 }} XP</span>
                  </td>
                  <td class="text-end">
                    <button 
                      *ngIf="!isUserAlreadyAdmin(u.uid)"
                      class="btn btn-primary btn-sm d-flex align-items-center gap-1 ms-auto"
                      (click)="promoteUser(u)"
                    >
                      <i class="bi bi-shield-plus"></i> Asignar Rol Admin
                    </button>
                    <span *ngIf="isUserAlreadyAdmin(u.uid)" class="badge bg-success">
                      <i class="bi bi-check2-circle"></i> Ya es Admin
                    </span>
                  </td>
                </tr>
                <tr *ngIf="filteredAppUsers.length === 0">
                  <td colspan="5" class="text-center py-5 text-secondary">
                    No se encontraron usuarios en la base de datos de la app.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminManagementComponent implements OnInit {
  public auth = inject(AuthService);
  private userMgmt = inject(UserManagementService);

  activeTab: 'admins' | 'users' = 'admins';
  admins: AdminUserRecord[] = [];
  appUsers: AppUser[] = [];
  loadingUsers = false;
  userSearchQuery = '';
  feedbackMsg = '';

  async ngOnInit(): Promise<void> {
    await this.loadAdmins();
    await this.loadAppUsers();
  }

  async loadAdmins(): Promise<void> {
    try {
      this.admins = await this.userMgmt.listAdmins();
    } catch (err: any) {
      console.error(err);
    }
  }

  async loadAppUsers(): Promise<void> {
    this.loadingUsers = true;
    try {
      this.appUsers = await this.userMgmt.listRegisteredUsers();
    } catch (err: any) {
      this.feedbackMsg = err.message || 'Error cargando usuarios de la app.';
    } finally {
      this.loadingUsers = false;
    }
  }

  get filteredAppUsers(): AppUser[] {
    const q = this.userSearchQuery.toLowerCase().trim();
    if (!q) return this.appUsers;
    return this.appUsers.filter(u => 
      (u.displayName && u.displayName.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q))
    );
  }

  isUserAlreadyAdmin(uid: string): boolean {
    if (uid === this.auth.currentUser()?.uid) return true;
    return this.admins.some(a => a.uid === uid);
  }

  async promoteUser(u: AppUser): Promise<void> {
    const currentSuper = this.auth.currentUser();
    if (!currentSuper) return;

    if (!confirm(`¿Deseas otorgar permisos de Administrador a "${u.displayName || u.username}"?`)) {
      return;
    }

    try {
      await this.userMgmt.promoteToAdmin(u, currentSuper.uid);
      this.feedbackMsg = `¡"${u.displayName || u.username}" ahora es Administrador! Puede acceder al panel web.`;
      await this.loadAdmins();
      this.activeTab = 'admins';
    } catch (err: any) {
      alert(err.message || 'Error otorgando rol de administrador.');
    }
  }

  async toggleAdminStatus(adm: AdminUserRecord): Promise<void> {
    try {
      await this.userMgmt.setAdminActiveStatus(adm.uid, !adm.active);
      adm.active = !adm.active;
      this.feedbackMsg = `Estado de "${adm.name}" actualizado a ${adm.active ? 'Activo' : 'Inactivo'}.`;
    } catch (err: any) {
      alert(err.message || 'Error al cambiar estado.');
    }
  }

  async revokeAdmin(adm: AdminUserRecord): Promise<void> {
    if (!confirm(`¿Estás seguro de revocar permanentemente los permisos de Administrador a "${adm.name}"?`)) {
      return;
    }
    try {
      await this.userMgmt.revokeAdmin(adm.uid);
      this.admins = this.admins.filter(a => a.uid !== adm.uid);
      this.feedbackMsg = `Permisos de administrador revocados a "${adm.name}".`;
    } catch (err: any) {
      alert(err.message || 'Error revocando permisos.');
    }
  }
}
