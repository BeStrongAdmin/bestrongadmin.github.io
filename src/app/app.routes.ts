import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { RoutineGeneratorComponent } from './pages/routine-generator/routine-generator.component';
import { RoutinesListComponent } from './pages/routines-list/routines-list.component';
import { AdminManagementComponent } from './pages/admin-management/admin-management.component';
import { adminGuard, superAdminGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [adminGuard] },
  { path: 'generator', component: RoutineGeneratorComponent, canActivate: [adminGuard] },
  { path: 'routines', component: RoutinesListComponent, canActivate: [adminGuard] },
  { path: 'admin-management', component: AdminManagementComponent, canActivate: [adminGuard, superAdminGuard] },
  { path: '**', redirectTo: '' }
];
