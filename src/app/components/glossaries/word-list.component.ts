import { Component, OnInit, OnDestroy, AfterViewInit, ViewChildren } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TooltipDirective } from 'ng2-tooltip-directive';
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

export class BookWordListComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChildren(TooltipDirective) tooltipDirective;
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
  userLanguages: Language[];
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
  hasMSTranslations: boolean[][] = [];
  isDeeplAvailable = false;
  canEdit = false;
  userId: string;
  noTranslation: {msg: string, i: number};
  editingTranslationId: string;
  tooltipOptions = {
    placement: 'top',
    'z-index': 9000,
    'hide-delay': 0
  };
  tooltip: any;

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private sharedService: SharedService,
    private userService: UserService,
    private readnListenService: ReadnListenService,
    private wordListService: WordListService,
    private translationService: TranslationService
  ) {}

  ngOnInit() {
    this.canEdit = this.userService.user.isAdmin;
    this.userId = this.userService.user._id;
    this.clearNoTranslationMsg();
    this.getBookType();
    this.getDependables(this.userService.user.main.lan);
  }

  ngAfterViewInit() {
    this.tooltip = this.tooltipDirective.find(elem => elem.id === 'tooltip1');
  }

  onGoToPage(newPageNr) {
    this.clearNoTranslationMsg();
    this.goToPage(newPageNr);
  }

  onAddToMyWordList(word: Word, i: number) {
    if (!word.pinned) {
      const translations = this.wordTranslations ? this.wordTranslations[this.currentPage - 1][i] : null,
            summary = this.wordListService.createTranslationsSummary(translations, '|');
      this.addToMyWordList(word, summary);
    }
  }

  onNewTranslations(data: {translations: WordTranslations, i: number}) {
    this.clearNoTranslationMsg();
    this.editingTranslationId = null;
    let currentTranslation = this.wordTranslations[this.currentPage - 1][data.i];
    if (currentTranslation) {
      currentTranslation.translations.push(...data.translations.translations);
    } else {
      currentTranslation = data.translations;
    }
    currentTranslation.summary = this.wordListService.createTranslationsSummary(currentTranslation);
    this.sortTranslations(currentTranslation);
    data.translations.translations.forEach(tl => {
      if (tl.source === 'OmegaWiki') {
        this.hasOmegaWikiTranslations[this.currentPage - 1][data.i] = true;
      } else if (tl.source === 'DeepL') {
        this.hasDeepLTranslations[this.currentPage - 1][data.i] = true;
      } else if (tl.source === 'Microsoft') {
        this.hasMSTranslations[this.currentPage - 1][data.i] = true;
      }
    });
  }

  onUpdatedTranslation(data: {translations: WordTranslations, i: number}) {
    this.clearNoTranslationMsg();
    this.editingTranslationId = null;
    this.wordTranslations[this.currentPage - 1][data.i].translations = data.translations.translations;
  }

  onNoTranslations(data: {msg: string, i: number}) {
    this.noTranslation = {msg: data.msg, i: data.i};
  }

  onEditTranslation(i: number, translation: WordTranslation) {
    this.clearNoTranslationMsg();
    if (this.canEdit) {
      this.editingTranslationId = translation._id;
    }
  }

  onRemoveTranslation(i: number, translation: WordTranslation) {
    this.clearNoTranslationMsg();
    if (this.canEdit) {
      this.removeTranslation(this.wordTranslations[this.currentPage - 1][i]._id, translation._id);
    }
  }

  onCancelTranslation() {
    this.editingTranslationId = null;
  }

  onExpand(word: Word, expand: boolean) {
    word.expanded = expand;
  }

  onMyLanguageSelected(lan: Language) {
    if (this.tooltip) {
      this.tooltip.hide();
    }
    this.userLanCode = lan.code;
    this.location.go(`/glossaries/glossary/${this.bookId}/${this.userLanCode}`);
    this.processUserWords();
    this.getTranslations(this.currentPage);
  }

  getCounter(nr: number): number[] {
    return new Array(nr);
  }

  private clearNoTranslationMsg() {
    this.noTranslation = {msg: '', i: 0};
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

  private addToMyWordList(word: Word, summary: string) {
    word.pinned = true;
    word.targetLanCode = this.userLanCode;
    this.wordListService
    .pinWord(word, this.book._id, summary, word.pinned)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(newWord => {
      if (newWord) {
        word.pinned = true;
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
        this.nrOfPages = this.words.length > 0 ? Math.floor((this.words.length - 1) / this.wordsPerPage) + 1 : 1;
        this.setPaginationLetters();
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

  setPaginationLetters() {
    // TODO: if same as previous, use more than one letter!!
    let wordIndex = 0;
    for(let i = 0; i < this.nrOfPages; i++) {
      wordIndex = i * this.wordsPerPage;
      // console.log('page letter', wordIndex, this.words[wordIndex].sortWord[0]);
    }
  }

  private processUserWords() {
    let word: Word;
    this.userWords.forEach(uWord => {
      word = this.words.find(w => w._id.toString() === uWord.wordId.toString());
      if (word) {
        const translation = uWord.translations.find(tl => tl.lanCode === this.userLanCode);
        if (translation) {
          word.pinned = translation.pinned;
        } else {
          word.pinned = false;
        }
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
    const lan = userLans.find(l => l.code === this.userLanCode);
    this.translationLan = lan;
  }

  private setBookLan(bookLans: Language[]) {
    const lan = bookLans.find(l => l.code === this.book.lanCode);
    this.bookLan = lan;
  }

  private getTranslations(pageNr: number) {
    // Get translations for words
    this.isLoadingTranslations = true;
    this.wordTranslations[pageNr - 1] = [];
    this.hasOmegaWikiTranslations[pageNr - 1] = [];
    this.hasDeepLTranslations[pageNr - 1] = [];
    this.hasMSTranslations[pageNr - 1] = [];
    const words = this.displayWords.map(w => w.word);
    this.translationService
    .fetchTranslations(this.book, this.userLanCode, words)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      wordTranslations => {
        this.processTranslations(wordTranslations, words, pageNr);
        this.isLoadingTranslations = false;
      }
    );
  }

  private processTranslations(wordTranslations: WordTranslations[], words: string[], pageNr: number) {
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
        // Create translation summary
        tl.summary = this.wordListService.createTranslationsSummary(tl);
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
        // Check if Microsoft translation button can be shown
        const msTranslations = tl.translations.filter(tl2 => tl2.source === 'Microsoft');
        if (msTranslations.length > 0) {
          this.hasMSTranslations[pageNr - 1][i] = true;
        }
      } else {
        // No translation found
        this.displayWords[i].expanded = true;
        this.wordTranslations[pageNr - 1][i] = {
          lanCode: this.bookLan.code,
          word: w,
          translations: []
        };
      }
    });
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
  }

  private checkDeepLTranslationAvailability() {
    // Check if both source and target languages are available in deepl
    const deeplLanguages = this.translationService.getMachineLanguages('deepl');
    if (deeplLanguages.includes(this.userLanCode) && deeplLanguages.includes(this.book.lanCode)) {
      this.isDeeplAvailable = true;
    }
  }

  private removeTranslation(translationId: string, elementId: string) {
    this.translationService
    .removeWordTranslation(translationId, elementId)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe( result => {
      const tl = this.wordTranslations[this.currentPage - 1].find(wt => wt._id.toString() === translationId);
      if (tl) {
        tl.translations = tl.translations.filter(tlElement => tlElement._id.toString() !== elementId);
      }
    });
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
        this.userLanguages = dependables.userLanguages;
        this.setTargetLan(dependables.userLanguages); // for omega wiki code
      }
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
