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
  @Input() private exercises: Exercise[];
  @Input() lanPair: LanPair;
  @Input() text: Object;
  @Input() lessonId: string;
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
  isRestart = false;

  constructor(
    private learnService: LearnService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.fetchLessonResults();
    this.isCountDown = this.settings.countdown;
    this.isMute = this.settings.mute;
  }

  onCountDownFinished() {
    this.isCountDown = false;
    this.nextWord(1);
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
      this.wordDone();
    } else {
      if (this.isStudyDone) {
        this.restart();
      } else {
        this.showNextWord(delta);
      }
    }
  }

  private showNextWord(delta: number) {
    this.pointsEarned.next(0);
    this.dotLength = this.settings.delay * 1000 / 200;
    this.dotArr = Array(this.dotLength).fill(0);
    this.current += delta;
    if (delta > 0) {
      if (this.current >= this.exerciseData.length) {
        this.isStudyDone = true;
        this.isWordsDone = true;
        if (this.isRestart) {
          this.stepCompleted.emit(null); // don't update step counter
        } else {
          this.stepCompleted.emit(this.exerciseData);
        }
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

  private wordDone() {
    if (!this.showLocal && this.current > -1) {
      this.showLocal = true;
      const points = 2,
            currentExercise = this.exerciseData[this.current];
      currentExercise.data.isDone = true;
      currentExercise.data.isCorrect = true;
      currentExercise.data.points = 0;
      if (!currentExercise.result) {
        this.score = this.score + points;
        currentExercise.data.points = points;
        this.pointsEarned.next(points);
      }
    }
  }

  private fetchLessonResults() {
    // fetch results for all exercises in this lesson
    this.learnService
    .getLessonResults(this.lessonId, 'study')
    .takeWhile(() => this.componentActive)
    .subscribe(
      results => {
        if  (results) {
          this.getNewQuestions(results);
        }
      },
      error => this.errorService.handleError(error)
    );
  }

  private getNewQuestions(results: ExerciseResult[]) {
    let nrOfExercises = 0,
        exerciseResult: ExerciseResult;
    const newExercises: Exercise[] = [];

    // Select exercises with no result
    this.exercises.forEach(exercise => {
      if (nrOfExercises < this.settings.nrOfWords) {
        exerciseResult = results.find(result => result.exerciseId === exercise._id);
        if (!exerciseResult) {
          // study not done yet, add to list of new questions
          newExercises.push(exercise);
          nrOfExercises = newExercises.length;
        }
      }
    });
    this.buildExerciseData(newExercises);
  }

  private buildExerciseData(newExercises: Exercise[]) {
    this.exerciseData = this.learnService.buildExerciseData(newExercises, null, this.text, {
      isForeign: true,
      isBidirectional: false,
      direction: Direction.ForeignToLocal
    });
    if (!this.options.ordered) {
      this.exerciseData = this.learnService.shuffle(this.exerciseData);
    }
    if (!this.isCountDown) {
      this.nextWord(1);
    }
    this.isReady = true;
    console.log('exercisedata', this.exerciseData);
  }

  private skip() {
    this.skipStep.emit();
  }

  private restart() {
    this.isRestart = true;
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
      .takeWhile(() => this.componentActive && !this.showLocal)
      .subscribe(t => this.wordDone());

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
      this.wordDone();
    }
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
