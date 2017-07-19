import {Component, Input, Output, OnInit, EventEmitter, OnDestroy} from '@angular/core';
import {LanPair} from '../../models/course.model';
import {Exercise, ExerciseData, ExerciseTpe, LearnSettings} from '../../models/exercise.model';
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
  private exerciseDataForeign: ExerciseData[];
  private isPractiseDone = false; // toggles with every replay
  private isWordsDone =  false; // true once words are done once
  private current = -1;
  private nrOfChoices = 6;
  private choices: string[];
  currentExercise: Exercise;
  currentDataForeign: ExerciseData;
  currentChoices: string[] = [];
  isDone: boolean[] = [];
  wordLocal: string;
  wordForeign: string;
  isSelected = false;
  isCorrect = false;
  answered: number;
  answer: number;

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
    if (this.options.bidirectional) {
      this.exerciseDataForeign = this.learnService.buildExerciseDataForeign(this.currentExercises, this.text);
    }
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

  isCurrent(i: number): boolean {
    return this.current === i;
  }

  isWordDone(i: number): boolean {
    return this.isDone[i];
  }

  private getChoices() {
    this.learnService
    .fetchChoices(this.lessonId)
    .takeWhile(() => this.componentActive)
    .subscribe(
      choices => {
        console.log('choices', choices);
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
    if (this.current > -1) {
      this.isDone[this.current] = true;
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
      if (this.exerciseDataForeign) {
        this.currentDataForeign = this.exerciseDataForeign[this.current];
      }
      this.wordLocal = this.currentExercise.local.word;
      this.wordForeign = this.currentExercise.foreign.word;
      this.setChoices(this.currentExercise.foreign.word);
    }
  }

  private setChoices(word: string) {
    // Select random words from choices array
    let choice: string;
    let rand: number;
    const choices: string[] = [];
    choices.push(word);
    while (choices.length < this.nrOfChoices && this.choices) {
      rand = Math.floor(Math.random() * this.choices.length);
      choice = this.choices[rand];
      this.choices.splice(rand, 1);
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
    if (choice === this.wordForeign) {
      this.isCorrect = true;
    } else {
      this.isCorrect = false;
      this.currentChoices.forEach( (item, j) => {
        if (item === this.wordForeign) {
          this.answer = j;
        }
      });
    }
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
