import { Component, Input, OnInit } from '@angular/core';
import { Map, LanPair } from 'app/models/main.model';
import { FlashCardResult, AnswerData } from 'app/models/word.model';

@Component({
  selector: 'km-flashcards-result',
  templateUrl: 'flashcards-result.component.html',
  styleUrls: ['flashcards-result.component.css']
})

export class BookFlashCardsResultComponent implements OnInit {
  @Input() text: Object;
  @Input() lanPair: LanPair;
  @Input() audioPath: string;
  @Input() answers: Map<AnswerData>;
  @Input() flashCards: FlashCardResult[];
  totalPoints: number;

  ngOnInit() {
    this.totalPoints = 0;
    this.flashCards.forEach(flashCard => {
      flashCard.answers = this.answers[flashCard.wordId].answers;
      flashCard.points = this.answers[flashCard.wordId].points;
      this.totalPoints += flashCard.points;
    });

    console.log(this.answers, this.flashCards);
  }
}
