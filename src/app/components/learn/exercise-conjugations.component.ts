import {Component, Input, Output, OnInit, OnChanges, EventEmitter, ViewChildren, QueryList, ElementRef} from '@angular/core';
import {LanPair} from '../../models/course.model';
import {ExerciseData, Exercise, ExerciseType, ConjugationsData} from '../../models/exercise.model';
import {UtilsService} from '../../services/utils.service';

interface Keyboard {
  showKeyboard: boolean;
  keys: string[];
}

@Component({
  selector: 'km-conjugations',
  templateUrl: 'exercise-conjugations.component.html',
  styleUrls: ['field.css', 'exercise-conjugations.component.css']
})

export class LearnConjugationsComponent implements OnInit, OnChanges {
  @Input() lanPair: LanPair;
  @Input() text: Object;
  @Input() data: ExerciseData;
  @Input() pronouns: string[];
  @Input() keyboard: Keyboard;
  @ViewChildren('conjugation') conjugation: QueryList<ElementRef>;

  questionData: ExerciseData;
  instruction: string = '';
  isAnswered = false;
  currentExerciseId: string;
  currentField: number;
  conjugations: string[];
  alts: string[];
  answers: string[] = [];
  results: boolean[];

  constructor(
    private utilsService: UtilsService
  ) {}

  ngOnInit() {
    console.log(this.keyboard);
  }

  ngOnChanges() {
    if (this.currentExerciseId !== this.data.exercise._id) {
      this.currentExerciseId = this.data.exercise._id;
      this.getConjugationsData(this.data.exercise);
    }
  }

  onFocus(field: number) {
    this.currentField = field;
  }

  onKeySelected(key: string) {
    const currentField = this.conjugation.find((field, i) => i === this.currentField)
    if (currentField) {
      this.utilsService.insertKey(currentField.nativeElement, key);
    }
  }

  getData(): ConjugationsData {
    return {
      answers: this.answers,
      solutions: this.conjugations.map(conjugation => conjugation.split(';')[0]),
      alts: this.alts
    };
  }

  showResult(result: boolean[]) {
    console.log('result', result);
    this.results = result;
    this.isAnswered = true;
    // Show local language infinitive
    // show correct / incorrect
        // show correct answer if incorrect
  }

  clearData() {
    this.isAnswered = false;
    this.answers = this.initAnswers();
  }

  private getConjugationsData(exercise: Exercise) {
    this.questionData = JSON.parse(JSON.stringify(this.data));
    this.instruction = exercise.local.info;
    this.answers = this.initAnswers();
    this.conjugations = exercise.foreign.word.split('|');
    this.alts = exercise.foreign.alt.split('|');
  }

  private initAnswers(): string[] {
    return ['', '', '', '', '', ''];
  }
}
