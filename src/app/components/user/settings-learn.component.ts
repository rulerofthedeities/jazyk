import {Component, Input, OnInit, OnDestroy} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {UserService} from '../../services/user.service';
import {UtilsService} from '../../services/utils.service';
import {ErrorService} from '../../services/error.service';
import {LearnSettings} from '../../models/user.model';
import {takeWhile} from 'rxjs/operators';

interface FormData {
  nrofwords: number[];
  delays: number[];
}

@Component({
  selector: 'km-user-settings-learn',
  templateUrl: 'settings-learn.component.html',
  styleUrls: ['user.css']
})

export class UserSettingsLearnComponent implements OnInit, OnDestroy {
  @Input() text: Object;
  private componentActive = true;
  learnForm: FormGroup;
  isFormReady = false;
  formData: FormData;
  infoMsg: string;

  constructor(
    private formBuilder: FormBuilder,
    private utilsService: UtilsService,
    private userService: UserService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.fetchSettings();
    this.setFormData();
  }

  onSetFlag(field: string, status: boolean) {
    this.learnForm.patchValue({[field]: status});
    this.learnForm.markAsDirty();
    this.infoMsg = '';
  }

  onChangeField() {
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
    .pipe(takeWhile(() => this.componentActive))
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
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      result => {
        this.userService.updateUserSettings(newSettings);
        this.infoMsg = this.text['SettingsUpdated'];
        this.learnForm.markAsPristine();
      },
      error => this.errorService.handleError(error)
    );
  }

  private buildSettings(formValues: any): LearnSettings {
    return {
      lan: formValues['lan'],
      nrOfWordsStudy: parseInt(formValues['nrOfWordsStudy'], 10),
      nrOfWordsLearn: parseInt(formValues['nrOfWordsLearn'], 10),
      nrOfWordsReview: parseInt(formValues['nrOfWordsReview'], 10),
      nrOfWordsStudyRepeat: parseInt(formValues['nrOfWordsStudyRepeat'], 10),
      nrOfWordsLearnRepeat: parseInt(formValues['nrOfWordsLearnRepeat'], 10),
      countdown: formValues['countDown'],
      mute: formValues['mute'],
      color: formValues['color'],
      delay: parseInt(formValues['delay'], 10),
      keyboard: formValues['keyboard']
    };
  }

  private buildForm(settings: LearnSettings) {
    this.learnForm = this.formBuilder.group({
      color: [settings.color],
      countDown: [settings.countdown],
      delay: [settings.delay || 3],
      keyboard: [settings.keyboard],
      lan: [settings.lan],
      mute: [settings.mute],
      nrOfWordsStudy: [settings.nrOfWordsStudy || 5],
      nrOfWordsLearn: [settings.nrOfWordsLearn || 5],
      nrOfWordsReview: [settings.nrOfWordsReview || 5],
      nrOfWordsStudyRepeat: [settings.nrOfWordsStudyRepeat || 10],
      nrOfWordsLearnRepeat: [settings.nrOfWordsLearnRepeat || 10]
    });
    this.isFormReady = true;
  }

  private setFormData() {
    this.formData = {
      nrofwords: [3, 5, 7, 10, 20],
      delays: [1, 2, 3, 5, 9]
    };
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
