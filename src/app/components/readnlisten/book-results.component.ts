import { Component, Input, Output, OnChanges, OnDestroy, ViewChild, EventEmitter } from '@angular/core';
import { SessionData, Trophy } from '../../models/book.model';
import { takeWhile } from 'rxjs/operators';
import { ReadnListenService } from '../../services/readnlisten.service';
import { UserService } from '../../services/user.service';
import { SharedService } from '../../services/shared.service';
import { ModalPromotionComponent } from '../modals/modal-promotion.component';
import { zip } from 'rxjs';

@Component({
  selector: 'km-sentences-results',
  templateUrl: 'book-results.component.html',
  styleUrls: ['book-results.component.css', 'book-bullets.component.css']
})

export class BookResultsComponent implements OnChanges, OnDestroy {
  @Input() data: SessionData;
  @Input() text: Object;
  @Input() bookType: string;
  @Input() isTest: boolean;
  @Input() isBookRead: boolean;
  @Output() setFinished = new EventEmitter<boolean>();
  @ViewChild(ModalPromotionComponent) promotionComponent: ModalPromotionComponent;
  private componentActive = true;
  percYes = 0;
  percMaybe = 0;
  percNo = 0;
  total = 0;
  showDetails = false;
  points = 0;
  test = 0;
  bonus = 0;
  basic = 0;
  isFinished = false;
  newTrophies: string[] = [];
  rankKey: string;
  rankNr: number;

  constructor(
    private readnListenService: ReadnListenService,
    private userService: UserService,
    private sharedService: SharedService
  ) {}

  ngOnChanges() {
    this.calculateResults();
  }

  onShowDetails(show: boolean) {
    this.showDetails = show;
  }

  getGender(): string {
    return this.userService.user.main.gender || 'm';
  }

  private calculateResults() {
    this.newTrophies = [];
    this.isFinished = this.data.resultData.isFinished;
    if (this.isFinished && !this.isBookRead) {
      // set book to finished
      this.setFinished.emit(true);
    }
    this.checkSessionTrophies(this.data);
    this.total = this.data.nrYes + this.data.nrMaybe + this.data.nrNo;
    if (this.total > 0) {
      this.percYes = Math.round(this.data.nrYes / this.total * 1000) / 10;
      this.percMaybe = Math.round(this.data.nrMaybe / this.total * 1000) / 10;
      this.percNo = Math.round(this.data.nrNo / this.total * 1000) / 10;
    }
    this.points = this.data.points.finished + this.data.points.test + this.data.points.translations + this.data.points.words;
    this.basic = this.data.points.translations + this.data.points.words;
    this.test = this.data.points.test;
    this.bonus = this.data.points.finished;
    this.checkNewRank();
  }

  private checkNewRank() {
    this.userService
    .fetchScoreTotal(null)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      score => {
        const scoreTotal = score || 0,
        rank = this.sharedService.getRank(scoreTotal),
        previousRank = this.sharedService.getRank(scoreTotal - this.points);
        if (rank > previousRank) {
          this.newRankPromotion(rank);
        }
      }
    );
  }

  private newRankPromotion(newRank: number) {
    if (this.promotionComponent) {
      // Show promotion modal
      this.rankNr = newRank || 0;
      this.rankKey = 'rank' + (this.rankNr).toString() + this.userService.user.main.gender || 'm';
      this.promotionComponent.doShowModal();
    }
  }

  private checkSessionTrophies(data: SessionData) {
    // First check if trophies were earned in this session
    const resultData = data.resultData,
          readInSession = data.answers.length,
          translations = data.translations,
          trophies: string[] = [];
    // # of sentences read in whole book
    let trophyBase: string;
    if (resultData.isFinished) {
      trophyBase = this.bookType === 'listen' ? (this.isTest ? '5' : '4') : '0';
      trophies.push(trophyBase + '1');
      if (resultData.totalBookSentences >= 100) {
        trophies.push(trophyBase + '2');
      }
      if (resultData.totalBookSentences >= 1000) {
        trophies.push(trophyBase + '3');
      }
    }
    // # of sentences read in this session
    trophyBase  = this.bookType === 'listen' ? (this.isTest ? '7' : '6') : '1';
    if (readInSession >= 10) {
      trophies.push(trophyBase + '1');
    }
    if (readInSession >= 50) {
      trophies.push(trophyBase + '2');
    }
    if (readInSession >= 200) {
      trophies.push(trophyBase + '3');
    }
    // # of translations in this session
    if (translations >= 5) {
      trophies.push('21');
    }
    if (translations >= 25) {
      trophies.push('22');
    }
    if (translations >= 50) {
      trophies.push('23');
    }
    if (trophies.length) {
      // If there are any, check which trophies were earned before
      this.getTrophies(trophies);
    }
  }

  private getTrophies(trophiesThisSession: string[]) {
    this.readnListenService
    .fetchSessionTrophies()
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      (existingTrophies: Trophy[]) => {
        this.getOverallTrophies(existingTrophies, trophiesThisSession);
      }
    );
  }

  private getOverallTrophies(existingTrophies: Trophy[], trophiesThisSession: string[]) {
    zip(
      this.readnListenService.fetchOverallSessionTrophies(existingTrophies),
      this.readnListenService.fetchOverallThumbTrophies(existingTrophies)
    )
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      (data) => {
        const newOverallSessionTrophies = data[0],
              newOverallThumbTrophies = data[1],
              newTrophies: string[] = newOverallSessionTrophies.concat(newOverallThumbTrophies);
        // The difference between existingTrophies and trophiesThisSession are new trophies
        let exists: Trophy;
        trophiesThisSession.forEach(trophy => {
          exists = existingTrophies.find(eTrophy => eTrophy.trophy === trophy);
          if (!exists) {
            newTrophies.push(trophy);
          }
        });
        // Save the new trophies and show them
        if (newTrophies.length) {
          this.saveTrophies(newTrophies);
        }
      }
    );
  }

  private saveTrophies(trophies: string[]) {
    this.readnListenService
    .saveTrophies(trophies)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      result => {
        this.newTrophies = trophies;
    });
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
