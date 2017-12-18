import {Component, Input, Output, OnInit, OnChanges, EventEmitter, ViewChild, ElementRef} from '@angular/core';
import {LanPair} from '../../models/course.model';
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

export class LearnComparisonComponent implements OnInit, OnChanges {
  @Input() lanPair: LanPair;
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
  currentExerciseId: string;

  ngOnInit() {
    this.instruction = this.text['instructionComparison'];
  }

  ngOnChanges() {
    if (this.currentExerciseId !== this.data.exercise._id) {
      this.currentExerciseId = this.data.exercise._id;
      const exercise = this.data.exercise;
      this.getComparisonData(this.data.exercise);
    }
  }

  onFocus(field: string) {
    this.currentField = field;
  }

  onKeySelected(key: string) {
    if (this.currentField === 'superlative') {
      this.answerSuperlative.nativeElement.value += key;
    } else {
      this.answerComparative.nativeElement.value += key;
    }
  }

  getData(): string {
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
  }
}
