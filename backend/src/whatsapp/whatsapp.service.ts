import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class WhatsAppService {
  private readonly phoneNumber = '+972593272987';
  
  async sendNotification(message: string): Promise<void> {
    try {
      const formattedPhone = this.phoneNumber.replace(/[^0-9]/g, '');
      const encodedMessage = encodeURIComponent(message);
      
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`;
      
      console.log(`WhatsApp notification would be sent to ${this.phoneNumber}: ${message}`);
      console.log(`WhatsApp URL: ${whatsappUrl}`);
      
    } catch (error) {
      console.error('Error sending WhatsApp notification:', error);
    }
  }

  async sendNotificationViaAPI(message: string): Promise<void> {
    try {
      const apiUrl = process.env.WHATSAPP_API_URL;
      const apiToken = process.env.WHATSAPP_API_TOKEN;
      
      if (!apiUrl || !apiToken) {
        console.log('WhatsApp API not configured. Message:', message);
        return;
      }

      await axios.post(
        apiUrl,
        {
          phone: this.phoneNumber,
          message: message,
        },
        {
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      console.log(`WhatsApp message sent successfully to ${this.phoneNumber}`);
    } catch (error) {
      console.error('Error sending WhatsApp message via API:', error.message);
    }
  }
}
