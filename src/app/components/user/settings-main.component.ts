import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { SharedService } from '../../services/shared.service';
import { ErrorService } from '../../services/error.service';
import { Language } from '../../models/main.model';
import { MainSettings, ReadSettings, AppSettings } from '../../models/user.model';
import { takeWhile } from 'rxjs/operators';

interface FormData {
  lans: Language[];
  myLans: Language[];
  delays: number[];
}

@Component({
  selector: 'km-user-settings-main',
  templateUrl: 'settings-main.component.html',
  styleUrls: ['settings-main.component.css']
})

export class UserSettingsMainComponent implements OnInit, OnDestroy {
  @Input() text: Object;
  private componentActive = true;
  mainForm: FormGroup;
  isReady = false;
  infoMsg = '';
  interfaceLanguages: Language[];
  myLanguages: Language[];
  formData: FormData;

  constructor(
    private formBuilder: FormBuilder,
    private sharedService: SharedService,
    private userService: UserService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.getDependables();
    this.buildForm();
  }

  onSetFlag(field: string, status: boolean) {
    this.setFlag(field, status);
  }

  onSetGender(gender: string) {
    this.setFlag('gender', gender);
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

  private setFlag(field: string, status: any) {
    this.mainForm.patchValue({[field]: status});
    this.mainForm.markAsDirty();
    this.infoMsg = '';
  }

  private buildForm() {
    const user = this.userService.user;
    this.mainForm = this.formBuilder.group({
      lan: [user.main.lan],
      myLan: [user.main.myLan || user.main.lan],
      background: [user.main.background],
      gender: [user.main.gender],
      countDown: [user.jazyk.read.countdown],
      delay: [user.jazyk.read.delay || 3],
    });
  }

  private updateSettings(settings: AppSettings) {
    this.userService
    .saveSettings(settings)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      result => {
        this.infoMsg = this.text['SettingsUpdated'];
        this.mainForm.markAsPristine();
        if (this.userService.user.main.lan !== settings.main.lan) {
          this.userService.interfaceLanChanged(settings.main.lan);
        }
        if (this.userService.user.main.background !== settings.main.background) {
          this.userService.backgroundImgChanged(settings.main.background);
        }
        this.userService.user.main = settings.main;
        this.userService.user.jazyk.read = settings.read;
      },
      error => this.errorService.handleError(error)
    );
  }

  private buildSettings(formValues: any): {main: MainSettings, read: ReadSettings} {
    return {
      main: {
        lan: formValues['lan'],
        myLan: formValues['myLan'],
        background: formValues['background'],
        gender: formValues['gender']
      },
      read: {
        lan: this.userService.user.jazyk.read.lan,
        countdown: formValues['countDown'],
        delay: formValues['delay']
      }
    };
  }

  private setFormData() {
    this.formData = {
      lans: this.interfaceLanguages,
      myLans: this.myLanguages,
      delays: [1, 2, 3, 5, 9]
    };
  }

  private setInterfaceLanguages(languages: Language[]) {
    this.interfaceLanguages = languages;
  }

  private setUserLanguages(languages: Language[]) {
    this.myLanguages = languages;
  }

  private getDependables() {
    const options = {
      getLanguages: true
    };
    this.sharedService
    .fetchDependables(options)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      dependables => {
        this.setInterfaceLanguages(dependables.languages);
        this.setUserLanguages(dependables.userLanguages);
        this.setFormData();
        this.isReady = true;
      },
      error => this.errorService.handleError(error)
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
