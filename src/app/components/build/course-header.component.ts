import {Component, Input, Output, OnInit, OnDestroy, EventEmitter} from '@angular/core';
import {Router} from '@angular/router';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {Course, Lesson, Language} from '../../models/course.model';
import {config} from '../../app.config';
import 'rxjs/add/operator/takeWhile';

@Component({
  selector: 'km-build-course-header',
  templateUrl: 'course-header.component.html',
  styles: [`
    .panel {
      background-color: rgba(239, 239, 239, .9);
      border-radius: 6px;
    }
    .fa-user, .fa-check {
      color: green;
    }
  `]
})

export class BuildCourseHeaderComponent implements OnInit, OnDestroy {
  @Input() text: Object;
  @Input() course: Course;
  @Input() languages: Language[];
  @Input() currentLanguage: Language;
  @Output() done = new EventEmitter<Course>();
  private componentActive = true;
  private initialCourse: Course; // For cancel
  courseForm: FormGroup;
  lessons: Lesson[];
  currentLesson: Lesson;
  isFormReady = false;
  isNewCourse = true;
  isSaving = false;

  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private buildService: BuildService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    if (this.course) {
      this.isNewCourse = false;
      this.initialCourse = JSON.parse(JSON.stringify(this.course));
      this.buildForm();
    } else {
      this.createNewCourse();
    }
  }

  onSubmit(formValues: any) {
    this.processCourse(formValues);
    if (this.course._id) {
      this.updateCourse();
    } else {
      this.addCourse();
    }
  }

  onCancel() {
    if (this.isNewCourse) {
      this.router.navigate(['/learn/courses/']);
    } else {
      this.done.emit(this.initialCourse);
    }
  }

  onToggle(tpe) {
    this.course[tpe] = !this.course[tpe];
    this.courseForm.markAsDirty();
  }

  onLanguageSelected(newLanguage: Language) {
    this.currentLanguage = newLanguage;
    this.course.languagePair = {
      from: 'nl-nl',
      to: newLanguage._id
    };
    this.courseForm.patchValue({'languagePair.to': newLanguage._id});
  }

  private createNewCourse() {
    this.course = {
      _id: '',
      languagePair: {
        from: config.language,
        to: this.currentLanguage._id
      },
      name: '',
      image: config.language.slice(0, 2) + '-' + this.currentLanguage._id.slice(0, 2) + '-course1.jpg', // temporary
      attendance: 0,
      difficulty: 0,
      isPublic: true,
      isPublished: false,
      exerciseCount: 0,
      exercisesDone: 0,
      chapters: []
    };
    this.buildForm();
  }

  private buildForm() {
    this.courseForm = this.formBuilder.group({
      languagePair: [this.course.languagePair],
      name: [this.course.name, Validators.required]
    });
    this.isFormReady = true;
  }

  private processCourse(formValues: any) {
    this.course.name = formValues.name;
  }

  private addCourse() {
    this.buildService
    .addCourse(this.course)
    .takeWhile(() => this.componentActive)
    .subscribe(
      savedCourse => {
        this.course = savedCourse;
        this.router.navigate(['/build/course/', savedCourse._id]);
      },
      error => this.errorService.handleError(error)
    );
  }

  private updateCourse() {
    this.buildService
    .updateCourseHeader(this.course)
    .takeWhile(() => this.componentActive)
    .subscribe(
      updatedCourse => {
        this.done.emit(this.course);
      },
      error => this.errorService.handleError(error)
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}