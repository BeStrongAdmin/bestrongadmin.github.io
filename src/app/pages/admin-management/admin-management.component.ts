import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { AuthService } from '../../services/auth.service';
import { UserManagementService, AdminUserRecord, AppUser } from '../../services/user-management.service';

@Component({
  selector: 'app-admin-management',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  template: `
    <div class="d-flex flex-column flex-lg-row min-vh-100" style="background-color: #07080b;">
      <app-sidebar></app-sidebar>

      <main class="flex-grow-1 px-3 px-md-5 py-4 overflow-x-hidden">
        <!-- Header -->
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <div>
            <h1 class="h4 fw-bold mb-1 text-light tracking-tight">Administración de Entrenadores</h1>
            <p class="text-secondary small mb-0">Control de acceso exclusivo del Superadmin. Gestiona roles y permisos.</p>
          </div>
        </div>

        <!-- Feedback Alert -->
        <div *ngIf="feedbackMsg()" class="alert alert-info alert-dismissible fade show border-0 bg-info bg-opacity-10 text-info py-2 small rounded-3" role="alert">
          {{ feedbackMsg() }}
          <button type="button" class="btn-close btn-close-white" (click)="feedbackMsg.set('')"></button>
        </div>

        <!-- Navigation Tabs -->
        <ul class="nav nav-tabs mb-4 border-0 gap-2">
          <li class="nav-item">
            <button 
              type="button"
              class="tab-btn btn btn-sm d-flex align-items-center gap-2 px-3 py-2 rounded-3 border-0" 
              [class.active-tab]="activeTab() === 'admins'" 
              (click)="activeTab.set('admins')"
            >
              <i class="bi bi-shield-check"></i>
              <span>Entrenadores Activos ({{ admins().length }})</span>
            </button>
          </li>
          <li class="nav-item">
            <button 
              type="button"
              class="tab-btn btn btn-sm d-flex align-items-center gap-2 px-3 py-2 rounded-3 border-0" 
              [class.active-tab]="activeTab() === 'users'" 
              (click)="activeTab.set('users')"
            >
              <i class="bi bi-person-plus"></i>
              <span>Promover Atleta de la App</span>
            </button>
          </li>
        </ul>

        <!-- TAB 1: Current Admins -->
        <div *ngIf="activeTab() === 'admins'">
          <div class="card border-0 rounded-4 panel-card overflow-hidden">
            <div *ngIf="loadingAdmins()" class="text-center py-5">
              <div class="spinner-border spinner-border-sm text-secondary" role="status"></div>
              <div class="small text-secondary mt-2">Cargando entrenadores del sistema...</div>
            </div>

            <div *ngIf="!loadingAdmins()" class="table-responsive">
              <table class="table table-hover align-middle mb-0 custom-table">
                <thead>
                  <tr>
                    <th class="ps-4">Entrenador</th>
                    <th>Correo</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th class="text-center">Rutinas</th>
                    <th class="text-center">Atletas</th>
                    <th class="text-end pe-4">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <!-- Superadmin row -->
                  <tr>
                    <td class="ps-4">
                      <div class="fw-bold text-light">{{ auth.currentUser()?.displayName }} (Tú)</div>
                      <div class="small text-secondary font-monospace" style="font-size: 0.72rem;">Propietario / Superadmin</div>
                    </td>
                    <td class="text-secondary small">{{ auth.currentUser()?.email }}</td>
                    <td><span class="badge badge-subtle">Superadmin</span></td>
                    <td><span class="badge badge-active">Activo Permanente</span></td>
                    <td class="text-center fw-bold text-light">-</td>
                    <td class="text-center fw-bold text-light">-</td>
                    <td class="text-end pe-4"><span class="badge badge-subtle">Principal</span></td>
                  </tr>

                  <!-- Additional admins -->
                  <tr *ngFor="let adm of admins(); trackBy: trackByAdminUid" [class.table-warning-bg]="!adm.active && adm.requestStatus === 'pending'">
                    <td class="ps-4">
                      <div class="fw-semibold text-light">{{ adm.name }}</div>
                      <div *ngIf="adm.phone" class="small text-secondary">
                        <i class="bi bi-whatsapp text-success me-1"></i>{{ adm.phone }}
                      </div>
                      <div class="small text-secondary font-monospace" style="font-size: 0.7rem;">UID: {{ adm.uid }}</div>
                    </td>
                    <td class="text-secondary small">{{ adm.email }}</td>
                    <td>
                      <span class="badge badge-subtle" [class.text-warning]="isSuperAdmin(adm.uid)">
                        {{ isSuperAdmin(adm.uid) ? 'Superadmin' : 'Coach' }}
                      </span>
                    </td>
                    <td>
                      <span *ngIf="isSuperAdmin(adm.uid)" class="badge badge-active">Activo Permanente</span>
                      <span *ngIf="!isSuperAdmin(adm.uid) && adm.active" class="badge badge-active">Activo</span>
                      <span *ngIf="!isSuperAdmin(adm.uid) && !adm.active && adm.requestStatus === 'pending'" class="badge bg-warning bg-opacity-25 text-warning border border-warning border-opacity-50 fw-semibold">
                        <i class="bi bi-hourglass-split me-1"></i>Pendiente Aprobación
                      </span>
                      <span *ngIf="!isSuperAdmin(adm.uid) && !adm.active && adm.requestStatus !== 'pending'" class="badge badge-inactive">Suspendido</span>
                    </td>
                    <td class="text-center fw-bold text-light">{{ adm.routinesCreatedCount || 0 }}</td>
                    <td class="text-center fw-bold text-light">{{ adm.traineesCount || 0 }}</td>
                    <td class="text-end pe-4">
                      <span *ngIf="isSuperAdmin(adm.uid)" class="badge badge-subtle text-warning">Superadmin</span>
                      <div *ngIf="!isSuperAdmin(adm.uid)" class="btn-group btn-group-sm">
                        <button 
                          *ngIf="!adm.active"
                          class="btn btn-sm btn-success text-dark fw-bold" 
                          (click)="toggleAdminStatus(adm)"
                          title="Aprobar y activar acceso administrativo completo"
                        >
                          <i class="bi bi-check2-circle me-1"></i> Aprobar
                        </button>
                        <button 
                          *ngIf="adm.active"
                          class="btn btn-sm btn-outline-secondary" 
                          (click)="toggleAdminStatus(adm)"
                        >
                          Suspender
                        </button>
                        <button class="btn btn-sm btn-outline-danger" (click)="revokeAdmin(adm)" title="Revocar cuenta">
                          <i class="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>

                  <tr *ngIf="admins().length === 0">
                    <td colspan="7" class="text-center py-5 text-secondary small">
                      No hay entrenadores adicionales registrados. Ve a la pestaña "Promover Atleta de la App".
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- TAB 2: App Users list to promote -->
        <div *ngIf="activeTab() === 'users'">
          <div class="card p-3 rounded-4 border-0 panel-card mb-4">
            <div class="row g-2 align-items-center">
              <div class="col-12 col-md-8">
                <div class="input-group">
                  <span class="input-group-text bg-dark border-secondary text-secondary">
                    <i class="bi bi-search"></i>
                  </span>
                  <input 
                    type="text" 
                    class="form-control form-control-sm rounded-end-3" 
                    placeholder="Filtrar por nombre, correo o username..." 
                    [(ngModel)]="userSearchQuery"
                    (ngModelChange)="onUserSearchChange()"
                  >
                </div>
              </div>
              <div class="col-12 col-md-4 text-md-end">
                <button class="btn btn-outline-secondary btn-sm rounded-3 w-100 w-md-auto d-flex align-items-center justify-content-center gap-2" (click)="loadAppUsers()">
                  <i class="bi bi-arrow-clockwise"></i> Recargar Atletas
                </button>
              </div>
            </div>
          </div>

          <div class="card border-0 rounded-4 panel-card overflow-hidden">
            <div *ngIf="loadingUsers()" class="text-center py-5">
              <div class="spinner-border spinner-border-sm text-secondary" role="status"></div>
              <div class="small text-secondary mt-2">Cargando atletas registrados en la app móvil...</div>
            </div>

            <div *ngIf="!loadingUsers()" class="table-responsive">
              <table class="table table-hover align-middle mb-0 custom-table">
                <thead>
                  <tr>
                    <th class="ps-4">Atleta</th>
                    <th>Username</th>
                    <th>Correo</th>
                    <th>Nivel / XP</th>
                    <th class="text-end pe-4">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let u of cachedFilteredAppUsers(); trackBy: trackByUserUid">
                    <td class="ps-4">
                      <div class="d-flex align-items-center gap-2">
                        <div class="rounded-circle bg-dark border border-secondary d-flex align-items-center justify-content-center text-light fw-bold" style="width: 32px; height: 32px; font-size: 0.8rem;">
                          {{ (u.displayName || u.username || 'A').charAt(0).toUpperCase() }}
                        </div>
                        <div>
                          <div class="fw-semibold text-light small">{{ u.displayName }}</div>
                          <div class="small text-secondary font-monospace" style="font-size: 0.7rem;">{{ u.uid }}</div>
                        </div>
                      </div>
                    </td>
                    <td class="text-secondary small">{{ u.username || '-' }}</td>
                    <td class="text-secondary small">{{ u.email || 'Sin correo público' }}</td>
                    <td>
                      <span class="badge badge-subtle">Nivel {{ u.level || 1 }}</span>
                      <span class="small text-secondary ms-1" style="font-size: 0.75rem;">{{ u.xp || 0 }} XP</span>
                    </td>
                    <td class="text-end pe-4">
                      <button 
                        *ngIf="!isUserAlreadyAdmin(u.uid)"
                        class="btn btn-light btn-sm fw-semibold d-inline-flex align-items-center gap-1 rounded-3 py-1 px-3"
                        style="font-size: 0.8rem;"
                        (click)="promoteUser(u)"
                      >
                        <i class="bi bi-shield-plus"></i> Dar Rol Admin
                      </button>
                      <span *ngIf="isUserAlreadyAdmin(u.uid)" class="badge badge-active">
                        <i class="bi bi-check2-circle"></i> Ya es Admin
                      </span>
                    </td>
                  </tr>
                  <tr *ngIf="cachedFilteredAppUsers().length === 0">
                    <td colspan="5" class="text-center py-5 text-secondary small">
                      No se encontraron atletas registrados.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .panel-card {
      background-color: #0d0f14;
      border: 1px solid rgba(255, 255, 255, 0.06) !important;
    }
    .tab-btn {
      background: rgba(255, 255, 255, 0.03);
      color: #a0aec0;
      border: 1px solid rgba(255, 255, 255, 0.06) !important;
      transition: all 0.15s ease;
      &:hover {
        background: rgba(255, 255, 255, 0.06);
        color: #fff;
      }
    }
    .active-tab {
      background: rgba(0, 230, 118, 0.08) !important;
      color: #00e676 !important;
      border-color: rgba(0, 230, 118, 0.3) !important;
      font-weight: 600;
    }
    .custom-table {
      --bs-table-bg: transparent;
      --bs-table-color: #e2e8f0;
      border-color: rgba(255, 255, 255, 0.06) !important;
      thead {
        background-color: rgba(255, 255, 255, 0.02);
        color: #718096;
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
    }
    .badge-subtle {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #cbd5e0;
      font-weight: 500;
    }
    .badge-active {
      background: rgba(0, 230, 118, 0.1);
      border: 1px solid rgba(0, 230, 118, 0.25);
      color: #00e676;
    }
    .badge-inactive {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.25);
      color: #ef4444;
    }
    .table-warning-bg {
      background-color: rgba(245, 158, 11, 0.04) !important;
    }
  `]
})
export class AdminManagementComponent implements OnInit {
  public auth = inject(AuthService);
  private userMgmt = inject(UserManagementService);
  private cdr = inject(ChangeDetectorRef);

