import {Component, Input, Output, OnInit, OnDestroy, EventEmitter} from '@angular/core';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {LanPair} from '../../models/course.model';
import {Filter, WordPair, WordPairDetail} from '../../models/word.model';
import 'rxjs/add/operator/takeWhile';

@Component({
  selector: 'km-filter-list',
  templateUrl: 'filter-list.component.html',
  styleUrls: ['filter-list.component.css']
})

export class FilterListComponent implements OnInit, OnDestroy {
  @Input() languagePair: LanPair;
  @Input() languageId: string;
  @Input() wordpairs: WordPair[];
  @Output() selectedWord = new EventEmitter<WordPairDetail>();
  @Output() close = new EventEmitter<boolean>();
  private componentActive = true;
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

  selectListWord(i: number) {
    this.selectedListWord = i;
    this.getWordPairDetails(i);
  }

  onClose() {
    this.close.emit(true);
  }

  showListWord(wordpair: WordPair): string {
    // Display filtered word in list
    let lan = this.languageId;
    let word = '';
    if (wordpair[lan]) {
      word = wordpair[lan].word;
    }
    lan = lan === this.languagePair.from ? this.languagePair.to : this.languagePair.from;
    if (wordpair[lan]) {
      word = word + ' (' + wordpair[lan].word + ')';
    }
    return word;
  }

  private getWordPairDetails(i: number) {
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

  ngOnDestroy() {
    this.componentActive = false;
  }
}
