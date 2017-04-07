import {Component, OnInit, OnDestroy} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {CourseService} from '../../services/course.service';
import {ErrorService} from '../../services/error.service';
import {UtilsService} from '../../services/utils.service';
import {Course, Language} from '../../models/course.model';
import 'rxjs/add/operator/takeWhile';

@Component({
  templateUrl: 'course.component.html'
})

export class BuildCourseComponent implements OnInit, OnDestroy {
  private componentActive = true;
  courseForm: FormGroup;
  isNewCourse = false;
  isEditMode = false;
  isSubmitted = false;
  isFormReady = false;
  languages: Language[];
  course: Course;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private courseService: CourseService,
    private errorService: ErrorService,
    private utilsService: UtilsService
  ) {}

  ngOnInit() {
    this.route.params
    .takeWhile(() => this.componentActive)
    .subscribe(
      params => {
        console.log('params course', params);
        if (params['id']) {
          const courseId = params['id'];
          if (courseId === 'new') {
            this.createNewCourse();
          } else {
            console.log('Editing course', courseId);
            this.editCourse(courseId);
          }
        }
      }
    );
  }

  editCourse(id: string) {
    // Find course Id in db
    // If course is found, set id and build form
    // If course is not found, show message (invalid course id)
    this.isNewCourse = false;
    this.isEditMode = false;
    this.getCourse(id);
  }

  createNewCourse() {
    // TODO //
    // Get language preference from profile settings
    this.isNewCourse = true;
    this.isEditMode = true;
    this.course = {
      _id: '',
      language: { _id: 'cs-cz', name: 'Tsjechisch', active: true }, // TODO: fetch from user settings
      name: '',
      attendance: 0,
      difficulty: 0
    };
    this.buildForm();
  }

  buildForm() {
    this.languages = this.utilsService.getActiveLanguages();
    this.courseForm = this.formBuilder.group({
      language: [this.course.language],
      name: [this.course.name, Validators.required]
    });
    this.isFormReady = true;
  }

  onSubmit(formValues: any) {
    if (this.course._id) {
      this.updateCourse(formValues.name);
    } else {
      this.addCourse(formValues.name);
    }
    this.isSubmitted = true;
  }

  onSetEdit() {
    this.isEditMode = true;
  }

  addCourse(name: string) {
    this.course.name = name;
    this.courseService
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

  updateCourse(newName: string) {
    this.course.name = newName;
    this.courseService
    .updateCourse(this.course)
    .takeWhile(() => this.componentActive)
    .subscribe(
      updatedCourse => {
        this.course = updatedCourse;
      },
      error => this.errorService.handleError(error)
    );
  }

  onLanguageSelected(newLanguage: Language) {
    this.course.language = newLanguage;
    this.courseForm.patchValue({language: newLanguage});
  }

  getCourse(id: string) {
    this.courseService
    .fetchCourse(id)
    .takeWhile(() => this.componentActive)
    .subscribe(
      course => {
    console.log('fetched course1', course);
        this.course = course;
        this.buildForm();
      },
      error => this.errorService.handleError(error)
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
