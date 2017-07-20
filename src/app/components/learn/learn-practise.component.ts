import {Component, Input, Output, OnInit, EventEmitter, OnDestroy} from '@angular/core';
import {LanPair} from '../../models/course.model';
import {Exercise, ExerciseData, ExerciseOptions, ExerciseTpe, LearnSettings} from '../../models/exercise.model';
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
  private currentExercises: Exercise[];
  private isPractiseDone = false; // toggles with every replay
  private isWordsDone =  false; // true once words are done once
  private current = -1;
  private nrOfChoices = 6;
  private minNrOfChoices = 4;
  private choices: string[];
  exerciseData: ExerciseData[];
  currentExercise: Exercise;
  currentData: ExerciseData;
  currentChoices: string[] = [];
  isSelected = false;
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
    if (!this.options.ordered) {
      this.currentExercises = this.learnService.shuffle(this.exercises);
    } else {
      this.currentExercises = this.exercises;
    }
    this.exerciseData = this.learnService.buildExerciseData(this.currentExercises, this.text, {
      nrOfChoices: this.nrOfChoices,
      isForeign: this.options.bidirectional
    });
    this.getChoices();
  }

  onSettingsUpdated(settings: LearnSettings) {
    console.log('settings updated', settings);
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
    return this.exerciseData[i].isDone;
  }

  isWordCorrect(i: number): boolean {
    let isCorrect: boolean;
    let exercise: ExerciseData;
    if (i >= 0) {
      exercise = this.exerciseData[i];
    } else {
      exercise = this.exerciseData[this.current];
    }
    isCorrect = exercise.isCorrect;
    return isCorrect;
  }

  private getChoices() {
    this.learnService
    .fetchChoices(this.lessonId)
    .takeWhile(() => this.componentActive)
    .subscribe(
      choices => {
        this.choices = choices;
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
    if (this.current > -1) {
      this.exerciseData[this.current].isDone = true;
    }
    this.current += delta;
    if (delta > 0) {
      if (this.current >= this.currentExercises.length) {
        this.isPractiseDone = true;
        this.isWordsDone = true;
        this.stepCompleted.emit();
      }
    } else {
      if (this.current <= -1) {
        this.current = this.currentExercises.length - 1;
      }
    }
    if (!this.isPractiseDone) {
      this.currentExercise = this.currentExercises[this.current];
      this.exerciseData[this.current].wordForeign = this.currentExercise.foreign.word;
      this.exerciseData[this.current].wordLocal = this.currentExercise.local.word;
      this.currentData = this.exerciseData[this.current];
      this.setChoices(this.currentData.wordForeign);
    }
  }

  private clearData() {
    this.isSelected = false;
    this.answered = null;
    this.answer = null;
  }

  private setChoices(word: string) {
    // Select random words from choices array
    let choice: string;
    let rand: number;
    const choices: string[] = [];
    const nrOfChoices = this.currentData.nrOfChoices;
    const availableChoices = JSON.parse(JSON.stringify(this.choices));
    console.log('choices', this.choices);
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
    console.log('selected choices', this.currentChoices);
  }

  private checkAnswer(choice: string, i: number) {
    this.isSelected = true;
    this.answered = i;
    this.answer = null;
    if (choice === this.currentData.wordForeign) {
      this.exerciseData[this.current].isCorrect = true;
    } else {
      this.exerciseData[this.current].isCorrect = false;
      // Show correct answer
      this.currentChoices.forEach( (item, j) => {
        if (item === this.currentData.wordForeign) {
          this.answer = j;
        }
      });
      this.addExercise();
    }
  }

  private addExercise() {
    // Incorrect answer -> readd exercise to the back
    console.log('incorrect', this.exercises, this.exerciseData);
    this.exercises.push(this.exercises[this.current]);
    const newExerciseData = JSON.parse(JSON.stringify(this.exerciseData[this.current]));
    newExerciseData.isCorrect = false;
    newExerciseData.isDone = false;
    newExerciseData.nrOfChoices = Math.max(newExerciseData.nrOfChoices - 2, this.minNrOfChoices);
    newExerciseData.answered = newExerciseData.answered + 1;
    this.exerciseData.push(newExerciseData);
    console.log('incorrect2', this.exercises, this.exerciseData);
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
