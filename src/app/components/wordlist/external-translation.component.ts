import { Component, Input, OnDestroy, Output, EventEmitter } from '@angular/core';
import { TranslationService } from '../../services/translation.service';
import { Language } from 'app/models/main.model';
import { OmegaDefinitions, OmegaDefinition, WordTranslation, WordTranslations } from '../../models/word.model';
import { DeepLTranslations } from '../../models/book.model';
import { takeWhile } from 'rxjs/operators';

@Component({
  selector: 'km-word-translation',
  templateUrl: 'external-translation.component.html',
  styleUrls: ['external-translation.component.css']
})

export class ExternalWordTranslationComponent implements OnDestroy {
  @Input() text: Object;
  @Input() source: string;
  @Input() word: string;
  @Input() targetLan: Language;
  @Input() bookLan: Language;
  @Input() bookId: string;
  @Input() i: number;
  @Output() newTranslations = new EventEmitter<{translations: WordTranslations, i: number}>();
  private componentActive = true;
  isLoading = false;
  isTranslated = false;
  definitions: OmegaDefinitions;
  toSaveTranslations: WordTranslation[] = [];

  constructor(
    private translationService: TranslationService
  ) {}

  onGetTranslation() {
    console.log('fetch translation from', this.source, this.targetLan);
    if (this.source === 'OmegaWiki' && this.targetLan.omegaLanId) {
      // Fetching translation from omega wiki
      // First get definition (see if it is in the local db)
      this.getOmegaDefinitionLocal();
      // Then get translation
      console.log('Omega lan id', this.targetLan.omegaLanId);

      // this.getOmegaTranslation();
    } else if (this.source === 'DeepL') {
      console.log('Fetch translation from DeepL');
      this.getDeepLTranslation();
    }
  }

  private getOmegaDefinitionLocal() {
    // TODO: first check if it exists locally
    this.translationService
    .fetchOmegaDefinitionLocal(this.word)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(omegaDefinitions => {
      console.log('omega LOCAL definition', omegaDefinitions);
      if (omegaDefinitions.length) {
        this.parseLocalOmegaDefinition(omegaDefinitions);
        // If definition is found, parse user language
      } else {
        this.getOmegaDefinitionExternal();
      }
    });

  }

  private getOmegaDefinitionExternal() {
    this.isLoading = true;
    this.translationService
    .fetchOmegaDefinitionExternal(this.word)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(result => {
      console.log('omega definition', result);
      if (result && result.omega && result.omega['ow_express']) {
        // If definition is ok, then parse & store locally
        this.parseExternalOmegaDefinition(result.omega['ow_express']);
      } else {
        // Word not found - save dummy definition
        this.isLoading = false;
        console.log('no definition found - add fake translation');
        this.saveDummyTranslation('OmegaWiki');
      }
    });
  }

  private parseExternalOmegaDefinition(data: string) {
    let i = 0,
        definition: string,
        newDefinition: OmegaDefinition;
    const definitions: OmegaDefinition[] = [];
    do {
      i++;
      definition = data['ow_define_' + i.toString()];
      if (!!definition) {
        newDefinition = {
          dmid: definition['dmid'],
          lanId: definition['langid']
        }
        if (definition['definition']) {
          newDefinition.definitionLanId = definition['definition']['langid'];
          newDefinition.definitionTranslation = definition['definition']['spelling'];
          newDefinition.definitionText = definition['definition']['text'];
        }
        if (definition['dmid'] && definition['langid']) {
          definitions.push(newDefinition);
        }
      }
    }
    while (!!definition);
    // note: also save if no data?
    this.definitions = {
      source: 'OmegaWiki',
      word: this.word,
      omegaWord: data['expression'],
      omegaDefinitions: definitions
    };
    this.saveOmegaDefinitions();
  }

  private saveOmegaDefinitions() {
    console.log('saving Defitions', this.definitions);
    this.translationService
    .saveOmegaDefinitions(this.definitions)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(result => {
      console.log('omega definition saved', result);
      // find definitions & translations for lan.omegaLanId and save translation
      if (result) {
        this.parseLocalOmegaDefinition(this.definitions.omegaDefinitions);
      }
    });
  }

