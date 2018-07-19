import { TestBed, inject } from '@angular/core/testing';

import { MediaListService } from './media-list.service';

describe('MediaListService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MediaListService]
    });
  });

  it('should be created', inject([MediaListService], (service: MediaListService) => {
    expect(service).toBeTruthy();
  }));
});
