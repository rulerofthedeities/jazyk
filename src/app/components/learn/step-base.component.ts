import {Input, Output, ViewChild, EventEmitter} from '@angular/core';
import {LearnService} from '../../services/learn.service';
import {PreviewService} from '../../services/preview.service';
import {ErrorService} from '../../services/error.service';
import {SharedService} from '../../services/shared.service';
import {LearnSettings} from '../../models/user.model';
import {LanPair, LanConfig} from '../../models/course.model';
import {Exercise, ExerciseData, ExerciseResult, ExerciseStep, Choice,
        ExerciseType, AnswerType, QuestionType, Direction} from '../../models/exercise.model';
import {LearnWordFieldComponent} from './word-field.component';
import {LearnSentenceComponent} from './sentence.component';
import {LearnQAComponent} from './qa.component';
import {Subscription} from 'rxjs/Subscription';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Subject} from 'rxjs/Subject';
import 'rxjs/add/operator/takeWhile';

interface Map<T> {
  [K: string]: T;
}

interface ById {
  levels: number;
  countWrong: number;
  countRight: number;
}

interface LearnLevelData {
  level: number;
  correct: boolean;
  alt: boolean;
  almostCorrect: boolean;
}

export abstract class Step {
  @Input() protected exercises: Exercise[];
  @Input() private exercisesInterrupted: Subject<boolean>;
  @Input() settings: LearnSettings;
  @Input() text: Object;
  @Input() lanPair: LanPair;
  @Input() options: ExerciseStep;
  @Output() stepCompleted = new EventEmitter<ExerciseData[]>();
  @Output() updatedSettings = new EventEmitter<LearnSettings>();
  @ViewChild(LearnWordFieldComponent) answerComponent: LearnWordFieldComponent;
  @ViewChild(LearnSentenceComponent) sentenceComponent: LearnSentenceComponent;
  @ViewChild(LearnQAComponent) qaComponent: LearnQAComponent;
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
  isAnswered = false;
  isCorrect = false; // word
  current = -1; // entry in exerciseData
  isQuestionReady = false;
  isCountDown: boolean;
  isMute: boolean;
  score = 0;
  maxRepeatWord = 4;
  qType = QuestionType;
  exType = ExerciseType;

  constructor(
    protected learnService: LearnService,
    protected previewService: PreviewService,
    protected errorService: ErrorService,
    protected sharedService: SharedService
  ) {}

  onCountDownFinished() {
    this.sharedService.changeExerciseMode(true);
    this.isCountDown = false;
  }

  onSettingsUpdated(settings: LearnSettings) {
    this.settings = settings;
    this.updatedSettings.emit(settings);
  }

  onRestart() {
    if (this.isExercisesDone) {
      this.restart();
    }
  }

