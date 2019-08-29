import { Component, Input, Output, OnInit, EventEmitter,
         ElementRef, Renderer2, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { Language } from '../../models/main.model';
import { PlatformService } from '../../services/platform.service';
import { takeWhile } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'km-language-selector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'language-selector.component.html',
  styleUrls: ['selector.css']
})
export class LanguageSelectorComponent implements OnInit, OnDestroy {
  @Input() languages: [Language];
  @Input() private language: Subject<Language>;
  @Input() disabled = false;
  @Input() text: Object = {};
  @Output() languageSelected = new EventEmitter<Language>();
  private componentActive = true;
  selectedLanguage: Language;
  showDropdown = false;
  dataReady = false;
  selectedDropdown: string; // For color indicator of hovered language in dropdown

  constructor(
    elementRef: ElementRef,
    private platform: PlatformService,
    renderer: Renderer2
  ) {
    if (this.platform.isBrowser) {
      renderer.listen(document, 'click', (event) => {
        if (this.platform.isBrowser) {
          if (!elementRef.nativeElement.contains(event.target)) {
            // Outside dropdown, close dropdown
            this.showDropdown = false;
          }
        }
      });
    }
  }

  ngOnInit() {
    this.observe();
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

  observe() {
    this.language
    .pipe(takeWhile( () => this.componentActive))
    .subscribe(lan => {
      this.selectedLanguage = lan;
      this.dataReady = true;
    });
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