  loadingAdmins = signal<boolean>(true);
  activeTab = signal<'admins' | 'users'>('admins');
  admins = signal<AdminUserRecord[]>([]);
  appUsers = signal<AppUser[]>([]);
  cachedFilteredAppUsers = signal<AppUser[]>([]);
  loadingUsers = signal<boolean>(true);
  userSearchQuery = '';
  feedbackMsg = signal<string>('');

  async ngOnInit(): Promise<void> {
    await Promise.race([
      this.auth.authReadyPromise,
      new Promise(resolve => setTimeout(resolve, 2500))
    ]);
    await Promise.all([
      this.loadAdmins(),
      this.loadAppUsers()
    ]);
  }

  trackByAdminUid(index: number, item: AdminUserRecord): string {
    return item.uid;
  }

  trackByUserUid(index: number, item: AppUser): string {
    return item.uid;
  }

  isSuperAdmin(uid: string): boolean {
    return this.auth.isSuperAdminUid(uid);
  }

  async loadAdmins(): Promise<void> {
    this.loadingAdmins.set(true);
    try {
      await Promise.race([
        this.auth.authReadyPromise,
        new Promise(resolve => setTimeout(resolve, 2500))
      ]);
      const all = await this.userMgmt.listAdmins();
      const myUid = this.auth.currentUser()?.uid;
      this.admins.set(all.filter(a => a.uid !== myUid));
    } catch (err: any) {
      console.warn('Error cargando admins:', err);
      this.admins.set([]);
    } finally {
      this.loadingAdmins.set(false);
      this.cdr.markForCheck();
    }
  }

