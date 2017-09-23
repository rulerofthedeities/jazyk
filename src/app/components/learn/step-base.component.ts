import {Input, Output, ViewChild, EventEmitter} from '@angular/core';
import {LearnService} from '../../services/learn.service';
import {ErrorService} from '../../services/error.service';
import {LearnSettings} from '../../models/user.model';
import {LanPair, LanConfig} from '../../models/course.model';
import {Exercise, ExerciseData, ExerciseResult, ExerciseType, Choice, QuestionType, Direction} from '../../models/exercise.model';
import {LearnAnswerFieldComponent} from './answer-field.component';
import {LearnSentenceComponent} from './sentence.component';
import {Subscription} from 'rxjs/Subscription';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Subject} from 'rxjs/Subject';

interface Map<T> {
  [K: string]: T;
}

interface ById {
  levels: number;
  countWrong: number;
  countRight: number;
}

export abstract class Step {
  @Input() settings: LearnSettings;
  @Input() text: Object;
  @Input() lanPair: LanPair;
  @Output() stepCompleted = new EventEmitter<ExerciseData[]>();
  @Output() updatedSettings = new EventEmitter<LearnSettings>();
  @ViewChild(LearnAnswerFieldComponent) answerComponent: LearnAnswerFieldComponent;
  @ViewChild(LearnSentenceComponent) sentenceComponent: LearnSentenceComponent;
  protected componentActive = true;
  protected choices: Choice[];
  protected nextWordTimer: Subscription;
  protected startDate: Date;
  protected endDate: Date;
  protected dataByExercise: Map<ById> = {}; // Keeps track of data per exercise, not per result
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
  prefix: string; // word
  isSelected = false; // choices
  isAnswered = false;  // word
  isCorrect = false; // word
  current = -1; // entry in exerciseData
  isQuestionReady = false;
  isCountDown: boolean;
  isMute: boolean;
  score = 0;
  maxRepeatWord = 4;

  constructor(
    protected learnService: LearnService,
    protected errorService: ErrorService
  ) {}

  onCountDownFinished() {
    this.isCountDown = false;
  }

  onSettingsUpdated(settings: LearnSettings) {
    this.settings = settings;
    this.updatedSettings.emit(settings);
  }

  onKeyPressed(key: string) {
    if (!this.isExercisesDone && this.currentData) {
      switch (this.currentData.data.questionType) {
        case QuestionType.Choices:
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
        break;
        case QuestionType.Word:
          if (key === 'Enter') {
            this.checkIfWordAnswer();
          }
        break;
      }
    }
  }

  onSelected(i: number) {
    if (!this.isSelected) {
      this.checkChoicesAnswer(i);
    }
  }

  onAnsweredSentence(isCorrect: boolean) {
    if (!this.isSelected) {
      this.checkSentenceAnswer(isCorrect);
    }
  }

  onNextWord() {
    console.log('pressed next', this.currentData.data.questionType);
    switch (this.currentData.data.questionType) {
      case QuestionType.Choices:
        if (this.isSelected) {
          this.nextWord();
        }
      break;
      case QuestionType.Word:
        this.checkIfWordAnswer();
      break;
      case QuestionType.Sentence:
        this.nextWord();
      break;
    }
  }

  getQuestionType(): string {
    let tpe = 'local';
    if (this.currentData
      && this.currentData.data.questionType === QuestionType.Choices
      && this.currentData.data.direction === Direction.ForeignToLocal) {
      tpe = 'foreign';
    }
    return tpe;
  }

