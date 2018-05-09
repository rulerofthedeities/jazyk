import {Component, Input, Output, OnInit, OnDestroy, EventEmitter} from '@angular/core';
import {LearnService} from '../../services/learn.service';
import {ErrorService} from '../../services/error.service';
import {Course, Lesson, LessonHeader, LessonResult, Step, Level, Map} from '../../models/course.model';
import {Exercise, ExerciseResult, ExerciseData, ExerciseType} from '../../models/exercise.model';
import {takeWhile} from 'rxjs/operators';

@Component({
  selector: 'km-learn-overview',
  templateUrl: 'step-overview.component.html',
  styleUrls: ['step-overview.component.css']
})

export class LearnOverviewComponent implements OnInit, OnDestroy {
  @Input() private course: Course;
  @Input() text: Object;
  @Input() isDemo = false;
  @Input() currentLessonId: string;
  @Output() currentLesson = new EventEmitter<Lesson>();
  @Output() rehearseLesson = new EventEmitter<Lesson>();
  @Output() courseCompleted = new EventEmitter<boolean>();
  @Output() goToIntro = new EventEmitter<Lesson>();
  private componentActive = true;
  lessonHeaders: LessonHeader[] = [];
  courseChapters: string[] = [];
  chapterLessons: Map<LessonHeader[]> = {};
  resultsByLesson: Map<LessonResult> = {};
  resultsByChapter: Map<LessonResult> = {};
  currentChapter: string;
  lessonData: Lesson;
  isLessonsReady = false;
  isCourseComplete = false;
  hasChapters: boolean;
  dropDown: string;

  constructor(
    private learnService: LearnService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.getCourseChapters();
    this.getLessonHeaders();
    this.getLessonResults();
  }

  onSelectLesson(lessonId: string) {
    if (lessonId !== this.currentLessonId) {
      this.currentLessonId = lessonId;
    } else {
      this.currentLessonId = null;
    }
  }

  onSelectChapter(chapterName: string) {
    if (chapterName !== this.currentChapter) {
      this.currentChapter = chapterName;
    } else {
      this.currentChapter = null;
      this.currentLessonId = null;
    }
  }

  onLessonDataLoaded(lessonData: Lesson) {
    this.lessonData = lessonData;
  }

  onContinueLesson(event: MouseEvent, lessonId: string) {
    event.stopPropagation();
    event.preventDefault();
    if (this.lessonData && this.lessonData._id === lessonId) {
      this.currentLesson.emit(this.lessonData);
    } else {
      this.fetchLesson(lessonId);
    }
  }

  onRehearseLesson(event: MouseEvent, lessonId: string, step: string, cnt: number) {
    event.stopPropagation();
    event.preventDefault();
    if (cnt > 0) {
      if (this.lessonData && this.lessonData._id === lessonId) {
        this.lessonData.rehearseStep = step;
        this.rehearseLesson.emit(this.lessonData);
      } else {
        this.fetchLesson(lessonId, step);
      }
    }
  }

  onGoToStep(event: MouseEvent, lessonId: string, step: string) {
    event.stopPropagation();
    event.preventDefault();
    this.fetchLesson(lessonId, null, step);
  }

  onOpenDropDown(lessonId: string) {
    this.dropDown = lessonId;
  }

  onCloseDropDown() {
    this.dropDown = null;
  }

  getChapterName(chapterName: string) {
    if (chapterName === 'NoChapter') {
      return this.text['NoChapter'];
    } else {
      return chapterName;
    }
  }

  getCourseId() {
    return this.course._id;
  }

  hasStep(step: string, lessonId: string): boolean {
    let hasIntro = false;
    // Check if lesson has an intro step
    const lessonHeader = this.lessonHeaders.find(lesson => lesson._id.toString() === lessonId);
    if (lessonHeader) {
      if (lessonHeader.exerciseSteps[step] && lessonHeader.exerciseSteps[step].active) {
        hasIntro = true;
      }
    }
    return hasIntro;
  }

  private getCourseChapters() {
    this.courseChapters = JSON.parse(JSON.stringify(this.course.chapters)); // slice for no reference
    this.hasChapters = !!this.courseChapters.length;
    const emptyChapter = this.course.lessons.find(lesson => lesson.chapter === '');
    if (emptyChapter && !this.hasChapters) {
      this.courseChapters.push('NoChapter');
    }
  }

