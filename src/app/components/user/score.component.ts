import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserService } from '../../services/user.service';
import { ErrorService } from '../../services/error.service';
import { SharedService } from '../../services/shared.service';
import { ModalRanksComponent } from '../modals/modal-ranks.component';
import { ModalTrophiesComponent } from '../modals/modal-trophies.component';
import { Trophy } from '../../models/book.model';
import { SingleBookScore } from '../../models/score.model';
import { takeWhile } from 'rxjs/operators';
import { zip } from 'rxjs';

@Component({
  templateUrl: 'score.component.html',
  styleUrls: ['score.component.css', 'user.css']
})

export class UserScoreComponent implements OnInit, OnDestroy {
  private componentActive = true;
  text: Object = {};
  bookScores: SingleBookScore[] = [];
  audiobookScores: SingleBookScore[] = [];
  bookTotal: number;
  audiobookTotal: number;
  overallTotal: number;
  rank: number;
  gender: string;
  trophies: Trophy[] = [];
  loadingTrophies: boolean;
  loadingBookScores: boolean;

  constructor(
    private sharedService: SharedService,
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
    zip(
      this.userService.fetchScoreBooks('read'),
      this.userService.fetchScoreBooks('listen')
    )
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      data => {
        const readData = data[0],
              listenData = data[1];
        this.bookScores = readData.scores.filter(score => score.points > 0);
        this.audiobookScores = listenData.scores.filter(score => score.points > 0);
        this.bookTotal = readData.total || 0;
        this.audiobookTotal = listenData.total || 0;
        this.overallTotal = this.bookTotal + this.audiobookTotal;
        this.gender = this.userService.user.main.gender || 'm';
        this.rank = this.sharedService.getRank(this.bookTotal);
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
    this.sharedService
    .fetchTranslations(this.userService.user.main.lan, 'UserComponent')
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      translations => {
        if (translations) {
          this.text = this.sharedService.getTranslatedText(translations);
          this.sharedService.setPageTitle(this.text, 'Score');
        }
      },
      error => this.errorService.handleError(error)
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
