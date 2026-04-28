use soroban_sdk::{contracttype, Address, Bytes, String, BytesN, Env, xdr::ToXdr};

pub fn hash_address(env: &Env, address: &Address) -> BytesN<32> {
    env.crypto().sha256(&address.to_xdr(env)).into()
}

/// Compute a deterministic token_id as the first 8 bytes (big-endian u64) of:
///   SHA-256(patient_xdr || vaccine_name_bytes || date_bytes || issuer_xdr || ledger_sequence_be)
///
/// Inputs:
///   - patient:          XDR-encoded patient Address
///   - vaccine_name:     raw UTF-8 bytes of the vaccine name
///   - date_administered: raw UTF-8 bytes of the date string
///   - issuer:           XDR-encoded issuer Address
///   - ledger_sequence:  current ledger sequence number (u32, big-endian 4 bytes)
pub fn compute_token_id(
    env: &Env,
    patient: &Address,
    vaccine_name: &String,
    date_administered: &String,
    issuer: &Address,
    ledger_sequence: u32,
) -> u64 {
    let mut preimage = Bytes::new(env);

    // patient address (XDR-encoded)
    preimage.append(&patient.to_xdr(env));

    // vaccine_name (XDR-encoded soroban String)
    preimage.append(&vaccine_name.clone().to_xdr(env));

    // date_administered (XDR-encoded soroban String)
    preimage.append(&date_administered.clone().to_xdr(env));

    // issuer address (XDR-encoded)
    preimage.append(&issuer.to_xdr(env));

    // ledger_sequence as big-endian 4 bytes
    let seq_bytes = [
        ((ledger_sequence >> 24) & 0xff) as u8,
        ((ledger_sequence >> 16) & 0xff) as u8,
        ((ledger_sequence >> 8) & 0xff) as u8,
        (ledger_sequence & 0xff) as u8,
    ];
    let mut seq_buf = Bytes::new(env);
    for b in seq_bytes {
        seq_buf.push_back(b);
    }
    preimage.append(&seq_buf);

    let digest: BytesN<32> = env.crypto().sha256(&preimage).into();

    // Take first 8 bytes as big-endian u64
    let b0 = digest.get(0).unwrap() as u64;
    let b1 = digest.get(1).unwrap() as u64;
    let b2 = digest.get(2).unwrap() as u64;
    let b3 = digest.get(3).unwrap() as u64;
    let b4 = digest.get(4).unwrap() as u64;
    let b5 = digest.get(5).unwrap() as u64;
    let b6 = digest.get(6).unwrap() as u64;
    let b7 = digest.get(7).unwrap() as u64;

    (b0 << 56) | (b1 << 48) | (b2 << 40) | (b3 << 32)
        | (b4 << 24) | (b5 << 16) | (b6 << 8) | b7
}


#[contracttype]
#[derive(Clone)]
pub struct VaccinationRecord {
    pub token_id: u64,
    pub patient: Address,
    pub vaccine_name: String,
    pub date_administered: String,
    pub issuer: Address,
    pub timestamp: u64,
    pub schema_version: u32,
    pub revoked: bool,
}

#[contracttype]
#[derive(Clone)]
pub struct IssuerRecord {
    pub name: String,
    pub license: String,
    pub country: String,
    pub authorized: bool,
}

#[contracttype]
pub enum DataKey {
    Admin,
    Initialized,
    PendingAdmin,
    AdminTransferExpiry,
    Issuer(Address),
    PatientTokens(Address),
    Token(u64),
    Revoked(u64),
    PatientAllowlist(Address),
}
