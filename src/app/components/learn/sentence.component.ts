import {Component, Input, OnInit} from '@angular/core';
import {ExerciseData, Exercise} from '../../models/exercise.model';
import {LearnService} from '../../services/learn.service';

@Component({
  selector: 'km-sentence',
  templateUrl: 'sentence.component.html',
  styleUrls: ['sentence.component.css']
})

export class LearnSentenceComponent implements OnInit {
  @Input() lanPair: string;
  @Input() msg: string;
  @Input() data: ExerciseData;
  sentence: string[];
  translation: string;
  correctOption: string;
  options: string[];
  answer: string;
  isAnswered = false;
  isCorrect: boolean;

  constructor(
    private learnService: LearnService
  ) {}

  ngOnInit() {
    console.log('SENTENCE', this.data.exercise);
    const exercise = this.data.exercise;
    this.getSentenceData(exercise);
  }

  onSelected(selectedOption: string) {
    this.isAnswered = true;
    this.answer = selectedOption;
    if (selectedOption === this.correctOption) {
      this.isCorrect = true;
    } else {
      this.isCorrect = false;
    }
  }

  private getSentenceData(exercise: Exercise) {
    // get options
    this.options = exercise.options;
    this.correctOption = this.getCorrectOption(exercise.foreign.word);
    this.options.push(this.correctOption);
    this.options = this.learnService.shuffle(this.options);
    // get sentence without []
    this.sentence = exercise.foreign.word.replace(/\[.*\]/, '|').split('|');
    console.log('sentence', this.sentence);
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
