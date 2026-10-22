import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Espera segura a que el estado de auth de Firebase inicialice (máximo 2.5s)
  await Promise.race([
    auth.authReadyPromise,
    new Promise(resolve => setTimeout(resolve, 2500))
  ]);

  const user = auth.currentUser();
  if (user && user.isAdmin) {
    return true;
  }

  return router.createUrlTree(['/login']);
};

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
