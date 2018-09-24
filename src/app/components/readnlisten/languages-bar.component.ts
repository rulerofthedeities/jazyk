import { Component, Input, EventEmitter, Output } from '@angular/core';
import { Language } from '../../models/main.model';

@Component({
  selector: 'km-languages-bar',
  templateUrl: 'languages-bar.component.html',
  styleUrls: ['languages-bar.component.css']
})

export class LanguagesBarComponent {
  @Input() text: Object = {};
  @Input() bookLanguages: Language[];
  @Input() bookLanguage: Language;
  @Input() myLanguages: Language[];
  @Input() myLanguage: Language;
  @Output() newBookLanguage = new EventEmitter<Language>();
  @Output() newMyLanguage = new EventEmitter<Language>();
  @Output() newBookType = new EventEmitter<string>();

  onBookLanguageSelected(lan: Language) {
    this.newBookLanguage.emit(lan);
  }

  onMyLanguageSelected(lan: Language) {
    this.newMyLanguage.emit(lan);
  }

  onChangeBookType(tpe: string) {
    this.newBookType.emit(tpe);
  }
}
