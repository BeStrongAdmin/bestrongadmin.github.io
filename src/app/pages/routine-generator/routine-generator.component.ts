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

interface CustomExerciseItem {
  uid: string;
  exerciseId: string;
  sets: number;
  repsRange: string;
  isFinisher?: boolean;
}

interface CustomDayPlan {
  name: string;
  exercises: CustomExerciseItem[];
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
            <h1 class="h4 fw-bold mb-1 text-light tracking-tight">Generador de Rutinas</h1>
            <p class="text-secondary small mb-0">Diseña rutinas con código de canje para BeStrong (Presets Biomecánicos o Personalizadas).</p>
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

        <!-- Mode Selector Switch -->
        <div class="d-flex gap-2 mb-4 p-1 rounded-4 panel-card" style="width: fit-content; max-width: 100%;">
          <button 
            type="button" 
            class="btn btn-sm rounded-3 px-3 py-2 fw-semibold d-flex align-items-center gap-2 mode-pill-btn"
            [class.active-mode]="generatorMode === 'preset'"
            (click)="setGeneratorMode('preset')"
          >
            <i class="bi bi-lightning-charge-fill text-warning"></i>
            <span>Split Biomecánico Inteligente</span>
          </button>
          <button 
            type="button" 
            class="btn btn-sm rounded-3 px-3 py-2 fw-semibold d-flex align-items-center gap-2 mode-pill-btn"
            [class.active-mode]="generatorMode === 'custom'"
            (click)="setGeneratorMode('custom')"
          >
            <i class="bi bi-sliders text-success"></i>
            <span>100% Personalizada (Libre)</span>
          </button>
        </div>

        <!-- Top Settings Panel -->
        <div class="card p-3 p-md-4 rounded-4 border-0 panel-card mb-4">
          <div class="row g-3">
            <div class="col-12 col-md-5">
              <label class="form-label text-secondary small fw-medium mb-1">Nombre de la Rutina</label>
              <input type="text" class="form-control form-control-sm rounded-3" [(ngModel)]="routineName" placeholder="Ej: Hipertrofia Fuerza Pro">
            </div>

            <!-- Preset Mode Days Count -->
            <div class="col-6 col-md-3" *ngIf="generatorMode === 'preset'">
              <label class="form-label text-secondary small fw-medium mb-1">Frecuencia Semanal</label>
              <select class="form-select form-select-sm rounded-3" [(ngModel)]="daysCount" (ngModelChange)="onDaysCountChange()">
                <option [value]="2">2 Días (Full Body)</option>
                <option [value]="3">3 Días (Torso / Pierna / FB)</option>
                <option [value]="4">4 Días (Torso / Pierna x2)</option>
                <option [value]="5">5 Días (Torso/Pierna/Push/Pull/Leg)</option>
                <option [value]="6">6 Días (Push / Pull / Leg x2)</option>
              </select>
            </div>

            <!-- Custom Mode Days Count (1 to 7 days) -->
            <div class="col-6 col-md-3" *ngIf="generatorMode === 'custom'">
              <label class="form-label text-secondary small fw-medium mb-1">Días de Entrenamiento</label>
              <select class="form-select form-select-sm rounded-3" [(ngModel)]="customDaysCount" (ngModelChange)="onCustomDaysCountChange()">
                <option [value]="1">1 Día</option>
                <option [value]="2">2 Días</option>
                <option [value]="3">3 Días</option>
                <option [value]="4">4 Días</option>
                <option [value]="5">5 Días</option>
                <option [value]="6">6 Días</option>
                <option [value]="7">7 Días</option>
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

        <!-- ========================================== -->
        <!-- VIEW 1: PRESET BIOMECHANICAL SPLIT         -->
        <!-- ========================================== -->
        <ng-container *ngIf="generatorMode === 'preset'">
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

