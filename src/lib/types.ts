export type Transaction = {
  id: string;
  date: string;
  amount: number;
  product: string;
  category: 'إلكترونيات' | 'ملابس' | 'طعام' | 'أثاث' | 'كتب';
  paymentMethod: 'بطاقة ائتمان' | 'نقد' | 'تحويل بنكي';
};
