import {Component, Input, Output, OnInit, OnDestroy, EventEmitter, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, FormArray, FormControl, Validators} from '@angular/forms';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {Lesson, LanPair, CourseDefaults} from '../../models/course.model';
import {AutocompleteComponent} from '../fields/autocomplete.component';

enum Steps {Intro, Study, Practise, Exam};

@Component({
  selector: 'km-build-lesson-header',
  templateUrl: 'lesson-header.component.html',
  styleUrls: ['lesson-header.component.css']
})

export class BuildLessonHeaderComponent implements OnInit, OnDestroy {
  @Input() courseId: string;
  @Input() languagePair: LanPair;
  @Input() lesson: Lesson;
  @Input() lessons: Lesson[];
  @Input() defaults: CourseDefaults;
  @Input() chapters: string[];
  @Input() nr: number;
  @Input() text: Object;
  @Output() done = new EventEmitter<Lesson>();
  @ViewChild(AutocompleteComponent) autocomplete: AutocompleteComponent;
  private componentActive = true;
  private bidirectional = [false, false, true, false];
  private ordered = [false, true, false, true];
  private active = [false, true, true, true];
  lessonForm: FormGroup;
  chapterForm: FormGroup;
  isFormReady = false;
  isNew = true;
  isSubmitted = false;
  tpeLabels = ['Intro', 'Study', 'Practise', 'Exam'];
  steps = Steps;

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

  onSetFlag(field: string, status: boolean) {
    this.lessonForm.patchValue({[field]: status});
    this.lessonForm.markAsDirty();
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
      this.lesson.exerciseSteps.exam.bidirectional
    ];
    this.ordered = [
      this.lesson.exerciseSteps.intro.ordered,
      this.lesson.exerciseSteps.study.ordered,
      this.lesson.exerciseSteps.practise.ordered,
      this.lesson.exerciseSteps.exam.ordered
    ];
    this.active = [
      this.lesson.exerciseSteps.intro.active,
      this.lesson.exerciseSteps.study.active,
      this.lesson.exerciseSteps.practise.active,
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
      options: {
        caseSensitive: this.defaults.caseSensitive
      },
      exerciseSteps: {
        intro: {
          active: false,
          bidirectional: false,
          ordered: false},
        study: {
          active: true,
          bidirectional: false,
          ordered: false},
        practise: {
          active: true,
          bidirectional: true,
          ordered: false},
        exam: {
          active: true,
          bidirectional: false,
          ordered: false}
      },
      exercises: [],
      difficulty: 0,
      isPublished: false
    };
    this.buildForm();
  }

  private buildForm() {
    const exerciseStepControls: FormControl[] = [];
    for (let i = 0; i < this.tpeLabels.length; i++) {
      exerciseStepControls.push(new FormControl(this.active[i]));
    }
    this.lessonForm = this.formBuilder.group({
      name: [this.lesson.name, [Validators.required]],
      exerciseSteps: new FormArray(exerciseStepControls),
      caseSensitive: [this.lesson.options.caseSensitive]
    });
    console.log('LESSON FORM', this.lessonForm);
    this.isFormReady = true;
  }

  private processLesson(formValues: any) {
    const chapterName = this.autocomplete.currentItem ? this.autocomplete.currentItem : '';
    this.lesson.chapterName = chapterName;
    this.lesson.name = formValues.name;
    this.lesson.options = {caseSensitive: formValues.caseSensitive};
    this.lesson.exerciseSteps = {
      intro: {
        active: formValues.exerciseSteps[0],
        bidirectional: this.bidirectional[0],
        ordered: this.ordered[0]},
      study: {
        active: formValues.exerciseSteps[1],
        bidirectional: this.bidirectional[1],
        ordered: this.ordered[1]},
      practise: {
        active: formValues.exerciseSteps[2],
        bidirectional: this.bidirectional[2],
        ordered: this.ordered[2]},
      exam: {
        active: formValues.exerciseSteps[3],
        bidirectional: this.bidirectional[3],
        ordered: this.ordered[3]}
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
        this.done.emit(savedLesson);
      },
      error => this.errorService.handleError(error)
    );
  }

  private updateLesson() {
    this.buildService
    .updateLessonHeader(this.lesson)
    .takeWhile(() => this.componentActive)
    .subscribe(
      updatedCourse => this.done.emit(this.lesson),
      error => this.errorService.handleError(error)
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
