import { Routes } from '@angular/router';
import { ReadComponent } from './components/read/read.component';
import { BookSentencesComponent } from './components/read/book-sentences.component';
import { AuthGuard } from './services/auth-guard.service';

export const routes: Routes = [
  {
    path: '',
    component: ReadComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'book/:id/:lan',
    component: BookSentencesComponent,
    canActivate: [AuthGuard]
  }
];
