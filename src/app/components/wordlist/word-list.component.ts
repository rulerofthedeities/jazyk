import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../../services/user.service';
import { SharedService, awsPath } from '../../services/shared.service';
import { WordListService } from '../../services/word-list.service';
import { ReadnListenService } from '../../services/readnlisten.service';
import { takeWhile, filter } from 'rxjs/operators';
import { Book } from 'app/models/book.model';
import { Word, UserWord } from 'app/models/word.model';
import { zip } from 'rxjs';

@Component({
  templateUrl: 'word-list.component.html',
  styleUrls: ['word-list.component.css']
})

export class BookWordListComponent implements OnInit, OnDestroy {
  private componentActive = true;
  text: Object;
  book: Book;
  bookId: string;
  words: Word[];
  userWords: UserWord[];
  displayWords: Word[];
  bookType = 'read';
  userLanCode: string;
  msg: string;
  isLoading = false;
  isError = false;
  errMsg = null;
  currentPage = 1;
  wordsPerPage = 5;
  nrOfPages: number;
  audioPath: string;

  constructor(
    private route: ActivatedRoute,
    private sharedService: SharedService,
    private userService: UserService,
    private readnListenService: ReadnListenService,
    private wordListService: WordListService
  ) {}

  ngOnInit() {
    this.getBookType();
    this.getDependables(this.userService.user.main.lan);
  }

  onGoToPage(newPageNr) {
    if (newPageNr > 0 && newPageNr <= this.nrOfPages) {
      this.displayWords = this.getWordsForPage(newPageNr);
      this.currentPage = newPageNr;
    }
  }

  onToggleMyWordList(word: Word) {
    console.log('toggle my word list', word);
    this.toggleMyWordList(word);
  }

  getCounter(nr: number): number[] {
    return new Array(nr);
  }

  private toggleMyWordList(word: Word) {
    console.log('pin', !word.pinned);
    word.pinned = !word.pinned;
    this.wordListService
    .pinWord(word, this.book._id, word.pinned)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(newWord => {
      console.log('toggle', newWord);
      if (newWord) {
        word.pinned = newWord.pinned;
      }
    });
  }

  private getBookType() {
    // read or listen
    this.route
    .data
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(data => {
      this.bookType = data.tpe;
    });
  }

  private getWordsForPage(pageNr: number): Word[] {
    const start = (pageNr - 1) * this.wordsPerPage;
    return this.words.slice(start, start + this.wordsPerPage);
  }

  private processNewBookId() {
    if (this.bookId && this.bookId.length === 24) {
      this.isLoading = true;
      zip(
        this.readnListenService.fetchBook(this.bookId, this.bookType || 'read'),
        this.wordListService.fetchWordList(this.bookId),
        this.wordListService.fetchUserWordList(this.bookId)
      )
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(data => {
        this.book = data[0];
        this.words = data[1];
        this.userWords = data[2];
        this.processUserWords();
        this.audioPath = 'https://' + awsPath + 'words/' + this.book.lanCode + '/';
        console.log('words ', this.words);
        this.nrOfPages = this.words.length > 0 ? Math.floor((this.words.length - 1) / this.wordsPerPage) + 1 : 1;
        this.displayWords = this.getWordsForPage(1);
        this.isLoading = false;
      },
      error => {
        this.isLoading = false;
        this.isError = true;
        this.errMsg = this.text['ErrorLoadingWordList'];
      }
      );
    } else {
      this.msg = this.text['InvalidBookId'];
    }
  }

  private processUserWords() {
    let word: Word;
    // Map user word pins to words
    this.userWords.forEach(uWord => {
      word = this.words.find(w => w._id.toString() === uWord.wordId.toString());
      if (word) {
        word.pinned = uWord.pinned;
      }
    });
  }

  private getBookId() {
    this.route.params
    .pipe(
      takeWhile(() => this.componentActive),
      filter(params => params.id))
    .subscribe(
      params => {
        this.bookId = params['id'];
        this.userLanCode = params['lan'];
        this.processNewBookId();
      }
    );
  }

  private getDependables(lan) {
    const options = {
      lan,
      component: 'WordListComponent',
      getTranslations: true
    };

    this.sharedService
    .fetchDependables(options)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      dependables => {
        this.text = this.sharedService.getTranslatedText(dependables.translations);
        this.sharedService.setPageTitle(this.text, 'WordList');
        this.getBookId();
      }
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
