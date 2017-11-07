import {Component, Input, Output, OnInit, AfterViewChecked, EventEmitter, ViewChild, ElementRef} from '@angular/core';
import {ExerciseData, Exercise, ExerciseType} from '../../models/exercise.model';

interface Keyboard {
  showKeyboard: boolean;
  keys: string[];
}

@Component({
  selector: 'km-qa',
  templateUrl: 'exercise-qa.component.html',
  styleUrls: ['field.css', 'exercise-qa.component.css']
})

export class LearnQAComponent implements OnInit, AfterViewChecked {
  @Input() lanPair: string;
  @Input() text: Object;
  @Input() data: ExerciseData;
  @Input() keyboard: Keyboard;
  @Output() answered = new EventEmitter<boolean>();
  @ViewChild('answer') answer: ElementRef;
  sentence: string[]; // answer without []
  question: string;
  correctAnswer: string;
  instruction: string;
  isAnswered = false;
  exType = ExerciseType;

  ngOnInit() {
    console.log('init QA', this.data);
    const exercise = this.data.exercise;
    this.instruction = exercise.tpe = ExerciseType.QA ? this.text['instructionQA'] : this.text['instructionFillIn'];
    this.getQAData(exercise);
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

  getCorrect(): string {
    this.isAnswered = true;
    return this.correctAnswer;
  }

  clearData() {
    this.answer.nativeElement.value = '';
    this.isAnswered = false;
  }

  private getQAData(exercise: Exercise) {
    // get answer without []
    this.sentence = exercise.foreign.word.replace(/\[.*\]/, '|').split('|');
    console.log(this.sentence);
    this.sentence = this.sentence.map(section => section.trim());
    console.log(this.sentence);
    this.question = exercise.foreign.hint;
    this.correctAnswer = this.getCorrectAnswer(exercise.foreign.word);
  }

  private getCorrectAnswer(answer: string): string {
    let correctAnswer = '';
    const matches = answer.match(/\[(.*?)\]/);
    if (matches && matches.length > 1) {
      correctAnswer = matches[1];
    }
    return correctAnswer;
  }
}
