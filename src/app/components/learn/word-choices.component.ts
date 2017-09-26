import {Component, Input, Output, EventEmitter} from '@angular/core';
import {LearnService} from '../../services/learn.service';

@Component({
  selector: 'km-word-choices',
  template: `
    <div 
      *ngFor="let choice of choices; let i=index" 
      class="btn btn-default btn-lg choice"
      [ngClass]="{
        'done':isSelected, 
        'ok':correct && i===answered, 
        'nok':!correct && i===answered,
        'correction':!correct && i===answer}"
      (click)="onSelected(i)">
      <span class="nr">{{i+1}}.</span> <span>{{filter(choice)}}</span>
    </div>`,
    styleUrls: ['word-choices.component.css']
})

export class LearnWordChoicesComponent {
  @Input() choices: string[];
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
