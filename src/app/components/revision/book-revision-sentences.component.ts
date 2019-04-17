import { Component, Input, OnInit } from '@angular/core';
import { SentenceData } from 'app/models/revision.model';
import { UserService } from '../../services/user.service';
import { Subject, BehaviorSubject } from 'rxjs';

@Component({
  selector: 'km-revision-sentences',
  templateUrl: 'book-revision-sentences.component.html',
  styleUrls: ['book-revision-sentences.component.css']
})

export class BookRevisionSentencesComponent implements OnInit {
  @Input() text: Object;
  @Input() paragraphs: SentenceData[][];
  @Input() bookLanCode: string;
  @Input() targetLanCode: string;
  @Input() bookId: string;
  userId: string;
  hoverSentenceParNr: number;
  hoverSentenceLineNr: number;
  translateSentenceParNr: number;
  translateSentenceLineNr: number;
  answersObservable: BehaviorSubject<{answers: string, isResults: boolean}> =
                      new BehaviorSubject({answers: '', isResults: false}); // For translations

  constructor(
    private userService: UserService
  ) {}

  ngOnInit() {
    this.userId = this.userService.user._id.toString();
  }

  onHoverSentence(parNr: number, lineNr: number) {
    this.hoverSentenceParNr = parNr;
    this.hoverSentenceLineNr = lineNr;
  }

  onCancelHoverSentence() {
    this.hoverSentenceParNr = null;
    this.hoverSentenceLineNr = null;
  }

  onClickSentence(tpe: string, parNr: number, lineNr: number, lastAnswer = '') {
    if (tpe === 'translation') {
      this.sentenceTranslation(parNr, lineNr, lastAnswer);
    } else {
      this.selectSentence(parNr, lineNr);
    }
  }

  onCanConfirm() {
    ;
  }

  onTranslationAdded(points: string) {
    ;
  }

  private selectSentence(parNr: number, lineNr: number) {
    if (this.hoverSentenceParNr !== parNr || this.translateSentenceParNr !== lineNr) {
      this.hoverSentenceParNr = parNr;
      this.hoverSentenceLineNr = lineNr;
    }
    this.translateSentenceParNr = null;
    this.translateSentenceLineNr = null;
  }

  private sentenceTranslation(parNr: number, lineNr: number, lastAnswer: string) {
    if (this.translateSentenceParNr !== parNr || this.translateSentenceLineNr !== lineNr) {
      this.translateSentenceParNr = parNr;
      this.translateSentenceLineNr = lineNr;
      this.answersObservable.next({answers: lastAnswer, isResults: false});
    }
  }
}
