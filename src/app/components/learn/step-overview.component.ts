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
  private componentActive = true;
  courseChapters: string[] = [];
  chapterLessons: Map<LessonHeader[]> = {};
  resultsByLesson: Map<LessonResult[]> = {};
  currentChapter: string;
  lessonData: Lesson;
  isLessonsReady = false;
  hasChapters: boolean;

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

  onContinueLesson() {
    if (this.lessonData) {
      this.currentLesson.emit(this.lessonData);
    }
  }

  getChapterName(chapterName: string) {
    if (chapterName === 'NoChapter') {
      return this.text['NoChapter']
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
      headers => this.getChapterLessons(headers),
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

  private getLessonResults() {
    // Get results grouped by lesson id
    this.learnService
    .fetchLessonResults(this.course._id)
    .takeWhile(() => this.componentActive)
    .subscribe(
      results => {
        results.forEach(result => {
          this.resultsByLesson[result._id] = result;
        })
        console.log('results by lesson', this.resultsByLesson);
      },
      error => this.errorService.handleError(error)
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
