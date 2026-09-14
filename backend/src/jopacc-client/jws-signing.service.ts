import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createSign, generateKeyPairSync } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname } from 'path';

/**
 * MOCK JWS (JSON Web Signature) signer.
 *
 * This does NOT implement real RFC 7515 JWS and is not validated by JoPACC.
 * It exists to centralize where request signing happens so the app looks and
 * behaves as if every outgoing JoPACC call is signed, while remaining a drop-in
 * swap point for a real JoPACC-issued signing key later.
 */
@Injectable()
export class JwsSigningService implements OnModuleInit {
  private readonly logger = new Logger(JwsSigningService.name);
  private privateKey!: string;
  private keyId!: string;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const privateKeyPath = this.configService.get<string>('jws.privateKeyPath')!;
    const publicKeyPath = this.configService.get<string>('jws.publicKeyPath')!;
    this.keyId = this.configService.get<string>('jws.keyId')!;

    if (!existsSync(privateKeyPath)) {
      this.logger.warn(
        `No JWS signing key found at ${privateKeyPath}. Generating a placeholder RSA keypair for mock signing.`,
      );
      const { privateKey, publicKey } = generateKeyPairSync('rsa', {
        modulusLength: 2048,
        privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
        publicKeyEncoding: { type: 'spki', format: 'pem' },
      });
      mkdirSync(dirname(privateKeyPath), { recursive: true });
      writeFileSync(privateKeyPath, privateKey);
      writeFileSync(publicKeyPath, publicKey);
    }

    this.privateKey = readFileSync(privateKeyPath, 'utf-8');
  }

  sign(payload: unknown): { signature: string; keyId: string } {
    const serialized = JSON.stringify(payload ?? {});
    const signer = createSign('RSA-SHA256');
    signer.update(serialized);
    signer.end();
    const signature = signer.sign(this.privateKey, 'base64');
    return { signature, keyId: this.keyId };
  }
}
