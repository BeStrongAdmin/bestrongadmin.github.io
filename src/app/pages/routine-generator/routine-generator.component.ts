import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { AuthService } from '../../services/auth.service';
import { RoutineService } from '../../services/routine.service';
import { ExercisesService, Exercise } from '../../services/exercises.service';

type SplitDayType = 'torso' | 'pierna' | 'empuje' | 'jalon' | 'fullbody';

interface SlotConfig {
  id: string;
  label: string;
  movementPattern: string;
  emphasis?: string;
  isFinisher?: boolean;
  finisherType?: 'core' | 'neck' | 'forearms';
  defaultSets: number;
  defaultReps: string;
}

interface SlotSelection {
  exerciseId: string;
  sets: number;
  repsRange: string;
}

@Component({
  selector: 'app-routine-generator',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  template: `
    <div class="d-flex flex-column flex-lg-row min-vh-100" style="background-color: #07080b;">
      <!-- Responsive Sidebar -->
      <app-sidebar></app-sidebar>

      <!-- Main Content Area -->
      <main class="flex-grow-1 px-3 px-md-5 py-4 overflow-x-hidden">
        <!-- Top Action Bar -->
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <div>
            <h1 class="h4 fw-bold mb-1 text-light tracking-tight">Generador Biomecánico de Rutinas</h1>
            <p class="text-secondary small mb-0">Diseño inteligente de rutinas con código de canje para BeStrong.</p>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2 rounded-3" (click)="regenerateCode()">
              <i class="bi bi-arrow-repeat"></i> Nuevo Código
            </button>
            <button 
              class="btn btn-light btn-sm fw-bold d-flex align-items-center gap-2 px-3 rounded-3" 
              (click)="saveRoutine()" 
              [disabled]="isSaving"
            >
              <span *ngIf="isSaving" class="spinner-border spinner-border-sm"></span>
              <i *ngIf="!isSaving" class="bi bi-cloud-arrow-up-fill text-dark"></i>
              <span>{{ isSaving ? 'Guardando...' : 'Guardar y Publicar' }}</span>
            </button>
          </div>
        </div>

        <!-- Success Alert -->
        <div *ngIf="successMessage" class="alert alert-success d-flex align-items-center justify-content-between py-2 mb-4 border-0 bg-success bg-opacity-10 text-success rounded-3" role="alert">
          <div class="d-flex align-items-center gap-2 small">
            <i class="bi bi-check-circle-fill fs-5 flex-shrink-0"></i>
            <div>{{ successMessage }}</div>
          </div>
          <button type="button" class="btn-close btn-close-white" (click)="successMessage = ''"></button>
        </div>

        <!-- Error Alert -->
        <div *ngIf="errorMessage" class="alert alert-danger d-flex align-items-center justify-content-between py-2 mb-4 border-0 bg-danger bg-opacity-10 text-danger rounded-3" role="alert">
          <div class="d-flex align-items-center gap-2 small">
            <i class="bi bi-exclamation-octagon-fill fs-5 flex-shrink-0"></i>
            <div>{{ errorMessage }}</div>
          </div>
          <button type="button" class="btn-close btn-close-white" (click)="errorMessage = ''"></button>
        </div>

        <!-- Top Settings Panel -->
        <div class="card p-3 p-md-4 rounded-4 border-0 panel-card mb-4">
          <div class="row g-3">
            <div class="col-12 col-md-5">
              <label class="form-label text-secondary small fw-medium mb-1">Nombre de la Rutina</label>
              <input type="text" class="form-control form-control-sm rounded-3" [(ngModel)]="routineName" placeholder="Ej: Hipertrofia Fuerza Pro">
            </div>
            <div class="col-6 col-md-3">
              <label class="form-label text-secondary small fw-medium mb-1">Frecuencia Semanal</label>
              <select class="form-select form-select-sm rounded-3" [(ngModel)]="daysCount" (ngModelChange)="onDaysCountChange()">
                <option [value]="2">2 Días (Full Body)</option>
                <option [value]="3">3 Días (Torso / Pierna / FB)</option>
                <option [value]="4">4 Días (Torso / Pierna x2)</option>
                <option [value]="5">5 Días (Torso/Pierna/Push/Pull/Leg)</option>
                <option [value]="6">6 Días (Push / Pull / Leg x2)</option>
              </select>
            </div>
            <div class="col-6 col-md-2">
              <label class="form-label text-secondary small fw-medium mb-1">Objetivo</label>
              <select class="form-select form-select-sm rounded-3" [(ngModel)]="goal">
                <option value="hypertrophy">Hipertrofia</option>
                <option value="strength">Fuerza</option>
                <option value="endurance">Resistencia</option>
              </select>
            </div>
            <div class="col-12 col-md-2">
              <label class="form-label text-secondary small fw-medium mb-1">Código de Canje</label>
              <input type="text" class="form-control form-control-sm font-monospace text-center fw-bold text-success rounded-3" [(ngModel)]="routineCode" readonly>
            </div>
          </div>
        </div>

        <!-- Day Navigation Tabs -->
        <ul class="nav nav-tabs mb-4 border-0 gap-2">
          <li class="nav-item" *ngFor="let dayType of dayTypes; let i = index">
            <button 
              type="button"
              class="day-tab-btn btn btn-sm d-flex align-items-center gap-2 px-3 py-2 rounded-3 border-0" 
              [class.active-day-tab]="currentDayIndex === i"
              (click)="onSelectDay(i)"
            >
              <span class="badge" [ngClass]="currentDayIndex === i ? 'bg-success text-dark fw-bold' : 'bg-dark text-secondary border border-secondary'">
                Día {{ i + 1 }}
              </span>
              <span class="text-uppercase small fw-semibold">{{ dayType }}</span>
            </button>
          </li>
        </ul>

        <!-- Current Day Slots -->
        <div class="row g-3">
          <div class="col-12 col-lg-6" *ngFor="let slot of currentSlots; trackBy: trackBySlotId">
            <div class="card h-100 p-3 rounded-4 border-0 panel-card" [style.background-color]="slot.isFinisher ? '#11131a' : '#0d0f14'">
              <!-- Slot Header -->
              <div class="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <span class="badge" [ngClass]="slot.isFinisher ? 'badge-finisher' : 'badge-pattern'">
                    {{ slot.isFinisher ? 'FINISHER' : slot.movementPattern }}
                  </span>
                  <span *ngIf="slot.emphasis" class="badge badge-subtle ms-1">{{ slot.emphasis }}</span>
                  <h6 class="fw-bold text-light mt-1 mb-0" style="font-size: 0.95rem;">{{ slot.label }}</h6>
                </div>
              </div>

              <!-- Selected Exercise Box -->
              <div class="d-flex align-items-center justify-content-between p-2 rounded-3 my-2" style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.06);">
                <div class="d-flex align-items-center gap-2 overflow-hidden me-2">
                  <i class="bi bi-activity text-success fs-5"></i>
                  <div class="text-truncate">
                    <div class="fw-semibold text-light text-truncate" style="font-size: 0.9rem;">
                      {{ getExerciseName(selections[currentDayIndex]?.[slot.id]?.exerciseId) }}
                    </div>
                    <div class="text-secondary small" style="font-size: 0.75rem;">
                      {{ getExerciseMuscle(selections[currentDayIndex]?.[slot.id]?.exerciseId) }}
                    </div>
                  </div>
                </div>

                <button class="btn btn-outline-secondary btn-sm text-nowrap rounded-3 py-1 px-2" style="font-size: 0.8rem;" (click)="openSearchModal(slot)">
                  <i class="bi bi-search"></i> Cambiar
                </button>
              </div>

              <!-- Sets & Reps Inputs -->
              <div class="row g-2 mt-1">
                <div class="col-6">
                  <label class="form-label text-secondary small mb-1" style="font-size: 0.75rem;">Series</label>
                  <div class="input-group input-group-sm">
                    <button class="btn btn-outline-secondary" type="button" (click)="adjustSets(slot.id, -1)">-</button>
                    <input 
                      type="number" 
                      class="form-control text-center" 
                      [ngModel]="selections[currentDayIndex]?.[slot.id]?.sets || slot.defaultSets" 
                      (ngModelChange)="updateSlotSets(slot.id, $event)"
                    >
                    <button class="btn btn-outline-secondary" type="button" (click)="adjustSets(slot.id, 1)">+</button>
                  </div>
                </div>
                <div class="col-6">
                  <label class="form-label text-secondary small mb-1" style="font-size: 0.75rem;">Repeticiones</label>
                  <input 
                    type="text" 
                    class="form-control form-control-sm text-center" 
                    [ngModel]="selections[currentDayIndex]?.[slot.id]?.repsRange || slot.defaultReps" 
                    (ngModelChange)="updateSlotReps(slot.id, $event)"
                    placeholder="8-12"
                  >
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- MODAL: Exercise Selector -->
    <div *ngIf="searchModalVisible" class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.85); backdrop-filter: blur(4px);">
      <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content border-0 rounded-4 panel-card shadow-2xl">
          <div class="modal-header border-bottom border-dark px-4 py-3">
            <h6 class="modal-title fw-bold text-light mb-0">
              <i class="bi bi-search text-success me-2"></i>Elegir Ejercicio: {{ activeSearchSlot?.label }}
            </h6>
            <button type="button" class="btn-close btn-close-white" (click)="closeSearchModal()"></button>
          </div>
          <div class="modal-body p-4">
            <!-- Search & Filter inputs -->
            <div class="row g-2 mb-3">
              <div class="col-12 col-md-8">
                <div class="input-group">
                  <span class="input-group-text bg-dark border-secondary text-secondary">
                    <i class="bi bi-search"></i>
                  </span>
                  <input 
                    type="text" 
                    class="form-control" 
                    [(ngModel)]="searchQuery" 
                    (ngModelChange)="onFilterChanged()"
                    placeholder="Buscar ejercicio por nombre..."
                  >
                </div>
              </div>
              <div class="col-12 col-md-4">
                <select class="form-select" [(ngModel)]="selectedMuscleFilter" (ngModelChange)="onFilterChanged()">
                  <option value="all">Todos los músculos</option>
                  <option *ngFor="let m of availableMuscles" [value]="m">{{ m }}</option>
                </select>
              </div>
            </div>

            <!-- Exercises List -->
            <div class="list-group list-group-flush gap-1">
              <button 
                type="button" 
                class="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-2 px-3 rounded-3 border-0"
                *ngFor="let ex of cachedFilteredExercises; trackBy: trackByExerciseId"
                [style.background-color]="isSelectedInActiveSlot(ex.id) ? '#18202d' : '#0e1017'"
                (click)="selectExerciseForSlot(ex.id)"
              >
                <div>
                  <div class="fw-bold text-light small">{{ ex.name_es }}</div>
                  <div class="text-secondary small" style="font-size: 0.75rem;">
                    {{ ex.name_en }} &bull; <span class="badge badge-subtle">{{ ex.primary_muscle_es.join(', ') }}</span>
                  </div>
                </div>
                <div class="d-flex align-items-center gap-2">
                  <span *ngIf="isSelectedInActiveSlot(ex.id)" class="badge bg-success text-dark fw-bold">Actual</span>
                  <span class="btn btn-outline-secondary btn-sm py-1 px-2" style="font-size: 0.75rem;">Elegir</span>
                </div>
              </button>

              <div *ngIf="cachedFilteredExercises.length === 0" class="text-center py-5 text-secondary small">
                No se encontraron ejercicios con ese criterio.
              </div>
            </div>
          </div>
          <div class="modal-footer border-top border-dark px-4 py-2">
            <button type="button" class="btn btn-secondary btn-sm" (click)="closeSearchModal()">Cerrar</button>
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
    .day-tab-btn {
      background: rgba(255, 255, 255, 0.03);
      color: #a0aec0;
      border: 1px solid rgba(255, 255, 255, 0.06) !important;
      transition: all 0.15s ease;
      &:hover {
        background: rgba(255, 255, 255, 0.06);
        color: #fff;
      }
    }
    .active-day-tab {
      background: rgba(0, 230, 118, 0.08) !important;
      color: #00e676 !important;
      border-color: rgba(0, 230, 118, 0.3) !important;
    }
    .badge-pattern {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #cbd5e0;
      font-size: 0.7rem;
    }
    .badge-finisher {
      background: rgba(255, 193, 7, 0.15);
      border: 1px solid rgba(255, 193, 7, 0.3);
      color: #ffd166;
      font-size: 0.7rem;
    }
    .badge-subtle {
      background: rgba(255, 255, 255, 0.04);
      color: #718096;
      font-size: 0.7rem;
    }
  `]
})
export class RoutineGeneratorComponent implements OnInit {
  private auth = inject(AuthService);
  private routineService = inject(RoutineService);
  private exercisesService = inject(ExercisesService);

