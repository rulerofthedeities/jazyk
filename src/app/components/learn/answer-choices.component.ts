import {Component, Input, Output, EventEmitter} from '@angular/core';

@Component({
  selector: 'km-answer-choices',
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
      <span class="nr">{{i+1}}.</span> <span>{{choice}}</span>
    </div>`,
    styleUrls: ['answer-choices.component.css']
})

export class LearnAnswerChoicesComponent {
  @Input() choices: string[];
  @Input() correct: boolean;
  @Input() answer: number;
  @Input() answered: number;
  @Input() isSelected: boolean;
  @Output() selected = new EventEmitter<number>();

  onSelected(i: number) {
    if (!this.isSelected) {
      this.selected.emit(i);
    }
  }
}