export interface JopaccAccountResponse {
  customerId: string;
  accountId: string;
  accountStatus: 'active' | 'suspended' | 'closed';
  mainRoute: { schema: string; address: string };
  accountType?: { code: string; name: string };
  accountCurrency: string;
  availableBalance?: { balanceAmount: number; balancePosition: string };
  lockedForCredit?: boolean;
  lockedForDebit?: boolean;
  accountHolderType?: string;
  institutionBasicInfo?: {
    institutionType?: string;
    institutionIdentification?: { schema: string; address: string };
    name?: { enName?: string; arName?: string };
  };
  branchBasicInfo?: {
    name?: { enName?: string; arName?: string };
  };
  [key: string]: unknown;
}

export interface JopaccBalancesResponse {
  availableBalance: { balanceAmount: number; balancePosition: string };
  currentBalance: { balanceAmount: number; balancePosition: string };
  creditlimit?: number;
  balanceCurrency: string;
  lastModificationDate: string;
}

export interface CafRequest {
  instructionAmount: { amount: number; currency: string };
}

export interface CafResponse {
  fundsAvailable: boolean;
  instructionAmount: { amount: number; currency: string };
  validityDateTime?: string;
}

export interface IbanConfirmationResponse {
  status: string;
  currencies: string[];
  institutionBasicInfo: {
    institutionType: string;
    institutionIdentification: string;
    name: { enName: string; arName: string };
    contact?: { email?: string; phoneNumber?: string };
  };
  lockedForCredit: boolean;
  lockedForDebit: boolean;
  accountOwner: {
    name: { enName: string; arName: string };
    accountHolderType: string;
    address?: unknown;
  };
  additionalInformation?: string;
}

export interface IbanNotFoundResponse {
  id: string;
  code: string;
  desc: string;
}

export interface PisInvolvedParty {
  involvedPartyType: 'cdtr' | 'dbtr';
  involvedParty: {
    enName: string;
    address: {
      addresslines: string[];
      city?: string;
      state?: string;
      postcode?: string;
      countryInfo: { countryCode: string; countryName: string };
    };
  };
}

export interface PisInitiationRequest {
  groupHeader: {
    batchBooking: string;
    numberOfTrx: string;
    paymentMethod: string;
    totalTrxAmount: { amount: number; currency: string };
    batchPurpose: string;
  };
  instructionsInfo: Array<{
    trxAmount: { amount: number; currency: string };
    clearingChannel: string;
    localInstrument: string;
    serviceLevel: string;
    categoryPurpose: string;
    identifications: { endToEnd: string; quoteId: string; SOSPId: string };
    settlementDate: string;
    fees?: Array<{ feeType: string; frequency: string; feeAmount: { amount: number; currency: string } }>;
    involvedParties: PisInvolvedParty[];
    accounts: Array<{ mainRoute: { schema: string; address: string }; accountType: string }>;
    agents: Array<{ agentType: string; agent: { agentIdentification: { schema: string; address: string }; enName: string } }>;
    remittanceInformation?: { unstructured: string[] };
    trxPresDateTime: string;
  }>;
}

export interface PisInitiationResponse {
  messageId: string;
  totalResult: string;
  groupHeader: unknown;
  instructionsInfo: Array<{ instructionId: string; result: string; [key: string]: unknown }>;
  UUID: string;
  timestamp: string;
}
