import {Component, Input, Output, OnInit, OnDestroy, EventEmitter} from '@angular/core';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {LanPair} from '../../models/course.model';
import {Filter, WordPair, WordPairDetail} from '../../models/exercise.model';
import 'rxjs/add/operator/takeWhile';

@Component({
  selector: 'km-filter-word',
  templateUrl: 'filter-word.component.html',
  styleUrls: ['filter-word.component.css']
})

export class FilterWordComponent implements OnInit, OnDestroy {
  @Input() languagePair: LanPair;
  @Input() isFromStart = false;
  @Input() isExact = false;
  @Output() selectedFilter = new EventEmitter<Filter>();
  private componentActive = true;
  wordpairs: WordPair[];
  filter: Filter;
  totalWords = 0;
  selectedListWord: number;

  constructor(
    private buildService: BuildService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.languagePair = {
      from: this.languagePair.from.slice(0, 2),
      to: this.languagePair.to.slice(0, 2)
    };
    this.filter = {
      word: '',
      languageId: this.languagePair.to,
      isFromStart: this.isFromStart,
      isExact: this.isExact
    };
  }

  onFilterChanged() {
    console.log('emitting filter', this.filter);
    this.selectedFilter.emit(this.filter);
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
