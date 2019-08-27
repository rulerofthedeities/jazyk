import { Routes } from '@angular/router';
import { BookGlossaryComponent } from './components/glossaries/glossary.component';
import { BookFlashCardsComponent } from './components/glossaries/flashcards.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: ':id/:lan',
    component: BookGlossaryComponent,
    data : {tpe : 'glossary'},
    canActivate: [AuthGuard]
  },
  {
    path: 'flashcards/:id/:lan/all',
    component: BookFlashCardsComponent,
    data : {tpe : 'all'},
    canActivate: [AuthGuard]
  },
  {
    path: 'flashcards/:id/:lan/my',
    component: BookFlashCardsComponent,
    data : {tpe : 'my'},
    canActivate: [AuthGuard]
  }
];
