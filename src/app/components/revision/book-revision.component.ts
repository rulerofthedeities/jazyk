import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../../services/user.service';
import { ReadnListenService } from '../../services/readnlisten.service';
import { RevisionService } from '../../services/revision.service';
import { SharedService } from '../../services/shared.service';
import { Book, Chapter, SessionData,
         RevisionTranslations, SentenceTranslation } from 'app/models/book.model';
import { SentenceData, ChapterData } from 'app/models/revision.model';
import { takeWhile, filter } from 'rxjs/operators';
import { zip } from 'rxjs';

@Component({
  templateUrl: 'book-revision.component.html',
  styleUrls: ['../readnlisten/book-context.component.css', 'book-revision.component.css']
})

export class BookRevisionComponent implements OnInit, OnDestroy {
  private componentActive = true;
  private bookType = 'read';
  text: Object;
  book: Book;
  isLoadingRevision = false;
  isLoadingChapter: boolean[] = [];
  userLanCode: string;
  msg: string;
  chapterData: ChapterData[] = [];
  userId: string;
  isError = false;
  hasChapters: boolean;

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private sharedService: SharedService,
    private revisionService: RevisionService,
    private readnListenService: ReadnListenService
  ) {}

  ngOnInit() {
    this.userId = this.userService.user._id.toString();
    this.getBookType();
    this.getDependables(this.userService.user.main.lan);
  }

  onToggleChapter(chapter: ChapterData, i: number) {
    chapter.expanded = !chapter.expanded;
    if (chapter.expanded && !chapter.ready) {
      if (!chapter.ready) {
        this.fetchChapter(chapter, i);
      }
    }
  }

  showChapter(chapter: ChapterData) {
    const level = chapter.level;
    let sequence = chapter.sequence,
        chapterData: ChapterData,
        hide = true;
    if (level > 1) {
      while (sequence > 0) {
        sequence--;
        chapterData = this.chapterData.find(cd => cd.sequence === sequence && cd.level === level - 1);
        if (chapterData) {
          hide = !chapterData.expanded;
        }
      }
      return hide;
    } else {
      return false;
    }
  }

  private getBookType() {
    // read or listen
    this.route
    .data
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(data => {
      this.bookType = data.tpe;
    });
  }

  private getBookId() {
    this.route.params
    .pipe(
      takeWhile(() => this.componentActive),
      filter(params => params.id))
    .subscribe(
      params => {
        const bookId = params['id'];
        this.userLanCode = params['lan'];
        this.processNewBookId(bookId);
      }
    );
  }

  private processNewBookId(bookId: string) {
    // First load book only for better responsiveness
    if (bookId && bookId.length === 24) {
      this.isLoadingRevision = true;
      this.readnListenService
      .fetchBook(bookId, this.bookType)
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(book => {
        this.book = book;
        this.processNewBook(bookId);
      });
    } else {
      this.msg = this.text['InvalidBookId'];
    }
  }

  private processNewBook(bookId: string) {
    zip(
      this.readnListenService.fetchChapterHeaders(bookId, this.bookType),
      this.revisionService.fetchSessionData(bookId, 'read', this.userLanCode)
    )
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(res => {
      this.chapterData = this.processChapterHeaders(res[0]);
      this.processSessions(res[1]);
    });
  }

  private processChapterHeaders(chapters: Chapter[]): ChapterData[] {
    // Merge chapters without a chapter title
    const newChapters: Chapter[] = [];
    chapters.forEach((chapter, i) => {
      if (i > 0 && chapter.title.trim() === '') {
        // merge with previous chapter
        newChapters[newChapters.length - 1].nrOfSentences += chapter.nrOfSentences;
      } else {
        newChapters.push(chapter);
      }
    });
    // Create a data structure holding all data per chapter,
    const chapterData: ChapterData[] = [];
    let j = 0,
        title: string,
        sentences: SentenceData[];
    newChapters.forEach(chapter => {
      title = chapter.title.trim();
      sentences = [];
      for (let i = 0; i < chapter.nrOfSentences; i++) {
        sentences[i] = {
          sentenceNrChapter: i,
          sentenceNrTotal: j
        };
        j++;
      }
      chapterData.push({
        chapterId: chapter._id,
        title,
        sequence: chapter.sequence,
        level: chapter.level,
        nrOfSentences: chapter.nrOfSentences,
        sentences: sentences,
        paragraphs: [],
        expanded: false,
        ready: false
      });
    });
    if (chapterData.length < 2 && chapterData[0].title === '') {
      this.hasChapters = false;
      chapterData[0].expanded = true;
      this.fetchChapter(chapterData[0], 0);
    } else {
      this.hasChapters = true;
    }
    this.isLoadingRevision = false;
    return chapterData;
  }

  private processSessions(sessions: SessionData[]) {
    // Loop through all session data and map with chapter
    // If chapterSentenceNr or chapter sequence is available, this gets priority
    let chapterSequence = 1,
        sentenceNr = 0,
        currentRepeatCount = -1,
        repeatCount: number;
    sessions.forEach(session => {
      repeatCount = session.repeatCount || 0;
      if (repeatCount > currentRepeatCount) {
        currentRepeatCount = repeatCount;
        chapterSequence = 1;
        sentenceNr = 0;
      }
      if (session.chapterSequence) {
        chapterSequence = session.chapterSequence;
        sentenceNr = session.sentenceNrChapter || 0;
      }
      for (let i = 0; i < session.answers.length; i++) {
        this.chapterData[chapterSequence - 1].sentences[sentenceNr].answers =
          this.chapterData[chapterSequence - 1].sentences[sentenceNr].answers || '';
        this.chapterData[chapterSequence - 1].sentences[sentenceNr].answers += session.answers[i];
        this.chapterData[chapterSequence - 1].sentences[sentenceNr].lastAnswer = session.answers[i];
        sentenceNr++;
        if (sentenceNr >= this.chapterData[chapterSequence - 1].nrOfSentences) {
          chapterSequence++;
          sentenceNr = 0;
        }
      }
    });
  }

  private fetchChapter(chapter: ChapterData, i: number) {
    this.isLoadingChapter[i] = true;
    zip(
      this.revisionService.fetchChapter(chapter.chapterId),
      this.revisionService.fetchChapterTranslations(this.book._id, this.book.lanCode, this.userLanCode, chapter.sequence)
    )
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(data => {
      const chapterData = data[0],
            translations = data[1];
      let translationData: RevisionTranslations;
      if (chapterData && chapterData.sentences) {
        chapterData.sentences.forEach((sentence, j) => {
          chapter.sentences[j].sentence = sentence;
          // Map translations with chapter sentences
          translationData = translations.find(translation => chapter.sentences[j].sentence.text === translation.sentence);
          if (translationData) {
            chapter.sentences[j].hasTranslation = true;
            chapter.sentences[j].translations = translationData.translations;
            chapter.sentences[j].bestTranslation = this.getBestTranslation(translationData.translations);
          } else {
            chapter.sentences[j].hasTranslation = false;
            chapter.sentences[j].bestTranslation = {
              translation: chapter.sentences[j].sentence.text,
              userId: null,
              note: '',
              isMachine: false,
              lanCode: this.userLanCode,
              score: 0
            };
          }
        });
      }
      // Transform into paragraphs
      this.buildParagraphs(chapter);
      this.isLoadingChapter[i] = false;
      chapter.ready = true;
    });
  }

  private buildParagraphs(chapterData: ChapterData) {
    // For display arrange sentences per paragraph
    let pCnt = -1,
        sCnt = 0;
        chapterData.paragraphs = [];
        chapterData.sentences.forEach(sentence => {
      if (sCnt === 0 || sentence.sentence.isNewParagraph) {
        pCnt++;
        sCnt = 0;
        chapterData.paragraphs[pCnt] = [];
      }
      chapterData.paragraphs[pCnt][sCnt] = sentence;
      sCnt++;
    });
    chapterData.sentences = [];
  }

  private getBestTranslation(translations: SentenceTranslation[]): SentenceTranslation {
    let bestTranslation: SentenceTranslation;
    translations.forEach(translation => {
      if (!bestTranslation || bestTranslation.score < translation.score) {
        bestTranslation = translation;
      }
    });
    return bestTranslation;
  }

  private getDependables(lan) {
    const options = {
      lan,
      component: 'RevisionComponent',
      getTranslations: true
    };

    this.sharedService
    .fetchDependables(options)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      dependables => {
        this.text = this.sharedService.getTranslatedText(dependables.translations);
        this.getBookId();
      }
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
