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
  @Output() selectedWord = new EventEmitter<WordPairDetail>();
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
    this.wordpairs = [];
    this.selectedListWord = null;
    this.getWordList(this.filter);
  }

  showListWord(wordpair: WordPair): string {
    // Display filtered word in list
    const lan = this.filter.languageId.slice(0, 2);
    let word = '';
    if (wordpair[lan]) {
      word = wordpair[lan].word;
    }
    return word;
  }

  selectListWord(i: number) {
    this.selectedListWord = i;
    this.getWordPair(i);
  }

  private getWordPair(i: number) {
    const wordPair: WordPair = this.wordpairs[i];
    console.log('word selected', this.wordpairs[i]);
    if (wordPair) {
      this.buildService
      .fetchWordPairDetail(wordPair._id)
      .takeWhile(() => this.componentActive)
      .subscribe(
        (data: WordPairDetail) => {
          if (data) {
            data._id = wordPair._id;
            this.selectedWord.emit(data);
          } else {
            console.log('Error finding data for wordpair id ' + wordPair._id);
          }
        },
        error => this.errorService.handleError(error)
      );
    }
  }

  private getWordList(filter: Filter) {
    this.buildService
    .fetchFilterWordPairs(filter, this.languagePair)
    .takeWhile(() => this.componentActive)
    .subscribe(
      (data) => {
        this.wordpairs = data.wordpairs;
        this.totalWords = data.total;
      },
      error => this.errorService.handleError(error)
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
