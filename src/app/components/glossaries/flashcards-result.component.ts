import { Component, Input, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { UserService } from 'app/services/user.service';
import { SharedService } from 'app/services/shared.service';
import { Map, LanPair } from 'app/models/main.model';
import { FlashCardResult, AnswerData } from 'app/models/word.model';
import { ModalPromotionComponent } from '../modals/modal-promotion.component';
import { takeWhile } from 'rxjs/operators';

@Component({
  selector: 'km-flashcards-result',
  templateUrl: 'flashcards-result.component.html',
  styleUrls: ['flashcards-result.component.css']
})

export class BookFlashCardsResultComponent implements OnInit, OnDestroy {
  @Input() text: Object;
  @Input() lanPair: LanPair;
  @Input() audioPath: string;
  @Input() answers: Map<AnswerData>;
  @Input() flashCards: FlashCardResult[];
  @ViewChild(ModalPromotionComponent) promotionComponent: ModalPromotionComponent;
  private componentActive = true;
  totalPoints: number;
  rankKey: string;
  rankNr: number;

  constructor(
    private userService: UserService,
    private sharedService: SharedService
  ) {}

  ngOnInit() {
    this.totalPoints = 0;
    this.flashCards.forEach(flashCard => {
      flashCard.answers = this.answers[flashCard.wordId].answers;
      flashCard.points = this.answers[flashCard.wordId].points;
      this.totalPoints += flashCard.points;
    });
    this.checkNewRank();
  }

  getGender(): string {
    return this.userService.user.main.gender || 'm';
  }

  private checkNewRank() {
    this.userService
    .fetchScoreTotal(null)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      score => {
        const scoreTotal = score || 0,
        rank = this.sharedService.getRank(scoreTotal),
        previousRank = this.sharedService.getRank(scoreTotal - this.totalPoints);
        if (rank > previousRank) {
          this.newRankPromotion(rank);
        }
        this.sharedService.onScoreChanged(scoreTotal);
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

  ngOnDestroy() {
    this.componentActive = false;
  }
}
