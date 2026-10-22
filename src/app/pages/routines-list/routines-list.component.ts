import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { AuthService } from '../../services/auth.service';
import { RoutineService, AssignedRoutineRecord } from '../../services/routine.service';

@Component({
  selector: 'app-routines-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SidebarComponent],
  template: `
    <div class="d-flex flex-column flex-lg-row min-vh-100" style="background-color: #07080b;">
      <app-sidebar></app-sidebar>

      <main class="flex-grow-1 px-3 px-md-5 py-4 overflow-x-hidden">
        <!-- Header -->
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <div>
            <h1 class="h4 fw-bold mb-1 text-light tracking-tight">Rutinas Asignadas con Código</h1>
            <p class="text-secondary small mb-0">Listado de rutinas personalizadas generadas en el servidor.</p>
          </div>
          <div>
            <a routerLink="/generator" class="btn btn-light btn-sm fw-bold d-flex align-items-center gap-2 px-3 rounded-3">
              <i class="bi bi-plus-lg"></i> Crear Nueva Rutina
            </a>
          </div>
        </div>

        <!-- Feedback Alert -->
        <div *ngIf="feedbackMsg" class="alert alert-info alert-dismissible fade show border-0 bg-info bg-opacity-10 text-info py-2 small rounded-3" role="alert">
          {{ feedbackMsg }}
          <button type="button" class="btn-close btn-close-white" (click)="feedbackMsg = ''"></button>
        </div>

        <!-- Search Bar -->
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
                  placeholder="Buscar por código (ej: BST-8K2Q) o nombre..." 
                  [(ngModel)]="searchQuery"
                  (ngModelChange)="onSearchChange()"
                >
              </div>
            </div>
            <div class="col-12 col-md-4 text-md-end">
              <button class="btn btn-outline-secondary btn-sm rounded-3 w-100 w-md-auto d-flex align-items-center justify-content-center gap-2" (click)="loadRoutines()">
                <i class="bi bi-arrow-clockwise"></i> Recargar
              </button>
            </div>
          </div>
        </div>

        <!-- Routines Table -->
        <div class="card border-0 rounded-4 panel-card overflow-hidden">
          <div *ngIf="loading" class="text-center py-5">
            <div class="spinner-border spinner-border-sm text-secondary" role="status"></div>
            <div class="small text-secondary mt-2">Cargando rutinas...</div>
          </div>

          <div *ngIf="!loading" class="table-responsive">
            <table class="table table-hover align-middle mb-0 custom-table">
              <thead>
                <tr>
                  <th class="ps-4">Código</th>
                  <th>Nombre de Rutina</th>
                  <th>Días</th>
                  <th>Entrenador</th>
                  <th class="text-center">Canjes</th>
                  <th>Expira</th>
                  <th class="text-end pe-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let r of cachedFilteredRoutines; trackBy: trackByCode">
                  <td class="ps-4">
                    <span class="code-badge font-monospace">
                      {{ r.code }}
                    </span>
                  </td>
                  <td class="fw-semibold text-light">{{ r.routineName }}</td>
                  <td>
                    <span class="badge badge-subtle">{{ r.daysCount }} Días</span>
                  </td>
                  <td class="small text-secondary">{{ r.createdByName || r.createdBy }}</td>
                  <td class="text-center">
                    <span class="badge badge-subtle">
                      {{ r.timesRedeemed }} atleta(s)
                    </span>
                  </td>
                  <td class="small text-secondary">{{ r.expiresAtMs | date:'shortDate' }}</td>
                  <td class="text-end pe-4">
                    <div class="btn-group btn-group-sm">
                      <button class="btn btn-outline-secondary rounded-start-3" title="Copiar Código" (click)="copyCode(r.code)">
                        <i class="bi bi-clipboard"></i>
                      </button>
                      <button class="btn btn-outline-secondary" title="Ver Detalle" (click)="viewDetail(r)">
                        <i class="bi bi-eye"></i>
                      </button>
                      <button class="btn btn-outline-danger rounded-end-3" title="Eliminar" (click)="deleteRoutine(r.code)">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="cachedFilteredRoutines.length === 0">
                  <td colspan="7" class="text-center py-5 text-secondary small">
                    No se encontraron rutinas registradas.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>

    <!-- MODAL: View Routine Detail -->
    <div *ngIf="selectedRoutine" class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.85); backdrop-filter: blur(4px);">
      <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content border-0 rounded-4 panel-card shadow-2xl">
          <div class="modal-header border-bottom border-dark px-4 py-3">
            <div>
              <h6 class="modal-title fw-bold text-light mb-0">{{ selectedRoutine.routineName }}</h6>
              <small class="text-secondary">Código: <span class="text-success font-monospace fw-bold">{{ selectedRoutine.code }}</span> &bull; {{ selectedRoutine.daysCount }} Días</small>
            </div>
            <button type="button" class="btn-close btn-close-white" (click)="selectedRoutine = null"></button>
          </div>
          <div class="modal-body p-4">
            <div *ngFor="let day of selectedRoutine.routine?.days" class="card border-0 rounded-3 mb-3 p-3" style="background-color: #12141c;">
              <h6 class="fw-bold text-success mb-2 small text-uppercase">{{ day.name }}</h6>
              <div class="table-responsive">
                <table class="table table-sm table-borderless align-middle mb-0">
                  <thead class="small text-secondary border-bottom border-dark">
                    <tr>
                      <th>Ejercicio</th>
                      <th>Patrón</th>
                      <th class="text-center">Series</th>
                      <th class="text-center">Reps</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let ex of day.exercises">
                      <td class="text-light fw-medium small">{{ ex.exerciseName }}</td>
                      <td><span class="badge badge-subtle">{{ ex.movementPattern }}</span></td>
                      <td class="text-center fw-bold small text-light">{{ ex.sets }}</td>
                      <td class="text-center small text-secondary">{{ ex.reps }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div class="modal-footer border-top border-dark px-4 py-2">
            <button type="button" class="btn btn-secondary btn-sm rounded-3" (click)="selectedRoutine = null">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .panel-card {
      background-color: #0d0f14;
      border: 1px solid rgba(255, 255, 255, 0.06) !important;
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
export class RoutinesListComponent implements OnInit {
  public auth = inject(AuthService);
  private routineService = inject(RoutineService);

  routines: AssignedRoutineRecord[] = [];
  cachedFilteredRoutines: AssignedRoutineRecord[] = [];
  loading = true;
  searchQuery = '';
  feedbackMsg = '';
  selectedRoutine: AssignedRoutineRecord | null = null;

  async ngOnInit(): Promise<void> {
    await this.loadRoutines();
  }

  trackByCode(index: number, item: AssignedRoutineRecord): string {
    return item.code;
  }

  async loadRoutines(): Promise<void> {
    this.loading = true;
    try {
      const isSuper = this.auth.currentUser()?.isSuperAdmin;
      const uid = this.auth.currentUser()?.uid;
      this.routines = await Promise.race([
        this.routineService.listRoutines(uid, isSuper),
        new Promise<AssignedRoutineRecord[]>((_, reject) => setTimeout(() => reject(new Error('Timeout de rutinas')), 4000))
      ]);
      this.onSearchChange();
    } catch (err: any) {
      this.feedbackMsg = err.message || 'Error al cargar rutinas.';
      this.routines = [];
      this.cachedFilteredRoutines = [];
    } finally {
      this.loading = false;
    }
  }

  onSearchChange(): void {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) {
      this.cachedFilteredRoutines = this.routines;
      return;
    }
    this.cachedFilteredRoutines = this.routines.filter(r => 
      r.code.toLowerCase().includes(q) || 
      r.routineName.toLowerCase().includes(q) ||
      (r.createdByName && r.createdByName.toLowerCase().includes(q))
    );
  }

  copyCode(code: string): void {
    navigator.clipboard.writeText(code);
    this.feedbackMsg = `¡Código "${code}" copiado al portapapeles!`;
    setTimeout(() => {
      this.feedbackMsg = '';
    }, 4000);
  }

  viewDetail(routine: AssignedRoutineRecord): void {
    this.selectedRoutine = routine;
  }

  async deleteRoutine(code: string): Promise<void> {
    if (!confirm(`¿Eliminar la rutina con código ${code}?`)) {
      return;
    }
    try {
      await this.routineService.deleteRoutine(code);
      this.routines = this.routines.filter(r => r.code !== code);
      this.onSearchChange();
      this.feedbackMsg = `Rutina ${code} eliminada del servidor.`;
    } catch (err: any) {
      alert(err.message || 'Error al eliminar rutina.');
    }
  }
}
