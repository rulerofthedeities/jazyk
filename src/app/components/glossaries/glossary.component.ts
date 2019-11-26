import { Component, OnInit, OnDestroy, ViewChildren } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { TooltipDirective } from 'ng2-tooltip-directive';
import { UserService } from '../../services/user.service';
import { SharedService, awsPath } from '../../services/shared.service';
import { WordListService } from '../../services/word-list.service';
import { ReadnListenService } from '../../services/readnlisten.service';
import { TranslationService } from '../../services/translation.service';
import { ExternalWordTranslationComponent } from '../glossaries/external-translation.component';
import { Book } from 'app/models/book.model';
import { Word, UserWord, WordTranslations, WordTranslation, SentenceWord,
         SentenceSection } from 'app/models/word.model';
import { Language, Map } from '../../models/main.model';
import { zip, BehaviorSubject, Subject } from 'rxjs';
import { takeWhile, filter, delay } from 'rxjs/operators';

@Component({
  templateUrl: 'glossary.component.html',
  styleUrls: ['glossary.component.css']
})

export class BookGlossaryComponent implements OnInit, OnDestroy {
  @ViewChildren(TooltipDirective) tooltipDirective;
  @ViewChildren(ExternalWordTranslationComponent) wordTranslations;
  private componentActive = true;
  text: Object;
  book: Book;
  bookId: string;
  words: Word[];
  myWords: Word[];
  displayWords: Word[];
  bookType = 'read';
  userLanCode: string;
  bookLanguages: Language[];
  userLanguages: Language[];
  glossaryLanguages: Language[];
  bookLan: Language;
  translationLan: Language;
  msg: string;
  isLoading = false;
  isError = false;
  errMsg: string;
  infoMsg: string;
  currentPage = 0;
  currentLetter = 0;
  maxWordsPerPage = 50; // All tab is shown in paginator
  nrOfPages: number;
  letters: string[];
  hasLetter: boolean[][] = [];
  allLetters = false;
  paginationReady = false;
  audioPath: string;
  isLoadingTranslations = false;
  hasOmegaWikiTranslations: Map<boolean> = {};
  hasDeepLTranslations: Map<boolean> = {};
  hasMSTranslations: Map<boolean> = {};
  sentenceSections: Map<SentenceSection[][]> = {};
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
  tooltipLan: any;
  tooltipRemove: any;
  tooltipEdit: any;
  isAllPinned = false;
  tabs: string[] = ['glossary', 'mywords'];
  tab = 'glossary';
  totalWords: number[] = [];
  editingWord: number = null;
  hasFlashcards = false;
  translationLanChanged: BehaviorSubject<Language>;

