import {Directive, ElementRef, Renderer2, Input, OnChanges} from '@angular/core';

@Directive({
  selector: '[wordColor]'
})

export class WordColorDirective implements OnChanges {
  @Input() identifier: string;
  @Input() tpe: string;

  constructor(
    private element: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnChanges() {
    let color = 'black';
    if (this.tpe === 'noun') {
      color = this.getColor();
    }
    this.color(color);
  }

  private getColor() {
    let color = 'black';
    if (this.identifier) {
      switch (this.identifier.toLowerCase()) {
        case 'f': color = 'red'; break;
        case 'mi': color = 'darkBlue'; break;
        case 'ma': color = 'dodgerBlue'; break;
        case 'n': color = 'green'; break;
        default: color = 'black';
      }
      console.log(color);
    }
    return color;
  }

  private color(color: string) {
    this.renderer.setStyle(this.element.nativeElement, 'color', color);
  }
}
