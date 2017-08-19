import {Component, EventEmitter, Input, Output, OnInit, OnDestroy} from '@angular/core';
import {LanPair} from '../../models/course.model';
import {Exercise, ExerciseData, ExerciseTpe, Direction, ExerciseResult} from '../../models/exercise.model';
import {LearnSettings} from '../../models/user.model';
import {TimerObservable} from 'rxjs/observable/TimerObservable';
import {LearnService} from '../../services/learn.service';
import {ErrorService} from '../../services/error.service';
import {Subscription} from 'rxjs/Subscription';
import {Subject} from 'rxjs/Subject';
import {ModalConfirmComponent} from '../modals/modal-confirm.component';
import 'rxjs/add/operator/takeWhile';

@Component({
  selector: 'km-learn-study',
  templateUrl: 'step-study.component.html',
  styleUrls: ['step.component.css', 'step-study.component.css']
})

export class LearnStudyComponent implements OnInit, OnDestroy {
  @Input() exercises: Exercise[];
  @Input() results: ExerciseResult[];
  @Input() lanPair: LanPair;
  @Input() text: Object;
  @Input() userId: string;
  @Input() courseId: string;
  @Input() options: ExerciseTpe;
  @Input() settings: LearnSettings;
  @Output() skipStep = new EventEmitter();
  @Output() stepCompleted = new EventEmitter<ExerciseData[]>();
  @Output() updatedSettings = new EventEmitter<LearnSettings>();
  private componentActive = true;
  private current = -1;
  private timerActive: boolean;
  private dotLength = 0;
  private isWordsDone =  false; // true once words are done once
  isStudyDone = false; // toggles with every replay
  exerciseData: ExerciseData[];
  currentData: ExerciseData;
  subscription: Subscription[] = [];
  showLocal = false;
  dotArr: number[] = [];
  score = 0;
  pointsEarned: Subject<any> = new Subject();
  isCountDown: boolean;
  isMute: boolean;
  isReady = false;

  constructor(
    private learnService: LearnService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.fetchPreviousResults();
    this.isCountDown = this.settings.countdown;
    this.isMute = this.settings.mute;
  }

  onCountDownFinished() {
    this.isCountDown = false;
  }

  onNextWord(delta: number) {
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

  onKeyPressed(key: string) {
    if (key === 'Enter') {
      if (!this.isStudyDone) {
        this.nextWord(1);
      } else {
        this.skip();
      }
    }
  }

  onSettingsUpdated(settings: LearnSettings) {
    this.settings = settings;
    this.updatedSettings.emit(settings);
  }

  private nextWord(delta: number) {
    if (!this.showLocal && this.current > -1) {
      this.pointsEarned.next(0); // clear earned points
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
      const points = 2;
      this.exerciseData[this.current].data.isDone = true;
      this.exerciseData[this.current].data.isCorrect = true;
      this.exerciseData[this.current].data.points = 0;
      if (!this.exerciseData[this.current].result) {
        this.score = this.score + points;
        this.exerciseData[this.current].data.points = points;
        this.pointsEarned.next(points);
      }
    }
    this.dotLength = this.settings.delay * 1000 / 200;
    this.dotArr = Array(this.dotLength).fill(0);
    this.current += delta;
    if (delta > 0) {
      if (this.current >= this.exerciseData.length) {
        this.isStudyDone = true;
        this.isWordsDone = true;
        this.stepCompleted.emit(this.exerciseData);
      }
    } else {
      if (this.current <= -1) {
        this.current = this.exerciseData.length - 1;
      }
    }
    if (!this.isStudyDone) {
      this.showLocal = false;
      this.currentData = this.exerciseData[this.current];
      this.timeDelay();
    }
  }

  private getQuestions() {
    this.exerciseData = this.learnService.buildExerciseData(this.exercises, this.results, this.text, {
      isForeign: true,
      isBidirectional: false,
      direction: Direction.ForeignToLocal
    });
    if (!this.options.ordered) {
      this.exerciseData = this.learnService.shuffle(this.exerciseData);
    }
    this.nextWord(1);
    this.isReady = true;
    console.log('exercisedata', this.exerciseData);
  }

  private fetchPreviousResults() {
    const exerciseIds = this.exercises.map(exercise => exercise._id);

    this.learnService
    .getPreviousResults(this.userId, this.courseId, 'study', exerciseIds)
    .takeWhile(() => this.componentActive)
    .subscribe(
      results => {
        console.log('previous results', results);
        if (results) {
          this.results = results;
        }
        this.getQuestions();
      },
      error => this.errorService.handleError(error)
    );
  }

  private skip() {
    this.skipStep.emit();
  }

  private restart() {
    this.current = -1;
    this.exerciseData = this.learnService.shuffle(this.exerciseData);
    this.isStudyDone = false;
    this.nextWord(1);
  }

  private timeDelay() {
    if (this.settings.delay > 0 && !this.showLocal) {
      if (this.subscription.length > 0) {
        this.subscription.forEach( sub => sub.unsubscribe());
      }
      // Timer for the local word display
      const wordTimer = TimerObservable.create(this.settings.delay * 1000);
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
