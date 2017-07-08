import {Component, Input, Output, OnInit, OnDestroy, EventEmitter, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, FormArray, FormControl, Validators} from '@angular/forms';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {Chapter, Lesson, LanPair} from '../../models/course.model';
import {AutocompleteComponent} from '../fields/autocomplete.component';

@Component({
  selector: 'km-build-lesson-header',
  templateUrl: 'lesson-header.component.html',
  styles: [`
    .btn-group .fa {
      width: 18px;
    }
    .fa-check {
      color: green;
    }
    .fa-times {
      color: red;
    }
    .fa-exchange {
      color: #ccc;
    }
    .fa-exchange:hover {
      color: #999;
    }
    .fa-exchange.sel {
      color: green;
    }
  `]
})

export class BuildLessonHeaderComponent implements OnInit, OnDestroy {
  @Input() courseId: string;
  @Input() languagePair: LanPair;
  @Input() lesson: Lesson;
  @Input() lessons: Lesson[];
  @Input() chapters: Chapter[];
  @Input() nr: number;
  @Input() text: Object;
  @Output() done = new EventEmitter<Lesson>();
  @ViewChild(AutocompleteComponent) autocomplete: AutocompleteComponent;
  private componentActive = true;
  private bidirectional = [false, true, false, false];
  private active = [true, true, true, true];
  lessonForm: FormGroup;
  chapterForm: FormGroup;
  isFormReady = false;
  isNew = true;
  isSubmitted = false;
  tpeLabels = ['Study', 'Practise', 'Test', 'Exam'];

  constructor(
    private formBuilder: FormBuilder,
    private buildService: BuildService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    if (this.lesson) {
      this.editLesson();
    } else {
      this.createNewLesson();
    }
  }

  onCancel() {
    this.done.emit(null);
  }

  onSubmit(formValues: any) {
    this.processLesson(formValues);

    if (this.lesson._id) {
      this.updateLesson();
    } else {
      this.addLesson();
    }
    this.isSubmitted = true;
  }

  onFocusName() {
    this.autocomplete.showList = false;
  }

  onToggleBidirectional(event: MouseEvent, i: number) {
    event.preventDefault();
    event.stopPropagation();
    this.bidirectional[i] = !this.bidirectional[i];
  }

  private editLesson() {
    console.log('editing lesson', this.lesson);
    this.isNew = false;
    this.courseId = this.lesson.courseId;
    this.languagePair = this.lesson.languagePair;
    this.bidirectional = [
      this.lesson.exerciseTpes.learn.bidirectional,
      this.lesson.exerciseTpes.practise.bidirectional,
      this.lesson.exerciseTpes.test.bidirectional,
      this.lesson.exerciseTpes.exam.bidirectional
    ];
    this.active = [
      this.lesson.exerciseTpes.learn.active,
      this.lesson.exerciseTpes.practise.active,
      this.lesson.exerciseTpes.test.active,
      this.lesson.exerciseTpes.exam.active
      ];
    this.buildForm();
  }

  private createNewLesson() {
    this.isNew = true;
    this.lesson = {
      _id: '',
      courseId: this.courseId,
      languagePair: this.languagePair,
      name: '',
      nr: 1,
      chapter: '',
      chapterNr: 1,
      exerciseTpes: {
        learn: {active: true, bidirectional: false},
        practise: {active: true, bidirectional: true},
        test: {active: true, bidirectional: false},
        exam: {active: true, bidirectional: false}
      },
      exercises: [],
      difficulty: 0,
      isPublished: false
    };
    this.buildForm();
  }

  private buildForm() {
    const exerciseTpeControls: FormControl[] = [];
    for (let i = 0; i < 4; i++) {
      exerciseTpeControls.push(new FormControl(this.active[i]));
    }
    this.lessonForm = this.formBuilder.group({
      name: [this.lesson.name],
      nr: [this.lesson.nr],
      exerciseTpes: new FormArray(exerciseTpeControls)
    });
    this.isFormReady = true;
  }

  private processLesson(formValues: any) {
    const chapterName = this.autocomplete.currentItem.name ? this.autocomplete.currentItem.name : '',
          chapterNr = this.autocomplete.currentItem.nr ? this.autocomplete.currentItem.nr : 0;
    this.lesson.chapter = chapterName;
    this.lesson.chapterNr = chapterNr;
    this.lesson.name = formValues.name;
    this.lesson.exerciseTpes = {
      learn: {active: formValues.exerciseTpes[0], bidirectional: this.bidirectional[0]},
      practise: {active: formValues.exerciseTpes[1], bidirectional: this.bidirectional[1]},
      test: {active: formValues.exerciseTpes[2], bidirectional: this.bidirectional[2]},
      exam: {active: formValues.exerciseTpes[3], bidirectional: this.bidirectional[3]}
    };
  }

  private addLesson() {
    this.lesson.nr = this.lessons.filter(lesson => lesson.chapter === this.lesson.chapter).length + 1;
    this.lesson.languagePair = this.languagePair;
    this.buildService
    .addLesson(this.lesson)
    .takeWhile(() => this.componentActive)
    .subscribe(
      savedLesson => {
        this.lesson = savedLesson;
        this.done.emit(savedLesson);
      },
      error => this.errorService.handleError(error)
    );
  }

  private updateLesson() {
    this.buildService
    .updateLessonHeader(this.lesson)
    .takeWhile(() => this.componentActive)
    .subscribe(
      updatedCourse => {
        console.log('updated lesson', this.lesson);
        this.done.emit(this.lesson);
      },
      error => this.errorService.handleError(error)
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
