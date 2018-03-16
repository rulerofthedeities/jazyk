import {Component, Input, OnInit, OnDestroy} from '@angular/core';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {Dialogue} from '../../models/course.model';

@Component({
  selector: 'km-build-lesson-dialogue',
  templateUrl: 'lesson-dialogue.component.html',
  styles: [`
    .panel {
      margin: 0 -15px;
    }
  `]
})

export class BuildLessonDialogueComponent implements OnInit, OnDestroy {
  @Input() lessonId: string;
  @Input() text: Object;
  private componentActive = true;
  modified = false;
  dialogueTpes = ['Dialogue', 'Text', 'Story'];
  dialogue: Dialogue;
  result: Text;
  
  constructor(
    private buildService: BuildService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.dialogue = {
      tpe: 'Dialogue',
      text: 'Title [Translated Title]',
      local: '',
      foreign: '',
      localTitle: '',
      foreignTitle: ''
    }
    this.loadDialogue();
    this.parseText();
  }

  onChangedDialogue() {
    this.modified = true;
    this.parseText();
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
      dialogue => this.dialogue = dialogue,
      error => this.errorService.handleError(error)
    );
  }

  private saveDialogue() {
    this.parseText();
    this.buildService
    .updateDialogue(this.lessonId, this.dialogue)
    .takeWhile(() => this.componentActive)
    .subscribe(
      update => this.modified = false,
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
    // remove script, anchor and image tags
    let text = this.dialogue.text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    text = text.replace(/<a\b[^<]*(?:(?!<\/a>)<[^<]*)*<\/a>/gi, '');
    text = text.replace(/<img\b[^<]*(?:(?!<\/img>)<[^<]*)*<\/img>/gi, '');
    text = text.replace(/<span\b[^<]*(?:(?!<\/span>)<[^<]*)*<\/span>/gi, '');
    text = text.replace(/<div\b[^<]*(?:(?!<\/div>)<[^<]*)*<\/div>/gi, '');
    // parse content
    const sourceSentences = text.split(']');
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
          local += lineBreak + `<span class="dl-${i}">${lineLocal.trim()}</span>`;
          foreign += lineBreak + `<span class="df-${i}">${lineForeign.trim()}</span>`;
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
