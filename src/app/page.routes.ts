import { Routes } from '@angular/router';
import { InfoComponent } from './components/pages/info.component';
import { BooklistComponent } from './components/pages/book-list.component';

export const routes: Routes = [
  {path: 'booklist', component: BooklistComponent},
  {path: ':page', component: InfoComponent}
];
