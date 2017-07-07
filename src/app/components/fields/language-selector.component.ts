import {Component, Input, OnInit, Output, EventEmitter} from '@angular/core';
import {Language} from '../../models/course.model';

@Component({
  selector: 'km-language-selector',
  templateUrl: 'language-selector.component.html',
  styleUrls: ['language-selector.component.css']
})
export class LanguageSelectorComponent implements OnInit {
  @Input() languages: [Language];
  @Input() private currentLanguage: Language;
  @Input() disabled = false;
  @Input() text: Object = {};
  @Output() languageSelected = new EventEmitter<Language>();
  selectedLanguage: Language;
  showDropdown = false;
  dataReady = false;
  selectedDropdown: string; // For color indicator of hovered language in dropdown

  ngOnInit() {
    this.setSelectedLanguage(this.currentLanguage);
    this.dataReady = true;
  }

  toggleDropdown() {
    if (!this.disabled) {
      this.showDropdown = !this.showDropdown;
      this.selectedDropdown = this.selectedLanguage._id;
    }
  }

  selectLanguage(newLanguage: Language) {
    this.selectedLanguage = newLanguage;
    this.selectedDropdown = newLanguage._id;
    this.showDropdown = false;
    this.languageSelected.emit(newLanguage);
  }

  hoverLanguage(hoveredLanguage: Language) {
    this.selectedDropdown = hoveredLanguage._id;
  }

  private setSelectedLanguage(currentLanguage: Language) {
    if (this.languages && currentLanguage) {
      this.selectedLanguage = this.languages.filter( language => language._id === currentLanguage._id)[0];
    }
  }
}
