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
  public clients: any = {};
  public mediaCacheUrl: string;

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
      for (const clientUID of Object.keys(clients)) {
        if (!this.clients[clients[clientUID].roomname]) {
          this.clients[clients[clientUID].roomname] = [];
        }
        if (!this.clients[clients[clientUID].roomname].find(x => x.uid === clientUID)) {
          this.clients[clients[clientUID].roomname].push({
            uid: clientUID,
            clientname: clients[clientUID].clientname,
            media: null,
            video_curenttime: null,
            audio_background_control: null,
          });
        } else {
          this.clients[clients[clientUID].roomname].find(x => x.uid === clientUID).clientname = clients[clientUID].clientname;
        }
      }

      // Remove clients not anymore existing
      for (const roomKey of Object.keys(this.clients)) {
        for (let clientIndex = 0; clientIndex < this.clients[roomKey].length; clientIndex++) {
          if (!(clients[this.clients[roomKey][clientIndex].uid]
            && clients[this.clients[roomKey][clientIndex].uid]['roomname'] === roomKey)) {
            this.clients[roomKey].splice(clientIndex, 1);
          }
        }
      }
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
            video_curenttime: null,
            audio_background_control: null,
          });
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
            media: null,
            video_curenttime: null,
            audio_background_control: null,
          });
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
            media: null,
            video_curenttime: null,
            audio_background_control: null,
          });
        }

        this.clients[roomname].find(x => x.uid === uid).audio_background_control = messageObject.value;
        break;
    }
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

}
