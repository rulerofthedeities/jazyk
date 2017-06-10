import {Component, EventEmitter, Input, Output, OnInit, OnDestroy} from '@angular/core';
import {LanPair} from '../../models/course.model';
import {Exercise} from '../../models/exercise.model';
import {TimerObservable} from 'rxjs/observable/TimerObservable';
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

        <h1 *ngIf="showLocal">{{wordLocal}}</h1>
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

  `,
  styles: [`
    .center {
      text-align: center;
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
  currentExercise: Exercise;
  wordLocal: string;
  wordForeign: string;
  delayMs: number;
  subscription: Subscription;
  showLocal = false;

  ngOnInit() {
    this.delayMs = 1000;
    this.lanLocal = this.lanPair.from.slice(0, 2);
    this.lanForeign = this.lanPair.to.slice(0, 2);
    this.onNextWord(1);
  }

  onNextWord(delta: number) {
    this.current += delta;
    if (delta > 0) {
      if (this.current >= this.exercises.length) {
        this.current = 0;
      }
    } else {
      if (this.current <= -1) {
        this.current = this.exercises.length - 1;
      }
    }
    this.currentExercise = this.exercises[this.current];
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
      if (this.subscription) {
        this.subscription.unsubscribe();
      }
      const timer = TimerObservable.create(this.delayMs);
      this.subscription = timer
      .takeWhile(() => this.componentActive)
      .subscribe(
        t => {
          console.log('timed out', t, timer);
          this.showLocal = true;
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
