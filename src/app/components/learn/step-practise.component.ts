import {Component, Input, Output, OnInit, EventEmitter, OnDestroy} from '@angular/core';
import {Step} from './step-base.component';
import {Exercise, ExerciseData, Direction, ExerciseResult,
        ExerciseType, AnsweredType, QuestionType} from '../../models/exercise.model';
import {Lesson} from '../../models/course.model';
import {LearnService} from '../../services/learn.service';
import {PreviewService} from '../../services/preview.service';
import {isLearnedLevel, SharedService} from '../../services/shared.service';
import {UserService} from '../../services/user.service';
import {AudioService} from '../../services/audio.service';
import {ErrorService} from '../../services/error.service';
import {Subject} from 'rxjs';
import {takeWhile, delay} from 'rxjs/operators';

@Component({
  selector: 'km-learn-practise',
  templateUrl: 'step-practise.component.html',
  styleUrls: ['step.component.css']
})

export class LearnPractiseComponent extends Step implements OnInit, OnDestroy {
  @Input() private lessonChanged: Subject<Lesson>;
  @Input() hasStudyTab: boolean;
  @Input() isDemo = false;
  @Output() lessonCompleted = new EventEmitter<string>();
  @Output() stepBack = new EventEmitter();
  toPractise = 0;
  isLoading = false;
  isRehearsal = false;
  beep: any;

  constructor(
    learnService: LearnService,
    previewService: PreviewService,
    sharedService: SharedService,
    errorService: ErrorService,
    private userService: UserService,
    private audioService: AudioService
  ) {
    super(learnService, previewService, errorService, sharedService);
  }

  ngOnInit() {
    this.currentStep = 'practise';
    this.beep = this.audioService.loadAudio('/assets/audio/gluck.ogg');
    this.checkLessonChanged();
    this.getLessonResults();
  }

  onToStudy() {
    this.stepBack.emit();
  }

  onContinuePractise() {
    this.clearToContinue();
    this.fetchLessonResults();
  }

  onToNextLesson() {
    if (!this.lesson.rehearseStep) {
      this.lessonCompleted.emit(this.lesson._id);
    }
  }

  onRehearseAll() {
    this.rehearseAll();
  }

  isWordCorrect(): boolean {
    let isCorrect = false;
    let data: ExerciseData;
    if (this.current >= 0) {
      data = this.exerciseData[this.current];
      isCorrect = data.data.isCorrect;
    }
    return isCorrect;
  }

  getAlts(tpe: string, word: Exercise): string {
    let altwords = '';
    if (word && word[tpe] && word[tpe].alt) {
      altwords = word[tpe].alt.split('|').join(', ');
    }
    return altwords;
  }

  protected nextWord() {
    super.nextWord();
  }

  protected doAddExercise(aType: AnsweredType, qType: QuestionType, learnLevel: number): boolean {
    const nrOfQuestions = this.exerciseData.length;
    let add = false;
    if (aType === AnsweredType.Correct || aType === AnsweredType.Alt) {
      switch (qType) {
        case QuestionType.Choices:
          if (nrOfQuestions < this.settings.nrOfWordsLearn * this.maxRepeatWord && learnLevel < isLearnedLevel) {
            add = true;
          }
        break;
        case QuestionType.Word:
          if ((nrOfQuestions < this.settings.nrOfWordsLearn * this.maxRepeatWord || learnLevel < 3) && learnLevel < isLearnedLevel) {
            add = true;
          }
        break;
        default:
          add = false;
        break;
      }
    } else {
      add = true;
    }
    // Only readd exercise to the back if question asked < x times
    const exercise = this.dataByExerciseUnid[this.currentData.exercise._id], // in practise unid === exerciseid
          countWrong = exercise.countWrong ? exercise.countWrong : 0,
          correct = aType === AnsweredType.Correct  || aType === AnsweredType.Alt,
          countRight = exercise.countRight ? exercise.countRight : 0;
    if (!(correct && countRight <= 4 || !correct && countWrong <= 3)) {
      add = false;
    }
    return add;
  }

