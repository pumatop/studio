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
  email: string;
  role: 'مشرف' | 'مندوب';
  status: 'نشط' | 'غير نشط';
  lastLogin: string;
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
