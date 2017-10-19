import {Component, Input, OnInit, OnDestroy} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ValidationService} from '../../services/validation.service';
import {UserService} from '../../services/user.service';
import {UtilsService} from '../../services/utils.service';
import {ErrorService} from '../../services/error.service';
import {Language} from '../../models/course.model';
import {MainSettings} from '../../models/user.model';
import 'rxjs/add/operator/takeWhile';

interface FormData {
  lans: Language[];
}

@Component({
  selector: 'km-user-settings-main',
  templateUrl: 'settings-main.component.html'
})

export class UserSettingsMainComponent implements OnInit, OnDestroy {
  @Input() text: Object;
  private componentActive = true;
  mainForm: FormGroup;
  isFormReady = false;
  infoMsg = '';
  formData: FormData;

  constructor(
    private formBuilder: FormBuilder,
    private utilsService: UtilsService,
    private userService: UserService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.buildForm();
    this.setFormData();
  }

  onChangeField() {
    this.errorService.clearError();
  }

  onUpdateSettings(form: any) {
    if (form.valid) {
      const settings = this.buildSettings(form.value);
      this.updateMainSettings(settings);
    }
  }

  private buildForm() {
    this.mainForm = this.formBuilder.group({
      'lan': [this.userService.user.lan]
    });
    this.isFormReady = true;
  }

  private updateMainSettings(settings: MainSettings) {
    this.userService
    .saveMainSettings(settings)
    .takeWhile(() => this.componentActive)
    .subscribe(
      result => {
        this.infoMsg = this.text['SettingsUpdated'];
        this.mainForm.markAsPristine();

        //!!!ALSO UPDATE IN USER PROPERTY
      },
      error => this.errorService.handleError(error)
    );
  }

  private buildSettings(formValues: any): MainSettings {
    return {
      lan: formValues['lan']
    };
  }

  private setFormData() {
    this.formData = {
      lans: this.utilsService.getInterfaceLanguages()
    };
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
