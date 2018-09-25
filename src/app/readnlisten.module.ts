import { NgModule, ModuleWithProviders } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedModule } from './shared.module';
import { CommonModule } from '@angular/common';

import { ReadnListenService } from './services/readnlisten.service';
import { RegionFlagSelectorComponent } from './components/fields/region-flag-selector.component';
import { CountdownComponent } from './components/readnlisten/countdown.component';
import { BookLanguagesBarComponent } from './components/readnlisten/languages-bar.component';
import { BookFilterBarComponent } from './components/readnlisten/filter-bar.component';
import { AudioFileComponent } from './components/fields/audio-file.component';
import { RegionFlagComponent } from './components/fields/region-flag.component';
import { ModalPromotionComponent } from './components/modals/modal-promotion.component';
import { ScrollToDirective } from './directives/scroll-to.directive';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    SharedModule
  ],
  declarations: [
    RegionFlagSelectorComponent,
    AudioFileComponent,
    RegionFlagComponent,
    CountdownComponent,
    BookLanguagesBarComponent,
    BookFilterBarComponent,
    ModalPromotionComponent,
    ScrollToDirective
  ],
  providers: [
    ReadnListenService
  ],
  exports: [
    RegionFlagSelectorComponent,
    AudioFileComponent,
    RegionFlagComponent,
    CountdownComponent,
    BookLanguagesBarComponent,
    BookFilterBarComponent,
    ModalPromotionComponent,
    ScrollToDirective
  ]
})
export class ReadnListenModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: ReadnListenModule,
      providers: [
        ReadnListenService
      ]
    };
  }
}
