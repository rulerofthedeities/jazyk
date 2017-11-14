import {Component, Input, OnInit} from '@angular/core';
import {ExerciseData, Exercise, ExerciseType, Direction} from '../../models/exercise.model';
import {PreviewService} from '../../services/preview.service';
import {LanPair, LessonOptions} from '../../models/course.model';

@Component({
  selector: 'km-preview-question',
  templateUrl: 'preview-question.component.html',
  styleUrls: ['preview-question.component.css']
})

export class PreviewQuestionComponent implements OnInit {
  @Input() exercise: Exercise;
  @Input() lessonOptions: LessonOptions;
  @Input() text: Object;
  @Input() lanPair: LanPair;
  exType = ExerciseType;
  exerciseData: ExerciseData;
  direction = 'local';

  constructor(
    private previewService: PreviewService
  ) {}

  ngOnInit() {
    console.log('preview', this.exercise);
    this.exerciseData = {
      exercise: this.exercise,
      data: {isCaseSensitive: this.lessonOptions.caseSensitive},
      result: {}
    };
    this.previewService.buildLocalData(this.exerciseData, this.text, this.exercise);
    console.log('exercise Data', this.exerciseData);
  }

  onSwitchDirection() {
    if (this.direction === 'local') {
      this.previewService.buildForeignData(this.exerciseData, this.text, this.exercise);
      this.direction = 'foreign';
    } else {
      this.previewService.buildLocalData(this.exerciseData, this.text, this.exercise);
      this.direction = 'local';
    }
  }
}
