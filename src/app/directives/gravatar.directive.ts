import { Directive, ElementRef, Input, OnInit } from '@angular/core';

@Directive({
  selector: '[kmGravatar]'
})
export class GravatarDirective implements OnInit {
  @Input() hash: string;
  @Input() width = 32;
  @Input() fallback = 'identicon';

  constructor(
    private elementRef: ElementRef
  ) {}

  ngOnInit() {
    this.elementRef.nativeElement.src = `//www.gravatar.com/avatar/${this.hash}?s=${this.width}&d=${this.fallback}`;
  }
}
