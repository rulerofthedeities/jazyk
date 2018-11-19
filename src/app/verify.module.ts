import { NgModule } from '@angular/core';
import { SharedModule } from './shared.module';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { routes } from './verify.routes';
import { ValidationService } from './services/validation.service';
import { VerifyMailComponent } from './components/user/verify-mail.component';
import { ResetPasswordComponent } from './components/user/reset-password.component';

@NgModule({
  imports: [
    SharedModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule
  ],
  providers: [
    ValidationService
  ],
  declarations: [
    VerifyMailComponent,
    ResetPasswordComponent
  ]
})

export class VerifyModule {}