  isQuestionType(qTpe: QuestionType): boolean {
    let isQTpe = false;
    if (this.currentData && this.currentData.data.questionType === qTpe) {
      isQTpe = true;
    }
    return isQTpe;
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
        this.choices = choices;
        this.nextWord();
      },
      error => this.errorService.handleError(error)
    );
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
      this.currentData.data.questionType = this.determineQuestionType(this.currentData, learnLevel);
      if (this.currentData.data.questionType === QuestionType.Choices) {
        this.setChoices();
      }
      if (this.currentData.data.questionType === QuestionType.Word) {
        // Get prefix from word, pass on to answer field
        const word = this.currentData.exercise.foreign.word;
        this.prefix = this.getPrefix(word);
      }
    this.isQuestionReady = true;
    this.startDate = new Date();
    }
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
    if (this.sentenceComponent) {
      this.sentenceComponent.clearData();
    }
    if (this.nextWordTimer) {
      this.nextWordTimer.unsubscribe();
    }
  }

  protected checkWordAnswer(answer: string) {
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
      if (filteredAnswer === filteredSolution) {
        // Correct answer
        this.isCorrect = true;
        this.currentData.data.grade = this.calculateWordGrade(timeDelta, 0, filteredSolution);
        learnLevel = this.calculateWordLearnLevel(learnLevel, true, false, false);
        this.soundLearnedLevel(learnLevel);
        this.currentData.data.learnLevel = learnLevel;
        this.currentData.data.isCorrect = true;
        this.currentData.data.isAlmostCorrect = false;
        this.currentData.data.isAlt = false;
        points = 100;
        this.currentData.data.points = points;
        this.dataByExercise[this.currentData.exercise._id].levels = learnLevel;
        this.addRightCount(this.currentData.exercise._id);
        this.score = this.score + points;
        // this.timeNext(0.6);
        if (this.doAddExercise(QuestionType.Word, learnLevel)) {
          this.addExercise(true);
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
        this.dataByExercise[this.currentData.exercise._id].levels = learnLevel;
        this.addWrongCount(this.currentData.exercise._id);
        this.score = this.score + points;
        this.addExercise(true);
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
        this.dataByExercise[this.currentData.exercise._id].levels = learnLevel;
        this.addWrongCount(this.currentData.exercise._id);
        this.score = this.score + points;
        this.addExercise(false);
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
        this.dataByExercise[this.currentData.exercise._id].levels = learnLevel;
        this.addWrongCount(this.currentData.exercise._id);
        this.solution = solution;
        this.addExercise(false);
      }
      this.levelUpdated.next(learnLevel);
      this.pointsEarned.next(points);
    }
  }

  protected checkChoicesAnswer(i: number) {
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
    if (choice === word) {
      this.currentData.data.isCorrect = true;
      this.currentData.data.grade = this.calculateChoicesGrade(timeDelta);
      learnLevel = this.calculateChoicesLearnLevel(learnLevel, true);
      this.soundLearnedLevel(learnLevel);
      this.currentData.data.learnLevel = learnLevel;
      points = 2 + this.currentChoices.length * 3;
      this.currentData.data.points = points;
      this.dataByExercise[this.currentData.exercise._id].levels = learnLevel;
      this.addRightCount(this.currentData.exercise._id);
      this.score = this.score + points;
      // this.timeNext(0.6);
      if (this.doAddExercise(QuestionType.Choices, learnLevel)) {
        this.addExercise(true);
      }
    } else {
      this.currentData.data.isCorrect = false;
      this.currentData.data.grade = 0;
      learnLevel = this.calculateChoicesLearnLevel(learnLevel, false);
      this.currentData.data.learnLevel = learnLevel;
      this.currentData.data.points = 0;
      this.dataByExercise[this.currentData.exercise._id].levels = learnLevel;
      this.addWrongCount(this.currentData.exercise._id);
      // Show correct answer
      this.currentChoices.forEach( (item, j) => {
        if (item === word) {
          this.answer = j;
        }
      });
      this.addExercise(false);
    }
    this.levelUpdated.next(learnLevel);
    this.pointsEarned.next(points);
  }

  protected checkSentenceAnswer(isCorrect: boolean) {
    this.isSelected = true;
    this.endDate = new Date();
    const timeDelta = (this.endDate.getTime() - this.startDate.getTime()) / 100;
    let learnLevel = this.getCurrentLearnLevel(this.currentData),
        points = 0;
    this.currentData.data.isDone = true;
    this.currentData.data.timeDelta = timeDelta;
    if (isCorrect) {
      this.currentData.data.isCorrect = true;
      this.currentData.data.grade = this.calculateChoicesGrade(timeDelta);
      learnLevel = this.calculateChoicesLearnLevel(learnLevel, true);
      this.soundLearnedLevel(learnLevel);
      this.currentData.data.learnLevel = learnLevel;
      points = 2 + Math.min(20, this.currentData.exercise.options.length * 4);
      this.currentData.data.points = points;
      this.dataByExercise[this.currentData.exercise._id].levels = learnLevel;
      this.addRightCount(this.currentData.exercise._id);
      this.score = this.score + points;
      console.log('sentence correct', points);
      // this.timeNext(0.6);
      if (this.doAddExercise(QuestionType.Sentence, learnLevel)) {
        this.addExercise(true);
      }
    } else {
      this.currentData.data.isCorrect = false;
      this.currentData.data.grade = 0;
      learnLevel = this.calculateChoicesLearnLevel(learnLevel, false);
      this.currentData.data.learnLevel = learnLevel;
      this.currentData.data.points = 0;
      this.dataByExercise[this.currentData.exercise._id].levels = learnLevel;
      this.addWrongCount(this.currentData.exercise._id);
      this.addExercise(false);
    }
    this.levelUpdated.next(learnLevel);
    this.pointsEarned.next(points);
  }

  protected doAddExercise(q: QuestionType, learnLevel: number): boolean {
    return false;
  }

  private filter(word: string): string {
    let filteredAnswer = word.toLowerCase();
    filteredAnswer = this.learnService.filterPrefix(filteredAnswer);
    filteredAnswer = filteredAnswer.replace(/ +(?= )/g, ''); // replace all multiple spaces with one space
    filteredAnswer = filteredAnswer.replace(/[\.,\?;:!]/g, ''); // remove .,?;:
    return filteredAnswer;
  }

  private getPrefix(word: string): string {
    let filter = '';
    const matches = word.match(/\[(.*?)\]/);
    if (matches && matches.length > 1) {
      filter = matches[1];
    }
    return filter;
  }

  private checkAltAnswers(exercise: Exercise, answer: string): boolean {
    let isAltAnswer = false;
    if (exercise.foreign.alt) {
      const alts = exercise.foreign.alt.split('|');
      const found = alts.filter(alt => this.filter(alt) === answer);
      if (found.length > 0) {
        isAltAnswer = true;
      }
    }
    return isAltAnswer;
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

    return grade;
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

    return grade;
  }

  private calculateWordLearnLevel(level: number, correct: boolean, alt: boolean, almostCorrect: boolean): number {
    if (correct) {
      level += 5;
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

  private calculateChoicesLearnLevel(level: number, correct: boolean): number {
    if (correct) {
      if (this.currentData.exercise.tpe === ExerciseType.Sentence) {
        level += 6;
      } else {
        level += 3;
      }
    } else {
      if (level > 0) {
        level -= 1;
      }
    }
    return level;
  }

  protected addWrongCount(exerciseId: string) {
    const exercise = this.dataByExercise[exerciseId];
    exercise.countWrong = exercise.countWrong ? ++exercise.countWrong : 1;
  }

  protected addRightCount(exerciseId: string) {
    const exercise = this.dataByExercise[exerciseId];
    exercise.countRight = exercise.countRight ? ++exercise.countRight : 1;
  }

  protected soundLearnedLevel(learnLevel: number) {
    // Only in practise
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

  protected addExercise(isCorrect: boolean) {

  }

  protected determineQuestionType(exercise: ExerciseData, learnLevel: number): QuestionType {
    return 0;
  }

  protected getNrOfChoices(learnLevel?: number): number {
    return 8;
  }

  protected getCurrentLearnLevel(data: ExerciseData): number {
    let learnLevel = data && data.result ? data.result.learnLevel || 0 : 1; // saved data
    // CHECK if this exerciseid has been answered before; if so; use this level
    const lastLevel = this.dataByExercise[data.exercise._id].levels;
    if (lastLevel !== null) {
      // Use level from this score
      learnLevel = lastLevel;
    }
    return learnLevel;
  }

  protected setExerciseDataById() {
    this.exerciseData.forEach(exercise => {
      this.dataByExercise[exercise.exercise._id] = {
        countRight: 0,
        countWrong: 0,
        levels: null
      };
    });
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
