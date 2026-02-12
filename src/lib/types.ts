export type Transaction = {
  id: string;
  date: string;
  amount: number;
  product: string;
  category: 'إلكترونيات' | 'ملابس' | 'طعام' | 'أثاث' | 'كتب' | 'خدمات' | 'صحة';
  paymentMethod: 'بطاقة ائتمان' | 'نقد' | 'تحويل بنكي';
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
  email: string;
  phone: string;
  status: 'نشط' | 'محظور';
  createdAt: string;
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

export type PointOfSale = {
  id: string;
  name: string;
  balance: number;
  status: 'نشط' | 'غير نشط';
  createdAt: string;
};
