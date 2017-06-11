import {Component, EventEmitter, Input, Output, OnInit, OnDestroy} from '@angular/core';
import {LanPair} from '../../models/course.model';
import {Exercise} from '../../models/exercise.model';
import {TimerObservable} from 'rxjs/observable/TimerObservable';
import {LearnService} from '../../services/learn.service';
import {Subscription} from 'rxjs/Subscription';
import 'rxjs/add/operator/takeWhile';

@Component({
  selector: 'km-learn-study',
  template: `
    STUDY
    <div class="col-xs-8">
      <div class="center">
        <h1>{{wordForeign}}</h1>
        <div class="word type">{{text[currentExercise.wordTpe]}}</div>

        <h1 *ngIf="showLocal else loading">{{wordLocal}}</h1>
      </div>
    </div>
    <div class="col-xs-4">
      <div class="btn btn-success" (click)="onNextWord(-1)">
        <span class="fa fa-step-backward"></span>
      </div>
      <div class="btn btn-success" (click)="onNextWord(1)">
        <span class="fa fa-step-forward"></span>
        {{text.Next}}
      </div>
      <div class="btn btn-warning" (click)="onSkip()">
        <span class="fa fa-fast-forward"></span>
        {{text.Skip}}
      </div>
      SCORE
    </div>
    <pre>{{exercises|json}}</pre>
    <pre>{{lanPair|json}}</pre>

    <ng-template #loading>
      <div class="loading">
        <span *ngFor="let dot of dotArr">
          <span class="fa fa-circle">
          </span>
        </span>
      </div>
    </ng-template>
  `,
  styles: [`
    .center {
      text-align: center;
    }
    .loading {
      margin: 0 auto;
      text-align: left;
      font-size: 8px;
      color: #999;
      margin-top: 40px;
      width: 100px;
    }
  `]
})

export class LearnStudyComponent implements OnInit, OnDestroy {
  @Input() exercises: Exercise[];
  @Input() lanPair: LanPair;
  @Input() text: Object;
  @Output() skipStep = new EventEmitter<string>();
  private componentActive = true;
  private lanLocal: string;
  private lanForeign: string;
  private current = -1;
  private timerActive: boolean;
  private dotLength = 0;
  private currentExercises: Exercise[];
  currentExercise: Exercise;
  wordLocal: string;
  wordForeign: string;
  delayMs: number;
  subscription: Subscription[] = [];
  showLocal = false;
  dotArr: number[] = [];

  constructor(
    private learnService: LearnService
  ) {}

  ngOnInit() {
    this.delayMs = 2000;
    this.lanLocal = this.lanPair.from.slice(0, 2);
    this.lanForeign = this.lanPair.to.slice(0, 2);
    this.currentExercises = this.learnService.shuffle(this.exercises);
    this.onNextWord(1);
  }

  onNextWord(delta: number) {
    this.dotLength = this.delayMs / 200;
    this.dotArr = Array(this.dotLength).fill(0);
    this.current += delta;
    if (delta > 0) {
      if (this.current >= this.currentExercises.length) {
        this.current = 0;
      }
    } else {
      if (this.current <= -1) {
        this.current = this.currentExercises.length - 1;
      }
    }
    this.currentExercise = this.currentExercises[this.current];
    this.showLocal = false;
    this.wordLocal = this.currentExercise[this.lanLocal].word;
    this.wordForeign = this.currentExercise[this.lanForeign].word;
    this.timeDelay();
  }

  onSkip() {
    console.log('skipping');
    this.skipStep.emit('practise');
  }

  private timeDelay() {
    if (this.delayMs > 0) {
      if (this.subscription.length > 0) {
        this.subscription.forEach( sub => sub.unsubscribe());
      }
      // Timer for the local word display
      const wordTimer = TimerObservable.create(this.delayMs);
      this.subscription[0] = wordTimer
      .takeWhile(() => this.componentActive)
      .subscribe(t => this.showLocal = true);

      // Timer for the dots countdown
      const dotTimer = TimerObservable.create(0, 200);
      this.subscription[1] = dotTimer
      .takeWhile(() => this.componentActive && this.dotLength > 0)
      .subscribe(
        t => {
          this.dotLength = this.dotLength - 1;
          this.dotArr = this.dotArr.slice(0, this.dotLength);
          console.log('timed out', this.dotLength, dotTimer);
        }
      );
    } else {
      this.showLocal = true;
    }
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
