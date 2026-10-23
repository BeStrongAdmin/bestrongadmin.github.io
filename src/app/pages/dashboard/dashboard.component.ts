import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { AuthService } from '../../services/auth.service';
import { RoutineService, AssignedRoutineRecord } from '../../services/routine.service';
import { UserManagementService, AdminUserRecord } from '../../services/user-management.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, SidebarComponent],
  template: `
    <div class="d-flex flex-column flex-lg-row min-vh-100" style="background-color: #07080b;">
      <app-sidebar></app-sidebar>

      <main class="flex-grow-1 px-3 px-md-5 py-4 overflow-x-hidden">
        <!-- Header -->
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <div>
            <h1 class="h4 fw-bold mb-1 text-light tracking-tight">Panel de Control</h1>
            <p class="text-secondary small mb-0">Bienvenido, {{ auth.currentUser()?.displayName }}. Vista del sistema y analíticas.</p>
          </div>
          <div class="d-flex gap-2 flex-wrap">
            <button type="button" class="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2 px-3 rounded-3" (click)="auth.openChangePasswordModal()" title="Cambiar tu contraseña de acceso">
              <i class="bi bi-key text-warning"></i> Contraseña
            </button>
            <a *ngIf="auth.currentUser()?.isAdmin" routerLink="/generator" class="btn btn-light btn-sm fw-bold d-flex align-items-center gap-2 px-3 rounded-3">
              <i class="bi bi-plus-lg"></i> Nueva Rutina
            </a>
            <button *ngIf="!auth.currentUser()?.isAdmin" class="btn btn-outline-secondary btn-sm opacity-50 d-flex align-items-center gap-2 px-3 rounded-3" disabled title="Requiere validación de administrador">
              <i class="bi bi-lock-fill text-warning"></i> Nueva Rutina
            </button>
            <a *ngIf="auth.currentUser()?.isSuperAdmin" routerLink="/admin-management" class="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2 px-3 rounded-3">
              <i class="bi bi-people"></i> Admins
            </a>
          </div>
        </div>

        <!-- Banner de Estado de Validación para Coaches no Aprobados -->
        <div *ngIf="!auth.currentUser()?.isAdmin" class="card border-0 rounded-4 mb-4 shadow-lg overflow-hidden position-relative lock-banner">
          <div class="p-3 p-md-4">
            <div class="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">
              <div class="d-flex align-items-start gap-3">
                <div class="rounded-circle p-3 d-flex align-items-center justify-content-center flex-shrink-0 lock-icon-box">
                  <i class="bi bi-shield-lock-fill text-warning fs-3"></i>
                </div>
                <div>
                  <div class="d-flex align-items-center gap-2 mb-1 flex-wrap">
                    <h5 class="fw-bold text-light mb-0">Espere hasta que se valide su acceso</h5>
                    <span class="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 px-2 py-1">
                      {{ auth.currentUser()?.requestStatus === 'pending' ? 'SOLICITUD EN PROCESO' : 'MODO SOLO LECTURA' }}
                    </span>
                  </div>
                  <p class="text-secondary small mb-2" style="max-width: 720px; line-height: 1.5;">
                    Tu cuenta está registrada como atleta. Puedes activar tu acceso como <strong>Coach</strong> inmediatamente haciendo clic en el botón para comenzar a diseñar y asignar rutinas a tus alumnos.
                  </p>
                  <div class="small text-light d-flex align-items-center gap-2 flex-wrap">
                    <span class="text-secondary">
                      <i class="bi bi-envelope-check text-success me-1"></i> Se notificará la activación a: <code class="text-info">behealthlyapp@gmail.com</code>
                    </span>
                    <span class="text-secondary">•</span>
                    <span class="text-secondary">
                      <i class="bi bi-inbox text-warning me-1"></i> Tu correo de acceso: <strong class="text-light">{{ auth.currentUser()?.email }}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div class="flex-shrink-0 align-self-stretch align-self-md-center">
                <button 
                  type="button" 
                  class="btn btn-success text-dark fw-bold px-4 py-2 w-100 d-flex align-items-center justify-content-center gap-2 rounded-3 shadow-sm"
                  style="background-color: #00e676; border-color: #00e676;"
                  (click)="onRequestAccess()"
                  [disabled]="requestingAccess"
                >
                  <span *ngIf="requestingAccess" class="spinner-border spinner-border-sm text-dark" role="status" aria-hidden="true"></span>
                  <i *ngIf="!requestingAccess" class="bi bi-person-check-fill"></i>
                  <span>Convertirme en Coach (Activar Acceso)</span>
                </button>
              </div>
            </div>

            <!-- Feedback message -->
            <div *ngIf="requestFeedback" class="alert alert-success d-flex align-items-center gap-2 py-2 px-3 small mt-3 mb-0 border-0 bg-success bg-opacity-10 text-success rounded-3">
              <i class="bi bi-check-circle-fill flex-shrink-0"></i>
              <div>{{ requestFeedback }}</div>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading" class="text-center py-5">
          <div class="spinner-border spinner-border-sm text-secondary" role="status"></div>
          <div class="small text-secondary mt-2">Cargando métricas del sistema...</div>
        </div>

        <div *ngIf="!loading">
          <!-- Minimalist KPI Cards (Black tones & Icons) -->
          <div class="row g-3 mb-4">
            <div class="col-12 col-sm-6 col-xl-3">
              <div class="card h-100 p-3 rounded-4 border-0 panel-card">
                <div class="d-flex justify-content-between align-items-start">
                  <div>
                    <div class="text-secondary small fw-medium mb-1">Rutinas en Servidor</div>
                    <div class="h3 fw-bold text-light mb-0">{{ totalRoutines }}</div>
                  </div>
                  <div class="icon-box rounded-3 text-secondary">
                    <i class="bi bi-collection fs-5"></i>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-12 col-sm-6 col-xl-3">
              <div class="card h-100 p-3 rounded-4 border-0 panel-card">
                <div class="d-flex justify-content-between align-items-start">
                  <div>
                    <div class="text-secondary small fw-medium mb-1">Atletas Entrenando</div>
                    <div class="h3 fw-bold text-light mb-0">{{ totalTrainees }}</div>
                  </div>
                  <div class="icon-box rounded-3 text-secondary">
                    <i class="bi bi-person-check fs-5"></i>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-12 col-sm-6 col-xl-3">
              <div class="card h-100 p-3 rounded-4 border-0 panel-card">
                <div class="d-flex justify-content-between align-items-start">
                  <div>
                    <div class="text-secondary small fw-medium mb-1">Mis Rutinas Creadas</div>
                    <div class="h3 fw-bold text-light mb-0">{{ myRoutinesCount }}</div>
                  </div>
                  <div class="icon-box rounded-3 text-secondary">
                    <i class="bi bi-journal-code fs-5"></i>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-12 col-sm-6 col-xl-3">
              <div class="card h-100 p-3 rounded-4 border-0 panel-card">
                <div class="d-flex justify-content-between align-items-start">
                  <div>
                    <div class="text-secondary small fw-medium mb-1">Entrenadores Activos</div>
                    <div class="h3 fw-bold text-light mb-0">{{ adminsList.length + 1 }}</div>
                  </div>
                  <div class="icon-box rounded-3 text-secondary">
                    <i class="bi bi-shield-check fs-5"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Superadmin Table: Rendimiento de Entrenadores -->
          <div *ngIf="auth.currentUser()?.isSuperAdmin" class="card border-0 rounded-4 panel-card mb-4 overflow-hidden">
            <div class="card-header border-0 bg-transparent px-4 py-3 d-flex justify-content-between align-items-center">
              <div>
                <h6 class="fw-bold text-light mb-0">
                  <i class="bi bi-bar-chart me-2 text-secondary"></i>Rendimiento de Entrenadores
                </h6>
                <small class="text-secondary">Monitoreo de rutinas generadas y canjes por cada entrenador</small>
              </div>
            </div>
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0 custom-table">
                <thead>
                  <tr>
                    <th class="ps-4">Entrenador</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th class="text-center">Rutinas Creadas</th>
                    <th class="text-center">Atletas Asignados</th>
                    <th class="text-end pe-4">Alta</th>
                  </tr>
                </thead>
                <tbody>
                  <!-- Superadmin row -->
                  <tr>
                    <td class="ps-4">
                      <div class="fw-semibold text-light">{{ auth.currentUser()?.displayName }} (Tú)</div>
                      <div class="small text-secondary">{{ auth.currentUser()?.email }}</div>
                    </td>
                    <td><span class="badge badge-subtle">Superadmin</span></td>
                    <td><span class="badge badge-active">Activo</span></td>
                    <td class="text-center fw-bold text-light">{{ superAdminRoutinesCount }}</td>
                    <td class="text-center fw-bold text-light">{{ superAdminTraineesCount }}</td>
                    <td class="text-end pe-4 small text-secondary">Fundador</td>
                  </tr>

                  <!-- Additional admins -->
                  <tr *ngFor="let adm of adminsList; trackBy: trackByAdminUid">
                    <td class="ps-4">
                      <div class="fw-semibold text-light">{{ adm.name }}</div>
                      <div class="small text-secondary">{{ adm.email }}</div>
                    </td>
                    <td><span class="badge badge-subtle">Admin</span></td>
                    <td>
                      <span class="badge" [ngClass]="adm.active ? 'badge-active' : 'badge-inactive'">
                        {{ adm.active ? 'Activo' : 'Suspendido' }}
                      </span>
                    </td>
                    <td class="text-center fw-bold text-light">{{ adm.routinesCreatedCount || 0 }}</td>
                    <td class="text-center fw-bold text-light">{{ adm.traineesCount || 0 }}</td>
                    <td class="text-end pe-4 small text-secondary">{{ adm.createdAt | date:'shortDate' }}</td>
                  </tr>

                  <tr *ngIf="adminsList.length === 0">
                    <td colspan="6" class="text-center py-4 text-secondary small">
                      No has agregado administradores secundarios. Puedes autorizar atletas desde la pestaña "Administradores".
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Recent Routines Quick Peek -->
          <div class="card border-0 rounded-4 panel-card overflow-hidden">
            <div class="card-header border-0 bg-transparent px-4 py-3 d-flex justify-content-between align-items-center">
              <h6 class="fw-bold text-light mb-0">
                <i class="bi bi-clock-history me-2 text-secondary"></i>Últimas Rutinas Asignadas
              </h6>
              <a *ngIf="auth.currentUser()?.isAdmin" routerLink="/routines" class="btn btn-outline-secondary btn-sm px-3 rounded-3" style="font-size: 0.8rem;">Ver todas</a>
              <span *ngIf="!auth.currentUser()?.isAdmin" class="badge badge-subtle text-secondary py-1 px-2" style="font-size: 0.75rem;">
                <i class="bi bi-lock-fill text-warning me-1"></i>Vista Previa
              </span>
            </div>
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0 custom-table">
                <thead>
                  <tr>
                    <th class="ps-4">Código</th>
                    <th>Nombre de Rutina</th>
                    <th>Frecuencia</th>
                    <th>Entrenador</th>
                    <th class="text-center">Canjes</th>
                    <th class="text-end pe-4">Expira</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let r of recentRoutines; trackBy: trackByRoutineCode">
                    <td class="ps-4">
                      <span class="code-badge font-monospace">
                        {{ r.code }}
                      </span>
                    </td>
                    <td class="fw-semibold text-light">{{ r.routineName }}</td>
                    <td><span class="badge badge-subtle">{{ r.daysCount }} Días</span></td>
                    <td class="small text-secondary">{{ r.createdByName || r.createdBy }}</td>
                    <td class="text-center">
                      <span class="badge badge-subtle">
                        {{ r.timesRedeemed }} atleta(s)
                      </span>
                    </td>
                    <td class="text-end pe-4 small text-secondary">{{ r.expiresAtMs | date:'mediumDate' }}</td>
                  </tr>
                  <tr *ngIf="recentRoutines.length === 0">
                    <td colspan="6" class="text-center py-5 text-secondary small">
                      Aún no se han generado rutinas asignadas en el servidor.
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
    .lock-banner {
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(13, 15, 20, 0.98) 100%);
      border: 1px solid rgba(245, 158, 11, 0.25) !important;
    }
    .lock-icon-box {
      background: rgba(245, 158, 11, 0.12);
      border: 1px solid rgba(245, 158, 11, 0.25);
    }
    .locked-mode {
      opacity: 0.85;
    }
    .icon-box {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.06);
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
      background: rgba(255, 255, 255, 0.06);
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
    .code-badge {
      background: #141722;
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #00e676;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 0.85rem;
    }
  `]
})
export class DashboardComponent implements OnInit {
  public auth = inject(AuthService);
  private routineService = inject(RoutineService);
  private userMgmt = inject(UserManagementService);

