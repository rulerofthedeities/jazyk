import {Component, Input, Output, OnInit, OnDestroy, EventEmitter, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, FormArray, FormControl, Validators} from '@angular/forms';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {Lesson, LanPair, CourseDefaults} from '../../models/course.model';
import {ExerciseStep} from '../../models/exercise.model';
import {AutocompleteComponent} from '../fields/autocomplete.component';

enum Steps {Intro, Dialogue, Study, Practise, Exam};

@Component({
  selector: 'km-build-lesson-header',
  templateUrl: 'lesson-header.component.html',
  styleUrls: ['lesson-header.component.css']
})

export class BuildLessonHeaderComponent implements OnInit, OnDestroy {
  @Input() courseId: string;
  @Input() languagePair: LanPair;
  @Input() lesson: Lesson;
  @Input() lessons: Lesson[];
  @Input() defaults: CourseDefaults;
  @Input() chapters: string[];
  @Input() regions: string[] = [];
  @Input() nr: number;
  @Input() text: Object;
  @Output() done = new EventEmitter<Lesson>();
  @Output() doneandgo = new EventEmitter<Lesson>();
  @ViewChild(AutocompleteComponent) autocomplete: AutocompleteComponent;
  private componentActive = true;
  private bidirectional = [false, false, false, true, false];
  private ordered = [false, false, true, false, true];
  private active = [false, false, true, true, true];
  lessonForm: FormGroup;
  chapterForm: FormGroup;
  isFormReady = false;
  isNew = true;
  isSubmitted = false;
  tpeLabels = ['Intro', 'Dialogue', 'Study', 'Practise', 'Exam'];
  steps = Steps;

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

  onSubmit(formValues: any, goToLesson: false) {
    this.processLesson(formValues);

    if (this.lesson._id) {
      this.updateLesson();
    } else {
      this.addLesson(goToLesson);
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

  onToggleOrdered(event: MouseEvent, i: number) {
    event.preventDefault();
    event.stopPropagation();
    this.ordered[i] = !this.ordered[i];
  }

  onSetFlag(field: string, status: boolean) {
    this.lessonForm.patchValue({[field]: status});
    this.lessonForm.markAsDirty();
  }

  onSetRegion(newRegion: string) {
    this.lessonForm.patchValue({'region': newRegion});
    this.lessonForm.markAsDirty();
  }

  isLastActive(i: number) {
    // Exam can only be active if practise is active
    if (!this.lessonForm.value['exerciseSteps'][3]) {
      const steps = this.lessonForm.value['exerciseSteps'];
      if (steps[4]) {
        console.log('practise is not active');
        const active = this.lessonForm.value['exerciseSteps'].filter(step => step === true);
        if (active.length === 1) {
          // Nothing is enabled, enable practise
          steps[3] = true;
        } else {
          // Exam is active, disable
          steps[4] = false;
        }
        this.lessonForm.patchValue({exerciseSteps: steps});
      }
    }
    // One lesson type must be active
    // If the last one is selected it cannot be disabled
    if (this.lessonForm.value['exerciseSteps'][i]) {
      const active = this.lessonForm.value['exerciseSteps'].filter(step => step === true);
      return active.length === 1;
    }
  }

  private editLesson() {
    this.isNew = false;
    this.courseId = this.lesson.courseId;
    this.languagePair = this.lesson.languagePair;
    this.bidirectional = [
      this.lesson.exerciseSteps.intro.bidirectional,
      this.lesson.exerciseSteps.dialogue.bidirectional,
      this.lesson.exerciseSteps.study.bidirectional,
      this.lesson.exerciseSteps.practise.bidirectional,
      this.lesson.exerciseSteps.exam.bidirectional
    ];
    this.ordered = [
      this.lesson.exerciseSteps.intro.ordered,
      this.lesson.exerciseSteps.dialogue.ordered,
      this.lesson.exerciseSteps.study.ordered,
      this.lesson.exerciseSteps.practise.ordered,
      this.lesson.exerciseSteps.exam.ordered
    ];
    this.active = [
      this.lesson.exerciseSteps.intro.active,
      this.lesson.exerciseSteps.dialogue.active,
      this.lesson.exerciseSteps.study.active,
      this.lesson.exerciseSteps.practise.active,
      this.lesson.exerciseSteps.exam.active
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
      chapterName: '',
      options: {
        caseSensitive: this.defaults.caseSensitive,
        addArticle: this.defaults.addArticle,
        region: this.defaults.region
      },
      exerciseSteps: {
        intro: {
          active: false,
          bidirectional: false,
          ordered: false},
        dialogue: {
          active: false,
          bidirectional: false,
          ordered: false},
        study: {
          active: true,
          bidirectional: false,
          ordered: false},
        practise: {
          active: true,
          bidirectional: true,
          ordered: false},
        exam: {
          active: true,
          bidirectional: false,
          ordered: false}
      },
      exercises: [],
      difficulty: 0
    };
    this.buildForm();
  }

  private buildForm() {
    const exerciseStepControls: FormControl[] = [];
    for (let i = 0; i < this.tpeLabels.length; i++) {
      exerciseStepControls.push(new FormControl(this.active[i]));
    }
    this.lessonForm = this.formBuilder.group({
      name: [this.lesson.name, [Validators.required]],
      exerciseSteps: new FormArray(exerciseStepControls),
      caseSensitive: [this.lesson.options.caseSensitive],
      addArticle: [this.lesson.options.addArticle],
      region: [this.lesson.options.region]
    });
    this.isFormReady = true;
  }

  private processLesson(formValues: any) {
    const chapterName = this.autocomplete.currentItem ? this.autocomplete.currentItem : '';
    this.lesson.chapterName = chapterName;
    this.lesson.name = formValues.name;
    this.lesson.options = {
      caseSensitive: formValues.caseSensitive,
      addArticle: formValues.addArticle,
      region: formValues.region
    };
    this.lesson.exerciseSteps = {
      intro: this.setExerciseStep(formValues, Steps.Intro),
      dialogue: this.setExerciseStep(formValues, Steps.Dialogue),
      study: this.setExerciseStep(formValues, Steps.Study),
      practise: this.setExerciseStep(formValues, Steps.Practise),
      exam: this.setExerciseStep(formValues, Steps.Exam)
    };
  }

  private setExerciseStep(formValues: any, step: number): ExerciseStep {
    return {
      active: formValues.exerciseSteps[step],
      bidirectional: this.bidirectional[step],
      ordered: this.ordered[step]
    }
  }

  private addLesson(goToLesson: boolean) {
    this.lesson.languagePair = this.languagePair;
    this.buildService
    .addLesson(this.lesson)
    .takeWhile(() => this.componentActive)
    .subscribe(
      savedLesson => {
        this.lesson = savedLesson;
        if (goToLesson) {
          this.doneandgo.emit(savedLesson);
        } else {
          this.done.emit(savedLesson);
        }
      },
      error => this.errorService.handleError(error)
    );
  }

  private updateLesson() {
    this.buildService
    .updateLessonHeader(this.lesson)
    .takeWhile(() => this.componentActive)
    .subscribe(
      updatedLesson => this.done.emit(this.lesson),
      error => this.errorService.handleError(error)
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
