import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { CashFlowDay } from '../entities/cashflow-day.entity';
import { Payment } from '../entities/payment.entity';
import { Supplier } from '../entities/supplier.entity';
import * as fs from 'fs';
import * as path from 'path';
import Groq from 'groq-sdk';
import FormData from 'form-data';

const groq = new Groq({ apiKey: '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' });

export interface ExtractedPaymentData {
  supplierName: string;
  amount: number;
  date: string;
  description?: string;
}

export interface SupplierMatch {
  id: number;
  name: string;
  similarity: number;
}

@Injectable()
export class VoiceService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(CashFlowDay)
    private cashFlowDayRepository: Repository<CashFlowDay>,
    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,
  ) {}

  async transcribeAndAnalyze(file: any): Promise<any> {
    let audioPath: string | null = null;
    
    try {
      console.log('Received file:', file ? 'Yes' : 'No');
      
      if (!file || !file.buffer) {
        throw new Error('No audio file received');
      }

      // Save audio file temporarily
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const timestamp = Date.now();
      audioPath = path.join(tempDir, `audio_${timestamp}.webm`);
      
      console.log('Saving audio file to:', audioPath);
      fs.writeFileSync(audioPath, file.buffer);
      console.log('Audio file saved successfully');

      // Transcribe using Groq Whisper API
      console.log('Starting Groq Whisper API transcription...');
      const transcription = await this.transcribeWithGroqWhisper(audioPath);
      console.log('Transcription completed:', transcription);

      // Clean up audio file
      if (fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
        console.log('Audio file cleaned up');
      }

      // Analyze text with AI to extract payment data
      console.log('Starting AI analysis...');
      const extractedData = await this.analyzeTextWithAI(transcription);
      console.log('AI analysis completed:', extractedData);

      // Search for matching suppliers
      console.log('Searching for suppliers...');
      const suppliers = await this.searchSuppliers(extractedData.supplierName);
      console.log('Found suppliers:', suppliers.length);

      return {
        transcription,
        extractedData,
        suppliers,
        needsSupplierSelection: suppliers.length !== 1,
      };
    } catch (error) {
      console.error('Error in transcribeAndAnalyze:', error);
      
      // Clean up files in case of error
      if (audioPath && fs.existsSync(audioPath)) {
        try {
          fs.unlinkSync(audioPath);
        } catch (cleanupError) {
          console.error('Failed to cleanup audio file:', cleanupError);
        }
      }
      
      throw new HttpException(
        `فشل في معالجة الصوت: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async transcribeWithGroqWhisper(audioPath: string): Promise<string> {
    try {
      console.log('Starting Groq Whisper API transcription for:', audioPath);
      
      // Check if audio file exists
      if (!fs.existsSync(audioPath)) {
        throw new Error(`Audio file not found: ${audioPath}`);
      }
      
      console.log('Audio file size:', fs.statSync(audioPath).size, 'bytes');
      
      // Create form data for Groq API
      const formData = new FormData();
      formData.append('file', fs.createReadStream(audioPath));
      formData.append('model', 'whisper-large-v3');
      formData.append('temperature', '0');
      formData.append('response_format', 'verbose_json');
      formData.append('language', 'ar');
      
      // Call Groq Whisper API
      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groq.apiKey}`,
          ...formData.getHeaders(),
        },
        body: formData as any,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API error: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      const transcription = result.text?.trim() || '';
      
      console.log('Groq Whisper transcription:', transcription);
      
      if (!transcription) {
        throw new Error('Transcription is empty');
      }
      
      return transcription;
    } catch (error) {
      console.error('Groq Whisper transcription error:', error);
      throw new Error(`Transcription failed: ${error.message}`);
    }
  }

  private async analyzeTextWithAI(text: string): Promise<any> {
    try {
      // Get current date for automatic year
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
      const currentDay = String(now.getDate()).padStart(2, '0');
      const todayDate = `${currentYear}-${currentMonth}-${currentDay}`;

      // Get all supplier names from database
      const suppliers = await this.supplierRepository.find();
      const supplierNames = suppliers.map(s => s.name).join('، ');

      const completion = await groq.chat.completions.create({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content: `
أنت نظام محاسبي ذكي.
مهمتك استخراج بيانات منظمة من نص عربي محاسبي.
أرجع JSON فقط بدون أي شرح.

قواعد مهمة جداً:
1. استخرج فقط المعلومات الموجودة في النص - لا تخترع أو تفترض أي شيء
2. إذا لم تجد اسم مورد في النص، اجعل supplier = null
3. لا تحاول تخمين اسم المورد من كلمات غير واضحة

قواعد التاريخ:
- إذا قال "اليوم" أو لم يذكر تاريخ: استخدم ${todayDate}
- إذا ذكر رقمين منفصلين (مثل "2 2" أو "5 3"): الرقم الأول هو اليوم والرقم الثاني هو الشهر، استخدم السنة الحالية ${currentYear}
- إذا ذكر يوم وشهر فقط (مثل "3 فبراير"): استخدم السنة الحالية ${currentYear}
- إذا ذكر التاريخ كاملاً: استخدمه كما هو
- التاريخ يجب أن يكون بصيغة YYYY-MM-DD
- انتبه: "2 2" تعني اليوم 2 من الشهر 2 (2026-02-02) وليس اليوم 22 (2026-02-22)

قائمة الموردين المتاحين:
${supplierNames}

قواعد اسم المورد:
- ابحث عن اسم المورد في النص المعطى فقط
- إذا وجدت اسم يطابق أحد الأسماء من القائمة أعلاه، استخدمه
- إذا لم تجد اسم مورد واضح في النص، اجعل supplier = null
- ممنوع منعاً باتاً اختراع أو تخمين أسماء غير موجودة في النص

الصيغة المطلوبة:
{
  "supplier": "اسم المورد",
  "amount": رقم المبلغ,
  "date": "YYYY-MM-DD",
  "type": "payment"
}
`
          },
          {
            role: 'user',
            content: `
استخرج من النص التالي فقط:
- supplier (string or null) - اسم المورد إذا ذُكر بوضوح في النص، وإلا null
- amount (number) - المبلغ بالأرقام فقط
- date (ISO YYYY-MM-DD) - التاريخ (استخدم السنة الحالية ${currentYear} إذا لم تُذكر)
- type (payment | invoice | expense) - نوع العملية

التاريخ الحالي: ${todayDate}

تحذير: استخرج فقط ما هو موجود في النص. لا تخترع أسماء موردين.

النص:
"${text}"
`
          }
        ]
      });

      const content = completion.choices[0].message.content;
      console.log('AI raw response:', content);
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('Failed to extract JSON from AI response');
      }

      const extractedData = JSON.parse(jsonMatch[0]);
      console.log('AI extracted data:', extractedData);

      // Validate supplier name - it must appear in the original text
      let supplierName = extractedData.supplier || '';
      if (supplierName && !text.toLowerCase().includes(supplierName.toLowerCase())) {
        console.log(`WARNING: AI extracted supplier "${supplierName}" not found in text "${text}"`);
        console.log('Setting supplier to empty string to trigger manual search');
        supplierName = ''; // Force manual search if supplier name doesn't appear in text
      }

      return {
        supplierName: supplierName,
        amount: parseFloat(extractedData.amount) || 0,
        date: extractedData.date || new Date().toISOString().split('T')[0],
        description: text,
      };
    } catch (error) {
      throw new Error(`AI analysis failed: ${error.message}`);
    }
  }

  async searchSuppliers(name: string): Promise<SupplierMatch[]> {
    try {
      // Get all suppliers
      const suppliers = await this.supplierRepository.find();

      // Filter and calculate similarity
      const matches: SupplierMatch[] = [];
      const searchLower = name.toLowerCase().trim();

      suppliers.forEach((supplier) => {
        const supplierLower = supplier.name.toLowerCase().trim();
        
        // Only exact match - no fuzzy matching
        if (supplierLower === searchLower) {
          matches.push({ id: supplier.id, name: supplier.name, similarity: 100 });
        }
      });

      // Return exact matches only, or empty array to trigger manual search
      return matches;
    } catch (error) {
      throw new Error(`Supplier search failed: ${error.message}`);
    }
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    // Initialize matrix
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  async savePayment(paymentData: any): Promise<any> {
    try {
      const { supplierId, amount, date, notes, storageLocation } = paymentData;

      console.log('Saving payment:', { supplierId, amount, date, storageLocation });

      let result: any = {
        success: true,
        storageLocation,
      };

      // Save exclusively based on storage location
      if (storageLocation === 'cashflow') {
        // Save ONLY in CashFlow (not in Payment table)
        const cashFlowPayment = await this.addToCashFlowOnly(supplierId, amount, date, notes);
        result.message = 'تم حفظ الدفعة في CashFlow فقط';
        result.cashFlowPayment = cashFlowPayment;
      } else {
        // Save ONLY in Suppliers page (Payment table)
        const payment = this.paymentRepository.create({
          supplierId: parseInt(supplierId),
          amount: parseFloat(amount),
          date: new Date(date),
          notes: notes || '',
        });

        await this.paymentRepository.save(payment);
        console.log('Payment saved to Suppliers page:', payment.id);
        
        result.message = 'تم حفظ الدفعة في صفحة الموردين فقط';
        result.payment = payment;
      }

      return result;
    } catch (error) {
      console.error('Error saving payment:', error);
      throw new HttpException(
        `فشل في حفظ الدفعة: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async addToCashFlowOnly(supplierId: number, amount: number, dateStr: string, notes: string): Promise<any> {
    try {
      console.log('Adding to CashFlow only for date:', dateStr);
      
      // Import CashFlowPayment entity dynamically
      const CashFlowPayment = (await import('../entities/cashflow-payment.entity')).CashFlowPayment;
      const cashFlowPaymentRepo = this.paymentRepository.manager.getRepository(CashFlowPayment);

      // Find or create CashFlowDay for the date
      let cashFlowDay = await this.cashFlowDayRepository.findOne({
        where: { date: dateStr },
        relations: ['payments'],
      });

      if (!cashFlowDay) {
        console.log('CashFlowDay not found, creating new one');
        cashFlowDay = this.cashFlowDayRepository.create({
          date: dateStr,
          sales: 0,
          openingCash: 0,
          payments: [],
        });
        await this.cashFlowDayRepository.save(cashFlowDay);
        console.log('Created new CashFlowDay:', cashFlowDay.id);
      } else {
        console.log('Found existing CashFlowDay:', cashFlowDay.id);
      }

      // Get supplier info
      const supplier = await this.supplierRepository.findOne({
        where: { id: supplierId },
      });

      console.log('Supplier info:', supplier?.name);

      // Create CashFlowPayment entry
      const cashFlowPayment = cashFlowPaymentRepo.create({
        recipientName: supplier?.name || 'مورد غير معروف',
        amount: parseFloat(amount.toString()),
        date: dateStr,
        description: notes || `دفعة للمورد ${supplier?.name}`,
        cashFlowDay: cashFlowDay,
      });

      await cashFlowPaymentRepo.save(cashFlowPayment);
      console.log('CashFlowPayment saved successfully:', cashFlowPayment.id);

      return cashFlowPayment;
    } catch (error: any) {
      console.error('Error adding to CashFlow only:', error);
      console.error('Error stack:', error.stack);
      throw new Error(`Failed to add to CashFlow: ${error.message}`);
    }
  }

  private async addToCashFlow(payment: Payment, dateStr: string): Promise<any> {
    try {
      console.log('Adding to CashFlow for date:', dateStr);
      
      // Import CashFlowPayment entity dynamically
      const CashFlowPayment = (await import('../entities/cashflow-payment.entity')).CashFlowPayment;
      const cashFlowPaymentRepo = this.paymentRepository.manager.getRepository(CashFlowPayment);

      // Find or create CashFlowDay for the date
      let cashFlowDay = await this.cashFlowDayRepository.findOne({
        where: { date: dateStr },
        relations: ['payments'],
      });

      if (!cashFlowDay) {
        console.log('CashFlowDay not found, creating new one');
        cashFlowDay = this.cashFlowDayRepository.create({
          date: dateStr,
          sales: 0,
          openingCash: 0,
          payments: [],
        });
        await this.cashFlowDayRepository.save(cashFlowDay);
        console.log('Created new CashFlowDay:', cashFlowDay.id);
      } else {
        console.log('Found existing CashFlowDay:', cashFlowDay.id);
      }

      // Get supplier info
      const supplier = await this.supplierRepository.findOne({
        where: { id: payment.supplierId },
      });

      console.log('Supplier info:', supplier?.name);

      // Create CashFlowPayment entry
      const cashFlowPayment = cashFlowPaymentRepo.create({
        recipientName: supplier?.name || 'مورد غير معروف',
        amount: payment.amount,
        date: dateStr,
        description: payment.notes || `دفعة للمورد ${supplier?.name}`,
        cashFlowDay: cashFlowDay,
      });

      await cashFlowPaymentRepo.save(cashFlowPayment);
      console.log('CashFlowPayment saved successfully:', cashFlowPayment.id);

      return cashFlowPayment;
    } catch (error: any) {
      console.error('Error adding to CashFlow:', error);
      console.error('Error stack:', error.stack);
      throw new Error(`Failed to add to CashFlow: ${error.message}`);
    }
  }
}
