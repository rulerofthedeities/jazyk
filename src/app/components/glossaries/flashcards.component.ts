import { Component, OnInit, OnDestroy, ViewChildren, QueryList } from '@angular/core';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { SharedService, awsPath } from 'app/services/shared.service';
import { WordListService } from 'app/services/word-list.service';
import { ReadnListenService } from 'app/services/readnlisten.service';
import { UserService } from 'app/services/user.service';
import { Map } from 'app/models/main.model';
import { Book, SessionData } from 'app/models/book.model';
import { ReadSettings } from 'app/models/user.model';
import { Word, FlashCard, FlashCardData, AnswerData } from 'app/models/word.model';
import { ModalConfirmComponent } from 'app/components/modals/modal-confirm.component';
import { environment } from 'environments/environment';
import { takeWhile, filter } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'km-flashcards',
  templateUrl: 'flashcards.component.html',
  styleUrls: ['flashcards.component.css']
})

export class BookFlashCardsComponent implements OnInit, OnDestroy {
  private componentActive = true;
  text: Object;
  isCountDown = false;
  settings: ReadSettings;
  bookId: string;
  targetLanCode: string;
  book: Book;
  isReady = false;
  startedExercises = false;
  isFinished = false;
  modalActive = false;
  nrofCards: number;
  flashCards: FlashCard[];
  flashCardsDone: FlashCard[]; // for results
  currentFlashCard: FlashCard;
  newFlashCard: BehaviorSubject<FlashCard> = new BehaviorSubject(null);
  audioPath: string;
  sessionData: SessionData;
  answerData: Map<AnswerData> = {}; // Answer per word Id
  glossaryType: string;
  msg: string;
  @ViewChildren(ModalConfirmComponent) confirm:  QueryList<ModalConfirmComponent>;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private sharedService: SharedService,
    private wordlistService: WordListService,
    private readnListenService: ReadnListenService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.settings = this.userService.user.jazyk.read;
    this.nrofCards = this.settings.flashcards || 10;
    this.getType();
    this.getDependables(this.userService.user.main.lan);
  }

  onCountDownFinished() {
    this.isCountDown = false;
    this.subscribeToBook();
  }

  onExitReading() {
    this.exitReading();
  }

  onExitConfirmed(exitOk: boolean) {
    this.modalActive = false;
    if (exitOk) {
      this.log('Flashcards aborted');
      this.finish();
    }
  }

  onKeyPressed(key: string) {
    switch (key) {
      case 'Escape':
        if (!this.isFinished && !this.modalActive) {
          this.exitReading();
        }
        break;
    }
  }

  onGotAnswer(answer: string) {
    const wordId = this.flashCards[0].wordId,
          points = this.getSentencePoints(this.flashCards[0], answer),
          answers = this.answerData[wordId] ? this.answerData[wordId].answers || '' : '';
    this.sessionData.answers += answer;
    this.sessionData.points.words += points;
    if (this.answerData[wordId]) {
      this.answerData[wordId].answers = answers + answer;
      this.answerData[wordId].points = points;
    } else {
      this.answerData[wordId] = {
        answers: answers + answer,
        previousAnswers: '',
        points: points
      };
    }
    if (answer === 'n' && this.answerData[wordId].answers.length < 3) {
      // Incorrect answer, place card to the back of the stack if there have been less than 3 wrong answers
      this.flashCards.push(this.flashCards[0]);
    }
    if (!this.flashCardsDone.find(flashCard => flashCard.wordId === wordId)) {
      // flashcard to be shown on results page
      this.flashCardsDone.push(this.flashCards[0]);
    }
    // Remove current flashCard from stack
    this.flashCards.shift();
    this.getNextFlashCard();
  }

  /*
  onBackToList() {
    this.router.navigate([`/glossaries`]);
  }
  */

  onBackToGlossary() {
    this.toGlossary();
  }

  onBackToStory() {
    this.router.navigate([`/glossaries/${this.book._id}`]);
  }

  onMoreFlashCards() {
    this.isReady = false;
    this.isFinished = false;
    this.answerData = {};
    this.processNewBookId();
  }

  private getSentencePoints(flashCard: FlashCard, answer: string): number {
    const scorePoints = (1000 - flashCard.score) / 50, // 0-20
          lengthPoints = Math.min(10, flashCard.word.length / 2); // 0 - 10
    return answer === 'y' ? Math.max(Math.trunc(scorePoints + lengthPoints), 1) : 0; // 2-30
  }

  private setFlashCards(words: Word[]) {
    const flashCards: FlashCard[] = [];
    words.forEach(word => {
      flashCards.push({
        wordId: word._id,
        word: word.word,
        score: word.score || 50,
        chapterSequences: word.chapterSequences,
        wordType: this.text[word.wordType],
        genus: word.genus ? this.text[word.genus.toLowerCase()] : null,
        verbProperties: this.getVerbProperties(word),
        article: word.article,
        notes: this.getNotes(word),
        audio: word.audio,
        translations: word.translationSummary.replace(/\|/g, ', ')
      });
    });
    this.flashCards = this.sharedService.shuffleArray(flashCards);
    this.flashCardsDone = [];
    this.getNextFlashCard();
    this.isReady = true;
  }

  private getNotes(word: Word): string {
    if (word.notes) {
      return word.notes.split('|').map(note => this.text['note-' + note.trim()]).join(', ');
    } else {
      return null;
    }
  }

  private getVerbProperties(word: Word): string {
    let properties = null;
    if (word) {
      const propertyArr = [];
      if (word.aspect) {
        propertyArr.push(this.text[word.aspect]);
      }
      if (word.transitivity) {
        propertyArr.push(this.text[word.transitivity]);
      }
      properties = propertyArr.join(', ');
    }
    return properties;
  }

  private getNextFlashCard() {
    if (this.flashCards && this.flashCards.length) {
      this.currentFlashCard = this.flashCards[0];
      this.newFlashCard.next(this.currentFlashCard);
    } else {
      this.finish();
    }
  }

  private getBookId() {
    this.route.params
    .pipe(
      takeWhile(() => this.componentActive),
      filter(params => params.id))
    .subscribe(
      params => {
        this.bookId = params['id'];
        this.targetLanCode = params['lan'];
        this.processNewBookId();
      }
    );
  }

  private processNewBookId() {
    this.readnListenService
    .fetchBook(this.bookId, 'glossary')
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      book => {
        this.book = book;
        if (this.book) {
          if (this.settings.countdown) {
            this.isCountDown = true;
          }
          this.startedExercises = true;
          this.audioPath = 'https://' + awsPath + 'words/' + this.book.lanCode + '/';
          this.sessionData = {
            bookId: this.bookId,
            lanCode: this.targetLanCode,
            bookType: 'glossary',
            glossaryType: this.glossaryType,
            isTest: false,
            version: environment.version,
            repeatCount: undefined,
            answers: '',
            translations: 0,
            nrYes: 0,
            nrNo: 0,
            nrMaybe: 0,
            points: {
              words: 0,
              translations: 0,
              test: 0,
              finished: 0
            }
          };
          this.sharedService.changeExerciseMode(true);
          this.getWords();
        }
      }
    );
  }

  private getWords() {
    this.wordlistService
    .fetchFlashcardWords(this.bookId, this.targetLanCode, this.nrofCards, this.glossaryType)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      data => {
        const words = this.mapUserData(data);
        this.setFlashCards(words);
      }
    );
  }

  private mapUserData(data: FlashCardData): Word[] {
    const words = data.words,
          userWords = data.userWords; // only for my glossary
          // translations = data.translations; // only for all glossary
    if (userWords) {
      // My glossary: map word with user translation
      words.forEach(word => {
        const userWord = userWords.find(uWord => uWord.wordId === word._id);
        if (userWord) {
          word.translationSummary = userWord.translations;
          this.answerData[word._id] = {
            answers: '',
             // previous answers necessary until mongo v4.2
            previousAnswers: this.glossaryType === 'my' ? userWord.answersMy : userWord.answersAll,
            points: 0
          };
        }
      });
    }
    return words;
  }

  private saveResults() {
    if (this.sessionData.answers) {
      // Save session data
      this.wordlistService
      .saveSession(this.sessionData)
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(
        result => {}
      );
      // Add answers to flashcards
      const flashCardsToSave: FlashCard[] = [];
      this.flashCardsDone.forEach(flashCard => {
        const answer = this.answerData[flashCard.wordId];
        if (answer) {
          flashCard.answers = (answer.previousAnswers || '') + answer.answers;
          flashCardsToSave.push(flashCard);
        }
      });
      // Save answers in user wordlist
      this.wordlistService
      .saveAnswers(flashCardsToSave, this.bookId, this.book.lanCode, this.targetLanCode, this.glossaryType)
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(
        result => {}
      );
    }
  }

  private exitReading() {
    let abortNow = false;
    if (this.isCountDown) {
      this.isCountDown = false;
      this.log('Countdown aborted');
      abortNow = true;
    } else {
      if (this.sessionData && this.sessionData.answers) {
        const confirm = this.confirm.find(c => c.name === 'exit');
        if (confirm) {
          confirm.showModal = true;
          this.modalActive = true;
        }
      } else {
        this.log('Flashcards aborted');
        abortNow = true;
      }
    }
    if (abortNow) {
      this.sharedService.changeExerciseMode(false);
      this.sharedService.stopAudio();
      this.toGlossary();
    }
  }

  private toGlossary() {
    this.router.navigate([`/glossaries/glossary/${this.book._id}/${this.targetLanCode}`]);
  }

  private finish() {
    this.saveResults();
    this.isFinished = true;
    this.sharedService.changeExerciseMode(false);
  }

  private getType() {
    // Get flashcard type (words from app (all) or from user list (my))
    this.route
    .data
    .pipe(takeWhile(() => this.componentActive))
      .subscribe(data => {
        this.glossaryType = data.tpe === 'my' ? 'my' : 'all';
    });
  }

  private subscribeToBook() {
    this.readnListenService
    .subscribeToBook(this.book._id, this.targetLanCode, 'glossary', false)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(subscription => {});
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
        this.sharedService.setPageTitle(this.text, 'Flashcards');
        this.getBookId();
      }
    );
  }

  private log(message: string) {
    this.sharedService.sendEventMessage({
      message,
      source: 'BookFlashcardsComponent'
    });
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
