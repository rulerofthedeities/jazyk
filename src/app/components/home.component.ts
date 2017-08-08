import {Component, OnInit, OnDestroy} from '@angular/core';
import {ErrorService} from '../services/error.service';
import {UtilsService} from '../services/utils.service';
import {UserService} from '../services/user.service';
import 'rxjs/add/operator/takeWhile';

@Component({
  templateUrl: 'home.component.html',
  styleUrls: ['home.component.css']
})

export class HomeComponent implements OnInit, OnDestroy {
  private componentActive = true;
  text: Object = {};

  constructor(
    private utilsService: UtilsService,
    private userService: UserService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    console.log('current user:', this.userService.user);
    this.getTranslations();
  }

  private getTranslations() {
    this.utilsService
    .fetchTranslations(this.userService.user.lan, 'HomeComponent')
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
