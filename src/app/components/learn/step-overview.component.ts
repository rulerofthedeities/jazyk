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
  }

  onSelectLesson(lessonId: string) {
    this.currentLessonId = lessonId;
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

  ngOnDestroy() {
    this.componentActive = false;
  }
}
