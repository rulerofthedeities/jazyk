import {Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {BuildService} from '../../services/build.service';
import {UtilsService} from '../../services/utils.service';
import {ErrorService} from '../../services/error.service';
import {UserService} from '../../services/user.service';
import {Course, Lesson, LanPair,
        LanConfigs, AccessLevel} from '../../models/course.model';
import {Exercise, ExerciseType} from '../../models/exercise.model';
import {takeWhile, filter} from 'rxjs/operators';

@Component({
  templateUrl: 'lesson.component.html',
  styleUrls: ['headers.css', 'lesson.component.css']
})

export class BuildLessonComponent implements OnInit, OnDestroy {
  private componentActive = true;
  private lanLocal: string;
  private lanForeign: string;
  course: Course;
  chapters: string[];
  lesson: Lesson;
  isLoading = false;
  isNewExercise = false;
  isEditMode = false;
  isBidirectional = false;
  text: Object = {};
  tab = 'words';
  isCourseAccess = false;
  infoMsg = '';
  tpe: ExerciseType;
  exType = ExerciseType;
  showDropDown = false;
  configs: LanConfigs;

  @ViewChild('dropdown') el: ElementRef;
  @HostListener('document:click', ['$event'])
  clickout(event) {
    if (this.el && !this.el.nativeElement.contains(event.target)) {
      // Outside dropdown, close dropdown
      this.showDropDown = false;
    }
  }

  constructor(
    private route: ActivatedRoute,
    private buildService: BuildService,
    private utilsService: UtilsService,
    private userService: UserService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.route.params
    .pipe(
      takeWhile(() => this.componentActive),
      filter(params => params.id))
    .subscribe(
      params => {
        const lessonId = params['id'];
        this.getTranslations(lessonId);
      }
    );
  }

  onNewWord() {
    this.showDropDown = false;
    this.isNewExercise = true;
    this.tpe = ExerciseType.Word;
  }

  onCancelNew() {
    this.showDropDown = false;
    this.isNewExercise = false;
  }

  onNewSelect() {
    this.showDropDown = false;
    this.isNewExercise = true;
    this.tpe = ExerciseType.Select;
  }

  onNewQA() {
    this.showDropDown = false;
    this.isNewExercise = true;
    this.tpe = ExerciseType.QA;
  }

  onNewFillIn() {
    this.showDropDown = false;
    this.isNewExercise = true;
    this.tpe = ExerciseType.FillIn;
  }

  onEditLesson() {
    this.showDropDown = false;
    this.isEditMode = true;
  }

  onToggleDropDown() {
    this.showDropDown = !this.showDropDown;
  }

  onCloseHeader(updatedLesson: Lesson) {
    this.showDropDown = false;
    if (updatedLesson) {
      this.lesson = updatedLesson;
      // Check if new chapter was added
      if (this.chapters.filter(chapter => chapter === updatedLesson.chapterName).length < 1) {
        this.addChapter(updatedLesson.chapterName, this.lesson._id);
      }
    }
    this.isEditMode = false;
  }

  onExercisesAdded(exercises: Exercise[]) {
    this.lesson.exercises = this.lesson.exercises.concat(exercises);
    this.isNewExercise = false;
  }

  onExerciseRemoved(toRemove: number) {
    this.lesson.exercises.splice(toRemove, 1);
  }

  onTabSelected(tab: string) {
    this.tab = tab;
  }

  isEditor(): boolean {
    return this.userService.hasAccessLevel(this.course.access, AccessLevel.Editor);
  }

  private getLesson(lessonId: string) {
    this.isLoading = true;
    this.buildService
    .fetchLesson(lessonId)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      lesson => {
        this.lesson = lesson;
        if (lesson) {
          this.lanLocal = lesson.languagePair.from;
          this.lanForeign = lesson.languagePair.to;
          this.getCourse(); // for header & chapters
          this.setBidirectional();
          this.getConfigs(lesson.languagePair);
        } else {
          this.isLoading = false;
          this.infoMsg = this.text['LessonIdInvalid'];
        }
      },
      error => this.errorService.handleError(error)
    );
  }

  private addChapter(chapterName: string, lessonId: string) {
    if (chapterName) {
      this.chapters.push(chapterName);
      this.buildService
      .addChapter(this.lesson.courseId, chapterName, lessonId)
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(
        savedCourse => {},
        error => this.errorService.handleError(error)
      );
    }
  }

  private getCourse() {
    this.buildService
    .fetchCourse(this.lesson.courseId)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      course => {
        this.isLoading = false;
        this.course = course;
        if (course) {
          this.utilsService.setPageTitle(null, course.name, true);
          this.chapters = course.chapters;
          this.isCourseAccess = true;
        } else {
          this.infoMsg = this.text['NotAuthorizedEditCourse'];
        }
      },
      error => this.errorService.handleError(error)
    );
  }

  private getTranslations(lessonId: string) {
    this.utilsService
    .fetchTranslations(this.userService.user.main.lan, 'LessonComponent')
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      translations => {
        this.text = this.utilsService.getTranslatedText(translations);
        this.getLesson(lessonId);
      },
      error => this.errorService.handleError(error)
    );
  }

  private getConfigs(lanPair: LanPair) {
    this.buildService
    .fetchLanConfigs(lanPair)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      configs => this.configs = configs,
      error => this.errorService.handleError(error)
    );
  }

  private setBidirectional() {
    const exerciseSteps = this.lesson.exerciseSteps;
    if (exerciseSteps) {
      if (exerciseSteps.study.bidirectional ||
          exerciseSteps.practise.bidirectional ||
          exerciseSteps.exam.bidirectional) {
        this.isBidirectional = true;
      }
    }
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