  protected shuffleRemainingExercises() {
    const original = this.lesson.exercises.length,
          total = this.exerciseData.length,
          nrDone = this.current + 1, // skip next
          done = this.exerciseData.slice(0, nrDone),
          doShuffle = nrDone > original && total - nrDone > 2;
    let forceShuffle = false;
    if (this.exerciseData[this.current]) {
      forceShuffle = this.exerciseData[this.current].data.questionType === QuestionType.Preview;
    }
    if (forceShuffle || doShuffle) {
      const skipLast = total > 1 ? 1 : 0, // To prevent repeats, do not shuffle last entry
            last = this.exerciseData.slice(-1),
            todo = this.exerciseData.slice(nrDone, total - skipLast),
            shuffled = this.previewService.shuffle(todo);
      this.exerciseData = done.concat(shuffled);
      if (skipLast === 1) {
        this.exerciseData = this.exerciseData.concat(last);
      }
    }
  }

  protected determineQuestionType(exercise: ExerciseData, learnLevel: number): QuestionType {
    // Determine if multiple choice or word
    // If there is no study tab and the word is shown for the first time, question type is a preview (only for words)
    if (!this.hasStudyTab && !exercise.result && exercise.data.answered === 0 && exercise.exercise.tpe === ExerciseType.Word) {
      return QuestionType.Preview;
    }
    let qTpe = QuestionType.Choices;
    const tpe = exercise.exercise.tpe || ExerciseType.Word;
    switch (tpe) {
      case ExerciseType.Word:
        if (exercise.result) {
          // 6 -> 8: random
          if (learnLevel > 5 && learnLevel < 9) {
            qTpe =  Math.random() >= 0.5 ? QuestionType.Choices : QuestionType.Word;
          }
          // 9+ : always word
          if (learnLevel > 8) {
            qTpe = QuestionType.Word;
          }
        }
      break;
      case ExerciseType.Genus:
      case ExerciseType.Article:
      case ExerciseType.Select:
        qTpe = QuestionType.Select;
        break;
      case ExerciseType.QA:
      case ExerciseType.FillIn:
        qTpe = QuestionType.FillIn;
      break;
      case ExerciseType.Comparison:
        qTpe = QuestionType.Comparison;
      break;
      case ExerciseType.Conjugations:
        qTpe = QuestionType.Conjugations;
      break;
    }
    return qTpe;
  }

  protected getNrOfChoices(learnLevel: number): number {
    let nrOfChoices: number;
    if (learnLevel <= 0) {
      nrOfChoices = 4;
    } else {
      nrOfChoices = 6;
    }
    if (learnLevel >= 3) {
      nrOfChoices = 8;
    }
    return nrOfChoices;
  }

  private getLessonResults() {
    if (this.lesson.rehearseStep === 'practise') {
      this.rehearseAll();
    } else {
      this.isRehearsal = false;
      if (!this.isDemo) {
        this.fetchLessonResults();
      } else {
        const studyData = this.userService.getDemoData('study', this.course._id),
              practiseData = this.userService.getDemoData('practise', this.course._id);
        if (!practiseData) {
          this.noMoreExercises = false;
          this.getDemoQuestions();
        } else {
          this.noMoreExercises = true;
          this.isReady = true;
        }
      }
    }
  }

