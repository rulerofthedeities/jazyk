import {Component, Input, ViewChild, Renderer2, ElementRef, AfterViewChecked} from '@angular/core';

@Component({
  selector: 'km-answer-test',
  template: `
    <div class="form-group">
      <label 
        for="answer" 
        class="control-label col-xs-1">
        <img src="/assets/img/flags/{{lan}}.png" class="flag">
      </label>
      <div class="col-xs-11">
        <input 
          class="form-control input-lg" 
          id="answer"
          maxlength="100"
          autofocus
          autocomplete="off"
          [attr.disabled]="disabled ? '': null"
          [ngClass]="{correct: disabled && isCorrect, incorrect: disabled && !isCorrect}"
          #answer>
      </div>
    </div>
    <div class="clearfix"></div>
    `,
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

export class LearnAnswerTestComponent implements AfterViewChecked {
  @Input() lan: string;
  @Input() disabled: boolean;
  @Input() isCorrect: boolean;
  @ViewChild('answer') answer: ElementRef;

  constructor(
    public renderer: Renderer2
  ) {}

  ngAfterViewChecked() {
    this.answer.nativeElement.focus();
  }

  getData(): string {
    return this.answer.nativeElement.value;
  }

  clearData() {
    this.answer.nativeElement.value = '';
  }
}
