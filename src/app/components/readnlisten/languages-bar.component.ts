import { Component, Input, EventEmitter, Output, ViewChildren, AfterViewInit } from '@angular/core';
import { TooltipDirective } from 'ng2-tooltip-directive';
import { Language } from '../../models/main.model';

@Component({
  selector: 'km-languages-bar',
  templateUrl: 'languages-bar.component.html',
  styleUrls: ['languages-bar.component.css']
})

export class BookLanguagesBarComponent implements AfterViewInit {
  @Input() bookType = 'read'; // read or listen
  @Input() text: Object = {};
  @Input() bookLanguages: Language[];
  @Input() bookLanguage: Language;
  @Input() myLanguages: Language[];
  @Input() myLanguage: Language;
  @Output() newBookLanguage = new EventEmitter<Language>();
  @Output() newMyLanguage = new EventEmitter<Language>();
  @Output() newBookType = new EventEmitter<string>();
  @ViewChildren(TooltipDirective) tooltipDirective;
  tooltipOptions = {
    placement: 'top',
    'z-index': 9000,
    'hide-delay': 0
  };
  tooltip1: any;
  tooltip2: any;

  ngAfterViewInit() {
    this.tooltip1 = this.tooltipDirective.find(elem => elem.id === 'tooltip1');
    this.tooltip2 = this.tooltipDirective.find(elem => elem.id === 'tooltip2');
  }

  onBookLanguageSelected(lan: Language) {
    if (this.tooltip1) {
      this.tooltip1.hide();
    }
    this.newBookLanguage.emit(lan);
  }

  onMyLanguageSelected(lan: Language) {
    if (this.tooltip2) {
      this.tooltip2.hide();
    }
    this.newMyLanguage.emit(lan);
  }

  onChangeBookType(tpe: string) {
    this.newBookType.emit(tpe);
  }
}
