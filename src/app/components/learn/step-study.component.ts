import {Component, EventEmitter, Input, Output, OnInit, OnDestroy} from '@angular/core';
import {LanPair, Lesson, LessonOptions} from '../../models/course.model';
import {Exercise, ExerciseData, ExerciseStep, ExerciseType, Direction, ExerciseResult} from '../../models/exercise.model';
import {LearnSettings} from '../../models/user.model';
import {TimerObservable} from 'rxjs/observable/TimerObservable';
import {LearnService} from '../../services/learn.service';
import {PreviewService} from '../../services/preview.service';
import {ErrorService} from '../../services/error.service';
import {SharedService} from '../../services/shared.service';
import {Subscription} from 'rxjs/Subscription';
import {ModalConfirmComponent} from '../modals/modal-confirm.component';
import {Subject} from 'rxjs/Subject';
import 'rxjs/add/operator/takeWhile';

@Component({
  selector: 'km-learn-study',
  templateUrl: 'step-study.component.html',
  styleUrls: ['step.component.css', 'step-study.component.css']
})

export class LearnStudyComponent implements OnInit, OnDestroy {
  @Input() private lesson: Lesson;
  @Input() private exercisesInterrupted: Subject<boolean>;
  @Input() private lessonChanged: Subject<Lesson>;
  @Input() lanPair: LanPair;
  @Input() text: Object;
  @Input() isDemo = false;
  @Input() settings: LearnSettings;
  @Output() skipStep = new EventEmitter();
  @Output() stepCompleted = new EventEmitter<ExerciseData[]>();
  @Output() updatedSettings = new EventEmitter<LearnSettings>();
  private componentActive = true;
  private current = -1;
  private timerActive: boolean;
  private dotLength = 0;
  private toStudy = 0;
  isRehearsal = false; // all words have been studied before
  isStudyDone = false; // toggles with every replay
  hasMoreToStudy = false; // to show button to continue studying
  exerciseData: ExerciseData[];
  currentData: ExerciseData;
  subscription: Subscription[] = [];
  showLocal = false;
  dotArr: number[] = [];
  pointsEarned: Subject<number> = new Subject();
  isCountDown: boolean;
  isMute: boolean;
  isReady = false;

  constructor(
    private learnService: LearnService,
    private previewService: PreviewService,
    private errorService: ErrorService,
    private sharedService: SharedService
  ) {}

  ngOnInit() {
    this.init();
    this.checkExercisesInterrupted();
    this.checkLessonChanged();
    this.isMute = this.settings.mute;
  }

  onCountDownFinished() {
    this.isCountDown = false;
    this.finishCountDown();
  }

  onNextWord(delta: number) {
    this.nextWord(delta);
  }

  onStudyNewWords() {
    this.current = -1;
    this.isStudyDone = false;
    this.getLessonResults();
  }

  onRehearseAll() {
    this.lesson.rehearseStep = 'study';
    this.rehearseAll();
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

  getAlts(tpe: string, word: Exercise): string {
    let altwords = '';
    if (word && word[tpe] && word[tpe].alt) {
      altwords = word[tpe].alt.split('|').join(', ');
    }
    return altwords;
  }

  private init() {
    this.isCountDown = false;
    if (this.lesson.rehearseStep === 'study') {
      this.rehearseAll();
    } else {
      this.isRehearsal = false;
      this.getLessonResults();
    }
  }

  private finishCountDown() {
    this.sharedService.changeExerciseMode(true);
    this.nextWord(1);
  }

  private checkLessonChanged() {
    console.log('subscribing to lesson changes');
    this.lessonChanged
    .takeWhile(() => this.componentActive)
    .subscribe((event: Lesson) => {
      console.log('LESSON CHANGED in study TO ', event.name);
      this.lesson = event;
      this.init();
    });
  }

  private nextWord(delta: number) {
    if (!this.showLocal && this.current > -1) {
      this.wordDone();
    } else {
      if (!this.isStudyDone) {
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
        this.studyDone(this.exerciseData.length);
        this.sharedService.changeExerciseMode(false);
        if (this.lesson.rehearseStep === 'study') {
          this.stepCompleted.emit(null);
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
        currentExercise.data.points.base = 0;
        if (!currentExercise.result) {
          currentExercise.data.points.base = points;
          this.pointsEarned.next(points);
        }
      }
    }
  }

  private studyDone(nrDone: number) {
    console.log('More to study?', this.toStudy, nrDone);
    this.hasMoreToStudy = this.toStudy - nrDone > 0;
    this.isStudyDone = true;
  }

  private filterExercises(): Exercise[] {
    // Only the exercises of type word are shown in study
    return this.lesson.exercises.filter(exercise => exercise.tpe === ExerciseType.Word);
  }

  private getLessonResults() {
    if (!this.isDemo) {
      this.fetchLessonResults();
    } else {
      this.getNewQuestions(null);
    }
  }

  private fetchLessonResults() {
    // fetch results for all exercises in this lesson
    this.learnService
    .getLessonResults(this.lesson._id, 'study')
    .takeWhile(() => this.componentActive)
    .subscribe(
      results => {
        console.log('study results', results);
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

    this.toStudy = 0;
    // Select exercises with no result
    this.filterExercises().forEach(exercise => {
      exerciseResult = results && results.find(result => result.exerciseId === exercise._id);
      if (!exerciseResult) {
        this.toStudy++;
        // study not done yet, add to list of new questions
        if (newExercises.length <= this.settings.nrOfWordsStudy) {
          newExercises.push(exercise);
        }
      }
    });
    if (newExercises.length > 0) {
      this.buildExerciseData(newExercises);
    } else {
      this.isReady = true;
    }
  }

  private buildExerciseData(newExercises: Exercise[]) {
    this.exerciseData = this.learnService.buildExerciseData(
      newExercises,
      null,
      this.text, {
        isForeign: true,
        isBidirectional: false,
        direction: Direction.ForeignToLocal
      },
      this.lesson.options,
      null
    );
    if (!this.lesson.exerciseSteps.study.ordered) {
      this.exerciseData = this.previewService.shuffle(this.exerciseData);
    }
    this.isCountDown = this.settings.countdown;
    if (!this.isCountDown) {
      this.finishCountDown();
    }
    this.isReady = true;
  }

  private skip() {
    this.skipStep.emit();
  }

  private rehearseAll() {
    this.current = -1;
    this.isStudyDone = false;
    this.hasMoreToStudy = false;
    this.isRehearsal = true;
    this.isCountDown = false;
    this.buildExerciseData(this.filterExercises());
    this.exerciseData.map(exercise => exercise.data.isDone = false);
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
      let nrDone = 0;
      if (!this.isRehearsal) { // Don't save if this is a rehearsal
        nrDone = this.current;
        if (this.currentData.data.isDone) {
          nrDone++;
        }
        this.studyDone(nrDone);
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
