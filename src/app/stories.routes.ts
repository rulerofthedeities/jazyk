import { Routes } from '@angular/router';
import { StoryListComponent } from './components/stories/list.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: StoryListComponent,
    canActivate: [AuthGuard]
  },
  {
    path: ':id',
    component: StoryListComponent,
    canActivate: [AuthGuard]
  },
];
