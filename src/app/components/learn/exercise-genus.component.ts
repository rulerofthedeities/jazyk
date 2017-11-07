import {Component, Input, Output, OnInit, AfterViewChecked, EventEmitter, ViewChild, ElementRef} from '@angular/core';
import {ExerciseData, Exercise, ExerciseType} from '../../models/exercise.model';

interface Keyboard {
  showKeyboard: boolean;
  keys: string[];
}

@Component({
  selector: 'km-genus',
  templateUrl: 'exercise-genus.component.html',
  styleUrls: ['field.css', 'exercise-genus.component.css']
})

export class LearnGenusComponent implements OnInit, AfterViewChecked {
  @Input() lanPair: string;
  @Input() text: Object;
  @Input() data: ExerciseData;
  @Input() keyboard: Keyboard;
  @Output() answered = new EventEmitter<boolean>();
  @ViewChild('answer') answer: ElementRef;
  questionData: ExerciseData;
  genera: string[];
  correctAnswer: string;
  instruction: string;
  isAnswered = false;

  ngOnInit() {
    console.log('init Genus', this.data);
    const exercise = this.data.exercise;
    this.instruction = this.text['instructionGenus'];
    this.getGenusData(exercise);
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

  private getGenusData(exercise: Exercise) {
    // get answer without []
    /*
    this.sentence = exercise.foreign.word.replace(/\[.*\]/, '|').split('|');
    console.log(this.sentence);
    this.sentence = this.sentence.map(section => section.trim());
    console.log(this.sentence);
    */
    this.questionData = JSON.parse(JSON.stringify(this.data));
    this.genera = this.data.exercise.options.split('|');
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
