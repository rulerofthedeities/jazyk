import {Component, Input, Output, EventEmitter} from '@angular/core';
import {LearnService} from '../../services/learn.service';

@Component({
  selector: 'km-word-choices',
  templateUrl: 'exercise-word-choices.component.html',
  styleUrls: ['exercise-word-choices.component.css']
})

export class LearnWordChoicesComponent {
  @Input() choices: string[];
  @Input() instruction: string;
  @Input() correct: boolean;
  @Input() answer: number;
  @Input() answered: number;
  @Input() isSelected: boolean;
  @Output() selected = new EventEmitter<number>();

  constructor(
    protected learnService: LearnService
  ) {}

  onSelected(i: number) {
    if (!this.isSelected) {
      this.selected.emit(i);
    }
  }

  filter(choice: string): string {
    return this.learnService.filterPrefix(choice);
  }
}
