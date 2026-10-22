import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-coaches-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="coaches-container min-vh-100 d-flex flex-column">
      <!-- Header -->
      <header class="coaches-header border-bottom border-dark px-3 px-md-5 py-3 d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center gap-2">
          <img src="logo.jpg" alt="BeStrong Logo" class="brand-logo rounded-2 shadow" style="width: 38px; height: 38px; object-fit: cover;">
          <div>
            <div class="fs-5 fw-black text-light tracking-tight lh-1">BeStrong <span class="badge bg-success text-dark fs-6 ms-1">Coach</span></div>
            <span class="text-secondary small" style="font-size: 0.7rem;">Plataforma Web para Entrenadores</span>
          </div>
        </div>

        <div class="d-flex align-items-center gap-2 gap-md-3">
          <a routerLink="/" class="btn btn-outline-secondary btn-sm px-3 py-1 py-md-2 fw-semibold d-none d-sm-inline-flex align-items-center gap-1 rounded-3">
            <i class="bi bi-phone"></i> App Atletas
          </a>
          <a routerLink="/login" class="btn btn-light btn-sm px-3 py-1 py-md-2 fw-bold d-inline-flex align-items-center gap-2 rounded-3 text-dark">
            <i class="bi bi-box-arrow-in-right text-dark"></i>
            <span>Acceso Panel</span>
          </a>
        </div>
      </header>

      <!-- Hero Section -->
      <main class="flex-grow-1 px-3 px-md-5 py-4 py-lg-5">
        <div class="container-fluid px-0" style="max-width: 1200px;">
          <!-- Hero Header -->
          <div class="text-center mx-auto mb-5" style="max-width: 820px;">
            <div class="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-3 glass-pill">
              <span class="badge bg-success text-dark fw-bold">100% GRATUITO</span>
              <span class="text-light small fw-medium">Sin límites de alumnos &bull; Sin suscripciones</span>
            </div>

            <h1 class="hero-title fw-black text-light lh-sm mb-3">
              Gestiona a tus alumnos. <br>
              <span class="text-gradient">Diseña y Asigna Rutinas en Segundos.</span>
            </h1>

            <p class="hero-subtitle text-secondary mb-4 mx-auto" style="max-width: 650px;">
              El panel administrativo web definitivo para entrenadores personales, preparadores físicos y gimnasios. Crea planes biomecánicos o 100% libres y compártelos con un código único directo a la app de tus alumnos.
            </p>

            <div class="d-flex flex-column flex-sm-row align-items-center justify-content-center gap-3">
              <a routerLink="/login" class="btn btn-cta btn-lg px-4 py-3 rounded-4 fw-black d-inline-flex align-items-center gap-2 shadow-lg">
                <i class="bi bi-lightning-charge-fill text-dark"></i>
                <span>Comenzar Gratis como Entrenador</span>
              </a>
              <a 
                href="https://play.google.com/store/apps/details?id=com.BeStrong&pcampaignid=web_share" 
                target="_blank" 
                rel="noopener noreferrer" 
                class="btn btn-outline-secondary btn-lg px-4 py-3 rounded-4 fw-semibold d-inline-flex align-items-center gap-2"
                style="border-color: rgba(255,255,255,0.15); background: rgba(255,255,255,0.03);"
              >
                <i class="bi bi-google-play text-success"></i>
                <span class="text-light">Descargar App para Alumnos</span>
              </a>
            </div>
          </div>

          <!-- Feature Cards Grid -->
          <div class="row g-4 mb-5">
            <!-- Card 1 -->
            <div class="col-12 col-md-4">
              <div class="card h-100 p-4 rounded-4 border-0 feature-card position-relative overflow-hidden">
                <div class="feature-icon-wrapper mb-3" style="background: rgba(0, 230, 118, 0.1); border-color: rgba(0, 230, 118, 0.25);">
                  <i class="bi bi-sliders text-success fs-3"></i>
                </div>
                <h5 class="fw-bold text-light mb-2">Creación Libre o Biomecánica</h5>
                <p class="text-secondary small mb-3">
                  Configura de 1 a 7 días. Puedes utilizar presets biomecánicos inteligentes o crear días personalizados con nombres libres (*Glúteos & Isquios, Brazos, Potencia...*).
                </p>
                <ul class="list-unstyled text-secondary small d-flex flex-column gap-2 mb-0">
                  <li class="d-flex align-items-center gap-2"><i class="bi bi-check2 text-success"></i> Catálogo con 275+ ejercicios con GIFs</li>
                  <li class="d-flex align-items-center gap-2"><i class="bi bi-check2 text-success"></i> Crea ejercicios manuales al instante</li>
                  <li class="d-flex align-items-center gap-2"><i class="bi bi-check2 text-success"></i> Ajuste libre de series y rangos de reps</li>
                </ul>
              </div>
            </div>

            <!-- Card 2 -->
            <div class="col-12 col-md-4">
              <div class="card h-100 p-4 rounded-4 border-0 feature-card position-relative overflow-hidden">
                <div class="feature-icon-wrapper mb-3" style="background: rgba(77, 125, 255, 0.1); border-color: rgba(77, 125, 255, 0.25);">
                  <i class="bi bi-ticket-perforated-fill text-primary fs-3"></i>
                </div>
                <h5 class="fw-bold text-light mb-2">Códigos de Canje Instantáneos</h5>
                <p class="text-secondary small mb-3">
                  Cada rutina genera un código único (ej: <code class="text-success fw-bold">BST-8K2Q</code>) con 60 días de vigencia en la nube.
                </p>
                <ul class="list-unstyled text-secondary small d-flex flex-column gap-2 mb-0">
                  <li class="d-flex align-items-center gap-2"><i class="bi bi-check2 text-primary"></i> Envío rápido por WhatsApp a tus alumnos</li>
                  <li class="d-flex align-items-center gap-2"><i class="bi bi-check2 text-primary"></i> Descarga en 1 segundo en su móvil</li>
                  <li class="d-flex align-items-center gap-2"><i class="bi bi-check2 text-primary"></i> Guardado offline en su dispositivo</li>
                </ul>
              </div>
            </div>

            <!-- Card 3 -->
            <div class="col-12 col-md-4">
              <div class="card h-100 p-4 rounded-4 border-0 feature-card position-relative overflow-hidden">
                <div class="feature-icon-wrapper mb-3" style="background: rgba(255, 209, 102, 0.1); border-color: rgba(255, 209, 102, 0.25);">
                  <i class="bi bi-graph-up-arrow text-warning fs-3"></i>
                </div>
                <h5 class="fw-bold text-light mb-2">Control & Estadísticas</h5>
                <p class="text-secondary small mb-3">
                  Supervisa la adherencia de tus atletas. Monitorea en tiempo real cuántas veces ha sido canjeada cada rutina y tus métricas de entrenamiento.
                </p>
                <ul class="list-unstyled text-secondary small d-flex flex-column gap-2 mb-0">
                  <li class="d-flex align-items-center gap-2"><i class="bi bi-check2 text-warning"></i> Contador de atletas activos por rutina</li>
                  <li class="d-flex align-items-center gap-2"><i class="bi bi-check2 text-warning"></i> Historial y fecha de caducidad</li>
                  <li class="d-flex align-items-center gap-2"><i class="bi bi-check2 text-warning"></i> Duplicación y edición rápida de planes</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- How It Works Section -->
          <div class="card p-4 p-md-5 rounded-4 border-0 panel-card mb-5">
            <div class="text-center mb-4">
              <span class="text-success small fw-bold text-uppercase tracking-wider">Flujo de Trabajo Simple</span>
              <h3 class="fw-black text-light mt-1">¿Cómo entrenas a tus alumnos con BeStrong?</h3>
            </div>

            <div class="row g-4 text-center">
              <div class="col-12 col-md-4">
                <div class="step-num mx-auto mb-3">1</div>
                <h6 class="fw-bold text-light mb-1">Arma la Rutina en la Web</h6>
                <p class="text-secondary small mb-0">
                  Entras a <strong>bestrongadmin.github.io</strong>, eliges los días, configuras los ejercicios y obtienes el código <code class="text-success">BST-XXXX</code>.
                </p>
              </div>

              <div class="col-12 col-md-4">
                <div class="step-num mx-auto mb-3">2</div>
                <h6 class="fw-bold text-light mb-1">Tu Alumno Ingresa el Código</h6>
                <p class="text-secondary small mb-0">
                  Le pasas el código a tu alumno. Él abre la app gratuita <strong>BeStrong</strong> en su teléfono, introduce el código y su rutina queda activa.
                </p>
              </div>

              <div class="col-12 col-md-4">
                <div class="step-num mx-auto mb-3">3</div>
                <h6 class="fw-bold text-light mb-1">Entrenamiento y Progreso</h6>
                <p class="text-secondary small mb-0">
                  Tu alumno entrena guiado por la app con temporizador, registro de cargas, sobrecarga progresiva y gamificación con puntos XP.
                </p>
              </div>
            </div>
          </div>

          <!-- FAQ & Requirements Callout -->
          <div class="row g-4 align-items-center mb-5">
            <div class="col-12 col-lg-6">
              <div class="card p-4 rounded-4 border-0 feature-card h-100">
                <div class="d-flex align-items-center gap-3 mb-3">
                  <div class="icon-circle bg-success bg-opacity-10 text-success">
                    <i class="bi bi-phone-fill fs-4"></i>
                  </div>
                  <div>
                    <h6 class="fw-bold text-light mb-0">¿Qué necesita tu alumno?</h6>
                    <small class="text-secondary">Totalmente accesible para cualquier atleta</small>
                  </div>
                </div>
                <p class="text-secondary small mb-3">
                  Tus alumnos únicamente necesitan tener instalada la app móvil gratuita <strong>BeStrong</strong> en Android desde Google Play Store. No necesitan pagar suscripciones ni cuentas premium para canjear y usar tus rutinas.
                </p>
                <a 
                  href="https://play.google.com/store/apps/details?id=com.BeStrong&pcampaignid=web_share" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  class="btn btn-outline-light btn-sm rounded-3 d-inline-flex align-items-center gap-2 align-self-start"
                >
                  <i class="bi bi-box-arrow-up-right"></i> Ver BeStrong en Google Play
                </a>
              </div>
            </div>

            <div class="col-12 col-lg-6">
              <div class="card p-4 rounded-4 border-0 feature-card h-100">
                <div class="d-flex align-items-center gap-3 mb-3">
                  <div class="icon-circle bg-warning bg-opacity-10 text-warning">
                    <i class="bi bi-shield-lock-fill fs-4"></i>
                  </div>
                  <div>
                    <h6 class="fw-bold text-light mb-0">¿Cómo acceder como Entrenador?</h6>
                    <small class="text-secondary">Acceso seguro con cuenta Google o Correo</small>
                  </div>
                </div>
                <p class="text-secondary small mb-3">
                  Puedes iniciar sesión directamente con tu cuenta de Google o con correo y contraseña. Si deseas permisos de Superadministrador para coordinar entrenadores, un administrador existente puede habilitarte con un solo clic.
                </p>
                <a routerLink="/login" class="btn btn-outline-success btn-sm rounded-3 d-inline-flex align-items-center gap-2 align-self-start">
                  <i class="bi bi-person-fill-check"></i> Ir a Inicio de Sesión
                </a>
              </div>
            </div>
          </div>

          <!-- Bottom CTA Banner -->
          <div class="text-center p-4 p-md-5 rounded-4 bottom-banner">
            <h2 class="fw-black text-light mb-2">Comienza a digitalizar tus entrenamientos hoy</h2>
            <p class="text-secondary small mb-4 mx-auto" style="max-width: 550px;">
              Plataforma 100% gratuita para entrenadores y alumnos. Sin comisiones, sin pagos obligatorios.
            </p>
            <a routerLink="/login" class="btn btn-cta btn-lg px-5 py-3 rounded-4 fw-black d-inline-flex align-items-center gap-2 shadow-lg">
              <i class="bi bi-arrow-right-circle-fill text-dark"></i>
              <span>Entrar al Panel de Control</span>
            </a>
          </div>
        </div>
      </main>

      <!-- Footer -->
      <footer class="border-top border-dark px-3 px-md-5 py-3 text-center text-secondary small">
        <div class="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2">
          <span>&copy; BeStrong Admin &bull; Entrena con Ciencia, Crece con Fuerza.</span>
          <div class="d-flex gap-3">
            <a routerLink="/" class="text-secondary text-decoration-none">App Móvil</a>
            <a routerLink="/coaches" class="text-success text-decoration-none fw-semibold">Entrenadores</a>
            <a routerLink="/login" class="text-secondary text-decoration-none">Acceso</a>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .coaches-container {
      background:
        radial-gradient(circle at 18% 16%, rgba(0, 230, 118, 0.20), transparent 28%),
        radial-gradient(circle at 82% 20%, rgba(77, 125, 255, 0.22), transparent 30%),
        radial-gradient(circle at 50% 80%, rgba(232, 121, 249, 0.15), transparent 26%),
        linear-gradient(135deg, #07090f 0%, #0d121d 50%, #05070b 100%);
      color: #f7fafc;
    }
    .coaches-header {
      background: rgba(7, 9, 15, 0.85);
      backdrop-filter: blur(12px);
    }
    .hero-title {
      font-size: clamp(2rem, 5vw, 3.6rem);
      letter-spacing: -0.03em;
    }
    .text-gradient {
      background: linear-gradient(135deg, #00e676, #8dffb8 50%, #4ecdc4);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero-subtitle {
      font-size: clamp(0.95rem, 1.8vw, 1.15rem);
      line-height: 1.5;
    }
    .glass-pill {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(6px);
    }
    .btn-cta {
      background: linear-gradient(135deg, #00e676, #8dffb8);
      color: #031108;
      border: none;
      transition: all 0.2s ease;
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 30px rgba(0, 230, 118, 0.4);
        color: #000;
      }
    }
    .feature-card, .panel-card {
      background: rgba(17, 23, 34, 0.65);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.07) !important;
      transition: transform 0.2s ease, border-color 0.2s ease;
      &:hover {
        border-color: rgba(0, 230, 118, 0.3) !important;
        transform: translateY(-2px);
      }
    }
    .feature-icon-wrapper {
      width: 54px;
      height: 54px;
      border-radius: 14px;
      border: 1px solid;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .step-num {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: rgba(0, 230, 118, 0.12);
      border: 1px solid rgba(0, 230, 118, 0.35);
      color: #00e676;
      font-weight: 900;
      font-size: 1.2rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .icon-circle {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .bottom-banner {
      background: linear-gradient(135deg, rgba(0, 230, 118, 0.1), rgba(77, 125, 255, 0.08));
      border: 1px solid rgba(0, 230, 118, 0.25);
      backdrop-filter: blur(12px);
    }
  `]
})
export class CoachesLandingComponent {}
