import {Component, Input, Output, OnInit, OnDestroy, EventEmitter} from '@angular/core';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {LanPair} from '../../models/course.model';
import {Filter, WordPair, WordPairDetail} from '../../models/exercise.model';
import 'rxjs/add/operator/takeWhile';

@Component({
  selector: 'km-filter-list',
  templateUrl: 'filter-list.component.html',
  styleUrls: ['filter-list.component.css']
})

export class FilterListComponent implements OnInit, OnDestroy {
  @Input() languagePair: LanPair;
  @Output() selectedWord = new EventEmitter<WordPairDetail>();
  private componentActive = true;
  filter: Filter;
  wordpairs: WordPair[];
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
  }

  // Entry point from lesson component
  filterUpdated(filter: Filter) {
    this.filter = filter;
    this.selectedListWord = null;
    this.getWordList(filter);
  }

  selectListWord(i: number) {
    this.selectedListWord = i;
    this.getWordPair(i);
  }

  showListWord(wordpair: WordPair): string {
    // Display filtered word in list
    const lan = this.filter.languageId;
    let word = '';
    if (wordpair[lan]) {
      word = wordpair[lan].word;
    }
    return word;
  }

  private getWordPair(i: number) {
    const wordPair: WordPair = this.wordpairs[i];
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
    this.wordpairs = [];
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
