import {Component, Input, Output, OnInit, AfterViewChecked, EventEmitter, ViewChild, ElementRef} from '@angular/core';
import {ExerciseData, Exercise} from '../../models/exercise.model';
import {LearnService} from '../../services/learn.service';

interface Keyboard {
  showKeyboard: boolean;
  keys: string[];
}

@Component({
  selector: 'km-qa',
  templateUrl: 'qa.component.html',
  styleUrls: ['qa.component.css', 'field.css']
})

export class LearnQAComponent implements OnInit, AfterViewChecked {
  @Input() lanPair: string;
  @Input() msg: string;
  @Input() data: ExerciseData;
  @Input() keyboard: Keyboard;
  @Input() instruction: string;
  @Output() answered = new EventEmitter<boolean>();
  @ViewChild('answer') answer: ElementRef;
  sentence: string[]; // answer without []
  question: string;
  correctAnswer: string;
  isAnswered = false;

  constructor(
    private learnService: LearnService
  ) {}

  ngOnInit() {
    const exercise = this.data.exercise;
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
