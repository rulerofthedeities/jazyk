import { Component, Input, OnDestroy, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { TranslationService } from '../../services/translation.service';
import { Language } from 'app/models/main.model';
import { Word, OmegaDefinitions, OmegaDefinition, WordTranslation, WordTranslations } from '../../models/word.model';
import { DeepLTranslations, MSTranslations } from '../../models/book.model';
import { takeWhile } from 'rxjs/operators';

@Component({
  selector: 'km-word-translation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'external-translation.component.html',
  styleUrls: ['external-translation.component.css']
})

export class ExternalWordTranslationComponent implements OnDestroy {
  @Input() text: Object;
  @Input() source: string;
  @Input() word: Word;
  @Input() targetLan: Language;
  @Input() bookLan: Language;
  @Input() bookId: string;
  @Input() i: number;
  @Output() newTranslations = new EventEmitter<{translations: WordTranslations, i: number}>();
  @Output() noTranslations = new EventEmitter<{msg: string, i: number}>();
  private componentActive = true;
  isLoading = false;
  isNoTranslation = false;
  definitions: OmegaDefinitions;
  toSaveTranslations: WordTranslation[] = [];

  constructor(
    private translationService: TranslationService
  ) {}

  onGetTranslation() {
    if (this.source === 'OmegaWiki' && this.targetLan.omegaLanId) {
      // Fetching translation from omega wiki
      // First get definition (see if it is in the local db)
      this.getOmegaDefinitionLocal();
    } else if (this.source === 'DeepL') {
      this.getDeepLTranslation();
    } else if (this.source === 'Microsoft') {
      this.getMSTranslation();
    }
  }

  private getWord(): string {
    return this.word.root ? this.word.root : this.word.word;
  }

  private getOmegaDefinitionLocal() {
    this.isLoading = true;
    this.translationService
    .fetchOmegaDefinitionLocal(this.getWord())
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(omegaDefinitions => {
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
    .fetchOmegaDefinitionExternal(this.getWord())
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(result => {
      if (result && result.omega && result.omega['ow_express']) {
        // If definition is ok, then parse & store locally
        this.parseExternalOmegaDefinition(result.omega['ow_express']);
      } else {
        // Word not found - save dummy definition
        this.isLoading = false;
        this.saveDummyTranslation('OmegaWiki');
        this.noTranslationFound();
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
      word: this.getWord(),
      omegaWord: data['expression'],
      omegaDefinitions: definitions
    };
    this.saveOmegaDefinitions();
  }

  private saveOmegaDefinitions() {
    this.translationService
    .saveOmegaDefinitions(this.definitions)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(result => {
      // find definitions & translations for lan.omegaLanId and save translation
      if (result) {
        this.parseLocalOmegaDefinition(this.definitions.omegaDefinitions);
      }
    });
  }

  private parseLocalOmegaDefinition(omegaDefinitions: OmegaDefinition[]) {
    // Get only the definitions for the word in the source language
    const sourceLandefinitions = omegaDefinitions.filter(definition => definition.lanId === this.bookLan.omegaLanId);
    if (sourceLandefinitions.length > 0) {
      // See if there are definitions & translations in the target language
      const targetLanDefinitions = sourceLandefinitions.filter(definition => definition.definitionLanId === this.targetLan.omegaLanId);
      if (targetLanDefinitions.length > 0) {
        // Definitions and translations available for the target language, save and show
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
      this.saveDummyTranslation('OmegaWiki');
      this.noTranslationFound();
    }
  }

  private getOmegaTranslations(definitions: OmegaDefinition[]) {
    if (definitions[0] && definitions[0].dmid) {
      this.isLoading = true;
      this.translationService
      .fetchOmegaTranslation(this.targetLan.omegaLanId, definitions[0].dmid)
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(translation => {
        this.isLoading = false;
        translation = translation['TL'];
        if (translation) {
          if (translation.definition.spelling && translation.definition.langid === this.targetLan.omegaLanId) {
            // Save new translation from sub document
            this.toSaveTranslations.push({
              translation: translation.definition.spelling,
              definition: translation.definition.text,
              lanCode: this.targetLan.code,
              source: 'OmegaWiki'
            });
          } else if (translation.spelling && translation.langid.toString() === this.targetLan.omegaLanId) {
            // Save new translation from main document
            this.toSaveTranslations.push({
              translation: translation.spelling,
              definition: '',
              lanCode: this.targetLan.code,
              source: 'OmegaWiki'
            });
          }
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
    this.translationService
    .fetchMachineTranslation('deepl', lanPair, this.getWord())
    .pipe(takeWhile(() => this.componentActive))
    .subscribe((translation: DeepLTranslations) => {
      this.isLoading = false;
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

  private getMSTranslation() {
    const lanPair = {
      from: this.bookLan.code,
      to: this.targetLan.code
    };
    this.isLoading = true;
    this.translationService
    .fetchMachineTranslation('microsoft', lanPair, this.getWord())
    .pipe(takeWhile(() => this.componentActive))
    .subscribe((translation: MSTranslations) => {
      this.isLoading = false;
      if (translation) {
        const msTranslations = translation[0] ? translation[0].translations : [];
        if (msTranslations[0] && msTranslations[0].text) {
          const newTranslations: WordTranslation[] = [{
            translation: msTranslations[0].text,
            definition: '',
            lanCode: this.targetLan.code,
            source: 'Microsoft'
          }];
          this.saveNewTranslations(newTranslations);
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
    this.saveNewTranslations(dummyTranslations, true);
  }

  private saveNewTranslations(newTranslations: WordTranslation[], isDummy = false) {
    // Remove duplicates
    newTranslations = this.removeDuplicate(newTranslations);
    // Show in list
    if (newTranslations.length) {
      // Save
      this.translationService
      .saveTranslations(this.bookLan.code, this.bookId, this.word, newTranslations)
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(result => {
        if (result) {
          const addedTranslations: WordTranslation[] = [];
          let returnedTranslations = result.translations;
          if (returnedTranslations) {
            // All translations are returned, filter out the new ones only
            returnedTranslations = returnedTranslations.filter(tl => tl.lanCode === this.targetLan.code);
            newTranslations.forEach(newTl => {
              const addedTranslation = returnedTranslations.find(
                rTl => rTl.lanCode === newTl.lanCode &&
                rTl.definition === newTl.definition &&
                rTl.source === newTl.source &&
                rTl.translation === newTl.translation
              );
              if (addedTranslation) {
                addedTranslations.push(addedTranslation);
              }
            });
          }
          if (!isDummy) {
            this.newTranslations.emit({
              translations: {
                lanCode: this.bookLan.code,
                word: this.getWord(),
                translations: addedTranslations
              },
              i: this.i
            });
          }
        }
        this.isLoading = false;
      });
    } else {
      this.saveDummyTranslation(this.source);
      this.noTranslationFound();
    }
  }

  private removeDuplicate(translations): WordTranslation[] {
    let uniqueTranslations: WordTranslation[] = [],
        exists: WordTranslation;
    translations.forEach(tl => {
      // Note: lanCode & source is equal for all
      exists = uniqueTranslations.find(ut => ut.translation === tl.translation);
      if (!exists) {
        uniqueTranslations.push(tl);
      } else {
        // Check if one of them has a definition; if only one, keep that one
        if (exists.definition === tl.definition) {
          // They are the same, do not add
        } else if (tl.definition !== '') {
          uniqueTranslations.push(tl);
          // if the existing one is empty, remove it and add new one
          if (exists.definition === '') {
            uniqueTranslations = uniqueTranslations.filter(ut => ut.translation === tl.translation && ut.definition === '');
            uniqueTranslations.push(tl);
          }
        }
      }
    });
    return uniqueTranslations;
  }

  private noTranslationFound() {
    const noTranslationMessage = this.text['NoTranslationFound'].replace('%s', this.source).replace('%l', this.text[this.targetLan.name]);
    this.isNoTranslation = true;
    this.noTranslations.emit({msg: noTranslationMessage, i: this.i});
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
