import {Component, Input, OnChanges, Output, EventEmitter, HostListener, ElementRef} from '@angular/core';
import {Language} from '../../models/course.model';

@Component({
  selector: 'km-language-selector',
  templateUrl: 'language-selector.component.html',
  styleUrls: ['selector.css']
})
export class LanguageSelectorComponent implements OnChanges {
  @Input() languages: [Language];
  @Input() private currentLanguage: Language;
  @Input() disabled = false;
  @Input() text: Object = {};
  @Output() languageSelected = new EventEmitter<Language>();
  selectedLanguage: Language;
  showDropdown = false;
  dataReady = false;
  selectedDropdown: string; // For color indicator of hovered language in dropdown

  @HostListener('document:click', ['$event'])
  clickout(event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      // Outside dropdown, close dropdown
      this.showDropdown = false;
    }
  }

  constructor(
    private elementRef: ElementRef
  ) {}

  ngOnChanges() {
    this.selectedLanguage = this.currentLanguage;
    this.dataReady = true;
  }

  onToggleDropdown() {
    if (!this.disabled) {
      this.showDropdown = !this.showDropdown;
      this.selectedDropdown = this.selectedLanguage.code;
    }
  }

  onSelectLanguage(newLanguage: Language) {
    this.selectedLanguage = newLanguage;
    this.selectedDropdown = newLanguage.code;
    this.showDropdown = false;
    this.languageSelected.emit(newLanguage);
  }

  onHoverLanguage(hoveredLanguage: Language) {
    this.selectedDropdown = hoveredLanguage.code;
  }
}
