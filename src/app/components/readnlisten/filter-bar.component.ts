import { Component, Input, EventEmitter, Output } from '@angular/core';
import { ViewFilter } from '../../models/book.model';

@Component({
  selector: 'km-filter-bar',
  templateUrl: 'filter-bar.component.html',
  styleUrls: ['filter-bar.component.css']
})

export class BookFilterBarComponent {
  @Input() text: Object = {};
  @Input() hasBooks: boolean;
  @Input() itemTxt: string;
  @Input() filterTxt: string;
  @Output() newSort = new EventEmitter<string>();
  @Output() newFilter = new EventEmitter<ViewFilter>();
  showDropDown = false;
  filter: ViewFilter = {
      hideCompleted: false,
      hideNotTranslated: false
    };

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
