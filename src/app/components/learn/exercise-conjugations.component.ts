import {Component, Input, OnChanges, AfterViewInit, Renderer,
        ViewChildren, QueryList, ElementRef} from '@angular/core';
import {Keyboard, LanPair} from '../../models/course.model';
import {ExerciseData, Exercise, ConjugationsData} from '../../models/exercise.model';
import {UtilsService} from '../../services/utils.service';

@Component({
  selector: 'km-conjugations',
  templateUrl: 'exercise-conjugations.component.html',
  styleUrls: ['field.css', 'exercise-conjugations.component.css']
})

export class LearnConjugationsComponent implements OnChanges, AfterViewInit {
  @Input() lanPair: LanPair;
  @Input() text: Object;
  @Input() data: ExerciseData;
  @Input() pronouns: string[];
  @Input() keyboard: Keyboard;
  @ViewChildren('conjugation') conjugation: QueryList<ElementRef>;

  questionData: ExerciseData;
  instruction = '';
  isAnswered = false;
  currentExerciseUnid: string;
  currentField = 0;
  conjugations: string[];
  answers: string[] = [];
  results: boolean[];

  constructor(
    private utilsService: UtilsService,
    public renderer: Renderer
  ) {}

  ngOnChanges() {
    const unid = this.data.exercise._id + (this.data.exercise.lessonId || '');
    if (this.currentExerciseUnid !== unid) {
      this.currentExerciseUnid = unid;
      this.getConjugationsData(this.data.exercise);
    }
  }

  ngAfterViewInit() {
    // Set focus on first conjugation field
    this.conjugation.changes.subscribe(elements => {
      this.renderer.invokeElementMethod(elements.first.nativeElement, 'focus', []);
    });
  }

  onFocus(field: number) {
    this.currentField = field;
  }

  onKeySelected(key: string) {
    const currentField = this.conjugation.find((field, i) => i === this.currentField);
    if (currentField) {
      this.utilsService.insertKey(currentField.nativeElement, key);
      this.answers[this.currentField] = currentField.nativeElement.value;
    }
  }

  getData(): ConjugationsData {
    const alts = this.conjugations.map(conjugation => conjugation.split(';')[1]);
    return {
      answers: this.answers,
      solutions: this.conjugations.map(conjugation => conjugation.split(';')[0]),
      alts: alts.slice(1, this.conjugations.length)
    };
  }

  showResult(result: boolean[]) {
    this.results = result;
    this.isAnswered = true;
  }

  clearData() {
    this.isAnswered = false;
    this.answers = this.initAnswers();
    this.currentField = 0;
  }

  private getConjugationsData(exercise: Exercise) {
    this.questionData = JSON.parse(JSON.stringify(this.data));
    this.instruction = exercise.local.info;
    this.answers = this.initAnswers();
    this.conjugations = exercise.foreign.word.split('|');
  }

  private initAnswers(): string[] {
    return ['', '', '', '', '', ''];
  }
}
