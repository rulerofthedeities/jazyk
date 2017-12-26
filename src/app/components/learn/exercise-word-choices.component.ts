import {Component, Input, Output, OnChanges, EventEmitter} from '@angular/core';
import {LearnService} from '../../services/learn.service';
import {ExerciseData, ExerciseWord, Direction} from '../../models/exercise.model';
import {LanPair} from '../../models/course.model';


@Component({
  selector: 'km-word-choices',
  templateUrl: 'exercise-word-choices.component.html',
  styleUrls: ['exercise-word-choices.component.css']
})

export class LearnWordChoicesComponent implements OnChanges {
  @Input() lanPair: LanPair;
  @Input() choices: string[];
  @Input() data: ExerciseData;
  @Input() instruction: string;
  @Input() answer: number;
  @Input() answered: number;
  @Input() isSelected: boolean;
  @Output() selected = new EventEmitter<number>();
  correct: boolean;
  lan: string;
  flagWord: ExerciseWord;

  constructor(
    protected learnService: LearnService
  ) {}

  ngOnChanges() {
    this.correct = this.data.data.isCorrect;
    this.lan = this.data.data.direction === Direction.LocalToForeign ? this.lanPair.to : this.lanPair.from;
    this.flagWord = this.data.data.direction === Direction.LocalToForeign ? this.data.exercise.foreign : this.data.exercise.local;
  }

  onSelected(i: number) {
    if (!this.isSelected) {
      this.selected.emit(i);
    }
  }

  filter(choice: string): string {
    return this.learnService.filterPrefix(choice);
  }
}
