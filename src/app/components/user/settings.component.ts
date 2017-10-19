import {Component, OnInit, OnDestroy} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';
import {UserService} from '../../services/user.service';
import {ErrorService} from '../../services/error.service';
import {UtilsService} from '../../services/utils.service';
import 'rxjs/add/operator/takeWhile';


@Component({
  templateUrl: 'settings.component.html',
  styleUrls: ['user.css', 'settings.component.css']
})

export class UserSettingsComponent implements OnInit, OnDestroy {
  private componentActive = true;
  text: Object = {};
  settingsForm: FormGroup;
  formData: FormData;
  isFormReady = false;
  tab = 'config';

  constructor(
    private formBuilder: FormBuilder,
    private utilsService: UtilsService,
    private userService: UserService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.getTranslations();
  }

  onChangeTab(newTab: string) {
    this.tab = newTab;
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
