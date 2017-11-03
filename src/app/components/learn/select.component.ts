import {Component, Input, Output, OnInit, EventEmitter} from '@angular/core';
import {ExerciseData, Exercise} from '../../models/exercise.model';
import {PreviewService} from '../../services/preview.service';

@Component({
  selector: 'km-select',
  templateUrl: 'select.component.html',
  styleUrls: ['select.component.css']
})

export class LearnSelectComponent implements OnInit {
  @Input() lanPair: string;
  @Input() msg: string;
  @Input() data: ExerciseData;
  @Input() instruction: string;
  @Output() answered = new EventEmitter<boolean>();
  sentence: string[];
  translation: string;
  correctOption: string;
  options: string[];
  answer: string;
  isAnswered = false;
  isCorrect: boolean;

  constructor(
    private previewService: PreviewService
  ) {}

  ngOnInit() {
    console.log('SELECT', this.data.exercise);
    const exercise = this.data.exercise;
    this.getSelectData(exercise);
  }

  onSelected(selectedOption: string) {
    this.isAnswered = true;
    this.answer = selectedOption;
    if (selectedOption === this.correctOption) {
      this.isCorrect = true;
    } else {
      this.isCorrect = false;
    }
    this.answered.emit(this.isCorrect);
  }

  clearData() {
    this.isAnswered = false;
    this.answer = null;
    this.isCorrect = null;
  }

  private getSelectData(exercise: Exercise) {
    // get options
    this.options = JSON.parse(JSON.stringify(exercise.options));
    this.correctOption = this.getCorrectOption(exercise.foreign.word);
    this.options.push(this.correctOption);
    this.options = this.previewService.shuffle(this.options);
    // get sentence without []
    this.sentence = exercise.foreign.word.replace(/\[.*\]/, '|').split('|');
    console.log('select', this.sentence);
    if (exercise.local) {
      this.translation = exercise.local.word;
    }
  }

  private getCorrectOption(sentence: string): string {
    let correctOption = 'invalid option';
    const matches = sentence.match(/\[(.*?)\]/);
    if (matches && matches.length > 1) {
      correctOption = matches[1];
    }
    return correctOption;
  }
}
