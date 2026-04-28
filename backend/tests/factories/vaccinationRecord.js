const { faker } = require('@faker-js/faker');
const StellarSdk = require('@stellar/stellar-sdk');

/**
 * Generates a mock vaccination record.
 * @param {Object} overrides - Values to override in the generated record.
 * @returns {Object} A vaccination record object.
 */
const vaccinationRecordFactory = (overrides = {}) => {
  return {
    patient_address: overrides.patient_address || StellarSdk.Keypair.random().publicKey(),
    vaccine_name: overrides.vaccine_name || faker.helpers.arrayElement(['MMR', 'COVID-19', 'Hepatitis B', 'Influenza']),
    date_administered: overrides.date_administered || faker.date.recent().toISOString().split('T')[0],
    issuer_address: overrides.issuer_address || StellarSdk.Keypair.random().publicKey(),
    lot_number: overrides.lot_number || faker.string.alphanumeric(8).toUpperCase(),
    ...overrides
  };
};

module.exports = vaccinationRecordFactory;
