import {Component, Input, Output, EventEmitter} from '@angular/core';
import {LearnSettings} from '../../models/exercise.model';

@Component({
  selector: 'km-learn-settings',
  templateUrl: 'learn-settings.component.html',
  styleUrls: ['learn-settings.component.css']
})

export class LearnSettingsComponent {
  @Input() step: string;
  @Input() hasGenus = false;
  @Input() settings: LearnSettings;
  @Output() updatedSettings = new EventEmitter<LearnSettings>();

  onToggleAudio() {
    this.settings.mute = !this.settings.mute;
    this.settingsUpdated();
  }

  onToggleColor() {
    if (this.hasGenus) {
      this.settings.color = !this.settings.color;
      this.settingsUpdated();
    }
  }

  onNextDelay() {
    this.settings.delay = (this.settings.delay + 1) % 11;
    if (this.settings.delay === 4) {
      this.settings.delay = 5;
    }
    if (this.settings.delay > 5) {
      this.settings.delay = 10;
    }
    this.settingsUpdated();
  }

  private settingsUpdated() {
    this.updatedSettings.emit(this.settings);
  }

}

