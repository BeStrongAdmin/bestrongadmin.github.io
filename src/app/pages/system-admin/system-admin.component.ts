import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { AuthService } from '../../services/auth.service';
import { SystemAdminService, AppSettings, CleanupResult, PrepareResult, ResetResult, SystemOverviewStats } from '../../services/system-admin.service';

@Component({
  selector: 'app-system-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SidebarComponent],
  template: `
    <div class="d-flex flex-column flex-lg-row min-vh-100" style="background-color: #07080b;">
      <app-sidebar></app-sidebar>

      <main class="flex-grow-1 px-3 px-md-5 py-4 overflow-x-hidden">
        <!-- Top Action Bar -->
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <div>
            <div class="d-flex align-items-center gap-2 mb-1">
              <h1 class="h4 fw-bold mb-0 text-light tracking-tight">Panel Administrador del Sistema</h1>
              <span class="badge bg-warning bg-opacity-25 text-warning border border-warning border-opacity-50 text-uppercase fw-bold" style="font-size: 0.7rem;">
                <i class="bi bi-shield-lock-fill me-1"></i> Superadmin
              </span>
            </div>
            <p class="text-secondary small mb-0">
              Mantenimiento global de Firestore, sincronización social y controles remotos de la app móvil.
            </p>
          </div>
          <div class="d-flex gap-2">
            <button 
              type="button" 
              class="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2 rounded-3" 
              (click)="loadAllData()"
              [disabled]="loadingStats()"
            >
              <i class="bi bi-arrow-clockwise" [class.spin]="loadingStats()"></i>
              <span>Refrescar</span>
            </button>
            <a routerLink="/admin-management" class="btn btn-outline-light btn-sm d-flex align-items-center gap-2 rounded-3">
              <i class="bi bi-people"></i>
              <span>Gestión de Coaches</span>
            </a>
          </div>
        </div>

        <!-- Alert Notification -->
        <div *ngIf="actionMsg()" class="alert alert-dismissible fade show border-0 py-2 px-3 mb-4 rounded-3 d-flex align-items-center justify-content-between small"
             [ngClass]="actionMsgType() === 'error' ? 'alert-danger bg-danger bg-opacity-10 text-danger' : (actionMsgType() === 'warning' ? 'alert-warning bg-warning bg-opacity-10 text-warning' : 'alert-success bg-success bg-opacity-10 text-success')">
          <div class="d-flex align-items-center gap-2">
            <i class="bi fs-5" [ngClass]="actionMsgType() === 'error' ? 'bi-exclamation-octagon-fill' : 'bi-check-circle-fill'"></i>
            <span>{{ actionMsg() }}</span>
          </div>
          <button type="button" class="btn-close btn-close-white" (click)="actionMsg.set('')"></button>
        </div>

        <!-- Section 1: Overview System Stats -->
        <div class="row g-3 mb-4">
          <div class="col-6 col-md-3">
            <div class="card p-3 rounded-4 border-0 panel-card h-100">
              <div class="text-secondary small fw-medium mb-1">Usuarios en Firestore</div>
              <div class="h3 fw-bold text-light mb-0">{{ overviewStats()?.totalUsers ?? '...' }}</div>
              <div class="text-secondary small mt-1" style="font-size: 0.72rem;">Colección <code>/users</code></div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="card p-3 rounded-4 border-0 panel-card h-100">
              <div class="text-secondary small fw-medium mb-1">Usernames Indexados</div>
              <div class="h3 fw-bold text-light mb-0">{{ overviewStats()?.totalUsernames ?? '...' }}</div>
              <div class="text-secondary small mt-1" style="font-size: 0.72rem;">Colección <code>/usernames</code></div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="card p-3 rounded-4 border-0 panel-card h-100">
              <div class="text-secondary small fw-medium mb-1">Rutinas Comunitarias</div>
              <div class="h3 fw-bold text-light mb-0">{{ overviewStats()?.totalCommunityPosts ?? '...' }}</div>
              <div class="text-secondary small mt-1" style="font-size: 0.72rem;">Feed social público</div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="card p-3 rounded-4 border-0 panel-card h-100">
              <div class="text-secondary small fw-medium mb-1">Logros Compartidos</div>
              <div class="h3 fw-bold text-light mb-0">{{ overviewStats()?.totalAchievementPosts ?? '...' }}</div>
              <div class="text-secondary small mt-1" style="font-size: 0.72rem;">Publicaciones en liga</div>
            </div>
          </div>
        </div>

        <!-- Section 2: Remote App Settings -->
        <div class="card p-4 rounded-4 border-0 panel-card mb-4">
          <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div class="d-flex align-items-center gap-3">
              <div class="rounded-circle p-3 d-flex align-items-center justify-content-center"
                   [ngClass]="appSettings()?.profileUploadsEnabled ? 'bg-success bg-opacity-25 text-success' : 'bg-danger bg-opacity-25 text-danger'"
                   style="width: 52px; height: 52px;">
                <i class="bi fs-4" [ngClass]="appSettings()?.profileUploadsEnabled ? 'bi-image-fill' : 'bi-image-alt'"></i>
              </div>
              <div>
                <div class="d-flex align-items-center gap-2">
                  <h5 class="fw-bold text-light mb-0">Subida de Fotos de Perfil (Firebase Storage)</h5>
                  <span class="badge" [ngClass]="appSettings()?.profileUploadsEnabled ? 'bg-success text-dark' : 'bg-danger text-light'">
                    {{ appSettings()?.profileUploadsEnabled ? 'ACTIVO' : 'BLOQUEADO' }}
                  </span>
                </div>
                <div class="text-secondary small mt-1">
                  {{ appSettings()?.profileUploadsEnabled 
                    ? 'Los usuarios de la app móvil pueden tocar su foto de perfil para seleccionar y subir una nueva imagen.' 
                    : 'La subida de fotos está desactivada remotamente. Las fotos existentes siguen visibles, pero nadie puede subir nuevas imágenes.' }}
                </div>
              </div>
            </div>

            <button 
              type="button" 
              class="btn btn-sm px-3 py-2 rounded-3 fw-bold flex-shrink-0 d-inline-flex align-items-center gap-2"
              [ngClass]="appSettings()?.profileUploadsEnabled ? 'btn-outline-danger' : 'btn-success text-dark'"
              (click)="toggleProfileUploads()"
              [disabled]="togglingUploads()"
            >
              <span *ngIf="togglingUploads()" class="spinner-border spinner-border-sm"></span>
              <i *ngIf="!togglingUploads()" class="bi" [ngClass]="appSettings()?.profileUploadsEnabled ? 'bi-slash-circle' : 'bi-check-circle'"></i>
              <span>{{ appSettings()?.profileUploadsEnabled ? 'Desactivar Subidas' : 'Activar Subidas' }}</span>
            </button>
          </div>
        </div>

        <!-- Section 3: Maintenance Tools -->
        <h5 class="text-light fw-bold mb-3">Herramientas de Mantenimiento y Estructura</h5>
        <div class="row g-4 mb-4">
          <!-- Cleanup Card -->
          <div class="col-12 col-xl-6">
            <div class="card p-4 rounded-4 border-0 panel-card h-100 d-flex flex-column justify-content-between">
              <div>
                <div class="d-flex align-items-center gap-2 text-info mb-2">
                  <i class="bi bi-brush fs-5"></i>
                  <h6 class="fw-bold mb-0 text-light">Limpiar Datos Huérfanos</h6>
                </div>
                <p class="text-secondary small mb-3">
                  Escanea la base de datos completa. Elimina usernames, likes, comentarios, follows y publicaciones que pertenezcan a cuentas borradas o huérfanas. Repara perfiles sin nombre asignando el correo.
                </p>

                <div *ngIf="lastCleanupResult()" class="p-3 rounded-3 mb-3 border border-secondary border-opacity-25" style="background: rgba(255, 255, 255, 0.02);">
                  <div class="text-success small fw-bold mb-2">
                    <i class="bi bi-check2-all me-1"></i> Resultado de la última limpieza:
                  </div>
                  <div class="row g-2 text-secondary small">
                    <div class="col-6">&bull; Documentos eliminados: <strong class="text-light">{{ lastCleanupResult()?.deleted }}</strong></div>
                    <div class="col-6">&bull; Documentos reparados: <strong class="text-light">{{ lastCleanupResult()?.repaired }}</strong></div>
                    <div class="col-12">&bull; Perfiles de usuario reparados: <strong class="text-light">{{ lastCleanupResult()?.profilesRepaired }}</strong></div>
                  </div>
                </div>
              </div>

              <button 
                type="button" 
                class="btn btn-outline-info btn-sm rounded-3 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2"
                (click)="runCleanup()"
                [disabled]="busyAction() !== null"
              >
                <span *ngIf="busyAction() === 'cleanup'" class="spinner-border spinner-border-sm"></span>
                <i *ngIf="busyAction() !== 'cleanup'" class="bi bi-play-circle-fill"></i>
                <span>{{ busyAction() === 'cleanup' ? 'Limpiando base de datos...' : 'Ejecutar Limpieza de Huérfanos' }}</span>
              </button>
            </div>
          </div>

          <!-- Prepare Structure Card -->
          <div class="col-12 col-xl-6">
            <div class="card p-4 rounded-4 border-0 panel-card h-100 d-flex flex-column justify-content-between">
              <div>
                <div class="d-flex align-items-center gap-2 text-success mb-2">
                  <i class="bi bi-database-check fs-5"></i>
                  <h6 class="fw-bold mb-0 text-light">Preparar Estructura Firestore</h6>
                </div>
                <p class="text-secondary small mb-3">
                  Verifica y crea campos requeridos por BeStrong. Indexa usernames en la colección <code>/usernames</code>, normaliza XP y ligas, y sincroniza nombres y fotos actualizadas en las publicaciones sociales.
                </p>

                <div *ngIf="lastPrepareResult()" class="p-3 rounded-3 mb-3 border border-secondary border-opacity-25" style="background: rgba(255, 255, 255, 0.02);">
                  <div class="text-success small fw-bold mb-2">
                    <i class="bi bi-check2-all me-1"></i> Resultado de la última preparación:
                  </div>
                  <div class="row g-2 text-secondary small">
                    <div class="col-6">&bull; Usuarios normalizados: <strong class="text-light">{{ lastPrepareResult()?.repairedUsers }}</strong></div>
                    <div class="col-6">&bull; Usernames indexados: <strong class="text-light">{{ lastPrepareResult()?.usernamesPrepared }}</strong></div>
                    <div class="col-12">&bull; Publicaciones sincronizadas: <strong class="text-light">{{ lastPrepareResult()?.postsSynced }}</strong></div>
                  </div>
                </div>
              </div>

              <button 
                type="button" 
                class="btn btn-outline-success btn-sm rounded-3 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2"
                (click)="runPrepare()"
                [disabled]="busyAction() !== null"
              >
                <span *ngIf="busyAction() === 'prepare'" class="spinner-border spinner-border-sm"></span>
                <i *ngIf="busyAction() !== 'prepare'" class="bi bi-gear-fill"></i>
                <span>{{ busyAction() === 'prepare' ? 'Preparando estructura...' : 'Preparar y Sincronizar Estructura' }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Section 4: Danger Zone -->
        <h5 class="text-danger fw-bold mb-3 d-flex align-items-center gap-2">
          <i class="bi bi-exclamation-triangle-fill"></i>
          <span>Zona de Peligro</span>
        </h5>
        <div class="card p-4 rounded-4 border border-danger border-opacity-25 mb-4" style="background: rgba(220, 53, 69, 0.04);">
          <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <h6 class="fw-bold text-danger mb-1">Resetear Ligas, XP y Logros de Temporada</h6>
              <p class="text-secondary small mb-0" style="max-width: 680px;">
                Esta acción elimina todo el progreso de gamificación (XP, ranking, medallas y posts de logros en la comunidad) de <strong>todos los usuarios</strong>. Úsalo únicamente para reinicios de temporada o pruebas de desarrollo.
              </p>
            </div>
            <button 
              type="button" 
              class="btn btn-outline-danger btn-sm px-3 py-2 rounded-3 fw-bold flex-shrink-0 d-inline-flex align-items-center gap-2"
              (click)="openResetModal()"
              [disabled]="busyAction() !== null"
            >
              <i class="bi bi-trash3-fill"></i>
              <span>Reset Ligas y XP</span>
            </button>
          </div>
        </div>
      </main>
    </div>

    <!-- RESET CONFIRMATION MODAL -->
    <div *ngIf="showResetModal()" class="modal-backdrop-custom d-flex align-items-center justify-content-center p-3">
      <div class="card p-4 border border-danger border-opacity-50 shadow-2xl position-relative text-light" style="max-width: 480px; width: 100%; background-color: #0d0f15; border-radius: 1.25rem;">
        <button type="button" class="btn-close btn-close-white position-absolute top-0 end-0 m-3" (click)="closeResetModal()"></button>

        <div class="text-center mb-3">
          <div class="d-inline-flex align-items-center justify-content-center rounded-circle bg-danger bg-opacity-25 border border-danger p-3 mb-2 text-danger">
            <i class="bi bi-exclamation-triangle-fill fs-2"></i>
          </div>
          <h4 class="fw-bold mb-1 text-danger">Confirmación de Reset</h4>
          <p class="text-secondary small mb-0">
            Esta acción es irreversible y afectará a todos los atletas registrados en BeStrong.
          </p>
        </div>

        <div class="p-3 rounded-3 mb-3 border border-secondary border-opacity-25" style="background: rgba(255, 255, 255, 0.02);">
          <ul class="text-secondary small mb-0 ps-3">
            <li>Se restablecerá el XP a 0 y liga Bronce en todos los perfiles.</li>
            <li>Se eliminarán todas las publicaciones de la colección <code>achievements_posts</code>.</li>
            <li>Se eliminarán los comentarios y likes asociados.</li>
          </ul>
        </div>

        <div class="mb-3">
          <label class="form-label text-secondary small fw-medium">
            Para confirmar, escribe la palabra <strong class="text-danger">RESET</strong>:
          </label>
          <input 
            type="text" 
            class="form-control font-monospace text-center fw-bold" 
            placeholder="RESET"
            [(ngModel)]="resetConfirmationWord"
          />
        </div>

        <div class="d-flex gap-2">
          <button type="button" class="btn btn-secondary btn-sm w-50 py-2 rounded-3" (click)="closeResetModal()">
            Cancelar
          </button>
          <button 
            type="button" 
            class="btn btn-danger btn-sm w-50 py-2 rounded-3 fw-bold d-flex align-items-center justify-content-center gap-2"
            [disabled]="resetConfirmationWord.trim() !== 'RESET' || busyAction() === 'reset'"
            (click)="executeReset()"
          >
            <span *ngIf="busyAction() === 'reset'" class="spinner-border spinner-border-sm"></span>
            <span>Confirmar Reset</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .panel-card {
      background-color: #0e1017;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    .modal-backdrop-custom {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(6px);
      z-index: 1050;
    }
    .spin {
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      100% { transform: rotate(360deg); }
    }
  `]
})
export class SystemAdminComponent implements OnInit {
  private systemService = inject(SystemAdminService);
  private cdr = inject(ChangeDetectorRef);

