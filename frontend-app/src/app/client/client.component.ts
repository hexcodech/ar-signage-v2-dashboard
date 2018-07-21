import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ClientsService } from '../services/clients.service';
import { MqttService } from '../services/mqtt.service';
import { RoomsService } from '../services/rooms.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

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
