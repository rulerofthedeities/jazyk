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
  @Input() isLearnedLevel: number;
  @Input() currentLessonId: string;
  @Output() currentLesson = new EventEmitter<Lesson>();
  private componentActive = true;
  courseChapters: string[] = [];
  chapterLessons: Map<LessonHeader[]> = {};
  currentChapter: string;
  lessonData: Lesson;
  isLessonsReady = false;

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
    console.log('selected lesson', lessonId);
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
      console.log('CHILD LESSON', this.lessonData);
      this.currentLesson.emit(this.lessonData);
    }
  }

  getLessons(chapterName: string): LessonHeader[] {
    return this.chapterLessons[chapterName];
  }

  private getCourseChapters() {
    this.courseChapters = JSON.parse(JSON.stringify(this.course.chapters)); // slice for no reference
    console.log('course chapters', this.courseChapters);
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
    this.courseChapters.forEach(chapterName => {
      this.chapterLessons[chapterName] = lessonHeaders.filter(lesson => lesson.chapterName === chapterName);
    });
    // Get current chapter
    const currentLesson = lessonHeaders.find(lesson => lesson._id === this.currentLessonId);
    if (currentLesson) {
      this.currentChapter = currentLesson.chapterName;
    }
    console.log('current chapter', this.currentChapter);
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
