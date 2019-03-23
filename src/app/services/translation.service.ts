import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Book, TranslationData, TranslatedData, SentenceTranslation, DeepLTranslations } from '../models/book.model';
import { WordDefinition, OmegaDefinitions, OmegaDefinition,
         OmegaTranslation, WordTranslation, WordTranslations } from '../models/word.model';
import { LanPair } from '../models/main.model';
import { retry } from 'rxjs/operators';

@Injectable()
export class TranslationService {

  constructor(
    private http: HttpClient
  ) {}

  /*** Word Translations ***/

  fetchOmegaDefinitionLocal(word: string): Observable<OmegaDefinition[]> {
    return this.http
    .get<OmegaDefinition[]>(`/api/wordlist/word/definition/omega/local/${word}`)
    .pipe(retry(3));
  }

  fetchOmegaDefinitionExternal(word: string): Observable<WordDefinition> {
    return this.http
    .get<WordDefinition>(`/api/wordlist/word/definition/omega/ext/${word}`)
    .pipe(retry(3));
  }

  saveOmegaDefinitions(definitions: OmegaDefinitions): Observable<OmegaDefinition[]> {
    return this.http
    .post<OmegaDefinition[]>(`/api/wordlist/word/definition/omega`, {definitions});
  }

  fetchOmegaTranslation(omegaLanId: string, dmid: string): Observable<OmegaTranslation> {
    return this.http
    .get<OmegaTranslation>(`/api/wordlist/word/translate/omega/${omegaLanId}/${dmid}`)
    .pipe(retry(3));
  }

  saveTranslations(bookLanCode: string, bookId: string, word: string, translations: WordTranslation[]): Observable<WordTranslation[]> {
    return this.http
    .post<WordTranslation[]>(`/api/wordlist/word/translation`, {bookLanCode, bookId, word, translations});
  }

  fetchTranslations(book: Book, targetLan: string, words: string[]): Observable<WordTranslations[]> {
    return this.http
    .put<WordTranslations[]>(`/api/wordlist/word/translations`, {words, bookId: book._id, bookLan: book.lanCode, targetLan})
    .pipe(retry(3));
  }

  updateWordTranslation(
    translationId: string,
    translationElementId: string,
    translation: string,
    note: string
  ): Observable<boolean>  {
    return this.http
    .put<boolean>('/api/wordlist/word/translation', {
      translationId, translationElementId, translation, note
    });
  }

  removeWordTranslation(translationId: string, translationElementId: string): Observable<boolean> {
    return this.http
    .put<boolean>('/api/wordlist/word/removetranslation', {
      translationId, translationElementId
    });
  }

  /*** Sentence Translations ***/

  fetchSentenceTranslations(
    userLanCode: string,
    bookId: string,
    sentence: string): Observable<SentenceTranslation[]> {
    return this.http
    .get<SentenceTranslation[]>('/api/book/translations/' + bookId + '/' + userLanCode + '/' + encodeURIComponent(sentence))
    .pipe(retry(3));
  }

  addSentenceTranslation(
    bookLanCode: string,
    userLanCode: string,
    bookId: string,
    sentence: string,
    translation: string,
    note: string,
    isMachine = false,
    machine = null
  ): Observable<TranslatedData> {
    return this.http
    .post<TranslatedData>('/api/book/translation/', {
      bookLanCode, userLanCode, bookId, sentence, translation, note, isMachine, machine
    });
  }

  updateSentenceTranslation(
    translationId: string,
    translationElementId: string,
    translation: string,
    note: string
  ): Observable<SentenceTranslation>  {
    return this.http
    .put<SentenceTranslation>('/api/book/translation', {
      translationId, translationElementId, translation, note
    });
  }

  fetchMachineTranslation(tpe: string, lanPair: LanPair, sentence: string): Observable<DeepLTranslations> {
    return this.http
    .post<DeepLTranslations>('/api/book/machinetranslation/' + tpe, {lanPair, sentence});
  }

  getMachineLanguages(tpe: string) {
    let languages = [];
    if (tpe === 'deepl') {
      languages = ['en', 'de', 'fr', 'es', 'it', 'nl', 'pl'];
    }
    return languages;
  }
}