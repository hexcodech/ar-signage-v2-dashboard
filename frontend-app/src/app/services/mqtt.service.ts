import { Injectable } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { ReplaySubject, Subject } from '../../../node_modules/rxjs';

@Injectable({
  providedIn: 'root'
})
export class MqttService {

  public mqttModule: any;
  public mqttModuleObservable: ReplaySubject<any> = new ReplaySubject<any>(1);
  public mqttMessageObservable: Subject<{topic: string, message: string}> = new Subject<{topic: string, message: string}>();

  constructor(private electronService: ElectronService) {
    this.mqttModule = new (this.electronService.remote.require('./modules/mqtt.js'))();
    this.connect();
  }

  private connect() {
    this.mqttModule.setCallback((topic, message) => this.mqttMessageObservable.next({topic, message}));
    this.mqttModule.connect().then(ip => {
      this.mqttModuleObservable.next(ip);
    });
  }
}
