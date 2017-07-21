import {Component, Input, Output, OnInit, EventEmitter, OnDestroy} from '@angular/core';
import {LanPair} from '../../models/course.model';
import {Exercise, ExerciseData, ExerciseOptions, ExerciseTpe, Direction, LearnSettings} from '../../models/exercise.model';
import {LearnService} from '../../services/learn.service';
import {ErrorService} from '../../services/error.service';
import 'rxjs/add/operator/takeWhile';

@Component({
  selector: 'km-learn-practise',
  templateUrl: 'learn-practise.component.html',
  styleUrls: ['learn-item.component.css', 'learn-practise.component.css']
})

export class LearnPractiseComponent implements OnInit, OnDestroy {
  @Input() exercises: Exercise[];
  @Input() lanPair: LanPair;
  @Input() text: Object;
  @Input() options: ExerciseTpe;
  @Input() lessonId: string;
  @Input() settings: LearnSettings;
  @Output() stepCompleted = new EventEmitter();
  @Output() updatedSettings = new EventEmitter<LearnSettings>();
  private componentActive = true;
  private lanLocal: string;
  private lanForeign: string;
  private isWordsDone =  false; // true once words are done once
  private current = -1;
  private nrOfChoices = 6;
  private minNrOfChoices = 4;
  private choicesForeign: string[];
  private choicesLocal: string[];
  isPractiseDone = false; // toggles with every replay
  exerciseData: ExerciseData[];
  currentData: ExerciseData;
  currentChoices: string[] = [];
  isSelected = false;
  isQuestionReady = false;
  answered: number;
  answer: number;
  score = 0;

  constructor(
    private learnService: LearnService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.lanLocal = this.lanPair.from.slice(0, 2);
    this.lanForeign = this.lanPair.to.slice(0, 2);
    this.exerciseData = this.learnService.buildExerciseData(this.exercises, this.text, {
      nrOfChoices: this.nrOfChoices,
      isBidirectional: this.options.bidirectional,
      direction: Direction.LocalToForeign
    });
    if (!this.options.ordered) {
      this.exerciseData = this.learnService.shuffle(this.exerciseData);
    }
    // this.exerciseData = this.exerciseData.slice(0, 4);
    this.isQuestionReady = true;
    this.getChoices(this.options.bidirectional);
  }

  onSettingsUpdated(settings: LearnSettings) {
    this.settings = settings;
    this.updatedSettings.emit(settings);
  }

  onSelected(choice: string, i: number) {
    if (!this.isSelected) {
      this.checkAnswer(choice, i);
    }
  }

  onNextWord() {
    this.showNextWord(1);
  }

  isCurrent(i: number): boolean {
    return this.current === i;
  }

  isWordDone(i: number): boolean {
    return this.exerciseData[i].data.isDone;
  }

  isWordCorrect(i: number): boolean {
    let isCorrect: boolean;
    let data: ExerciseData;
    if (i >= 0) {
      data = this.exerciseData[i];
    } else {
      data = this.exerciseData[this.current];
    }
    isCorrect = data.data.isCorrect;
    return isCorrect;
  }

  getQuestionType(): string {
    let tpe = 'local';
    if (this.currentData && this.currentData.data.direction === Direction.ForeignToLocal) {
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
        this.nextWord(1);
      },
      error => this.errorService.handleError(error)
    );
  }

  private nextWord(delta: number) {
    if (this.isPractiseDone) {
      // this.restart();
    } else {
      this.showNextWord(delta);
    }
  }

  private showNextWord(delta: number) {
    this.clearData();
    this.current += delta;
    if (delta > 0) {
      if (this.current >= this.exerciseData.length) {
        this.isPractiseDone = true;
        this.isWordsDone = true;
        this.stepCompleted.emit();
      }
    } else {
      if (this.current <= -1) {
        this.current = this.exerciseData.length - 1;
      }
    }
    if (!this.isPractiseDone) {
      this.currentData = this.exerciseData[this.current];
      this.setChoices();
    }
  }

  private clearData() {
    this.isSelected = false;
    this.answered = null;
    this.answer = null;
  }

  private setChoices() {
    // Select random words from choices array
    let choice: string;
    let rand: number;
    const exercise = this.currentData.exercise;
    const direction = this.currentData.data.direction;
    const choices: string[] = [];
    const nrOfChoices = this.currentData.data.nrOfChoices;
    const availableChoices = JSON.parse(JSON.stringify(direction === Direction.ForeignToLocal ? this.choicesLocal : this.choicesForeign));
    const word = direction === Direction.ForeignToLocal ? exercise.local.word : exercise.foreign.word;
    choices.push(word);
    while (choices.length < nrOfChoices && availableChoices) {
      rand = Math.floor(Math.random() * availableChoices.length);
      choice = availableChoices[rand];
      availableChoices.splice(rand, 1);
      if (choice !== word) {
        choices.push(choice);
      }
    }
    this.currentChoices = this.learnService.shuffle(choices);
  }

  private checkAnswer(choice: string, i: number) {
    this.isSelected = true;
    this.answered = i;
    this.answer = null;
    const direction = this.currentData.data.direction;
    const word = direction === Direction.ForeignToLocal ? this.currentData.exercise.local.word : this.currentData.exercise.foreign.word;

    this.currentData.data.isDone = true;
    if (choice === word) {
      this.currentData.data.isCorrect = true;
    } else {
      this.currentData.data.isCorrect = false;
      // Show correct answer
      this.currentChoices.forEach( (item, j) => {
        if (item === word) {
          this.answer = j;
        }
      });
      this.addExercise();
    }
  }

  private addExercise() {
    // Incorrect answer -> readd exercise to the back
    const newExerciseData: ExerciseData = {
      data: JSON.parse(JSON.stringify(this.exerciseData[this.current].data)),
      exercise: this.exerciseData[this.current].exercise
    };
    newExerciseData.data.isCorrect = false;
    newExerciseData.data.isDone = false;
    newExerciseData.data.nrOfChoices = Math.max(newExerciseData.data.nrOfChoices - 2, this.minNrOfChoices);
    newExerciseData.data.answered = newExerciseData.data.answered + 1;
    this.exerciseData.push(newExerciseData);
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
