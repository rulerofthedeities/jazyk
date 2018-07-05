import {Input, Output, ViewChild, EventEmitter} from '@angular/core';
import {LearnService} from '../../services/learn.service';
import {PreviewService} from '../../services/preview.service';
import {ErrorService} from '../../services/error.service';
import {isLearnedLevel, maxStreak, SharedService} from '../../services/shared.service';
import {LearnSettings} from '../../models/user.model';
import {Course, LanPair, KeyboardKeys, LanConfig, Lesson, LessonOptions, StepCount, Map} from '../../models/course.model';
import {Exercise, ExerciseData, ExerciseExtraData, ExerciseResult, ExerciseStep, Choice, ConjugationsData,
        ExerciseType, AnsweredType, QuestionType, Direction, Points, TimeCutoffs} from '../../models/exercise.model';
import {LearnWordFieldComponent} from './exercise-word-field.component';
import {LearnSelectComponent} from './exercise-select.component';
import {LearnComparisonComponent} from './exercise-comparison.component';
import {LearnConjugationsComponent} from './exercise-conjugations.component';
import {LearnQAComponent} from './exercise-qa.component';
import {LearnTimerComponent} from './timer.component';
import {Subject, BehaviorSubject, Subscription} from 'rxjs';
import {takeWhile} from 'rxjs/operators';

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

interface DlData { // DamerauLevenshteinDistance
  index: number;
  dl: number;
}

export abstract class Step {
  @Input() private exercisesInterrupted: Subject<boolean>;
  @Input() private stepcountUpdated: BehaviorSubject<Map<StepCount>>;
  @Input() protected lesson: Lesson;
  @Input() settings: LearnSettings;
  @Input() course: Course;
  @Input() text: Object;
  @Input() lanPair: LanPair;
  @Output() stepCompleted = new EventEmitter<ExerciseData[]>();
  @Output() updatedSettings = new EventEmitter<LearnSettings>();
  @ViewChild(LearnWordFieldComponent) answerComponent: LearnWordFieldComponent;
  @ViewChild(LearnComparisonComponent) comparisonComponent: LearnComparisonComponent;
  @ViewChild(LearnConjugationsComponent) conjugationsComponent: LearnConjugationsComponent;
  @ViewChild(LearnSelectComponent) selectComponent: LearnSelectComponent;
  @ViewChild(LearnQAComponent) qaComponent: LearnQAComponent;
  @ViewChild(LearnTimerComponent) timerComponent: LearnTimerComponent;
  protected componentActive = true;
  protected choices: Choice[];
  protected nextWordTimer: Subscription;
  protected dataByExerciseUnid: Map<ById> = {}; // Keeps track of data per exercise, not per result
  exerciseData: ExerciseData[]; // main container of exercise data + results
  currentData: ExerciseData; // container for current exercise data + results
  pointsEarned: Subject<number> = new Subject();
  hasAnswered: Subject<boolean> = new Subject();
  gotoNextWord: Subject<boolean> = new Subject();
  nextExercise: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  levelUpdated: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  countPerStep: Map<StepCount> = {};
  isExercisesDone = false;
  keys: KeyboardKeys = {lowercase: [], uppercase: []}; // keyboard keys
  pronouns: string[] = []; // subject pronouns
  currentChoices: string[] = []; // choices
  answered: number; // choices
  answer: number; // choices
  solution: string; // word
  prefix: string; // word
  isAnswered = false;
  isCorrect = false; // word
  current = -1; // entry in exerciseData
  isQuestionReady = false;
  noMoreExercises = false;
  isReady = false;
  isCountDown: boolean;
  isMute: boolean;
  maxRepeatWord = 5;
  currentStep: string;
  qType = QuestionType;
  exType = ExerciseType;

  constructor(
    protected learnService: LearnService,
    protected previewService: PreviewService,
    protected errorService: ErrorService,
    protected sharedService: SharedService
  ) {}

