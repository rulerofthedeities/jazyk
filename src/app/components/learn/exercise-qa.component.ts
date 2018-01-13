import {Component, Input, Output, OnChanges, AfterViewChecked, EventEmitter, ViewChild, ElementRef} from '@angular/core';
import {LanPair} from '../../models/course.model';
import {ExerciseData, Exercise, ExerciseType} from '../../models/exercise.model';
import {UtilsService} from '../../services/utils.service';

interface Keyboard {
  showKeyboard: boolean;
  keys: string[];
}

@Component({
  selector: 'km-qa',
  templateUrl: 'exercise-qa.component.html',
  styleUrls: ['field.css', 'exercise-qa.component.css']
})

export class LearnQAComponent implements OnChanges, AfterViewChecked {
  @Input() lanPair: LanPair;
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
  currentExerciseId: string;

  constructor(
    private utilsService: UtilsService
  ) {}

  ngOnChanges() {
    if (this.currentExerciseId !== this.data.exercise._id) {
      const exercise = this.data.exercise;
      this.currentExerciseId = exercise._id;
      this.instruction = exercise.tpe === ExerciseType.QA ? this.text['instructionQA'] : this.text['instructionFillIn'];
      this.getQAData(exercise);
    }
  }

  ngAfterViewChecked() {
    this.answer.nativeElement.focus();
  }

  onKeySelected(key: string) {
    this.utilsService.insertKey(this.answer.nativeElement, key);
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
    this.sentence = this.sentence.map(section => section.trim());
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
