import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { AuthService } from '../../services/auth.service';
import { RoutineService, AssignedRoutineRecord, RoutineTrainee } from '../../services/routine.service';

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
        <div *ngIf="feedbackMsg()" class="alert alert-info alert-dismissible fade show border-0 bg-info bg-opacity-10 text-info py-2 small rounded-3" role="alert">
          {{ feedbackMsg() }}
          <button type="button" class="btn-close btn-close-white" (click)="feedbackMsg.set('')"></button>
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
          <div *ngIf="loading()" class="text-center py-5">
            <div class="spinner-border spinner-border-sm text-secondary" role="status"></div>
            <div class="small text-secondary mt-2">Cargando rutinas...</div>
          </div>

          <div *ngIf="!loading()" class="table-responsive">
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
                <tr *ngFor="let r of cachedFilteredRoutines(); trackBy: trackByCode">
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
                  <td class="small">
                    <span *ngIf="r.isIndefinite || !r.expiresAtMs" class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 py-1 px-2">
                      <i class="bi bi-infinity me-1"></i>Indefinida
                    </span>
                    <span *ngIf="!r.isIndefinite && r.expiresAtMs" class="text-secondary">
                      {{ r.expiresAtMs | date:'shortDate' }}
                    </span>
                  </td>
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
                <tr *ngIf="cachedFilteredRoutines().length === 0">
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
    <div *ngIf="selectedRoutine()" class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.85); backdrop-filter: blur(4px);">
      <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content border-0 rounded-4 panel-card shadow-2xl">
          <div class="modal-header border-bottom border-dark px-4 py-3">
            <div>
              <h6 class="modal-title fw-bold text-light mb-0">{{ selectedRoutine()?.routineName }}</h6>
              <small class="text-secondary">
                Código: <span class="text-success font-monospace fw-bold">{{ selectedRoutine()?.code }}</span> &bull; 
                {{ selectedRoutine()?.daysCount }} Días &bull; 
                <span *ngIf="selectedRoutine()?.isIndefinite || !selectedRoutine()?.expiresAtMs" class="text-success fw-bold">
                  <i class="bi bi-infinity me-1"></i>Permanente / Indefinida
                </span>
                <span *ngIf="!selectedRoutine()?.isIndefinite && selectedRoutine()?.expiresAtMs">
                  Expira: {{ selectedRoutine()?.expiresAtMs | date:'mediumDate' }}
                </span>
              </small>
            </div>
            <button type="button" class="btn-close btn-close-white" (click)="selectedRoutine.set(null)"></button>
          </div>

          <!-- Modal Tabs -->
          <div class="px-4 pt-3 border-bottom border-dark">
            <ul class="nav nav-pills gap-2 mb-2">
              <li class="nav-item">
                <button 
                  type="button" 
                  class="btn btn-sm px-3 py-1 rounded-3"
                  [ngClass]="modalTab() === 'exercises' ? 'btn-light text-dark fw-bold' : 'btn-outline-secondary text-secondary'"
                  (click)="modalTab.set('exercises')"
                >
                  <i class="bi bi-list-check me-1"></i> Ejercicios Biomecánicos
                </button>
              </li>
              <li class="nav-item">
                <button 
                  type="button" 
                  class="btn btn-sm px-3 py-1 rounded-3"
                  [ngClass]="modalTab() === 'trainees' ? 'btn-success text-dark fw-bold' : 'btn-outline-secondary text-secondary'"
                  (click)="modalTab.set('trainees')"
                >
                  <i class="bi bi-people-fill me-1"></i> Atletas que la Usan ({{ selectedRoutine()?.trainees?.length || selectedRoutine()?.timesRedeemed || 0 }})
                </button>
              </li>
              <li class="nav-item">
                <button 
                  type="button" 
                  class="btn btn-sm px-3 py-1 rounded-3"
                  [ngClass]="modalTab() === 'analytics' ? 'btn-warning text-dark fw-bold' : 'btn-outline-secondary text-secondary'"
                  (click)="modalTab.set('analytics')"
                >
                  <i class="bi bi-bar-chart-fill me-1"></i> Analítica Biomecánica
                </button>
              </li>
            </ul>
          </div>

          <div class="modal-body p-4">
            <!-- TAB 1: Ejercicios -->
            <div *ngIf="modalTab() === 'exercises'">
              <div *ngFor="let day of selectedRoutine()?.routine?.days" class="card border-0 rounded-3 mb-3 p-3" style="background-color: #12141c;">
                <h6 class="fw-bold text-success mb-2 small text-uppercase">{{ day.name }}</h6>
                <div class="table-responsive">
                  <table class="table table-sm table-borderless align-middle mb-0">
                    <thead class="small text-secondary border-bottom border-dark">
                      <tr>
                        <th>Ejercicio</th>
                        <th>Patrón / Tipo</th>
                        <th class="text-center">Series</th>
                        <th class="text-center">Reps</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let ex of day.exercises">
                        <td class="text-light fw-medium small">
                          {{ ex.exerciseName || ex.name_es || ex.name }}
                          <span *ngIf="ex.isFinisher" class="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 ms-1" style="font-size: 0.65rem;">Finisher</span>
                        </td>
                        <td><span class="badge badge-subtle">{{ ex.movementPattern || ex.movement_pattern || 'General' }}</span></td>
                        <td class="text-center fw-bold small text-light">{{ ex.sets }}</td>
                        <td class="text-center small text-secondary">{{ ex.reps || ex.repsRange }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- TAB 2: Atletas que la usan -->
            <div *ngIf="modalTab() === 'trainees'">
              <div *ngIf="selectedRoutine()?.trainees && (selectedRoutine()?.trainees)!.length > 0" class="table-responsive">
                <table class="table table-hover align-middle mb-0 custom-table">
                  <thead>
                    <tr>
                      <th class="ps-3">Atleta</th>
                      <th>Estado</th>
                      <th class="text-center">Sesiones</th>
                      <th class="text-center">Volumen</th>
                      <th class="text-end pe-3">Último Entreno</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let t of selectedRoutine()?.trainees">
                      <td class="ps-3">
                        <div class="d-flex align-items-center gap-2">
                          <div class="rounded-circle bg-dark border border-secondary d-flex align-items-center justify-content-center text-light fw-bold" style="width: 32px; height: 32px; font-size: 0.8rem;">
                            {{ (t.name || 'A').charAt(0).toUpperCase() }}
                          </div>
                          <div>
                            <div class="fw-semibold text-light small">{{ t.name }}</div>
                            <div class="small text-secondary font-monospace" style="font-size: 0.7rem;">{{ t.email || 'UID: ' + t.uid }}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span class="badge border py-1 px-2" [ngClass]="getTraineeStatus(t).badgeClass" style="font-size: 0.72rem;">
                          <i class="bi me-1" [ngClass]="getTraineeStatus(t).icon"></i>
                          {{ getTraineeStatus(t).label }}
                        </span>
                      </td>
                      <td class="text-center fw-bold text-light small">{{ t.workoutsCount || 0 }}</td>
                      <td class="text-center text-secondary small">
                        <span *ngIf="t.totalVolumeKg" class="text-info fw-semibold">{{ t.totalVolumeKg | number:'1.0-0' }} kg</span>
                        <span *ngIf="!t.totalVolumeKg" class="opacity-50">—</span>
                      </td>
                      <td class="text-end pe-3 small text-secondary">
                        {{ (t.lastWorkoutMs || t.redeemedAtMs) | date:'shortDate' }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div *ngIf="!selectedRoutine()?.trainees || (selectedRoutine()?.trainees)!.length === 0" class="p-4 text-center rounded-3" style="background: rgba(255,255,255,0.02);">
                <i class="bi bi-person-check fs-1 text-secondary opacity-50 mb-2 d-block"></i>
                <h6 class="fw-bold text-light mb-1">{{ selectedRoutine()?.timesRedeemed }} Atleta(s) han canjeado esta rutina</h6>
                <p class="text-secondary small mb-0" style="max-width: 480px; margin: 0 auto; line-height: 1.5;">
                  Los canjes están contabilizados. Conforme los atletas canjeen el código <strong class="text-success font-monospace">{{ selectedRoutine()?.code }}</strong> en la app móvil y registren sus sesiones, verás aquí su estado en tiempo real, volumen de carga y último entrenamiento.
                </p>
              </div>
            </div>

            <!-- TAB 3: Analítica Biomecánica de la Rutina -->
            <div *ngIf="modalTab() === 'analytics'">
              <div class="row g-3 mb-3">
                <div class="col-12 col-md-6">
                  <div class="p-3 rounded-3 border border-dark h-100" style="background-color: #12141c;">
                    <h6 class="fw-bold text-light small mb-2 d-flex align-items-center gap-2">
                      <i class="bi bi-pie-chart text-success"></i> Volumen Semanal por Grupo Muscular
                    </h6>
                    <p class="text-secondary small mb-3" style="font-size: 0.78rem;">
                      Total de series efectivas semanales programadas en esta rutina:
                    </p>

                    <div *ngFor="let item of getRoutineMuscleSets(selectedRoutine()!)" class="mb-2">
                      <div class="d-flex justify-content-between align-items-center small mb-1">
                        <span class="text-light fw-medium">{{ item.muscle }}</span>
                        <span class="text-secondary">{{ item.sets }} series ({{ item.pct }}%)</span>
                      </div>
                      <div class="progress" style="height: 6px; background-color: rgba(255,255,255,0.06);">
                        <div class="progress-bar bg-success" [style.width.%]="item.pct"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="col-12 col-md-6">
                  <div class="p-3 rounded-3 border border-dark h-100" style="background-color: #12141c;">
                    <h6 class="fw-bold text-light small mb-2 d-flex align-items-center gap-2">
                      <i class="bi bi-sliders text-warning"></i> Tipología de Resistencia
                    </h6>
                    <p class="text-secondary small mb-3" style="font-size: 0.78rem;">
                      Composición biomecánica del plan:
                    </p>

                    <div class="d-flex flex-column gap-2 small">
                      <div class="p-2 rounded-2 border border-secondary border-opacity-10 d-flex justify-content-between align-items-center" style="background: rgba(255,255,255,0.02);">
                        <span class="text-secondary"><i class="bi bi-slash-circle me-2 text-success"></i>Peso Libre (Barra / Mancuerna):</span>
                        <strong class="text-light">{{ getRoutineEquipmentSummary(selectedRoutine()!).free }} ejerc.</strong>
                      </div>
                      <div class="p-2 rounded-2 border border-secondary border-opacity-10 d-flex justify-content-between align-items-center" style="background: rgba(255,255,255,0.02);">
                        <span class="text-secondary"><i class="bi bi-arrows-expand me-2 text-primary"></i>Poleas & Cables:</span>
                        <strong class="text-light">{{ getRoutineEquipmentSummary(selectedRoutine()!).cables }} ejerc.</strong>
                      </div>
                      <div class="p-2 rounded-2 border border-secondary border-opacity-10 d-flex justify-content-between align-items-center" style="background: rgba(255,255,255,0.02);">
                        <span class="text-secondary"><i class="bi bi-gear-wide me-2 text-warning"></i>Máquinas Guiadas:</span>
                        <strong class="text-light">{{ getRoutineEquipmentSummary(selectedRoutine()!).machines }} ejerc.</strong>
                      </div>
                      <div class="p-2 rounded-2 border border-secondary border-opacity-10 d-flex justify-content-between align-items-center" style="background: rgba(255,255,255,0.02);">
                        <span class="text-secondary"><i class="bi bi-person me-2 text-info"></i>Peso Corporal:</span>
                        <strong class="text-light">{{ getRoutineEquipmentSummary(selectedRoutine()!).bodyweight }} ejerc.</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer border-top border-dark px-4 py-2 d-flex justify-content-between align-items-center">
            <button 
              type="button" 
              class="btn btn-sm rounded-3 d-inline-flex align-items-center gap-2"
              [ngClass]="selectedRoutine()?.isIndefinite ? 'btn-outline-warning' : 'btn-outline-success'"
              (click)="toggleIndefinite(selectedRoutine()!)"
            >
              <i class="bi bi-infinity"></i>
              <span>{{ selectedRoutine()?.isIndefinite ? 'Cambiar a 60 días' : 'Hacer Permanente (Indefinida)' }}</span>
            </button>
            <button type="button" class="btn btn-secondary btn-sm rounded-3" (click)="selectedRoutine.set(null)">Cerrar</button>
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
  private cdr = inject(ChangeDetectorRef);

  routines = signal<AssignedRoutineRecord[]>([]);
  cachedFilteredRoutines = signal<AssignedRoutineRecord[]>([]);
  loading = signal<boolean>(true);
  searchQuery = '';
  feedbackMsg = signal<string>('');
  selectedRoutine = signal<AssignedRoutineRecord | null>(null);
  modalTab = signal<'exercises' | 'trainees' | 'analytics'>('exercises');

  getTraineeStatus(t: RoutineTrainee): { label: string; badgeClass: string; icon: string } {
    const last = t.lastWorkoutMs || t.redeemedAtMs;
    const diffDays = Math.floor((Date.now() - last) / (1000 * 60 * 60 * 24));
    if (!t.lastWorkoutMs && (!t.workoutsCount || t.workoutsCount === 0)) {
      return { label: 'Sin entrenos aún', badgeClass: 'bg-secondary bg-opacity-10 text-secondary border-secondary', icon: 'bi-hourglass' };
    }
    if (diffDays <= 2) {
      return { label: 'Activo', badgeClass: 'bg-success bg-opacity-10 text-success border-success', icon: 'bi-fire' };
    }
    if (diffDays <= 6) {
      return { label: `Hace ${diffDays}d`, badgeClass: 'bg-warning bg-opacity-10 text-warning border-warning', icon: 'bi-clock' };
    }
    return { label: 'Inactivo (+7d)', badgeClass: 'bg-danger bg-opacity-10 text-danger border-danger', icon: 'bi-exclamation-triangle' };
  }

  getRoutineMuscleSets(r: AssignedRoutineRecord): { muscle: string; sets: number; pct: number }[] {
    const map = new Map<string, number>();
    let totalSets = 0;
    r.routine?.days?.forEach((d: any) => {
      d.exercises?.forEach((ex: any) => {
        const primary = (ex.primary_es && ex.primary_es[0]) ? ex.primary_es[0] : (ex.muscle || 'General');
        const s = Number(ex.sets) || 3;
        map.set(primary, (map.get(primary) || 0) + s);
        totalSets += s;
      });
    });
    if (totalSets === 0) return [];
    return Array.from(map.entries())
      .map(([muscle, sets]) => ({
        muscle,
        sets,
        pct: Math.round((sets / totalSets) * 100)
      }))
      .sort((a, b) => b.sets - a.sets);
  }

  getRoutineEquipmentSummary(r: AssignedRoutineRecord): { free: number; cables: number; machines: number; bodyweight: number } {
    let free = 0, cables = 0, machines = 0, bodyweight = 0;
    r.routine?.days?.forEach((d: any) => {
      d.exercises?.forEach((ex: any) => {
        const eq = (Array.isArray(ex.equipment_es) ? ex.equipment_es.join(' ') : (ex.equipment_es || '')).toLowerCase();
        const name = (ex.name_es || ex.name || '').toLowerCase();
        if (eq.includes('polea') || eq.includes('cable') || name.includes('polea') || name.includes('cable')) {
          cables++;
        } else if (eq.includes('máquina') || eq.includes('maquina') || eq.includes('prensa') || name.includes('máquina') || name.includes('prensa')) {
          machines++;
        } else if (eq.includes('corporal') || eq.includes('propio') || name.includes('dominada') || name.includes('fondo') || name.includes('plancha')) {
          bodyweight++;
        } else {
          free++;
        }
      });
    });
    return { free, cables, machines, bodyweight };
  }

  async ngOnInit(): Promise<void> {
    await this.loadRoutines();
  }

  trackByCode(index: number, item: AssignedRoutineRecord): string {
    return item.code;
  }

  async loadRoutines(): Promise<void> {
    this.loading.set(true);
    try {
      const isSuper = this.auth.currentUser()?.isSuperAdmin;
      const uid = this.auth.currentUser()?.uid;
      const res = await Promise.race([
        this.routineService.listRoutines(uid, isSuper),
        new Promise<AssignedRoutineRecord[]>((_, reject) => setTimeout(() => reject(new Error('Timeout de rutinas')), 4000))
      ]);
      this.routines.set(res);
      this.onSearchChange();
    } catch (err: any) {
      this.feedbackMsg.set(err.message || 'Error al cargar rutinas.');
      this.routines.set([]);
      this.cachedFilteredRoutines.set([]);
    } finally {
      this.loading.set(false);
      this.cdr.markForCheck();
    }
  }

  onSearchChange(): void {
    const q = this.searchQuery.toLowerCase().trim();
    const all = this.routines();
    if (!q) {
      this.cachedFilteredRoutines.set(all);
      this.cdr.markForCheck();
      return;
    }
    this.cachedFilteredRoutines.set(all.filter(r => 
      r.code.toLowerCase().includes(q) || 
      r.routineName.toLowerCase().includes(q) ||
      (r.createdByName && r.createdByName.toLowerCase().includes(q))
    ));
    this.cdr.markForCheck();
  }

  copyCode(code: string): void {
    navigator.clipboard.writeText(code);
    this.feedbackMsg.set(`¡Código "${code}" copiado al portapapeles!`);
    setTimeout(() => {
      this.feedbackMsg.set('');
      this.cdr.markForCheck();
    }, 4000);
    this.cdr.markForCheck();
  }

  viewDetail(routine: AssignedRoutineRecord): void {
    this.selectedRoutine.set(routine);
    this.modalTab.set('exercises');
    this.cdr.markForCheck();
  }

  async toggleIndefinite(r: AssignedRoutineRecord): Promise<void> {
    const makeIndefinite = !r.isIndefinite;
    try {
      const res = await this.routineService.toggleRoutineIndefinite(r.code, makeIndefinite);
      r.isIndefinite = res.isIndefinite;
      r.expiresAtMs = res.expiresAtMs;
      this.routines.update(list => list.map(item => item.code === r.code ? { ...item, isIndefinite: res.isIndefinite, expiresAtMs: res.expiresAtMs } : item));
      this.onSearchChange();
      this.feedbackMsg.set(makeIndefinite 
        ? `Rutina ${r.code} configurada como INDEFINIDA (permanente). No se eliminará automáticamente.` 
        : `Rutina ${r.code} actualizada con vigencia de 60 días.`);
      this.cdr.markForCheck();
    } catch (err: any) {
      alert(err.message || 'Error al cambiar vigencia de la rutina.');
    }
  }

  async deleteRoutine(code: string): Promise<void> {
    if (!confirm(`¿Eliminar la rutina con código ${code}?`)) {
      return;
    }
    try {
      await this.routineService.deleteRoutine(code);
      this.routines.update(list => list.filter(r => r.code !== code));
      this.onSearchChange();
      this.feedbackMsg.set(`Rutina ${code} eliminada del servidor.`);
    } catch (err: any) {
      alert(err.message || 'Error al eliminar rutina.');
    } finally {
      this.cdr.markForCheck();
    }
  }
}
