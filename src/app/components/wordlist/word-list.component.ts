import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../../services/user.service';
import { SharedService, awsPath } from '../../services/shared.service';
import { WordListService } from '../../services/word-list.service';
import { ReadnListenService } from '../../services/readnlisten.service';
import { takeWhile, filter } from 'rxjs/operators';
import { Book } from 'app/models/book.model';
import { Word, UserWord, WordTranslation, WordTranslations } from 'app/models/word.model';
import { Language } from '../../models/main.model';
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
  wordTranslations: WordTranslations[][] = [];
  bookType = 'read';
  userLanCode: string;
  bookLanguages: Language[];
  bookLan: Language;
  translationLan: Language;
  msg: string;
  isLoading = false;
  isError = false;
  errMsg = null;
  currentPage = 1;
  wordsPerPage = 5;
  nrOfPages: number;
  audioPath: string;
  isLoadingTranslations = false;

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
    this.goToPage(newPageNr);
  }

  onToggleMyWordList(word: Word) {
    console.log('toggle my word list', word);
    this.toggleMyWordList(word);
  }

  onNewTranslations(data: {translations: WordTranslations, i: number}) {
    console.log('new translations word list', data.translations, data.i);
    console.log('current translations', this.wordTranslations[this.currentPage - 1]);
    if (this.wordTranslations[this.currentPage - 1][data.i]) {
      this.wordTranslations[this.currentPage - 1][data.i].translations.push(...data.translations.translations);
    } else {
      this.wordTranslations[this.currentPage - 1][data.i] = data.translations;
    }
  }

  getCounter(nr: number): number[] {
    return new Array(nr);
  }

  private goToPage(newPageNr) {
    if (newPageNr > 0 && newPageNr <= this.nrOfPages) {
      this.displayWords = this.getWordsForPage(newPageNr);
      this.currentPage = newPageNr;
      if (!this.wordTranslations[this.currentPage - 1]) {
        this.isLoadingTranslations = true;
        this.getTranslations(this.currentPage);
      }
    }
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
        this.setBookLan(this.bookLanguages); // for omega wiki code
        this.words = data[1];
        this.userWords = data[2];
        this.processUserWords();
        this.audioPath = 'https://' + awsPath + 'words/' + this.book.lanCode + '/';
        console.log('words ', this.words);
        this.nrOfPages = this.words.length > 0 ? Math.floor((this.words.length - 1) / this.wordsPerPage) + 1 : 1;
        // this.displayWords = this.getWordsForPage(1);
        this.goToPage(1);
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

  private setTargetLan(userLans: Language[]) {
    console.log('get user lan', userLans);
    const lan = userLans.find(l => l.code === this.userLanCode);
    this.translationLan = lan;
  }

  private setBookLan(bookLans: Language[]) {
    console.log('get book lan', bookLans);
    const lan = bookLans.find(l => l.code === this.book.lanCode);
    this.bookLan = lan;
  }

  private getTranslations(pageNr: number) {
    // Get translations for words
    const words = this.displayWords.map(w => w.root ? w.root : w.word);
    this.wordListService
    .fetchTranslations(this.book.lanCode, words)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      wordTranslations => {
        // Place the translations in the right order
        let tl: WordTranslations;
        this.wordTranslations[pageNr - 1] = [];
        words.forEach((w, i) => {
          tl = wordTranslations.find(t => t.word === w);
          if (tl) {
            this.wordTranslations[pageNr - 1][i] = tl;
          } else {
            this.wordTranslations[pageNr - 1][i] = {
              lanCode: this.bookLan.code,
              word: w,
              translations: []
            }
          }
        });
        // this.wordTranslations[pageNr - 1] = wordTranslations;
        this.isLoadingTranslations = false;
        console.log('word translations', this.wordTranslations);
      }
    );
  }

  private getDependables(lan) {
    const options = {
      lan,
      component: 'WordListComponent',
      getTranslations: true,
      getLanguages: true
    };

    this.sharedService
    .fetchDependables(options)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      dependables => {
        this.text = this.sharedService.getTranslatedText(dependables.translations);
        this.sharedService.setPageTitle(this.text, 'WordList');
        this.getBookId();
        this.bookLanguages = dependables.bookLanguages;
        this.setTargetLan(dependables.userLanguages); // for omega wiki code
      }
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
