import { Routes } from '@angular/router';
import { ListenComponent } from './components/listen/listen.component';
import { BookSentencesComponent } from './components/readnlisten/book-sentences.component';
import { SentencesTestComponent } from './components/listen/sentences-test.component';
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
    data : {tpe : 'listen', test: false},
    canActivate: [AuthGuard]
  },
  {
    path: 'book/:id/:lan/test',
    component: SentencesTestComponent,
    data : {tpe : 'listen', test: true},
    canActivate: [AuthGuard]
  }
];
