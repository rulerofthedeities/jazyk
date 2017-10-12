import {Component, OnInit, OnDestroy} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';
import {UserService} from '../../services/user.service';
import {ErrorService} from '../../services/error.service';
import {UtilsService} from '../../services/utils.service';
import {Profile} from '../../models/user.model';
import 'rxjs/add/operator/takeWhile';

@Component({
  templateUrl: 'profile.component.html',
  styleUrls: ['user.component.css']
})

export class UserProfileComponent implements OnInit, OnDestroy {
  private componentActive = true;
  text: Object = {};
  profileForm: FormGroup;
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
    this.fetchProfile();
  }

  private fetchProfile() {
    this.userService
    .getProfile()
    .takeWhile(() => this.componentActive)
    .subscribe(
      profile => {
        this.buildForm(profile);
      },
      error => this.errorService.handleError(error)
    );
  }

  buildForm(profile: Profile) {
    this.profileForm = this.formBuilder.group({
      bio: [profile.bio],
      realName: [profile.realName],
      location: [profile.location],
      nativeLan: [profile.nativeLan],
      timeZone: [profile.timeZone]
    });
    this.isFormReady = true;
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
