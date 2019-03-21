import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../../services/user.service';
import { SharedService, awsPath } from '../../services/shared.service';
import { WordListService } from '../../services/word-list.service';
import { ReadnListenService } from '../../services/readnlisten.service';
import { TranslationService } from '../../services/translation.service';
import { takeWhile, filter } from 'rxjs/operators';
import { Book } from 'app/models/book.model';
import { Word, UserWord, WordTranslations, WordTranslation } from 'app/models/word.model';
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
  hasOmegaWikiTranslations: boolean[][] = [];
  hasDeepLTranslations: boolean[][] = [];
  isDeeplAvailable = false;
  canEdit = false;
  userId: string;

  constructor(
    private route: ActivatedRoute,
    private sharedService: SharedService,
    private userService: UserService,
    private readnListenService: ReadnListenService,
    private wordListService: WordListService,
    private translationService: TranslationService
  ) {}

  ngOnInit() {
    this.canEdit = this.userService.user.isAdmin;
    this.userId = this.userService.user._id;
    console.log('canEdit', this.userService.user, this.canEdit, this.userId);
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
    this.sortTranslations(this.wordTranslations[this.currentPage - 1][data.i]);
    data.translations.translations.forEach(tl => {
      if (tl.source === 'OmegaWiki') {
        this.hasOmegaWikiTranslations[this.currentPage - 1][data.i] = true;
      } else if (tl.source === 'DeepL') {
        this.hasDeepLTranslations[this.currentPage - 1][data.i] = true;
      }
    });
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
        this.checkDeepLTranslationAvailability();
        this.words = data[1];
        this.userWords = data[2];
        this.processUserWords();
        this.audioPath = 'https://' + awsPath + 'words/' + this.book.lanCode + '/';
        console.log('words ', this.words);
        this.nrOfPages = this.words.length > 0 ? Math.floor((this.words.length - 1) / this.wordsPerPage) + 1 : 1;
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
    this.wordTranslations[pageNr - 1] = [];
    this.hasOmegaWikiTranslations[pageNr - 1] = [];
    this.hasDeepLTranslations[pageNr - 1] = [];
    const words = this.displayWords.map(w => w.root ? w.root : w.word);
    this.translationService
    .fetchTranslations(this.book, this.userLanCode, words)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      wordTranslations => {
        console.log('WT', wordTranslations);
        // Only translations in target language
        wordTranslations.forEach(wt => {
          wt.translations = wt.translations.filter(tl => tl.lanCode === this.userLanCode)
        });
        // Place the translations in the right order
        let tl: WordTranslations;
        words.forEach((w, i) => {
          tl = wordTranslations.find(t => t.word === w);
          if (tl) {
            this.sortTranslations(tl);
            this.wordTranslations[pageNr - 1][i] = tl;
            // Check if omegaWiki translation button should be shown
            const omegaWikiTranslations = tl.translations.filter(tl2 => tl2.source === 'OmegaWiki');
            if (omegaWikiTranslations.length > 0) {
              this.hasOmegaWikiTranslations[pageNr - 1][i] = true;
            }
            // Check if deepL translation button can be shown
            const deepLTranslations = tl.translations.filter(tl2 => tl2.source === 'DeepL');
            if (deepLTranslations.length > 0) {
              this.hasDeepLTranslations[pageNr - 1][i] = true;
            }
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

  private sortTranslations(translations: WordTranslations) {
    // Push Jazyk translations to top
    const tmpTranslations: WordTranslation[] = [];
    translations.translations.forEach(tl => {
      if (tl.source === 'Jazyk') {
        tmpTranslations.unshift(tl);
      } else {
        tmpTranslations.push(tl);
      }
    });
    translations.translations = tmpTranslations;
    console.log('resorted', tmpTranslations);
  }

  private checkDeepLTranslationAvailability() {
    // Check if both source and target languages are available in deepl
    const deeplLanguages = this.translationService.getMachineLanguages('deepl');
    if (deeplLanguages.includes(this.userLanCode) && deeplLanguages.includes(this.book.lanCode)) {
      this.isDeeplAvailable = true;
    }
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
