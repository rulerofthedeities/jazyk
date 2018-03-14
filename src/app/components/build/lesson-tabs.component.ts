import {Component, Input, Output, EventEmitter, OnChanges} from '@angular/core';
import {ExerciseSteps} from '../../models/exercise.model';

@Component({
  selector: 'km-build-lesson-tabs',
  templateUrl: 'lesson-tabs.component.html',
  styleUrls: ['lesson-tabs.component.css']
})

export class BuildLessonTabsComponent implements OnChanges {
  @Input() text: Object;
  @Input() steps: ExerciseSteps;
  @Output() selected = new EventEmitter<string>();
  tab = 'words';

  ngOnChanges() {
    this.setDefaultTab();
  }

  onSelectTab(tab: string) {
    this.tab = tab;
    this.selected.emit(tab);
  }

  private setDefaultTab() {
    this.tab = 'words';
    if (!this.steps.practise.active && !this.steps.study.active) {
      this.tab = 'intro';
    }
    this.selected.emit(this.tab);
  }
}
