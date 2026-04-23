use soroban_sdk::{contracttype, Address, String};

#[contracttype]
#[derive(Clone)]
pub struct VaccinationRecord {
    pub token_id: u64,
    pub patient: Address,
    pub vaccine_name: String,
    pub date_administered: String,
    pub issuer: Address,
    pub timestamp: u64,
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
}
