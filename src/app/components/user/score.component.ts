import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserService } from '../../services/user.service';
import { ErrorService } from '../../services/error.service';
import { UtilsService } from '../../services/utils.service';
import { ModalRanksComponent } from '../modals/modal-ranks.component';
import { ModalTrophiesComponent } from '../modals/modal-trophies.component';
import { Trophy } from '../../models/book.model';
import { SingleBookScore } from '../../models/score.model';
import { takeWhile } from 'rxjs/operators';

@Component({
  templateUrl: 'score.component.html',
  styleUrls: ['score.component.css', 'user.css']
})

export class UserScoreComponent implements OnInit, OnDestroy {
  private componentActive = true;
  text: Object = {};
  bookScores: SingleBookScore[] = [];
  bookTotal: number;
  rank: number;
  gender: string;
  trophies: Trophy[] = [];
  loadingTrophies: boolean;
  loadingBookScores: boolean;

  constructor(
    private utilsService: UtilsService,
    private userService: UserService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.getTranslations();
    this.getBookScores();
    this.getTrophies();
  }

  onShowRankings(rankingsModal: ModalRanksComponent) {
    rankingsModal.showModal = true;
  }

  onShowTrophies(trophiesModal: ModalTrophiesComponent) {
    trophiesModal.showModal = true;
  }

  private getBookScores() {
    this.loadingBookScores = true;
    this.userService
    .fetchScoreBooks()
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      data => {
        this.bookScores = data.scores.filter(score => score.points > 0);
        this.bookTotal = data.total || 0;
        this.gender = this.userService.user.main.gender || 'm';
        this.rank = this.utilsService.getRank(this.bookTotal);
        this.loadingBookScores = false;
      },
      error => this.errorService.handleError(error)
    );
  }

  private getTrophies() {
    this.loadingTrophies = true;
    this.userService
    .fetchTrophies()
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      (trophies) => {
        trophies.sort(
          (a, b) => (parseInt(a.trophy, 10) > parseInt(b.trophy, 10) ? 1 : ((parseInt(b.trophy, 10) > parseInt(a.trophy, 10)) ? -1 : 0))
        );
        this.trophies = trophies;
        this.loadingTrophies = false;
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