  routineName = 'Rutina Personalizada Pro';
  routineCode = '';
  daysCount = 4;
  goal = 'hypertrophy';
  currentDayIndex = 0;

  // Stored state (NOT getters) to prevent infinite change detection
  dayTypes: SplitDayType[] = [];
  currentSlots: SlotConfig[] = [];
  selections: Record<number, Record<string, SlotSelection>> = {};

  isSaving = false;
  successMessage = '';
  errorMessage = '';

  // Modal & Search
  searchModalVisible = false;
  activeSearchSlot: SlotConfig | null = null;
  searchQuery = '';
  selectedMuscleFilter = 'all';
  availableMuscles: string[] = [];
  cachedFilteredExercises: Exercise[] = [];

  ngOnInit(): void {
    this.routineCode = this.routineService.generateRandomCode();
    this.availableMuscles = this.exercisesService.getMuscles();
    this.computeDayTypes();
    this.initializeDefaultSelections();
    this.updateCurrentSlots();
  }

  regenerateCode(): void {
    this.routineCode = this.routineService.generateRandomCode();
  }

  trackBySlotId(index: number, slot: SlotConfig): string {
    return slot.id;
  }

  trackByExerciseId(index: number, ex: Exercise): string {
    return ex.id;
  }

  onDaysCountChange(): void {
    if (this.currentDayIndex >= this.daysCount) {
      this.currentDayIndex = 0;
    }
    this.computeDayTypes();
    this.initializeDefaultSelections();
    this.updateCurrentSlots();
  }

