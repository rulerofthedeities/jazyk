import {Component, EventEmitter, OnInit, Input, Output} from '@angular/core';
import {LearnService} from '../../services/learn.service';
import {LanPair} from '../../models/course.model';
import {Exercise, ExerciseData, ExerciseTpe, Direction, LearnSettings} from '../../models/exercise.model';

@Component({
  selector: 'km-learn-test',
  templateUrl: 'learn-test.component.html',
  styleUrls: ['learn-item.component.css']
})

export class LearnTestComponent implements OnInit {
  @Input() exercises: Exercise[];
  @Input() lanPair: LanPair[];
  @Input() options: ExerciseTpe;
  @Input() text: Object;
  @Input() settings: LearnSettings;
  @Output() stepCompleted = new EventEmitter();
  @Output() updatedSettings = new EventEmitter<LearnSettings>();
  isTestDone = false;
  exerciseData: ExerciseData[];
  currentData: ExerciseData;
  current = -1;
  isQuestionReady = false;

  constructor(
    private learnService: LearnService
  ) {}

  ngOnInit() {
    this.exerciseData = this.learnService.buildExerciseData(this.exercises, this.text, {
      isForeign: true,
      isBidirectional: false,
      direction: Direction.LocalToForeign
    });
    console.log('ordered', this.options.ordered);
    if (!this.options.ordered) {
      this.exerciseData = this.learnService.shuffle(this.exerciseData);
    }
    console.log('ordered', this.exerciseData);
    this.isQuestionReady = true;
    this.nextWord();
  }

  onSettingsUpdated(settings: LearnSettings) {
    this.settings = settings;
    this.updatedSettings.emit(settings);
  }

  private nextWord() {
    this.current += 1;
    if (this.current >= this.exerciseData.length) {
      this.isTestDone = true;
      this.stepCompleted.emit();
    }
    if (!this.isTestDone) {
      this.currentData = this.exerciseData[this.current];
    }
  }
}
