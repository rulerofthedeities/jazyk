import { Routes } from '@angular/router';
import { VerifyMailComponent } from './components/user/verify-mail.component';
import { ResetPasswordComponent } from './components/user/reset-password.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'verifymail',
    component: VerifyMailComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'resetpw',
    component: ResetPasswordComponent
  }
];
