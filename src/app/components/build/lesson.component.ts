import {Component, OnInit, OnDestroy} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {Lesson} from '../../models/course.model';
import {WordPairDetail, Exercise} from '../../models/exercise.model';
import 'rxjs/add/operator/takeWhile';

@Component({
  selector: 'km-build-lesson',
  templateUrl: 'lesson.component.html',
  styles: [`
    .lesson {position: relative;}
    .filter {
      position: absolute;
    }
    .exercise {
      position: absolute;
      left: 250px;
      margin-top:50px;
    }
  `]
})

export class BuildLessonComponent implements OnInit, OnDestroy {
  componentActive = true;
  lesson: Lesson;
  currentWordPairDetail: WordPairDetail;
  exercises: Exercise[];
  isNewWord = false;

  constructor(
    private route: ActivatedRoute,
    private buildService: BuildService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.route.params
    .takeWhile(() => this.componentActive)
    .subscribe(
      params => {
        if (params['id']) {
          const lessonId = params['id'];
          this.getLesson(lessonId);
        }
      }
    );
  }

  onWordSelected(word: WordPairDetail) {
    this.currentWordPairDetail = word;
  }

  onNewWord() {
    this.isNewWord = true;
  }

  getLesson(lessonId: string) {
    this.buildService
    .fetchLesson(lessonId)
    .takeWhile(() => this.componentActive)
    .subscribe(
      lesson => this.lesson = lesson,
      error => this.errorService.handleError(error)
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