  onSelectDay(index: number): void {
    this.currentDayIndex = index;
    this.updateCurrentSlots();
  }

  private computeDayTypes(): void {
    if (this.daysCount <= 2) this.dayTypes = ['fullbody', 'fullbody'];
    else if (this.daysCount === 3) this.dayTypes = ['torso', 'pierna', 'fullbody'];
    else if (this.daysCount === 4) this.dayTypes = ['torso', 'pierna', 'torso', 'pierna'];
    else if (this.daysCount === 5) this.dayTypes = ['torso', 'pierna', 'empuje', 'jalon', 'pierna'];
    else this.dayTypes = ['empuje', 'jalon', 'pierna', 'empuje', 'jalon', 'pierna'];
  }

  private updateCurrentSlots(): void {
    const dayType = this.dayTypes[this.currentDayIndex] || 'torso';
    this.currentSlots = this.getBaseSlotsForDay(this.currentDayIndex, dayType, this.daysCount);
  }

  private getBaseSlotsForDay(d: number, dayType: SplitDayType, totalDays: number): SlotConfig[] {
    const slots: SlotConfig[] = [];

    if (dayType === 'torso') {
      slots.push({ id: `s_hp1_${d}`, label: 'Espalda Densidad (Remo)', movementPattern: 'horizontal_pull', defaultSets: 3, defaultReps: '8-12' });
      slots.push({ id: `s_vp1_${d}`, label: 'Espalda Amplitud (Jalón)', movementPattern: 'vertical_pull', defaultSets: 3, defaultReps: '8-12' });
      slots.push({ id: `s_hpush_up_${d}`, label: 'Pecho Superior (Inclinado)', movementPattern: 'horizontal_push', emphasis: 'upper_chest', defaultSets: 3, defaultReps: '8-12' });
      slots.push({ id: `s_hpush_mid_${d}`, label: 'Pecho Plano / Medio', movementPattern: 'horizontal_push', emphasis: 'mid_chest', defaultSets: 3, defaultReps: '8-12' });
      slots.push({ id: `s_lat_${d}`, label: 'Hombro Lateral (Elevaciones)', movementPattern: 'lateral_raise', defaultSets: 3, defaultReps: '12-15' });
      slots.push({ id: `s_biceps_${d}`, label: 'Bíceps (Flexión codo)', movementPattern: 'elbow_flexion', defaultSets: 3, defaultReps: '10-15' });
      slots.push({ id: `s_triceps_${d}`, label: 'Tríceps (Extensión codo)', movementPattern: 'elbow_extension', defaultSets: 3, defaultReps: '10-15' });
    } else if (dayType === 'empuje') {
      slots.push({ id: `s_e_push_up_${d}`, label: 'Pecho Superior (Clavicular)', movementPattern: 'horizontal_push', emphasis: 'upper_chest', defaultSets: 3, defaultReps: '8-12' });
      slots.push({ id: `s_e_push_mid_${d}`, label: 'Pecho Medio (Esternal)', movementPattern: 'horizontal_push', emphasis: 'mid_chest', defaultSets: 3, defaultReps: '8-12' });
      slots.push({ id: `s_e_vpush_${d}`, label: 'Hombro Frontal (Press)', movementPattern: 'vertical_push', defaultSets: 3, defaultReps: '8-12' });
      slots.push({ id: `s_e_lat_${d}`, label: 'Hombro Lateral (Elevaciones)', movementPattern: 'lateral_raise', defaultSets: 3, defaultReps: '12-15' });
      slots.push({ id: `s_e_tri1_${d}`, label: 'Tríceps Pesado', movementPattern: 'elbow_extension', defaultSets: 3, defaultReps: '8-12' });
      slots.push({ id: `s_e_tri2_${d}`, label: 'Tríceps Aislamiento', movementPattern: 'elbow_extension', defaultSets: 3, defaultReps: '12-15' });
    } else if (dayType === 'jalon') {
      slots.push({ id: `s_j_hp1_${d}`, label: 'Remo Pesado (Densidad)', movementPattern: 'horizontal_pull', defaultSets: 3, defaultReps: '8-12' });
      slots.push({ id: `s_j_vp_${d}`, label: 'Jalón Dorsal (Amplitud)', movementPattern: 'vertical_pull', defaultSets: 3, defaultReps: '8-12' });
      slots.push({ id: `s_j_hp2_${d}`, label: 'Remo Secundario', movementPattern: 'horizontal_pull', defaultSets: 3, defaultReps: '10-12' });
      slots.push({ id: `s_j_rear_${d}`, label: 'Deltoides Posterior', movementPattern: 'rear_delt', defaultSets: 3, defaultReps: '12-15' });
      slots.push({ id: `s_j_bi1_${d}`, label: 'Bíceps Pesado', movementPattern: 'elbow_flexion', defaultSets: 3, defaultReps: '8-12' });
      slots.push({ id: `s_j_bi2_${d}`, label: 'Bíceps Aislamiento', movementPattern: 'elbow_flexion', defaultSets: 3, defaultReps: '12-15' });
    } else if (dayType === 'pierna') {
      slots.push({ id: `s_p_squat_${d}`, label: 'Cuádriceps (Sentadilla / Prensa)', movementPattern: 'squat', defaultSets: 3, defaultReps: '8-12' });
      slots.push({ id: `s_p_hinge_${d}`, label: 'Isquios (Peso muerto / Bisagra)', movementPattern: 'hinge', defaultSets: 3, defaultReps: '8-12' });
      slots.push({ id: `s_p_hip_${d}`, label: 'Glúteo (Hip Thrust)', movementPattern: 'hip_thrust', defaultSets: 3, defaultReps: '10-12' });
      slots.push({ id: `s_p_add_${d}`, label: 'Aductores / Abductores', movementPattern: 'adduction', defaultSets: 3, defaultReps: '12-15' });
      slots.push({ id: `s_p_curl_${d}`, label: 'Femoral Aislamiento (Curl)', movementPattern: 'leg_curl', defaultSets: 3, defaultReps: '10-15' });
      slots.push({ id: `s_p_calf_${d}`, label: 'Gemelos (Elevación talones)', movementPattern: 'calf_raise', defaultSets: 4, defaultReps: '12-20' });
    } else {
      slots.push({ id: `s_fb_squat_${d}`, label: 'Tren Inferior (Sentadilla)', movementPattern: 'squat', defaultSets: 3, defaultReps: '8-12' });
      slots.push({ id: `s_fb_hinge_${d}`, label: 'Tren Inferior (Bisagra)', movementPattern: 'hinge', defaultSets: 3, defaultReps: '8-12' });
      slots.push({ id: `s_fb_push_${d}`, label: 'Empuje Torso (Press)', movementPattern: 'horizontal_push', defaultSets: 3, defaultReps: '8-12' });
      slots.push({ id: `s_fb_pull_${d}`, label: 'Jalón Torso (Remo)', movementPattern: 'horizontal_pull', defaultSets: 3, defaultReps: '8-12' });
      slots.push({ id: `s_fb_lat_${d}`, label: 'Hombro Lateral (Elevaciones)', movementPattern: 'lateral_raise', defaultSets: 3, defaultReps: '12-15' });
      slots.push({ id: `s_fb_bi_${d}`, label: 'Bíceps (Flexión codo)', movementPattern: 'elbow_flexion', defaultSets: 3, defaultReps: '10-12' });
      slots.push({ id: `s_fb_tri_${d}`, label: 'Tríceps (Extensión codo)', movementPattern: 'elbow_extension', defaultSets: 3, defaultReps: '10-12' });
    }

    // Finishers
    let addCore = false;
    let addNeckForearms = false;
    if (totalDays <= 2) {
      if (d === 0) addCore = true;
      if (d === 1) addNeckForearms = true;
    } else if (totalDays === 3) {
      if (dayType === 'pierna') addCore = true;
      if (dayType === 'torso' || dayType === 'fullbody') addNeckForearms = true;
    } else if (totalDays === 4) {
      if (dayType === 'pierna') addCore = true;
      if (dayType === 'torso') addNeckForearms = true;
    } else if (totalDays === 5) {
      if (dayType === 'pierna') addCore = true;
      if (dayType === 'torso' || dayType === 'jalon') addNeckForearms = true;
    } else {
      if (dayType === 'pierna') addCore = true;
      if (dayType === 'empuje') addNeckForearms = true;
    }

    if (addCore) {
      slots.push({ id: `f_core1_${d}`, label: 'Abdomen (Core)', movementPattern: 'core', isFinisher: true, finisherType: 'core', defaultSets: 3, defaultReps: '15-20' });
    }
    if (addNeckForearms) {
      slots.push({ id: `f_neck_${d}`, label: 'Cuello / Antebrazos', movementPattern: 'forearms', isFinisher: true, finisherType: 'forearms', defaultSets: 3, defaultReps: '12-15' });
    }

    return slots;
  }

