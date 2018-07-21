import { Injectable } from '@angular/core';
import { ElectronService } from 'ngx-electron';

@Injectable({
  providedIn: 'root'
})
export class MediaCacheService {
  public mediaCacheModule: any;

  constructor(private electronService: ElectronService) { }

  public init(mediaCacheUrl: String) {
    this.mediaCacheModule = new (this.electronService.remote.require('./modules/mediaCache.js'))(mediaCacheUrl);
  }
}
