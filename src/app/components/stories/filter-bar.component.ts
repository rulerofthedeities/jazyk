import { Component, Input, EventEmitter, Output, Renderer2, ViewChild,
         ElementRef, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FilterService } from '../../services/filter.service';
import { PlatformService } from '../../services/platform.service';
import { SharedService } from '../../services/shared.service';
import { Option } from '../../models/main.model';
import { ViewFilter } from '../../models/book.model';
import { Subject } from 'rxjs';
import { takeWhile } from 'rxjs/operators';

@Component({
  selector: 'km-filter-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'filter-bar.component.html',
  styleUrls: ['filter-bar.component.css']
})

export class BookFilterBarComponent implements OnInit, OnDestroy {
  @Input() text: Object = {};
  @Input() hasBooks: boolean;
  @Input() listType: string;
  @Input() itemTxt: string;
  @Input() filterChanged: Subject<boolean>;
  @Input() searchChanged: Subject<boolean>;
  @Output() newSort = new EventEmitter<string>();
  @Output() newFilter = new EventEmitter<ViewFilter>();
  @Output() newSearch = new EventEmitter<string>();
  @ViewChild('dropdown') dropdown: ElementRef;
  @ViewChild('searchbox') query: ElementRef;
  private componentActive = true;
  showDropDown = false;
  sort: string;
  sortOptions: Option[];
  hasFilter = false;
  filterTxt: string;
  filter: ViewFilter;
  searchActive = false;
  hasSearch = false;
  searchTxt: string;
  search: string;

  constructor(
    private cdr: ChangeDetectorRef,
    private filterService: FilterService,
    private sharedService: SharedService,
    private platform: PlatformService,
    renderer: Renderer2
  ) {
    if (this.platform.isBrowser) {
      renderer.listen(document, 'click', (event) => {
        if (this.dropdown && !this.dropdown.nativeElement.contains(event.target)) {
          // Outside filter dropdown, close dropdown
          this.showDropDown = false;
        }
      });
    }
  }

  ngOnInit() {
    this.sort = this.filterService.sort[this.listType];
    this.sortOptions = this.filterService.getSortOptions(this.text);
    this.checkFilterChanged();
  }

  onKeyPressed(key: string) {
    if (key === 'Enter') {
      if (this.searchActive && this.query && this.query.nativeElement.value) {
        this.doSearch(this.query.nativeElement.value);
      }
    }
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

  onSelectDropdown(event: MouseEvent) {
    event.stopPropagation();
  }

  onChangeFilter() {
    this.changeFilter();
  }

  onClearFilter() {
    this.filterService.clearFilter(this.listType);
    this.changeFilter();
  }

  onActivateSearch() {
    this.searchActive = true;
  }

  onSearch(query: string) {
    this.doSearch(query);
  }

  onCancelSearch() {
    this.searchActive = false;
    this.hasSearch = false;
    this.newSearch.emit('');
  }

  private doSearch(query: string) {
    this.newSearch.emit(query.trim());
    this.hasSearch = true;
  }

  private checkFilterChanged() {
    this.filterChanged
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(event => {
      this.filter = this.filterService.filter[this.listType];
      this.filterTxt = this.filterService.filterTxt[this.listType];
      this.hasFilter = this.filterService.hasFilter[this.listType];
      this.sharedService.detectChanges(this.cdr);
    });
    this.searchChanged
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(event => {
      this.search = this.filterService.search[this.listType];
      this.searchTxt = this.filterService.searchTxt[this.listType];
      this.hasSearch = this.filterService.hasSearch[this.listType];
      this.sharedService.detectChanges(this.cdr);
    });
  }

  private changeFilter() {
    const filter = this.filterService.filter[this.listType];
    if (filter.hideEasy && filter.hideMedium && filter.hideAdvanced) {
      filter.hideEasy = false;
      filter.hideMedium = false;
      filter.hideAdvanced = false;
    } else {
      this.newFilter.emit(filter);
    }
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
