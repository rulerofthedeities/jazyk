import { Routes } from '@angular/router';
import { BookSentencesComponent } from './components/readnlisten/book-sentences.component';
import { BookRevisionComponent } from './components/revision/book-revision.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: ':id/:lan',
    component: BookSentencesComponent,
    data : {
      tpe : 'read',
      test: false
    },
    canActivate: [AuthGuard]
  },
  {
    path: ':id/:lan/review',
    component: BookRevisionComponent,
    data : {
      tpe : 'read'
    },
    canActivate: [AuthGuard]
  }
];