  private parseLocalOmegaDefinition(omegaDefinitions: OmegaDefinition[]) {
    console.log('lan', this.bookLan);
    // Get only the definitions for the word in the source language
    const sourceLandefinitions = omegaDefinitions.filter(definition => definition.lanId === this.bookLan.omegaLanId);
    console.log('book language only definitions', sourceLandefinitions);
    if (sourceLandefinitions.length > 0) {
      // See if there are definitions & translations in the target language
      const targetLanDefinitions = sourceLandefinitions.filter(definition => definition.definitionLanId === this.targetLan.omegaLanId);
      console.log('book language definitions available', targetLanDefinitions);
      if (targetLanDefinitions.length > 0) {
        // Definitions and translations available for the target language, save and show
        console.log('saving translations / definitions');
        const newTranslations: WordTranslation[] = [];
        targetLanDefinitions.forEach(definition => {
          newTranslations.push({
            translation: definition.definitionTranslation,
            definition: definition.definitionText,
            lanCode: this.targetLan.code,
            source: 'OmegaWiki'
          });
        });
        this.saveNewTranslations(newTranslations);
        this.isLoading = false;
      } else {
        // No definitions or translations available for the target language
        // Find translations for each sourceLanDefinitions
        this.toSaveTranslations = [];
        this.getOmegaTranslations(sourceLandefinitions);
      }
    } else {
      // NO DEFINITIONS FOUND FOR THIS WORD
      console.log('>>> No definitions found !!');
      this.saveDummyTranslation('OmegaWiki');
    }
  }

  private getOmegaTranslations(definitions: OmegaDefinition[]) {
    console.log('find translation for target language', definitions);
    if (definitions[0] && definitions[0].dmid) {
      console.log('get translation for dmid', definitions[0].dmid);
      this.translationService
      .fetchOmegaTranslation(this.targetLan.omegaLanId, definitions[0].dmid)
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(translation => {
        console.log('omega translation', translation['TL']);
        translation = translation['TL'];
        if (translation && translation.spelling && translation.definition.langid === this.targetLan.omegaLanId) {
          // Save new translations
          this.toSaveTranslations.push({
            translation: translation.definition.spelling,
            definition: translation.definition.text,
            lanCode: this.targetLan.code,
            source: 'OmegaWiki'
          });
        }
        definitions.shift();
        if (definitions.length) {
          this.getOmegaTranslations(definitions);
        } else {
          this.saveNewTranslations(this.toSaveTranslations);
        }
      });
    }
  }

  private getDeepLTranslation() {
    const lanPair = {
      from: this.bookLan.code,
      to: this.targetLan.code
    };
    this.isLoading = true;
    console.log('fetching deepl translation', this.word, lanPair);
    this.translationService
    .fetchMachineTranslation('deepl', lanPair, this.word)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe((translation: DeepLTranslations) => {
      this.isLoading = false;
      console.log('Translation from DeepL:', translation);
      if (translation) {
        const translations = translation.translations;
        if (translations[0] && translations[0].text) {
          const deepLTranslations: WordTranslation[] = [{
            translation: translations[0].text,
            definition: '',
            lanCode: this.targetLan.code,
            source: 'DeepL'
          }];
          this.saveNewTranslations(deepLTranslations);
        }
      }
    });
  }

  private saveDummyTranslation(source: string) {
    // Save dummy translation so translation button is hidden for this source
    const dummyTranslations: WordTranslation[] = [{
      translation: '<none>',
      definition: '',
      lanCode: this.targetLan.code,
      source: source
    }];
    this.saveNewTranslations(dummyTranslations);
  }

  private saveNewTranslations(newTranslations: WordTranslation[]) {
    // Remove duplicates ??

    // Show in list
    console.log('emitting saveNewTranslations');
    this.newTranslations.emit({
      translations: {
        lanCode: this.bookLan.code,
        word: this.word,
        translations: newTranslations
      },
      i: this.i
    });
    this.isLoading = false;
    // Save
    console.log('saving translations', this.bookLan.code, this.word, newTranslations);
    if (newTranslations.length) {
      this.translationService
      .saveTranslations(this.bookLan.code, this.bookId, this.word, newTranslations)
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(result => {
        console.log('translation saved', result);
      });
    }
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
