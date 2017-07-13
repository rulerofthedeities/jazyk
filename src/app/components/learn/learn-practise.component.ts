import {Component, Input, OnInit} from '@angular/core';
import {LanPair} from '../../models/course.model';
import {Exercise, ExerciseData} from '../../models/exercise.model';
import {LearnService} from '../../services/learn.service';

@Component({
  selector: 'km-learn-practise',
  template: `
    PRACTISE

    <pre>{{exercises|json}}</pre>
  `
})

export class LearnPractiseComponent implements OnInit {
  @Input() exercises: Exercise[];
  @Input() lanPair: LanPair;
  @Input() text: Object;
  private lanLocal: string;
  private lanForeign: string;
  private currentExercises: Exercise[];
  private exerciseData: ExerciseData[];
  private isLearningDone = false; // toggles with every replay

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

  private nextWord(delta: number) {
    if (this.isLearningDone) {
      // this.restart();
    } else {
      // this.showNextWord(delta);
    }
  }
}
