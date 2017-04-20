import {Component, Input, OnInit, OnDestroy} from '@angular/core';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {Filter, WordPair} from '../../models/question.model';
import 'rxjs/add/operator/takeWhile';

@Component({
  selector: 'km-filter-word',
  templateUrl: 'filter-word.component.html',
  styles: [`
    li {
      cursor:pointer;
    }
    .list-group-item.inactive:hover {
      background-color:#eee;
    }
    .scroll {
      overflow: auto;
      height: 100%;
    }
  `]
})

export class FilterWordComponent implements OnInit, OnDestroy {
  @Input() languageId: string;
  @Input() isFromStart = false;
  wordpairs: WordPair[];
  componentActive = true;
  filter: Filter;
  totalWords = 0;
  selectedListWord: number;
  selectedWordpair: WordPair;

  constructor(
    private buildService: BuildService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.filter = {
      word: '',
      languagePair: 'nl' + this.languageId.slice(0, 2),
      languageId: this.languageId,
      isFromStart: false
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

  getWordPair(i: number) {
    const wordPair: WordPair = this.wordpairs[i];
    if (wordPair) {
      console.log('fetching wordpair', wordPair);
      this.buildService
      .fetchWordPair(wordPair._id)
      .takeWhile(() => this.componentActive)
      .subscribe(
        wordpair => {
          console.log('retrieved', wordpair);
          this.selectedWordpair = wordPair;
        },
        error => this.errorService.handleError(error)
      );
    }
  }

  getWordList(filter: Filter) {
    console.log('fetch', filter);
    this.buildService
    .fetchFilterWordPairs(filter)
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
