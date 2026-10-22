# BeStrong Admin Web 🏋️‍♂️⚡

Panel web administrativo para la gestión de rutinas biomecánicas personalizadas, asignación de códigos y administración de entrenadores en **BeStrong**.

Construido con **Angular 19/22 (Standalone API)**, **Bootstrap 5 (100% responsivo)**, **Firebase Web SDK** y contenerizado con **Docker (Nginx Alpine)**.

---

## 🚀 Características Principales

1. **Generador Biomecánico de Rutinas:**
   * Soporte para frecuencias de 2 a 6 días (*Torso, Pierna, Empuje, Jalón, Fullbody*).
   * Slots estructurados por patrones de movimiento biomecánicos y finishers (Core, Cuello, Antebrazo).
   * Catálogo completo de ejercicios con búsqueda y filtrado por grupos musculares.
   * Generación de códigos únicos (`BST-XXXX`) con expiración automática de 60 días en Firestore (`assigned_routines/{code}`).

2. **Gestión de Administradores y Métricas (Superadmin):**
   * Monitoreo en tiempo real de cuántas rutinas ha generado cada admin y cuántos usuarios está entrenando.
   * Lista de usuarios registrados en la app móvil (`/users`) para convertirlos en Administradores con un solo clic.
   * Posibilidad de activar, suspender o revocar permisos de administración en `/admins/{uid}`.

3. **Seguridad y Control de Acceso:**
   * Autenticación con Firebase Auth y verificación de roles en Firestore.
   * Guards de rutas (`adminGuard` y `superAdminGuard`).
   * Despliegue seguro de reglas de seguridad (`firestore.rules`) mediante Firebase CLI.

4. **Diseño Moderno y Responsivo:**
   * Basado 100% en Bootstrap 5 con tema oscuro BeStrong Power Core (Púrpura, Lima y Dorado).
   * Totalmente adaptado para teléfonos, tabletas y computadoras de escritorio.

---

## 🛠️ Comandos de Desarrollo

### 1. Iniciar localmente:
```bash
npm install
npm start
```
Abre tu navegador en `http://localhost:4200/`.

### 2. Compilar para producción:
```bash
npm run build
```

### 3. Ejecutar con Docker (Ligero multi-stage Nginx Alpine):
```bash
docker compose up --build
```
Abre tu navegador en `http://localhost:8080/`.

### 4. Desplegar reglas de Firestore desde la terminal:
```bash
npm run deploy:rules
```

---

## 🌐 Despliegue Continuo (CI/CD) en GitHub Pages

El proyecto incluye un flujo automatizado en `.github/workflows/deploy.yml`.

### Para conectarlo con tu repositorio en GitHub:

1. Crea un nuevo repositorio en tu GitHub (por ejemplo: `bestrong-admin`).
2. Agrega el origen remoto y sube el código:
   ```bash
   git remote add origin git@github-personal:marcohesa/bestrong-admin.git
   git push -u origin main
   ```
3. En GitHub ve a **Settings** $\rightarrow$ **Pages** $\rightarrow$ **Source**: selecciona **GitHub Actions**.

¡A partir de ese momento, cada `git push` a `main` compilará y publicará la web automáticamente y gratis en GitHub Pages!