  private initializeDefaultSelections(): void {
    for (let d = 0; d < this.daysCount; d++) {
      if (!this.selections[d]) {
        this.selections[d] = {};
      }
      const dayType = this.dayTypes[d] || 'torso';
      const slots = this.getBaseSlotsForDay(d, dayType, this.daysCount);

      for (const slot of slots) {
        if (!this.selections[d][slot.id]) {
          const matchingExercises = this.exercisesService.getForPattern(slot.movementPattern, slot.emphasis);
          const defaultEx = matchingExercises[0] || this.exercisesService.getAll()[0];
          this.selections[d][slot.id] = {
            exerciseId: defaultEx ? defaultEx.id : '',
            sets: slot.defaultSets,
            repsRange: slot.defaultReps
          };
        }
      }
    }
  }

  getExerciseName(id?: string): string {
    if (!id) return 'Seleccionar Ejercicio...';
    const ex = this.exercisesService.getById(id);
    return ex ? ex.name_es : id;
  }

  getExerciseMuscle(id?: string): string {
    if (!id) return '';
    const ex = this.exercisesService.getById(id);
    return ex ? ex.primary_muscle_es.join(', ') : '';
  }

  adjustSets(slotId: string, delta: number): void {
    const cur = this.selections[this.currentDayIndex]?.[slotId];
    if (cur) {
      cur.sets = Math.max(1, Math.min(10, cur.sets + delta));
    }
  }

