import {Component, Input, ViewChild, Renderer2, ElementRef, OnInit, AfterViewChecked} from '@angular/core';
import {ExerciseData, ExerciseExtraData} from '../../models/exercise.model';

interface Keyboard {
  showKeyboard: boolean;
  keys: string[];
}

interface Solution {
  solution: string;
  msg: string;
}

@Component({
  selector: 'km-word-field',
  templateUrl: 'exercise-word-field.component.html',
  styleUrls: ['field.css', 'exercise-word-field.component.css']
})

export class LearnWordFieldComponent implements OnInit, AfterViewChecked {
  @Input() lan: string;
  @Input() prefix: string;
  @Input() disabled: boolean;
  @Input() data: ExerciseData;
  @Input() keyboard: Keyboard;
  @Input() solution: Solution;
  @Input() instruction: string;
  @ViewChild('answer') answer: ElementRef;
  exData: ExerciseExtraData;

  constructor(
    public renderer: Renderer2
  ) {}

  ngOnInit() {
    this.exData = this.data.data;
  }

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
