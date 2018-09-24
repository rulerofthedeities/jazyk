import { Routes } from '@angular/router';
import { ListenComponent } from './components/listen/listen.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: ListenComponent,
    canActivate: [AuthGuard]
  }
];
