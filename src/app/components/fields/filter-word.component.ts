import {Component, Input, Output, OnInit, OnDestroy, EventEmitter} from '@angular/core';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {LanPair} from '../../models/course.model';
import {Filter, WordPair, WordPairDetail} from '../../models/exercise.model';
import 'rxjs/add/operator/takeWhile';

@Component({
  selector: 'km-filter-word',
  templateUrl: 'filter-word.component.html',
  styles: [`
    .wordlist {
      width: 250px; 
    }
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
  @Input() languagePair: LanPair;
  @Input() isFromStart = false;
  @Output() selectedWord = new EventEmitter<WordPairDetail>();
  wordpairs: WordPair[];
  componentActive = true;
  filter: Filter;
  totalWords = 0;
  selectedListWord: number;

  constructor(
    private buildService: BuildService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.filter = {
      word: '',
      languageId: this.languagePair.from,
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
      this.buildService
      .fetchWordPair(wordPair._id)
      .takeWhile(() => this.componentActive)
      .subscribe(
        data => {
          console.log('retrieved', data);
          this.selectedWord.emit(data);
        },
        error => this.errorService.handleError(error)
      );
    }
  }

  getWordList(filter: Filter) {
    console.log('fetch', filter);
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
