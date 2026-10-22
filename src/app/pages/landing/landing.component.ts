import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="landing-container min-vh-100 d-flex flex-column">
      <!-- Top Navigation Bar -->
      <header class="landing-header border-bottom border-dark px-3 px-md-5 py-3 d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center gap-3">
          <img src="logo.jpg" alt="BeStrong App Logo" class="brand-logo rounded-3 shadow" style="width: 42px; height: 42px; object-fit: cover;">
          <span class="fs-4 fw-black text-light tracking-tight">BeStrong</span>
        </div>

        <div class="d-flex align-items-center gap-3">
          <a 
            routerLink="/login" 
            class="btn btn-outline-light btn-sm px-3 py-2 fw-semibold d-flex align-items-center gap-2 border-secondary"
            style="border-radius: 12px; background: rgba(255, 255, 255, 0.05);"
          >
            <i class="bi bi-person-fill-lock text-primary"></i>
            <span>Acceso Entrenadores</span>
          </a>
        </div>
      </header>

      <!-- Main Hero Grid -->
      <main class="page-content flex-grow-1 px-3 px-md-5 py-4 py-lg-5 d-flex align-items-center">
        <div class="container-fluid px-0">
          <div class="row align-items-center g-5">
            <!-- Left Hero Content -->
            <div class="col-12 col-lg-7">
              <div class="badge-pill mb-3 d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill">
                <span class="pulse-dot"></span>
                <span class="text-uppercase small fw-bold tracking-wider" style="color: #00e676;">Nueva Versión 2.10</span>
              </div>

              <h1 class="display-3 fw-black text-light lh-1 mb-3">
                Entrena con Ciencia. <br>
                <span class="text-gradient">Sube de Liga.</span>
              </h1>

              <p class="lead text-secondary mb-4" style="max-width: 620px; font-size: 1.15rem; line-height: 1.6;">
                La app definitiva de entrenamiento de fuerza y sobrecarga progresiva. Combina algoritmos biomecánicos de hipertrofia con gamificación en tiempo real: gana XP, compite en ligas semanales y desbloquea rangos de bestia.
              </p>

              <!-- Feature Chips Grid -->
              <div class="row g-2 mb-4" style="max-width: 620px;">
                <div class="col-6 col-sm-3">
                  <div class="chip p-3 rounded-4">
                    <div class="fw-bold fs-5 text-light mb-1">⚡ AI</div>
                    <div class="small text-secondary" style="font-size: 0.8rem;">Rutinas Biomecánicas</div>
                  </div>
                </div>
                <div class="col-6 col-sm-3">
                  <div class="chip p-3 rounded-4">
                    <div class="fw-bold fs-5 text-warning mb-1">🏆 XP</div>
                    <div class="small text-secondary" style="font-size: 0.8rem;">Niveles & Racha</div>
                  </div>
                </div>
                <div class="col-6 col-sm-3">
                  <div class="chip p-3 rounded-4">
                    <div class="fw-bold fs-5 text-info mb-1">🥇 #1</div>
                    <div class="small text-secondary" style="font-size: 0.8rem;">Ranking de Ligas</div>
                  </div>
                </div>
                <div class="col-6 col-sm-3">
                  <div class="chip p-3 rounded-4">
                    <div class="fw-bold fs-5 text-danger mb-1">🦁 Beast</div>
                    <div class="small text-secondary" style="font-size: 0.8rem;">Rangos Animales</div>
                  </div>
                </div>
              </div>

              <!-- CTA Row -->
              <div class="d-flex flex-column flex-sm-row align-items-sm-center gap-3">
                <a 
                  href="https://play.google.com/store/apps/details?id=com.BeStrong&pcampaignid=web_share" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  class="download-btn btn d-inline-flex align-items-center justify-content-center gap-3 px-4 py-3 rounded-4 fw-bold shadow-lg"
                >
                  <i class="bi bi-google-play fs-4"></i>
                  <div class="text-start">
                    <div class="small text-uppercase fw-semibold" style="font-size: 0.65rem; letter-spacing: 1px;">Disponible en</div>
                    <div class="fs-6 fw-black">Google Play Store</div>
                  </div>
                </a>
                <div class="text-secondary small">
                  <div class="fw-semibold text-light"><i class="bi bi-shield-check text-success me-1"></i> 100% Gratuito</div>
                  <div>Comunidad, historial y analíticas</div>
                </div>
              </div>
            </div>

            <!-- Right Showcase Interactive Phone -->
            <div class="col-12 col-lg-5 text-center position-relative">
              <div class="phone-wrapper mx-auto position-relative">
                <!-- Floating tags -->
                <div class="floating-orbit tag-1 shadow">
                  <i class="bi bi-award-fill text-warning me-1"></i> Medallas
                </div>
                <div class="floating-orbit tag-2 shadow">
                  <i class="bi bi-people-fill text-info me-1"></i> Comunidad
                </div>
                <div class="floating-orbit tag-3 shadow">
                  <i class="bi bi-activity text-success me-1"></i> Rutinas Pro
                </div>

                <!-- Phone Mockup -->
                <div class="phone-frame p-2 p-sm-3 rounded-5 shadow-2xl">
                  <div class="phone-screen rounded-4 p-3 text-start">
                    <!-- Top Status -->
                    <div class="d-flex justify-content-between align-items-center mb-3">
                      <span class="badge bg-success bg-opacity-25 text-success border border-success px-2 py-1">
                        Liga Diamante
                      </span>
                      <span class="fw-bold text-warning small">
                        <i class="bi bi-lightning-fill"></i> 4,850 XP
                      </span>
                    </div>

                    <!-- Rank Card -->
                    <div class="rank-box p-3 rounded-4 mb-3">
                      <div class="small text-secondary text-uppercase fw-semibold" style="font-size: 0.7rem;">Rango Animal Actual</div>
                      <h4 class="fw-black text-light mb-2">Tigre Alpha</h4>
                      <div class="xp-bar rounded-pill overflow-hidden">
                        <div class="xp-fill"></div>
                      </div>
                    </div>

                    <!-- Quick stats grid -->
                    <div class="row g-2 mb-3">
                      <div class="col-6">
                        <div class="mini-stat p-2 rounded-3 text-center">
                          <strong class="fs-5 text-light d-block">#1</strong>
                          <span class="text-secondary" style="font-size: 0.75rem;">Posición</span>
                        </div>
                      </div>
                      <div class="col-6">
                        <div class="mini-stat p-2 rounded-3 text-center">
                          <strong class="fs-5 text-success d-block">7d</strong>
                          <span class="text-secondary" style="font-size: 0.75rem;">Racha Fuego</span>
                        </div>
                      </div>
                    </div>

                    <!-- Live League feed peek -->
                    <div class="league-peek">
                      <div class="league-row d-flex align-items-center justify-content-between p-2 rounded-3 mb-1">
                        <div class="d-flex align-items-center gap-2">
                          <span class="badge bg-warning text-dark fw-bold">1</span>
                          <span class="small fw-bold text-light">@alex.fit</span>
                        </div>
                        <span class="small text-success fw-bold">620 XP</span>
                      </div>
                      <div class="league-row d-flex align-items-center justify-content-between p-2 rounded-3">
                        <div class="d-flex align-items-center gap-2">
                          <span class="badge bg-secondary text-light fw-bold">2</span>
                          <span class="small fw-bold text-light">@sofia_lift</span>
                        </div>
                        <span class="small text-success fw-bold">480 XP</span>
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
      <footer class="landing-footer border-top border-dark px-3 px-md-5 py-3 d-flex flex-column flex-md-row justify-content-between align-items-center gap-2 text-secondary small">
        <div>&copy; 2026 BeStrong App. Todos los derechos reservados.</div>
        <div class="d-flex gap-3">
          <a routerLink="/login" class="text-secondary text-decoration-none hover-light">Panel de Entrenadores</a>
          <a href="https://play.google.com/store/apps/details?id=com.BeStrong&pcampaignid=web_share" target="_blank" class="text-secondary text-decoration-none hover-light">Descargar App</a>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .landing-container {
      background:
        radial-gradient(circle at 18% 16%, rgba(0, 230, 118, 0.15), transparent 28%),
        radial-gradient(circle at 78% 18%, rgba(139, 92, 246, 0.20), transparent 30%),
        radial-gradient(circle at 72% 86%, rgba(232, 121, 249, 0.12), transparent 28%),
        linear-gradient(135deg, #050608 0%, #0a0d14 50%, #030406 100%);
      color: #f7fafc;
      overflow-x: hidden;
    }

    .landing-header {
      background: rgba(8, 10, 15, 0.7);
      backdrop-filter: blur(12px);
    }

    .fw-black {
      font-weight: 900;
    }

    .badge-pill {
      background: rgba(0, 230, 118, 0.1);
      border: 1px solid rgba(0, 230, 118, 0.25);
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #00e676;
      box-shadow: 0 0 10px #00e676;
      animation: pulse 1.8s infinite;
    }

    .text-gradient {
      background: linear-gradient(135deg, #00e676 0%, #a3e635 50%, #ffd166 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .chip {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      transition: transform 0.2s ease, border-color 0.2s ease;
    }
    .chip:hover {
      transform: translateY(-2px);
      border-color: rgba(0, 230, 118, 0.3);
    }

    .download-btn {
      background: linear-gradient(135deg, #00e676, #8dffb8);
      color: #031108;
      border: none;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .download-btn:hover {
      transform: translateY(-2px) scale(1.02);
      box-shadow: 0 16px 36px rgba(0, 230, 118, 0.35);
      color: #031108;
    }

    .phone-wrapper {
      max-width: 320px;
    }

    .phone-frame {
      background: linear-gradient(160deg, rgba(255,255,255,0.14), rgba(255,255,255,0.02));
      border: 1px solid rgba(255,255,255,0.12);
      animation: float 4.5s ease-in-out infinite;
    }

    .phone-screen {
      background: linear-gradient(180deg, #10151f 0%, #080b11 100%);
      border: 1px solid rgba(255, 255, 255, 0.08);
      min-height: 480px;
    }

    .rank-box {
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(0, 230, 118, 0.12));
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .xp-bar {
      height: 8px;
      background: rgba(255, 255, 255, 0.1);
    }

    .xp-fill {
      height: 100%;
      width: 72%;
      background: linear-gradient(90deg, #00e676, #ffd166);
      border-radius: inherit;
    }

    .mini-stat {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.06);
    }

    .league-row {
      background: rgba(255, 255, 255, 0.03);
    }

    .floating-orbit {
      position: absolute;
      padding: 8px 14px;
      border-radius: 999px;
      font-size: 0.82rem;
      font-weight: 700;
      background: rgba(14, 18, 26, 0.88);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #fff;
      z-index: 2;
    }

    .tag-1 { top: 12%; left: -25px; animation: pulse 3s infinite; }
    .tag-2 { top: 52%; right: -25px; animation: pulse 3.4s infinite 0.5s; }
    .tag-3 { bottom: 8%; left: -10px; animation: pulse 3.2s infinite 1s; }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 0.9; }
      50% { transform: scale(1.05); opacity: 1; }
    }

    .hover-light:hover {
      color: #f7fafc !important;
    }
  `]
})
export class LandingComponent {}
