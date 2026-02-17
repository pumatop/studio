// Base User Type from RTDB
export type User = {
  id: string; // Will be added from the object key
  balanceEGP: number;
  balanceLYD: number;
  createdAt: number;
  lastLogin: string;
  lastUpdate: number;
  name: string;
  phone: string;
  pin: string;
  role: 'user' | 'admin' | string; // Can be other roles
  status: 'active' | 'inactive' | 'banned';
  verification: 'verified' | 'unverified' | 'pending';
};

// Discriminated union for Transactions from RTDB
type BaseTransaction = {
  id: string; // Will be added from the object key
  status: 'completed' | 'pending' | 'failed';
  timestamp: number;
};

export type RechargePurchaseTransaction = BaseTransaction & {
  type: 'recharge_purchase';
  amount: number;
  balanceAfter: number;
  balanceBefore: number;
  cardType: string;
  userId: string;
  userName: string;
  userPhone: string;
};

export type AccountTransferTransaction = BaseTransaction & {
  type: 'account_transfer';
  amount: number;
  fee: number;
  recipientBalanceAfter: number;
  recipientBalanceBefore: number;
  recipientId: string;
  recipientName: string;
  recipientPhone: string;
  senderBalanceAfter: number;
  senderBalanceBefore: number;
  senderId: string;
  senderName: string;
  senderPhone: string;
  totalDeduction: number;
};

export type EgyptTransferTransaction = BaseTransaction & {
  type: 'egypt_transfer';
  amountEGP: number;
  amountLYD: number;
  balanceEGPAfter: number;
  balanceEGPBefore: number;
  balanceLYDAfter: number;
  balanceLYDBefore: number;
  exchangeRate: number;
  userId: string;
  userName:string;
  userPhone: string;
};

export type Transaction = 
  | RechargePurchaseTransaction 
  | AccountTransferTransaction 
  | EgyptTransferTransaction;

// Keeping other types from the original file that might be used elsewhere
export type ExchangeRate = {
  id: string;
  currencyPair: string;
  rate: number;
  lastUpdated: string;
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

export type FeeTier = {
  id: string;
  from: number;
  to: number;
  fee: number;
};

export type Agent = {
  id: string;
  name: string;
  phone: string;
  address: string;
};

export type Region = {
  id: string;
  name: string;
  agents: Agent[];
};

// This type is based on mock data and may need to be updated or removed.
export type EgyptianTransfer = any;
