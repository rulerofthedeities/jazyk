import { Component, OnInit, OnDestroy } from '@angular/core';

@Component({
  templateUrl: 'listen.component.html',
  styleUrls: ['listen.component.css']
})

export class ListenComponent implements OnInit, OnDestroy {
  private componentActive = true;

  ngOnInit() {
    this.getDependables();
  }

  getDependables() {

  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
