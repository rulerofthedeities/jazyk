import { Component, Input, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'km-filter-bar',
  templateUrl: 'filter-bar.component.html',
  styleUrls: ['filter-bar.component.css']
})

export class BookFilterBarComponent {
  @Input() text: Object = {};
  @Input() hasBooks: boolean;
  @Input() itemTxt: string;
  @Output() newSort = new EventEmitter<string>();

  onChangeSort(sort: string) {
    this.newSort.emit(sort);
  }
}
