import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { AuthService } from '../../services/auth.service';
import { RoutineService, AssignedRoutineRecord } from '../../services/routine.service';

@Component({
  selector: 'app-routines-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent],
  template: `
    <app-navbar></app-navbar>

    <div class="container-fluid px-3 px-md-4 py-4">
      <!-- Header -->
      <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 class="h3 fw-bold mb-1 text-light">Rutinas Asignadas con Código</h1>
          <p class="text-secondary mb-0">Gestión de códigos de rutinas generadas en el servidor y su tasa de canje.</p>
        </div>
        <div>
          <a routerLink="/generator" class="btn btn-primary d-flex align-items-center gap-2">
            <i class="bi bi-plus-lg"></i> Crear Nueva Rutina
          </a>
        </div>
      </div>

      <!-- Feedback toast alert -->
      <div *ngIf="feedbackMsg" class="alert alert-info alert-dismissible fade show" role="alert">
        {{ feedbackMsg }}
        <button type="button" class="btn-close" (click)="feedbackMsg = ''"></button>
      </div>

      <!-- Filter bar -->
      <div class="card border border-dark p-3 mb-4" style="background-color: #141219;">
        <div class="row g-2">
          <div class="col-12 col-md-8">
            <div class="input-group">
              <span class="input-group-text bg-dark border-secondary text-secondary">
                <i class="bi bi-search"></i>
              </span>
              <input 
                type="text" 
                class="form-control" 
                placeholder="Buscar por código (ej: BST-8K2Q) o por nombre..." 
                [(ngModel)]="searchQuery"
              >
            </div>
          </div>
          <div class="col-12 col-md-4 text-md-end">
            <button class="btn btn-outline-secondary w-100 w-md-auto d-flex align-items-center justify-content-center gap-2" (click)="loadRoutines()">
              <i class="bi bi-arrow-clockwise"></i> Recargar
            </button>
          </div>
        </div>
      </div>

      <!-- Table Card -->
      <div class="card border border-dark" style="background-color: #141219;">
        <div *ngIf="loading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status"></div>
          <div class="small text-secondary mt-2">Cargando rutinas asignadas...</div>
        </div>

        <div *ngIf="!loading" class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-dark">
              <tr>
                <th>Código</th>
                <th>Nombre de Rutina</th>
                <th>Frecuencia</th>
                <th>Creado Por</th>
                <th class="text-center">Veces Canjeada</th>
                <th>Expira</th>
                <th class="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let r of filteredRoutines">
                <td>
                  <span class="badge bg-dark border border-secondary text-primary font-monospace fs-6 px-2 py-1">
                    {{ r.code }}
                  </span>
                </td>
                <td class="fw-semibold text-light">{{ r.routineName }}</td>
                <td>
                  <span class="badge bg-secondary">{{ r.daysCount }} Días</span>
                </td>
                <td class="small text-secondary">{{ r.createdByName || r.createdBy }}</td>
                <td class="text-center">
                  <span class="badge bg-success bg-opacity-25 text-success border border-success">
                    {{ r.timesRedeemed }} canje(s)
                  </span>
                </td>
                <td class="small text-secondary">{{ r.expiresAtMs | date:'shortDate' }}</td>
                <td class="text-end">
                  <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-light" title="Copiar Código" (click)="copyCode(r.code)">
                      <i class="bi bi-clipboard"></i>
                    </button>
                    <button class="btn btn-outline-info" title="Ver Detalle" (click)="viewDetail(r)">
                      <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-outline-danger" title="Eliminar" (click)="deleteRoutine(r.code)">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filteredRoutines.length === 0">
                <td colspan="7" class="text-center py-5 text-secondary">
                  No se encontraron rutinas registradas.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- MODAL: View Routine Detail -->
    <div *ngIf="selectedRoutine" class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.85);">
      <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content border border-secondary shadow-lg">
          <div class="modal-header border-bottom border-dark">
            <div>
              <h5 class="modal-title fw-bold text-light mb-0">{{ selectedRoutine.routineName }}</h5>
              <small class="text-secondary">Código: <span class="text-primary font-monospace">{{ selectedRoutine.code }}</span> &bull; {{ selectedRoutine.daysCount }} Días</small>
            </div>
            <button type="button" class="btn-close btn-close-white" (click)="selectedRoutine = null"></button>
          </div>
          <div class="modal-body p-3">
            <div *ngFor="let day of selectedRoutine.routine?.days" class="card border border-dark mb-3 p-3" style="background-color: #1a1622;">
              <h6 class="fw-bold text-primary mb-2">{{ day.name }}</h6>
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
                      <td class="text-light fw-medium">{{ ex.exerciseName }}</td>
                      <td><span class="badge bg-dark border border-secondary">{{ ex.movementPattern }}</span></td>
                      <td class="text-center fw-bold">{{ ex.sets }}</td>
                      <td class="text-center">{{ ex.reps }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div class="modal-footer border-top border-dark">
            <button type="button" class="btn btn-secondary" (click)="selectedRoutine = null">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class RoutinesListComponent implements OnInit {
  public auth = inject(AuthService);
  private routineService = inject(RoutineService);

  routines: AssignedRoutineRecord[] = [];
  loading = true;
  searchQuery = '';
  feedbackMsg = '';
  selectedRoutine: AssignedRoutineRecord | null = null;

  async ngOnInit(): Promise<void> {
    await this.loadRoutines();
  }

  async loadRoutines(): Promise<void> {
    this.loading = true;
    try {
      const isSuper = this.auth.currentUser()?.isSuperAdmin;
      const uid = this.auth.currentUser()?.uid;
      this.routines = await this.routineService.listRoutines(uid, isSuper);
    } catch (err: any) {
      this.feedbackMsg = err.message || 'Error al cargar rutinas.';
    } finally {
      this.loading = false;
    }
  }

  get filteredRoutines(): AssignedRoutineRecord[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.routines;
    return this.routines.filter(r => 
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
    if (!confirm(`¿Estás seguro de que deseas eliminar la rutina con código ${code}?`)) {
      return;
    }
    try {
      await this.routineService.deleteRoutine(code);
      this.routines = this.routines.filter(r => r.code !== code);
      this.feedbackMsg = `Rutina ${code} eliminada del servidor.`;
    } catch (err: any) {
      alert(err.message || 'Error al eliminar rutina.');
    }
  }
}
