import {Component, Input, OnInit, OnDestroy} from '@angular/core';
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
  @Input() currentLessonId: string;
  private componentActive = true;
  courseChapters: string[] = [];
  chapterLessons: Map<LessonHeader[]> = {};
  currentChapter: string;
  isLessonsReady = false;

  constructor(
    private learnService: LearnService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.getCourseChapters();
    this.getLessonHeaders();
  }

  getLessons(chapterName: string): LessonHeader[] {
    return this.chapterLessons[chapterName];
  }

  onSelectLesson(lessonId: string) {
    this.currentLessonId = lessonId;
    console.log('selected lesson', lessonId);
  }

  onSelectChapter(chapterName: string) {
    this.currentChapter = chapterName;
  }

  private getCourseChapters() {
    this.courseChapters = this.course.chapters.slice(); // slice for no reference
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
