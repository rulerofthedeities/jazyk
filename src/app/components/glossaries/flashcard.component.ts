import { Component, Input, Output, OnInit, OnDestroy, EventEmitter } from '@angular/core';
import { FlashCard } from 'app/models/word.model';
import { LanPair } from '../../models/main.model';
import { Subject } from 'rxjs';
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
  flipping: Subject<boolean> = new Subject();
  card: FlashCard;
  private componentActive = true;
  isFlipped = false;
  showButtons = false;
  answered = false;

  ngOnInit() {
    this.newFlashCard
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(event => {
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
    this.flipping.next(true);
    this.isFlipped = true;
    this.showButtons = true;
    this.answered = false;
  }

  private hasAnswered(answer: string) {
    this.showButtons = false;
    this.answered = true;
    this.answer.next(answer);
  }

  ngOnDestroy() {
    this.componentActive = false;
  }

}
