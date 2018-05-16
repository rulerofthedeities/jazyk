import {Component, OnInit, OnDestroy} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {PageService} from '../../services/page.service';
import {UserService} from '../../services/user.service';
import {UtilsService} from '../../services/utils.service';
import {ErrorService} from '../../services/error.service';
import {Page} from '../../models/page.model';
import {takeWhile, filter} from 'rxjs/operators';

@Component({
  template: `
  <div class="panel panel-default transparant">
    <div class="panel-heading">
      <span class="fa fa-info-circle fa-spacing-title"></span>{{page?.title}}
    </div>
    <div class="panel-body">
      <div [innerHTML]="page?.html | sanitizeHtml">
    </div>
  </div>
  `,
  styleUrls: ['page.component.css']
})

export class InfoComponent implements OnInit, OnDestroy {
  private componentActive = true;
  page: Page;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private pageService: PageService,
    private utilsService: UtilsService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.route.params
    .pipe(
      takeWhile(() => this.componentActive),
      filter(params => params.page))
    .subscribe(
      params => this.fetchInfoPage(params['page'].toLowerCase())
    );
  }

  private fetchInfoPage(page: string) {
    this.pageService
    .fetchInfoPage(page, this.userService.user.main.lan)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      fetchedPage => {
        this.page = fetchedPage;
        console.log('page', this.page);
        this.utilsService.setPageTitle(null, fetchedPage.title);
      },
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
