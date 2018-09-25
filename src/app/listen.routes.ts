import { Routes } from '@angular/router';
import { ListenComponent } from './components/listen/listen.component';
import { BookSentencesComponent } from './components/readnlisten/book-sentences.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: ListenComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'book/:id/:lan',
    component: BookSentencesComponent,
    data : {tpe : 'listen'},
    canActivate: [AuthGuard]
  }
];
