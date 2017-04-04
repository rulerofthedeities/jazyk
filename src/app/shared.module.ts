import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {ErrorMessageComponent} from './components/msg/error-message.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    ErrorMessageComponent
  ],
  exports: [
    ErrorMessageComponent,
    CommonModule
  ]
})
export class SharedModule {}
