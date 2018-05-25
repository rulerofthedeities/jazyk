import {Component, Input, ViewChild, ElementRef, OnChanges, AfterViewChecked} from '@angular/core';
import {Keyboard} from '../../models/course.model';
import {ExerciseData, ExerciseExtraData} from '../../models/exercise.model';
import {UtilsService} from '../../services/utils.service';

interface Solution {
  solution: string;
  msg: string;
}

@Component({
  selector: 'km-word-field',
  templateUrl: 'exercise-word-field.component.html',
  styleUrls: ['field.css', 'exercise-word-field.component.css']
})

export class LearnWordFieldComponent implements OnChanges, AfterViewChecked {
  @Input() lan: string;
  @Input() prefix: string;
  @Input() disabled: boolean;
  @Input() data: ExerciseData;
  @Input() keyboard: Keyboard;
  @Input() solution: Solution;
  @Input() instruction: string;
  @ViewChild('answer') answer: ElementRef;
  exData: ExerciseExtraData;

  constructor(
    private utilsService: UtilsService
  ) {}

  ngOnChanges() {
    this.exData = this.data.data;
  }

  ngAfterViewChecked() {
    this.answer.nativeElement.focus();
  }

  onKeySelected(key: string) {
    this.utilsService.insertKey(this.answer.nativeElement, key);
  }

  getData(): string {
    return this.answer.nativeElement.value;
  }

  clearData() {
    this.answer.nativeElement.value = '';
  }
}
