import { Routes } from '@angular/router';
import { GlossariesComponent } from './components/glossaries/glossaries.component';
import { BookWordListComponent } from './components/glossaries/word-list.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: GlossariesComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'glossary/:id/:lan',
    component: BookWordListComponent,
    data : {tpe : 'glossary'},
    canActivate: [AuthGuard]
  }
];
