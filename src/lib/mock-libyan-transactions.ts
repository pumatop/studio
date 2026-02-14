import type { DetailedLibyanTransaction } from "@/lib/types";

// Get a reference date from the most recent user's lastSeen
const now = new Date();

export const mockLibyanTransactions: DetailedLibyanTransaction[] = [
  {
    id: "txn_ly_1",
    operationType: "تحويل للجنيه",
    senderPhone: "+218912345678",
    sentAmount: 500,
    serviceFee: 5,
    exchangeRate: 9.65,
    receivedAmount: 4825,
    recipientPhone: "+201012345678",
    convertedAmountEGP: 4825,
    timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    status: "ناجحة",
  },
  {
    id: "txn_ly_2",
    operationType: "كرت شحن",
    senderPhone: "+218923456789",
    sentAmount: 52,
    serviceFee: 2,
    receivedAmount: 50,
    cardType: "ليبيانا",
    cardDenomination: 50,
    cardSerial: "12345678901234",
    cardPin: "5678",
    timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    status: "ناجحة",
  },
  {
    id: "txn_ly_3",
    operationType: "تحويل داخلي",
    senderPhone: "+218911122334",
    sentAmount: 2001,
    serviceFee: 1,
    receivedAmount: 2000,
    recipientPhone: "+218945678901",
    timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    status: "ناجحة",
  },
  {
    id: "txn_ly_4",
    operationType: "تحويل للجنيه",
    senderPhone: "+218912345678",
    sentAmount: 1000,
    serviceFee: 10,
    exchangeRate: 9.60,
    receivedAmount: 9600,
    recipientPhone: "+201123456789",
    convertedAmountEGP: 9600,
    timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    status: "ناجحة",
  },
  {
    id: "txn_ly_5",
    operationType: "كرت شحن",
    senderPhone: "+218912345678",
    sentAmount: 105,
    serviceFee: 5,
    receivedAmount: 100,
    cardType: "المدار",
    cardDenomination: 100,
    timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    status: "مرفوضة",
  },
    {
    id: 'txn_ly_6',
    operationType: 'تحويل داخلي',
    senderPhone: '+218923456789',
    sentAmount: 500.5,
    serviceFee: 0.5,
    receivedAmount: 500,
    recipientPhone: '+218912345678',
    timestamp: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
    status: 'ناجحة',
  },
  {
    id: 'txn_ly_7',
    operationType: 'تحويل للجنيه',
    senderPhone: '+218911122334',
    sentAmount: 10000,
    serviceFee: 50,
    exchangeRate: 9.65,
    receivedAmount: 96500,
    recipientPhone: '+201234567890',
    convertedAmountEGP: 96500,
    timestamp: new Date(now.getTime() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
    status: 'ناجحة',
  },
  {
    id: 'txn_ly_8',
    operationType: 'تحويل للجنيه',
    senderPhone: '+218911122334',
    sentAmount: 10,
    serviceFee: 1,
    exchangeRate: 9.65,
    receivedAmount: 96.5,
    recipientPhone: '+201234567890',
    convertedAmountEGP: 96.5,
    timestamp: new Date(now.getTime() - 25 * 60 * 1000).toISOString(), // 25 minutes ago
    status: 'ناجحة',
  },
   {
    id: "txn_ly_9",
    operationType: "تحويل للجنيه",
    senderPhone: "+218928765432",
    sentAmount: 150,
    serviceFee: 2,
    exchangeRate: 9.65,
    receivedAmount: 1447.5,
    recipientPhone: "+201012345678",
    convertedAmountEGP: 1447.5,
    timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
    status: "ناجحة",
  },
  {
    id: "txn_ly_10",
    operationType: "كرت شحن",
    senderPhone: "+218912345678",
    sentAmount: 12,
    serviceFee: 2,
    receivedAmount: 10,
    cardType: "ليبيانا",
    cardDenomination: 10,
    cardSerial: "98765432109876",
    cardPin: "4321",
    timestamp: new Date(now.getTime() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
    status: "ناجحة",
  }
];
