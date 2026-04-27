import { Keypair, Address, nativeToScVal } from '@stellar/stellar-sdk';
import db from '../src/indexer/db.js';
import { invokeContract } from '../src/stellar/soroban.js';

const DEMO_ISSUER_SECRET = process.env.DEMO_ISSUER_SECRET;
const ADMIN_SECRET = process.env.ADMIN_SECRET;

async function seedDemoEnvironment() {
  console.log('🔄 Starting Demo Environment Reset...');

  console.log('🧹 Clearing backend database...');
  await db.query('TRUNCATE TABLE vaccinations, users, audit_logs CASCADE;');

  console.log('⚙️ Interacting with Soroban contract...');
  const issuerKeypair = Keypair.fromSecret(DEMO_ISSUER_SECRET);
  const issuerPubkey = issuerKeypair.publicKey();

  try {
    console.log('Adding Demo Issuer...');
    
    await invokeContract(
      ADMIN_SECRET,
      'add_issuer',
      [
        new Address(issuerPubkey).toScVal(),
        nativeToScVal("VacciChain Demo Hospital", { type: 'string' }),
        nativeToScVal("DEMO-LIC-001", { type: 'string' }),
        nativeToScVal("Global", { type: 'string' })
      ]
    );
    console.log(`✅ Demo Issuer authorized: ${issuerPubkey}`);

    const samplePatients = [
      Keypair.random().publicKey(),
      Keypair.random().publicKey()
    ];

    console.log('💉 Minting sample vaccination records...');
    const today = new Date().toISOString().split('T')[0];

    for (const patientPubkey of samplePatients) {
      await invokeContract(
        DEMO_ISSUER_SECRET,
        'mint_vaccination',
        [
          new Address(patientPubkey).toScVal(),
          nativeToScVal("Demo Vax-COVID19", { type: 'string' }),
          nativeToScVal(today, { type: 'string' }),
          new Address(issuerPubkey).toScVal()
        ]
      );
      console.log(`✅ Minted record for demo patient: ${patientPubkey}`);
    }

    console.log('🎉 Demo environment seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to seed demo environment:', error);
    process.exit(1);
  }
}

seedDemoEnvironment();