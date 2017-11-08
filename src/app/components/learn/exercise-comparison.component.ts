import {Component, Input, Output, OnInit, EventEmitter, ViewChild, ElementRef} from '@angular/core';
import {ExerciseData, Exercise, ExerciseType} from '../../models/exercise.model';

interface Keyboard {
  showKeyboard: boolean;
  keys: string[];
}

interface Answer {
  comparative: string;
  superlative: string;
}

@Component({
  selector: 'km-comparison',
  templateUrl: 'exercise-comparison.component.html',
  styleUrls: ['field.css', 'exercise-comparison.component.css']
})

export class LearnComparisonComponent implements OnInit {
  @Input() lanPair: string;
  @Input() text: Object;
  @Input() data: ExerciseData;
  @Input() keyboard: Keyboard;
  @Output() answered = new EventEmitter<boolean>();
  @ViewChild('answerComparative') answerComparative: ElementRef;
  @ViewChild('answerSuperlative') answerSuperlative: ElementRef;
  questionData: ExerciseData;
  correctAnswer: Answer;
  instruction: string;
  currentField = 'comparative';
  isAnswered = false;
  isComparativeCorrect = false;
  isSuperlativeCorrect = false;

  ngOnInit() {
    console.log('init Comparison', this.data);
    const exercise = this.data.exercise;
    this.instruction = this.text['instructionComparison'];
    this.getComparisonData(exercise);
  }

  onFocus(field: string) {
    this.currentField = field;
    console.log('Current field', field);
  }

  onKeySelected(key: string) {
    if (this.currentField === 'superlative') {
      this.answerSuperlative.nativeElement.value += key;
    } else {
      this.answerComparative.nativeElement.value += key;
    }
  }

  getData(): string {
    // return this.answer.nativeElement.value;
    return this.answerComparative.nativeElement.value + '|' + this.answerSuperlative.nativeElement.value;
  }

  getCorrect(): string {
    this.isAnswered = true;
    if (this.answerComparative.nativeElement.value === this.correctAnswer.comparative) {
      this.isComparativeCorrect = true;
    }
    if (this.answerSuperlative.nativeElement.value === this.correctAnswer.superlative) {
      this.isSuperlativeCorrect = true;
    }
    return this.correctAnswer.comparative + '|'  + this.correctAnswer.superlative;
  }

  clearData() {
    this.answerComparative.nativeElement.value = '';
    this.answerSuperlative.nativeElement.value = '';
    this.isAnswered = false;
    this.isComparativeCorrect = false;
    this.isSuperlativeCorrect = false;
  }

  private getComparisonData(exercise: Exercise) {
    this.questionData = JSON.parse(JSON.stringify(this.data));
    const comparisonSteps = exercise.foreign.word.split('|');
    comparisonSteps.map( step => step.split(';')[0]);
    this.questionData.exercise.foreign.word = comparisonSteps[0];
    this.correctAnswer = {
      comparative: comparisonSteps[1],
      superlative: comparisonSteps[2]
    };
    console.log('correct answer: ', this.correctAnswer);
  }
}
