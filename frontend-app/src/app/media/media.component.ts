import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RoomsService } from '../services/rooms.service';
import { MediaListService } from '../services/media-list.service';
import { MqttService } from '../services/mqtt.service';
import { ClientsService } from '../services/clients.service';

@Component({
  selector: 'app-media',
  templateUrl: './media.component.html',
  styleUrls: ['./media.component.scss']
})
export class MediaComponent implements OnInit {
  public selectedRoom: string;
  public mediaList: any = {};
  public clients: any = {};
  public mediaCacheUrl: string;

  constructor(
    private mqttService: MqttService,
    private roomsService: RoomsService,
    private clientsService: ClientsService,
    private mediaListService: MediaListService,
    private changeRef: ChangeDetectorRef,
  ) { }

  ngOnInit() {
    this.mqttService.mqttMessageObservable.subscribe(message => {
      this.mqttMessageHandler(message.topic, message.message);
      this.changeRef.detectChanges();
    });
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
    this.clientsService.getClients().then(clients => {
      for (const clientUID of Object.keys(clients)) {
        if (!this.clients[clients[clientUID].roomname]) {
          this.clients[clients[clientUID].roomname] = [];
        }
        if (!this.clients[clients[clientUID].roomname].find(x => x.uid === clientUID)) {
          this.clients[clients[clientUID].roomname].push({uid: clientUID, clientname: clients[clientUID].clientname, mediaType: null});
        } else {
          this.clients[clients[clientUID].roomname].find(x => x.uid === clientUID).clientname = clients[clientUID].clientname;
        }
      }
    });
  }

  playMedia(folderName: string, clientName: string, fileName: string) {
    const uid = this.clients[this.selectedRoom].find(x => x.clientname === clientName).uid;
    switch (folderName) {
      case 'videos':
        this.mqttService.mqttModule.mqttClient.publish(`ar-signage/${this.selectedRoom}/${uid}/media`, JSON.stringify({
          value: {
            type: 'video',
            content: `${this.selectedRoom}/${clientName}/${folderName}/${fileName}`
          }
        }), {retain: true});
        break;
      case 'images':
        this.mqttService.mqttModule.mqttClient.publish(`ar-signage/${this.selectedRoom}/${uid}/media`, JSON.stringify({
          value: {
            type: 'image',
            content: `${this.selectedRoom}/${clientName}/${folderName}/${fileName}`
          }
        }), {retain: true});
        break;
    }
  }

  private mqttMessageHandler(topic, message) {
    let messageObject;
    try {
      messageObject = JSON.parse(message.toString());
    } catch (err) {
      console.error(`mqttMessageHandler JSON parse error: ${err.toString()}`);
    }

    switch (topic) {
      case `ar-signage/dashboard/mediacacheurl`:
        this.mediaCacheUrl = messageObject.value;
        break;
    }
  }

}
