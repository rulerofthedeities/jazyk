import {Component, Input, Output, OnInit, EventEmitter, OnDestroy} from '@angular/core';
import {Step} from './step-base.component';
import {Exercise, ExerciseData, ExerciseOptions, Direction,
        ExerciseResult, ExerciseType, Choice, AnsweredType, QuestionType} from '../../models/exercise.model';
import {LearnSettings} from '../../models/user.model';
import {LearnService} from '../../services/learn.service';
import {PreviewService} from '../../services/preview.service';
import {SharedService} from '../../services/shared.service';
import {AudioService} from '../../services/audio.service';
import {ErrorService} from '../../services/error.service';
import {TimerObservable} from 'rxjs/observable/TimerObservable';
import 'rxjs/add/operator/takeWhile';

interface Map<T> {
  [K: string]: T;
}

@Component({
  selector: 'km-learn-practise',
  templateUrl: 'step-practise.component.html',
  styleUrls: ['step.component.css']
})

export class LearnPractiseComponent extends Step implements OnInit, OnDestroy {
  @Input() learnedLevel: number;
  @Input() hasStudyTab: boolean;
  // @Output() stepCompleted = new EventEmitter<ExerciseData[]>();
  @Output() lessonCompleted = new EventEmitter<string>();
  @Output() stepBack = new EventEmitter();
  noMoreToStudy = false;
  beep: any;

  constructor(
    learnService: LearnService,
    previewService: PreviewService,
    sharedService: SharedService,
    errorService: ErrorService,
    private audioService: AudioService
  ) {
    super(learnService, previewService, errorService, sharedService);
  }

  ngOnInit() {
    this.currentStep = 'practise';
    this.beep = this.audioService.loadAudio('/assets/audio/gluck.ogg');
    this.fetchLessonResults();
  }

  onToStudy() {
    this.stepBack.emit();
  }

  onToNextLesson() {
    this.lessonCompleted.emit(this.lessonId);
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
          if (nrOfQuestions < this.settings.nrOfWordsLearn * this.maxRepeatWord && learnLevel < this.learnedLevel) {
            add = true;
          }
        break;
        case QuestionType.Word:
          if ((nrOfQuestions < this.settings.nrOfWordsLearn * this.maxRepeatWord || learnLevel < 3) && learnLevel < this.learnedLevel) {
            add = true;
          }
        break;
        case QuestionType.Select:
        case QuestionType.FillIn:
          add = false;
        break;
      }
    } else {
      add = true;
    }
    // Only readd exercise to the back if question asked < x times
    const exercise = this.dataByExercise[this.currentData.exercise._id],
          countWrong = exercise.countWrong ? exercise.countWrong : 0,
          correct = aType === AnsweredType.Correct  || aType === AnsweredType.Alt,
          countRight = exercise.countRight ? exercise.countRight : 0;
    if (!(correct && countRight <= 2 || !correct && countWrong <= 3)) {
      add = false;
    }
    return add;
  }

  protected shuffleRemainingExercises() {
    const original = this.exercises.length,
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
    // If there is no study tab and the word is shown for the first time, question type is a preview
    if (!this.hasStudyTab && !exercise.result && exercise.data.answered === 0) {
      return QuestionType.Preview;
    }
    let qTpe = QuestionType.Choices;
    const tpe = exercise.exercise.tpe || ExerciseType.Word;
    switch (tpe) {
      case ExerciseType.Word:
        if (exercise.result) {
          // 3 -> 5: random
          if (learnLevel > 2 && learnLevel < 6) {
            qTpe =  Math.random() >= 0.5 ? QuestionType.Choices : QuestionType.Word;
          }
          // 6+ : always word
          if (learnLevel > 5) {
            qTpe = QuestionType.Word;
          }
        }
      break;
      case ExerciseType.Genus:
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

  private timeNext(secs: number) {
    // Timer to show the next word
    const timer = TimerObservable.create(secs * 1000);
    this.nextWordTimer = timer
    .takeWhile(() => this.componentActive)
    .subscribe(t => this.nextWord());
  }

  private fetchLessonResults() {
    // fetch results for all exercises in this lesson
    let leftToStudy: number;
    this.learnService
    .getLessonResults(this.lessonId, 'practise')
    .takeWhile(() => this.componentActive)
    .subscribe(
      results => {
        console.log('CHECK lesson results', results);
        if  (results) {
          leftToStudy = this.getNewQuestions(results);
        }
        if (this.exerciseData.length > 0) {
          super.init();
        } else {
          this.noMoreExercises = true;
          this.noMoreToStudy = leftToStudy < 1;
          this.onToNextLesson();
        }
      },
      error => this.errorService.handleError(error)
    );
  }

  private getNewQuestions(results: ExerciseResult[]): number {
    let nrOfExercises = 0,
        leftToStudy = 0,
        exerciseResult: ExerciseResult;
    const newExercises: Exercise[] = [],
          newResults: ExerciseResult[] = [];

    // Select exercises that have not been learned yet
    // (but have been studied if word unless there is no study tab)
    this.exercises.forEach(exercise => {
      if (nrOfExercises < this.settings.nrOfWordsLearn) {
        exerciseResult = results.find(result => result.exerciseId === exercise._id);
        if ((exerciseResult && !exerciseResult.isLearned)
          || (!exerciseResult && (exercise.tpe !== ExerciseType.Word || !this.hasStudyTab))
        ) {
          // word is not learned yet; add to list of new questions
          newExercises.push(exercise);
          newResults.push(exerciseResult);
          nrOfExercises = newExercises.length;
        } else {
          // word is not studied yet
          leftToStudy++;
        }
      }
    });
    console.log('words for practise', newExercises);
    this.buildExerciseData(newExercises, newResults);
    return leftToStudy;
  }

  protected buildExerciseData(newExercises: Exercise[], results: ExerciseResult[]) {
    this.exerciseData = this.learnService.buildExerciseData(newExercises, results, this.text, {
      isBidirectional: this.stepOptions.bidirectional,
      direction: Direction.LocalToForeign
    }, this.lessonOptions);
    if (!this.stepOptions.ordered) {
      this.exerciseData = this.previewService.shuffle(this.exerciseData);
    }
    this.setExerciseDataById();
    this.getChoices(this.courseId, this.stepOptions.bidirectional);
  }

  protected soundLearnedLevel(learnLevel: number) {
    if (learnLevel > this.learnedLevel) {
      this.audioService.playSound(this.isMute, this.beep);
    }
  }

  protected previewDone() {
    const currentExercise = this.exerciseData[this.current],
          points = 2;
    if (currentExercise) {
      currentExercise.data.isDone = true;
      currentExercise.data.isCorrect = true;
      currentExercise.data.points = points;
      if (!currentExercise.result) {
        this.score = this.score + points;
        currentExercise.data.points = points;
      }
      this.pointsEarned.next(points);
      this.addExercise(null, null);
      this.nextWord();
    }
  }

  protected fetchResults() {
    this.fetchLessonResults();
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
