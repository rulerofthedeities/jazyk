import {Component, Input, Output, OnInit, EventEmitter, OnDestroy, ViewChild} from '@angular/core';
import {LanPair, LanConfig} from '../../models/course.model';
import {Exercise, ExerciseData, ExerciseOptions, ExerciseTpe, Direction, ExerciseResult} from '../../models/exercise.model';
import {LearnSettings} from '../../models/user.model';
import {LearnService} from '../../services/learn.service';
import {ErrorService} from '../../services/error.service';
import {LearnAnswerFieldComponent} from './answer-field.component';
import {TimerObservable} from 'rxjs/observable/TimerObservable';
import {Subscription} from 'rxjs/Subscription';
import {Subject} from 'rxjs/Subject';
import 'rxjs/add/operator/takeWhile';

interface Map<T> {
  [K: string]: T;
}

@Component({
  selector: 'km-learn-practise',
  templateUrl: 'step-practise.component.html',
  styleUrls: ['step.component.css']
})

export class LearnPractiseComponent implements OnInit, OnDestroy {
  @Input() exercises: Exercise[];
  @Input() results: ExerciseResult[];
  @Input() lanPair: LanPair;
  @Input() text: Object;
  @Input() lessonId: string;
  @Input() options: ExerciseTpe;
  @Input() settings: LearnSettings;
  @Output() stepCompleted = new EventEmitter<ExerciseData[]>();
  @Output() updatedSettings = new EventEmitter<LearnSettings>();
  @ViewChild(LearnAnswerFieldComponent) answerComponent: LearnAnswerFieldComponent;
  private componentActive = true;
  private isWordsDone =  false; // true once words are done once
  private nrOfChoices = 6;
  private minNrOfChoices = 4;
  private choicesForeign: string[];
  private choicesLocal: string[];
  private startDate: Date;
  private endDate: Date;
  private levels: Map<number> = {}; // Keeps track of level per exercise, not per result
  private countWrong: Map<number> = {}; // Keeps track of how many times an exercise has been answered incorrectly
  subscription: Subscription;
  exerciseAdded: Subject<boolean> = new Subject;
  isPractiseDone = false;
  exerciseData: ExerciseData[];
  currentData: ExerciseData;
  currentChoices: string[] = [];
  current = -1;
  isSelected = false; // choices
  isAnswered = false;  // word
  isCorrect = false; // word
  isQuestionReady = false;
  minNrOfQuestions: number;
  solution: string; // word
  answered: number; // choices
  answer: number; // choices
  score = 0;
  isCountDown: boolean;
  isMute: boolean;
  keys: string[] = [];

  constructor(
    private learnService: LearnService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.exercises = this.exercises.slice(0, 2);
    this.isCountDown = this.settings.countdown;
    this.isMute = this.settings.mute;
    this.minNrOfQuestions = this.exercises.length * 2;
    this.getConfig(this.lanPair.to); // For keyboard keys
    this.fetchPreviousResults();
  }

  onCountDownFinished() {
    this.isCountDown = false;
  }

  onSettingsUpdated(settings: LearnSettings) {
    this.settings = settings;
    this.updatedSettings.emit(settings);
  }

  onSelected(i: number) {
    if (!this.isSelected) {
      this.checkChoicesAnswer(i);
    }
  }

  onNextWord() {
    if (this.currentData.data.choices) {
      if (this.isSelected) {
        this.nextWord();
      }
    } else {
      this.checkIfWordAnswer();
    }
  }

  onRestart() {
    if (this.isPractiseDone) {
      this.restart();
    }
  }