  updateSlotSets(slotId: string, val: any): void {
    const cur = this.selections[this.currentDayIndex]?.[slotId];
    if (cur) cur.sets = Number(val) || 3;
  }

  updateSlotReps(slotId: string, val: string): void {
    const cur = this.selections[this.currentDayIndex]?.[slotId];
    if (cur) cur.repsRange = val;
  }

  openSearchModal(slot: SlotConfig): void {
    this.activeSearchSlot = slot;
    this.searchQuery = '';
    this.selectedMuscleFilter = 'all';
    this.onFilterChanged();
    this.searchModalVisible = true;
  }

  closeSearchModal(): void {
    this.searchModalVisible = false;
    this.activeSearchSlot = null;
  }

  onFilterChanged(): void {
    this.cachedFilteredExercises = this.exercisesService.search(
      this.searchQuery, 
      this.selectedMuscleFilter, 
      this.activeSearchSlot?.movementPattern
    );
  }

  isSelectedInActiveSlot(id: string): boolean {
    if (!this.activeSearchSlot) return false;
    return this.selections[this.currentDayIndex]?.[this.activeSearchSlot.id]?.exerciseId === id;
  }

  selectExerciseForSlot(id: string): void {
    if (!this.activeSearchSlot) return;
    const slotId = this.activeSearchSlot.id;
    if (!this.selections[this.currentDayIndex]) {
      this.selections[this.currentDayIndex] = {};
    }
    const cur = this.selections[this.currentDayIndex][slotId];
    if (cur) {
      cur.exerciseId = id;
    } else {
      this.selections[this.currentDayIndex][slotId] = {
        exerciseId: id,
        sets: this.activeSearchSlot.defaultSets,
        repsRange: this.activeSearchSlot.defaultReps
      };
    }
    this.closeSearchModal();
  }

