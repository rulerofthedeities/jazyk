import {Component, Input, OnInit, OnDestroy} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {UserService} from '../../services/user.service';
import {UtilsService} from '../../services/utils.service';
import {ErrorService} from '../../services/error.service';
import {Language} from '../../models/course.model';
import {MainSettings} from '../../models/user.model';
import {takeWhile} from 'rxjs/operators';

interface FormData {
  lans: Language[];
  myLans: Language[];
}

@Component({
  selector: 'km-user-settings-main',
  templateUrl: 'settings-main.component.html',
  styles: [`
    .gender {
      font-size: 24px;
      color: grey;
      cursor: pointer;
    }
    .gen-selected {
      color: green;
    }
  `]
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
    private utilsService: UtilsService,
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
      this.updateMainSettings(settings);
    }
  }

  private setFlag(field: string, status: any) {
    this.mainForm.patchValue({[field]: status});
    this.mainForm.markAsDirty();
    this.infoMsg = '';
  }

  private buildForm() {
    this.mainForm = this.formBuilder.group({
      'lan': [this.userService.user.main.lan],
      'myLan': [this.userService.user.main.myLan || this.userService.user.main.lan],
      'background': [this.userService.user.main.background],
      'gender': [this.userService.user.main.gender]
    });
  }

  private updateMainSettings(settings: MainSettings) {
    this.userService
    .saveMainSettings(settings)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      result => {
        this.infoMsg = this.text['SettingsUpdated'];
        this.mainForm.markAsPristine();
        if (this.userService.user.main.lan !== settings.lan) {
          this.userService.interfaceLanChanged(settings.lan);
        }
        if (this.userService.user.main.background !== settings.background) {
          this.userService.backgroundImgChanged(settings.background);
        }
        this.userService.user.main = settings;
      },
      error => this.errorService.handleError(error)
    );
  }

  private buildSettings(formValues: any): MainSettings {
    return {
      lan: formValues['lan'],
      myLan: formValues['myLan'],
      background: formValues['background'],
      gender: formValues['gender']
    };
  }

  private setFormData() {
    this.formData = {
      lans: this.interfaceLanguages,
      myLans: this.myLanguages
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
    this.utilsService
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
