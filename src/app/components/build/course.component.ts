import {Component, OnInit, OnDestroy} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {UtilsService} from '../../services/utils.service';
import {Chapter, Course, Lesson, Language} from '../../models/course.model';
import {config} from '../../app.config';
import 'rxjs/add/operator/takeWhile';

@Component({
  templateUrl: 'course.component.html'
})

export class BuildCourseComponent implements OnInit, OnDestroy {
  private componentActive = true;
  courseForm: FormGroup;
  course: Course;
  initialCourse: Course; // For cancel
  languages: Language[];
  currentLanguage: Language;
  lessons: Lesson[];
  currentLesson: Lesson;
  chapters: Chapter[];
  isNewCourse = false;
  isEditMode = false;
  isSubmitted = false;
  isFormReady = false;
  isEditLesson = false;
  isSavingPublic = false;
  isSavingPublished = false;

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
        if (params['id']) {
          const courseId = params['id'];
          if (courseId === 'new') {
            this.setDefaultLanguage(params['lan']);
            this.createNewCourse();
          } else {
            this.editCourse(courseId);
          }
        }
      }
    );
  }

  editCourse(courseId: string) {
    this.isNewCourse = false;
    this.isEditMode = false;
    this.getCourse(courseId);
  }

  createNewCourse() {
    this.isNewCourse = true;
    this.isEditMode = true;
    this.course = {
      _id: '',
      languagePair: {
        from: config.language,
        to: this.currentLanguage._id
      },
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
      languagePair: [this.course.languagePair],
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

  onTogglePublic() {
    this.isSavingPublic = true;
    this.course.isPublic = !this.course.isPublic;
    this.buildService
    .publicCourse(this.course._id, this.course.isPublic)
    .takeWhile(() => this.componentActive)
    .subscribe(
      data => this.isSavingPublic = false,
      error => this.errorService.handleError(error)
    );
  }

  onTogglePublished() {
    this.isSavingPublished = true;
    this.course.isPublished = !this.course.isPublished;
    this.buildService
    .publishCourse(this.course._id, this.course.isPublished)
    .takeWhile(() => this.componentActive)
    .subscribe(
      data => this.isSavingPublished = false,
      error => this.errorService.handleError(error)
    );
  }

  addCourse(name: string) {
    console.log(this.course);
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

  onAddLesson() {
    this.isEditLesson = true;
  }

  onLessonDone(lessonAdded: Lesson) {
    this.isEditLesson = false;
    if (lessonAdded) {
      this.lessons.push(lessonAdded);
      // Check if new chapter was added
      if (this.chapters.filter(chapter => chapter.name === lessonAdded.chapter).length < 1) {
        this.addChapter(lessonAdded.chapter);
      }
    }
  }

  onLanguageSelected(newLanguage: Language) {
    this.currentLanguage = newLanguage;
    this.course.languagePair = {
      from: 'nl-nl',
      to: newLanguage._id
    };
    this.courseForm.patchValue({'languagePair.to': newLanguage._id});
  }

  setDefaultLanguage(languageId: string) {
    let selLan: Language[];
    if (languageId) {
      selLan = this.languages.filter(lan => lan._id === languageId);
    }
    if (selLan && selLan.length > 0) {
      this.currentLanguage = selLan[0];
    } else {
      this.currentLanguage = this.languages[0];
    }
  }

  getCourse(courseId: string) {
    this.buildService
    .fetchCourse(courseId)
    .takeWhile(() => this.componentActive)
    .subscribe(
      course => {
        this.course = course;
        this.currentLanguage = this.languages.filter(lan => lan._id === course.languagePair.to)[0];
        this.buildForm();
        this.getLessonsAndChapters(courseId);
      },
      error => this.errorService.handleError(error)
    );
  }

  getLessonsAndChapters(courseId: string) {
    this.buildService
    .fetchLessonsAndChapters(courseId)
    .takeWhile(() => this.componentActive)
    .subscribe(
      data => {
        this.lessons = data.lessons;
        this.chapters = data.chapters;
      },
      error => this.errorService.handleError(error)
    );
  }

  addChapter(chapterName: string) {
    if (chapterName) {
      const newChapter = {
        courseId: this.course._id,
        name: chapterName,
        nr: this.chapters.length + 1
      };
      this.chapters.push(newChapter);
      this.buildService
      .addChapter(newChapter)
      .takeWhile(() => this.componentActive)
      .subscribe(
        savedChapter => {},
        error => this.errorService.handleError(error)
      );
    }
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
