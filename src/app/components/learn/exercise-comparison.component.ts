import {Component, Input, Output, OnInit, OnChanges, AfterViewInit, Renderer,
  EventEmitter, ViewChildren, QueryList, ElementRef} from '@angular/core';
import {LanPair} from '../../models/course.model';
import {ExerciseData, Exercise, ExerciseType, ConjugationsData} from '../../models/exercise.model';
import {UtilsService} from '../../services/utils.service';

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

export class LearnComparisonComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() lanPair: LanPair;
  @Input() text: Object;
  @Input() data: ExerciseData;
  @Input() keyboard: Keyboard;
  @ViewChildren('comparison') comparison: QueryList<ElementRef>;
  questionData: ExerciseData;
  instruction: string;
  currentField = 0;
  isAnswered = false;
  currentExerciseId: string;
  comparisons: string[];
  answers: string[] = [];
  results: boolean[];
  labels: string[];

  constructor(
    private utilsService: UtilsService,
    public renderer: Renderer
  ) {}

  ngOnInit() {
    this.instruction = this.text['instructionComparison'];
    this.labels = [this.text['Comparative'], this.text['Superlative']];
  }

  ngOnChanges() {
    if (this.currentExerciseId !== this.data.exercise._id) {
      this.currentExerciseId = this.data.exercise._id;
      const exercise = this.data.exercise;
      this.getComparisonData(this.data.exercise);
    }
  }

  ngAfterViewInit() {
    // Set focus on first field
    this.comparison.changes.subscribe(elements => {
      this.renderer.invokeElementMethod(elements.first.nativeElement, 'focus', []);
    });
  }

  onFocus(field: number) {
    this.currentField = field;
  }

  onKeySelected(key: string) {
    const currentField = this.comparison.find((field, i) => i === this.currentField);
    if (currentField) {
      this.utilsService.insertKey(currentField.nativeElement, key);
      this.answers[this.currentField] = currentField.nativeElement.value;
    }
  }

  getData(): ConjugationsData {
    const alts = this.comparisons.map(comparison => comparison.split(';')[1]);
    return {
      answers: this.answers,
      solutions: this.comparisons.map(comparison => comparison.split(';')[0]),
      alts: alts.slice(1, this.comparisons.length)
    };
  }

  showResult(result: boolean[]) {
    this.results = result;
    this.isAnswered = true;
  }

  clearData() {
    this.answers = this.initAnswers();
    this.isAnswered = false;
    this.answers = this.initAnswers();
    this.currentField = 0;
  }

  private getComparisonData(exercise: Exercise) {
    this.questionData = JSON.parse(JSON.stringify(this.data));
    this.answers = this.initAnswers();
    this.comparisons = exercise.foreign.word.split('|');
  }

  private initAnswers(): string[] {
    return ['', ''];
  }
}
