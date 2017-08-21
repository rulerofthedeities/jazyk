import {Component, EventEmitter, OnInit, OnDestroy, Input, Output, ViewChild} from '@angular/core';
import {LearnService} from '../../services/learn.service';
import {ErrorService} from '../../services/error.service';
import {LanPair, LanConfig} from '../../models/course.model';
import {Exercise, ExerciseData, ExerciseTpe, Direction, ExerciseResult} from '../../models/exercise.model';
import {LearnSettings} from '../../models/user.model';
import {LearnAnswerFieldComponent} from './answer-field.component';
import {TimerObservable} from 'rxjs/observable/TimerObservable';
import 'rxjs/add/operator/takeWhile';

interface Map<T> {
  [K: string]: T;
}

interface Score {
  points: number;
  learnLevel: number;
}

@Component({
  selector: 'km-learn-test',
  templateUrl: 'step-test.component.html',
  styleUrls: ['step.component.css']
})

export class LearnTestComponent implements OnInit, OnDestroy {
  @Input() exercises: Exercise[];
  @Input() results: ExerciseResult[];
  @Input() lanPair: LanPair;
  @Input() options: ExerciseTpe;
  @Input() text: Object;
  @Input() userId: string;
  @Input() courseId: string;
  @Input() settings: LearnSettings;
  @Output() stepCompleted = new EventEmitter<ExerciseData[]>();
  @Output() updatedSettings = new EventEmitter<LearnSettings>();
  @ViewChild(LearnAnswerFieldComponent) answerComponent: LearnAnswerFieldComponent;
  private componentActive = true;
  private startDate: Date;
  private endDate: Date;
  private scores: Map<Score> = {}; // Keeps track of point & level per exercise, not per result
  isTestDone = false;
  isAnswered = false;
  exerciseData: ExerciseData[];
  currentData: ExerciseData;
  current = -1;
  isQuestionReady = false;
  isCorrect = false;
  solution: string;
  score = 0;
  keys: string[] = [];
  isCountDown: boolean;
  isMute: boolean;

  constructor(
    private learnService: LearnService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.isCountDown = this.settings.countdown;
    this.isMute = this.settings.mute;
    this.getConfig(this.lanPair.to); // For keyboard keys
    this.fetchPreviousResults();
  }

  onKeyPressed(key: string) {
    if (key === 'Enter') {
      if (!this.isTestDone) {
        this.checkIfAnswer();
      }
    }
  }

  onCountDownFinished() {
    this.isCountDown = false;
  }

  onCheckAnswer() {
    this.checkIfAnswer();
  }

  onRestart() {
    this.restart();
  }

  onSettingsUpdated(settings: LearnSettings) {
    this.settings = settings;
    this.updatedSettings.emit(settings);
  }

  private checkIfAnswer() {
    if (!this.isAnswered) {
      if (this.answerComponent) {
        this.checkAnswer(this.answerComponent.getData());
      }
    } else {
      this.nextWord();
    }
  }

  private nextWord() {
    this.solution = '';
    this.isAnswered = false;
    this.isCorrect = false;
    if (this.answerComponent) {
      this.answerComponent.clearData();
    }
    this.current += 1;
    if (this.current >= this.exerciseData.length) {
      this.isTestDone = true;
      this.stepCompleted.emit(this.exerciseData);
    }
    if (!this.isTestDone) {
      this.currentData = this.exerciseData[this.current];
      this.isQuestionReady = true;
      this.startDate = new Date();
    }
  }

  private restart() {
    this.isTestDone = false;
    this.current = -1;
    this.getQuestions();
  }

  private filter(word: string): string {
    let filteredAnswer = word.trim().toLowerCase();
    filteredAnswer = filteredAnswer.replace(/ +(?= )/g, ''); // replace all multiple spaces with one space
    filteredAnswer = filteredAnswer.replace(/[\.,\?;:!]/g, ''); // remove .,?;:
    console.log('filtered answer', word, '->' , '>' + filteredAnswer + '<');
    return filteredAnswer;
  }