  loading = true;
  requestingAccess = false;
  requestFeedback = '';
  totalRoutines = 0;
  totalTrainees = 0;
  myRoutinesCount = 0;
  superAdminRoutinesCount = 0;
  superAdminTraineesCount = 0;
  adminsList: AdminUserRecord[] = [];
  recentRoutines: AssignedRoutineRecord[] = [];

  async ngOnInit(): Promise<void> {
    await this.loadMetrics();
  }

  trackByAdminUid(index: number, adm: AdminUserRecord): string {
    return adm.uid;
  }

  trackByRoutineCode(index: number, r: AssignedRoutineRecord): string {
    return r.code;
  }

  async loadMetrics(): Promise<void> {
    this.loading = true;
    try {
      const user = this.auth.currentUser();
      const isSuper = user?.isSuperAdmin;
      const uid = user?.uid;

      // Carga protegida con timeout para no congelar la UI
      try {
        const routines = await Promise.race([
          this.routineService.listRoutines(uid, isSuper),
          new Promise<AssignedRoutineRecord[]>((_, reject) => setTimeout(() => reject(new Error('Timeout rutinas')), 3500))
        ]);
        this.totalRoutines = routines.length;
        this.totalTrainees = routines.reduce((acc, r) => acc + (r.timesRedeemed || 0), 0);
        this.recentRoutines = routines.slice(0, 5);

        if (uid) {
          const myR = routines.filter(r => r.createdBy === uid);
          this.myRoutinesCount = myR.length;
        }

        if (isSuper && uid) {
          const superR = routines.filter(r => r.createdBy === uid);
          this.superAdminRoutinesCount = superR.length;
          this.superAdminTraineesCount = superR.reduce((acc, r) => acc + (r.timesRedeemed || 0), 0);
        }
      } catch (errRoutines) {
        console.warn('Carga de rutinas no disponible o en timeout:', errRoutines);
      }

      if (isSuper) {
        try {
          const allAdmins = await this.userMgmt.listAdmins();
          this.adminsList = allAdmins.filter(a => a.uid !== uid);
        } catch (errAdmins) {
          console.warn('Carga de admins no disponible:', errAdmins);
        }
      }
    } catch (err) {
      console.error('Error cargando métricas:', err);
    } finally {
      this.loading = false;
    }
  }

  async onRequestAccess(): Promise<void> {
    this.requestingAccess = true;
    this.requestFeedback = '';
    try {
      await this.auth.requestAdminAccess();
      const userEmail = this.auth.currentUser()?.email || 'tu correo';
      this.requestFeedback = `🎉 ¡Acceso activado de inmediato! Se notificó a behealthlyapp@gmail.com (${userEmail}). Ya cuentas con permisos completos de Coach.`;
      await this.loadMetrics();
    } catch (err: any) {
      this.requestFeedback = err.message || 'Error activando acceso. Por favor intenta de nuevo.';
    } finally {
      this.requestingAccess = false;
    }
  }
}
