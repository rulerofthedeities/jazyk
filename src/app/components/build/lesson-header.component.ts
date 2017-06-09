import {Component, Input, Output, OnInit, OnDestroy, EventEmitter, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, FormArray, FormControl, Validators} from '@angular/forms';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {Chapter, Lesson, LanPair} from '../../models/course.model';
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
  `]
})

export class BuildLessonHeaderComponent implements OnInit, OnDestroy {
  @Input() courseId: string;
  @Input() languagePair: LanPair;
  @Input() lesson: Lesson;
  @Input() lessons: Lesson[];
  @Input() chapters: Chapter[];
  @Input() nr: number;
  @Output() done = new EventEmitter<Lesson>();
  @ViewChild(AutocompleteComponent) autocomplete: AutocompleteComponent;
  private componentActive = true;
  lessonForm: FormGroup;
  chapterForm: FormGroup;
  isFormReady = false;
  isNew = true;
  isEditMode = false;
  isSubmitted = false;
  tpeLabels = ['Leer', 'Oefen', 'Test', 'Examen'];

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

  createNewLesson() {
    this.isNew = true;
    this.isEditMode = true;
    this.lesson = {
      _id: '',
      courseId: this.courseId,
      languagePair: this.languagePair,
      name: '',
      nr: 1,
      chapter: '',
      chapterNr: 1,
      exerciseTpes: {
        learn: true,
        practise: true,
        test: true,
        exam: true
      },
      exercises: [],
      difficulty: 0,
      isPublished: false
    };
    this.buildForm();
  }

  editLesson() {
    this.isNew = false;
    this.isEditMode = true;
  }

  buildForm() {
    const exerciseTpeControls: FormControl[] = [];
    for (let i = 0; i < 4; i++) {
      exerciseTpeControls.push(new FormControl(true));
    }
    this.lessonForm = this.formBuilder.group({
      name: [this.lesson.name],
      nr: [this.lesson.nr],
      exerciseTpes: new FormArray(exerciseTpeControls)
    });
    this.isFormReady = true;
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

  test(formvalues: any) {
    const test = {
      learn: formvalues.exerciseTpes[0],
      practise: formvalues.exerciseTpes[1],
      test: formvalues.exerciseTpes[2],
      exam: formvalues.exerciseTpes[3]
    };
  }

  private processLesson(formValues: any) {
    const chapterName = this.autocomplete.currentItem.name ? this.autocomplete.currentItem.name : '',
          chapterNr = this.autocomplete.currentItem.nr ? this.autocomplete.currentItem.nr : 0;
    this.lesson.chapter = chapterName;
    this.lesson.chapterNr = chapterNr;
    this.lesson.name = formValues.name;
    this.lesson.exerciseTpes = {
      learn: formValues.exerciseTpes[0],
      practise: formValues.exerciseTpes[1],
      test: formValues.exerciseTpes[2],
      exam: formValues.exerciseTpes[3]
    };
  }

  private addLesson() {
    this.lesson.nr = this.lessons.filter(lesson => lesson.chapter === this.lesson.chapter).length + 1;
    this.lesson.languagePair = this.languagePair;
    this.buildService
    .addLesson(this.lesson)
    .takeWhile(() => this.componentActive)
    .subscribe(
      savedLesson => {
        this.lesson = savedLesson;
        this.isEditMode = false;
        this.done.emit(savedLesson);
      },
      error => this.errorService.handleError(error)
    );
  }

  private updateLesson() {
    this.buildService
    .updateLesson(this.lesson)
    .takeWhile(() => this.componentActive)
    .subscribe(
      updatedCourse => {
        this.isEditMode = false;
      },
      error => this.errorService.handleError(error)
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
