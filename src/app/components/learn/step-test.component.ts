import {Component, EventEmitter, OnInit, OnDestroy, Input, Output, ViewChild} from '@angular/core';
import {LearnService} from '../../services/learn.service';
import {ErrorService} from '../../services/error.service';
import {LanPair, LanConfig} from '../../models/course.model';
import {Exercise, ExerciseData, ExerciseTpe, Direction, LearnSettings} from '../../models/exercise.model';
import {LearnAnswerFieldComponent} from './answer-field.component';
import {TimerObservable} from 'rxjs/observable/TimerObservable';
import 'rxjs/add/operator/takeWhile';

@Component({
  selector: 'km-learn-test',
  templateUrl: 'step-test.component.html',
  styleUrls: ['step.component.css']
})

export class LearnTestComponent implements OnInit, OnDestroy {
  @Input() exercises: Exercise[];
  @Input() lanPair: LanPair;
  @Input() options: ExerciseTpe;
  @Input() text: Object;
  @Input() settings: LearnSettings;
  @Output() stepCompleted = new EventEmitter<ExerciseData[]>();
  @Output() updatedSettings = new EventEmitter<LearnSettings>();
  @ViewChild(LearnAnswerFieldComponent) answerComponent: LearnAnswerFieldComponent;
  private componentActive = true;
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

  constructor(
    private learnService: LearnService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.getConfig(this.lanPair.to); // For keyboard keys
    this.getQuestions();
  }

  onKeyPressed(key: string) {
    if (key === 'Enter') {
      if (!this.isTestDone) {
        this.checkIfAnswer();
      }
    }
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
      this.isAnswered = true;
      this.currentData.data.isDone = true;
      const solution = this.currentData.exercise.foreign.word;
      const filteredSolution = this.filter(solution);
      console.log('answer', filteredAnswer, filteredSolution);
      if (filteredAnswer === filteredSolution) {
        // Correct answer
        this.isCorrect = true;
        this.currentData.data.isCorrect = true;
        this.currentData.data.isAlmostCorrect = false;
        this.currentData.data.isAlt = false;
        this.score = this.score + 100;
        this.timeNext(0.6);
      } else if (this.checkAltAnswers(this.currentData.exercise, filteredAnswer)) {
        // Alternative answer (synonym)
        this.isCorrect = true;
        this.solution = solution;
        this.currentData.data.isCorrect = true;
        this.currentData.data.isAlmostCorrect = false;
        this.currentData.data.isAlt = true;
        this.score = this.score + 80;
        // this.timeNext(2);
      } else if (this.learnService.isAlmostCorrect(filteredAnswer, filteredSolution)) {
        // Almost correct answer
        this.currentData.data.isCorrect = false;
        this.currentData.data.isAlmostCorrect = true;
        this.currentData.data.isAlt = false;
        this.isCorrect = false;
        this.solution = solution;
        this.score = this.score + 20;
        if (this.currentData.data.answered < 1) {
          this.addExercise();
        }
      } else {
        // Incorrect answer
        this.currentData.data.isCorrect = false;
        this.currentData.data.isAlmostCorrect = false;
        this.currentData.data.isAlt = false;
        this.isCorrect = false;
        this.solution = solution;
        if (this.currentData.data.answered < 1) {
          this.addExercise();
        }
      }
    }
  }

  private checkAltAnswers(exercise: Exercise, answer: string): boolean {
    let isAltAnswer = false;
    console.log('alt', exercise);
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
    this.exerciseData = this.learnService.buildExerciseData(this.exercises, this.text, {
      isForeign: true,
      isBidirectional: false,
      direction: Direction.LocalToForeign
    });
    if (!this.options.ordered) {
      this.exerciseData = this.learnService.shuffle(this.exerciseData);
    }
    this.isQuestionReady = true;
    this.nextWord();
  }

  private timeNext(secs: number) {
    // Timer to show the next word
    const timer = TimerObservable.create(secs * 1000);
    timer
    .takeWhile(() => this.componentActive && this.isAnswered)
    .subscribe(t => this.nextWord());
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
