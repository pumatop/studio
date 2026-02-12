export type Transaction = {
  id: string;
  date: string;
  amount: number;
  product: string;
  category: 'إلكترونيات' | 'ملابس' | 'طعام' | 'أثاث' | 'كتب' | 'خدمات' | 'صحة';
  paymentMethod: 'بطاقة ائتمان' | 'نقد' | 'تحويل بنكي';
};

export type DetailedLibyanTransaction = {
  id: string;
  operationType: 'تحويل داخلي' | 'تحويل للجنيه' | 'كرت شحن';
  senderPhone: string;
  sentAmount: number;
  serviceFee: number;
  exchangeRate?: number;
  receivedAmount: number;
  recipientPhone?: string;
  convertedAmountEGP?: number;
  cardType?: 'ليبيانا' | 'المدار';
  cardDenomination?: number;
  cardSerial?: string;
  cardPin?: string;
  timestamp: string;
  status: 'ناجحة' | 'مرفوضة';
};

export type ExchangeRate = {
  id: string;
  currencyPair: string;
  rate: number;
  lastUpdated: string;
};

export type User = {
  id: string;
  name: string;
  phone: string;
  type: 'مستخدم' | 'تاجر';
  connectionStatus: 'متصل' | 'غير متصل';
  lastSeen: string;
  verificationStatus: 'موثق' | 'غير موثق' | 'قيد المراجعة';
  status: 'نشط' | 'محظور';
  balanceLibyan: number;
  balanceEgyptian: number;
  balanceEgyptianPending: number;
  accountOpenDate: string;
  idImageUrl: string;
  lastPasswordChange: string;
  lastPinChange: string;
  activeDevice: string;
  ipAddress: string;
  phoneOS: 'iOS' | 'Android';
};

export type Supervisor = {
  id: string;
  name: string;
  phone: string;
  canEditExchangeRate: boolean;
  connectionStatus: 'متصل' | 'غير متصل';
  lastSeen: string;
  password?: string;
  specialization: string[];
  dailyTransferValue: number;
  monthlyTransferValue: number;
  dailyOperationCount: number;
  monthlyOperationCount: number;
  status: 'نشط' | 'غير نشط';
};

export type ExchangeRateLog = {
  id: string;
  date: string;
  modifiedBy: string;
  oldRate: number;
  newRate: number;
};

export type DailyRate = {
  date: string;
  rate: number;
};

export type RateCondition = {
  id: string;
  type: "amount" | "time";
  value: number | string;
  targetRate: number;
  createdBy: string;
};

export type EgyptianTransfer = {
  id: string;
  userName: string;
  userPhone: string;
  transferType: 'محفظة كاش' | 'انستاباي' | 'وصلني البيت';
  sentAmount: number;
  recipientNumber: string;
  serviceFee: number;
  totalDeducted: number;
  recipientName: string;
  delegate: string;
  requestTimestamp: string;
  status: 'ناجح' | 'مرفوض' | 'قيد التحويل';
  executionDuration: string;
  receiptImageUrl?: string;
};
