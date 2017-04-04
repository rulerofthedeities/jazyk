import { JazykPage } from './app.po';

describe('jazyk App', () => {
  let page: JazykPage;

  beforeEach(() => {
    page = new JazykPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