  constructor(
    private router: Router,
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

  onTrackWord(index: number, item: Word) {
    return item._id;
  }

  onSelectTab(newTab: string) {
    this.tab = newTab;
    this.setDisplayWords(newTab);
    this.goToLetter(this.currentLetter);
    this.checkIfFlashcardsAvailable();
  }

  onGoToLetter(newLetterNr) {
    this.clearNoTranslationMsg();
    this.allLetters = newLetterNr === -1;
    if (this.hasLetter[this.tab][newLetterNr]) {
      this.goToLetter(newLetterNr);
    }
  }

  onStartFlashcards(tab: string, count: number) {
    const tpe = tab === 'mywords' ? 'my' : 'all';
    this.log(`Start flash cards for ${this.book.title}`);
    this.router.navigate([`/glossaries/glossary/flashcards/${this.book._id}/${this.userLanCode}/${tpe}`]);
  }

  onAddToMyWordList(word: Word, i: number) {
    if (!word.pinned) {
      this.addToMyWordList(word, i);
    }
  }

  onRebuildTranslationSummary(word: Word, i: number) {
    const translations: WordTranslations = {
      translations: word.translations,
      lanCode: this.userLanCode,
      word: word.word
    };
    this.setWordTranslationSummary(word, null, translations);
  }

  onExcludeWord(word: Word, i: number) {
    const tooltipExclude = this.tooltipDirective.find(elem => elem.id === ('tooltipExclude' + i));
    if (tooltipExclude) {
      tooltipExclude.hide();
    }
    // exclude both in bookwords & wordtranslations collections
    this.excludeWord(word, i, true);
  }

  onIncludeWord(word: Word, i: number) {
    const tooltipInclude = this.tooltipDirective.find(elem => elem.id === ('tooltipInclude' + i));
    if (tooltipInclude) {
      tooltipInclude.hide();
    }
    // include both in bookwords & wordtranslations collections
    this.excludeWord(word, i, false);
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

  onEditMyWordTranslation(word: Word, i: number) {
    this.editingWord = i;
    this.tooltipEdit = this.tooltipDirective.find(elem => elem.id === ('tooltipEdit' + i.toString()));
    if (this.tooltipEdit) {
      this.tooltipEdit.hide();
    }
  }

  onNewUserTranslation(newTranslation: string, word: Word, i: number) {
    this.updateUserTranslation(newTranslation, word, i);
  }

  onCancelUserTranslation() {
    this.editingWord = null;
  }

  onFetchAllTranslations(i: number) {
      const word = this.displayWords[i],
            deepL = this.wordTranslations.find(elem => elem.i === i && elem.source === 'DeepL'),
            MS = this.wordTranslations.find(elem => elem.i === i && elem.source === 'Microsoft'),
            Omega = this.wordTranslations.find(elem => elem.i === i && elem.source === 'OmegaWiki');
      if (deepL && this.isDeeplAvailable) {
        deepL.getDeepLTranslation();
      }
      if (MS) {
        MS.getMSTranslation();
      }
      if (Omega && word) {
        if (word.wordType !== 'phrase') {
          Omega.getOmegaDefinitionLocal();
        } else {
          this.hasOmegaWikiTranslations[word._id] = true;
        }
      }
  }

  onNewTranslations(data: {translations: WordTranslations, i: number, _id: string}, word: Word) {
    this.clearNoTranslationMsg();
    this.editingTranslationId = null;
    word.translations = word.translations ? word.translations : [];
    word.translations.push(...data.translations.translations);
    data.translations.translations = word.translations;
    this.setWordTranslationSummary(word, null, data.translations);
    this.sortTranslations(word.translations);
    word.translations.forEach(tl => {
      if (tl.source === 'OmegaWiki') {
        this.hasOmegaWikiTranslations[word._id] = true;
      } else if (tl.source === 'DeepL') {
        this.hasDeepLTranslations[word._id] = true;
      } else if (tl.source === 'Microsoft') {
        this.hasMSTranslations[word._id] = true;
      }
    });
  }

  onUpdatedTranslation(data: {translation: string, note: string, translationId: string}, word: Word) {
    const tl = word.translations.find( t => t._id === data.translationId);
    if (tl) {
      tl.definition = data.note;
      tl.translation = data.translation;
      const translations: WordTranslations = {
        translations: word.translations,
        lanCode: this.userLanCode,
        word: word.word
      };
      this.setWordTranslationSummary(word, null, translations);
    }
    this.clearNoTranslationMsg();
    this.editingTranslationId = null;
  }

  onNoTranslations(data: {msg: string, i: number}) {
    this.noTranslation = {
      msg: data.msg,
      i: data.i
    };
  }

  onEditTranslation(word: Word, translation: WordTranslation) {
    this.clearNoTranslationMsg();
    if (this.canEdit) {
      this.editingTranslationId = translation._id;
    }
  }

  onRemoveTranslation(i: number, translation: WordTranslation, word: Word) {
    this.clearNoTranslationMsg();
    if (this.canEdit) {
      let wikiCount = 0;
      if (word && word.translations) {
        wikiCount = word.translations.filter(w => w.source === 'OmegaWiki').length;
      }
      if (translation.source === 'OmegaWiki' && wikiCount < 2) {
        // Last entry for OmegaWiki should be set to none
        this.setTranslationToNone(word._id, translation._id, word);
      } else {
        this.removeTranslation(word._id, translation._id, word);
      }
    }
  }

  onSetTranslationAsNone(i: number, source: string, word: Word) {
    // Hide the translation button for this source
    this.clearNoTranslationMsg();
    if (this.canEdit) {
      this.setTranslationAsNone(word, source);
    }
  }

  onSetTranslationToNone(i: number, translation: WordTranslation, word: Word) {
    this.clearNoTranslationMsg();
    if (this.canEdit) {
      this.setTranslationToNone(word._id, translation._id, word);
    }
  }

  onSetTranslationToTo(i: number, translation: WordTranslation, word: Word) {
    // add to prefix to verbs in en
    this.clearNoTranslationMsg();
    if (this.canEdit) {
      this.setTranslationToTo(word._id, translation._id, word);
    }
  }

  onSetTranslationToLowerCase(i: number, translation: WordTranslation, word: Word) {
    // Set first letter of translation to lowercase
    this.clearNoTranslationMsg();
    if (this.canEdit) {
      this.setTranslationToCase(word._id, translation._id, word, true);
    }
  }

  onSetTranslationToUpperCase(i: number, translation: WordTranslation, word: Word) {
    // Set first letter of translation to lowercase
    this.clearNoTranslationMsg();
    if (this.canEdit) {
      this.setTranslationToCase(word._id, translation._id, word, false);
    }
  }

  onCancelTranslation() {
    this.editingTranslationId = null;
  }

  onGetWordSentences(wordId: string) {
    this.fetchSentencesForWord(wordId);
  }

  onExpand(word: Word, expand: boolean) {
    word.expanded = expand;
  }

  onMyLanguageSelected(lan: Language) {
    this.userService.setUserLanCode(lan.code);
    this.tooltipLan = this.tooltipDirective.find(elem => elem.id === ('tooltipLan'));
    if (this.tooltipLan) {
      this.tooltipLan.hide();
    }
    this.userLanCode = lan.code;
    this.translationLan = lan;
    this.translationLanChanged = new BehaviorSubject(lan);
    this.location.go(`/glossaries/glossary/${this.bookId}/${this.userLanCode}`);
    // Clear data
    this.words.forEach(word => {
        word.pinned = false;
        word.translationSummary = '';
        word.translationSummaryDisplay = '';
        word.translations = null;
        this.hasOmegaWikiTranslations[word._id] = false;
        this.hasDeepLTranslations[word._id] = false;
        this.hasMSTranslations[word._id] = false;
    });
    // get user translation for this language
    this.wordListService
    .fetchUserWordList(this.bookId, this.userLanCode)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(userWords => {
      this.processUserWords(userWords);
      this.getAllWordTranslations();
      this.checkLetters('mywords');
      this.setDisplayWords(this.tab);
      this.countWords();
      this.checkIfFlashcardsAvailable();
    });
  }

  onAudioEnded(isEnded: boolean) {
    this.sharedService.audioHasEnded(isEnded);
  }

  hasTranslation(word: Word) {
    if (this.tab === 'mywords') {
      return !!word.userTranslationSummary;
    } else {
      return !!word.translationSummary;
    }
  }

  getCounter(nr: number): number[] {
    return new Array(nr);
  }

  getNoWordsMessage(): string {
    let msg = '';
    msg = this.text['NoWordsInYourList'];
    if (this.currentLetter > -1 ) {
      msg += ' ' + this.text['StartingWithLetter'] + ` '${this.letters[this.currentLetter]}'`;
    }
    msg += ' ' + this.text['ForTheLanguage'] + ` '${this.text[this.translationLan.name]}'.`;
    msg += ' ' + this.text['ToAddWords'];
    return msg;
  }

  getTlNewlines(word: Word): string {
    // return the translations in edit format
    if (word && word.userTranslationSummary) {
      const translations = word.userTranslationSummary.split('|').map(tl => tl.trim());
      return translations.join('\n');
    } else {
      return '';
    }
  }

  getNotes(word: Word): string {
    const notes: string[] = [];
    if (word) {
      if (word.notes) {
        word.notes.split('|').forEach(note => {
          notes.push(this.text['note-' + note.trim()]);
        });
      }
      if (word.aspect) {
        notes.push(this.text[word.aspect]);
      }
      return notes.join(', ');
    } else {
      return '';
    }
  }

  isUpperCase(translation: WordTranslation): boolean {
    if (translation.translation && translation.translation[0]) {
      return translation.translation[0] === translation.translation[0].toUpperCase();
    } else {
      return false;
    }
  }

  isLowerCase(translation: WordTranslation): boolean {
    if (translation.translation && translation.translation[0]) {
      return translation.translation[0] === translation.translation[0].toLowerCase();
    } else {
      return false;
    }
  }

  private setDisplayWords(tab: string) {
    this.countWords();
    this.displayWords = this.getWordsForLetter(this.currentLetter, tab);
  }

  private countWords() {
    this.totalWords['glossary'] = this.words.length;
    this.totalWords['mywords'] = this.words.filter(w => w.pinned).length;
  }

  private clearNoTranslationMsg() {
    this.noTranslation = {msg: '', i: 0};
  }

  private goToLetter(newLetterNr: number) {
    if (newLetterNr >= 0 && newLetterNr < this.letters.length) {
      this.currentLetter = newLetterNr;
      this.setDisplayWords(this.tab);
      this.currentPage = 0;
    } else if (newLetterNr === -1) {
      // All letters
      this.currentLetter = -1;
      this.setDisplayWords(this.tab);
      this.currentLetter = -1;
      this.allLetters = true;
      this.currentPage = 0;
    }
  }

  private addToMyWordList(word: Word, i: number) {
    word.pinned = true;
    word.userTranslationSummary = word.translationSummary;
    word.userTranslationSummaryDisplay = this.setTlDisplay(word.translationSummary);
    word.targetLanCode = this.userLanCode;
    this.wordListService
    .pinWord(word, this.book._id, word.translationSummary, word.pinned)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(newWord => {
      if (newWord) {
        this.myWords.push(word);
        this.myWords.sort((a, b) => a.word > b.word ? 1 : (a.word < b.word ? -1 : 0));
        this.checkLetter(word);
        this.countWords();
      }
    }, error => {
      word.pinned = false;
    });
  }

  private setTlDisplay(summary: string): string {
    if (summary && typeof summary === 'string') {
      return summary.replace(/\|/g, ', ');
    } else {
      return '';
    }
  }

  private addAllToMyWordList(words: Word[]) {
    words.forEach(word => {
      if (!word.pinned) {
        word.pinned = true;
        word.targetLanCode = this.userLanCode;
        word.userTranslationSummary = word.translationSummary;
        word.userTranslationSummaryDisplay = this.setTlDisplay(word.translationSummary);
      }
    });
    this.wordListService
    .pinWords(words, this.book._id)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(newWords => {
      if (newWords) {
        this.isAllPinned = true;
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

  private excludeWord(word: Word, i: number, exclude: boolean) {
    this.wordListService
    .excludeWord(word._id, this.book._id, exclude)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(excluded => {
      word.exclude = exclude;
    });
  }

  private fetchSentencesForWord(wordId: string) {
    this.wordListService
    .fetchSentencesForWord(this.book._id, wordId)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe((sentences: SentenceWord[]) => {
      this.sentenceSections[wordId] = [];
      sentences.forEach((sentence, i) => {
        if (sentence.chapterSequence === 0 && sentence.sentenceSequence === 0) {
          sentence.isTitle = true;
        }
        this.wordListService.getSentenceWordPositions(this.sentenceSections, sentence, wordId, i);
      });
    });
  }

  private getBookType() {
    this.isLoading = true;
    // read or listen
    this.route
    .data
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(data => {
      this.bookType = data.tpe;
    });
  }

  private getWordsForLetter(letterNr: number, tab = 'glossary'): Word[] {
    const letter = this.letters[letterNr];
    if (letter) {
      if (tab === 'mywords') {
        return this.myWords.filter(word => word.dictionaryLetter === letter);
      } else {
        return this.words.filter(word => word.dictionaryLetter === letter);
      }
    } else {
      if (tab === 'mywords') {
        return this.myWords;
      } else {
        return this.words;
      }
    }
  }

  private getDictionaryLetter(word: string): string {
    const firstLetter = word.substr(0, 1).toLowerCase(),
          mapping = this.bookLan.letterMap,
          letterMaps = mapping.split('|');
    let letter: string[];

    for (let i = 0; i < letterMaps.length; i++) {
      letter = letterMaps[i].split(',');
      if (letter[0] === firstLetter) {
        return letter[1];
      }
    };
    return firstLetter;
  }

  private processNewBookId() {
    this.isLoading = true;
    if (this.bookId && this.bookId.length === 24) {
      zip(
        this.readnListenService.fetchBook(this.bookId, this.bookType || 'read'),
        this.wordListService.fetchWordList(this.bookId),
        this.wordListService.fetchUserWordList(this.bookId, this.userLanCode)
      )
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(data => {
        this.book = data[0];
        this.words = data[1];
        this.setBookLan(this.bookLanguages); // for omega wiki code + alphabet
        this.checkDeepLTranslationAvailability();
        this.processWords();
        this.processUserWords(data[2]);
        this.getAllWordTranslations();
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

  private processWords() {
    // Set dictionary letter for each word
    this.words.forEach(word => {
      word.dictionaryLetter = this.getDictionaryLetter(word.word);
    });
  }

  private processUserWords(userWords: UserWord[]) {
    let word: Word;
    // Check for pinned words
    userWords.forEach(uWord => {
      word = this.words.find(w => w._id.toString() === uWord.wordId.toString());
      if (word) {
        word.pinned = uWord.pinned;
        word.userTranslationSummary = uWord.translations;
        word.userTranslationSummaryDisplay = this.setTlDisplay(uWord.translations);
      }
    });
    this.myWords = this.words.filter(w => w.pinned);
    // Check if all words are pinned
    this.isAllPinned = this.words.every(this.checkPinned);
  }

  private getAllWordTranslations() {
    // Get translations for words
    this.isLoadingTranslations = true;
    this.translationService
    .fetchWordTranslations(this.book, this.userLanCode)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      wordTranslations => {
        let word: Word;
        // Map translation with words
        wordTranslations.forEach(tl => {
          word = this.words.find(w => w._id === tl.wordId);
          if (word) {
            word.translations = tl.translations.filter(wtl => wtl.lanCode === this.userLanCode);
          }
        });
        // Add translation summary
        let translations: WordTranslations;
        this.words.forEach(w => {
          translations = {
            translations: this.processTranslations(w.translations, w),
            lanCode: this.userLanCode,
            word: w.word
          };
          w.translationSummary = this.wordListService.createTranslationsSummary(translations, w, '|');
          w.translationSummaryDisplay = this.setTlDisplay(w.translationSummary);
        });
        this.goToLetter(this.words.length > this.maxWordsPerPage ? 0 : -1);
        this.checkIfFlashcardsAvailable();
        this.isLoadingTranslations = false;
      }
    );
  }

  private checkLetters(tab = 'glossary') {
    let firstLetter: string,
        pos: number,
        letterCount = 0;
    const words = tab === 'mywords' ? this.myWords : this.words;
    this.hasLetter[tab] = [];
    this.hasLetter[tab][-1] = true;
    for (let i = 0; i < words.length; i++) {
      firstLetter = words[i].dictionaryLetter;
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
    const firstLetter = word.dictionaryLetter,
          pos = this.letters.indexOf(firstLetter);
    if (pos > -1 && pos < this.letters.length) {
      this.hasLetter[tab][pos] = true;
    }
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
    this.translationLanChanged = new BehaviorSubject(lan);
  }

  private setBookLan(bookLans: Language[]) {
    const lan = bookLans.find(l => l.code === this.book.lanCode);
    this.bookLan = lan;
    this.glossaryLanguages = this.userLanguages.filter(l => l.code !== this.bookLan.code);
    this.letters = this.bookLan.alphabet.split('|');
  }

  private processTranslations(wordTranslations: WordTranslation[], word: Word): WordTranslation[] {
    if (wordTranslations && wordTranslations.length) {
      // Place the translations in the right order
      this.sortTranslations(wordTranslations);
      // Check if omegaWiki translation button should be shown
      const omegaWikiTranslations = wordTranslations.filter(tl2 => tl2.source === 'OmegaWiki');
      if (omegaWikiTranslations.length > 0) {
        this.hasOmegaWikiTranslations[word._id] = true;
      }
      // Check if deepL translation button can be shown
      const deepLTranslations = wordTranslations.filter(tl2 => tl2.source === 'DeepL');
      if (deepLTranslations.length > 0) {
        this.hasDeepLTranslations[word._id] = true;
      }
      // Check if Microsoft translation button can be shown
      const msTranslations = wordTranslations.filter(tl2 => tl2.source === 'Microsoft');
      if (msTranslations.length > 0) {
        this.hasMSTranslations[word._id] = true;
      }
      word.expanded = false;
    } else {
      // No translation found
      word.expanded = true;
    }
    return wordTranslations;
  }

  private sortTranslations(translations: WordTranslation[]) {
    // Push Jazyk translations to top
    const tmpTranslations: WordTranslation[] = [];
    translations.forEach(tl => {
      if (tl.source === 'Jazyk') {
        tmpTranslations.unshift(tl);
      } else {
        tmpTranslations.push(tl);
      }
    });
    translations = tmpTranslations;
  }

  private checkDeepLTranslationAvailability() {
    // Check if both source and target languages are available in deepl
    const deeplLanguages = this.translationService.getMachineLanguages('deepl');
    if (deeplLanguages.includes(this.userLanCode) && deeplLanguages.includes(this.book.lanCode)) {
      this.isDeeplAvailable = true;
    }
  }

  private removeTranslation(wordId: string, elementId: string, word: Word) {
    this.translationService
    .removeWordTranslation(wordId, elementId)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe( result => {
      word.translations = word.translations.filter(tlElement => tlElement._id !== elementId);
      const translations: WordTranslations = {
        translations: word.translations,
        lanCode: this.userLanCode,
        word: word.word
      }
      this.setWordTranslationSummary(word, null, translations);
    });
  }

  private setTranslationAsNone(word: Word, source: string) {
    this.translationService
    .setWordTranslationAsNone(word._id, source, this.translationLan.code)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe( result => {
      switch(source) {
        case 'OmegaWiki':
          this.hasOmegaWikiTranslations[word._id] = true;
          break;
        case 'DeepL':
          this.hasDeepLTranslations[word._id] = true;
          break;
        case 'Microsoft':
          this.hasMSTranslations[word._id] = true;
          break;
        default:
          console.error('Source', source, 'not found');
      }
    });
  }

  private setTranslationToNone(wordId: string, elementId: string, word: Word) {
    this.translationService
    .setWordTranslationToNone(wordId, elementId)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe( result => {
      word.translations = word.translations.filter(tlElement => tlElement._id !== elementId);
      const translations: WordTranslations = {
        translations: word.translations,
        lanCode: this.userLanCode,
        word: word.word
      }
      this.setWordTranslationSummary(word, null, translations);
    });
  }

  private setTranslationToCase(wordId: string, elementId: string, word: Word, lower: boolean) {
    const updatedTranslation = word.translations.find(tlElement => tlElement._id === elementId);
    if (updatedTranslation) {
      const lc = updatedTranslation.translation.charAt(0).toLowerCase(),
            uc = updatedTranslation.translation.charAt(0).toUpperCase(),
            caseLetter = lower ? lc : uc,
            caseTranslation = caseLetter + updatedTranslation.translation.substr(1);
      this.translationService
      .setWordTranslationToLowerCase(wordId, elementId, caseTranslation)
      .pipe(takeWhile(() => this.componentActive))
      .subscribe( result => {
        updatedTranslation.translation = caseTranslation;
        const translations: WordTranslations = {
          translations: word.translations,
          lanCode: this.userLanCode,
          word: word.word
        }
        this.setWordTranslationSummary(word, null, translations);
      });
    }
  }

  private setTranslationToTo(wordId: string, elementId: string, word: Word) {
    const updatedTranslation = word.translations.find(tlElement => tlElement._id === elementId);
    if (updatedTranslation) {
      const newTranslation = 'to ' + updatedTranslation.translation;
      this.translationService
      .setWordTranslationToLowerCase(wordId, elementId, newTranslation)
      .pipe(takeWhile(() => this.componentActive))
      .subscribe( result => {
        updatedTranslation.translation = newTranslation;
        const translations: WordTranslations = {
          translations: word.translations,
          lanCode: this.userLanCode,
          word: word.word
        }
        this.setWordTranslationSummary(word, null, translations);
      });
    }
  }

  private updateUserTranslation(newTranslation: string, word: Word, i: number) {
    newTranslation = newTranslation.replace(/;|\n/g, '|');
    this.wordListService
    .updateUserTranslation(this.book._id, word._id, newTranslation, this.userLanCode)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe( result => {
      this.editingWord = null;
      const wordToUpdate = this.words.find(w => w._id === word._id);
      wordToUpdate.userTranslationSummary = newTranslation;
      wordToUpdate.userTranslationSummaryDisplay = this.setTlDisplay(newTranslation);
    });
  }

  private setWordTranslationSummary(word: Word, summary: string, translations: WordTranslations) {
    if (!summary) {
      summary = this.wordListService.createTranslationsSummary(translations, word);
      word.translationSummary = summary;
      word.translationSummaryDisplay = this.setTlDisplay(summary);
    }
    // Add summary to book word
    this.wordListService
    .updateTranslationSummary(this.book._id, word._id, summary, this.userLanCode)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe( result => {
      this.checkIfFlashcardsAvailable();
    });
  }

  private checkIfFlashcardsAvailable() {
    // Check if there are translations for current tab so we know when to show the flashcards button
    if (this.tab === 'mywords') {
      this.hasFlashcards = !!this.myWords.find(word => !!word.userTranslationSummary);
    } else {
      this.hasFlashcards = !!this.words.find(word => !!word.translationSummary);
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
        this.userLanguages = dependables.userLanguages;
        this.setTargetLan(dependables.userLanguages); // for omega wiki code
      }
    );
  }

  private log(message: string) {
    this.sharedService.sendEventMessage({
      message,
      source: 'BookGlossaryComponent'
    });
  }

  ngOnDestroy() {
    this.componentActive = false;
    this.tooltipLan = this.tooltipDirective.find(elem => elem.id === ('tooltipLan'));
    if (this.tooltipLan) {
      this.tooltipLan.hide();
    }
  }
}
