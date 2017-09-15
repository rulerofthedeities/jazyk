import {Component, Input, Output, OnInit, EventEmitter, OnDestroy} from '@angular/core';
import {Step} from './step-base.component';
import {Exercise, ExerciseData, ExerciseOptions, ExerciseTpe, Direction,
        ExerciseResult, Choice, QuestionType} from '../../models/exercise.model';
import {LearnSettings} from '../../models/user.model';
import {LearnService} from '../../services/learn.service';
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
  @Input() private exercises: Exercise[];
  @Input() lessonId: string;
  @Input() learnedLevel: number;
  @Input() options: ExerciseTpe;
  @Output() stepCompleted = new EventEmitter<ExerciseData[]>();
  @Output() stepBack = new EventEmitter();
  noMoreExercises = false;
  noMoreToStudy = false;
  beep: any;

  constructor(
    learnService: LearnService,
    errorService: ErrorService,
    private audioService: AudioService
  ) {
    super(learnService, errorService);
  }

  ngOnInit() {
    this.settings.nrOfWords = 2; // TEMP
    this.beep = this.audioService.loadAudio('/assets/audio/gluck.ogg');
    this.fetchLessonResults();
  }

  onRestart() {
    if (this.isExercisesDone) {
      this.restart();
    }
  }

  onToStudy() {
    this.stepBack.emit();
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

  protected nextWord() {
    super.nextWord();
  }

  private restart() {
    this.isExercisesDone = false;
    this.current = -1;
    this.fetchLessonResults();
  }

  protected doAddExercise(qType: QuestionType, learnLevel: number): boolean {
    const nrOfQuestions = this.exerciseData.length;
    let add = false;
    switch (qType) {
      case QuestionType.Choices:
        if (nrOfQuestions < this.settings.nrOfWords * this.maxRepeatWord && learnLevel < this.learnedLevel) {
          add = true;
        }
      break;
      case QuestionType.Word:
         if ((nrOfQuestions < this.settings.nrOfWords * this.maxRepeatWord || learnLevel < 3) && learnLevel < this.learnedLevel) {
          this.addExercise(true);
        }
      break;
    }
    return add;
  }

  protected addExercise(isCorrect: boolean) {
    // Readd exercise to the back if question asked < x times
    const exercise = this.dataByExercise[this.currentData.exercise._id],
          countWrong = exercise.countWrong ? exercise.countWrong : 0,
          countRight = exercise.countRight ? exercise.countRight : 0;
    if (isCorrect && countRight <= 2 || !isCorrect && countWrong <= 3) {
      const newExerciseData: ExerciseData = {
        data: JSON.parse(JSON.stringify(this.exerciseData[this.current].data)),
        exercise: this.exerciseData[this.current].exercise
      };
      newExerciseData.data.isCorrect = false;
      newExerciseData.data.isDone = false;
      newExerciseData.data.isAlt = false;
      newExerciseData.data.isAlmostCorrect = false;
      newExerciseData.data.grade = 0;
      newExerciseData.data.answered = newExerciseData.data.answered + 1;
      if (this.options.bidirectional) {
        newExerciseData.data.direction = Math.random() >= 0.5 ? Direction.LocalToForeign : Direction.ForeignToLocal;
      }
      newExerciseData.result = {
        learnLevel: newExerciseData.data.learnLevel,
        points: 0,
        streak: this.exerciseData[this.current].result.streak
      };
      this.exerciseData.push(newExerciseData);
      if (!this.options.ordered) {
        this.shuffleRemainingExercises();
      }
    }
  }

  private shuffleRemainingExercises() {
    const original = this.exercises.length,
          total = this.exerciseData.length,
          nrDone = this.current + 1, // skip next
          done = this.exerciseData.slice(0, nrDone);
    if (nrDone > original && total - nrDone > 2) {
      const todo = this.exerciseData.slice(nrDone, total),
            shuffled = this.learnService.shuffle(todo);
      this.exerciseData = done.concat(shuffled);
    }
  }

  protected determineQuestionType(result: ExerciseResult, learnLevel: number): QuestionType {
    // Determine if multiple choice or word
    let qTpe = QuestionType.Choices;
    if (result) {
      // 3 -> 5: random
      if (learnLevel > 2 && learnLevel < 6) {
        qTpe =  Math.random() >= 0.5 ? QuestionType.Choices : QuestionType.Word;
      }
      // 6+ : always word
      if (learnLevel > 5) {
        qTpe = QuestionType.Word;
      }
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
        if  (results) {
          leftToStudy = this.getNewQuestions(results);
        }
        if (this.exerciseData.length > 0) {
          super.init();
        } else {
          this.noMoreExercises = true;
          this.noMoreToStudy = leftToStudy < 1;
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

    console.log('PRACTISERESULTS', results);
    // Select exercises that have not been learned yet (but have been studied)
    this.exercises.forEach(exercise => {
      if (nrOfExercises < this.settings.nrOfWords) {
        exerciseResult = results.find(result => result.exerciseId === exercise._id);
        if (exerciseResult) {
          if (!exerciseResult.isLearned) {
            // word is not learned yet; add to list of new questions
            newExercises.push(exercise);
            newResults.push(exerciseResult);
            nrOfExercises = newExercises.length;
          }
        } else {
          // word is not studied yet
          leftToStudy++;
        }
      }
    });
    this.buildExerciseData(newExercises, newResults);
    return leftToStudy;
  }

  private buildExerciseData(newExercises: Exercise[], results: ExerciseResult[]) {
    this.exerciseData = this.learnService.buildExerciseData(newExercises, results, this.text, {
      isBidirectional: this.options.bidirectional,
      direction: Direction.LocalToForeign
    });
    if (!this.options.ordered) {
      this.exerciseData = this.learnService.shuffle(this.exerciseData);
    }
    this.setExerciseDataById();
    this.getChoices('lesson', this.lessonId, this.options.bidirectional);
  }

  protected soundLearnedLevel(learnLevel: number) {
    if (learnLevel > this.learnedLevel) {
      this.audioService.playSound(this.isMute, this.beep);
    }
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