  private checkAnswer(answer: string) {
    const filteredAnswer = this.filter(answer);
    if (filteredAnswer) {
      this.endDate = new Date();
      const solution = this.currentData.exercise.foreign.word,
            filteredSolution = this.filter(solution),
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
        this.currentData.data.grade = this.calculateGrade(timeDelta, 0, filteredSolution);
        learnLevel = this.calculateLearnLevel(learnLevel, true, false, false);
        this.currentData.data.learnLevel = learnLevel;
        this.currentData.data.isCorrect = true;
        this.currentData.data.isAlmostCorrect = false;
        this.currentData.data.isAlt = false;
        points = 100;
        this.scores[this.currentData.exercise._id] = {points, learnLevel};
        this.score = this.score + points;
        this.timeNext(0.6);
      } else if (this.checkAltAnswers(this.currentData.exercise, filteredAnswer)) {
        // Alternative answer (synonym)
        this.isCorrect = true;
        this.solution = solution;
        this.currentData.data.grade = this.calculateGrade(timeDelta, 1, filteredSolution);
        learnLevel = this.calculateLearnLevel(learnLevel, false, true, false);
        this.currentData.data.learnLevel = learnLevel;
        this.currentData.data.isCorrect = true;
        this.currentData.data.isAlmostCorrect = false;
        this.currentData.data.isAlt = true;
        points = 80;
        this.scores[this.currentData.exercise._id] = {points, learnLevel};
        this.score = this.score + points;
        // this.timeNext(2);
      } else if (this.learnService.isAlmostCorrect(filteredAnswer, filteredSolution)) {
        // Almost correct answer
        this.currentData.data.grade = 1;
        learnLevel = this.calculateLearnLevel(learnLevel, false, false, true);
        this.currentData.data.learnLevel = learnLevel;
        this.currentData.data.isCorrect = false;
        this.currentData.data.isAlmostCorrect = true;
        this.currentData.data.isAlt = false;
        this.isCorrect = false;
        this.solution = solution;
        points = 20;
        this.scores[this.currentData.exercise._id] = {points, learnLevel};
        this.score = this.score + points;
        if (this.currentData.data.answered < 1) {
          this.addExercise();
        }
      } else {
        // Incorrect answer
        this.currentData.data.grade = 0;
        learnLevel = this.calculateLearnLevel(learnLevel, false, false, false);
        this.currentData.data.learnLevel = learnLevel;
        this.currentData.data.isCorrect = false;
        this.currentData.data.isAlmostCorrect = false;
        this.currentData.data.isAlt = false;
        this.isCorrect = false;
        this.scores[this.currentData.exercise._id] = {points: 0, learnLevel};
        this.solution = solution;
        if (this.currentData.data.answered < 1) {
          this.addExercise();
        }
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

  private addExercise() {
    // Incorrect answer -> readd exercise to the back
    const newExerciseData: ExerciseData = {
      data: JSON.parse(JSON.stringify(this.exerciseData[this.current].data)),
      exercise: this.exerciseData[this.current].exercise
    };
    newExerciseData.data.isCorrect = false;
    newExerciseData.data.isDone = false;
    newExerciseData.data.answered = newExerciseData.data.answered + 1;
    this.exerciseData.push(newExerciseData);
  }

  private getQuestions() {
    this.exerciseData = this.learnService.buildExerciseData(this.exercises, this.results, this.text, {
      isForeign: true,
      isBidirectional: false,
      direction: Direction.LocalToForeign
    });
    if (!this.options.ordered) {
      this.exerciseData = this.learnService.shuffle(this.exerciseData);
    }
    this.nextWord();
  }

  private calculateGrade(delta: number, deduction: number, solution: string): number {
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

  private calculateLearnLevel(level: number, correct: boolean, alt: boolean, almostCorrect: boolean): number {
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
    const lastScore = this.scores[data.exercise._id];
    if (lastScore) {
      // Use level from this score
      learnLevel = lastScore.learnLevel;
    }
    return learnLevel;
  }

  private timeNext(secs: number) {
    // Timer to show the next word
    const timer = TimerObservable.create(secs * 1000);
    timer
    .takeWhile(() => this.componentActive && this.isAnswered)
    .subscribe(t => this.nextWord());
  }

  private fetchPreviousResults() {
    const exerciseIds = this.exercises.map(exercise => exercise._id);

    this.learnService
    .getPreviousResults(this.userId, this.courseId, 'test', exerciseIds)
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
