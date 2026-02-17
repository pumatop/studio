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

// This is a more complete type for Egyptian Transfers, combining mock and real data structures.
export type EgyptTransferTransaction = BaseTransaction & {
  type: 'egypt_transfer';
  // From original RTDB data
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
  // Fields from mock data that are useful
  recipientName: string;
  recipientNumber: string; // e.g. bank account, phone for vodafone cash etc.
  transferType: 'محفظة كاش' | 'انستاباي' | 'وصلني البيت';
  serviceFee: number;
  delegateId?: string;
  delegateName?: string;
  executionDuration?: string;
  receiptImageUrl?: string;
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
};

export type DailyRate = {
  date: string;
  rate: number;
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

// Main settings object
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
    regions: Region[];
};

export type FeeSettings = {
    internal: FeeTier[];
    wallet: FeeTier[];
    instapay: FeeTier[];
    delivery: FeeTier[];
    internalFreeTransactions: number;
};

export type ExchangeControlSettings = {
    mode: "manual" | "auto";
    isOpen: boolean;
    autoCloseThreshold: number;
    currentRate: number;
    autoConditionsActive: boolean;
    conditions: RateCondition[];
};

// Unified settings type for RTDB
export type AllSettings = {
    main: MainSettings;
    limits: TransactionLimits;
    fees: FeeSettings;
    app: AppSettings;
    exchangeControl: ExchangeControlSettings;
}
