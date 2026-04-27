use soroban_sdk::{contracttype, Address, String, BytesN, Env, xdr::ToXdr};

pub fn hash_address(env: &Env, address: &Address) -> BytesN<32> {
    env.crypto().sha256(&address.to_xdr(env)).into()
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
    NextTokenId,
    Revoked(u64),
}
