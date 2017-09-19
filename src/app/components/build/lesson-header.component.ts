import {Component, Input, Output, OnInit, OnDestroy, EventEmitter, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, FormArray, FormControl, Validators} from '@angular/forms';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {Lesson, LanPair} from '../../models/course.model';
import {AutocompleteComponent} from '../fields/autocomplete.component';

@Component({
  selector: 'km-build-lesson-header',
  templateUrl: 'lesson-header.component.html',
  styles: [`
    .btn-group .fa {
      width: 18px;
    }
    .fa-check {
      color: green;
    }
    .fa-times {
      color: red;
    }
    .toggle {
      color: #ccc;
      margin-left: 4px;
    }
    .toggle:hover {
      color: #999;
    }
    .toggle.sel {
      color: green;
    }
  `]
})

export class BuildLessonHeaderComponent implements OnInit, OnDestroy {
  @Input() courseId: string;
  @Input() languagePair: LanPair;
  @Input() lesson: Lesson;
  @Input() lessons: Lesson[];
  @Input() chapters: string[];
  @Input() nr: number;
  @Input() text: Object;
  @Output() done = new EventEmitter<Lesson>();
  @ViewChild(AutocompleteComponent) autocomplete: AutocompleteComponent;
  private componentActive = true;
  private bidirectional = [false, false, true, false, false];
  private ordered = [false, false, false, false, false];
  private active = [false, true, true, true, true];
  lessonForm: FormGroup;
  chapterForm: FormGroup;
  isFormReady = false;
  isNew = true;
  isSubmitted = false;
  tpeLabels = ['Intro', 'Study', 'Practise', 'Test', 'Exam'];

  constructor(
    private formBuilder: FormBuilder,
    private buildService: BuildService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    if (this.lesson) {
      this.editLesson();
    } else {
      this.createNewLesson();
    }
  }

  onCancel() {
    this.done.emit(null);
  }

  onSubmit(formValues: any) {
    this.processLesson(formValues);

    if (this.lesson._id) {
      this.updateLesson();
    } else {
      this.addLesson();
    }
    this.isSubmitted = true;
  }

  onFocusName() {
    this.autocomplete.showList = false;
  }

  onToggleBidirectional(event: MouseEvent, i: number) {
    event.preventDefault();
    event.stopPropagation();
    this.bidirectional[i] = !this.bidirectional[i];
  }

  onToggleOrdered(event: MouseEvent, i: number) {
    event.preventDefault();
    event.stopPropagation();
    this.ordered[i] = !this.ordered[i];
  }

  private editLesson() {
    console.log('editing lesson', this.lesson);
    this.isNew = false;
    this.courseId = this.lesson.courseId;
    this.languagePair = this.lesson.languagePair;
    this.bidirectional = [
      this.lesson.exerciseSteps.intro.bidirectional,
      this.lesson.exerciseSteps.study.bidirectional,
      this.lesson.exerciseSteps.practise.bidirectional,
      this.lesson.exerciseSteps.test.bidirectional,
      this.lesson.exerciseSteps.exam.bidirectional
    ];
    this.ordered = [
      this.lesson.exerciseSteps.intro.ordered,
      this.lesson.exerciseSteps.study.ordered,
      this.lesson.exerciseSteps.practise.ordered,
      this.lesson.exerciseSteps.test.ordered,
      this.lesson.exerciseSteps.exam.ordered
    ];
    this.active = [
      this.lesson.exerciseSteps.intro.active,
      this.lesson.exerciseSteps.study.active,
      this.lesson.exerciseSteps.practise.active,
      this.lesson.exerciseSteps.test.active,
      this.lesson.exerciseSteps.exam.active
      ];
    this.buildForm();
  }

  private createNewLesson() {
    this.isNew = true;
    this.lesson = {
      _id: '',
      courseId: this.courseId,
      languagePair: this.languagePair,
      name: '',
      chapterName: '',
      exerciseSteps: {
        intro: {active: false, bidirectional: false, ordered: false},
        study: {active: true, bidirectional: false, ordered: false},
        practise: {active: true, bidirectional: true, ordered: false},
        test: {active: true, bidirectional: false, ordered: false},
        exam: {active: true, bidirectional: false, ordered: false}
      },
      exercises: [],
      difficulty: 0,
      isPublished: false
    };
    this.buildForm();
  }

  private buildForm() {
    const exerciseStepControls: FormControl[] = [];
    for (let i = 0; i < 5; i++) {
      exerciseStepControls.push(new FormControl(this.active[i]));
    }
    this.lessonForm = this.formBuilder.group({
      name: [this.lesson.name],
      exerciseSteps: new FormArray(exerciseStepControls)
    });
    this.isFormReady = true;
  }

  private processLesson(formValues: any) {
    const chapterName = this.autocomplete.currentItem ? this.autocomplete.currentItem : '';
    this.lesson.chapterName = chapterName;
    this.lesson.name = formValues.name;
    this.lesson.exerciseSteps = {
      intro: {active: formValues.exerciseSteps[0], bidirectional: this.bidirectional[0], ordered: this.ordered[0]},
      study: {active: formValues.exerciseSteps[1], bidirectional: this.bidirectional[1], ordered: this.ordered[1]},
      practise: {active: formValues.exerciseSteps[2], bidirectional: this.bidirectional[2], ordered: this.ordered[2]},
      test: {active: formValues.exerciseSteps[3], bidirectional: this.bidirectional[3], ordered: this.ordered[3]},
      exam: {active: formValues.exerciseSteps[4], bidirectional: this.bidirectional[4], ordered: this.ordered[4]}
    };
  }

  private addLesson() {
    this.lesson.languagePair = this.languagePair;
    this.buildService
    .addLesson(this.lesson)
    .takeWhile(() => this.componentActive)
    .subscribe(
      savedLesson => {
        this.lesson = savedLesson;
        console.log('done', savedLesson);
        this.done.emit(savedLesson);
      },
      error => this.errorService.handleError(error)
    );
  }

  private updateLesson() {
    console.log('updating', this.lesson);
    this.buildService
    .updateLessonHeader(this.lesson)
    .takeWhile(() => this.componentActive)
    .subscribe(
      updatedCourse => {
        console.log('updated lesson', this.lesson);
        this.done.emit(this.lesson);
      },
      error => this.errorService.handleError(error)
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
