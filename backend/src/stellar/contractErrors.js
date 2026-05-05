const StellarSdk = require('@stellar/stellar-sdk');

const CONTRACT_ERRORS = Object.freeze({
  1: { name: 'AlreadyInitialized', message: 'Contract is already initialized.' },
  2: { name: 'NotInitialized', message: 'Contract is not initialized.' },
  3: { name: 'Unauthorized', message: 'Caller is not authorized for this action.' },
  4: { name: 'ProposalExpired', message: 'Admin transfer proposal has expired.' },
  5: { name: 'NoPendingTransfer', message: 'No pending admin transfer exists.' },
  6: { name: 'DuplicateRecord', message: 'An identical vaccination record already exists.' },
  7: { name: 'RecordNotFound', message: 'Vaccination record not found.' },
  8: { name: 'AlreadyRevoked', message: 'Vaccination record is already revoked.' },
  9: { name: 'InvalidInput', message: 'Input failed validation.' },
  10: { name: 'InvalidInputVaccineName', message: 'Vaccine name exceeds 100 characters.' },
  11: { name: 'InvalidInputDateAdministered', message: 'Date administered exceeds 100 characters.' },
  12: { name: 'InvalidInputIssuerName', message: 'Issuer name exceeds 100 characters.' },
  13: { name: 'InvalidInputLicense', message: 'Issuer license exceeds 100 characters.' },
  14: { name: 'InvalidInputCountry', message: 'Issuer country exceeds 100 characters.' },
  15: { name: 'SoulboundToken', message: 'Transfers are disabled for soulbound records.' },
  16: { name: 'PatientNotRegistered', message: 'Patient has not self-registered.' },
});

function getContractErrorInfo(code) {
  return CONTRACT_ERRORS[code] || null;
}

function toNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'bigint') return Number(value);
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function extractContractErrorCodeFromText(text) {
  if (!text || typeof text !== 'string') return null;

  const patterns = [
    /Error\(Contract,\s*#(\d+)\)/i,
    /Contract\s*,\s*#(\d+)/i,
    /Contract\s*#\s*(\d+)/i,
    /Contract\s*error\s*[:#]?\s*(\d+)/i,
    /ContractError\s*\(?\s*(\d+)\s*\)?/i,
    /SCE_CONTRACT\s*\(?\s*#?\s*(\d+)\s*\)?/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return Number(match[1]);
  }

  return null;
}

function pickFirstValue(obj, names) {
  if (!obj) return null;
  for (const name of names) {
    if (typeof obj[name] === 'function') {
      const value = obj[name]();
      if (value !== undefined) return value;
    }
    if (Object.prototype.hasOwnProperty.call(obj, name)) {
      const value = obj[name];
      if (value !== undefined) return value;
    }
  }
  return null;
}

function tryExtractScError(node, depth = 0) {
  if (!node || depth > 5) return null;
  if (node instanceof StellarSdk.xdr.ScError) return node;

  if (typeof node.switch === 'function') {
    const type = node.switch();
    const typeName = type && (type.name || String(type));
    if (typeName && String(typeName).toLowerCase().includes('contract')) {
      return node;
    }
  }

  const direct = pickFirstValue(node, ['error', 'err', 'value', 'result']);
  const directError = tryExtractScError(direct, depth + 1);
  if (directError) return directError;

  const secondary = pickFirstValue(node, ['success', 'failure', 'ok']);
  return tryExtractScError(secondary, depth + 1);
}

function extractContractErrorCodeFromScError(scError) {
  if (!scError || typeof scError.switch !== 'function') return null;
  const type = scError.switch();
  const typeName = type && (type.name || String(type));
  if (!typeName || !String(typeName).toLowerCase().includes('contract')) return null;

  const codeValue = pickFirstValue(scError, ['contractCode', 'code', 'value']);
  return toNumber(codeValue);
}

function extractContractErrorCodeFromXdr(resultXdr) {
  if (!resultXdr || typeof resultXdr !== 'string') return null;
  try {
    const txResult = StellarSdk.xdr.TransactionResult.fromXDR(resultXdr, 'base64');
    const result = typeof txResult.result === 'function' ? txResult.result() : null;
    const opResults = result && typeof result.results === 'function' ? result.results() : null;
    if (!opResults || opResults.length === 0) return null;

    const opResult = opResults[0];
    const opTr = opResult && typeof opResult.tr === 'function' ? opResult.tr() : null;
    if (!opTr) return null;

    const invokeResult = typeof opTr.invokeHostFunctionResult === 'function'
      ? opTr.invokeHostFunctionResult()
      : pickFirstValue(opTr, ['invokeHostFunctionResult', 'value']);

    const scError = tryExtractScError(invokeResult) || tryExtractScError(opTr);
    return extractContractErrorCodeFromScError(scError);
  } catch (error) {
    return null;
  }
}

function extractContractErrorCodeFromError(error) {
  if (!error) return null;
  if (typeof error === 'number') return error;

  if (typeof error === 'string') {
    return extractContractErrorCodeFromText(error) || extractContractErrorCodeFromXdr(error);
  }

  const direct = toNumber(error.contractErrorCode);
  if (direct != null) return direct;

  const candidates = [
    error.sorobanResultXdr,
    error.resultXdr,
    error.sorobanErrorResult,
    error.errorResult,
    error.simulationError,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    if (typeof candidate === 'string') {
      const code = extractContractErrorCodeFromText(candidate)
        || extractContractErrorCodeFromXdr(candidate);
      if (code != null) return code;
      continue;
    }

    if (candidate.resultXdr) {
      const code = extractContractErrorCodeFromXdr(candidate.resultXdr);
      if (code != null) return code;
    }

    try {
      const serialized = JSON.stringify(candidate);
      const code = extractContractErrorCodeFromText(serialized);
      if (code != null) return code;
    } catch (err) {
      continue;
    }
  }

  return extractContractErrorCodeFromText(error.message);
}

function mapContractError(error) {
  const code = extractContractErrorCodeFromError(error);
  if (code == null) return null;

  const info = getContractErrorInfo(code);
  if (info) return { code, ...info };

  return { code, name: 'UnknownContractError', message: `Contract error (${code}).` };
}

function resolveContractErrorMessage(error) {
  const mapped = mapContractError(error);
  if (mapped) return mapped.message;
  if (error && error.message) return error.message;
  return 'Unknown error';
}

module.exports = {
  CONTRACT_ERRORS,
  getContractErrorInfo,
  extractContractErrorCodeFromError,
  mapContractError,
  resolveContractErrorMessage,
};
