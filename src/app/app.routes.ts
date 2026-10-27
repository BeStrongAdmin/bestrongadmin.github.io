import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { CoachesLandingComponent } from './pages/coaches-landing/coaches-landing.component';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { RoutineGeneratorComponent } from './pages/routine-generator/routine-generator.component';
import { RoutinesListComponent } from './pages/routines-list/routines-list.component';
import { AdminManagementComponent } from './pages/admin-management/admin-management.component';
import { SystemAdminComponent } from './pages/system-admin/system-admin.component';
import { adminGuard, authGuard, superAdminGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'coaches', component: CoachesLandingComponent },
  { path: 'entrenadores', redirectTo: 'coaches' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'generator', component: RoutineGeneratorComponent, canActivate: [adminGuard] },
  { path: 'routines', component: RoutinesListComponent, canActivate: [adminGuard] },
  { path: 'admin-management', component: AdminManagementComponent, canActivate: [adminGuard, superAdminGuard] },
  { path: 'system-admin', component: SystemAdminComponent, canActivate: [adminGuard, superAdminGuard] },
  { path: '**', redirectTo: '' }
];