          <!-- Current Day Slots with 50/50 Card Layout -->
          <div class="row g-3">
            <div class="col-12 col-xl-6" *ngFor="let slot of currentSlots; trackBy: trackBySlotId">
              <div class="card h-100 p-3 rounded-4 border-0 panel-card" [style.background-color]="slot.isFinisher ? '#11131a' : '#0d0f14'">
                <!-- Slot Header -->
                <div class="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <span class="badge" [ngClass]="slot.isFinisher ? 'badge-finisher' : 'badge-pattern'">
                      {{ slot.isFinisher ? 'FINISHER' : slot.movementPattern }}
                    </span>
                    <span *ngIf="slot.emphasis" class="badge badge-subtle ms-1">{{ slot.emphasis }}</span>
                    <h6 class="fw-bold text-light mt-1 mb-0" style="font-size: 0.95rem;">{{ slot.label }}</h6>
                  </div>
                  <button class="btn btn-outline-secondary btn-sm text-nowrap rounded-3 py-1 px-2" style="font-size: 0.8rem;" (click)="openSearchModal(slot)">
                    <i class="bi bi-search"></i> Cambiar
                  </button>
                </div>

                <!-- 50/50 Card Body: Half Image (50%), Half Details & Sets/Reps (50%) -->
                <div class="row g-3 align-items-stretch">
                  <!-- Half 1: Image container (~50% on sm/md/lg/xl) -->
                  <div class="col-12 col-sm-5 d-flex">
                    <div class="card-half-media w-100">
                      <img 
                        *ngIf="getExerciseImage(selections[currentDayIndex]?.[slot.id]?.exerciseId)" 
                        [src]="getExerciseImage(selections[currentDayIndex]?.[slot.id]?.exerciseId)" 
                        class="card-half-img" 
                        alt=""
                        loading="lazy"
                      >
                      <div *ngIf="!getExerciseImage(selections[currentDayIndex]?.[slot.id]?.exerciseId)" class="text-center p-3 text-secondary">
                        <i class="bi bi-activity text-success fs-1 d-block mb-1"></i>
                        <span class="small" style="font-size: 0.75rem;">Sin animación</span>
                      </div>
                    </div>
                  </div>

                  <!-- Half 2: Exercise Details & Sets/Reps Inputs (~50%) -->
                  <div class="col-12 col-sm-7 d-flex flex-column justify-content-between">
                    <div>
                      <div class="fw-bold text-light text-truncate mb-1" style="font-size: 0.95rem;">
                        {{ getExerciseName(selections[currentDayIndex]?.[slot.id]?.exerciseId) }}
                      </div>
                      <div class="text-secondary small mb-2" style="font-size: 0.75rem;">
                        <span class="badge badge-subtle text-truncate d-inline-block" style="max-width: 100%;">
                          {{ getExerciseMuscle(selections[currentDayIndex]?.[slot.id]?.exerciseId) }}
                        </span>
                      </div>
                    </div>

                    <!-- Sets & Reps Inputs at Bottom -->
                    <div class="row g-2 mt-auto pt-2">
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
            </div>
          </div>
        </ng-container>

        <!-- ========================================== -->
        <!-- VIEW 2: 100% CUSTOM ROUTINE CREATOR        -->
        <!-- ========================================== -->
        <ng-container *ngIf="generatorMode === 'custom'">
          <!-- Custom Day Navigation Tabs -->
          <ul class="nav nav-tabs mb-4 border-0 gap-2 flex-wrap">
            <li class="nav-item" *ngFor="let day of activeCustomDays; let i = index">
              <button 
                type="button"
                class="day-tab-btn btn btn-sm d-flex align-items-center gap-2 px-3 py-2 rounded-3 border-0" 
                [class.active-day-tab]="currentCustomDayIndex === i"
                (click)="currentCustomDayIndex = i"
              >
                <span class="badge" [ngClass]="currentCustomDayIndex === i ? 'bg-success text-dark fw-bold' : 'bg-dark text-secondary border border-secondary'">
                  Día {{ i + 1 }}
                </span>
                <span class="text-truncate small fw-semibold" style="max-width: 160px;">
                  {{ day.name || ('Día Personalizado ' + (i + 1)) }}
                </span>
                <span class="badge rounded-pill bg-dark text-secondary border border-secondary" style="font-size: 0.65rem;">
                  {{ day.exercises.length }}
                </span>
              </button>
            </li>
          </ul>

