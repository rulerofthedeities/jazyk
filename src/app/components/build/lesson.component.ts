import {Component, Input, Output, OnInit, OnDestroy, EventEmitter, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {Chapter, Lesson} from '../../models/course.model';
import {AutocompleteComponent} from '../fields/autocomplete.component';

@Component({
  selector: 'km-build-lesson',
  templateUrl: 'lesson.component.html'
})

export class BuildLessonComponent implements OnInit, OnDestroy {
  @Input() courseId: string;
  @Input() lesson: Lesson;
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
      name: '',
      nr: this.nr + 1,
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
    this.lessonForm = this.formBuilder.group({
      name: [this.lesson.name],
      nr: [this.lesson.nr]
    });
    this.isFormReady = true;
  }

  onCancel() {
    this.done.emit(null);
  }

  onSubmit(formValues: any) {
    this.lesson.chapter = this.autocomplete.currentItem;
    if (this.lesson._id) {
      this.updateLesson(formValues.name);
    } else {
      this.addLesson(formValues.name);
    }
    this.isSubmitted = true;
  }

  onFocusName() {
    this.autocomplete.showList = false;
  }

  addLesson(name: string) {
    this.lesson.name = name;
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

  updateLesson(newName: string) {
    this.lesson.name = newName;
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
