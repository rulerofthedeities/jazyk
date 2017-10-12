import {Component, OnInit, OnDestroy} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';
import {UserService} from '../../services/user.service';
import {ErrorService} from '../../services/error.service';
import {UtilsService} from '../../services/utils.service';
import {LearnSettings} from '../../models/user.model';
import 'rxjs/add/operator/takeWhile';

interface FormData {
  nrofwords: number[];
  delays: number[];
}

@Component({
  templateUrl: 'settings.component.html',
  styleUrls: ['user.component.css']
})

export class UserSettingsComponent implements OnInit, OnDestroy {
  private componentActive = true;
  text: Object = {};
  settingsForm: FormGroup;
  formData: FormData;
  isFormReady = false;
  infoMsg: string;

  constructor(
    private formBuilder: FormBuilder,
    private utilsService: UtilsService,
    private userService: UserService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.getTranslations();
    this.fetchSettings();
    this.setFormData();
  }

  onSetFlag(field: string, status: boolean) {
    this.settingsForm.patchValue({[field]: status});
    this.settingsForm.markAsDirty();
    this.infoMsg = '';
  }

  onUpdateSettings(form: any) {
    if (form.valid) {
      const settings = this.buildSettings(form.value);
      this.updateSettings(settings);
    }
  }

  private fetchSettings() {
    this.userService
    .getLearnSettings()
    .takeWhile(() => this.componentActive)
    .subscribe(
      settings => {
        this.buildForm(settings);
      },
      error => this.errorService.handleError(error)
    );
  }

  private updateSettings(newSettings: LearnSettings) {
    this.userService
    .saveLearnSettings(newSettings)
    .takeWhile(() => this.componentActive)
    .subscribe(
      result => {
        this.infoMsg = this.text['SettingsUpdated'];
        this.settingsForm.markAsPristine();
      },
      error => this.errorService.handleError(error)
    );
  }

  private buildSettings(formValues: any): LearnSettings {
    return {
      lan: formValues['lan'],
      nrOfWords: parseInt(formValues['nrOfWords'], 10),
      countdown: formValues['countDown'],
      mute: formValues['mute'],
      color: formValues['color'],
      delay: parseInt(formValues['delay'], 10),
      keyboard: formValues['keyboard']
    };
  }

  private buildForm(settings: LearnSettings) {
    this.settingsForm = this.formBuilder.group({
      color: [settings.color],
      countDown: [settings.countdown],
      delay: [settings.delay],
      keyboard: [settings.keyboard],
      lan: [settings.lan],
      mute: [settings.mute],
      nrOfWords: [settings.nrOfWords]
    });
    this.isFormReady = true;
  }

  private setFormData() {
    this.formData = {
      nrofwords: [3, 5, 7, 10, 20],
      delays: [0, 1, 2, 3, 5, 10]
    };
  }

  private getTranslations() {
    this.utilsService
    .fetchTranslations(this.userService.user.lan, 'UserComponent')
    .takeWhile(() => this.componentActive)
    .subscribe(
      translations => {
        if (translations) {
          this.text = this.utilsService.getTranslatedText(translations);
        }
      },
      error => this.errorService.handleError(error)
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
