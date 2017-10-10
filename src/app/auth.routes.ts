import {Routes} from '@angular/router';
import {SignUpComponent} from './components/auth/sign-up.component';
import {SignInComponent} from './components/auth/sign-in.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'signin',
    pathMatch: 'full'
  },
  {path: 'signup', component: SignUpComponent},
  {path: 'signin', component: SignInComponent}
];