  async loadAppUsers(): Promise<void> {
    this.loadingUsers.set(true);
    try {
      const users = await this.userMgmt.listRegisteredUsers();
      this.appUsers.set(users);
      this.onUserSearchChange();
    } catch (err: any) {
      this.feedbackMsg.set(err.message || 'Error cargando atletas de la app.');
      this.appUsers.set([]);
      this.cachedFilteredAppUsers.set([]);
    } finally {
      this.loadingUsers.set(false);
      this.cdr.markForCheck();
    }
  }

  onUserSearchChange(): void {
    const q = this.userSearchQuery.toLowerCase().trim();
    const all = this.appUsers();
    if (!q) {
      this.cachedFilteredAppUsers.set(all);
      this.cdr.markForCheck();
      return;
    }
    this.cachedFilteredAppUsers.set(all.filter(u => 
      (u.displayName && u.displayName.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q))
    ));
    this.cdr.markForCheck();
  }

  isUserAlreadyAdmin(uid: string): boolean {
    if (uid === this.auth.currentUser()?.uid) return true;
    return this.admins().some(a => a.uid === uid);
  }

  async promoteUser(u: AppUser): Promise<void> {
    const currentSuper = this.auth.currentUser();
    if (!currentSuper) return;

    if (!confirm(`¿Otorgar permisos de Administrador a "${u.displayName || u.username}"?`)) {
      return;
    }

    try {
      await this.userMgmt.promoteToAdmin(u, currentSuper.uid);
      this.feedbackMsg.set(`¡"${u.displayName || u.username}" ahora es Administrador!`);
      await this.loadAdmins();
      this.activeTab.set('admins');
    } catch (err: any) {
      alert(err.message || 'Error otorgando rol.');
    } finally {
      this.cdr.markForCheck();
    }
  }

  async toggleAdminStatus(adm: AdminUserRecord): Promise<void> {
    try {
      const newStatus = !adm.active;
      await this.userMgmt.setAdminActiveStatus(adm.uid, newStatus);
      adm.active = newStatus;
      adm.requestStatus = newStatus ? 'approved' : 'rejected';
      this.feedbackMsg.set(`Estado de "${adm.name}" actualizado a ${adm.active ? 'Activo (Aprobado)' : 'Suspendido'}.`);
      this.admins.update(list => [...list]);
    } catch (err: any) {
      alert(err.message || 'Error al cambiar estado.');
    } finally {
      this.cdr.markForCheck();
    }
  }

  async revokeAdmin(adm: AdminUserRecord): Promise<void> {
    if (!confirm(`¿Revocar permanentemente los permisos de Administrador a "${adm.name}"?`)) {
      return;
    }
    try {
      await this.userMgmt.revokeAdmin(adm.uid);
      this.admins.update(list => list.filter(a => a.uid !== adm.uid));
      this.feedbackMsg.set(`Permisos de administrador revocados a "${adm.name}".`);
    } catch (err: any) {
      alert(err.message || 'Error revocando permisos.');
    } finally {
      this.cdr.markForCheck();
    }
  }
}
