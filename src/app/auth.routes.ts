import {Routes} from '@angular/router';
import {SignUpComponent} from './components/auth/sign-up.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'signin',
    pathMatch: 'full'
  },
  {
    path: 'signup',
    component: SignUpComponent
  }
];
