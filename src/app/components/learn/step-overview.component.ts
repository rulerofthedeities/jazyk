import {Component, Input, Output, OnInit, OnDestroy, EventEmitter} from '@angular/core';
import {LearnService} from '../../services/learn.service';
import {ErrorService} from '../../services/error.service';
import {Course, Lesson} from '../../models/course.model';
import {Exercise, ExerciseResult, ExerciseData, ExerciseType} from '../../models/exercise.model';

interface Map<T> {
  [K: string]: T;
}

interface LessonHeader {
  _id: string;
  name: string;
  chapterName: string;
}

interface LessonResult {
  _id: string;
  studied: number;
  learned: number;
  total: number; // total nr of exercises in the lesson
  totalwords: number; // nr of exercises op tpe 0 (words) for study count
  hasStarted?: boolean;
  hasCompleted?: boolean;
}

@Component({
  selector: 'km-learn-overview',
  templateUrl: 'step-overview.component.html',
  styleUrls: ['step-overview.component.css']
})

export class LearnOverviewComponent implements OnInit, OnDestroy {
  @Input() private course: Course;
  @Input() text: Object;
  @Input() isDemo = false;
  @Input() isLearnedLevel: number;
  @Input() currentLessonId: string;
  @Output() currentLesson = new EventEmitter<Lesson>();
  @Output() rehearseLesson = new EventEmitter<Lesson>();
  private componentActive = true;
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

  onContinueLesson(lessonId: string) {
    event.stopPropagation();
    console.log('continue lesson', lessonId);
    if (this.lessonData._id === lessonId) {
      this.currentLesson.emit(this.lessonData);
    } else {
      this.fetchLesson(lessonId);
    }
  }

  onRehearseLesson(lessonId: string, step: string, cnt: number) {
    event.stopPropagation();
    console.log('rehearse lesson', lessonId, step, cnt);
    if (cnt > 0) {
      this.lessonData.rehearseStep = step;
      if (this.lessonData._id === lessonId) {
        this.rehearseLesson.emit(this.lessonData);
      } else {
        this.fetchLesson(lessonId, step);
      }
    }
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

  private getCourseChapters() {
    this.courseChapters = JSON.parse(JSON.stringify(this.course.chapters)); // slice for no reference
    this.hasChapters = !!this.courseChapters.length;
    const emptyChapter = this.course.lessons.find(lesson => lesson.chapter === '');
    if (emptyChapter) {
      this.courseChapters.push('NoChapter');
    }
  }

  private getLessonHeaders() {
    // Get all lesson headers for this course
    this.learnService
    .fetchLessonHeaders(this.course._id)
    .takeWhile(() => this.componentActive)
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
    // Group lessons by chapter name
    let filterName;
    this.courseChapters.forEach(chapterName => {
      filterName = chapterName === 'NoChapter' ? '' : chapterName;
      this.chapterLessons[chapterName] = lessonHeaders.filter(lesson => lesson.chapterName === filterName);
    });
    // Get current chapter
    const currentLesson = lessonHeaders.find(lesson => lesson._id === this.currentLessonId);
    if (currentLesson) {
      this.currentChapter = currentLesson.chapterName;
    }
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
        hasCompleted: false
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
    // Get results grouped by lesson id
    console.log('getting Lesson Results');
    this.learnService
    .fetchLessonResults(this.course._id)
    .takeWhile(() => this.componentActive)
    .subscribe(
      (results: LessonResult[]) => {
        if (results) {
          this.countTotals(results);
        }
      },
      error => this.errorService.handleError(error)
    );
  }

  private countTotals(results: LessonResult[]) {
    const activeLessonIds: string[] = this.getActiveLessonIds();
    let cntCompleted = 0;
    // Count totals per lesson
    results.forEach(result => {
      if (activeLessonIds.find(id => id === result._id)) {
        this.resultsByLesson[result._id] = result;
        this.resultsByLesson[result._id].hasStarted = !!(result.learned || result.studied);
        this.resultsByLesson[result._id].hasCompleted = result.learned >= result.total;
        cntCompleted += this.resultsByLesson[result._id].hasCompleted ? 1 : 0;
      }
    });
    // Check if chapter is complete
    this.courseChapters.forEach(chapter => {
      if (this.chapterLessons[chapter]) {
        this.chapterLessons[chapter].forEach(lesson => {
          if (this.resultsByLesson[lesson._id]) {
            this.resultsByChapter[chapter].learned += this.resultsByLesson[lesson._id].learned;
            this.resultsByChapter[chapter].total += this.resultsByLesson[lesson._id].total;
          }
        });
        this.resultsByChapter[chapter].hasCompleted = this.resultsByChapter[chapter].learned >= this.resultsByChapter[chapter].total;
      }
    });
    // Check if course is complete
    console.log('Course complete?', cntCompleted, activeLessonIds.length);
    if (cntCompleted === activeLessonIds.length) {
      this.isCourseComplete = true;
    }
  }

  private getActiveLessonIds(): string[] {
    const lessonIds = [];
    this.course.lessons.forEach(chapter => {
      chapter.lessonIds.forEach(lessonId => {
        lessonIds.push(lessonId);
      })
    })
    return lessonIds;
  }

  private fetchLesson(lessonId: string, rehearse: string = null) {
    this.learnService
    .fetchLesson(lessonId)
    .takeWhile(() => this.componentActive)
    .subscribe(
      (lesson: Lesson) => {
        if (rehearse) {
          lesson.rehearseStep = rehearse;
          this.rehearseLesson.emit(lesson);
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
