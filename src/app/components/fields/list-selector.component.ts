import { Component, Input, OnInit, OnChanges, Output, EventEmitter, ElementRef, Renderer2 } from '@angular/core';
import { Language } from '../../models/main.model';
import { PlatformService } from '../../services/platform.service';
import { Map } from '../../models/main.model';

@Component({
  selector: 'km-list-selector',
  templateUrl: 'list-selector.component.html',
  styleUrls: ['selector.css']
})
export class ListSelectorComponent implements OnInit, OnChanges {
  @Input() private currentList: string;
  @Input() disabled = false;
  @Input() text: Object = {};
  @Output() listSelected = new EventEmitter<string>();
  lists: string[];
  icons: string[];
  listNames: Map<string> = {};
  selectedList: string;
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
    this.icons = ['book', 'volume-up', 'list'];
    this.lists = ['read', 'listen', 'glossary'];
    this.listNames['read'] = this.text['Read'];
    this.listNames['listen'] = this.text['Listen'];
    this.listNames['glossary'] = this.text['Glossaries'];
  }

  ngOnChanges() {
    this.selectedList = this.currentList;
    this.dataReady = true;
  }

  onToggleDropdown() {
    if (!this.disabled) {
      this.showDropdown = !this.showDropdown;
      this.selectedDropdown = this.selectedList;
    }
  }

  onSelectList(newList: string) {
    this.selectedList = newList;
    this.selectedDropdown = newList;
    this.showDropdown = false;
    this.listSelected.emit(newList);
  }

  onHoverList(hoveredLanguage: Language) {
    this.selectedDropdown = hoveredLanguage.code;
  }

  showCount(lan: Language): string {
    if (lan && lan.count !== undefined) {
      return `(${lan.count})`;
    }
  }
}
