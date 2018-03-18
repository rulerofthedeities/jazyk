import {Component, Input, ViewChild, OnInit, OnDestroy, AfterViewInit} from '@angular/core';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {UtilsService} from '../../services/utils.service';
import {Dialogue, LanPair} from '../../models/course.model';

@Component({
  selector: 'km-build-lesson-dialogue',
  templateUrl: 'lesson-dialogue.component.html',
  styles: [`
    .panel {
      margin: 0 -15px;
    }
  `]
})

export class BuildLessonDialogueComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() languagePair: LanPair;
  @Input() lessonId: string;
  @Input() text: Object;
  @ViewChild('dialogueField') input;
  private componentActive = true;
  modified = false;
  saved = false;
  dialogueTpes = ['Dialogue', 'Text', 'Story'];
  dialogue: Dialogue;
  dialogueDefault: Dialogue;
  result: Text;
  
  constructor(
    private buildService: BuildService,
    private errorService: ErrorService,
    private utilsService: UtilsService
  ) {}

  ngOnInit() {
    this.dialogueDefault = {
      tpe: 'Dialogue',
      text: 'Title [Translated Title]',
      local: '',
      foreign: '',
      localTitle: '',
      foreignTitle: ''
    }
    this.dialogue = this.dialogueDefault;
    this.loadDialogue();
    this.parseText();
  }

  ngAfterViewInit() {
    this.input.valueChanges
    .debounceTime(400)
    .subscribe(data => {
      this.parseText();
    });
  }

  onChangedDialogue() {
    this.modified = true;
    this.saved = false;
  }

  onSaveDialogue() {
    if (this.modified) {
      this.saveDialogue();
    }
  }

  private loadDialogue() {
    this.buildService
    .fetchDialogue(this.lessonId)
    .takeWhile(() => this.componentActive)
    .subscribe(
      dialogue => this.dialogue = dialogue ? dialogue : this.dialogueDefault,
      error => this.errorService.handleError(error)
    );
  }

  private saveDialogue() {
    this.parseText();
    this.buildService
    .updateDialogue(this.lessonId, this.dialogue)
    .takeWhile(() => this.componentActive)
    .subscribe(
      update => {
        this.modified = false,
        this.saved = true},
      error => this.errorService.handleError(error)
    );
  }

  private parseText() {
    let local = '',
        foreign = '',
        lineLocal = '',
        lineForeign = '',
        snippets: Array<string> = [],
        lineBreak: string;
    // remove tags
    const tags = ['script', 'a', 'img', 'span', 'div', 'audio'],
          text = this.utilsService.removeTags(this.dialogue.text, tags),
          sourceSentences = text.split(']');
    // parse content
    sourceSentences.forEach((sentence, i) => {
      if (sentence) {
        lineBreak = sentence[0] === '\n' && i > 1 ? '<br>' : '';
        snippets = sentence.split('[');

        lineLocal = snippets[1] || '';
        lineForeign = snippets[0] || '';

        if (i === 0) {
          // First line is the title
          this.dialogue.localTitle = lineLocal.trim();
          this.dialogue.foreignTitle = lineForeign.trim();
        } else {
          local += lineBreak + lineLocal.trim() + '<hr>';
          foreign += lineBreak + lineForeign.trim() + '<hr>';
        }
      }
    });
    this.dialogue.local = local.trim();
    this.dialogue.foreign = foreign.trim();
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
