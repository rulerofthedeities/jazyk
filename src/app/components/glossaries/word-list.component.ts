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
  glossaryWords: Word[];
  myWords: Word[];
  displayWords: Word[];
  wordTranslations: WordTranslations[][] = [];
  myWordTranslations: string[][] = [];
  bookType = 'read';
  userLanCode: string;
  bookLanguages: Language[];
  userLanguages: Language[];
  bookLan: Language;
  translationLan: Language;
  msg: string;
  isLoading = false;
  isError = false;
  errMsg: string;
  infoMsg: string;
  currentPage = 0;
  currentLetter = 0;
  maxWordsPerPage = 500; // All tab is shown in paginator
  nrOfPages: number;
  letters: string[];
  hasLetter: boolean[][] = [];
  allLetters = false;
  paginationReady = false;
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
  tooltipRemove: any;
  isAllPinned = false;
  tabs: string[] = ['glossary', 'mywords'];
  tab = 'glossary';
  totalWords: number[] = [];

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
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    this.letters = this.getLetters(alphabet);
    this.clearNoTranslationMsg();
    this.getBookType();
    this.getDependables(this.userService.user.main.lan);
  }

  ngAfterViewInit() {
    this.tooltip = this.tooltipDirective.find(elem => elem.id === 'tooltip1');
  }

  onSelectTab(newTab: string) {
    this.tab = newTab;
    this.setDisplayWords(newTab);
    this.goToLetter(this.currentLetter);
  }

  onGoToLetter(newLetterNr) {
    this.clearNoTranslationMsg();
    this.allLetters = newLetterNr === -1;
    if (this.hasLetter[this.tab][newLetterNr]) {
      this.goToLetter(newLetterNr);
    }
  }

  onAddToMyWordList(word: Word, i: number) {
    if (!word.pinned) {
      const translations = this.wordTranslations ? this.wordTranslations[this.currentLetter][i] : null,
            summary = this.wordListService.createTranslationsSummary(translations, '|');
      this.addToMyWordList(word, summary, i);
    }
  }

  onAddAllToMyWordList() {
    // Get words that are not pinned
    const notPinnedWords = this.words.filter(word => !word.pinned);
    this.addAllToMyWordList(notPinnedWords);
  }

  onRemoveFromMyWordList(word: Word) {
    for (let i = 0; i < this.displayWords.length; i++) {
      this.tooltipRemove = this.tooltipDirective.find(elem => elem.id === ('tooltipRemove' + i.toString()));
      if (this.tooltipRemove) {
        this.tooltipRemove.hide();
      }
    };
    if (word.pinned) {
      this.removeFromMyWordList(word);
    }
  }

  onNewTranslations(data: {translations: WordTranslations, i: number}) {
    this.clearNoTranslationMsg();
    this.editingTranslationId = null;
    let currentTranslation = this.wordTranslations[this.currentLetter][data.i];
    if (currentTranslation) {
      currentTranslation.translations.push(...data.translations.translations);
    } else {
      currentTranslation = data.translations;
    }
    currentTranslation.summary = this.wordListService.createTranslationsSummary(currentTranslation);
    this.sortTranslations(currentTranslation);
    data.translations.translations.forEach(tl => {
      if (tl.source === 'OmegaWiki') {
        this.hasOmegaWikiTranslations[this.currentLetter][data.i] = true;
      } else if (tl.source === 'DeepL') {
        this.hasDeepLTranslations[this.currentLetter][data.i] = true;
      } else if (tl.source === 'Microsoft') {
        this.hasMSTranslations[this.currentLetter][data.i] = true;
      }
    });
  }

  onUpdatedTranslation(data: {translations: WordTranslations, i: number}) {
    this.clearNoTranslationMsg();
    this.editingTranslationId = null;
    this.wordTranslations[this.currentLetter][data.i].translations = data.translations.translations;
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
      this.removeTranslation(this.wordTranslations[this.currentLetter][i]._id, translation._id);
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
    // Clear data
    this.words.forEach(word => {
        word.pinned = false;
        word.translationSummary = '';
    });
    // get user translation for this language
    this.wordListService
    .fetchUserWordList(this.bookId, this.userLanCode)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(userWords => {
      console.log('new user words', userWords);
      this.userWords = userWords;
      this.processUserWords();
      this.getWordTranslations();
      this.checkLetters('mywords');
      this.setDisplayWords(this.tab);
      this.countWords();
    });
  }

  hasSummary(i: number): boolean {
    if (this.wordTranslations && this.wordTranslations[this.currentLetter] && this.wordTranslations[this.currentLetter][i]) {
      return !!this.wordTranslations[this.currentLetter][i].summary;
    } else {
      return false;
    }
  }

  getCounter(nr: number): number[] {
    return new Array(nr);
  }

  getUserTranslations(translations: string): string {
    if (translations) {
      return translations.replace(new RegExp(/\|/g), ', ')
    } else {
      return '';
    }
  }

  private setDisplayWords(tab: string) {
    if (this.glossaryWords.length === this.words.length) {
      this.countWords();
    }
    const allWords = tab === 'mywords' ? this.myWords : this.glossaryWords;
    this.displayWords = this.getWordsForLetter(allWords, this.currentLetter, tab);
  }

  private countWords() {
    this.totalWords['glossary'] = this.glossaryWords.length;
    this.totalWords['mywords'] = this.myWords.length;
  }

  private clearNoTranslationMsg() {
    this.noTranslation = {msg: '', i: 0};
  }

  private getLetters(alphabet: string): string[] {
    const letters = [];
    for (let i = 0; i < alphabet.length; i++) {
      letters.push(alphabet[i]);
    }
    return letters;
  }

  private goToLetter(newLetterNr: number) {
    if (newLetterNr >= 0 && newLetterNr < this.letters.length) {
      this.currentLetter = newLetterNr;
      this.setDisplayWords(this.tab);
      this.currentPage = 0;
      if (!this.wordTranslations[this.currentLetter]) {
        this.isLoadingTranslations = true;
        this.getTranslationsLetter(this.currentLetter);
      }
    } else if (newLetterNr === -1) {
      // All letters
      this.currentLetter = -1;
      this.setDisplayWords(this.tab);
      this.currentLetter = -1;
      this.allLetters = true;
      this.currentPage = 0;
    }
  }

  private addToMyWordList(word: Word, summary: string, i: number) {
    word.pinned = true;
    word.targetLanCode = this.userLanCode;
    this.wordListService
    .pinWord(word, this.book._id, summary, word.pinned)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(newWord => {
      if (newWord) {
        word.translationSummary = summary;
        // TODO SORT AFTER PUSH
        this.myWords.push(word);
        this.myWords.sort((a, b) => a.word > b.word ? 1 : (a.word < b.word ? -1 : 0));
        this.checkLetter(word);
        this.countWords();
      }
    }, error => {
      word.pinned = false;
    });
  }

  private addAllToMyWordList(words: Word[]) {
    let tl: WordTranslations;
    words.forEach(word => {
      word.pinned = true;
      word.targetLanCode = this.userLanCode;
      tl = this.wordTranslations[-1].find(wtl => wtl.word === word.word && wtl.lanCode === word.lanCode);
      if (tl) {
        word.translationSummary = this.wordListService.createTranslationsSummary(tl);
      }
    })
    this.wordListService
    .pinWords(words, this.book._id)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(newWords => {
      if (newWords) {
        this.isAllPinned = true;
        // TODO SORT AFTER PUSH
        this.myWords = this.myWords.concat(words);
        this.myWords.sort((a, b) => a.word > b.word ? 1 : (a.word < b.word ? -1 : 0));
        this.checkLetters('mywords');
        this.countWords();
      }
    },
    error => {
      this.isAllPinned = false;
      words.forEach(word => {
        word.pinned = false;
      });
      this.countWords();
    });
  }

  private removeFromMyWordList(word: Word) {
    word.pinned = false;
    this.wordListService
    .unPinWord(word, this.book._id, this.userLanCode)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(removedWord => {
      this.isAllPinned = false;
      this.myWords = this.myWords.filter(myWord => myWord._id.toString() !== word._id.toString());
      this.setDisplayWords('mywords');
      this.checkLetters('mywords');
      this.countWords();
    },
    error => {
      word.pinned = true;
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

  private getWordsForLetter(words: Word[], letterNr: number, tab = 'glossary'): Word[] {
    const letter = this.letters[letterNr];
    if (letter) {
      if (tab === 'mywords') {
        return words.filter(word => word.pinned && this.getDictionaryLetter(word.word) === letter);
      } else {
        return words.filter(word => this.getDictionaryLetter(word.word) === letter);
      }
    } else {
      return words;
    }
  }

  private getDictionaryLetter(word: string): string {
    const firstLetter = word.substr(0, 1).toLowerCase();
    // FR
    switch (firstLetter) {
      case 'â':
      case 'à':
        return 'a';
      case 'ç':
        return 'c';
      case 'é':
      case 'è':
      case 'ê':
      case 'ë':
        return 'e';
      case 'î':
      case 'ï':
        return 'i';
      case 'ô':
      case 'œ':
        return 'o';
      case 'ù':
      case 'û':
      case 'ü':
        return 'u';
      default: return firstLetter;
    }
  }

  private processNewBookId() {
    if (this.bookId && this.bookId.length === 24) {
      this.isLoading = true;
      zip(
        this.readnListenService.fetchBook(this.bookId, this.bookType || 'read'),
        this.wordListService.fetchWordList(this.bookId),
        this.wordListService.fetchUserWordList(this.bookId, this.userLanCode)
      )
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(data => {
        this.book = data[0];
        this.setBookLan(this.bookLanguages); // for omega wiki code
        this.checkDeepLTranslationAvailability();
        this.words = data[1];
        this.userWords = data[2];
        this.processUserWords();
        this.getWordTranslations();
        this.checkLetters('glossary');
        this.checkLetters('mywords');
        this.audioPath = 'https://' + awsPath + 'words/' + this.book.lanCode + '/';
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

  private checkLetters(tab = 'glossary') {
    let firstLetter: string,
        pos: number,
        letterCount = 0;
    const words = tab === 'mywords' ? this.myWords : this.glossaryWords;
    this.hasLetter[tab] = [];
    for (let i = 0; i < words.length; i++) {
      firstLetter = this.getDictionaryLetter(words[i].word);
      pos = this.letters.indexOf(firstLetter);
      if (pos > -1 && pos < this.letters.length) {
        if (!this.hasLetter[tab][pos]) {
          letterCount++;
          this.hasLetter[tab][pos] = true;
          if (letterCount === this.letters.length) {
            break; // There are words for all letters in the alphabet
          }
        }
      }
    }
    this.paginationReady = true;
  }

  private checkLetter(word: Word, tab = 'mywords') {
    const firstLetter = this.getDictionaryLetter(word.word),
          pos = this.letters.indexOf(firstLetter);
    if (pos > -1 && pos < this.letters.length) {
      this.hasLetter[tab][pos] = true;
    }
  }

  private processUserWords() {
    let word: Word;
    console.log('processing user words', this.userWords);
    // Check for pinned words
    this.userWords.forEach(uWord => {
      word = this.words.find(w => w._id.toString() === uWord.wordId.toString());
      if (word) {
        word.pinned = uWord.pinned;
        word.translationSummary = uWord.translations;
      }
    });
    // Check if all words are pinned
    this.isAllPinned = this.words.every(this.checkPinned);
  }

  private checkPinned(word: Word): boolean {
    return word.pinned;
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

  private getWordTranslations() {
    this.glossaryWords = this.getWordsForLetter(this.words, -1);
    this.myWords = this.glossaryWords.filter(w => w.pinned);
    if (this.words.length > this.maxWordsPerPage) {
      // Load translations per letter
      this.getTranslationsLetter(this.currentLetter);
    } else {
      // Load all translations at once
      this.getAllTranslations();
    }
  }

  private getTranslationsLetter(letter: number) {
    // Get translations for words for selected letter
    this.isLoadingTranslations = true;
    const words = this.glossaryWords.map(w => w.word);
    this.translationService
    .fetchTranslationsLetter(this.book, this.userLanCode, this.letters[letter])
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      wordTranslations => {
        this.processTranslationsLetter(wordTranslations, words, letter);
        this.isLoadingTranslations = false;
      }
    );
  }

  private getAllTranslations() {
    // Get translations for words
    this.isLoadingTranslations = true;
    this.translationService
    .fetchWordTranslations(this.book, this.userLanCode)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      wordTranslations => {
        let letterTranslations: WordTranslations[],
            words: string[],
            glossaryWords: Word[];
        // Process translations for each letter
        this.letters.forEach((letter, letterNr) => {
          glossaryWords = this.getWordsForLetter(this.words, letterNr);
          words = glossaryWords.map(w => w.word);
          letterTranslations = wordTranslations.filter(tl => this.getDictionaryLetter(tl.word) === letter);
          if (words && letterTranslations) {
            this.processTranslationsLetter(letterTranslations, words, letterNr);
          }
        });
        this.processTranslationsLetter(wordTranslations, this.words.map(w => w.word), -1);
        this.hasLetter['glossary'][-1] = true;
        this.hasLetter['mywords'][-1] = true;
        this.goToLetter(this.words.length > this.maxWordsPerPage ? 0 : -1);
        this.isLoadingTranslations = false;
      }
    );
  }

  private processTranslationsLetter(wordTranslations: WordTranslations[], words: string[], letterNr: number) {
    if (wordTranslations) {
      // this.glossaryWords = this.getWordsForLetter(this.words, letterNr);
      // this.myWords = this.glossaryWords.filter(w => w.pinned);
      this.initTranslationArrays(letterNr);
      // Only translations in target language
      wordTranslations.forEach(wt => {
        wt.translations = wt.translations.filter(wtl => wtl.lanCode === this.userLanCode)
      });
      // Place the translations in the right order
      let tl: WordTranslations;
      words.forEach((w, i) => {
        tl = wordTranslations.find(t => t.word === w);
        if (tl) {
          this.sortTranslations(tl);
          // Create translation summary
          tl.summary = this.wordListService.createTranslationsSummary(tl);
          this.wordTranslations[letterNr][i] = tl;
          // Check if omegaWiki translation button should be shown
          const omegaWikiTranslations = tl.translations.filter(tl2 => tl2.source === 'OmegaWiki');
          if (omegaWikiTranslations.length > 0) {
            this.hasOmegaWikiTranslations[letterNr][i] = true;
          }
          // Check if deepL translation button can be shown
          const deepLTranslations = tl.translations.filter(tl2 => tl2.source === 'DeepL');
          if (deepLTranslations.length > 0) {
            this.hasDeepLTranslations[letterNr][i] = true;
          }
          // Check if Microsoft translation button can be shown
          const msTranslations = tl.translations.filter(tl2 => tl2.source === 'Microsoft');
          if (msTranslations.length > 0) {
            this.hasMSTranslations[letterNr][i] = true;
          }
          this.glossaryWords[i].expanded = false;
        } else {
          // No translation found
          this.glossaryWords[i].expanded = true;
          this.wordTranslations[letterNr][i] = {
            lanCode: this.bookLan.code,
            word: w,
            translations: []
          };
        }
      });
    }
  }

  private initTranslationArrays(letterNr: number) {
    this.wordTranslations[letterNr] = [];
    this.hasOmegaWikiTranslations[letterNr] = [];
    this.hasDeepLTranslations[letterNr] = [];
    this.hasMSTranslations[letterNr] = [];
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
      const tl = this.wordTranslations[this.currentLetter].find(wt => wt._id.toString() === translationId);
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
