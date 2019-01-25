import { Component, Input, OnChanges, Output, EventEmitter, ElementRef, Renderer2 } from '@angular/core';
import { Language } from '../../models/main.model';

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

  constructor(
    elementRef: ElementRef,
    renderer: Renderer2
  ) {
    renderer.listen(document, 'click', (event) => {
      if (!elementRef.nativeElement.contains(event.target)) {
        // Outside dropdown, close dropdown
        this.showDropdown = false;
      }
    });
  }

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

  showCount(lan: Language): string {
    if (lan && lan.count !== undefined) {
      return `(${lan.count})`;
    }
  }
}