          <!-- Current Custom Day Header & Name Editor -->
          <div class="card p-3 p-md-4 rounded-4 border-0 panel-card mb-4">
            <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
              <div class="flex-grow-1" style="max-width: 500px;">
                <label class="form-label text-secondary small fw-medium mb-1">
                  Nombre personalizado del Día {{ currentCustomDayIndex + 1 }}
                </label>
                <div class="input-group">
                  <span class="input-group-text bg-dark border-secondary text-secondary">
                    <i class="bi bi-tag-fill text-success"></i>
                  </span>
                  <input 
                    type="text" 
                    class="form-control rounded-end-3" 
                    [(ngModel)]="activeCustomDays[currentCustomDayIndex].name" 
                    [placeholder]="'Ej: Día Personalizado ' + (currentCustomDayIndex + 1)"
                  >
                </div>
              </div>

              <div>
                <button 
                  type="button" 
                  class="btn btn-success fw-bold d-flex align-items-center gap-2 px-3 py-2 rounded-3 shadow-sm"
                  (click)="openCustomSearchModal()"
                >
                  <i class="bi bi-plus-circle-fill"></i>
                  <span>Agregar Ejercicio a este Día</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Empty State for Day with 0 exercises -->
          <div 
            *ngIf="activeCustomDays[currentCustomDayIndex].exercises.length === 0" 
            class="text-center py-5 px-3 rounded-4 panel-card"
          >
            <i class="bi bi-card-checklist text-secondary fs-1 mb-3 d-block opacity-50"></i>
            <h6 class="fw-bold text-light mb-1">Aún no hay ejercicios en este día</h6>
            <p class="text-secondary small mb-3">Haz clic en "+ Agregar Ejercicio a este Día" para elegir del catálogo con animaciones GIF.</p>
            <button 
              type="button" 
              class="btn btn-outline-success btn-sm px-3 rounded-3"
              (click)="openCustomSearchModal()"
            >
              <i class="bi bi-plus-lg me-1"></i> Seleccionar primer ejercicio
            </button>
          </div>

          <!-- Custom Exercises List with 50/50 Card Layout -->
          <div class="row g-3" *ngIf="activeCustomDays[currentCustomDayIndex].exercises.length > 0">
            <div 
              class="col-12 col-xl-6" 
              *ngFor="let exItem of activeCustomDays[currentCustomDayIndex].exercises; let exIdx = index; trackBy: trackByCustomExerciseUid"
            >
              <div class="card h-100 p-3 rounded-4 border-0 panel-card">
                <!-- 50/50 Card Layout: Half Image (50%), Half Details & Controls (50%) -->
                <div class="row g-3 align-items-stretch">
                  <!-- Half 1: Large Image (approx 50%) -->
                  <div class="col-12 col-sm-5 d-flex">
                    <div class="card-half-media w-100">
                      <span class="exercise-order-badge">#{{ exIdx + 1 }}</span>
                      <img 
                        *ngIf="getExerciseImage(exItem.exerciseId)" 
                        [src]="getExerciseImage(exItem.exerciseId)" 
                        class="card-half-img" 
                        alt=""
                        loading="lazy"
                      >
                      <div *ngIf="!getExerciseImage(exItem.exerciseId)" class="text-center p-3 text-secondary">
                        <i class="bi bi-activity text-success fs-1 d-block mb-1"></i>
                        <span class="small" style="font-size: 0.75rem;">Sin animación</span>
                      </div>
                    </div>
                  </div>

