import { Routes } from '@angular/router';
import { ReadComponent } from './components/read/read.component';
import { BookSentencesComponent } from './components/readnlisten/book-sentences.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: ReadComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'book/:id/:lan',
    component: BookSentencesComponent,
    data : {tpe : 'read'},
    canActivate: [AuthGuard]
  }
];
