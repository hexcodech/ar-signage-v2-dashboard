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
          this.clients[clients[clientUID].roomname].push({
            uid: clientUID,
            clientname: clients[clientUID].clientname,
          });
        } else {
          this.clients[clients[clientUID].roomname].find(x => x.uid === clientUID).clientname = clients[clientUID].clientname;
        }
      }

      this.cleanUpClients(clients);
    });
  }

  playMedia(folderName: string, clientName: string, fileName: string) {
    const uid = this.getClientByClientname(clientName).uid;
    const mediaId = `${this.selectedRoom}/${clientName}/${folderName}/${fileName}`;
    switch (folderName) {
      case 'videos':
        this.mqttService.mqttModule.mqttClient.publish(`ar-signage/${this.selectedRoom}/${uid}/media`, JSON.stringify({
          value: {
            type: 'video',
            content: mediaId,
          }
        }), {retain: true});
        break;
      case 'images':
        this.mqttService.mqttModule.mqttClient.publish(`ar-signage/${this.selectedRoom}/${uid}/media`, JSON.stringify({
          value: {
            type: 'image',
            content: mediaId,
          }
        }), {retain: true});
        break;
      case 'audio_oneshot':
        this.mqttService.mqttModule.mqttClient.publish(`ar-signage/${this.selectedRoom}/${uid}/audio/oneshot`, JSON.stringify({
          value: mediaId,
        }));
        break;
      case 'audio_background':
        this.mqttService.mqttModule.mqttClient.publish(`ar-signage/${this.selectedRoom}/${uid}/audio/background`, JSON.stringify({
          value: mediaId,
        }), {retain: true});
        this.mqttService.mqttModule.mqttClient.publish(`ar-signage/${this.selectedRoom}/${uid}/audio/background/control`, JSON.stringify({
          value: 'START',
        }), {retain: true});
        break;
    }
  }

  backgroundAudioControl(action: string, clientName: string) {
    const client = this.getClientByClientname(clientName);
    const uid = client.uid;

    if (!client.audio_background_mediaid) {
      this.mqttService.mqttModule.mqttClient.publish(`ar-signage/${this.selectedRoom}/${uid}/audio/background/control`, JSON.stringify({
        value: 'RESET',
      }), {retain: true});
      return;
    }

    this.mqttService.mqttModule.mqttClient.publish(`ar-signage/${this.selectedRoom}/${uid}/audio/background/control`, JSON.stringify({
      value: action,
    }), {retain: true});
    
    if (action === 'RESET') {
      this.mqttService.mqttModule.mqttClient.publish(`ar-signage/${this.selectedRoom}/${uid}/audio/background`, JSON.stringify({
        value: null,
      }), {retain: true});
    }
  }

  getClientByClientname(clientName: string) {
    if (!this.clients || !this.clients[this.selectedRoom]) {
      return null;
    }

    return this.clients[this.selectedRoom].find(x => x.clientname === clientName);
  }

  private mqttMessageHandler(topic, message) {
    let messageObject;
    let roomname, uid;
    try {
      messageObject = JSON.parse(message.toString());
    } catch (err) {
      console.error(`mqttMessageHandler JSON parse error: ${err.toString()}`);
    }

    switch (true) {
      case topic === `ar-signage/dashboard/mediacacheurl`:
        this.mediaCacheUrl = messageObject.value;
        break;
      case topic.match(/^ar-signage\/.+\/.+\/media$/g) && topic.match(/^ar-signage\/.+\/.+\/media$/g).length > 0:
        roomname = topic.split(/[\/\/]/g)[1];
        uid = topic.split(/[\/\/]/g)[2];
        if (!roomname || !uid) {
          return;
        }
        if (!this.clients[roomname]) {
          this.clients[roomname] = [];
        }
        if (!this.clients[roomname].find(x => x.uid === uid)) {
          this.clients[roomname].push({
            uid,
            mediaid: null,
          });
        }

        this.clients[roomname].find(x => x.uid === uid).mediaid = messageObject.value.content;
        break;
      case topic.match(/^ar-signage\/.+\/.+\/audio\/background$/g) && topic.match(/^ar-signage\/.+\/.+\/audio\/background$/g).length > 0:
        roomname = topic.split(/[\/\/]/g)[1];
        uid = topic.split(/[\/\/]/g)[2];
        if (!roomname || !uid) {
          return;
        }
        if (!this.clients[roomname]) {
          this.clients[roomname] = [];
        }
        if (!this.clients[roomname].find(x => x.uid === uid)) {
          this.clients[roomname].push({
            uid,
            audio_background_mediaid: null,
          });
        }

        this.clients[roomname].find(x => x.uid === uid).audio_background_mediaid = messageObject.value;
        break;
      case topic.match(/^ar-signage\/.+\/.+\/audio\/background\/control$/g) &&
           topic.match(/^ar-signage\/.+\/.+\/audio\/background\/control$/g).length > 0:
        roomname = topic.split(/[\/\/]/g)[1];
        uid = topic.split(/[\/\/]/g)[2];
        if (!roomname || !uid) {
          return;
        }
        if (!this.clients[roomname]) {
          this.clients[roomname] = [];
        }
        if (!this.clients[roomname].find(x => x.uid === uid)) {
          this.clients[roomname].push({
            uid,
            audio_background_control: null,
          });
        }

        this.clients[roomname].find(x => x.uid === uid).audio_background_control = messageObject.value;
        break;
    }
  }

  private cleanUpClients(clients) {
          // Remove clients not anymore existing
          for (const roomKey of Object.keys(this.clients)) {
            for (let clientIndex = 0; clientIndex < this.clients[roomKey].length; clientIndex++) {
              if (!(clients[this.clients[roomKey][clientIndex].uid]
                && clients[this.clients[roomKey][clientIndex].uid]['roomname'] === roomKey)) {
                this.clients[roomKey].splice(clientIndex, 1);
              }
            }
          }
  }

}
