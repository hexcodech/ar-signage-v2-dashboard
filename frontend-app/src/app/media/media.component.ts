import { Component, OnInit } from '@angular/core';
import { RoomsService } from '../services/rooms.service';
import { MediaListService } from '../services/media-list.service';

@Component({
  selector: 'app-media',
  templateUrl: './media.component.html',
  styleUrls: ['./media.component.scss']
})
export class MediaComponent implements OnInit {
  public selectedRoom: string;
  public mediaList: any = {};

  constructor(
    private roomsService: RoomsService,
    private mediaListService: MediaListService,
  ) { }

  ngOnInit() {
    this.roomsService.selectedRoomObservable.subscribe(room => this.selectedRoom = room);
    this.mediaListService.getMediaList().then(mediaList => {
      for (const mediaTopDir of mediaList) {
        if (mediaTopDir.children) {
          this.mediaList[mediaTopDir.name] = mediaTopDir.children;
        } else {
          this.mediaList[mediaTopDir.name] = [];
        }
      }
    });
  }

}