  async saveRoutine(): Promise<void> {
    const user = this.auth.currentUser();
    if (!user) {
      this.errorMessage = 'Debes iniciar sesión para guardar rutinas.';
      return;
    }

    this.isSaving = true;
    this.successMessage = '';
    this.errorMessage = '';

    try {
      const daysData = [];
      for (let d = 0; d < this.daysCount; d++) {
        const dayType = this.dayTypes[d] || 'torso';
        const slots = this.getBaseSlotsForDay(d, dayType, this.daysCount);
        const dayExercises = [];

        for (const slot of slots) {
          const sel = this.selections[d]?.[slot.id];
          if (sel && sel.exerciseId) {
            const exInfo = this.exercisesService.getById(sel.exerciseId);
            dayExercises.push({
              exerciseId: sel.exerciseId,
              exerciseName: exInfo?.name_es || sel.exerciseId,
              sets: sel.sets,
              reps: sel.repsRange,
              movementPattern: slot.movementPattern,
              isFinisher: slot.isFinisher || false
            });
          }
        }

        daysData.push({
          dayIndex: d + 1,
          name: `Día ${d + 1}: ${dayType.toUpperCase()}`,
          type: dayType,
          exercises: dayExercises
        });
      }

      const routinePayload = {
        name: this.routineName,
        goal: this.goal,
        daysCount: this.daysCount,
        days: daysData
      };

      const result = await this.routineService.createAssignedRoutine(
        this.routineCode,
        this.routineName,
        routinePayload,
        user.uid,
        user.displayName || user.email || 'Admin'
      );

      this.successMessage = `¡Rutina guardada exitosamente con el código ${result.code}! Válida hasta el ${result.expiresAt.toLocaleDateString()}.`;
      this.regenerateCode();
    } catch (err: any) {
      this.errorMessage = err.message || 'Error guardando la rutina en Firestore.';
    } finally {
      this.isSaving = false;
    }
  }
}
