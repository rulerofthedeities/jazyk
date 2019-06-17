import { Component, Input, Output, OnInit, OnDestroy, EventEmitter } from '@angular/core';
import { PlatformService } from '../../services/platform.service';
import { FlashCard } from 'app/models/word.model';
import { LanPair } from '../../models/main.model';
import { timer, Subject } from 'rxjs';
import { takeWhile, delay } from 'rxjs/operators';

@Component({
  selector: 'km-flashcard',
  templateUrl: 'flashcard.component.html',
  styleUrls: ['flashcard.component.css']
})

export class BookFlashCardComponent implements OnInit, OnDestroy {
  @Input() text: Object;
  @Input() lanPair: LanPair;
  @Input() audioPath: string;
  @Input() private newFlashCard: Subject<FlashCard>;
  @Output() answer = new EventEmitter<string>();
  card: FlashCard;
  private componentActive = true;
  isFlipped = false;
  showButtons = false;
  answered = false;

  constructor (
    private platform: PlatformService
  ) {}

  ngOnInit() {
    this.newFlashCard
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(event => {
      console.log('got new card', event);
      this.isFlipped = false;
      this.showButtons = false;
      this.card = event;
    });
  }

  onFlip() {
    this.flip();
  }

  onKeyPressed(key: string) {
    if (!this.isFlipped) {
      if (key === 'Enter') {
        this.flip();
      }
    } else {
      if (key === '1') {
        this.hasAnswered('y');
      }
      if (key === '3') {
        this.hasAnswered('n');
      }
    }
  }

  onAnswer(answer: string) {
    this.hasAnswered(answer);
  }

  private flip() {
    this.isFlipped = true;
    this.showButtons = true;
    this.answered = false;
  }

  private hasAnswered(answer: string) {
    this.showButtons = false;
    this.answered = true;
    this.answer.next(answer);
    console.log('answer', answer);
  }

  private waitForFlip() {

    // wait for card to flip
    /*
    if (this.platform.isBrowser) {
      // Client only code
      const wait = this.isFlipped ? 100 : 800;
      console.log('wait', wait);
      const timerObservable = timer(wait);
      timerObservable
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(t => {
        this.showButtons = true;
        this.answered = false;
      });
    } else {
      this.showButtons = true;
      this.answered = false;
    }
    */
  }

  ngOnDestroy() {
    this.componentActive = false;
  }

}
