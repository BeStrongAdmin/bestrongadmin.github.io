import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="landing-container min-vh-100 d-flex flex-column">
      <!-- Top Navigation Bar -->
      <header class="landing-header border-bottom border-dark px-3 px-md-5 py-2 py-md-3 d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center gap-2">
          <img src="logo.jpg" alt="BeStrong App Logo" class="brand-logo rounded-2 shadow" style="width: 36px; height: 36px; object-fit: cover;">
          <span class="fs-5 fw-black text-light tracking-tight">BeStrong</span>
        </div>

        <div class="d-flex align-items-center gap-2 gap-md-3">
          <a 
            routerLink="/coaches" 
            class="btn btn-sm px-2 px-md-3 py-1 py-md-2 fw-semibold d-inline-flex align-items-center gap-1 border-0 text-success"
            style="border-radius: 10px; font-size: 0.82rem; background: rgba(0, 230, 118, 0.08);"
          >
            <i class="bi bi-person-badge-fill"></i>
            <span>Para Entrenadores</span>
          </a>

          <!-- Si ya está en sesión: ir a admin-management (Superadmin) o dashboard (Coach) -->
          <a 
            *ngIf="auth.currentUser()" 
            [routerLink]="auth.currentUser()?.isSuperAdmin ? '/admin-management' : '/dashboard'" 
            class="btn btn-success btn-sm px-3 py-1 py-md-2 fw-bold d-flex align-items-center gap-2 text-dark shadow-sm"
            style="border-radius: 10px; font-size: 0.82rem; background-color: #00e676; border-color: #00e676;"
          >
            <i class="bi bi-shield-check"></i>
            <span class="d-none d-sm-inline">{{ auth.currentUser()?.isSuperAdmin ? 'Administración' : 'Ir al Panel' }}</span>
            <span class="d-inline d-sm-none">Panel</span>
          </a>

          <!-- Si no tiene sesión: Acceso Panel a login -->
          <a 
            *ngIf="!auth.currentUser()" 
            routerLink="/login" 
            class="btn btn-outline-light btn-sm px-3 py-1 py-md-2 fw-semibold d-flex align-items-center gap-2 border-secondary"
            style="border-radius: 10px; background: rgba(255, 255, 255, 0.05); font-size: 0.82rem;"
          >
            <i class="bi bi-person-fill-lock text-success"></i>
            <span class="d-none d-sm-inline">Acceso Panel</span>
            <span class="d-inline d-sm-none">Entrar</span>
          </a>
        </div>
      </header>

      <!-- Main Hero Content -->
      <main class="page-content flex-grow-1 px-3 px-md-5 py-3 py-lg-4 d-flex align-items-center">
        <div class="container-fluid px-0">
          <div class="row align-items-center g-4 g-lg-5">
            <!-- Left Column: Hero & CTA -->
            <div class="col-12 col-lg-7">
              <h1 class="hero-title fw-black text-light lh-1 mb-2">
                Entrena con Ciencia. <br>
                <span class="text-gradient">Sube de Liga.</span>
              </h1>

              <p class="hero-subtitle text-secondary mb-3">
                Rutinas biomecánicas inteligentes, XP por serie, rankings semanales de liga y medallas animales para maximizar tu progreso.
              </p>

              <!-- CTA Row: Google Play download button IMMEDIATELY VISIBLE -->
              <div class="cta-box d-flex flex-column flex-sm-row align-items-sm-center gap-3 mb-3">
                <a 
                  href="https://play.google.com/store/apps/details?id=com.BeStrong&pcampaignid=web_share" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  class="download-btn btn d-inline-flex align-items-center justify-content-center gap-3 px-4 py-2 py-sm-3 rounded-4 fw-bold shadow-lg"
                >
                  <i class="bi bi-google-play fs-4"></i>
                  <div class="text-start">
                    <div class="small text-uppercase fw-semibold" style="font-size: 0.62rem; letter-spacing: 0.8px;">Descarga Gratis en</div>
                    <div class="fs-6 fw-black">Google Play Store</div>
                  </div>
                </a>
                <div class="store-badge-text text-secondary small">
                  <span class="text-light fw-semibold"><i class="bi bi-shield-check text-success me-1"></i> 100% Gratuito</span>
                  <div style="font-size: 0.78rem;">Comunidad, rachas y sobrecarga progresiva</div>
                </div>
              </div>

              <!-- Feature Chips Grid -->
              <div class="row g-2" style="max-width: 580px;">
                <div class="col-6 col-sm-3">
                  <div class="chip p-2 rounded-3 text-center text-sm-start">
                    <div class="fw-bold fs-6 text-light mb-0">⚡ AI</div>
                    <div class="text-secondary" style="font-size: 0.72rem;">Rutinas Biomecánicas</div>
                  </div>
                </div>
                <div class="col-6 col-sm-3">
                  <div class="chip p-2 rounded-3 text-center text-sm-start">
                    <div class="fw-bold fs-6 text-warning mb-0">🏆 XP</div>
                    <div class="text-secondary" style="font-size: 0.72rem;">Niveles & Racha</div>
                  </div>
                </div>
                <div class="col-6 col-sm-3">
                  <div class="chip p-2 rounded-3 text-center text-sm-start">
                    <div class="fw-bold fs-6 text-info mb-0">🥇 #1</div>
                    <div class="text-secondary" style="font-size: 0.72rem;">Ranking de Ligas</div>
                  </div>
                </div>
                <div class="col-6 col-sm-3">
                  <div class="chip p-2 rounded-3 text-center text-sm-start">
                    <div class="fw-bold fs-6 text-danger mb-0">🦁 Beast</div>
                    <div class="text-secondary" style="font-size: 0.72rem;">Rangos Animales</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Column: Interactive Phone Preview -->
            <div class="col-12 col-lg-5 text-center position-relative d-flex justify-content-center">
              <div class="phone-wrapper position-relative">
                <!-- Floating Tags (hidden on tiny screens) -->
                <div class="floating-orbit tag-1 shadow d-none d-sm-block">
                  <i class="bi bi-award-fill text-warning me-1"></i> Medallas
                </div>
                <div class="floating-orbit tag-2 shadow d-none d-sm-block">
                  <i class="bi bi-people-fill text-info me-1"></i> Comunidad
                </div>
                <div class="floating-orbit tag-3 shadow d-none d-sm-block">
                  <i class="bi bi-activity text-success me-1"></i> Rutinas Pro
                </div>

                <!-- Phone Frame -->
                <div class="phone-frame p-2 p-sm-3 rounded-5 shadow-2xl">
                  <div class="phone-screen rounded-4 p-3 text-start">
                    <!-- Top Status -->
                    <div class="d-flex justify-content-between align-items-center mb-2">
                      <span class="badge bg-success bg-opacity-25 text-success border border-success px-2 py-1" style="font-size: 0.75rem;">
                        Liga Diamante
                      </span>
                      <span class="fw-bold text-warning small" style="font-size: 0.8rem;">
                        <i class="bi bi-lightning-fill"></i> 4,850 XP
                      </span>
                    </div>

                    <!-- Rank Card -->
                    <div class="rank-box p-3 rounded-4 mb-2">
                      <div class="small text-secondary text-uppercase fw-semibold" style="font-size: 0.65rem;">Rango Animal</div>
                      <h5 class="fw-black text-light mb-1">Tigre Alpha</h5>
                      <div class="xp-bar rounded-pill overflow-hidden">
                        <div class="xp-fill"></div>
                      </div>
                    </div>

                    <!-- Mini Stats -->
                    <div class="row g-2 mb-2">
                      <div class="col-6">
                        <div class="mini-stat p-2 rounded-3 text-center">
                          <strong class="fs-6 text-light d-block">#1</strong>
                          <span class="text-secondary" style="font-size: 0.7rem;">Posición Liga</span>
                        </div>
                      </div>
                      <div class="col-6">
                        <div class="mini-stat p-2 rounded-3 text-center">
                          <strong class="fs-6 text-success d-block">7d</strong>
                          <span class="text-secondary" style="font-size: 0.7rem;">Racha Fuego</span>
                        </div>
                      </div>
                    </div>

                    <!-- Live League Peek -->
                    <div class="league-peek">
                      <div class="league-row d-flex align-items-center justify-content-between p-2 rounded-3 mb-1">
                        <div class="d-flex align-items-center gap-2">
                          <span class="badge bg-warning text-dark fw-bold" style="font-size: 0.7rem;">1</span>
                          <span class="small fw-bold text-light" style="font-size: 0.78rem;">@alex.fit</span>
                        </div>
                        <span class="small text-success fw-bold" style="font-size: 0.75rem;">620 XP</span>
                      </div>
                      <div class="league-row d-flex align-items-center justify-content-between p-2 rounded-3">
                        <div class="d-flex align-items-center gap-2">
                          <span class="badge bg-secondary text-light fw-bold" style="font-size: 0.7rem;">2</span>
                          <span class="small fw-bold text-light" style="font-size: 0.78rem;">@sofia_lift</span>
                        </div>
                        <span class="small text-success fw-bold" style="font-size: 0.75rem;">480 XP</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- Footer -->
      <footer class="landing-footer border-top border-dark px-3 px-md-5 py-2 d-flex flex-column flex-md-row justify-content-between align-items-center gap-2 text-secondary small" style="font-size: 0.75rem;">
        <div>&copy; 2026 BeStrong App. Todos los derechos reservados.</div>
        <div class="d-flex gap-3">
          <a routerLink="/login" class="text-secondary text-decoration-none hover-light">Panel de Entrenadores</a>
          <a href="https://play.google.com/store/apps/details?id=com.BeStrong&pcampaignid=web_share" target="_blank" class="text-secondary text-decoration-none hover-light">Google Play</a>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .landing-container {
      background:
        radial-gradient(circle at 18% 16%, rgba(0, 230, 118, 0.12), transparent 28%),
        radial-gradient(circle at 78% 18%, rgba(139, 92, 246, 0.15), transparent 30%),
        radial-gradient(circle at 72% 86%, rgba(232, 121, 249, 0.10), transparent 28%),
        linear-gradient(135deg, #050608 0%, #0a0d14 50%, #030406 100%);
      color: #f7fafc;
      overflow-x: hidden;
    }

    .landing-header {
      background: rgba(8, 10, 15, 0.75);
      backdrop-filter: blur(12px);
    }

    .fw-black {
      font-weight: 900;
    }

    .hero-title {
      font-size: clamp(28px, 5.5vw, 54px);
      letter-spacing: -0.5px;
    }

    .hero-subtitle {
      font-size: clamp(13px, 2vw, 16px);
      max-width: 580px;
      line-height: 1.5;
    }

    .text-gradient {
      background: linear-gradient(135deg, #00e676 0%, #a3e635 50%, #ffd166 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .chip {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      transition: transform 0.15s ease, border-color 0.15s ease;
      &:hover {
        border-color: rgba(0, 230, 118, 0.3);
      }
    }

    .download-btn {
      background: linear-gradient(135deg, #00e676, #8dffb8);
      color: #031108;
      border: none;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      &:hover {
        transform: translateY(-2px) scale(1.02);
        box-shadow: 0 12px 28px rgba(0, 230, 118, 0.35);
        color: #031108;
      }
    }

    .phone-wrapper {
      max-width: 290px;
      width: 100%;
    }

    .phone-frame {
      background: linear-gradient(160deg, rgba(255,255,255,0.12), rgba(255,255,255,0.02));
      border: 1px solid rgba(255,255,255,0.1);
      animation: float 4.5s ease-in-out infinite;
    }

    .phone-screen {
      background: linear-gradient(180deg, #10151f 0%, #080b11 100%);
      border: 1px solid rgba(255, 255, 255, 0.06);
      min-height: 400px;
    }

    .rank-box {
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.18), rgba(0, 230, 118, 0.1));
      border: 1px solid rgba(255, 255, 255, 0.06);
    }

    .xp-bar {
      height: 6px;
      background: rgba(255, 255, 255, 0.1);
    }

    .xp-fill {
      height: 100%;
      width: 72%;
      background: linear-gradient(90deg, #00e676, #ffd166);
      border-radius: inherit;
    }

    .mini-stat {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
    }

    .league-row {
      background: rgba(255, 255, 255, 0.03);
    }

    .floating-orbit {
      position: absolute;
      padding: 6px 12px;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 700;
      background: rgba(14, 18, 26, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #fff;
      z-index: 2;
    }

    .tag-1 { top: 10%; left: -20px; animation: pulse 3s infinite; }
    .tag-2 { top: 50%; right: -20px; animation: pulse 3.4s infinite 0.5s; }
    .tag-3 { bottom: 6%; left: -10px; animation: pulse 3.2s infinite 1s; }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 0.9; }
      50% { transform: scale(1.04); opacity: 1; }
    }

    .hover-light:hover {
      color: #f7fafc !important;
    }

    @media (max-width: 991.98px) {
      .phone-wrapper {
        max-width: 240px;
      }
      .phone-screen {
        min-height: 320px;
        padding: 10px !important;
      }
    }
  `]
})
export class LandingComponent {
  public auth = inject(AuthService);
}
