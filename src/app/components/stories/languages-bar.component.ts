import { Component, Input, EventEmitter, Output, ViewChildren, OnInit, OnChanges, AfterViewInit, OnDestroy } from '@angular/core';
import { TooltipDirective } from 'ng2-tooltip-directive';
import { StoriesService } from '../../services/stories.service';
import { Language } from '../../models/main.model';
import { BookCount } from '../../models/book.model';
import { takeWhile } from 'rxjs/operators';

@Component({
  selector: 'km-languages-bar',
  templateUrl: 'languages-bar.component.html',
  styleUrls: ['languages-bar.component.css']
})

export class BookLanguagesBarComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {
  @Input() listType: string; // read or listen or glossary
  @Input() text: Object = {};
  @Input() bookLanguages: Language[];
  @Input() bookLanguage: Language;
  @Input() myLanguages: Language[];
  @Input() myLanguage: Language;
  @Output() newBookLanguage = new EventEmitter<Language>();
  @Output() newMyLanguage = new EventEmitter<Language>();
  @Output() newListType = new EventEmitter<string>();
  @ViewChildren(TooltipDirective) tooltipDirective: TooltipDirective[];
  private componentActive = true;
  tooltipOptions = {
    placement: 'top',
    'z-index': 9000,
    'hide-delay': 0
  };
  tooltip1: any;
  tooltip2: any;
  currentListType: string;

  constructor(
    private storiesService: StoriesService
  ) {}

  ngOnInit() {
    this.currentListType = this.listType;
    this.getBooksCount();
  }

  ngOnChanges() {
    if (this.listType !== this.currentListType) {
      this.currentListType = this.listType;
      this.bookLanguages.map(b => b.count = undefined); // clear data
      this.getBooksCount();
    }
  }

  ngAfterViewInit() {
    this.tooltip1 = this.tooltipDirective.find(elem => elem.id === 'tooltip1');
    this.tooltip2 = this.tooltipDirective.find(elem => elem.id === 'tooltip2');
  }

  onChangeListType(tpe: string) {
    this.listType = tpe;
    this.newListType.emit(tpe);
  }

  onBookLanguageSelected(lan: Language) {
    if (this.tooltip1) {
      this.tooltip1.hide();
    }
    this.newBookLanguage.emit(lan);
  }

  onMyLanguageSelected(lan: Language) {
    if (this.tooltip2) {
      this.tooltip2.hide();
    }
    this.newMyLanguage.emit(lan);
  }

  private getBooksCount() {
    this.storiesService
    .fetchBooksCount(this.listType)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      (count: BookCount[]) => this.addCountToLanguages(count)
    );
  }

  private addCountToLanguages(count: BookCount[]) {
    let lan: Language;
    count.forEach(c => {
      lan = this.bookLanguages.find(b => b.code === c.lanCode);
      if (lan) {
        lan.count = c.count;
      }
    });
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
