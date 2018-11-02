import { Component, Input, EventEmitter, Output, Renderer2, ViewChild, ElementRef } from '@angular/core';
import { ViewFilter } from '../../models/book.model';

@Component({
  selector: 'km-filter-bar',
  templateUrl: 'filter-bar.component.html',
  styleUrls: ['filter-bar.component.css']
})

export class BookFilterBarComponent {
  @Input() text: Object = {};
  @Input() hasBooks: boolean;
  @Input() filter: ViewFilter;
  @Input() itemTxt: string;
  @Input() filterTxt: string;
  @Output() newSort = new EventEmitter<string>();
  @Output() newFilter = new EventEmitter<ViewFilter>();
  @ViewChild('dropdown') dropdown: ElementRef;
  showDropDown = false;

  constructor(
    renderer: Renderer2
  ) {
    renderer.listen(document, 'click', (event) => {
      if (this.dropdown && !this.dropdown.nativeElement.contains(event.target)) {
        // Outside filter dropdown, close dropdown
        this.showDropDown = false;
      }
    });
  }

  onChangeSort(sort: string) {
    this.newSort.emit(sort);
  }

  onShowDropDown(show: boolean) {
    this.showDropDown = show;
  }

  onToggleDropDown() {
    this.showDropDown = ! this.showDropDown;
  }

  onSelectDropdown() {
    event.stopPropagation();
  }

  onChangeFilter() {
    this.newFilter.emit(this.filter);
  }
}
