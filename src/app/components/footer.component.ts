import {Component, OnInit, OnDestroy} from '@angular/core';
import {UserService} from '../services/user.service';
import {UtilsService} from '../services/utils.service';
import {ErrorService} from '../services/error.service';
import 'rxjs/add/operator/takeWhile';

@Component({
  selector: 'km-footer',
  templateUrl: 'footer.component.html',
  styleUrls: ['footer.component.css']
})

export class FooterComponent implements OnInit, OnDestroy {
  private componentActive = true;
  text: Object;
  isReady = false;
  
  constructor(
    private utilsService: UtilsService,
    private userService: UserService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.getTranslations(this.userService.user.main.lan);
  }

  private getTranslations(lan) {
    this.utilsService
    .fetchTranslations(lan, 'FooterComponent')
    .takeWhile(() => this.componentActive)
    .subscribe(
      translations => {
        if (translations) {
          this.text = this.utilsService.getTranslatedText(translations);
          this.isReady = true;
        }
      },
      error => this.errorService.handleError(error)
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}