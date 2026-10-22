import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Permite acceso a usuarios autenticados (incluso coaches pendientes de aprobación).
 * Utilizado para la vista de /dashboard.
 */
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await Promise.race([
    auth.authReadyPromise,
    new Promise(resolve => setTimeout(resolve, 2500))
  ]);

  const user = auth.currentUser();
  if (user) {
    return true;
  }

  return router.createUrlTree(['/login']);
};

/**
 * Permite acceso únicamente a administradores ACTIVOS con permisos aprobados.
 * Si un coach no aprobado intenta acceder a /generator o /routines, lo redirige a /dashboard.
 */
export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await Promise.race([
    auth.authReadyPromise,
    new Promise(resolve => setTimeout(resolve, 2500))
  ]);

  const user = auth.currentUser();
  if (user && user.isAdmin) {
    return true;
  }

  if (user && !user.isAdmin) {
    return router.createUrlTree(['/dashboard']);
  }

  return router.createUrlTree(['/login']);
};

/**
 * Acceso exclusivo para el Superadmin propietario.
 */
export const superAdminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await Promise.race([
    auth.authReadyPromise,
    new Promise(resolve => setTimeout(resolve, 2500))
  ]);

  const user = auth.currentUser();
  if (user && user.isSuperAdmin) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
