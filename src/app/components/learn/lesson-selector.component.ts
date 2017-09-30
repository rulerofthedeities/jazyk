import {Component, Input, Output, OnInit, OnDestroy, EventEmitter, ViewChild, ElementRef} from '@angular/core';
import {Router} from '@angular/router';
import {Course, Lesson, Level} from '../../models/course.model';
import {LearnService} from '../../services/learn.service';
import {ErrorService} from '../../services/error.service';
import {Subject} from 'rxjs/Subject';
import 'rxjs/add/operator/takeWhile';

interface LessonHeader {
  _id: string;
  name: string;
  chapterName: string;
}

@Component({
  selector: 'km-lesson-selector',
  templateUrl: 'lesson-selector.component.html',
  styleUrls: ['lesson-selector.component.css']
})

export class LearnLessonSelectorComponent implements OnInit, OnDestroy {
  @Input() course: Course;
  @Input() text: Object;
  @Input() courseLevel: Level;
  @Input() private nextLesson: Subject<string>;
  @Output() currentLesson = new EventEmitter<Lesson>();
  @ViewChild('chapter') chapter: ElementRef;
  @ViewChild('lesson') lesson: ElementRef;
  private componentActive = true;
  private currentLessonId: string;
  currentChapter: string;
  currentLessonName: string;
  lessons: LessonHeader[] = [];
  currentChapterLessons: LessonHeader[] = [];
  isReady = false;
  showSelector = false;
  level = Level;

  constructor(
    private router: Router,
    private learnService: LearnService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.nextLesson
    .takeWhile(() => this.componentActive)
    .subscribe(lessonId => {
      console.log('next lesson', lessonId);
      this.navigateLesson(lessonId, 1);
    });
    if (this.courseLevel === Level.Lesson) {
      this.getLessons();
    } else {
      // This is a course level review or exam
      this.currentLesson.emit(null);
    }
  }

  onPreviousChapter(chapterName: string) {
    this.navigateChapter(chapterName, -1);
  }

  onNextChapter(chapterName: string) {
    this.navigateChapter(chapterName, 1);
  }

  onPreviousLesson(lessonId: string) {
    this.navigateLesson(lessonId, -1);
  }

  onNextLesson(lessonId: string) {
    this.navigateLesson(lessonId, 1);
  }

  onChangeChapter(chapterName: string) {
    this.getChapterLessons(chapterName);
  }

  onChangeLesson(lessonId: string) {
    this.getLesson(lessonId);
  }

  onToggleEdit() {
    this.showSelector = !this.showSelector;
  }

/*
  onChangeLevel(newLevel: string) {
    let step = '';
    if (newLevel === 'course') {
      step = '/review';
    }
    this.router.navigate(['/learn/course/' + this.course._id + step]);
  }
*/

  private navigateChapter(chapterName: string, direction: number) {
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

  private navigateLesson(lessonId: string, direction: number) {
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
        if (this.lesson) {
          this.lesson.nativeElement.value = newLesson._id;
        }
        this.getLesson(newLesson._id);
      }
    }
  }

  private getChapterLessons(chapterName: string, getLesson: boolean = true) {
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
        }
      });
      if (getLesson && chapterLessonIds.length > 0) {
        this.getLesson(chapterLessonIds[0]);
      }
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
        this.fetchCurrentLesson();
      },
      error => this.errorService.handleError(error)
    );
    this.isReady = true;
  }

  private fetchCurrentLesson() {
    // Check where this course was left off
    this.learnService
    .fetchMostRecentLesson(this.course._id)
    .takeWhile(() => this.componentActive)
    .subscribe(
      userResult => {
        if (userResult && userResult.lessonId) {
          // set chapter & lesson to the latest result
          console.log('LESSON to load', userResult.lessonId);
          this.getLesson(userResult.lessonId);
        } else {
          // start from beginning of the course
          console.log('NO LESSON to load; start from beginning');
          if (this.course.chapters) {
            this.currentChapter = this.course.chapters[0];
          }
          this.getFirstChapterLessons();
        }
      },
      error => this.errorService.handleError(error)
    );
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
    if (lessonId !== this.currentLessonId) {
      this.learnService
      .fetchLesson(lessonId)
      .takeWhile(() => this.componentActive)
      .subscribe(
        (lesson: Lesson) => {
          this.getChapterLessons(lesson.chapterName, false);
          this.currentLessonName = lesson.name;
          this.currentLessonId = lesson._id;
          this.currentChapter = lesson.chapterName;
          this.currentLesson.emit(lesson);
        },
        error => this.errorService.handleError(error)
      );
    }
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
