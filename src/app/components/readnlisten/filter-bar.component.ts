import { Component, Input, EventEmitter, Output, Renderer2, ViewChild, ElementRef, OnInit, OnChanges } from '@angular/core';
import { FilterService } from '../../services/filter.service';
import { Option } from '../../models/main.model';
import { ViewFilter } from '../../models/book.model';



@Component({
  selector: 'km-filter-bar',
  templateUrl: 'filter-bar.component.html',
  styleUrls: ['filter-bar.component.css']
})

export class BookFilterBarComponent implements OnInit, OnChanges {
  @Input() text: Object = {};
  @Input() hasBooks: boolean;
  @Input() bookType: string;
  @Input() itemTxt: string;
  @Output() newSort = new EventEmitter<string>();
  @Output() newFilter = new EventEmitter<ViewFilter>();
  @ViewChild('dropdown') dropdown: ElementRef;
  showDropDown = false;
  sort: string;
  sortOptions: Option[];
  hasFilter = false;
  filterTxt: string;
  filter: ViewFilter;

  constructor(
    private filterService: FilterService,
    renderer: Renderer2
  ) {
    renderer.listen(document, 'click', (event) => {
      if (this.dropdown && !this.dropdown.nativeElement.contains(event.target)) {
        // Outside filter dropdown, close dropdown
        this.showDropDown = false;
      }
    });
  }

  ngOnInit() {
    this.sort = this.filterService.sort[this.bookType];
    this.sortOptions = this.filterService.getSortOptions(this.text);
  }

  ngOnChanges() {
    this.filter = this.filterService.filter[this.bookType];
    this.filterTxt = this.filterService.filterTxt[this.bookType];
    this.hasFilter = this.filterService.hasFilter[this.bookType];
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
    this.changeFilter();
  }

  onClearFilter() {
    this.filterService.clearFilter(this.bookType);
    this.changeFilter();
  }

  private changeFilter() {
    const filter = this.filterService.filter[this.bookType];
    if (filter.hideEasy && filter.hideMedium && filter.hideAdvanced) {
      filter.hideEasy = false;
      filter.hideMedium = false;
      filter.hideAdvanced = false;
    } else {
      this.newFilter.emit(filter);
    }
  }
}
