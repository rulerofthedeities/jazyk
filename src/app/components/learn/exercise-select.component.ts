import {Component, Input, Output, OnChanges, EventEmitter} from '@angular/core';
import {LanPair} from '../../models/course.model';
import {ExerciseData, Exercise, ExerciseType} from '../../models/exercise.model';
import {PreviewService} from '../../services/preview.service';

@Component({
  selector: 'km-select',
  templateUrl: 'exercise-select.component.html',
  styleUrls: ['exercise-select.component.css']
})

export class LearnSelectComponent implements OnChanges {
  @Input() lanPair: LanPair;
  @Input() text: Object;
  @Input() data: ExerciseData;
  @Output() answered = new EventEmitter<boolean>();
  sentence: string[];
  instruction: string;
  msg: string;
  translation: string;
  correctOption: string;
  options: string[];
  answer: string;
  isAnswered = false;
  isCorrect: boolean;
  exerciseTpe: ExerciseType;
  currentExerciseId: string;

  constructor(
    private previewService: PreviewService
  ) {}

  ngOnChanges() {
    if (this.currentExerciseId !== this.data.exercise._id) {
      this.currentExerciseId = this.data.exercise._id;
      this.getSelectData(this.data.exercise);
    }
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
    this.msg = this.text['Expectedanswer'];
    this.options = exercise.options.split('|');
    switch (exercise.tpe) {
      case ExerciseType.Select:
        this.instruction = this.text['instructionSelect'];
        this.correctOption = this.getCorrectOption(exercise.foreign.word);
        this.options.push(this.correctOption);
        // get sentence without []
        this.sentence = exercise.foreign.word.replace(/\[.*\]/, '|').split('|');
        break;
      case ExerciseType.Genus:
        this.instruction = this.text['instructionGenus'];
        this.options = this.options.map(option => this.text[option.toLowerCase()]);
        this.correctOption = this.text[exercise.genus.toLowerCase()];
        this.sentence = [exercise.foreign.word, ''];
        break;
      case ExerciseType.Article:
        this.instruction = this.text['instructionArticle'];
        this.correctOption = exercise.article;
        this.sentence = ['', exercise.foreign.word];
        break;
    }
    this.options = this.previewService.shuffle(this.options);
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