  private getLessonHeaders() {
    // Get all lesson headers for this course
    this.learnService
    .fetchLessonHeaders(this.course._id)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      headers => {
        this.getChapterLessons(headers);
        this.setDefaultResultData(headers);
      },
      error => this.errorService.handleError(error)
    );
    this.isLessonsReady = true;
  }

  private getChapterLessons(lessonHeaders: LessonHeader[]) {
    this.lessonHeaders = lessonHeaders;
    // Group lessons by chapter name
    this.courseChapters.forEach(chapterName => {
      this.chapterLessons[chapterName] = this.sortChapterLessons(lessonHeaders, chapterName);
    });
    // Get current chapter
    const currentLesson = lessonHeaders.find(lesson => lesson._id === this.currentLessonId);
    if (currentLesson) {
      this.currentChapter = currentLesson.chapterName;
    }
  }

  private sortChapterLessons(lessonHeaders: LessonHeader[], chapterName: string): LessonHeader[] {
    const filterName = chapterName === 'NoChapter' ? '' : chapterName,
          sortedLessonHeaders: LessonHeader[] = [],
          unSortedLessonHeaders = lessonHeaders.filter(lesson => lesson.chapterName === filterName);
    let lessonHeader: LessonHeader;
    // get sorting from course
    const lessons = this.course.lessons.find(lesson => lesson.chapter === filterName);
    if (lessons && lessons.lessonIds) {
      lessons.lessonIds.forEach(lessonId => {
        lessonHeader = lessonHeaders.find(lesson => lesson._id === lessonId);
        if (lessonHeader) {
          sortedLessonHeaders.push(lessonHeader);
        }
      });
    }
    return sortedLessonHeaders.length ? sortedLessonHeaders : unSortedLessonHeaders;
  }

  private setDefaultResultData(lessonHeaders: LessonHeader[]) {
    // Set default result data if there are no results (yet)
    lessonHeaders.forEach(header => {
      this.resultsByLesson[header._id] = {
        _id: header._id,
        studied: 0,
        learned: 0,
        total: null,
        totalwords: null,
        hasStarted: false,
        hasCompleted: false,
        introOnly: !this.hasStudyOrPractise(header)
      };
    });
    this.courseChapters.forEach(chapterName => {
      this.resultsByChapter[chapterName] = {
        _id: null,
        studied: 0,
        learned: 0,
        total: null,
        totalwords: null,
        hasStarted: false,
        hasCompleted: false
      };
    });
  }

  private getLessonResults() {
    if (this.isDemo) {
      // Get counts only grouped by lesson id
      this.learnService
      .fetchLessonCounts(this.course._id)
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(
        (results: LessonResult[]) => {
          if (results) {
            this.countTotals(results);
          }
        },
        error => this.errorService.handleError(error)
      );
    } else {
      // Get results grouped by lesson id
      this.learnService
      .fetchLessonResults(this.course._id)
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(
        (results: LessonResult[]) => {
          if (results) {
            this.countTotals(results);
          }
        },
        error => this.errorService.handleError(error)
      );
    }
  }

  private countTotals(results: LessonResult[]) {
    const activeLessonIds: string[] = this.getActiveLessonIds();
    let cntCompleted = 0;
    // Count totals per lesson
    if (results) {
      results.forEach(result => {
        if (activeLessonIds.find(id => id === result._id)) {
          if (!this.resultsByLesson[result._id].introOnly) {
            this.resultsByLesson[result._id] = result;
            this.resultsByLesson[result._id].hasStarted = !!(result.learned || result.studied);
            this.resultsByLesson[result._id].hasCompleted = result.learned >= result.total;
            cntCompleted += this.resultsByLesson[result._id].hasCompleted ? 1 : 0;
          }
        }
      });
    }
    // Check if chapter is complete
    this.courseChapters.forEach(chapter => {
      if (this.chapterLessons[chapter]) {
        this.chapterLessons[chapter].forEach(lesson => {
          if (this.resultsByLesson[lesson._id]) {
            if (this.hasStudyOrPractise(lesson)) {
              this.resultsByChapter[chapter].learned += this.resultsByLesson[lesson._id].learned || 0;
              this.resultsByChapter[chapter].total += this.resultsByLesson[lesson._id].total || 0;
            }
          }
        });
        this.resultsByChapter[chapter].hasCompleted = 
          this.resultsByChapter[chapter].total > 0 &&
          this.resultsByChapter[chapter].learned >= this.resultsByChapter[chapter].total;
      }
    });
    // Check if course is complete
    if (cntCompleted === activeLessonIds.length) {
      this.isCourseComplete = true;
      this.currentChapter = null;
      this.currentLessonId = null;
      this.courseCompleted.emit(true);
    }
  }

  private hasStudyOrPractise(lesson: LessonHeader): boolean {
    // Check if lesson has a study or practise step
    // If not, do not count words
    if (lesson.exerciseSteps.study.active || lesson.exerciseSteps.practise.active) {
      return true;
    } else {
      return false;
    }
  }

  private getActiveLessonIds(): string[] {
    const lessonIds = [];
    this.course.lessons.forEach(chapter => {
      chapter.lessonIds.forEach(lessonId => {
        lessonIds.push(lessonId);
      });
    });
    return lessonIds;
  }

  private fetchLesson(lessonId: string, rehearse: string = null, skipTo: string = null) {
    this.learnService
    .fetchLesson(lessonId)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      (lesson: Lesson) => {
        if (rehearse) {
          lesson.rehearseStep = rehearse;
          this.rehearseLesson.emit(lesson);
        } else if (skipTo) {
          lesson.skipToStep = skipTo;
          this.goToIntro.emit(lesson);
        } else {
          this.currentLesson.emit(lesson);
        }
      },
      error => this.errorService.handleError(error)
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
