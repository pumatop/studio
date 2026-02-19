// Base User Type from RTDB

export type UserSession = {
  activeDevice: string;
  phoneOS: string;
  connectionStatus: 'متصل' | 'غير متصل';
  ipAddress: string;
  lastLogin: string;
  lastUpdate: number;
};

export type User = {
  id: string;
  balanceEGP: number;
  balanceLYD: number;
  balanceEgyptianPending: number;
  createdAt: number;
  name: string;
  phone: string;
  pin: string;
  role: 'admin' | 'user' | 'merchant';
  status: 'active' | 'banned';
  verification: 'verified' | 'unverified' | 'pending';
  
  // For backward compatibility, these can exist at root
  connectionStatus?: 'متصل' | 'غير متصل';
  lastLogin?: string;
  lastUpdate?: number;
  activeDevice?: string;
  phoneOS?: string;
  ipAddress?: string;

  idImageUrl?: string;
  idImageBackUrl?: string | null;
  idImageOtherUrl?: string | null;
  lastPasswordChange?: number;
  lastPinChange?: number;
  sessions?: { [sessionId: string]: UserSession };
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
  serialNumber?: string;
  code?: string;
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
  userName: string;
  userPhone: string;
  recipientName: string;
  recipientNumber: string;
  transferType: 'محفظة كاش' | 'انستاباي' | 'وصلني البيت';
  serviceFee: number;
  delegateId?: string;
  delegateName?: string;
  executionDuration?: string;
  receiptImageUrl?: string; // Optional field
};

export type Transaction = 
  | RechargePurchaseTransaction 
  | AccountTransferTransaction 
  | EgyptTransferTransaction;

// Types for Exchange Rate page
export type ExchangeRate = {
  id: string;
  currencyPair: string;
  rate: number;
  lastUpdated: string;
};

export type ExchangeRateLog = {
  id: string;
  date: string;
  modifiedBy: string;
  oldRate: number;
  newRate: number;
  currencyPair: string;
};

export type DailyRate = {
  date: string;
  rate: number;
};

export type FakkaLog = {
  id: string;
  transactionId: string;
  amount: number;
  timestamp: number;
  userName: string;
  userPhone: string;
};

export type FakkaSafe = {
  totalFakka: number;
  logs: { [key: string]: Omit<FakkaLog, 'id'> };
};


// Types for Supervisors page
export type Supervisor = {
  id: string;
  name: string;
  phone: string;
  canEditExchangeRate: boolean;
  connectionStatus: 'متصل' | 'غير متصل';
  lastSeen: string;
  password?: string;
  specialization: ('محفظة كاش' | 'انستاباي' | 'وصلني البيت')[];
  status: 'نشط' | 'غير نشط';
};

// Types for Settings page
export type RateCondition = {
  id: string;
  type: "amount" | "time";
  value: number | string;
  targetRate: number;
  createdBy: string;
};

export type FeeTier = {
  from: number;
  to: number;
  fee: number;
};

export type Agent = {
  name: string;
  phone: string;
  address: string;
};

export type Region = {
  name: string;
  agents: { [key: string]: Agent };
};

// Main settings object from RTDB
export type MainSettings = {
    isMaintenance: boolean;
    forceUpdate: boolean;
    isOtpDisabled: boolean;
    isRegistrationDisabled: boolean;
};

export type TransactionLimits = {
    internal: {
        unverified: { min: number, max: number },
        verified: { min: number, max: number },
        merchant: { min: number, max: number },
    },
    egypt: {
        instapay: { min: number, max: number },
        wallet: { min: number, max: number },
        delivery: { min: number, max: number },
    }
};

export type AppSettings = {
    banners: (string | null)[];
    supportNumbers: {
        libyan: string;
        egyptian: string;
    };
    regions: { [key: string]: Region };
};

export type FeeSettings = {
    internal: { [key: string]: FeeTier };
    wallet: { [key: string]: FeeTier };
    instapay: { [key: string]: FeeTier };
    delivery: { [key: string]: FeeTier };
    internalFreeTransactions: number;
};

export type ExchangeControlSettings = {
    mode: "manual" | "auto";
    isOpen: boolean;
    autoCloseThreshold: number;
    currentRate: number;
    autoConditionsActive: boolean;
    conditions: { [key: string]: RateCondition };
    timezone: string;
};

// Unified settings type for RTDB
export type AllSettings = {
    main: MainSettings;
    limits: TransactionLimits;
    fees: FeeSettings;
    app: AppSettings;
    exchangeControl: ExchangeControlSettings;
};
