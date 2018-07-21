import { TestBed, inject } from '@angular/core/testing';

import { MediaCacheService } from './media-cache.service';

describe('MediaCacheService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MediaCacheService]
    });
  });

  it('should be created', inject([MediaCacheService], (service: MediaCacheService) => {
    expect(service).toBeTruthy();
  }));
});
