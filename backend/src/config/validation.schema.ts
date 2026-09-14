import * as Joi from 'joi';

export const validationSchema = Joi.object({
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  JOPACC_AUTH_TOKEN: Joi.string().required(),
  JOPACC_ACCOUNTS_BASE_URL: Joi.string().required(),
  JOPACC_BALANCES_BASE_URL: Joi.string().required(),
  JOPACC_CAF_BASE_URL: Joi.string().required(),
  JOPACC_IBAN_CONFIRMATION_BASE_URL: Joi.string().required(),
  JOPACC_PIS_BASE_URL: Joi.string().required(),
  JOPACC_FINANCIAL_ID: Joi.string().default('zwallet-sandbox-tpp'),
  JOPACC_CUSTOMER_USER_AGENT: Joi.string().default('ZWallet-Backend/1.0'),
  JWS_SIGNING_PRIVATE_KEY_PATH: Joi.string().default('./.jws-keys/private.pem'),
  JWS_SIGNING_PUBLIC_KEY_PATH: Joi.string().default('./.jws-keys/public.pem'),
  JWS_SIGNING_KEY_ID: Joi.string().default('zwallet-mock-1'),
  ADMIN_EMAIL: Joi.string().default('admin@zwallet.local'),
  ADMIN_PASSWORD: Joi.string().default('ChangeMe123!'),
  ADMIN_SETTLEMENT_IBAN: Joi.string().default('JO27CBJO0000000000000000001001'),
});
