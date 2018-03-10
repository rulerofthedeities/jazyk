import {Component, OnInit, OnDestroy} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {InfoService} from '../../services/info.service';
import {UserService} from '../../services/user.service';
import {ErrorService} from '../../services/error.service';
import {Page} from '../../models/info.model';
import 'rxjs/add/operator/takeWhile';

@Component({
  template: `
  <div class="panel panel-default transparant">
    <div class="panel-heading">
      <span class="fa fa-info-circle fa-spacing-title"></span>{{page?.title}}
    </div>
    <div class="panel-body">
      <div [innerHTML]="page?.content | sanitizeHtml">
    </div>
  </div>
  `,
  styleUrls: ['info.component.css']
})

export class InfoComponent implements OnInit, OnDestroy {
  private componentActive = true;
  page: Page;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private infoService: InfoService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.route.params
    .takeWhile(() => this.componentActive)
    .subscribe(
      params => {
        if (params['page']) {
          this.fetchInfoPage(params['page'].toLowerCase());
        }
      }
    );
  }

  private fetchInfoPage(page: string) {
    this.infoService
    .fetchInfoPage(page, this.userService.user.main.lan)
    .takeWhile(() => this.componentActive)
    .subscribe(
      page => this.page = page,
      error => {
        if (error.status === 404) {
          this.router.navigate(['/404']);
        } else {
          this.errorService.handleError(error);
        }
      }
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}