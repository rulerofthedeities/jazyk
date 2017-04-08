import {Component, Input, Output, OnInit, OnDestroy, EventEmitter} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {Lesson} from '../../models/course.model';

@Component({
  selector: 'km-build-lesson',
  templateUrl: 'lesson.component.html'
})

export class BuildLessonComponent implements OnInit, OnDestroy {
  @Input() courseId: string;
  @Input() lesson: Lesson;
  @Output() done = new EventEmitter<Lesson>();
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
      nr: 0,
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
    if (this.lesson._id) {
      this.updateLesson(formValues.name);
    } else {
      this.addLesson(formValues.name);
    }
    this.isSubmitted = true;
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