  overviewStats = signal<SystemOverviewStats | null>(null);
  appSettings = signal<AppSettings | null>(null);
  loadingStats = signal<boolean>(false);
  togglingUploads = signal<boolean>(false);

  busyAction = signal<'cleanup' | 'prepare' | 'reset' | null>(null);
  actionMsg = signal<string>('');
  actionMsgType = signal<'success' | 'error' | 'warning'>('success');

  lastCleanupResult = signal<CleanupResult | null>(null);
  lastPrepareResult = signal<PrepareResult | null>(null);

  showResetModal = signal<boolean>(false);
  resetConfirmationWord = '';

  async ngOnInit(): Promise<void> {
    await this.loadAllData();
  }

  async loadAllData(): Promise<void> {
    this.loadingStats.set(true);
    try {
      const [stats, settings] = await Promise.all([
        this.systemService.getSystemOverviewStats(),
        this.systemService.getAppSettings()
      ]);
      this.overviewStats.set(stats);
      this.appSettings.set(settings);
    } catch (err: any) {
      console.warn('Error cargando datos del sistema:', err);
    } finally {
      this.loadingStats.set(false);
      this.cdr.markForCheck();
    }
  }

  async toggleProfileUploads(): Promise<void> {
    const current = this.appSettings()?.profileUploadsEnabled ?? true;
    const next = !current;
    this.togglingUploads.set(true);
    try {
      await this.systemService.setProfileUploadsEnabled(next);
      this.appSettings.update(s => s ? { ...s, profileUploadsEnabled: next } : { profileUploadsEnabled: next });
      this.actionMsgType.set('success');
      this.actionMsg.set(next 
        ? 'Subida de fotos de perfil ACTIVADA en la app móvil.' 
        : 'Subida de fotos de perfil BLOQUEADA remotamente.');
    } catch (err: any) {
      this.actionMsgType.set('error');
      this.actionMsg.set(err.message || 'Error al cambiar configuración de fotos.');
    } finally {
      this.togglingUploads.set(false);
      this.cdr.markForCheck();
    }
  }

