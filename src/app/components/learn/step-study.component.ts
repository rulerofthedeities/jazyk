import {Component, EventEmitter, Input, Output, OnInit, OnDestroy} from '@angular/core';
import {LanPair} from '../../models/course.model';
import {Exercise, ExerciseData, ExerciseStep, ExerciseType, Direction, ExerciseResult} from '../../models/exercise.model';
import {LearnSettings} from '../../models/user.model';
import {TimerObservable} from 'rxjs/observable/TimerObservable';
import {LearnService} from '../../services/learn.service';
import {ErrorService} from '../../services/error.service';
import {SharedService} from '../../services/shared.service';
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
  @Input() private exercisesInterrupted: Subject<boolean>;
  @Input() lanPair: LanPair;
  @Input() text: Object;
  @Input() lessonId: string;
  @Input() options: ExerciseStep;
  @Input() settings: LearnSettings;
  @Output() skipStep = new EventEmitter();
  @Output() stepCompleted = new EventEmitter<ExerciseData[]>();
  @Output() updatedSettings = new EventEmitter<LearnSettings>();
  private componentActive = true;
  private current = -1;
  private timerActive: boolean;
  private dotLength = 0;
  isRehearsal = false; // all words have been studied before
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
    private errorService: ErrorService,
    private sharedService: SharedService
  ) {}

  ngOnInit() {
    this.filterExercises();
    this.fetchLessonResults();
    this.checkExercisesInterrupted();
    this.isMute = this.settings.mute;
  }

  onCountDownFinished() {
    this.sharedService.changeExerciseMode(true);
    this.isCountDown = false;
    this.nextWord(1);
  }

  onNextWord(delta: number) {
    this.nextWord(delta);
  }

  onStudyNewWords() {
    this.fetchLessonResults();
  }

  onRehearseAll() {
    this.current = -1;
    this.isRehearsal = true;
    this.isCountDown = true;
    this.buildExerciseData(this.exercises);
    this.exerciseData.map(exercise => exercise.data.isDone = false);
  }

  onSkipConfirmed(skipOk: boolean) {
    if (skipOk) {
      this.skip();
    }
  }

  onToPractise() {
    this.skip();
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
        this.sharedService.changeExerciseMode(false);
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
      const points = this.isRehearsal ? 0 : 2,
            currentExercise = this.exerciseData[this.current];
      if (currentExercise) {
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
  }

  private filterExercises() {
    // Only the exercises of type word are shown in study
    this.exercises = this.exercises.filter(exercise => exercise.tpe === ExerciseType.Word);
    console.log('exercises', this.exercises);
  }

  private fetchLessonResults() {
    // fetch results for all exercises in this lesson
    this.learnService
    .getLessonResults(this.lessonId, 'study')
    .takeWhile(() => this.componentActive)
    .subscribe(
      results => {
        console.log('results', results);
        if (results) {
          this.getNewQuestions(results);
        }
      },
      error => this.errorService.handleError(error)
    );
  }

  private getNewQuestions(results: ExerciseResult[]) {
    let exerciseResult: ExerciseResult;
    const newExercises: Exercise[] = [];

    // Select exercises with no result
    this.exercises.forEach(exercise => {
      if (newExercises.length < this.settings.nrOfWords) {
        exerciseResult = results.find(result => result.exerciseId === exercise._id);
        if (!exerciseResult) {
          // study not done yet, add to list of new questions
          newExercises.push(exercise);
        }
      }
    });
    if (newExercises.length > 0) {
      this.isCountDown = this.settings.countdown;
    }
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
      this.onCountDownFinished();
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
    this.sharedService.changeExerciseMode(true);
    this.nextWord(1);
  }

  private timeDelay() {
    if (this.settings.delay > 0 && !this.showLocal) {
      if (this.subscription.length > 0) {
        this.subscription.forEach(sub => sub.unsubscribe());
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

  checkExercisesInterrupted() {
    this.exercisesInterrupted
    .takeWhile(() => this.componentActive)
    .subscribe( event => {
      this.isStudyDone = true;
      let nrDone = 0;

      if (!this.isRehearsal) {
        nrDone = this.current;
        if (this.currentData.data.isDone) {
          nrDone++;
        }
      }
      if (nrDone > 0) {
        // Show results page
        this.exerciseData = this.exerciseData.slice(0, nrDone);
        this.stepCompleted.emit(this.exerciseData);
      } else {
        // No words were done
        this.stepCompleted.emit(null);
      }
    });
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
