import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SharedService, awsPath } from 'app/services/shared.service';
import { WordListService } from 'app/services/word-list.service';
import { ReadnListenService } from 'app/services/readnlisten.service';
import { UserService } from 'app/services/user.service';
import { Book, SessionData } from 'app/models/book.model';
import { ReadSettings } from 'app/models/user.model';
import { Word, Flashcard } from 'app/models/word.model';
import { takeWhile, filter } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'km-flashcards',
  templateUrl: 'flashcards.component.html',
  styleUrls: ['flashcards.component.css']
})

export class BookFlashcardsComponent implements OnInit, OnDestroy {
  private componentActive = true;
  text: Object;
  isCountDown = false;
  settings: ReadSettings;
  bookId: string;
  userLanCode: string;
  book: Book;
  private words: Word[];
  isReady = false;
  startedExercises = false;
  nrofCards = 10;
  flashCards: Flashcard[];
  currentFlashCard: Flashcard;
  newFlashCard: BehaviorSubject<Flashcard> = new BehaviorSubject(null);
  audioPath: string;
  sessionData: SessionData;

  constructor(
    private route: ActivatedRoute,
    private sharedService: SharedService,
    private wordlistService: WordListService,
    private readnListenService: ReadnListenService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.settings = this.userService.user.jazyk.read;
    this.getDependables(this.userService.user.main.lan);
  }

  onCountDownFinished() {
    this.isCountDown = false;
  }

  onExitReading() {
    console.log('exiting');
    this.exitReading();
  }

  onGotAnswer(answer: string) {
    console.log('answered', answer);
    this.sessionData.answers += answer;
    this.flashCards.shift();
    this.getNextFlashCard();
  }

  private setFlashCards(words: Word[]) {
    const flashCards = [];
    words.forEach(word => {
      flashCards.push({
        word: word.word,
        wordType: word.wordType,
        genus: word.genus,
        article: word.article,
        audio: word.audio,
        translations: word.translationSummary.replace(/\|/g, ', ')
      });
    });
    this.flashCards = this.sharedService.shuffleArray(flashCards);
    console.log('flashcards', this.flashCards);
    this.getNextFlashCard();
    this.isReady = true;
  }

  private getNextFlashCard() {
    if (this.flashCards && this.flashCards.length) {
      this.currentFlashCard = this.flashCards[0];
      console.log('send new card');
      this.newFlashCard.next(this.currentFlashCard);
    } else {
      // FINISHED
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
        this.userLanCode = params['lan'];
        this.processNewBookId();
      }
    );
  }

  private processNewBookId() {
    this.readnListenService
    .fetchBook(this.bookId, 'read')
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      book => {
        this.book = book;
        if (this.book) {
          this.isCountDown = true;
          this.startedExercises = true;
          this.audioPath = 'https://' + awsPath + 'words/' + this.book.lanCode + '/';
          this.sessionData = {
            bookId: this.bookId,
            lanCode: this.userLanCode,
            bookType: 'flashcard',
            isTest: false,
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
    .fetchFlashcardWords(this.bookId, this.userLanCode, this.nrofCards)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      data => {
        const words = data.words,
              userWords = data.userWords;
        // Put user translations in words
        words.forEach(word => {
          const userWord = userWords.find(uWord => uWord.wordId === word._id);
          if (userWord) {
            word.translationSummary = userWord.translations;
          }
        });
        this.setFlashCards(words);
      }
    );
  }

  private exitReading() {
    let abortNow = false;
    if (this.isCountDown) {
      this.isCountDown = false;
      this.log('Countdown aborted');
      abortNow = true;
    } else {
      this.log('Flashcards aborted');
      abortNow = true;
    }
    if (abortNow) {
      this.sharedService.changeExerciseMode(false);
      this.sharedService.stopAudio();
    }
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
