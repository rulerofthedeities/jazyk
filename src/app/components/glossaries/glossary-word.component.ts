import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { FlashCard } from 'app/models/word.model';
import { Subject } from 'rxjs';

@Component({
  selector: 'km-glossary-word',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'glossary-word.component.html',
  styleUrls: ['glossary-word.component.css']
})

export class GlossaryWordComponent {
  @Input() text: Object;
  @Input() flashCard: FlashCard;
  @Input() lanFrom: string;
  @Input() audioPath: string;
  @Input() side = 'none';
  @Input() showWordType = true;
  @Input() showAudio = true;
  @Input() flipped: Subject<boolean>;
}
