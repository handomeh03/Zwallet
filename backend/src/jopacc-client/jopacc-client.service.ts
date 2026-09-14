import {
  BadGatewayException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosError } from 'axios';
import { randomUUID } from 'crypto';
import { JwsSigningService } from './jws-signing.service';
import {
  CafResponse,
  IbanConfirmationResponse,
  IbanNotFoundResponse,
  JopaccAccountResponse,
  JopaccBalancesResponse,
  PisInitiationRequest,
  PisInitiationResponse,
} from './dto/jopacc.types';

export interface JopaccCallLog {
  callType: 'ACCOUNTS' | 'BALANCES' | 'CAF' | 'IBAN_CONFIRMATION' | 'PIS';
  requestPayload?: unknown;
  responsePayload?: unknown;
}

@Injectable()
export class JopaccClientService {
  private readonly logger = new Logger(JopaccClientService.name);
  private readonly http: AxiosInstance;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwsSigningService: JwsSigningService,
  ) {
    this.http = axios.create({
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.configService.get<string>('jopacc.authToken'),
      },
      timeout: 15000,
    });

    // Mock JWS signing: sign every outgoing request body and attach the
    // signature as headers. Centralized here so no calling module ever
    // needs to know signing exists.
    this.http.interceptors.request.use((config) => {
      const { signature, keyId } = this.jwsSigningService.sign(config.data);
      config.headers.set('x-jws-signature', signature);
      config.headers.set('x-jws-kid', keyId);
      this.logger.debug(`Signed outgoing request to ${config.url} with kid=${keyId}`);
      return config;
    });
  }

  async getAccount(
    accountAddress: string,
    context: { customerId: string; ipAddress?: string },
  ): Promise<JopaccAccountResponse> {
    const base = this.configService.get<string>('jopacc.accountsBaseUrl')!;
    const url = this.buildUrl(base, `/accounts/${encodeURIComponent(accountAddress)}`);

    const headers = {
      ...this.buildCustomerHeaders(context),
      accountSchema: this.detectAccountSchema(accountAddress),
    };

    return this.request<JopaccAccountResponse>('ACCOUNTS', () => this.http.get(url, { headers }));
  }

  private detectAccountSchema(accountAddress: string): 'IBAN' | 'accountId' {
    return /^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(accountAddress) ? 'IBAN' : 'accountId';
  }

  async  getBalances(
    accountId: string,
    context: { customerId: string; ipAddress?: string },
  ): Promise<JopaccBalancesResponse> {
    const base = this.configService.get<string>('jopacc.balancesBaseUrl')!;
    const url = this.buildUrl(base, `/accounts/${encodeURIComponent(accountId)}/balances`);
    const headers = this.buildCustomerHeaders(context);
    return this.request<JopaccBalancesResponse>('BALANCES', () => this.http.get(url, { headers }));
  }

  /**
   * Headers the JoPACC gateway requires per-caller (open-banking style
   * identification headers), shared across the endpoints that need them.
   */
  private buildCustomerHeaders(context: { customerId: string; ipAddress?: string }) {
    return {
      'x-customer-user-agent': this.configService.get<string>('jopacc.customerUserAgent'),
      'x-interactions-id': randomUUID(),
      'x-financial-id': this.configService.get<string>('jopacc.financialId'),
      'x-idempotency-key': randomUUID(),
      'x-auth-date': new Date().toUTCString(),
      'x-customer-id': context.customerId,
      'x-customer-ip-address': context.ipAddress ?? '127.0.0.1',
    };
  }

  async confirmAvailability(
    accountId: string,
    amount: number,
    currency: string,
    context: { customerId: string; ipAddress?: string },
  ): Promise<CafResponse> {
    const base = this.configService.get<string>('jopacc.cafBaseUrl')!;
    const url = this.buildUrl(base, `/accounts/${encodeURIComponent(accountId)}/CAF`);
    const body = { instructionAmount: { amount, currency } };
    const headers = this.buildCustomerHeaders(context);
    return this.request<CafResponse>('CAF', () => this.http.post(url, body, { headers }), body);
  }

  async confirmIban(
    iban: string,
    context: { customerId: string; ipAddress?: string },
  ): Promise<{ found: true; data: IbanConfirmationResponse } | { found: false; data: IbanNotFoundResponse }> {
    const base = this.configService.get<string>('jopacc.ibanConfirmationBaseUrl')!;
    const url = this.buildUrl(base, `/institution/ibanConf`);
    const headers = { ...this.buildCustomerHeaders(context), accountId: iban };
    try {
      const response = await this.http.get<IbanConfirmationResponse>(url, { headers });
      this.logJopaccCall('IBAN_CONFIRMATION', { accountId: iban }, response.data);
      return { found: true, data: response.data };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        const data = error.response.data as IbanNotFoundResponse;
        this.logJopaccCall('IBAN_CONFIRMATION', { accountId: iban }, data);
        return { found: false, data };
      }
      this.handleError('IBAN_CONFIRMATION', error);
    }
  }

  async initiatePayment(
    payload: PisInitiationRequest,
    context: { customerId: string; ipAddress?: string },
  ): Promise<PisInitiationResponse> {
    const base = this.configService.get<string>('jopacc.pisBaseUrl')!;
    const url = this.buildUrl(base, `/PIS/initiation`);
    const headers = this.buildCustomerHeaders(context);
    return this.request<PisInitiationResponse>(
      'PIS',
      () => this.http.post(url, payload, { headers }),
      payload,
    );
  }

  private async request<T>(
    callType: JopaccCallLog['callType'],
    fn: () => Promise<{ data: T }>,
    requestPayload?: unknown,
  ): Promise<T> {
    try {
      const response = await fn();
      this.logJopaccCall(callType, requestPayload, response.data);
      return response.data;
    } catch (error) {
      this.handleError(callType, error, requestPayload);
    }
  }

  private handleError(
    callType: JopaccCallLog['callType'],
    error: unknown,
    requestPayload?: unknown,
  ): never {
    const axiosError = error as AxiosError;
    this.logJopaccCall(callType, requestPayload, axiosError.response?.data);
    this.logger.error(
      `JoPACC ${callType} call failed: ${axiosError.message} — ${JSON.stringify(axiosError.response?.data)}`,
    );

    if (axiosError.response?.status === 404) {
      throw new NotFoundException(axiosError.response.data ?? 'Not found');
    }

    // Surface the provider's own error body (e.g. `{ code, desc }`) when
    // present — it's usually more useful than the generic axios message.
    const body = axiosError.response?.data as { code?: string; desc?: string } | undefined;
    const detail = body?.desc ? `${body.desc}${body.code ? ` (${body.code})` : ''}` : axiosError.message;
    throw new BadGatewayException(`JoPACC ${callType} call failed: ${detail}`);
  }

  private logJopaccCall(
    callType: JopaccCallLog['callType'],
    requestPayload: unknown,
    responsePayload: unknown,
  ) {
    this.logger.log(
      `JoPACC ${callType} — request=${JSON.stringify(requestPayload)} response=${JSON.stringify(responsePayload)}`,
    );
  }

  private buildUrl(base: string, path: string): string {
    return encodeURI(`${base}${path}`);
  }
}