                  <!-- Half 2: Exercise Details & Sets/Reps & Actions (approx 50%) -->
                  <div class="col-12 col-sm-7 d-flex flex-column justify-content-between">
                    <div>
                      <div class="d-flex justify-content-between align-items-start mb-1">
                        <div class="fw-bold text-light text-truncate me-2" style="font-size: 0.95rem;">
                          {{ getExerciseName(exItem.exerciseId) }}
                        </div>

                        <!-- Actions: Reorder & Remove -->
                        <div class="btn-group btn-group-sm flex-shrink-0">
                          <button 
                            class="btn btn-outline-secondary py-1 px-2" 
                            [disabled]="exIdx === 0" 
                            (click)="moveCustomExercise(exIdx, -1)"
                            title="Mover arriba"
                          >
                            <i class="bi bi-arrow-up"></i>
                          </button>
                          <button 
                            class="btn btn-outline-secondary py-1 px-2" 
                            [disabled]="exIdx === activeCustomDays[currentCustomDayIndex].exercises.length - 1" 
                            (click)="moveCustomExercise(exIdx, 1)"
                            title="Mover abajo"
                          >
                            <i class="bi bi-arrow-down"></i>
                          </button>
                          <button 
                            class="btn btn-outline-danger py-1 px-2" 
                            (click)="removeCustomExercise(exIdx)"
                            title="Eliminar ejercicio"
                          >
                            <i class="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>

                      <div class="text-secondary small mb-2" style="font-size: 0.75rem;">
                        <span class="badge badge-subtle me-1">{{ getExercisePattern(exItem.exerciseId) }}</span>
                        <span class="text-truncate d-inline-block align-middle" style="max-width: 140px;">
                          {{ getExerciseMuscle(exItem.exerciseId) }}
                        </span>
                      </div>
                    </div>

                    <!-- Sets & Reps Inputs at Bottom -->
                    <div class="row g-2 mt-auto pt-2">
                      <div class="col-6">
                        <label class="form-label text-secondary small mb-1" style="font-size: 0.75rem;">Series</label>
                        <div class="input-group input-group-sm">
                          <button class="btn btn-outline-secondary" type="button" (click)="adjustCustomSets(exIdx, -1)">-</button>
                          <input 
                            type="number" 
                            class="form-control text-center" 
                            [(ngModel)]="exItem.sets"
                            min="1"
                            max="10"
                          >
                          <button class="btn btn-outline-secondary" type="button" (click)="adjustCustomSets(exIdx, 1)">+</button>
                        </div>
                      </div>

                      <div class="col-6">
                        <label class="form-label text-secondary small mb-1" style="font-size: 0.75rem;">Repeticiones</label>
                        <input 
                          type="text" 
                          class="form-control form-control-sm text-center" 
                          [(ngModel)]="exItem.repsRange" 
                          placeholder="8-12"
                        >
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ng-container>
      </main>
    </div>

