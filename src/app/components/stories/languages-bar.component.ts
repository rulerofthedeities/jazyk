import { Component, Input, EventEmitter, Output, ViewChildren,
         OnInit, AfterViewInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { TooltipDirective } from 'ng2-tooltip-directive';
import { StoriesService } from '../../services/stories.service';
import { Language } from '../../models/main.model';
import { BookCount } from '../../models/book.model';
import { takeWhile } from 'rxjs/operators';
import { BehaviorSubject, Subject } from 'rxjs';

@Component({
  selector: 'km-languages-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'languages-bar.component.html',
  styleUrls: ['languages-bar.component.css']
})

export class BookLanguagesBarComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() private listType: Subject<string>; // read or listen or glossary
  @Input() text: Object = {};
  @Input() bookLanguages: Language[];
  @Input() bookLanguage: Language;
  @Input() targetLanguages: Language[];
  @Input() targetLanguage: Subject<Language>;
  @Output() newBookLanguage = new EventEmitter<Language>();
  @Output() newTargetLanguage = new EventEmitter<Language>();
  // @Output() newListType = new EventEmitter<string>();
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
  bookLanguageChanged: BehaviorSubject<Language>;

  constructor(
    private storiesService: StoriesService
  ) {}

  ngOnInit() {
    this.bookLanguageChanged = new BehaviorSubject(this.bookLanguage);
    this.observe();
  }

  ngAfterViewInit() {
    this.tooltip1 = this.tooltipDirective.find(elem => elem.id === 'tooltip1');
    this.tooltip2 = this.tooltipDirective.find(elem => elem.id === 'tooltip2');
  }

  onBookLanguageSelected(lan: Language) {
    if (this.tooltip1) {
      this.tooltip1.hide();
    }
    this.newBookLanguage.emit(lan);
  }

  onTargetLanguageSelected(lan: Language) {
    if (this.tooltip2) {
      this.tooltip2.hide();
    }
    this.newTargetLanguage.emit(lan);
  }

  private getBooksCount() {
    this.storiesService
    .fetchBooksCount(this.currentListType)
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

  observe() {
    this.listType
    .pipe(takeWhile( () => this.componentActive))
    .subscribe(tpe => {
      this.currentListType = tpe;
      this.bookLanguages.map(b => b.count = undefined); // clear data
      this.getBooksCount();
    });
  }

  ngOnDestroy() {
    this.componentActive = false;
    if (this.tooltip1) {
      this.tooltip1.hide();
    }
    if (this.tooltip2) {
      this.tooltip2.hide();
    }
  }
}
