import {Component, EventEmitter, OnInit, OnDestroy, Input, Output, ViewChild} from '@angular/core';
import {LearnService} from '../../services/learn.service';
import {LanPair} from '../../models/course.model';
import {Exercise, ExerciseData, ExerciseTpe, Direction, LearnSettings} from '../../models/exercise.model';
import {LearnAnswerTestComponent} from './learn-answer-test.component';
import {TimerObservable} from 'rxjs/observable/TimerObservable';
import {Subscription} from 'rxjs/Subscription';

@Component({
  selector: 'km-learn-test',
  templateUrl: 'learn-test.component.html',
  styleUrls: ['learn-item.component.css']
})

export class LearnTestComponent implements OnInit, OnDestroy {
  @Input() exercises: Exercise[];
  @Input() lanPair: LanPair[];
  @Input() options: ExerciseTpe;
  @Input() text: Object;
  @Input() settings: LearnSettings;
  @Output() stepCompleted = new EventEmitter();
  @Output() updatedSettings = new EventEmitter<LearnSettings>();
  @ViewChild(LearnAnswerTestComponent) answerComponent: LearnAnswerTestComponent;
  private componentActive = true;
  subscription: Subscription;
  isTestDone = false;
  isAnswered = false;
  exerciseData: ExerciseData[];
  currentData: ExerciseData;
  current = -1;
  isQuestionReady = false;
  isCorrect = false;
  solution: string;
  score = 0;

  constructor(
    private learnService: LearnService
  ) {}

  ngOnInit() {
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

  onCheckAnswer() {
    if (!this.isAnswered) {
      if (this.answerComponent) {
        this.checkAnswer(this.answerComponent.getData());
      }
    } else if (!this.isCorrect) {
      this.nextWord();
    }
  }

  onSettingsUpdated(settings: LearnSettings) {
    this.settings = settings;
    this.updatedSettings.emit(settings);
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
      this.stepCompleted.emit();
    }
    if (!this.isTestDone) {
      this.currentData = this.exerciseData[this.current];
    }
  }

  private filter(word: string): string {
    let filteredAnswer = word.trim().toLowerCase();

    // replace all multiple spaces with one space
    filteredAnswer = filteredAnswer.replace(/ +(?= )/g, '');
    // remove .,?;:
    filteredAnswer = filteredAnswer.replace(/[\.,\?;:!]/g, '');


    console.log('filtered answer', word, '->' , '>' + filteredAnswer + '<');
    return filteredAnswer;
  }

  private checkAnswer(answer: string) {
    const filteredAnswer = this.filter(answer);
    console.log(this.currentData.exercise.foreign.word);
    if (filteredAnswer) {
      this.isAnswered = true;
      this.currentData.data.isDone = true;
      const solution = this.currentData.exercise.foreign.word;
      const filteredSolution = this.filter(solution);
      console.log('answer', filteredAnswer, filteredSolution);
      if (filteredAnswer === filteredSolution) {
        this.isCorrect = true;
        this.currentData.data.isCorrect = true;
        this.score = this.score + 100;
        this.timeNext(1);
      } else {
        this.currentData.data.isCorrect = false;
        this.isCorrect = false;
        this.solution = solution;
      }
    }
  }

  private timeNext(secs: number) {
    // Timer to show the next word
    const timer = TimerObservable.create(secs * 1000);
    this.subscription = timer
    .takeWhile(() => this.componentActive)
    .subscribe(t => this.nextWord());
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
