import {Component, OnInit, OnDestroy} from '@angular/core';
import {UserService} from '../../services/user.service';
import {ErrorService} from '../../services/error.service';
import {UtilsService} from '../../services/utils.service';
import {ModalRanksComponent} from '../modals/modal-ranks.component';
import {Trophy} from '../../models/book.model';
import {SingleBookScore, SingleCourseScore} from '../../models/score.model';
import {takeWhile} from 'rxjs/operators';

@Component({
  templateUrl: 'score.component.html',
  styleUrls: ['score.component.css', 'user.css']
})

export class UserScoreComponent implements OnInit, OnDestroy {
  private componentActive = true;
  text: Object = {};
  courseScores: SingleCourseScore[] = [];
  bookScores: SingleBookScore[] = [];
  courseTotal: number;
  bookTotal: number;
  rank: number;
  gender: string;
  trophies: Trophy[] = [];

  constructor(
    private utilsService: UtilsService,
    private userService: UserService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.getTranslations();
    this.getCourseScores();
    this.getBookScores();
    this.getTrophies();
  }

  onShowRankings(rankings: ModalRanksComponent) {
    rankings.showModal = true;
  }

  private getCourseScores() {
    this.userService
    .fetchScoreCourses()
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      data => {
        this.courseScores = data.scores;
        this.courseTotal = data.total || 0;
        this.gender = this.userService.user.main.gender || 'm';
        this.rank = this.utilsService.getRank(this.courseTotal + this.bookTotal);
      },
      error => this.errorService.handleError(error)
    );
  }

  private getBookScores() {
    this.userService
    .fetchScoreBooks()
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      data => {
        this.bookScores = data.scores.filter(score => score.points > 0);
        this.bookTotal = data.total || 0;
        this.gender = this.userService.user.main.gender || 'm';
        this.rank = this.utilsService.getRank(this.courseTotal + this.bookTotal);
      },
      error => this.errorService.handleError(error)
    );
  }

  private getTrophies() {
    this.userService
    .fetchTrophies()
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      (trophies) => {
        this.trophies = trophies;
        console.log('trophies', trophies);
      }
    );
  }

  private getTranslations() {
    this.utilsService
    .fetchTranslations(this.userService.user.main.lan, 'UserComponent')
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      translations => {
        if (translations) {
          this.text = this.utilsService.getTranslatedText(translations);
          this.utilsService.setPageTitle(this.text, 'Score');
        }
      },
      error => this.errorService.handleError(error)
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
