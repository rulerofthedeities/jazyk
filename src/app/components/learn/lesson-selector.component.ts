import {Component, Input, OnInit, OnDestroy} from '@angular/core';
import {Course, Lesson} from '../../models/course.model';
import {LearnService} from '../../services/learn.service';
import {ErrorService} from '../../services/error.service';

interface LessonHeader {
  _id: string;
  name: string;
  chapterName: string;
}

@Component({
  selector: 'km-lesson-selector',
  templateUrl: 'lesson-selector.component.html'
})

export class LearnLessonSelectorComponent implements OnInit, OnDestroy {
  @Input() course: Course;
  @Input() text: Object;
  private componentActive = true;
  currentChapter: string;
  currentLesson: Lesson;
  lessons: LessonHeader[] = [];
  currentChapterLessons: LessonHeader[] = [];
  isReady = false;

  constructor(
    private learnService: LearnService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    if (this.course.chapters) {
      this.currentChapter = this.course.chapters[0];
    }
    this.getLessons();
  }

  getChapterLessons(chapterName: string) {
    // First get ids from course to get correct order
    // Next find corresponding lesson names in this.lessons
    this.currentChapterLessons = [];
    const chapterLessons = this.course.lessons.filter(lesson => lesson.chapter === chapterName);
    let lessonHeader;
    if (chapterLessons.length > 0) {
      const chapterLessonIds = chapterLessons[0].lessonIds;
      chapterLessonIds.forEach( (lessonId, i) => {
        lessonHeader = this.lessons.find(lesson => lesson._id === lessonId);
        if (lessonHeader) {
          this.currentChapterLessons.push(lessonHeader);
          if (i === 0) {
            this.getLesson(lessonId);
          }
        }
      });
    }
  }

  private getLessons() {
    // Get all lesson headers for this course
    this.learnService
    .fetchLessonHeaders(this.course._id)
    .takeWhile(() => this.componentActive)
    .subscribe(
      lessons => {
        this.lessons = lessons;
        this.getFirstChapterLessons();
      },
      error => this.errorService.handleError(error)
    );
    this.isReady = true;
  }

  private getFirstChapterLessons() {
    if (this.course.chapters.length > 0) {
      this.getChapterLessons(this.course.chapters[0]);
    } else {
      this.getChapterLessons('');
    }
  }

  private getLesson(lessonId: string) {
    // Get all data for this particular lesson
    console.log('getting data for lesson', lessonId);
    this.learnService
    .fetchLesson(lessonId)
    .takeWhile(() => this.componentActive)
    .subscribe(
      lesson => {
        console.log('current lesson', lesson);
        this.currentLesson = lesson;
      },
      error => this.errorService.handleError(error)
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