  onCountDownFinished() {
    this.isCountDown = false;
    this.sharedService.changeExerciseMode(true);
    this.log(`Starting exercises (${this.currentStep})`);
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
              if (this.isAnswered) {
                this.gotoNextWord.next(true);
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
                  this.hasAnswered.next(true);
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
        case QuestionType.Conjugations:
          if (key === 'Enter') {
            this.checkIfConjugationsAnswer();
          }
        break;
        case QuestionType.FillIn:
          if (key === 'Enter') {
            this.checkIfFillInAnswer(false);
          }
        break;
      }
    }
  }

  onSelected(i: number) {
    if (!this.isAnswered) {
      this.hasAnswered.next(true);
      this.checkChoicesAnswer(i);
    }
  }

  onAnsweredSelect(isCorrect: boolean) {
    if (!this.isAnswered) {
      this.checkSelectAnswer(isCorrect);
    }
  }

  onNextWord(giveAnswer = false) {
    if (!giveAnswer) {
      this.gotoNextWord.next(true);
    }
    switch (this.currentData.data.questionType) {
      case QuestionType.Choices:
        if (giveAnswer) {
          this.checkChoicesAnswer(null);
        } else if (this.isAnswered) {
          this.nextWord();
        }
      break;
      case QuestionType.Word:
        this.checkIfWordAnswer(giveAnswer);
      break;
      case QuestionType.Select:
        if (giveAnswer) {
          this.selectComponent.onSelected(null);
          this.checkSelectAnswer(false);
        } else {
          this.nextWord();
        }
      break;
      case QuestionType.FillIn:
        this.checkIfFillInAnswer(giveAnswer);
      break;
      case QuestionType.Comparison:
        this.checkIfComparisonAnswer();
      break;
      case QuestionType.Conjugations:
        this.checkIfConjugationsAnswer();
      break;
      case QuestionType.Preview:
        this.previewDone();
      break;
    }
  }

  getQuestionDir(): string {
    let tpe = 'local';
    if (this.currentData) {
      if ((this.currentData.data.questionType === QuestionType.Choices
        && this.currentData.data.direction === Direction.ForeignToLocal)
        || this.currentData.data.questionType === QuestionType.Preview) {
        tpe = 'foreign';
      }
    }
    return tpe;
  }

  getAlts(tpe: string, word: Exercise): string {
    let altwords = '';
    if (word && word[tpe] && word[tpe].alt) {
      altwords = word[tpe].alt.split('|').join(', ');
    }
    return altwords;
  }

  isInput() {
    // can show keyboard
    let isInput = false;
    if (this.currentData) {
      switch (this.currentData.data.questionType) {
        case QuestionType.Word:
        case QuestionType.FillIn:
        case QuestionType.Comparison:
        case QuestionType.Conjugations:
        isInput = true;
      }
    }
    return isInput;
  }

  showDefaultQuestion(): boolean {
    const qTpe = this.currentData ? this.currentData.data.questionType : 0;
    let show = true;
    if (this.currentData) {
      switch (this.currentData.data.questionType) {
        case QuestionType.Select:
        case QuestionType.FillIn:
        case QuestionType.Comparison:
        case QuestionType.Conjugations:
        show = false;
      }
    }
    return show;
  }

  isSelectionExercise(): boolean {
    let isSelection = false;
    if (this.currentData &&
        (this.currentData.data.questionType === QuestionType.Choices ||
        this.currentData.data.questionType === QuestionType.Select)) {
      isSelection = true;
    }
    return isSelection;
  }

  protected init() {
    this.isCountDown = this.settings.countdown;
    this.isMute = this.settings.mute;
    this.checkExercisesInterrupted();
    this.checkCountUpdated();
    this.getConfig(this.lanPair.to); // For keyboard keys & pronouns
    if (!this.isCountDown) {
      this.onCountDownFinished();
    }
  }

  protected clearToContinue() {
    this.isReady = false;
    this.current = -1;
    this.isQuestionReady = false;
    this.isExercisesDone = false;
    this.noMoreExercises = false;
  }

  protected getChoices(courseId: string, isBidirectional = true) {
    this.learnService
    .fetchCourseChoices(courseId, this.lanPair)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      choices => {
        this.choices = choices;
        this.nextWord();
      },
      error => this.errorService.handleError(error)
    );
  }

  private checkIfWordAnswer(giveAnswer = false) {
    if (!this.isAnswered) {
      if (this.answerComponent) {
        this.hasAnswered.next(true);
        this.checkWordAnswer(
          this.answerComponent.getData(),
          giveAnswer
        );
      }
    } else {
      this.gotoNextWord.next(true);
      this.nextWord();
    }
  }

  private checkIfFillInAnswer(giveAnswer = false) {
    if (!this.isAnswered || giveAnswer) {
      if (this.qaComponent && (this.qaComponent.getData() || giveAnswer)) {
        this.checkFillInAnswer(
          this.qaComponent.getData(),
          this.qaComponent.getCorrect(),
          QuestionType.FillIn, giveAnswer
        );
      }
    } else {
      this.nextWord();
    }
  }

  private checkIfComparisonAnswer() {
    if (!this.isAnswered) {
      if (this.comparisonComponent && this.comparisonComponent.getData()) {
        this.checkComparisonAnswer(this.comparisonComponent.getData());
      }
    } else {
      this.nextWord();
    }
  }

  private checkIfConjugationsAnswer() {
    if (!this.isAnswered) {
      if (this.conjugationsComponent) {
        this.checkConjugationsAnswer(this.conjugationsComponent.getData());
      }
    } else {
      this.nextWord();
    }
  }

  protected previewDone() {
    // Only in practise
  }

  protected nextWord() {
    this.clearData();
    this.current++;
    if (this.current >= this.exerciseData.length) {
      this.practiseDone(this.exerciseData);
      this.stepCompleted.emit(this.exerciseData);
      this.sharedService.changeExerciseMode(false);
    }
    if (!this.isExercisesDone) {
      this.currentData = this.exerciseData[this.current];
      const learnLevel = this.getCurrentLearnLevel(this.currentData),
            qType = this.determineQuestionType(this.currentData, learnLevel);
      this.levelUpdated.next(learnLevel);
      this.currentData.data.questionType = qType;
      if (this.currentData.data.questionType === QuestionType.Choices) {
        this.setChoices();
      }
      this.currentData.data.timeCutoffs = this.setTimeCutOffs(qType, this.currentData);
      if (this.currentData.data.questionType === QuestionType.Word) {
        // Get prefix from word, pass on to answer field
        const word = this.currentData.exercise.foreign.word;
        this.prefix = this.getPrefix(word);
      }
    this.isQuestionReady = true;
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
    if (this.selectComponent) {
      this.selectComponent.clearData();
    }
    if (this.qaComponent) {
      this.qaComponent.clearData();
    }
    if (this.comparisonComponent) {
      this.comparisonComponent.clearData();
    }
    if (this.conjugationsComponent) {
      this.conjugationsComponent.clearData();
    }
    if (this.nextWordTimer) {
      this.nextWordTimer.unsubscribe();
    }
  }

  protected checkWordAnswer(answer: string, giveAnswer = false) {
    const filteredAnswer = this.filter(answer);
    if (filteredAnswer || giveAnswer) {
      const solution = this.currentData.exercise.foreign.word,
            filteredSolution = this.filter(solution);
      if (filteredAnswer === filteredSolution) {
        // Correct answer
        this.checkAnswer(AnsweredType.Correct, QuestionType.Word, solution);
      } else if (this.checkAltAnswers(this.currentData.exercise, filteredAnswer)) {
        // Alternative answer (synonym)
        this.checkAnswer(AnsweredType.Alt, QuestionType.Word, solution);
      } else if (this.learnService.isAlmostCorrect(filteredAnswer, filteredSolution)) {
        // Almost correct answer
        this.checkAnswer(AnsweredType.AlmostCorrect, QuestionType.Word, solution);
      } else {
        // Incorrect answer
        this.checkAnswer(AnsweredType.Incorrect, QuestionType.Word, solution);
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
      this.checkAnswer(AnsweredType.Correct, QuestionType.Choices);
    } else {
      this.checkAnswer(AnsweredType.Incorrect, QuestionType.Choices);
      // Show correct answer
      this.currentChoices.forEach( (item, j) => {
        if (item === word) {
          this.answer = j;
        }
      });
    }
  }

  protected checkSelectAnswer(isCorrect: boolean) {
    if (isCorrect) {
      this.checkAnswer(AnsweredType.Correct, QuestionType.Select);
    } else {
      this.checkAnswer(AnsweredType.Incorrect, QuestionType.Select);
    }
  }

  protected checkFillInAnswer(answer: string, solution: string, question: QuestionType, giveAnswer = false) {
    const filteredAnswer = this.filter(answer);
    if (filteredAnswer || giveAnswer) {
      const filteredSolution = this.filter(solution);
      if (filteredAnswer === filteredSolution) {
        // Correct answer
        this.checkAnswer(AnsweredType.Correct, question, solution);
      } else if (this.learnService.isAlmostCorrect(filteredAnswer, filteredSolution)) {
        // Almost correct answer
        this.checkAnswer(AnsweredType.AlmostCorrect, question, solution);
      } else {
        // Incorrect answer
        this.checkAnswer(AnsweredType.Incorrect, question, solution);
      }
    }
  }

  protected checkConjugationsAnswer(data: ConjugationsData) {
    const result = [false, false, false, false, false, false];
    let correct = 0,
        filteredAnswer: string;
    data.answers.forEach((answerItem, i) => {
      filteredAnswer = this.filter(answerItem);
      if (filteredAnswer === data.solutions[i + 1] || (filteredAnswer && data.alts[i] === filteredAnswer )) {
        result[i] = true;
        correct++;
      }
    });
    const answer = correct === 6 ? AnsweredType.Correct : (correct === 5 ? AnsweredType.AlmostCorrect : AnsweredType.Incorrect);
    this.checkAnswer(answer, QuestionType.Conjugations, data.solutions.join(''));
    this.conjugationsComponent.showResult(result);
  }

  protected checkComparisonAnswer(data: ConjugationsData) {
    const result = [false, false];
    let correct = 0,
        filteredAnswer: string;
    data.answers.forEach((answerItem, i) => {
      filteredAnswer = this.filter(answerItem);
      if (filteredAnswer === data.solutions[i + 1] || (filteredAnswer && data.alts[i] === filteredAnswer)) {
        result[i] = true;
        correct++;
      }
    });
    const answer = correct === 2 ? AnsweredType.Correct : AnsweredType.Incorrect;
    this.checkAnswer(answer, QuestionType.Comparison, data.solutions.join(''));
    this.comparisonComponent.showResult(result);
  }

  private checkAnswer(answer: AnsweredType, question: QuestionType, solution = '') {
    const timeDelta = this.timerComponent.getTimeDelta();
    let learnLevel = this.getCurrentLearnLevel(this.currentData);
    this.isAnswered = true;
    this.solution = solution;
    this.currentData.data.isDone = true;
    this.currentData.data.timeDelta = timeDelta;
    switch (answer) {
      case AnsweredType.Correct:
        this.isCorrect = true;
        this.currentData.data.isCorrect = true;
        this.currentData.data.isAlmostCorrect = false;
        this.currentData.data.isAlt = false;
        this.currentData.data.grade = this.calculateGrade(question, timeDelta, 0, solution);
        this.currentData.data.streak = this.setStreak(this.currentData, '1');
      break;
      case AnsweredType.Alt:
        this.isCorrect = true;
        this.currentData.data.isCorrect = true;
        this.currentData.data.isAlmostCorrect = false;
        this.currentData.data.isAlt = false;
        this.currentData.data.grade = this.calculateGrade(question, timeDelta, 1, solution);
        this.currentData.data.streak = this.setStreak(this.currentData, '1');
      break;
      case AnsweredType.AlmostCorrect:
        this.isCorrect = false;
        this.currentData.data.isCorrect = false;
        this.currentData.data.isAlmostCorrect = true;
        this.currentData.data.isAlt = false;
        this.currentData.data.grade = 1;
        this.currentData.data.streak = this.setStreak(this.currentData, '2');
      break;
      case AnsweredType.Incorrect:
        this.isCorrect = false;
        this.currentData.data.isCorrect = false;
        this.currentData.data.isAlmostCorrect = false;
        this.currentData.data.isAlt = false;
        this.currentData.data.grade = 0;
        this.currentData.data.streak = this.setStreak(this.currentData, '0');
      break;
    }
    // Learnlevel
    if (question === QuestionType.Word || question === QuestionType.Choices) {
      // Set level for words
      const learnLevelData = {
        level: learnLevel,
        correct: this.currentData.data.isCorrect,
        alt: this.currentData.data.isAlmostCorrect,
        almostCorrect: this.currentData.data.isAlmostCorrect
      };
      learnLevel = this.calculateLearnLevel(question, learnLevelData);
    } else {
      // For exercises, set learnlevel immediately if answered correctly
      if (answer === AnsweredType.Correct) {
        learnLevel = isLearnedLevel;
      }
    }
    const unid = this.currentData.exercise._id + (this.currentData.exercise.lessonId || '');
    this.currentData.data.learnLevel = learnLevel;
    this.dataByExerciseUnid[unid].levels = learnLevel;
    this.addCount(this.isCorrect, unid);
    this.currentData.data.points.base = this.calculateBasePoints(answer, question);
    const foreignWord = this.currentData.exercise.foreign.word;
    if (answer === AnsweredType.Correct && !this.isRehearse()) {
      this.currentData.data.points.length = this.calculateLengthPoints(foreignWord);
      this.currentData.data.points.time = this.calculateTimePoints(timeDelta, this.currentData);
      this.currentData.data.points.streak = this.calculateStreakPoints(this.currentData.data);
      this.currentData.data.points.new = this.calculateNewPoints(this.currentData.result);
      this.currentData.data.points.age = this.calculateAgePoints(this.currentData);
    }
    if (this.doAddExercise(answer, question, learnLevel)) {
      this.addExercise(this.currentData.data.isCorrect, this.currentData.data.isAlmostCorrect);
    }
    this.sharedService.log('Points', this.currentData.data.points);
    this.levelUpdated.next(learnLevel);
    this.pointsEarned.next(this.currentData.data.points.total());
    this.nextExercise.next(this.current); // For bullets update
  }

  protected doAddExercise(aType: AnsweredType, qType: QuestionType, learnLevel: number): boolean {
    // overridden in Practice step (used in review & difficult)
    const nrOfQuestions = this.exerciseData.length;
    let add = false;
    if (aType === AnsweredType.Incorrect || aType === AnsweredType.AlmostCorrect) {
      add = true;
    }
    // Only readd exercise to the back if question was answered incorrectly max twice
    const unid = this.currentData.exercise._id + (this.currentData.exercise.lessonId || ''),
          exercise = this.dataByExerciseUnid[unid],
          countWrong = exercise.countWrong ? exercise.countWrong : 0;
    if (countWrong > 2) {
      add = false;
    }
    return add;
  }

  protected addExercise(isCorrect: boolean, isAlmostCorrect: boolean) {
    const newExerciseData: ExerciseData = {
            data: JSON.parse(JSON.stringify(this.exerciseData[this.current].data)),
            exercise: this.exerciseData[this.current].exercise
          },
          stepOptions = this.lesson ? this.lesson.exerciseSteps.practise : null;
    let streak = '';
    newExerciseData.data.isCorrect = false;
    newExerciseData.data.isDone = false;
    newExerciseData.data.isAlt = false;
    newExerciseData.data.isAlmostCorrect = false;
    newExerciseData.data.grade = 0;
    newExerciseData.data.points = this.previewService.setDefaultPoints();
    newExerciseData.data.answered = newExerciseData.data.answered + 1;
    if (!stepOptions || stepOptions.bidirectional) {
      newExerciseData.data.direction = Math.random() >= 0.5 ? Direction.LocalToForeign : Direction.ForeignToLocal;
    }
    if (isCorrect !== null) {
      streak = this.exerciseData[this.current].result ?
        this.exerciseData[this.current].result.streak :
        (isCorrect ? '1' : isAlmostCorrect ? '2' : '0');
    }
    newExerciseData.result = {
      learnLevel: newExerciseData.data.learnLevel,
      points: 0,
      streak
    };
    this.exerciseData.push(newExerciseData);
    if (!stepOptions || !stepOptions.ordered) {
      this.shuffleRemainingExercises();
    }
  }

  protected shuffleRemainingExercises() {
    const total = this.exerciseData.length,
          done = this.exerciseData.slice(0, this.current + 1),
          todo = this.exerciseData.slice(this.current + 1, total);
    let shuffled = this.previewService.shuffle(todo);
    if (todo.length > 2) {
      this.exerciseData = done.concat(shuffled);
      // Shuffle again if next exercise is the same as the current exercise
      if (this.exerciseData[this.current].exercise._id === this.exerciseData[this.current + 1].exercise._id) {
        shuffled = this.previewService.shuffle(todo);
        this.exerciseData = done.concat(shuffled);
      }
    }
  }

  private setStreak(data: ExerciseData, newResult: string): string {
    // only temporarily for streak scores
    // final streak is set in course component
    let streak = data.result ? data.result.streak || '' : '';
    streak += newResult;
    return streak.slice(-maxStreak);
  }

  private filter(word: string): string {
    let filteredAnswer = word;
    if (!this.isCaseSensitive()) {
      filteredAnswer = word.toLowerCase();
    }
    filteredAnswer = this.learnService.filterPrefix(filteredAnswer);
    filteredAnswer = filteredAnswer.replace(/ +(?= )/g, ''); // replace all multiple spaces with one space
    filteredAnswer = filteredAnswer.replace(/[\.,\?;:!]/g, ''); // remove .,?;:
    return filteredAnswer;
  }

  private getPrefix(word: string): string {
    let filter = '';
    const matches = word.match(/\((.*?)\)/);
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

  private calculateBasePoints(answer: AnsweredType, question: QuestionType): number {
    let points = 0;
    // Points dependon Question type
    switch (question) {
      case QuestionType.Word:
      case QuestionType.FillIn:
        if (this.currentData.data.isCorrect) {
          points = 50;
        } else if (this.currentData.data.isAlt) {
          points = 40;
        } else if (this.currentData.data.isAlmostCorrect) {
          points = 10;
        }
      break;
      case QuestionType.Choices:
        if (this.currentData.data.isCorrect) {
          points = 2 + this.currentChoices.length * 3;
        }
      break;
      case QuestionType.Select:
        if (this.currentData.data.isCorrect) {
          const optionsArr = this.currentData.exercise.options;
          points = 2 + Math.min(20, optionsArr.length * 4);
        }
      break;
      case QuestionType.Comparison:
        if (this.currentData.data.isCorrect) {
          points = 70;
        }
      break;
      case QuestionType.Conjugations:
        if (this.currentData.data.isCorrect) {
          points = 110;
        } else if (this.currentData.data.isAlmostCorrect) {
          points = 15;
        }
      break;
    }
    // Exercise type bonuses
    switch (this.currentData.exercise.tpe) {
      case ExerciseType.Word:
      break;
      case ExerciseType.Article:
      case ExerciseType.Comparison:
      case ExerciseType.FillIn:
      case ExerciseType.Genus:
      case ExerciseType.QA:
      case ExerciseType.Select:
        if (this.currentData.data.isCorrect) {
          // points += 15;
        }
      break;
    }
    // If this is a practise repeat, drastically reduce points
    if (this.lesson && this.isRehearse()) {
      points = Math.round(points / 10);
    }

    return points;
  }

  private calculateLengthPoints(word: string): number {
    const points = word.length * 2;
    return points;
  }

  private calculateTimePoints(time, data: ExerciseData): number {
    const cutOffs = data.data.timeCutoffs;
    if (time > cutOffs.green + cutOffs.orange + cutOffs.red) {
      return 0;
    } else if (time > cutOffs.green + cutOffs.orange) {
      return 2;
    } else if (time > cutOffs.green) {
      return 5;
    } else {
      return 10;
    }
  }

  private calculateStreakPoints(data: ExerciseExtraData): number {
    let points = 0,
        accumulator = 0;
    const multiplicator = 1.3;
    if (data && data.streak) {
      const streak = data.streak;
      for (let i = streak.length - 1; i > Math.max(0, streak.length - 10); i--) {
        if (streak[i - 1] === '1') {
          accumulator += 5;
          points += accumulator;
          points *= multiplicator;
        } else {
          if (points > 0) {
            points /= multiplicator;
          }
          return Math.round(points);
        }
      }
    }
    return Math.round(points);
  }

  private calculateNewPoints(resultData: ExerciseResult): number {
    const newBonus = 25;
    if (resultData) {
      if (!resultData.streak) {
        return newBonus;
      } else {
        return 0;
      }
    } else {
      return newBonus;
    }
  }

  protected calculateAgePoints(resultData: ExerciseData): number {
    // Only for review & difficult
    // The longer it has been since the last review, the more points
    let agePoints = 0;
    if (resultData) {
      if (!this.isRehearse() && resultData.result && resultData.result.dt) {
        const daysSinceLastReview = this.sharedService.getDaysBetweenDates(new Date(resultData.result.dt), new Date()),
              days = Math.min(daysSinceLastReview, 365), // max a year
              multiplicator = this.getMultiplicator(resultData.exercise.tpe);
        agePoints = days > 2 ? Math.trunc(Math.log(days) * multiplicator) : 0;
      }
    }

    return agePoints;
  }

  private getMultiplicator(tpe: ExerciseType): number {
    // set multiplactor for age score depending on exercise type
    let multiplicator = 2;

    switch (tpe) {
      case ExerciseType.Word:
        multiplicator = 20;
      break;
      case ExerciseType.FillIn:
      case ExerciseType.QA:
      case ExerciseType.Comparison:
      case ExerciseType.Conjugations:
        multiplicator = 10;
      break;
    }

    return multiplicator;
  }

  private setTimeCutOffs(qType: QuestionType, data: ExerciseData): TimeCutoffs {
    // Cutoffs are in 1/10th of a second
    const cutOffs = {
      green: 70, // 7 secs
      orange: 60,
      red: 50,
      total: function(): number {
        return this.green + this.orange + this.red;
      }
    };
    let extra = 0,
        multiplier = 1;
    switch (qType) {
      case QuestionType.Choices:
        const nrOfChoices = this.currentChoices.length;
        extra = -Math.max(0, 8 - nrOfChoices) * 5;
        // Default
      break;
      case QuestionType.Word:
        extra = data.exercise.foreign.word.length * 5;
      break;
      case QuestionType.Select:
        const nrOfOptions = data.exercise.options.split('|').length;
        extra = -Math.max(0, 12 - nrOfOptions);
        extra += Math.trunc(data.exercise.options.length / 2);
      break;
      case QuestionType.FillIn:
        extra = data.exercise.foreign.word.length * 5;
      break;
      case QuestionType.Comparison:
      case QuestionType.Conjugations:
        extra = data.exercise.foreign.word.length;
        multiplier = 1.2;
      break;
    }
    cutOffs.green = (cutOffs.green + extra) * multiplier;
    cutOffs.orange = (cutOffs.orange + extra) * multiplier;
    cutOffs.red = (cutOffs.red + extra) * multiplier;
    return cutOffs;
  }

  private calculateGrade(question: QuestionType, delta: number, deduction = 0, solution = ''): number {
    let grade;
    switch (question) {
      case QuestionType.Choices:
      case QuestionType.Select:
        grade = this.calculateChoicesGrade(delta);
      break;
      case QuestionType.Word:
      case QuestionType.FillIn:
      case QuestionType.Comparison:
      case QuestionType.Conjugations:
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
      case QuestionType.Select:
        level = this.calculateChoicesLearnLevel(learnLevelData);
      break;
      case QuestionType.Word:
      case QuestionType.FillIn:
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
    if (learnLevelData.correct || learnLevelData.alt) {
      level += 5;
    } else {
      level -= learnLevelData.almostCorrect ? 2 : 3;
    }
    level = Math.max(level, 0);
    return level;
  }

  private calculateChoicesLearnLevel(learnLevelData: LearnLevelData): number {
    let level = learnLevelData.level;
    if (learnLevelData.correct) {
      // Make sure a word must always be typed in before it is set as learned
      level += level < 9 ? 3 : isLearnedLevel - level - 1;
    } else {
      level -= 1;
    }
    level = Math.max(level, 0);
    return level;
  }

  private addCount(isCorrect: boolean, exerciseUnid: string) {
    if (isCorrect) {
      this.addRightCount(exerciseUnid);
    } else {
      this.addWrongCount(exerciseUnid);
    }
  }

  protected addWrongCount(exerciseUnid: string) {
    const exercise = this.dataByExerciseUnid[exerciseUnid];
    exercise.countWrong = exercise.countWrong ? ++exercise.countWrong : 1;
  }

  protected addRightCount(exerciseUnid: string) {
    const exercise = this.dataByExerciseUnid[exerciseUnid];
    exercise.countRight = exercise.countRight ? ++exercise.countRight : 1;
  }

  protected soundLearnedLevel(learnLevel: number) {
    // Only in practise
  }

  protected setChoices() {
    // Select random words from choices array
    let choice: string,
        availableChoices: Choice[];
    const learnLevel = this.getCurrentLearnLevel(this.currentData),
          exercise = this.currentData.exercise,
          direction = this.currentData.data.direction,
          choices: string[] = [],
          nrOfChoices = this.getNrOfChoices(learnLevel),
          word = direction === Direction.ForeignToLocal ? exercise.local.word : exercise.foreign.word;

    availableChoices = this.choices.map(c => c);
    choices.push(word);
    while (choices.length < nrOfChoices && availableChoices) {
      choice = this.selectChoice(availableChoices, exercise, direction);
      if (!choices.find(choiceItem => choiceItem === choice)) {
        choices.push(choice);
      }
    }
    this.currentChoices = this.previewService.shuffle(
      choices.filter(choiceItem => !!choiceItem)
    );
  }

  private selectChoice(choices: Choice[], exercise: Exercise, direction: Direction): string {
    let selected: number,
        selectedChoice: string;
    // random, sorted by proximity foreign or sorted by proximity local
    switch (Math.floor(Math.random() * 3)) {
      case 0:
        // random
        selected = Math.floor(Math.random() * choices.length);
      break;
      case 1:
        // sorted by proximity foreign
        selected = this.getNearestChoice('foreign', choices, exercise.foreign.word);
      break;
      case 2:
        // sorted by proximity local
        selected = this.getNearestChoice('local', choices, exercise.local.word);
      break;
    }
    if (choices[selected]) {
      if (direction === Direction.ForeignToLocal) {
        selectedChoice = this.addArticle(choices[selected].local, choices[selected].localArticle);
      } else {
        selectedChoice = this.addArticle(choices[selected].foreign, choices[selected].foreignArticle);
      }
    }
    choices.splice(selected, 1);
    return selectedChoice;
  }

  private getNearestChoice(dir: string, choices: Choice[], word: string): number {
    let dl: number;
    let nearest: DlData;
    choices.forEach((choice, i) => {
      if (word !== choice[dir]) {
        dl = this.previewService.getDamerauLevenshteinDistance(word, choice[dir]);
        if (!nearest || dl < nearest.dl) {
          nearest = {index: i, dl};
        }
      }
    });
    if (nearest && nearest.dl > 9) { // no near match, select random anyway
      return Math.floor(Math.random() * choices.length);
    } else {
      if (nearest) {
        return nearest.index || 0;
      } else {
        return 0;
      }
    }
  }

  private addArticle(word: string, article: string): string {
    if (article && this.isAddArticle()) {
      return article + ' ' + word;
    } else {
      return word;
    }
  }

  protected determineQuestionType(exercise: ExerciseData, learnLevel: number): QuestionType {
    let qTpe = QuestionType.Choices;
    const tpe = exercise.exercise.tpe || ExerciseType.Word;
    switch (tpe) {
      case ExerciseType.Word:
        if (exercise.result) {
          // 6 -> 9: random
          if (learnLevel > 5 && learnLevel < 10) {
            qTpe =  Math.random() >= 0.5 ? QuestionType.Choices : QuestionType.Word;
          }
          // 10+ : always word
          if (learnLevel > 9) {
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

  protected getNrOfChoices(learnLevel?: number): number {
    return 8;
  }

  protected getCurrentLearnLevel(data: ExerciseData): number {
    let learnLevel = data && data.result ? data.result.learnLevel || 0 : 1; // saved data
    // CHECK if this exerciseid has been answered before; if so; use this level
    const lastLevel = this.dataByExerciseUnid[data.exercise._id + (data.exercise.lessonId || '')].levels;
    if (lastLevel !== null) {
      // Use level from this score
      learnLevel = lastLevel;
    }
    return learnLevel;
  }

  protected buildExerciseData(newExercises: Exercise[], results: ExerciseResult[], options: LessonOptions = null) {
    this.exerciseData = this.learnService.buildExerciseData(
      newExercises,
      results,
      this.text, {
        isBidirectional: true,
        direction: Direction.LocalToForeign
      },
      this.lesson ? this.lesson.options : options
    );
    this.exerciseData = this.previewService.shuffle(this.exerciseData);
    this.getChoices(this.course._id, true);
    this.setExerciseDataById();
  }

  protected setExerciseDataById() {
    this.exerciseData.forEach((exercise: ExerciseData) => {
      this.dataByExerciseUnid[exercise.exercise._id + (exercise.exercise.lessonId || '')] = {
        countRight: 0,
        countWrong: 0,
        levels: null
      };
    });
  }

  protected practiseDone(exercisesDone: ExerciseData[]) {
    this.isExercisesDone = true;
  }

  private getConfig(lanCode: string) {
    this.learnService
    .fetchLanConfig(lanCode)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      (config: LanConfig) => {
        if (config) {
          this.keys = config.keys;
          this.pronouns = config.subjectPronouns;
        }
      },
      error => this.errorService.handleError(error)
    );
  }

  private checkExercisesInterrupted() {
    this.exercisesInterrupted
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(event => {
      let nrDone = this.current;
      if (this.currentData.data.isDone) {
        nrDone++;
      }
      if (nrDone > 0) {
        // Show results page
        this.exerciseData = this.exerciseData.slice(0, nrDone);
        this.practiseDone(this.exerciseData);
        this.stepCompleted.emit(this.exerciseData);
      } else {
        // No words were done
        this.practiseDone(null);
        this.stepCompleted.emit(null);
      }
    });
  }

  private checkCountUpdated() {
    if (this.stepcountUpdated) {
      this.stepcountUpdated
    .pipe(takeWhile(() => this.componentActive))
      .subscribe( count => {
        if (count) {
          this.countPerStep = count;
        }
      });
    }
  }

  private isCaseSensitive(): boolean {
    let isCaseSensitive: boolean;
    if (this.currentStep === 'study' || this.currentStep === 'practise') {
      isCaseSensitive = this.lesson ? this.lesson.options.caseSensitive : false;
    } else {
      isCaseSensitive = this.course ? this.course.defaults.caseSensitive : false;
    }
    return isCaseSensitive;
  }

  private isAddArticle(): boolean {
    let isAddArticle: boolean;
    if (this.currentStep === 'study' || this.currentStep === 'practise') {
      isAddArticle = this.lesson ? this.lesson.options.addArticle : false;
    } else {
      isAddArticle = this.course ? this.course.defaults.addArticle : false;
    }
    return isAddArticle;
  }

  private isRehearse(): boolean {
    let isRehearse: boolean;
    if (this.currentStep === 'study' || this.currentStep === 'practise') {
      isRehearse = this.lesson && this.lesson.rehearseStep ? true : false;
    } else {
      isRehearse = false;
    }

    return isRehearse;
  }

  private log(message: string) {
    this.sharedService.sendEventMessage({
      message,
      source: 'Abstract class Step'
    });
  }
}
