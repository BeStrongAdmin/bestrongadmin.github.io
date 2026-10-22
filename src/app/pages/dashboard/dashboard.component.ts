import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { AuthService } from '../../services/auth.service';
import { RoutineService, AssignedRoutineRecord } from '../../services/routine.service';
import { UserManagementService, AdminUserRecord } from '../../services/user-management.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent],
  template: `
    <app-navbar></app-navbar>

    <div class="container-fluid px-3 px-md-4 py-4">
      <!-- Header -->
      <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 class="h3 fw-bold mb-1 text-light">Dashboard de Control</h1>
          <p class="text-secondary mb-0">Bienvenido, {{ auth.currentUser()?.displayName }}. Vista general del sistema y métricas.</p>
        </div>
        <div class="d-flex gap-2">
          <a routerLink="/generator" class="btn btn-primary d-flex align-items-center gap-2">
            <i class="bi bi-plus-lg"></i> Nueva Rutina
          </a>
          <a *ngIf="auth.currentUser()?.isSuperAdmin" routerLink="/admin-management" class="btn btn-outline-warning d-flex align-items-center gap-2">
            <i class="bi bi-person-gear"></i> Gestionar Admins
          </a>
        </div>
      </div>

      <!-- Loading Spinner -->
      <div *ngIf="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando métricas...</span>
        </div>
      </div>

      <div *ngIf="!loading">
        <!-- KPI Cards -->
        <div class="row g-3 mb-4">
          <div class="col-12 col-sm-6 col-xl-3">
            <div class="card h-100 border border-dark p-3" style="background-color: #141219;">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <div class="text-secondary small fw-medium mb-1">Rutinas Generadas</div>
                  <div class="h2 fw-bold text-light mb-0">{{ totalRoutines }}</div>
                </div>
                <div class="p-2 rounded bg-primary bg-opacity-25 text-primary">
                  <i class="bi bi-card-checklist fs-4"></i>
                </div>
              </div>
            </div>
          </div>

          <div class="col-12 col-sm-6 col-xl-3">
            <div class="card h-100 border border-dark p-3" style="background-color: #141219;">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <div class="text-secondary small fw-medium mb-1">Usuarios Entrenados</div>
                  <div class="h2 fw-bold text-success mb-0">{{ totalTrainees }}</div>
                </div>
                <div class="p-2 rounded bg-success bg-opacity-25 text-success">
                  <i class="bi bi-people-fill fs-4"></i>
                </div>
              </div>
            </div>
          </div>

          <div class="col-12 col-sm-6 col-xl-3">
            <div class="card h-100 border border-dark p-3" style="background-color: #141219;">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <div class="text-secondary small fw-medium mb-1">Admins Registrados</div>
                  <div class="h2 fw-bold text-warning mb-0">{{ adminsList.length + 1 }}</div>
                </div>
                <div class="p-2 rounded bg-warning bg-opacity-25 text-warning">
                  <i class="bi bi-shield-check fs-4"></i>
                </div>
              </div>
            </div>
          </div>

          <div class="col-12 col-sm-6 col-xl-3">
            <div class="card h-100 border border-dark p-3" style="background-color: #141219;">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <div class="text-secondary small fw-medium mb-1">Mis Rutinas Creadas</div>
                  <div class="h2 fw-bold text-info mb-0">{{ myRoutinesCount }}</div>
                </div>
                <div class="p-2 rounded bg-info bg-opacity-25 text-info">
                  <i class="bi bi-person-badge fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Superadmin Section: Rendimiento de Administradores -->
        <div *ngIf="auth.currentUser()?.isSuperAdmin" class="card border border-dark mb-4" style="background-color: #141219;">
          <div class="card-header border-bottom border-dark d-flex justify-content-between align-items-center py-3">
            <div>
              <h5 class="card-title fw-bold text-light mb-0">
                <i class="bi bi-bar-chart-fill text-warning me-2"></i>Rendimiento de Administradores
              </h5>
              <small class="text-secondary">Monitoreo de rutinas creadas y usuarios atendidos por cada entrenador</small>
            </div>
          </div>
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-dark">
                <tr>
                  <th>Administrador</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th class="text-center">Rutinas Creadas</th>
                  <th class="text-center">Usuarios Entrenando</th>
                  <th class="text-end">Fecha Alta</th>
                </tr>
              </thead>
              <tbody>
                <!-- Superadmin row -->
                <tr>
                  <td>
                    <div class="fw-semibold text-light">{{ auth.currentUser()?.displayName }} (Tú)</div>
                    <div class="small text-secondary">{{ auth.currentUser()?.email }}</div>
                  </td>
                  <td><span class="badge bg-warning text-dark">Super Admin</span></td>
                  <td><span class="badge bg-success">Activo</span></td>
                  <td class="text-center fw-bold">{{ superAdminRoutinesCount }}</td>
                  <td class="text-center fw-bold text-success">{{ superAdminTraineesCount }}</td>
                  <td class="text-end small text-secondary">Fundador</td>
                </tr>

                <!-- Additional admins -->
                <tr *ngFor="let adm of adminsList">
                  <td>
                    <div class="fw-semibold text-light">{{ adm.name }}</div>
                    <div class="small text-secondary">{{ adm.email }}</div>
                  </td>
                  <td><span class="badge bg-primary">Admin</span></td>
                  <td>
                    <span class="badge" [ngClass]="adm.active ? 'bg-success' : 'bg-danger'">
                      {{ adm.active ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td class="text-center fw-bold">{{ adm.routinesCreatedCount || 0 }}</td>
                  <td class="text-center fw-bold text-success">{{ adm.traineesCount || 0 }}</td>
                  <td class="text-end small text-secondary">{{ adm.createdAt | date:'shortDate' }}</td>
                </tr>

                <tr *ngIf="adminsList.length === 0">
                  <td colspan="6" class="text-center py-3 text-secondary">
                    No has agregado administradores secundarios todavía. Puedes agregarlos desde la sección "Administradores".
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Recent Routines Quick Peek -->
        <div class="card border border-dark" style="background-color: #141219;">
          <div class="card-header border-bottom border-dark d-flex justify-content-between align-items-center py-3">
            <h5 class="card-title fw-bold text-light mb-0">
              <i class="bi bi-clock-history text-primary me-2"></i>Últimas Rutinas Asignadas
            </h5>
            <a routerLink="/routines" class="btn btn-outline-secondary btn-sm">Ver todas</a>
          </div>
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-dark">
                <tr>
                  <th>Código</th>
                  <th>Nombre de Rutina</th>
                  <th>Días</th>
                  <th>Creador</th>
                  <th class="text-center">Canjes</th>
                  <th class="text-end">Expira</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let r of recentRoutines">
                  <td>
                    <span class="badge bg-dark border border-secondary text-light font-monospace fs-6 px-2 py-1">
                      {{ r.code }}
                    </span>
                  </td>
                  <td class="fw-semibold text-light">{{ r.routineName }}</td>
                  <td><span class="badge bg-secondary">{{ r.daysCount }} Días</span></td>
                  <td class="small text-secondary">{{ r.createdByName || r.createdBy }}</td>
                  <td class="text-center">
                    <span class="badge bg-success bg-opacity-25 text-success border border-success">
                      {{ r.timesRedeemed }} canje(s)
                    </span>
                  </td>
                  <td class="text-end small text-secondary">{{ r.expiresAtMs | date:'mediumDate' }}</td>
                </tr>
                <tr *ngIf="recentRoutines.length === 0">
                  <td colspan="6" class="text-center py-4 text-secondary">
                    Aún no se han generado rutinas asignadas en el servidor.
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
export class DashboardComponent implements OnInit {
  public auth = inject(AuthService);
  private routineService = inject(RoutineService);
  private userMgmt = inject(UserManagementService);

  loading = true;
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

  async loadMetrics(): Promise<void> {
    this.loading = true;
    try {
      const isSuper = this.auth.currentUser()?.isSuperAdmin;
      const uid = this.auth.currentUser()?.uid;

      // Cargar todas las rutinas (el superadmin ve todas, el admin ve las suyas)
      const routines = await this.routineService.listRoutines(uid, isSuper);
      this.totalRoutines = routines.length;
      this.totalTrainees = routines.reduce((acc, r) => acc + (r.timesRedeemed || 0), 0);
      this.recentRoutines = routines.slice(0, 5);

      if (uid) {
        const myR = routines.filter(r => r.createdBy === uid);
        this.myRoutinesCount = myR.length;
      }

      if (isSuper) {
        this.adminsList = await this.userMgmt.listAdmins();
        const superR = routines.filter(r => r.createdBy === uid);
        this.superAdminRoutinesCount = superR.length;
        this.superAdminTraineesCount = superR.reduce((acc, r) => acc + (r.timesRedeemed || 0), 0);
      }
    } catch (err) {
      console.error('Error cargando métricas:', err);
    } finally {
      this.loading = false;
    }
  }
}
