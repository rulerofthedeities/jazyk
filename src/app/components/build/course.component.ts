import {Component, OnInit, OnDestroy} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {UtilsService} from '../../services/utils.service';
import {Course, Language} from '../../models/course.model';
import 'rxjs/add/operator/takeWhile';

@Component({
  templateUrl: 'course.component.html'
})

export class BuildCourseComponent implements OnInit, OnDestroy {
  private componentActive = true;
  private courseId: string;
  courseForm: FormGroup;
  isNewCourse = false;
  formReady = false;
  languages: Language[];
  course: Course;

  constructor(
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
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
            this.editCourse(courseId);
          }
          console.log('Editing course', params['id']);
        }
      }
    );
  }

  editCourse(id: string) {
    // Find course Id in db
    // If course is found, set id and build form
    // If course is not found, show message (invalid course id)
    this.courseId = id;
    this.isNewCourse = false;
  }

  createNewCourse() {
    this.isNewCourse = true;
    this.buildForm();

    // TODO //
    // As soon as course is saved, redirect route
  }

  buildForm() {
    // TODO //
    // Get language preference from profile settings

    this.languages = this.utilsService.getActiveLanguages();
    this.course = {
      _id: '',
      language: this.languages[0], // TODO: fetch from user settings
      name: '',
      attendance: 0,
      difficulty: 0
    };
    this.courseForm = this.formBuilder.group({
      name: [this.course.name]
    });
    this.formReady = true;
  }

  onSubmit() {
    console.log('submitting');
  }

  onLanguageSelected(newLanguage: Language) {
    this.course.language = newLanguage;
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
