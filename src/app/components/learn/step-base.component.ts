import {Component, Input, Output, ViewChild, EventEmitter} from '@angular/core';
import {LearnService} from '../../services/learn.service';
import {ErrorService} from '../../services/error.service';
import {LearnSettings} from '../../models/user.model';
import {LanPair, LanConfig} from '../../models/course.model';
import {ExerciseData, ExerciseResult, Choice, Direction} from '../../models/exercise.model';
import {LearnAnswerFieldComponent} from './answer-field.component';
import {Subscription} from 'rxjs/Subscription';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Subject} from 'rxjs/Subject';

interface Map<T> {
  [K: string]: T;
}

export abstract class Step {
  @Input() settings: LearnSettings;
  @Input() text: Object;
  @Input() lanPair: LanPair;
  @Output() stepCompleted = new EventEmitter<ExerciseData[]>();
  @ViewChild(LearnAnswerFieldComponent) answerComponent: LearnAnswerFieldComponent;
  protected componentActive = true;
  protected choices: Choice[];
  protected nextWordTimer: Subscription;
  protected startDate: Date;
  protected endDate: Date;
  protected levels: Map<number> = {}; // Keeps track of level per exercise, not per result
  exerciseData: ExerciseData[]; // main container of exercise data + results
  currentData: ExerciseData; // container for current exercise data + results
  pointsEarned: Subject<any> = new Subject();
  nextExercise: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  levelUpdated: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  isExercisesDone = false;
  keys: string[] = []; // keyboard keys
  currentChoices: string[] = []; // choices
  answered: number; // choices
  answer: number; // choices
  solution: string; // word
  isSelected = false; // choices
  isAnswered = false;  // word
  isCorrect = false; // word
  current = -1; // entry in exerciseData
  isQuestionReady = false;
  isCountDown: boolean;
  isMute: boolean;

  constructor(
    protected learnService: LearnService,
    protected errorService: ErrorService
  ) {}

  onCountDownFinished() {
    this.isCountDown = false;
  }

  onKeyPressed(key: string) {
    if (!this.isExercisesDone && this.currentData) {
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

  protected init() {
    this.isCountDown = this.settings.countdown;
    this.isMute = this.settings.mute;
    this.getConfig(this.lanPair.to); // For keyboard keys
  }

  protected getChoices(tpe: string, id: string, isBidirectional: boolean = true) {
    this.learnService
    .fetchChoices(tpe, id, isBidirectional)
    .takeWhile(() => this.componentActive)
    .subscribe(
      choices => {
        console.log('CHOICES', choices);
        this.choices = choices;
        this.nextWord();
      },
      error => this.errorService.handleError(error)
    );
  }

  protected checkChoicesAnswer(i: number) {

  }

  protected checkIfWordAnswer() {

  }

  protected nextWord() {
    this.clearData();
    this.current++;
    if (this.current >= this.exerciseData.length) {
      this.isExercisesDone = true;
      this.stepCompleted.emit(this.exerciseData);
    }
    if (!this.isExercisesDone) {
      this.nextExercise.next(this.current);
      this.currentData = this.exerciseData[this.current];
      const learnLevel = this.getCurrentLearnLevel(this.currentData);
      this.levelUpdated.next(learnLevel);
      this.currentData.data.choices = this.determineExerciseType(this.currentData.result, learnLevel);
      if (this.currentData.data.choices) {
        this.setChoices();
      }
    this.isQuestionReady = true;
    this.startDate = new Date();
    }
    console.log('BASE next word');
  }

  protected clearData() {
    this.pointsEarned.next(0);
    this.solution = '';
    this.isAnswered = false;
    this.isSelected = false;
    this.isCorrect = false;
    this.answered = null;
    this.answer = null;
    if (this.answerComponent) {
      this.answerComponent.clearData();
    }
    if (this.nextWordTimer) {
      this.nextWordTimer.unsubscribe();
    }
  }

  protected setChoices() {
    // Select random words from choices array
    let choice: string,
        rand: number,
        availableChoices: string[];
    const learnLevel = this.getCurrentLearnLevel(this.currentData),
          exercise = this.currentData.exercise,
          direction = this.currentData.data.direction,
          choices: string[] = [],
          nrOfChoices = this.getNrOfChoices(learnLevel),
          word = direction === Direction.ForeignToLocal ? exercise.local.word : exercise.foreign.word;

    availableChoices = this.choices.map(c => {
      return direction === Direction.ForeignToLocal ? c.local : c.foreign;
    });
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


  protected determineExerciseType(result: ExerciseResult, learnLevel: number): boolean {
    return false;
  }

  protected getNrOfChoices(learnLevel: number): number {
    return 8;
  }

  protected getCurrentLearnLevel(data: ExerciseData): number {
    let learnLevel = data && data.result ? data.result.learnLevel || 0 : 1; // saved data
    // CHECK if this exerciseid has been answered before; if so; use this level
    const lastLevel = this.levels[data.exercise._id];
    if (lastLevel !== undefined) {
      // Use level from this score
      learnLevel = lastLevel;
    }
    return learnLevel;
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

}
