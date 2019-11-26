import { Component, Input, Output, OnInit, OnDestroy, EventEmitter } from '@angular/core';
import { WordListService } from '../../services/word-list.service';
import { Book } from 'app/models/book.model';
import { FlashCard, SentenceSection, SentenceWord } from 'app/models/word.model';
import { LanPair, Map } from '../../models/main.model';
import { Subject } from 'rxjs';
import { takeWhile, delay } from 'rxjs/operators';

@Component({
  selector: 'km-flashcard',
  templateUrl: 'flashcard.component.html',
  styleUrls: ['flashcard.component.css']
})

export class BookFlashCardComponent implements OnInit, OnDestroy {
  @Input() text: Object;
  @Input() book: Book;
  @Input() lanPair: LanPair;
  @Input() audioPath: string;
  @Input() private newFlashCard: Subject<FlashCard>;
  @Output() answer = new EventEmitter<string>();
  private componentActive = true;
  flipping: Subject<boolean> = new Subject();
  card: FlashCard;
  isFlipped = false;
  showButtons = false;
  answered = false;
  sentenceSections: Map<SentenceSection[][]> = {};

  constructor(
    private wordListService: WordListService
  ) {}

  ngOnInit() {
    this.newFlashCard
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(event => {
      this.sentenceSections = {};
      this.isFlipped = false;
      this.showButtons = false;
      this.answered = true;
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

  onGetWordSentences(wordId: string) {
    if (wordId) {
      this.fetchSentencesForWord(wordId);
    }
  }

  private fetchSentencesForWord(wordId: string) {
    if (this.book) {
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
  }

  private flip() {
    this.flipping.next(true);
    this.isFlipped = true;
    this.showButtons = true;
    this.answered = false;
  }

  private hasAnswered(answer: string) {
    this.isFlipped = false;
    this.showButtons = false;
    this.answered = true;
    this.answer.next(answer);
  }

  ngOnDestroy() {
    this.componentActive = false;
  }

}
