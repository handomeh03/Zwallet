export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  databaseUrl: process.env.DATABASE_URL,
  jwt: {
    secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
  jopacc: {
    authToken: process.env.JOPACC_AUTH_TOKEN ?? '',
    accountsBaseUrl: process.env.JOPACC_ACCOUNTS_BASE_URL ?? '',
    balancesBaseUrl: process.env.JOPACC_BALANCES_BASE_URL ?? '',
    cafBaseUrl: process.env.JOPACC_CAF_BASE_URL ?? '',
    ibanConfirmationBaseUrl: process.env.JOPACC_IBAN_CONFIRMATION_BASE_URL ?? '',
    pisBaseUrl: process.env.JOPACC_PIS_BASE_URL ?? '',
    financialId: process.env.JOPACC_FINANCIAL_ID ?? 'zwallet-sandbox-tpp',
    customerUserAgent: process.env.JOPACC_CUSTOMER_USER_AGENT ?? 'ZWallet-Backend/1.0',
  },
  jws: {
    privateKeyPath: process.env.JWS_SIGNING_PRIVATE_KEY_PATH ?? './.jws-keys/private.pem',
    publicKeyPath: process.env.JWS_SIGNING_PUBLIC_KEY_PATH ?? './.jws-keys/public.pem',
    keyId: process.env.JWS_SIGNING_KEY_ID ?? 'zwallet-mock-1',
  },
  admin: {
    email: process.env.ADMIN_EMAIL ?? 'admin@zwallet.local',
    password: process.env.ADMIN_PASSWORD ?? 'ChangeMe123!',
    settlementIban: process.env.ADMIN_SETTLEMENT_IBAN ?? 'JO27CBJO0000000000000000001001',
  },
});