  onKeyPressed(key: string) {
    if (!this.isPractiseDone && this.currentData) {
      if (this.currentData.data.choices) {
        let selection: number;
        switch (key) {
          case 'Enter':
            if (this.isSelected) {
              this.nextWord();
            }
          break;
          case '1':
          case '2':
          case '3':
          case '4':
          case '5':
          case '6':
          case '7':
          case '8':
            if (!this.isSelected) {
              selection = parseInt(key, 10);
              if (selection > 0 && selection <= this.currentChoices.length) {
                this.checkChoicesAnswer(selection - 1);
              }
            }
          break;
        }
      } else {
        if (key === 'Enter') {
          this.checkIfWordAnswer();
        }
      }
    }
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

  getQuestionType(): string {
    let tpe = 'local';
    if (this.currentData && this.currentData.data.choices && this.currentData.data.direction === Direction.ForeignToLocal) {
      tpe = 'foreign';
    }
    return tpe;
  }

  private getChoices(isBidirectional: boolean) {
    this.learnService
    .fetchChoices(this.lessonId, isBidirectional)
    .takeWhile(() => this.componentActive)
    .subscribe(
      choices => {
        this.choicesForeign = choices.foreign;
        if (isBidirectional) {
          this.choicesLocal = choices.local;
        }
        this.nextWord();
      },
      error => this.errorService.handleError(error)
    );
  }

  private nextWord() {
    this.clearData();
    this.current += 1;
    if (this.current >= this.exerciseData.length) {
      this.isPractiseDone = true;
      this.isWordsDone = true;
      this.stepCompleted.emit(this.exerciseData);
    }
    if (!this.isPractiseDone) {
      this.currentData = this.exerciseData[this.current];
      let giveChoices = true;
      const learnLevel = this.currentData.result.learnLevel;
      // Determine if multiple choice or word
      if (this.currentData.result) {
        // 3 -> 5: random
        if (learnLevel > 2 && learnLevel < 6) {
          giveChoices =  Math.random() >= 0.5 ? true : false;
        }
        // 6+ : always word
        if (learnLevel > 5) {
          giveChoices = false;
        }
      }
      this.currentData.data.choices = giveChoices;
      this.setChoices();
    }
    this.isQuestionReady = true;
    this.startDate = new Date();
  }

  private restart() {
    this.isPractiseDone = false;
    this.current = -1;
    this.getQuestions();
  }

  private clearData() {
    this.solution = '';
    this.isAnswered = false;
    this.isSelected = false;
    this.isCorrect = false;
    this.answered = null;
    this.answer = null;
    if (this.answerComponent) {
      this.answerComponent.clearData();
    }
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private getQuestions() {
    this.exerciseData = this.learnService.buildExerciseData(this.exercises, this.results, this.text, {
      isBidirectional: this.options.bidirectional,
      direction: Direction.LocalToForeign
    });
    if (!this.options.ordered) {
      this.exerciseData = this.learnService.shuffle(this.exerciseData);
    }
    this.getChoices(this.options.bidirectional);
  }

  private setChoices() {
    // Select random words from choices array
    let choice: string,
        rand: number;
    const learnLevel = this.getCurrentLearnLevel(this.currentData),
          exercise = this.currentData.exercise,
          direction = this.currentData.data.direction,
          choices: string[] = [],
          nrOfChoices = this.getNrOfChoices(learnLevel),
          availableChoices = JSON.parse(JSON.stringify(direction === Direction.ForeignToLocal ? this.choicesLocal : this.choicesForeign)),
          word = direction === Direction.ForeignToLocal ? exercise.local.word : exercise.foreign.word;
    choices.push(word);
    while (choices.length < nrOfChoices && availableChoices) {
      rand = Math.floor(Math.random() * availableChoices.length);
      choice = availableChoices[rand];
      availableChoices.splice(rand, 1);
      if (!choices.find(choiceItem => choiceItem === choice)) {
        choices.push(choice);
      }
    }
    this.currentChoices = this.learnService.shuffle(choices);
  }

  private checkChoicesAnswer(i: number) {
    this.isSelected = true;
    this.answered = i;
    this.answer = null;
    this.endDate = new Date();
    const choice = this.currentChoices[i],
          direction = this.currentData.data.direction,
          nrOfQuestions = this.exerciseData.length,
          word = direction === Direction.ForeignToLocal ? this.currentData.exercise.local.word : this.currentData.exercise.foreign.word,
          timeDelta = (this.endDate.getTime() - this.startDate.getTime()) / 100;
    let learnLevel = this.getCurrentLearnLevel(this.currentData),
        points = 0;

    this.currentData.data.isDone = true;
    this.currentData.data.timeDelta = timeDelta;

    console.log('CURRENTDATA', this.currentData, this.levels);
    if (choice === word) {
      this.currentData.data.isCorrect = true;
      this.currentData.data.grade = this.calculateChoicesGrade(timeDelta);
      learnLevel = this.calculateChoicesLearnLevel(learnLevel, true);
      this.currentData.data.learnLevel = learnLevel;
      points = 2 + this.currentChoices.length * 3;
      this.currentData.data.points = points;
      this.levels[this.currentData.exercise._id] = learnLevel;
      this.score = this.score + points;
      this.timeNext(0.6);
      if (nrOfQuestions < this.minNrOfQuestions || learnLevel < 3) {
        this.addExercise();
      }
    } else {
      this.currentData.data.isCorrect = false;
      this.currentData.data.grade = 0;
      learnLevel = this.calculateChoicesLearnLevel(learnLevel, false);
      this.currentData.data.learnLevel = learnLevel;
      this.currentData.data.points = 0;
      this.levels[this.currentData.exercise._id] = learnLevel;
      this.addWrongCount(this.currentData.exercise._id);
      // Show correct answer
      this.currentChoices.forEach( (item, j) => {
        if (item === word) {
          this.answer = j;
        }
      });
      this.addExercise();
    }
  }

  private checkIfWordAnswer() {
    if (!this.isAnswered) {
      if (this.answerComponent) {
        this.checkWordAnswer(this.answerComponent.getData());
      }
    } else {
      this.nextWord();
    }
  }

  private checkWordAnswer(answer: string) {
    const filteredAnswer = this.filter(answer);
    if (filteredAnswer) {
      this.endDate = new Date();
      const solution = this.currentData.exercise.foreign.word,
            filteredSolution = this.filter(solution),
            nrOfQuestions = this.exerciseData.length,
            timeDelta = (this.endDate.getTime() - this.startDate.getTime()) / 100;
      let learnLevel = this.getCurrentLearnLevel(this.currentData),
          points = 0;
      this.isAnswered = true;
      this.currentData.data.isDone = true;
      this.currentData.data.timeDelta = timeDelta;
      console.log('answer', filteredAnswer, filteredSolution);
      if (filteredAnswer === filteredSolution) {
        // Correct answer
        this.isCorrect = true;
        this.currentData.data.grade = this.calculateWordGrade(timeDelta, 0, filteredSolution);
        learnLevel = this.calculateWordLearnLevel(learnLevel, true, false, false);
        this.currentData.data.learnLevel = learnLevel;
        this.currentData.data.isCorrect = true;
        this.currentData.data.isAlmostCorrect = false;
        this.currentData.data.isAlt = false;
        points = 100;
        this.currentData.data.points = points;
        this.levels[this.currentData.exercise._id] = learnLevel;
        this.score = this.score + points;
        this.timeNext(0.6);
        console.log('CHECK ADDING', nrOfQuestions, this.minNrOfQuestions);
        if (nrOfQuestions < this.minNrOfQuestions) {
          this.addExercise();
        }
      } else if (this.checkAltAnswers(this.currentData.exercise, filteredAnswer)) {
        // Alternative answer (synonym)
        this.isCorrect = true;
        this.solution = solution;
        this.currentData.data.grade = this.calculateWordGrade(timeDelta, 1, filteredSolution);
        learnLevel = this.calculateWordLearnLevel(learnLevel, false, true, false);
        this.currentData.data.learnLevel = learnLevel;
        this.currentData.data.isCorrect = true;
        this.currentData.data.isAlmostCorrect = false;
        this.currentData.data.isAlt = true;
        points = 80;
        this.currentData.data.points = points;
        this.levels[this.currentData.exercise._id] = learnLevel;
        this.addWrongCount(this.currentData.exercise._id);
        this.score = this.score + points;
        this.addExercise();
        // this.timeNext(2);
      } else if (this.learnService.isAlmostCorrect(filteredAnswer, filteredSolution)) {
        // Almost correct answer
        this.currentData.data.grade = 1;
        learnLevel = this.calculateWordLearnLevel(learnLevel, false, false, true);
        this.currentData.data.learnLevel = learnLevel;
        this.currentData.data.isCorrect = false;
        this.currentData.data.isAlmostCorrect = true;
        this.currentData.data.isAlt = false;
        this.isCorrect = false;
        this.solution = solution;
        points = 20;
        this.currentData.data.points = points;
        this.levels[this.currentData.exercise._id] = learnLevel;
        this.addWrongCount(this.currentData.exercise._id);
        this.score = this.score + points;
        this.addExercise();
      } else {
        // Incorrect answer
        this.currentData.data.grade = 0;
        learnLevel = this.calculateWordLearnLevel(learnLevel, false, false, false);
        this.currentData.data.learnLevel = learnLevel;
        this.currentData.data.isCorrect = false;
        this.currentData.data.isAlmostCorrect = false;
        this.currentData.data.isAlt = false;
        this.isCorrect = false;
        this.currentData.data.points = 0;
        this.levels[this.currentData.exercise._id] = learnLevel;
        this.addWrongCount(this.currentData.exercise._id);
        this.solution = solution;
        this.addExercise();
      }
      console.log('LEARN LEVEL', learnLevel);
    }
  }

  private checkAltAnswers(exercise: Exercise, answer: string): boolean {
    let isAltAnswer = false;
    if (exercise.foreign.alt) {
      const alts = exercise.foreign.alt.split('|');
      const found = alts.filter(alt => this.filter(alt) === answer);
      console.log('found', found.length);
      if (found.length > 0) {
        isAltAnswer = true;
      }
    }
    return isAltAnswer;
  }

  private filter(word: string): string {
    let filteredAnswer = word.trim().toLowerCase();
    filteredAnswer = filteredAnswer.replace(/ +(?= )/g, ''); // replace all multiple spaces with one space
    filteredAnswer = filteredAnswer.replace(/[\.,\?;:!]/g, ''); // remove .,?;:
    console.log('filtered answer', word, '->' , '>' + filteredAnswer + '<');
    return filteredAnswer;
  }

  private addExercise() {
    // Incorrect answer -> readd exercise to the back if answered incorrectly < 3 times
    const countWrong = this.countWrong[this.currentData.exercise._id] ? this.countWrong[this.currentData.exercise._id] : 0;
    console.log('COUNT WRONG', countWrong);
    if (countWrong < 3) {
      this.countWrong[this.currentData.exercise._id]++;
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
        points: 0
      };
      this.exerciseData.push(newExerciseData);
      this.exerciseAdded.next(true);
      this.shuffleRemainingExercises();
      console.log('ADDING EXERCISE - exercises ', this.exerciseData);
    }
  }

  private shuffleRemainingExercises() {
    console.log('SHUFFLE EXERCISES', this.exerciseData);
    const original = this.exercises.length;
    const total = this.exerciseData.length;
    const nrDone = this.current + 1; // skip next
    const done = this.exerciseData.slice(0, nrDone);
      console.log('SHUFFLED nrDone', nrDone);
    if (nrDone > original && total - nrDone > 2) {
      const todo = this.exerciseData.slice(nrDone, total);
      const shuffled = this.learnService.shuffle(todo);
      this.exerciseData = done.concat(shuffled);
      console.log('SHUFFLED NEW DATA', this.exerciseData);
    } else {
      console.log('NO SHUFFLE');
    }
  }

  private calculateChoicesGrade(delta: number): number {
    // 5 = correct and fast
    // 4 = correct and not fast
    // 3 = correct and slow
    let grade = 3;
    if (delta <= 30) {
      grade = 5;
    } else if (delta < 60) {
      grade = 4;
    }
    console.log('time/grade', delta, grade);
    return grade;
  }

  private calculateWordGrade(delta: number, deduction: number, solution: string): number {
    // 5 = correct and fast
    // 4 = correct and not fast
    // 3 = correct and slow
    let grade = 3;
    const wordLength = solution.length;
    if (delta <= wordLength * 18) {
      grade = 5;
    } else if (delta < wordLength * 36) {
      grade = 4;
    }
    console.log('time/grade', delta, wordLength * 18, wordLength * 36, grade);

    return grade;
  }

  private calculateChoicesLearnLevel(level: number, correct: boolean): number {
    if (correct) {
      if (level < 5) {
        level += 1;
      }
    } else {
      if (level > 0) {
        level -= 1;
      }
    }
    return level;
  }

  private calculateWordLearnLevel(level: number, correct: boolean, alt: boolean, almostCorrect: boolean): number {
    if (correct) {
      if (level < 10) {
        level += 2;
      }
    } else {
      if (level > 0) {
        if (almostCorrect) {
          level -= 2;
        } else if (!alt) {
          level -= 3;
        }
      }
    }
    level = Math.max(level, 0);
    return level;
  }

  private getCurrentLearnLevel(data: ExerciseData): number {
    let learnLevel = data.result ? data.result.learnLevel || 0 : 1; // saved data
    // CHECK if this exerciseid has been answered before; if so; use this level
    const lastLevel = this.levels[data.exercise._id];
    if (lastLevel !== undefined) {
      // Use level from this score
      learnLevel = lastLevel;
    }
    return learnLevel;
  }

  private getNrOfChoices(learnLevel: number): number {
    let nrOfChoices: number;
    console.log('CHOICES LEVEL', learnLevel);
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

  private addWrongCount(exerciseId: string) {
    this.countWrong[exerciseId] = this.countWrong[exerciseId] ? this.countWrong[exerciseId]++ : 1;
  }

  private timeNext(secs: number) {
    // Timer to show the next word
    const timer = TimerObservable.create(secs * 1000);
    this.subscription = timer
    .takeWhile(() => this.componentActive)
    .subscribe(t => this.nextWord());
  }

  private fetchPreviousResults() {
    const exerciseIds = this.exercises.map(exercise => exercise._id);

    this.learnService
    .getPreviousResults(this.lessonId, exerciseIds)
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

  private getConfig(lanCode: string) {
    this.learnService
    .fetchLanConfig(lanCode)
    .takeWhile(() => this.componentActive)
    .subscribe(
      (config: LanConfig) => {
        if (config) {
          this.keys = config.keys;
        }
      },
      error => this.errorService.handleError(error)
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
