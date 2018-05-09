import {Component, OnInit, OnDestroy} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';
import {UserService} from '../../services/user.service';
import {ErrorService} from '../../services/error.service';
import {UtilsService} from '../../services/utils.service';
import {takeWhile} from 'rxjs/operators';

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
  tab = 'main';

  constructor(
    private formBuilder: FormBuilder,
    private utilsService: UtilsService,
    private userService: UserService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.getTranslations(this.userService.user.main.lan);
    this.userService.languageChanged.subscribe(
      newLan => this.getTranslations(newLan)
    );
  }

  onChangeTab(newTab: string) {
    this.tab = newTab;
  }

  private getTranslations(lan: string) {
    this.utilsService
    .fetchTranslations(lan, 'UserComponent')
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      translations => {
        if (translations) {
          this.text = this.utilsService.getTranslatedText(translations);
          this.utilsService.setPageTitle(this.text, 'Settings');
        }
      },
      error => this.errorService.handleError(error)
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
