import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
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
  imports: [CommonModule, FormsModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>

    <div class="container-fluid px-3 px-md-4 py-4">
      <!-- Title & Action Bar -->
      <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 class="h3 fw-bold mb-1 text-light">Generador de Rutinas Pro</h1>
          <p class="text-secondary mb-0">Diseño biomecánico inteligente de rutinas con código de canje para BeStrong.</p>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-secondary d-flex align-items-center gap-2" (click)="regenerateCode()">
            <i class="bi bi-arrow-repeat"></i> Nuevo Código
          </button>
          <button 
            class="btn btn-primary d-flex align-items-center gap-2 px-4" 
            (click)="saveRoutine()" 
            [disabled]="isSaving"
          >
            <span *ngIf="isSaving" class="spinner-border spinner-border-sm"></span>
            <i *ngIf="!isSaving" class="bi bi-cloud-arrow-up-fill"></i>
            {{ isSaving ? 'Guardando en Firestore...' : 'Guardar y Publicar Rutina' }}
          </button>
        </div>
      </div>

      <!-- Success Alert Banner -->
      <div *ngIf="successMessage" class="alert alert-success d-flex align-items-center justify-content-between py-3 mb-4" role="alert">
        <div class="d-flex align-items-center gap-2">
          <i class="bi bi-check-circle-fill fs-4 flex-shrink-0"></i>
          <div>{{ successMessage }}</div>
        </div>
        <button type="button" class="btn-close" (click)="successMessage = ''"></button>
      </div>

      <!-- Error Alert Banner -->
      <div *ngIf="errorMessage" class="alert alert-danger d-flex align-items-center justify-content-between py-3 mb-4" role="alert">
        <div class="d-flex align-items-center gap-2">
          <i class="bi bi-exclamation-octagon-fill fs-4 flex-shrink-0"></i>
          <div>{{ errorMessage }}</div>
        </div>
        <button type="button" class="btn-close" (click)="errorMessage = ''"></button>
      </div>

      <!-- Top Settings Card -->
      <div class="card border border-dark p-3 p-md-4 mb-4" style="background-color: #141219;">
        <div class="row g-3">
          <div class="col-12 col-md-5">
            <label class="form-label text-secondary small fw-medium">Nombre de la Rutina</label>
            <input type="text" class="form-control" [(ngModel)]="routineName" placeholder="Ej: Rutina Personalizada Hipertrofia">
          </div>
          <div class="col-6 col-md-3">
            <label class="form-label text-secondary small fw-medium">Frecuencia Semanal</label>
            <select class="form-select" [(ngModel)]="daysCount" (change)="onDaysCountChange()">
              <option [value]="2">2 Días (Full Body)</option>
              <option [value]="3">3 Días (Torso / Pierna / FB)</option>
              <option [value]="4">4 Días (Torso / Pierna x2)</option>
              <option [value]="5">5 Días (Torso/Pierna/Push/Pull/Leg)</option>
              <option [value]="6">6 Días (Push / Pull / Leg x2)</option>
            </select>
          </div>
          <div class="col-6 col-md-2">
            <label class="form-label text-secondary small fw-medium">Objetivo</label>
            <select class="form-select" [(ngModel)]="goal">
              <option value="hypertrophy">Hipertrofia</option>
              <option value="strength">Fuerza</option>
              <option value="endurance">Resistencia</option>
            </select>
          </div>
          <div class="col-12 col-md-2">
            <label class="form-label text-secondary small fw-medium">Código de Canje</label>
            <div class="input-group">
              <input type="text" class="form-control font-monospace text-center fw-bold text-primary" [(ngModel)]="routineCode" readonly>
            </div>
          </div>
        </div>
      </div>

      <!-- Day Navigation Tabs -->
      <ul class="nav nav-tabs mb-4">
        <li class="nav-item" *ngFor="let dayType of dayTypes; let i = index">
          <button 
            class="nav-link d-flex align-items-center gap-2 py-3 px-4" 
            [class.active]="currentDayIndex === i"
            (click)="currentDayIndex = i"
          >
            <span class="badge" [ngClass]="currentDayIndex === i ? 'bg-primary' : 'bg-dark border border-secondary'">
              Día {{ i + 1 }}
            </span>
            <span class="text-uppercase fw-semibold">{{ dayType }}</span>
          </button>
        </li>
      </ul>

      <!-- Current Day Slots -->
      <div class="row g-3">
        <div class="col-12 col-lg-6" *ngFor="let slot of currentSlots">
          <div class="card h-100 border border-dark p-3" [style.background-color]="slot.isFinisher ? '#191522' : '#141219'">
            <!-- Slot Header -->
            <div class="d-flex justify-content-between align-items-start mb-2">
              <div>
                <span class="badge" [ngClass]="slot.isFinisher ? 'bg-warning text-dark' : 'bg-primary bg-opacity-25 text-primary border border-primary'">
                  {{ slot.isFinisher ? 'FINISHER' : slot.movementPattern }}
                </span>
                <span *ngIf="slot.emphasis" class="badge bg-secondary ms-1">{{ slot.emphasis }}</span>
                <h6 class="fw-bold text-light mt-1 mb-0">{{ slot.label }}</h6>
              </div>
            </div>

            <!-- Selected Exercise Box -->
            <div class="d-flex align-items-center justify-content-between bg-dark bg-opacity-50 p-2 rounded border border-dark my-2">
              <div class="d-flex align-items-center gap-2 overflow-hidden">
                <i class="bi bi-activity text-success fs-5"></i>
                <div class="text-truncate">
                  <div class="fw-semibold text-light text-truncate">
                    {{ getExerciseName(selections[currentDayIndex]?.[slot.id]?.exerciseId) }}
                  </div>
                  <div class="small text-secondary">
                    {{ getExerciseMuscle(selections[currentDayIndex]?.[slot.id]?.exerciseId) }}
                  </div>
                </div>
              </div>

              <!-- Button to open Search / Swap Modal -->
              <button class="btn btn-outline-light btn-sm text-nowrap d-flex align-items-center gap-1" (click)="openSearchModal(slot)">
                <i class="bi bi-search"></i> Cambiar
              </button>
            </div>

            <!-- Sets & Reps Inputs -->
            <div class="row g-2 mt-1">
              <div class="col-6">
                <label class="form-label text-secondary small mb-1">Series</label>
                <div class="input-group input-group-sm">
                  <button class="btn btn-dark border-secondary" type="button" (click)="adjustSets(slot.id, -1)">-</button>
                  <input 
                    type="number" 
                    class="form-control text-center" 
                    [ngModel]="selections[currentDayIndex]?.[slot.id]?.sets || slot.defaultSets" 
                    (ngModelChange)="updateSlotSets(slot.id, $event)"
                  >
                  <button class="btn btn-dark border-secondary" type="button" (click)="adjustSets(slot.id, 1)">+</button>
                </div>
              </div>
              <div class="col-6">
                <label class="form-label text-secondary small mb-1">Repeticiones</label>
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
    </div>

    <!-- MODAL: Exercise Search & Selector -->
    <div *ngIf="searchModalVisible" class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.8);">
      <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content border border-secondary shadow-lg">
          <div class="modal-header border-bottom border-dark">
            <h5 class="modal-title fw-bold text-light">
              <i class="bi bi-search text-primary me-2"></i>Seleccionar Ejercicio para: {{ activeSearchSlot?.label }}
            </h5>
            <button type="button" class="btn-close btn-close-white" (click)="closeSearchModal()"></button>
          </div>
          <div class="modal-body p-3">
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
                    placeholder="Buscar ejercicio por nombre en español o inglés..."
                  >
                </div>
              </div>
              <div class="col-12 col-md-4">
                <select class="form-select" [(ngModel)]="selectedMuscleFilter">
                  <option value="all">Todos los músculos</option>
                  <option *ngFor="let m of availableMuscles" [value]="m">{{ m }}</option>
                </select>
              </div>
            </div>

            <!-- Exercises list -->
            <div class="list-group">
              <button 
                type="button" 
                class="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-3 border-dark"
                *ngFor="let ex of filteredExercises"
                [style.background-color]="isSelectedInActiveSlot(ex.id) ? '#282333' : '#141219'"
                (click)="selectExerciseForSlot(ex.id)"
              >
                <div>
                  <div class="fw-bold text-light">{{ ex.name_es }}</div>
                  <div class="small text-secondary">{{ ex.name_en }} &bull; <span class="badge bg-secondary">{{ ex.primary_muscle_es.join(', ') }}</span></div>
                </div>
                <div class="d-flex align-items-center gap-2">
                  <span *ngIf="isSelectedInActiveSlot(ex.id)" class="badge bg-success">Seleccionado</span>
                  <span class="btn btn-outline-primary btn-sm">Elegir</span>
                </div>
              </button>

              <div *ngIf="filteredExercises.length === 0" class="text-center py-4 text-secondary">
                No se encontraron ejercicios con ese criterio de búsqueda.
              </div>
            </div>
          </div>
          <div class="modal-footer border-top border-dark">
            <button type="button" class="btn btn-secondary" (click)="closeSearchModal()">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class RoutineGeneratorComponent implements OnInit {
  private auth = inject(AuthService);
  private routineService = inject(RoutineService);
  private exercisesService = inject(ExercisesService);
  private router = inject(Router);

  routineName = 'Rutina Personalizada Pro';
  routineCode = '';
  daysCount = 4;
  goal = 'hypertrophy';
  currentDayIndex = 0;

  selections: Record<number, Record<string, SlotSelection>> = {};
  isSaving = false;
  successMessage = '';
  errorMessage = '';

  // Modal
  searchModalVisible = false;
  activeSearchSlot: SlotConfig | null = null;
  searchQuery = '';
  selectedMuscleFilter = 'all';
  availableMuscles: string[] = [];

  ngOnInit(): void {
    this.routineCode = this.routineService.generateRandomCode();
    this.availableMuscles = this.exercisesService.getMuscles();
    this.initializeDefaultSelections();
  }

  regenerateCode(): void {
    this.routineCode = this.routineService.generateRandomCode();
  }

  get dayTypes(): SplitDayType[] {
    if (this.daysCount <= 2) return ['fullbody', 'fullbody'];
    if (this.daysCount === 3) return ['torso', 'pierna', 'fullbody'];
    if (this.daysCount === 4) return ['torso', 'pierna', 'torso', 'pierna'];
    if (this.daysCount === 5) return ['torso', 'pierna', 'empuje', 'jalon', 'pierna'];
    return ['empuje', 'jalon', 'pierna', 'empuje', 'jalon', 'pierna'];
  }

  get currentSlots(): SlotConfig[] {
    const dayType = this.dayTypes[this.currentDayIndex] || 'torso';
    return this.getBaseSlotsForDay(this.currentDayIndex, dayType, this.daysCount);
  }

  onDaysCountChange(): void {
    if (this.currentDayIndex >= this.daysCount) {
      this.currentDayIndex = 0;
    }
    this.initializeDefaultSelections();
  }

  private getBaseSlotsForDay(d: number, dayType: SplitDayType, totalDays: number): SlotConfig[] {
    const slots: SlotConfig[] = [];

    if (dayType === 'torso') {
      slots.push({ id: `s_hp1_${d}`, label: 'Espalda Densidad (Remo horizontal)', movementPattern: 'horizontal_pull', defaultSets: 3, defaultReps: '8-12' });
      slots.push({ id: `s_vp1_${d}`, label: 'Espalda Amplitud (Jalón vertical)', movementPattern: 'vertical_pull', defaultSets: 3, defaultReps: '8-12' });
      slots.push({ id: `s_hpush_up_${d}`, label: 'Pecho Superior (Inclinado)', movementPattern: 'horizontal_push', emphasis: 'upper_chest', defaultSets: 3, defaultReps: '8-12' });
      slots.push({ id: `s_hpush_mid_${d}`, label: 'Pecho Medio / Plano', movementPattern: 'horizontal_push', emphasis: 'mid_chest', defaultSets: 3, defaultReps: '8-12' });
      slots.push({ id: `s_lat_${d}`, label: 'Hombro Lateral (Elevaciones)', movementPattern: 'lateral_raise', defaultSets: 3, defaultReps: '12-15' });
      slots.push({ id: `s_biceps_${d}`, label: 'Bíceps (Flexión de codo)', movementPattern: 'elbow_flexion', defaultSets: 3, defaultReps: '10-15' });
      slots.push({ id: `s_triceps_${d}`, label: 'Tríceps (Extensión de codo)', movementPattern: 'elbow_extension', defaultSets: 3, defaultReps: '10-15' });
    } else if (dayType === 'empuje') {
      slots.push({ id: `s_e_push_up_${d}`, label: 'Pecho Superior (Clavicular)', movementPattern: 'horizontal_push', emphasis: 'upper_chest', defaultSets: 3, defaultReps: '8-12' });
      slots.push({ id: `s_e_push_mid_${d}`, label: 'Pecho Medio (Esternal)', movementPattern: 'horizontal_push', emphasis: 'mid_chest', defaultSets: 3, defaultReps: '8-12' });
      slots.push({ id: `s_e_vpush_${d}`, label: 'Hombro Frontal (Press militar)', movementPattern: 'vertical_push', defaultSets: 3, defaultReps: '8-12' });
      slots.push({ id: `s_e_lat_${d}`, label: 'Hombro Lateral (Elevaciones)', movementPattern: 'lateral_raise', defaultSets: 3, defaultReps: '12-15' });
      slots.push({ id: `s_e_tri1_${d}`, label: 'Tríceps Pesado (Compuesto)', movementPattern: 'elbow_extension', defaultSets: 3, defaultReps: '8-12' });
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
      slots.push({ id: `s_p_curl_${d}`, label: 'Femoral Aislamiento (Curl pierna)', movementPattern: 'leg_curl', defaultSets: 3, defaultReps: '10-15' });
      slots.push({ id: `s_p_calf_${d}`, label: 'Gemelos (Elevación de talones)', movementPattern: 'calf_raise', defaultSets: 4, defaultReps: '12-20' });
    } else {
      slots.push({ id: `s_fb_squat_${d}`, label: 'Tren Inferior Anterior (Sentadilla)', movementPattern: 'squat', defaultSets: 3, defaultReps: '8-12' });
      slots.push({ id: `s_fb_hinge_${d}`, label: 'Tren Inferior Posterior (Bisagra)', movementPattern: 'hinge', defaultSets: 3, defaultReps: '8-12' });
      slots.push({ id: `s_fb_push_${d}`, label: 'Empuje Torso (Pecho / Press)', movementPattern: 'horizontal_push', defaultSets: 3, defaultReps: '8-12' });
      slots.push({ id: `s_fb_pull_${d}`, label: 'Jalón Torso (Remo / Jalón)', movementPattern: 'horizontal_pull', defaultSets: 3, defaultReps: '8-12' });
      slots.push({ id: `s_fb_lat_${d}`, label: 'Hombro Lateral (Elevaciones)', movementPattern: 'lateral_raise', defaultSets: 3, defaultReps: '12-15' });
      slots.push({ id: `s_fb_bi_${d}`, label: 'Bíceps (Flexión de codo)', movementPattern: 'elbow_flexion', defaultSets: 3, defaultReps: '10-12' });
      slots.push({ id: `s_fb_tri_${d}`, label: 'Tríceps (Extensión de codo)', movementPattern: 'elbow_extension', defaultSets: 3, defaultReps: '10-12' });
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
      const dayType = this.dayTypes[d];
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
    this.searchModalVisible = true;
  }

  closeSearchModal(): void {
    this.searchModalVisible = false;
    this.activeSearchSlot = null;
  }

  get filteredExercises(): Exercise[] {
    return this.exercisesService.search(
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
      // Ensamblar estructura de días de la rutina
      const daysData = [];
      for (let d = 0; d < this.daysCount; d++) {
        const dayType = this.dayTypes[d];
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
