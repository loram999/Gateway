export interface Workspace {
  id: string;
  name: string;
  api_key: string;
  owner_name?: string;
  created_at: string;
  accounts_count?: number;
  total_balance?: number;
}

export interface WaveAccount {
  phone: string;
  workspace_id?: string;
  workspace_name?: string;
  device_id: string;
  model: string;
  os_version: string;
  wmt_mfs: string;
  pin: string;
  balance?: number;
  name?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Merchant {
  merchant_name: string;
  domain: string;
  token: string;
  created_at: string;
  active: boolean;
}

export interface PaymentTokenRecord {
  auth_token?: string;
  withdraw_token?: string;
  token?: string;
  type: 'deposit' | 'withdraw';
  workspace_id?: string;
  merchant_token: string;
  merchant_name?: string;
  domain?: string;
  amount: number;
  phone_number?: string;
  phone?: string;
  receiver?: string;
  created_at: number;
  expires_at: number;
  status: 'pending' | 'authorized' | 'success' | 'executed' | 'expired';
  trx_id?: string;
  executed_from?: string;
  last5_digits?: string;
  verified_at?: number;
}

export interface TransactionHistoryItem {
  transId: string;
  amount: number;
  direction?: 'CR' | 'DR';
  title?: string;
  time?: string;
  senderPhone?: string;
  receiverPhone?: string;
}

export interface GatewayLog {
  id: number;
  event_type: string;
  level: string;
  message: string;
  details?: string;
  forwarded_to_bot: number;
  created_at: string;
}
