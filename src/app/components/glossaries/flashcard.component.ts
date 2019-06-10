import { Component, Input, Output, OnInit, OnDestroy, EventEmitter } from '@angular/core';
import { PlatformService } from '../../services/platform.service';
import { Flashcard } from 'app/models/word.model';
import { LanPair } from '../../models/main.model';
import { timer, Subject } from 'rxjs';
import { takeWhile, delay } from 'rxjs/operators';

@Component({
  selector: 'km-flashcard',
  templateUrl: 'flashcard.component.html',
  styleUrls: ['flashcard.component.css']
})

export class BookFlashcardComponent implements OnInit, OnDestroy {
  @Input() text: Object;
  @Input() lanPair: LanPair;
  @Input() audioPath: string;
  @Input() private newFlashCard: Subject<Flashcard>;
  @Output() answer = new EventEmitter<string>();
  card: Flashcard;
  private componentActive = true;
  isFlipped = false;
  showButtons = false;
  answered = false;

  constructor (
    private platform: PlatformService
  ) {}

  ngOnInit() {
    console.log('observe new flash card');
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
    this.isFlipped = true;
    this.waitForFlip();
  }

  onAnswer(answer: string) {
    this.showButtons = false;
    this.answered = true;
    this.answer.next(answer);

    console.log('answer', answer);
  }

  private waitForFlip() {
    // wait for card to flip
    if (this.platform.isBrowser) {
      // Client only code
      const timerObservable = timer(800);
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
  }

  ngOnDestroy() {
    this.componentActive = false;
  }

}
