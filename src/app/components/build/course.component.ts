import {Component, OnInit, OnDestroy} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {BuildService} from '../../services/build.service';
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
  currentLanguage: Language;
  course: Course;
  initialCourse: Course; // For cancel

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private buildService: BuildService,
    private errorService: ErrorService,
    private utilsService: UtilsService
  ) {}

  ngOnInit() {
    this.languages = this.utilsService.getActiveLanguages();
    this.route.params
    .takeWhile(() => this.componentActive)
    .subscribe(
      params => {
        this.setDefaultLanguage(params['lan']);
        if (params['id']) {
          const courseId = params['id'];
          if (courseId === 'new') {
            this.createNewCourse();
          } else {
            this.editCourse(courseId);
          }
        }
      }
    );
  }

  editCourse(id: string) {
    this.isNewCourse = false;
    this.isEditMode = false;
    this.getCourse(id);
  }

  createNewCourse() {
    this.isNewCourse = true;
    this.isEditMode = true;
    this.course = {
      _id: '',
      languageId: this.currentLanguage._id,
      name: '',
      attendance: 0,
      difficulty: 0,
      isPublic: true,
      isPublished: false
    };
    this.buildForm();
  }

  buildForm() {
    this.courseForm = this.formBuilder.group({
      languageId: [this.currentLanguage._id],
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
    this.buildForm(); // Set values back to original
  }

  onCancel() {
    this.isEditMode = false;
  }

  addCourse(name: string) {
    this.course.name = name;
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

  updateCourse(newName: string) {
    this.course.name = newName;
    this.buildService
    .updateCourse(this.course)
    .takeWhile(() => this.componentActive)
    .subscribe(
      updatedCourse => {
        this.isEditMode = false;
      },
      error => this.errorService.handleError(error)
    );
  }

  onLanguageSelected(newLanguage: Language) {
    this.currentLanguage = newLanguage;
    this.course.languageId = newLanguage._id;
    this.courseForm.patchValue({languageId: newLanguage._id});
  }

  setDefaultLanguage(languageId: string) {
    console.log('setting language', languageId);
    let selLan: Language[];
    if (languageId) {
      selLan = this.languages.filter(lan => lan._id === languageId);
    }
    console.log(selLan);
    if (selLan && selLan.length > 0) {
      this.currentLanguage = selLan[0];
    } else {
      this.currentLanguage = this.languages[0];
    }
  }

  getCourse(id: string) {
    this.buildService
    .fetchCourse(id)
    .takeWhile(() => this.componentActive)
    .subscribe(
      course => {
        this.course = course;
        this.currentLanguage = this.languages.filter(lan => lan._id === course.languageId)[0];
        this.buildForm();
      },
      error => this.errorService.handleError(error)
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
