import {Component, Input, ViewChild, Renderer2, ElementRef, AfterViewChecked} from '@angular/core';

@Component({
  selector: 'km-answer-field',
  templateUrl: 'answer-field.component.html',
  styles: [`
    :host {
      margin-top: 32px;
      display:block;
    }
    label {
      width: 4.6%;
      padding-left: 0;
      margin-top: 18px;
    }
    .input-lg {
      height: 56px;
      font-size: 40px;
    }
    .correct {
      background-color: green;
      color: white;
    }
    .incorrect {
      background-color: red;
      color: white;
      text-decoration: line-through;
    }
    `]
})

export class LearnAnswerFieldComponent implements AfterViewChecked {
  @Input() lan: string;
  @Input() disabled: boolean;
  @Input() isCorrect: boolean;
  @Input() keys: string[];
  @Input() showKeyboard = false;
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
