import {Component, Input, Output, OnInit, EventEmitter} from '@angular/core';
import {LanPair} from '../../models/course.model';
import {Exercise, ExerciseData, LearnSettings} from '../../models/exercise.model';
import {LearnService} from '../../services/learn.service';

@Component({
  selector: 'km-learn-practise',
  templateUrl: 'learn-practise.component.html',
  styleUrls: ['learn-item.component.css', 'learn-practise.component.css']
})

export class LearnPractiseComponent implements OnInit {
  @Input() exercises: Exercise[];
  @Input() lanPair: LanPair;
  @Input() text: Object;
  @Input() settings: LearnSettings;
  @Output() stepCompleted = new EventEmitter<number>();
  private lanLocal: string;
  private lanForeign: string;
  private currentExercises: Exercise[];
  private exerciseData: ExerciseData[];
  private isPractiseDone = false; // toggles with every replay
  private isWordsDone =  false; // true once words are done once
  private current = -1;
  currentExercise: Exercise;
  currentData: ExerciseData;
  isDone: boolean[] = [];
  wordLocal: string;
  wordForeign: string;

  constructor(
    private learnService: LearnService
  ) {}

  ngOnInit() {
    this.lanLocal = this.lanPair.from.slice(0, 2);
    this.lanForeign = this.lanPair.to.slice(0, 2);
    this.currentExercises = this.learnService.shuffle(this.exercises);
    this.exerciseData = this.learnService.buildExerciseData(this.currentExercises, this.text);
    this.nextWord(1);
  }

  isCurrent(i: number): boolean {
    return this.current === i;
  }

  isWordDone(i: number): boolean {
    return this.isDone[i];
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
        this.stepCompleted.emit(1);
      }
    } else {
      if (this.current <= -1) {
        this.current = this.currentExercises.length - 1;
      }
    }
    if (!this.isPractiseDone) {
      this.currentExercise = this.currentExercises[this.current];
      this.currentData = this.exerciseData[this.current];
      this.wordLocal = this.currentExercise.local.word;
      this.wordForeign = this.currentExercise.foreign.word;
    }
  }
}