  onKeyPressed(key: string) {
    if (!this.isExercisesDone && this.currentData) {
      switch (this.currentData.data.questionType) {
        case QuestionType.Choices:
          let selection: number;
          switch (key) {
            case 'Enter':
              if (this.isAnswered) {
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
              if (!this.isAnswered) {
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
    if (!this.isAnswered) {
      this.checkChoicesAnswer(i);
    }
  }

  onAnsweredSentence(isCorrect: boolean) {
    if (!this.isAnswered) {
      this.checkSentenceAnswer(isCorrect);
    }
  }

  onNextWord() {
    console.log('pressed next', this.currentData.data.questionType);
    switch (this.currentData.data.questionType) {
      case QuestionType.Choices:
        if (this.isAnswered) {
          this.nextWord();
        }
      break;
      case QuestionType.Word:
        this.checkIfWordAnswer();
      break;
      case QuestionType.Sentence:
        this.nextWord();
      break;
      case QuestionType.QA:
        this.checkIfQAAnswer();
      break;
    }
  }

  getQuestionDir(): string {
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

  isSelectionExercise(): boolean {
    let isSelection = false;
    if (this.currentData &&
        (this.currentData.data.questionType === QuestionType.Choices ||
        this.currentData.data.questionType === QuestionType.Sentence)) {
      isSelection = true;
    }
    return isSelection;
  }

  isEnterDataExercise(): boolean {
    let isEnterData = false;
    if (this.currentData &&
        (this.currentData.data.questionType === QuestionType.Word ||
        this.currentData.data.questionType === QuestionType.QA)) {
      isEnterData = true;
    }
    return isEnterData;
  }

  protected init() {
    this.isCountDown = this.settings.countdown;
    this.isMute = this.settings.mute;
    this.checkExercisesInterrupted();
    this.getConfig(this.lanPair.to); // For keyboard keys
    if (!this.isCountDown) {
      this.onCountDownFinished();
    }
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

  private checkIfQAAnswer() {
    if (!this.isAnswered) {
      if (this.qaComponent && this.qaComponent.getData()) {
        this.checkQAAnswer(this.qaComponent.getData(), this.qaComponent.getCorrect());
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
      this.sharedService.changeExerciseMode(false);
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
    this.isCorrect = false;
    this.answered = null;
    this.answer = null;
    if (this.answerComponent) {
      this.answerComponent.clearData();
    }
    if (this.sentenceComponent) {
      this.sentenceComponent.clearData();
    }
    if (this.qaComponent) {
      this.qaComponent.clearData();
    }
    if (this.nextWordTimer) {
      this.nextWordTimer.unsubscribe();
    }
  }

  protected checkWordAnswer(answer: string) {
    const filteredAnswer = this.filter(answer);
    if (filteredAnswer) {
      const solution = this.currentData.exercise.foreign.word,
            filteredSolution = this.filter(solution);
      if (filteredAnswer === filteredSolution) {
        // Correct answer
        this.checkAnswer(AnswerType.Correct, QuestionType.Word, solution);
      } else if (this.checkAltAnswers(this.currentData.exercise, filteredAnswer)) {
        // Alternative answer (synonym)
        this.checkAnswer(AnswerType.Alt, QuestionType.Word, solution);
      } else if (this.learnService.isAlmostCorrect(filteredAnswer, filteredSolution)) {
        // Almost correct answer
        this.checkAnswer(AnswerType.AlmostCorrect, QuestionType.Word, solution);
      } else {
        // Incorrect answer
        this.checkAnswer(AnswerType.Incorrect, QuestionType.Word, solution);
      }
    }
  }

  protected checkChoicesAnswer(i: number) {
    this.answered = i;
    this.answer = null;
    const choice = this.currentChoices[i],
          direction = this.currentData.data.direction,
          word = direction === Direction.ForeignToLocal ? this.currentData.exercise.local.word : this.currentData.exercise.foreign.word;

    if (choice === word) {
      this.checkAnswer(AnswerType.Correct, QuestionType.Choices);
    } else {
      this.checkAnswer(AnswerType.Incorrect, QuestionType.Choices);
      // Show correct answer
      this.currentChoices.forEach( (item, j) => {
        if (item === word) {
          this.answer = j;
        }
      });
    }
  }

  protected checkSentenceAnswer(isCorrect: boolean) {
    if (isCorrect) {
      this.checkAnswer(AnswerType.Correct, QuestionType.Sentence);
    } else {
      this.checkAnswer(AnswerType.Incorrect, QuestionType.Sentence);
    }
  }

  protected checkQAAnswer(answer: string, solution: string) {
    const filteredAnswer = this.filter(answer);
    if (filteredAnswer) {
      const filteredSolution = this.filter(solution);
      if (filteredAnswer === filteredSolution) {
        // Correct answer
        this.checkAnswer(AnswerType.Correct, QuestionType.QA, solution);
      } else if (this.learnService.isAlmostCorrect(filteredAnswer, filteredSolution)) {
        // Almost correct answer
        this.checkAnswer(AnswerType.AlmostCorrect, QuestionType.QA, solution);
      } else {
        // Incorrect answer
        this.checkAnswer(AnswerType.Incorrect, QuestionType.QA, solution);
      }
    }
  }

  private checkAnswer(answer: AnswerType, question: QuestionType, solution = '') {
    this.endDate = new Date();
    const timeDelta = (this.endDate.getTime() - this.startDate.getTime()) / 100;
    let learnLevel = this.getCurrentLearnLevel(this.currentData);
    this.isAnswered = true;
    this.solution = solution;
    this.currentData.data.isDone = true;
    this.currentData.data.timeDelta = timeDelta;

    switch (answer) {
      case AnswerType.Correct:
        this.isCorrect = true;
        this.currentData.data.isCorrect = true;
        this.currentData.data.isAlmostCorrect = false;
        this.currentData.data.isAlt = false;
        this.currentData.data.grade = this.calculateGrade(question, timeDelta, 0, solution);
      break;
      case AnswerType.Alt:
        this.isCorrect = true;
        this.currentData.data.isCorrect = true;
        this.currentData.data.isAlmostCorrect = false;
        this.currentData.data.isAlt = false;
        this.currentData.data.grade = this.calculateGrade(question, timeDelta, 1, solution);
      break;
      case AnswerType.AlmostCorrect:
        this.isCorrect = false;
        this.currentData.data.isCorrect = false;
        this.currentData.data.isAlmostCorrect = true;
        this.currentData.data.isAlt = false;
        this.currentData.data.grade = 1;
      break;
      case AnswerType.Incorrect:
        this.isCorrect = false;
        this.currentData.data.isCorrect = false;
        this.currentData.data.isAlmostCorrect = false;
        this.currentData.data.isAlt = false;
        this.currentData.data.grade = 0;
        this.currentData.data.points = 0;
      break;
    }
    const learnLevelData = {
      level: learnLevel,
      correct: this.currentData.data.isCorrect,
      alt: this.currentData.data.isAlmostCorrect,
      almostCorrect: this.currentData.data.isAlmostCorrect
    };
    learnLevel = this.calculateLearnLevel(question, learnLevelData);
    this.currentData.data.learnLevel = learnLevel;
    this.dataByExercise[this.currentData.exercise._id].levels = learnLevel;
    this.addCount(this.isCorrect, this.currentData.exercise._id);
    const points = this.calculatePoints(answer, question);
    this.currentData.data.points = points;
    this.score = this.score + points;
    if (this.doAddExercise(answer, question, learnLevel)) {
      this.addExercise(this.currentData.data.isCorrect);
    }
    this.levelUpdated.next(learnLevel);
    this.pointsEarned.next(points);
  }

  protected doAddExercise(a: AnswerType, q: QuestionType, learnLevel: number): boolean {
    return false;
  }

  protected addExercise(isCorrect: boolean) {
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
    const streak = this.exerciseData[this.current].result ? this.exerciseData[this.current].result.streak : (isCorrect ? '1' : '0');
    newExerciseData.result = {
      learnLevel: newExerciseData.data.learnLevel,
      points: 0,
      streak
    };
    this.exerciseData.push(newExerciseData);
    if (!this.options.ordered) {
      this.shuffleRemainingExercises();
    }
  }

  private shuffleRemainingExercises() {
    const original = this.exercises.length,
          total = this.exerciseData.length,
          nrDone = this.current + 1, // skip next
          done = this.exerciseData.slice(0, nrDone);
    if (nrDone > original && total - nrDone > 2) {
      const todo = this.exerciseData.slice(nrDone, total),
            shuffled = this.previewService.shuffle(todo);
      this.exerciseData = done.concat(shuffled);
    }
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

  private calculatePoints(answer: AnswerType, question: QuestionType): number {
    let points = 0;
    switch (question) {
      case QuestionType.Word:
      case QuestionType.QA:
        if (this.currentData.data.isCorrect) {
          points = 100;
        } else if (this.currentData.data.isAlt) {
          points = 80;
        }else if (this.currentData.data.isAlmostCorrect) {
          points = 20;
        }
      break;
      case QuestionType.Choices:
        if (this.currentData.data.isCorrect) {
          points = 2 + this.currentChoices.length * 3;
        }
      break;
      case QuestionType.Sentence:
        if (this.currentData.data.isCorrect) {
          points = 2 + Math.min(20, this.currentData.exercise.options.length * 4);
        }
      break;
    }

    return points;
  }

  private calculateGrade(question: QuestionType, delta: number, deduction = 0, solution = ''): number {
    let grade;

    switch (question) {
      case QuestionType.Choices :
      case QuestionType.Sentence:
        grade = this.calculateChoicesGrade(delta);
      break;
      case QuestionType.Word:
      case QuestionType.QA:
        grade = this.calculateWordGrade(delta, deduction, solution);
      break;
    }

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
    grade -= deduction;

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

  private calculateLearnLevel(question: QuestionType, learnLevelData: LearnLevelData): number {
    let level;

    switch (question) {
      case QuestionType.Choices :
      case QuestionType.Sentence:
        level = this.calculateChoicesLearnLevel(learnLevelData);
      break;
      case QuestionType.Word:
      case QuestionType.QA:
        level = this.calculateWordLearnLevel(learnLevelData);
      break;
    }

    if (learnLevelData.correct) {
      this.soundLearnedLevel(level);
    }

    return level;
  }

  private calculateWordLearnLevel(learnLevelData: LearnLevelData): number {
    let level = learnLevelData.level;
    if (learnLevelData.correct) {
      level += 5;
    } else {
      if (level > 0) {
        if (learnLevelData.almostCorrect) {
          level -= 2;
        } else if (!learnLevelData.alt) {
          level -= 3;
        }
      }
    }
    level = Math.max(level, 0);
    return level;
  }

  private calculateChoicesLearnLevel(learnLevelData: LearnLevelData): number {
    let level = learnLevelData.level;
    if (learnLevelData.correct) {
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

  private addCount(isCorrect: boolean, exerciseId: string) {
    if (isCorrect) {
      this.addRightCount(exerciseId);
    } else {
      this.addWrongCount(exerciseId);
    }
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
    this.currentChoices = this.previewService.shuffle(choices);
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

  private restart() {
    this.isExercisesDone = false;
    this.sharedService.changeExerciseMode(true);
    this.current = -1;
    this.fetchResults();
  }

  protected fetchResults() {

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

  private checkExercisesInterrupted() {
    this.exercisesInterrupted
    .takeWhile(() => this.componentActive)
    .subscribe( event => {
      let nrDone = this.current;
      if (this.currentData.data.isDone) {
        nrDone++;
      }
      this.isExercisesDone = true;
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

}
