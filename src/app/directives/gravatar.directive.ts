import { Directive, ElementRef, Input, OnInit, Renderer2} from '@angular/core';

@Directive({
  selector: '[kmGravatar]'
})
export class GravatarDirective implements OnInit {
  @Input() hash: string;
  @Input() width = 32;
  @Input() fallback = 'identicon';

  constructor(
    private renderer: Renderer2,
    private element: ElementRef
  ) {}

  ngOnInit() {
    this.renderer.setAttribute(
      this.element.nativeElement,
      'src',
      `//www.gravatar.com/avatar/${this.hash}?s=${this.width}&d=${this.fallback}`
    );
  }
}