  async runCleanup(): Promise<void> {
    if (!confirm('¿Deseas iniciar la limpieza de datos huérfanos? Esta operación revisa publicaciones, comentarios y seguidores.')) {
      return;
    }
    this.busyAction.set('cleanup');
    this.actionMsg.set('');
    try {
      const res = await this.systemService.cleanupOrphanedSocialData();
      this.lastCleanupResult.set(res);
      this.actionMsgType.set('success');
      this.actionMsg.set(`Limpieza finalizada: ${res.deleted} elementos huérfanos eliminados, ${res.repaired} documentos reparados.`);
      await this.loadAllData();
    } catch (err: any) {
      this.actionMsgType.set('error');
      this.actionMsg.set(err.message || 'Error ejecutando limpieza.');
    } finally {
      this.busyAction.set(null);
      this.cdr.markForCheck();
    }
  }

  async runPrepare(): Promise<void> {
    this.busyAction.set('prepare');
    this.actionMsg.set('');
    try {
      const res = await this.systemService.prepareFirestoreStructure();
      this.lastPrepareResult.set(res);
      this.actionMsgType.set('success');
      this.actionMsg.set(`Estructura preparada exitosamente: ${res.repairedUsers} usuarios normalizados, ${res.usernamesPrepared} usernames indexados.`);
      await this.loadAllData();
    } catch (err: any) {
      this.actionMsgType.set('error');
      this.actionMsg.set(err.message || 'Error preparando estructura.');
    } finally {
      this.busyAction.set(null);
      this.cdr.markForCheck();
    }
  }

  openResetModal(): void {
    this.resetConfirmationWord = '';
    this.showResetModal.set(true);
  }

  closeResetModal(): void {
    this.showResetModal.set(false);
    this.resetConfirmationWord = '';
  }

  async executeReset(): Promise<void> {
    if (this.resetConfirmationWord.trim() !== 'RESET') return;
    this.busyAction.set('reset');
    try {
      const res = await this.systemService.resetGamificationData();
      this.closeResetModal();
      this.actionMsgType.set('warning');
      this.actionMsg.set(`Reset completado: ${res.usersReset} usuarios restablecidos a nivel 1 y ${res.deletedPosts} publicaciones de logros eliminadas.`);
      await this.loadAllData();
    } catch (err: any) {
      this.actionMsgType.set('error');
      this.actionMsg.set(err.message || 'Error ejecutando reset de gamificación.');
    } finally {
      this.busyAction.set(null);
      this.cdr.markForCheck();
    }
  }
}
