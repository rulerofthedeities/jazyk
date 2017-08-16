import {Component, Input, Output, EventEmitter} from '@angular/core';
import {LearnSettings} from '../../models/user.model';

@Component({
  selector: 'km-learn-settings',
  templateUrl: 'settings.component.html',
  styleUrls: ['settings.component.css']
})

export class LearnSettingsComponent {
  @Input() step: string;
  @Input() hasGenus = false;
  @Input() isInput = false;
  @Input() settings: LearnSettings;
  @Input() isActive = true;
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

  onToggleKeyboard() {
    if (this.isInput) {
      this.settings.keyboard = !this.settings.keyboard;
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