    <!-- ========================================== -->
    <!-- MODAL: Exercise Selector (Used by Both)    -->
    <!-- ========================================== -->
    <div *ngIf="searchModalVisible" class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.85); backdrop-filter: blur(4px);">
      <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content border-0 rounded-4 panel-card shadow-2xl">
          <div class="modal-header border-bottom border-dark px-4 py-3">
            <h6 class="modal-title fw-bold text-light mb-0">
              <i class="bi bi-search text-success me-2"></i>
              <span *ngIf="modalContext === 'preset'">Elegir Ejercicio: {{ activeSearchSlot?.label }}</span>
              <span *ngIf="modalContext === 'custom'">Agregar Ejercicio a: {{ activeCustomDays[currentCustomDayIndex]?.name }}</span>
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
                    placeholder="Buscar por nombre en español o inglés..."
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

            <!-- Exercises List with Enhanced GIFs -->
            <div class="list-group list-group-flush gap-1">
              <button 
                type="button" 
                class="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-2 px-3 rounded-3 border-0"
                *ngFor="let ex of cachedFilteredExercises; trackBy: trackByExerciseId"
                [style.background-color]="isSelectedInActiveSlot(ex.id) ? '#18202d' : '#0e1017'"
                (click)="onExerciseSelected(ex.id)"
              >
                <div class="d-flex align-items-center gap-3 overflow-hidden me-2">
                  <div class="modal-thumb-box flex-shrink-0">
                    <img 
                      *ngIf="exercisesService.getImageUrl(ex.img_src || ex.id)" 
                      [src]="exercisesService.getImageUrl(ex.img_src || ex.id)" 
                      class="modal-thumb-img rounded-2" 
                      alt=""
                      loading="lazy"
                    >
                    <i *ngIf="!exercisesService.getImageUrl(ex.img_src || ex.id)" class="bi bi-activity text-secondary fs-4"></i>
                  </div>
                  <div class="text-truncate">
                    <div class="fw-bold text-light small text-truncate">{{ ex.name_es }}</div>
                    <div class="text-secondary small text-truncate" style="font-size: 0.75rem;">
                      {{ ex.name_en }} &bull; <span class="badge badge-subtle">{{ ex.primary_muscle_es.join(', ') }}</span>
                    </div>
                  </div>
                </div>

                <div class="d-flex align-items-center gap-2 flex-shrink-0">
                  <span *ngIf="modalContext === 'preset' && isSelectedInActiveSlot(ex.id)" class="badge bg-success text-dark fw-bold">Actual</span>
                  <span class="btn btn-outline-secondary btn-sm py-1 px-2" style="font-size: 0.75rem;">
                    {{ modalContext === 'custom' ? '+ Agregar' : 'Elegir' }}
                  </span>
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
    .mode-pill-btn {
      background: transparent;
      color: #718096;
      border: 1px solid transparent;
      transition: all 0.2s ease;
      &:hover {
        color: #e2e8f0;
      }
    }
    .active-mode {
      background: rgba(255, 255, 255, 0.08) !important;
      color: #fff !important;
      border: 1px solid rgba(255, 255, 255, 0.12) !important;
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
    .card-half-media {
      width: 100%;
      height: 180px;
      min-height: 180px;
      background: #080a0f;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.07);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      position: relative;
    }
    .card-half-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.25s ease;
      &:hover {
        transform: scale(1.03);
      }
    }
    .exercise-order-badge {
      position: absolute;
      top: 8px;
      left: 8px;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(4px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #00e676;
      font-weight: 800;
      font-size: 0.75rem;
      border-radius: 6px;
      padding: 2px 7px;
      z-index: 2;
    }
    .modal-thumb-box {
      width: 60px;
      height: 60px;
      background: #11141c;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .modal-thumb-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
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
  exercisesService = inject(ExercisesService);

  // Generator Mode: 'preset' = Biomechanical, 'custom' = Free Custom Routine
  generatorMode: 'preset' | 'custom' = 'preset';

  routineName = 'Rutina Personalizada Pro';
  routineCode = '';
  goal = 'hypertrophy';

  // Preset Mode State
  daysCount = 4;
  currentDayIndex = 0;
  dayTypes: SplitDayType[] = [];
  currentSlots: SlotConfig[] = [];
  selections: Record<number, Record<string, SlotSelection>> = {};

  // Custom Mode State (Default: Día Personalizado 1, Día Personalizado 2...)
  customDaysCount = 3;
  currentCustomDayIndex = 0;
  customDays: CustomDayPlan[] = [];

  isSaving = false;
  successMessage = '';
  errorMessage = '';

  // Modal & Search
  searchModalVisible = false;
  modalContext: 'preset' | 'custom' = 'preset';
  activeSearchSlot: SlotConfig | null = null;
  searchQuery = '';
  selectedMuscleFilter = 'all';
  availableMuscles: string[] = [];
  cachedFilteredExercises: Exercise[] = [];

  ngOnInit(): void {
    this.routineCode = this.routineService.generateRandomCode();
    this.availableMuscles = this.exercisesService.getMuscles();
    
    // Initialize Preset Split
    this.computeDayTypes();
    this.initializeDefaultSelections();
    this.updateCurrentSlots();

    // Initialize Custom Days Plans with "Día Personalizado X"
    this.initializeCustomDays();
  }

  setGeneratorMode(mode: 'preset' | 'custom'): void {
    this.generatorMode = mode;
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

  trackByCustomExerciseUid(index: number, item: CustomExerciseItem): string {
    return item.uid;
  }

  // ==========================================
  // CUSTOM MODE LOGIC
  // ==========================================
  private initializeCustomDays(): void {
    this.customDays = [];
    for (let i = 0; i < 7; i++) {
      this.customDays.push({
        name: `Día Personalizado ${i + 1}`,
        exercises: []
      });
    }
  }

  get activeCustomDays(): CustomDayPlan[] {
    return this.customDays.slice(0, this.customDaysCount);
  }

  onCustomDaysCountChange(): void {
    if (this.currentCustomDayIndex >= this.customDaysCount) {
      this.currentCustomDayIndex = 0;
    }
    while (this.customDays.length < this.customDaysCount) {
      this.customDays.push({
        name: `Día Personalizado ${this.customDays.length + 1}`,
        exercises: []
      });
    }
  }

  adjustCustomSets(exIdx: number, delta: number): void {
    const exItem = this.activeCustomDays[this.currentCustomDayIndex]?.exercises[exIdx];
    if (exItem) {
      exItem.sets = Math.max(1, Math.min(10, (exItem.sets || 3) + delta));
    }
  }

  moveCustomExercise(exIdx: number, direction: number): void {
    const list = this.activeCustomDays[this.currentCustomDayIndex]?.exercises;
    if (!list) return;
    const targetIdx = exIdx + direction;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const temp = list[exIdx];
    list[exIdx] = list[targetIdx];
    list[targetIdx] = temp;
  }

  removeCustomExercise(exIdx: number): void {
    const list = this.activeCustomDays[this.currentCustomDayIndex]?.exercises;
    if (list) {
      list.splice(exIdx, 1);
    }
  }

  openCustomSearchModal(): void {
    this.modalContext = 'custom';
    this.activeSearchSlot = null;
    this.searchQuery = '';
    this.selectedMuscleFilter = 'all';
    this.onFilterChanged();
    this.searchModalVisible = true;
  }

  // ==========================================
  // PRESET SPLIT LOGIC
  // ==========================================
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

  getExercisePattern(id?: string): string {
    if (!id) return '';
    const ex = this.exercisesService.getById(id);
    return ex?.movement_pattern || '';
  }

  getExerciseImage(id?: string): string {
    if (!id) return '';
    return this.exercisesService.getImageUrl(id);
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
    this.modalContext = 'preset';
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
    const pattern = this.modalContext === 'preset' ? this.activeSearchSlot?.movementPattern : undefined;
    this.cachedFilteredExercises = this.exercisesService.search(
      this.searchQuery, 
      this.selectedMuscleFilter, 
      pattern
    );
  }

  isSelectedInActiveSlot(id: string): boolean {
    if (!this.activeSearchSlot) return false;
    return this.selections[this.currentDayIndex]?.[this.activeSearchSlot.id]?.exerciseId === id;
  }

  onExerciseSelected(id: string): void {
    if (this.modalContext === 'preset') {
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
    } else {
      // Custom mode: append exercise to active custom day
      const targetDay = this.activeCustomDays[this.currentCustomDayIndex];
      if (targetDay) {
        targetDay.exercises.push({
          uid: 'ex_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          exerciseId: id,
          sets: 3,
          repsRange: '8-12',
          isFinisher: false
        });
      }
      this.closeSearchModal();
    }
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
      let daysData: any[] = [];
      const effectiveDaysCount = this.generatorMode === 'custom' ? this.customDaysCount : this.daysCount;

      if (this.generatorMode === 'custom') {
        const activeDays = this.activeCustomDays;
        const totalExercises = activeDays.reduce((acc, d) => acc + d.exercises.length, 0);
        if (totalExercises === 0) {
          throw new Error('Debes agregar al menos un ejercicio en alguno de los días de la rutina.');
        }

        daysData = activeDays.map((d, i) => {
          const exIds = d.exercises.map(e => e.exerciseId);
          const muscles = this.exercisesService.getMusclesForExercises(exIds);
          const dayName = d.name.trim() || `Día Personalizado ${i + 1}`;

          return {
            dayIndex: i, // 0-indexed for full mobile app compatibility
            name: dayName,
            dayType: dayName,
            muscles,
            exercises: d.exercises.map(e => {
              const exInfo = this.exercisesService.getById(e.exerciseId);
              return {
                id: e.exerciseId,
                exerciseId: e.exerciseId,
                name_es: exInfo?.name_es || e.exerciseId,
                name_en: exInfo?.name_en || e.exerciseId,
                sets: e.sets || 3,
                reps: e.repsRange || '8-12',
                repsRange: e.repsRange || '8-12',
                movementPattern: exInfo?.movement_pattern || 'custom',
                isFinisher: e.isFinisher || false,
                primary_es: exInfo?.primary_muscle_es || [],
                primary_en: exInfo?.primary_muscle_en ? (Array.isArray(exInfo.primary_muscle_en) ? exInfo.primary_muscle_en : [exInfo.primary_muscle_en]) : [],
                secondary_es: exInfo?.secondary_muscles_es || [],
                secondary_en: exInfo?.secondary_muscles_en || [],
                isCompound: exInfo?.is_compound ?? false,
                isIsolation: exInfo?.is_isolation ?? true,
                equipment_es: exInfo?.equipment_es || [],
                equipment_en: exInfo?.equipment_en || []
              };
            })
          };
        });
      } else {
        // Preset Biomechanical Split
        for (let d = 0; d < this.daysCount; d++) {
          const dayType = this.dayTypes[d] || 'torso';
          const slots = this.getBaseSlotsForDay(d, dayType, this.daysCount);
          const dayExercises: any[] = [];
          const exIds: string[] = [];

          for (const slot of slots) {
            const sel = this.selections[d]?.[slot.id];
            if (sel && sel.exerciseId) {
              exIds.push(sel.exerciseId);
              const exInfo = this.exercisesService.getById(sel.exerciseId);
              dayExercises.push({
                id: sel.exerciseId,
                exerciseId: sel.exerciseId,
                name_es: exInfo?.name_es || sel.exerciseId,
                name_en: exInfo?.name_en || sel.exerciseId,
                sets: sel.sets,
                reps: sel.repsRange,
                repsRange: sel.repsRange,
                movementPattern: slot.movementPattern,
                isFinisher: slot.isFinisher || false,
                primary_es: exInfo?.primary_muscle_es || [],
                primary_en: exInfo?.primary_muscle_en ? (Array.isArray(exInfo.primary_muscle_en) ? exInfo.primary_muscle_en : [exInfo.primary_muscle_en]) : [],
                secondary_es: exInfo?.secondary_muscles_es || [],
                secondary_en: exInfo?.secondary_muscles_en || [],
                isCompound: exInfo?.is_compound ?? false,
                isIsolation: exInfo?.is_isolation ?? true,
                equipment_es: exInfo?.equipment_es || [],
                equipment_en: exInfo?.equipment_en || []
              });
            }
          }

          const muscles = this.exercisesService.getMusclesForExercises(exIds);
          const capitalizedType = dayType.charAt(0).toUpperCase() + dayType.slice(1);

          daysData.push({
            dayIndex: d, // 0-indexed for full mobile app compatibility
            name: `Día ${d + 1}: ${capitalizedType}`,
            dayType: capitalizedType,
            muscles,
            exercises: dayExercises
          });
        }
      }

      const routinePayload = {
        name: this.routineName,
        goal: this.goal,
        splitMode: this.generatorMode,
        daysCount: effectiveDaysCount,
        config: {
          days: effectiveDaysCount,
          goal: this.goal,
          level: 'intermediate'
        },
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
