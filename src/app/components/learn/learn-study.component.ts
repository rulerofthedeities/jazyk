import {Component, EventEmitter, Input, Output, OnInit, OnDestroy} from '@angular/core';
import {LanPair} from '../../models/course.model';
import {Exercise} from '../../models/exercise.model';
import {TimerObservable} from 'rxjs/observable/TimerObservable';
import {LearnService} from '../../services/learn.service';
import {Subscription} from 'rxjs/Subscription';
import {ModalConfirmComponent} from '../modals/modal-confirm.component';
import 'rxjs/add/operator/takeWhile';

@Component({
  selector: 'km-learn-study',
  templateUrl: 'learn-study.component.html',
  styleUrls: ['learn-study.component.css']
})

export class LearnStudyComponent implements OnInit, OnDestroy {
  @Input() exercises: Exercise[];
  @Input() lanPair: LanPair;
  @Input() text: Object;
  @Output() skipStep = new EventEmitter<string>();
  @Output() stepCompleted = new EventEmitter<number>();

  private componentActive = true;
  private lanLocal: string;
  private lanForeign: string;
  private current = -1;
  private timerActive: boolean;
  private dotLength = 0;
  private currentExercises: Exercise[];
  private isStudyDone = false; // toggles with every replay
  private isWordsDone =  false; // true once words are done once
  isDone: boolean[] = [];
  currentExercise: Exercise;
  wordLocal: string;
  wordForeign: string;
  delayMs: number;
  subscription: Subscription[] = [];
  showLocal = false;
  dotArr: number[] = [];
  score = 0;

  constructor(
    private learnService: LearnService
  ) {}

  ngOnInit() {
    this.delayMs = 2000;
    this.lanLocal = this.lanPair.from.slice(0, 2);
    this.lanForeign = this.lanPair.to.slice(0, 2);
    this.currentExercises = this.learnService.shuffle(this.exercises);
    this.nextWord(1);
  }

  onNextWord(delta: number) {
    if (!this.isWordsDone) {
      this.score = this.score + 2;
    }
    this.nextWord(delta);
  }

  onSkipRequested(confirm: ModalConfirmComponent) {
    // Only show a modal if it is not a restart
    if (this.isWordsDone) {
      this.skip();
    } else {
      confirm.showModal = true;
    }
  }

  onSkipConfirmed(skipOk: boolean) {
    if (skipOk) {
      this.skip();
    }
  }

  onEnter() {
    if (!this.isStudyDone) {
      this.nextWord(1);
    } else {
      this.skip();
    }
  }

  onUpdateSettings() {
    
  }

  isCurrent(i: number): boolean {
    return this.current === i;
  }

  isWordDone(i: number): boolean {
    return this.isDone[i];
  }

  getSuffix(): string {
    const foreign = this.currentExercise[this.lanForeign];
    let suffix = '';
    if (foreign && foreign.followingCase) {
      suffix =  this.text['case' + foreign.followingCase];
      if (suffix) {
        suffix = '(+' + suffix.slice(0, 1).toUpperCase() + ')';
      }
    }
    return suffix;
  }

  getGenus(): string {
    const foreign = this.currentExercise[this.lanForeign];
    let genus = '';
    if (foreign && foreign.genus) {
      genus = '(' + foreign.genus.toLowerCase() + ')';
    }
    return genus;
  }

  private nextWord(delta: number) {
    if (!this.showLocal && this.currentExercise) {
      this.showLocal = true;
    } else {
      if (this.isStudyDone) {
        this.restart();
      } else {
        this.showNextWord(delta);
      }
    }
  }

  private showNextWord(delta: number) {
    if (this.current > -1) {
      this.isDone[this.current] = true;
    }
    this.dotLength = this.delayMs / 200;
    this.dotArr = Array(this.dotLength).fill(0);
    this.current += delta;
    if (delta > 0) {
      if (this.current >= this.currentExercises.length) {
        this.isStudyDone = true;
        this.isWordsDone = true;
        this.stepCompleted.emit(0);
      }
    } else {
      if (this.current <= -1) {
        this.current = this.currentExercises.length - 1;
      }
    }
    if (!this.isStudyDone) {
      this.currentExercise = this.currentExercises[this.current];
      this.showLocal = false;
      this.wordLocal = this.currentExercise[this.lanLocal].word;
      this.wordForeign = this.currentExercise[this.lanForeign].word;
      this.timeDelay();
    }
  }

  private skip() {
    this.skipStep.emit('practise');
  }

  private restart() {
    this.current = -1;
    this.currentExercises = this.learnService.shuffle(this.exercises);
    this.isStudyDone = false;
    this.nextWord(1);
  }

  private timeDelay() {
    if (this.delayMs > 0 && !this.showLocal) {
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
