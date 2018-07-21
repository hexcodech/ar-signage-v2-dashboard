import { Component } from '@angular/core';
import { MqttService } from './services/mqtt.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(private mqttService: MqttService) {
    this.mqttService.mqttModuleObservable.subscribe(ip => {
      console.log(`Client connected to mqtt ${ip}`);
      this.mqttService.mqttModule.mqttClient.subscribe(`ar-signage/+/timer/seconds`);
      this.mqttService.mqttModule.mqttClient.subscribe(`ar-signage/dashboard/roomsurl`);
      this.mqttService.mqttModule.mqttClient.subscribe(`ar-signage/dashboard/clientsurl`);
      this.mqttService.mqttModule.mqttClient.subscribe(`ar-signage/dashboard/medialisturl`);
      this.mqttService.mqttModule.mqttClient.subscribe(`ar-signage/dashboard/mediacacheurl`);

      this.mqttService.mqttModule.mqttClient.subscribe(`ar-signage/+/+/media`);

      this.mqttService.mqttModule.mqttClient.publish(`ar-signage/devicediscovery`, JSON.stringify({
        value: {
          role: 'dashboard'
        }
      }));
    });
  }
}