  private fetchLessonResults() {
    // fetch results for all exercises in this lesson
    let leftToStudy: number;
    this.isLoading = true;
    this.learnService
    .fetchLessonStepResults(this.lesson._id, 'practise')
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      results => {
        this.isLoading = false;
        if  (results && results.count) {
          leftToStudy = this.getNewQuestions(results.count);
        }
        this.isReady = true;
        if (this.exerciseData.length > 0) {
          super.init(); // start countdown
        } else {
          this.noMoreExercises = true;
        }
      },
      error => this.errorService.handleError(error)
    );
  }

  private getNewQuestions(results: ExerciseResult[]): number {
    let leftToStudy = 0,
        exerciseResult: ExerciseResult,
        practiseExercises: Exercise[] = [];
    const newExercises: Exercise[] = [],
          newResults: ExerciseResult[] = [];

    // Select exercises that have not been learned yet
    // (but have been studied if word unless there is no study tab)
    practiseExercises = this.lesson.exercises.filter(exercise => {
      exerciseResult = results && results.find(result => result.exerciseId === exercise._id);
      return ((exerciseResult && !exerciseResult.isLearned)
        || (!exerciseResult && (exercise.tpe !== ExerciseType.Word || !this.hasStudyTab))
      );
    });
    this.toPractise = practiseExercises.length;
    const maxWords = this.learnService.getMaxExercises(practiseExercises, this.settings.nrOfWordsLearn);
    practiseExercises.forEach(exercise => {
      if (newExercises.length < maxWords) {
        // word is not learned yet; add to list of new questions
        newExercises.push(exercise);
        exerciseResult = results && results.find(result => result.exerciseId === exercise._id);
        newResults.push(exerciseResult);
      } else {
        // word is not studied yet
        leftToStudy++;
      }
    });
    this.buildExerciseData(newExercises, newResults);
    return leftToStudy;
  }

  private getDemoQuestions() {
    const exercises = this.lesson.exercises.slice(0, this.settings.nrOfWordsLearn);
    this.buildExerciseData(exercises, null);
    this.current = -1;
    this.isQuestionReady = false;
    this.isExercisesDone = false;
    this.noMoreExercises = false;
    this.isReady = true;
    super.init(); // start countdown
  }

  private rehearseAll() {
    this.current = -1;
    this.isRehearsal = true;
    this.isExercisesDone = false;
    this.getRepeatQuestions();
  }

  private getRepeatQuestions() {
    const maxNr = this.settings.nrOfWordsLearnRepeat || 10,
          repeatExercises = this.learnService.getRandomExercises(this.lesson.exercises, maxNr);
    this.buildExerciseData(repeatExercises, null);
    this.isReady = true;
    super.init(); // start countdown
  }

  protected buildExerciseData(newExercises: Exercise[], results: ExerciseResult[]) {
    const stepOptions = this.lesson.exerciseSteps.practise;
    this.exerciseData = this.learnService.buildExerciseData(
      newExercises,
      results,
      this.text, {
        isBidirectional: stepOptions.bidirectional,
        direction: Direction.LocalToForeign
      },
      this.lesson ? this.lesson.options : null
    );
    if (!stepOptions.ordered) {
      this.exerciseData = this.previewService.shuffle(this.exerciseData);
    }
    this.setExerciseDataById();
    this.getChoices(this.course._id, stepOptions.bidirectional);
  }

  protected soundLearnedLevel(learnLevel: number) {
    if (learnLevel > isLearnedLevel) {
      this.audioService.playSound(this.settings.mute, this.beep);
    }
  }

  protected previewDone() {
    const currentExercise = this.exerciseData[this.current],
          points = 2;
    if (currentExercise) {
      currentExercise.data.isDone = true;
      currentExercise.data.isCorrect = true;
      currentExercise.data.points.base = points;
      if (!currentExercise.result) {
        currentExercise.data.points.base = points;
      }
      this.pointsEarned.next(points);
      this.addExercise(null, null);
      this.nextWord();
    }
  }

  private checkLessonChanged() {
    this.lessonChanged
    .pipe(takeWhile(() => this.componentActive))
    .subscribe((lesson: Lesson) => {
      this.lesson = lesson;
      if (this.lesson.rehearseStep) {
        // This is a repeat
      } else {
        this.noMoreExercises = false;
        this.isExercisesDone = false;
        this.getLessonResults();
      }
    });
  }

  protected calculateAgePoints(resultData: ExerciseData): number {
    // Only for review & difficult
    return 0;
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
