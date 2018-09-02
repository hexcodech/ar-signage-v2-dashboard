import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ClientsService } from '../services/clients.service';
import { MqttService } from '../services/mqtt.service';
import { RoomsService } from '../services/rooms.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MediaCacheService } from '../services/media-cache.service';

@Component({
  selector: 'app-client',
  templateUrl: './client.component.html',
  styleUrls: ['./client.component.scss']
})
export class ClientComponent implements OnInit {
  public selectedRoom: string;
  public clientsJSON: any;
  public clients: any = {};
  public clientsLoading = true;
  public mediaCacheUrl: string;
  public Date = Date;

  constructor(
    private modalService: NgbModal,
    private mqttService: MqttService,
    private clientsService: ClientsService,
    private roomsService: RoomsService,
    private mediaCacheService: MediaCacheService,
    private changeRef: ChangeDetectorRef,
  ) { }

  ngOnInit() {
    this.mqttService.mqttMessageObservable.subscribe(message => {
      this.mqttMessageHandler(message.topic, message.message);
      this.changeRef.detectChanges();
    });

    this.clientsService.getClients().then(clients => {
      this.clientsLoading = false;
      this.clientsJSON = clients;

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

      this.cleanUpClients();
    });
    this.roomsService.selectedRoomObservable.subscribe(room => this.selectedRoom = room);
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
        this.mediaCacheService.init(messageObject.value);
        // Download all already known videos
        for (const roomKey of Object.keys(this.clients)) {
          const foundClient = this.clients[roomKey].find(x => x.media && x.media.type === 'video' && x.media.content);
          if (foundClient) {
            this.mediaCacheService.mediaCacheModule.getLink(foundClient.media.content).then((url) => {
              foundClient.media.videoUrl = url;
              this.changeRef.detectChanges();
            }).catch((err) => console.error(err));
          }
        }
        break;
      case topic.match(/^ar-signage\/.+\/.+\/alive$/g) && topic.match(/^ar-signage\/.+\/.+\/alive$/g).length > 0:
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
            alive: null,
          });
          this.cleanUpClients();
        }

        this.clients[roomname].find(x => x.uid === uid).alive = messageObject.value;
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
            media: null,
          });
          this.cleanUpClients();
        }

        this.clients[roomname].find(x => x.uid === uid).media = messageObject.value;
        // Download if media type is a video
        if (messageObject.value.type === 'video' && this.mediaCacheService.mediaCacheModule) {
          this.mediaCacheService.mediaCacheModule.getLink(messageObject.value.content).then((url) => {
            this.clients[roomname].find(x => x.uid === uid).media.videoUrl = url;
            this.changeRef.detectChanges();
          }).catch((err) => console.error(err));
        }
        break;
      case topic.match(/^ar-signage\/.+\/.+\/media\/video\/currenttime$/g) &&
      topic.match(/^ar-signage\/.+\/.+\/media\/video\/currenttime$/g).length > 0:
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
            video_curenttime: null,
          });
          this.cleanUpClients();
        }

        this.clients[roomname].find(x => x.uid === uid).video_curenttime = messageObject.value;
        if (document.getElementById('video' + uid) && messageObject.value.current > 0) {
          document.getElementById('video' + uid)['currentTime'] = messageObject.value.current;
        }
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
          this.cleanUpClients();
        }

        this.clients[roomname].find(x => x.uid === uid).audio_background_control = messageObject.value;
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
          this.cleanUpClients();
        }

        this.clients[roomname].find(x => x.uid === uid).audio_background_mediaid = messageObject.value;
        break;
    }
  }

  playMedia(folderName: string, clientName: string, fileName: string, clientUID: string) {
    const mediaId = `${this.selectedRoom}/${clientName}/${folderName}/${fileName}`;
    switch (folderName) {
      case 'videos':
        this.mqttService.mqttModule.mqttClient.publish(`ar-signage/${this.selectedRoom}/${clientUID}/media`, JSON.stringify({
          value: {
            type: 'video',
            content: mediaId,
          }
        }), {retain: true});
        break;
      case 'images':
        this.mqttService.mqttModule.mqttClient.publish(`ar-signage/${this.selectedRoom}/${clientUID}/media`, JSON.stringify({
          value: {
            type: 'image',
            content: mediaId,
          }
        }), {retain: true});
        break;
      case 'audio_oneshot':
        this.mqttService.mqttModule.mqttClient.publish(`ar-signage/${this.selectedRoom}/${clientUID}/audio/oneshot`, JSON.stringify({
          value: mediaId,
        }));
        break;
      case 'audio_background':
        this.mqttService.mqttModule.mqttClient.publish(`ar-signage/${this.selectedRoom}/${clientUID}/audio/background`, JSON.stringify({
          value: mediaId,
        }), {retain: true});
        this.mqttService.mqttModule.mqttClient.publish(
          `ar-signage/${this.selectedRoom}/${clientUID}/audio/background/control`, JSON.stringify({
          value: 'START',
        }), {retain: true});
        break;
    }
  }

  backgroundAudioControl(action: string, client: any) {
    if (!client.audio_background_mediaid) {
      this.mqttService.mqttModule.mqttClient.publish(
        `ar-signage/${this.selectedRoom}/${client.uid}/audio/background/control`, JSON.stringify({
        value: 'RESET',
      }), {retain: true});
      return;
    }

    this.mqttService.mqttModule.mqttClient.publish(
      `ar-signage/${this.selectedRoom}/${client.uid}/audio/background/control`, JSON.stringify({
      value: action,
    }), {retain: true});

    if (action === 'RESET') {
      this.mqttService.mqttModule.mqttClient.publish(
        `ar-signage/${this.selectedRoom}/${client.uid}/audio/background`, JSON.stringify({
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

  public onMediaDrop(media, clientUID) {
    this.playMedia(media.data.mediaTypeName, media.data.clientName, media.data.mediaName, clientUID);
  }

  public setText(textModal, uid) {
    this.modalService.open(textModal, {ariaLabelledBy: 'modal-basic-title'}).result.then(result => {
      this.mqttService.mqttModule.mqttClient.publish(`ar-signage/${this.selectedRoom}/${uid}/media`, JSON.stringify({
        value: {
          type: 'text',
          content: result
        }
      }), {retain: true});
    }).catch(err => {
      // Closed without submiting
    });
  }

  public setTimer(uid) {
    this.mqttService.mqttModule.mqttClient.publish(`ar-signage/${this.selectedRoom}/${uid}/media`, JSON.stringify({
      value: {
        type: 'timer',
        content: null
      }
    }), {retain: true});
  }

  private cleanUpClients() {
    if (!this.clientsJSON) {
      this.clientsService.getClients().then(clients => {
        this.clientsJSON = clients;

        for (const roomKey of Object.keys(this.clients)) {
          for (let clientIndex = 0; clientIndex < this.clients[roomKey].length; clientIndex++) {
            if (!(this.clientsJSON[this.clients[roomKey][clientIndex].uid]
              && this.clientsJSON[this.clients[roomKey][clientIndex].uid]['roomname'] === roomKey)) {
              this.clients[roomKey].splice(clientIndex, 1);
            }
          }
        }
      });
    } else {
      for (const roomKey of Object.keys(this.clients)) {
        for (let clientIndex = 0; clientIndex < this.clients[roomKey].length; clientIndex++) {
          if (!(this.clientsJSON[this.clients[roomKey][clientIndex].uid]
            && this.clientsJSON[this.clients[roomKey][clientIndex].uid]['roomname'] === roomKey)) {
            this.clients[roomKey].splice(clientIndex, 1);
          }
        }
      }
    }

    this.sortClients();
  }

  private sortClients() {
    for (const roomKey of Object.keys(this.clients)) {
      this.clients[roomKey].sort((a, b) => {
        if (!a.clientname || !b.clientname) {
          return 0;
        }
        const x = a.clientname.toLowerCase();
        const y = b.clientname.toLowerCase();

        if (x < y) { return -1; }
        if (x > y) { return 1; }
        return 0;
      });
    }
  }

}
