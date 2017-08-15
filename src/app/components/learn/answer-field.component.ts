import {Component, Input, ViewChild, Renderer2, ElementRef, AfterViewChecked} from '@angular/core';
import {ExerciseExtraData} from '../../models/exercise.model';

interface Keyboard {
  showKeyboard: boolean;
  keys: string[];
}

interface Solution {
  solution: string;
  msg: string;
}

@Component({
  selector: 'km-answer-field',
  templateUrl: 'answer-field.component.html',
  styleUrls: ['answer-field.component.css']
})

export class LearnAnswerFieldComponent implements AfterViewChecked {
  @Input() lan: string;
  @Input() disabled: boolean;
  @Input() data: ExerciseExtraData;
  @Input() keyboard: Keyboard;
  @Input() solution: Solution;
  @ViewChild('answer') answer: ElementRef;

  constructor(
    public renderer: Renderer2
  ) {}

  ngAfterViewChecked() {
    this.answer.nativeElement.focus();
  }

  onKeySelected(key: string) {
    this.answer.nativeElement.value += key;
  }

  getData(): string {
    return this.answer.nativeElement.value;
  }

  clearData() {
    this.answer.nativeElement.value = '';
  }
}