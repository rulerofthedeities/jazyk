import {Component, Input, Output, OnInit, AfterViewChecked, EventEmitter, ViewChild, ElementRef} from '@angular/core';
import {ExerciseData, Exercise, ExerciseType} from '../../models/exercise.model';

interface Keyboard {
  showKeyboard: boolean;
  keys: string[];
}

@Component({
  selector: 'km-comparison',
  templateUrl: 'exercise-comparison.component.html',
  styleUrls: ['field.css', 'exercise-comparison.component.css']
})

export class LearnComparisonComponent implements OnInit, AfterViewChecked {
  @Input() lanPair: string;
  @Input() text: Object;
  @Input() data: ExerciseData;
  @Input() keyboard: Keyboard;
  @Output() answered = new EventEmitter<boolean>();
  @ViewChild('answer1') answer1: ElementRef;
  questionData: ExerciseData;
  comparisonSteps: string[];
  correctAnswer: string;
  instruction: string;
  isAnswered = false;

  ngOnInit() {
    console.log('init Comparison', this.data);
    const exercise = this.data.exercise;
    this.instruction = this.text['instructionComparison'];
    this.getComparisonData(exercise);
  }

  ngAfterViewChecked() {
    // this.answer.nativeElement.focus();
  }

  onKeySelected(key: string) {
    // this.answer.nativeElement.value += key;
  }

  getData(): string {
    // return this.answer.nativeElement.value;
    return '';
  }

  getCorrect(): string {
    this.isAnswered = true;
    return this.correctAnswer;
  }

  clearData() {
    // this.answer.nativeElement.value = '';
    this.isAnswered = false;
  }

  private getComparisonData(exercise: Exercise) {
    // get answer without []
    /*
    this.sentence = exercise.foreign.word.replace(/\[.*\]/, '|').split('|');
    console.log(this.sentence);
    this.sentence = this.sentence.map(section => section.trim());
    console.log(this.sentence);
    */
    this.questionData = JSON.parse(JSON.stringify(this.data));
    this.comparisonSteps = exercise.foreign.word.split('|');
    this.comparisonSteps.map( step => step.split(';')[0]);
    this.questionData.exercise.foreign.word = this.comparisonSteps[0];
    // this.correctAnswer = this.getCorrectAnswer(exercise.foreign.word);
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
