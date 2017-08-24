import {Component, Input, Output, OnInit, OnDestroy, EventEmitter, ViewChild, ElementRef} from '@angular/core';
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
  templateUrl: 'lesson-selector.component.html',
  styles: [`
    .panel {
      background-color: rgba(239, 239, 239, .9);
    }
    .title {
      margin-bottom: 4px;
    }
    .title h2 {
      margin: 0;
    }
  `]
})

export class LearnLessonSelectorComponent implements OnInit, OnDestroy {
  @Input() course: Course;
  @Input() text: Object;
  @Output() currentLesson = new EventEmitter<Lesson>();
  @ViewChild('chapter') chapter: ElementRef;
  @ViewChild('lesson') lesson: ElementRef;
  private componentActive = true;
  currentChapter: string;
  currentLessonName: string;
  lessons: LessonHeader[] = [];
  currentChapterLessons: LessonHeader[] = [];
  isReady = false;
  showSelector = false;

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

  onPreviousChapter(chapterName: string) {
    this.changeChapter(chapterName, -1);
  }

  onNextChapter(chapterName: string) {
    this.changeChapter(chapterName, 1);
  }

  onPreviousLesson(lessonId: string) {
    this.changeLesson(lessonId, -1);
  }

  onNextLesson(lessonId: string) {
    this.changeLesson(lessonId, 1);
  }

  onGetChapterLessons(chapterName: string) {
    this.getChapterLessons(chapterName);
  }

  onToggleEdit() {
    this.showSelector = !this.showSelector;
  }

  private changeChapter(chapterName: string, direction: number) {
    const len = this.course.chapters.length;
    if (this.course.chapters && len > 1) {
      let i = this.course.chapters.indexOf(chapterName);
      if (i >= 0) {
        i += direction;
        if (i < 0) {
          i = len - 1;
        } else {
          i = i % len;
        }
        const newChapter = this.course.chapters[i];
        this.currentChapter = newChapter;
        this.chapter.nativeElement.value = newChapter;
        this.getChapterLessons(newChapter);
      }
    }
  }

  private changeLesson(lessonId: string, direction: number) {
    console.log('lessons', this.currentChapterLessons);
    console.log('change lesson', lessonId, direction);
    const len = this.currentChapterLessons.length;
    if (this.currentChapterLessons && len > 1) {
      let i = this.currentChapterLessons.findIndex(lesson => lesson._id === lessonId);
      if (i >= 0) {
        i += direction;
        if (i < 0) {
          i = len - 1;
        } else {
          i = i % len;
        }
        const newLesson = this.currentChapterLessons[i];
        this.currentLessonName = newLesson.name;
        this.lesson.nativeElement.value = newLesson._id;
      }
    }
  }

  private getChapterLessons(chapterName: string) {
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
    this.learnService
    .fetchLesson(lessonId)
    .takeWhile(() => this.componentActive)
    .subscribe(
      lesson => {
        this.currentLessonName = lesson.name;
        this.currentLesson.emit(lesson);
      },
      error => this.errorService.handleError(error)
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
