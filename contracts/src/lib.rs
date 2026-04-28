#![no_std]

#[cfg(test)]
extern crate std;

mod storage;
mod events;
mod mint;
mod verify;

use soroban_sdk::{contract, contractimpl, contracterror, Address, BytesN, Env, String, Vec, IntoVal};
use storage::{DataKey, IssuerRecord, VaccinationRecord};

/// Contract errors.
///
/// | Code | Name                         | Description                                      |
/// |------|------------------------------|--------------------------------------------------|
/// | 1    | AlreadyInitialized           | Contract has already been initialized            |
/// | 2    | NotInitialized               | Contract has not been initialized                |
/// | 3    | Unauthorized                 | Caller is not an authorized issuer               |
/// | 4    | ProposalExpired              | Admin transfer proposal has expired              |
/// | 5    | NoPendingTransfer            | No pending admin transfer exists                 |
/// | 6    | DuplicateRecord              | Identical vaccination record already exists      |
/// | 7    | RecordNotFound               | Vaccination record does not exist                |
/// | 8    | AlreadyRevoked               | Vaccination record is already revoked            |
/// | 9    | InvalidInput                 | Input failed validation at the contract boundary |
/// | 10   | InvalidInputVaccineName      | vaccine_name exceeds maximum length              |
/// | 11   | InvalidInputDateAdministered | date_administered exceeds maximum length         |
/// | 12   | InvalidInputIssuerName       | issuer name exceeds maximum length               |
/// | 13   | InvalidInputLicense          | issuer license exceeds maximum length            |
/// | 14   | InvalidInputCountry          | issuer country exceeds maximum length            |
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum ContractError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    ProposalExpired = 4,
    NoPendingTransfer = 5,
    DuplicateRecord = 6,
    RecordNotFound = 7,
    AlreadyRevoked = 8,
    InvalidInput = 9,
    InvalidInputVaccineName = 10,
    InvalidInputDateAdministered = 11,
    InvalidInputIssuerName = 12,
    InvalidInputLicense = 13,
    InvalidInputCountry = 14,
    SoulboundToken = 15,
    PatientNotRegistered = 16,
}

const MAX_STRING_LENGTH: u32 = 100;

pub(crate) fn validate_input_length(field: &String, field_name: &str) -> Result<(), ContractError> {
    if field.len() > MAX_STRING_LENGTH {
        return Err(match field_name {
            "vaccine_name" => ContractError::InvalidInputVaccineName,
            "date_administered" => ContractError::InvalidInputDateAdministered,
            "name" => ContractError::InvalidInputIssuerName,
            "license" => ContractError::InvalidInputLicense,
            "country" => ContractError::InvalidInputCountry,
            _ => ContractError::InvalidInput,
        });
    }
    Ok(())
}

#[contract]
pub struct VacciChainContract;

#[contractimpl]
impl VacciChainContract {
    /// Initialize contract with an admin address.
    pub fn initialize(env: Env, admin: Address) -> Result<(), ContractError> {
        if env.storage().persistent().has(&DataKey::Initialized) {
            return Err(ContractError::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().persistent().set(&DataKey::Initialized, &true);
        env.storage().persistent().set(&DataKey::Admin, &admin);
        Ok(())
    }

    /// Admin: authorize a new issuer with metadata.
    pub fn add_issuer(
        env: Env,
        issuer: Address,
        name: String,
        license: String,
        country: String,
    ) -> Result<(), ContractError> {
        let admin: Address = env
            .storage()
            .persistent()
            .get(&DataKey::Admin)
            .ok_or(ContractError::NotInitialized)?;
        admin.require_auth();
        validate_input_length(&name, "name")?;
        validate_input_length(&license, "license")?;
        validate_input_length(&country, "country")?;

        let record = IssuerRecord {
            name,
            license,
            country,
            authorized: true,
        };

        env.storage().persistent().set(&DataKey::IssuerMeta(issuer_key.clone()), &record);

        let mut issuers: Vec<Address> = env
            .storage()
            .persistent()
            .get(&DataKey::IssuerList)
            .unwrap_or(Vec::new(&env));
        let mut exists = false;
        for i in 0..issuers.len() {
            if issuers.get(i).unwrap() == issuer {
                exists = true;
                break;
            }
        }
        if !exists {
            issuers.push_back(issuer.clone());
            env.storage().persistent().set(&DataKey::IssuerList, &issuers);
        }
        events::emit_issuer_added(&env, &issuer, &admin);
        Ok(())
    }

    /// Public: get issuer metadata.
    pub fn get_issuer(env: Env, address: Address) -> Option<IssuerRecord> {
        env.storage()
            .persistent()
            .get(&DataKey::IssuerMeta(hash_address(&env, &address)))
    }

    /// Admin: revoke an issuer.
    pub fn revoke_issuer(env: Env, issuer: Address) -> Result<(), ContractError> {
        let admin: Address = env
            .storage()
            .persistent()
            .get(&DataKey::Admin)
            .ok_or(ContractError::NotInitialized)?;
        admin.require_auth();

        if let Some(mut record) = env
            .storage()
            .persistent()
            .get::<DataKey, IssuerRecord>(&DataKey::IssuerMeta(hash_address(&env, &issuer)))
        {
            record.authorized = false;
            env.storage()
                .persistent()
                .set(&DataKey::IssuerMeta(hash_address(&env, &issuer)), &record);
        }
        Ok(())
    }

    /// Patient: self-register wallet into the allowlist (requires patient auth via SEP-10 JWT).
    /// Must be called before an issuer can mint to this address.
    pub fn register_patient(env: Env, patient: Address) -> Result<(), ContractError> {
        patient.require_auth();
        env.storage()
            .persistent()
            .set(&DataKey::PatientAllowlist(patient.clone()), &true);
        events::emit_patient_registered(&env, &patient);
        Ok(())
    }

    /// Public: check whether a wallet has self-registered.
    pub fn is_patient_registered(env: Env, patient: Address) -> bool {
        env.storage()
            .persistent()
            .get::<DataKey, bool>(&DataKey::PatientAllowlist(patient))
            .unwrap_or(false)
    }

    /// Issuer: mint a soulbound vaccination NFT.
    /// Returns the deterministic token_id (u64).
    pub fn mint_vaccination(
        env: Env,
        patient: Address,
        vaccine_name: String,
        date_administered: String,
        issuer: Address,
    ) -> Result<u64, ContractError> {
        mint::mint_vaccination(&env, patient, vaccine_name, date_administered, issuer)
    }

    /// Original issuer or admin: revoke a vaccination record.
    /// The record is marked revoked but never deleted (audit trail preserved).
    pub fn revoke_vaccination(env: Env, token_id: u64, revoker: Address) -> Result<(), ContractError> {
        revoker.require_auth();

        let mut record: VaccinationRecord = env
            .storage()
            .persistent()
            .get(&DataKey::Token(token_id))
            .ok_or(ContractError::RecordNotFound)?;

        if record.revoked {
            return Err(ContractError::AlreadyRevoked);
        }

        let admin: Address = env
            .storage()
            .persistent()
            .get(&DataKey::Admin)
            .ok_or(ContractError::NotInitialized)?;

        if revoker != record.issuer && revoker != admin {
            return Err(ContractError::Unauthorized);
        }

        record.revoked = true;
        env.storage().persistent().set(&DataKey::Token(token_id), &record);
        env.storage().persistent().set(&DataKey::Revoked(token_id), &true);
        events::emit_revoked(&env, token_id, &revoker);
        Ok(())
    }

    /// Transfer is permanently blocked — soulbound enforcement
    pub fn transfer(_env: Env, _from: Address, _to: Address, _token_id: u64) -> Result<(), ContractError> {
        Err(ContractError::SoulboundToken)
    }

    /// Public: verify vaccination status for a wallet.
    pub fn verify_vaccination(env: Env, wallet: Address) -> (bool, Vec<VaccinationRecord>) {
        verify::verify_vaccination(&env, wallet)
    }

    /// Public: batch verify vaccination status for multiple wallets (max 100).
    pub fn batch_verify(env: Env, wallets: Vec<Address>) -> Vec<(Address, bool, Vec<VaccinationRecord>)> {
        verify::batch_verify(&env, wallets)
    }

    /// Check if an address is an authorized issuer.
    pub fn is_issuer(env: Env, address: Address) -> bool {
        env.storage()
            .persistent()
            .get::<DataKey, IssuerRecord>(&DataKey::Issuer(address))
            .map(|r| r.authorized)
            .unwrap_or(false)
    }

    /// Public: list currently authorized issuers with pagination.
    pub fn get_all_issuers(env: Env, start: u32, limit: u32) -> Vec<Address> {
        if limit == 0 {
            return Vec::new(&env);
        }

        let issuers: Vec<Address> = env
            .storage()
            .persistent()
            .get(&DataKey::IssuerList)
            .unwrap_or(Vec::new(&env));

        let mut active: Vec<Address> = Vec::new(&env);
        for i in 0..issuers.len() {
            let issuer = issuers.get(i).unwrap();
            if Self::is_issuer(env.clone(), issuer.clone()) {
                active.push_back(issuer);
            }
        }

        let mut page: Vec<Address> = Vec::new(&env);
        let mut seen: u32 = 0;
        for i in 0..active.len() {
            if seen < start {
                seen += 1;
                continue;
            }
            if page.len() >= limit {
                break;
            }
            page.push_back(active.get(i).unwrap());
        }
        page
    }

    /// Admin: propose a new admin (two-step transfer). Proposal expires after 24 hours.
    pub fn propose_admin(env: Env, new_admin: Address) -> Result<(), ContractError> {
        let admin: Address = env
            .storage()
            .persistent()
            .get(&DataKey::Admin)
            .ok_or(ContractError::NotInitialized)?;
        admin.require_auth();
        let expires_at = env.ledger().timestamp() + 86400;
        env.storage().persistent().set(&DataKey::PendingAdmin, &new_admin);
        env.storage().persistent().set(&DataKey::AdminTransferExpiry, &expires_at);
        events::emit_admin_transfer_proposed(&env, &admin, &new_admin, expires_at);
        Ok(())
    }

    /// Proposed admin: accept the admin role.
    pub fn accept_admin(env: Env) -> Result<(), ContractError> {
        let pending: Address = env
            .storage()
            .persistent()
            .get(&DataKey::PendingAdmin)
            .ok_or(ContractError::NoPendingTransfer)?;
        let expires_at: u64 = env
            .storage()
            .persistent()
            .get(&DataKey::AdminTransferExpiry)
            .ok_or(ContractError::NoPendingTransfer)?;
        if env.ledger().timestamp() > expires_at {
            return Err(ContractError::ProposalExpired);
        }
        pending.require_auth();
        env.storage().persistent().set(&DataKey::Admin, &pending);
        env.storage().persistent().remove(&DataKey::PendingAdmin);
        env.storage().persistent().remove(&DataKey::AdminTransferExpiry);
        events::emit_admin_transfer_accepted(&env, &pending);
        Ok(())
    }

    /// Admin: upgrade the contract WASM.
    pub fn upgrade(env: Env, new_wasm_hash: BytesN<32>) -> Result<(), ContractError> {
        let admin: Address = env
            .storage()
            .persistent()
            .get(&DataKey::Admin)
            .ok_or(ContractError::NotInitialized)?;
        admin.require_auth();
        env.deployer().update_current_contract_wasm(new_wasm_hash.clone());
        events::emit_contract_upgraded(&env, &new_wasm_hash, &admin);
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{testutils::Address as _, testutils::Ledger as _, Env, String, Vec};

    fn setup_env() -> (Env, VacciChainContractClient<'static>, Address) {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(VacciChainContract, ());
        let client = VacciChainContractClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        client.initialize(&admin).unwrap();
        (env, client, admin)
    }

    #[test]
    fn test_initialize_already_initialized() {
        let (_env, client, admin) = setup_env();
        let result = client.try_initialize(&admin);
        assert_eq!(result, Err(Ok(ContractError::AlreadyInitialized)));
    }

    #[test]
    fn test_add_and_revoke_issuer() {
        let (env, client, _admin) = setup_env();
        let issuer = Address::generate(&env);
        
        client.add_issuer(
            &issuer,
            &String::from_str(&env, "General Hospital"),
            &String::from_str(&env, "LIC-12345"),
            &String::from_str(&env, "USA"),
        ).unwrap();

        assert!(client.is_issuer(&issuer));

        client.revoke_issuer(&issuer);
        assert!(!client.is_issuer(&issuer));
    }

    #[test]
    fn test_mint_successful() {
        let (env, client, _admin) = setup_env();
        let issuer = Address::generate(&env);
        let patient = Address::generate(&env);

        client.add_issuer(
            &issuer,
            &String::from_str(&env, "General Hospital"),
            &String::from_str(&env, "LIC-12345"),
            &String::from_str(&env, "USA"),
        );

        let vaccine = String::from_str(&env, "COVID-19");
        let date = String::from_str(&env, "2024-01-15");
        let seq = env.ledger().sequence();

        let token_id = client.mint_vaccination(&patient, &vaccine, &date, &issuer);

        // token_id must be a non-zero u64 (hash-derived)
        assert_ne!(token_id, 0);

        // token_id must match the deterministic scheme
        let expected = compute_token_id(&env, &patient, &vaccine, &date, &issuer, seq);
        assert_eq!(token_id, expected);

        let (vaccinated, records) = client.verify_vaccination(&patient);
        assert!(vaccinated);
        assert_eq!(records.len(), 1);
        let record = records.get(0).unwrap();
        assert_eq!(record.vaccine_name, String::from_str(&env, "COVID-19"));
        assert_eq!(record.patient, patient);
    }

    #[test]
    fn test_unauthorized_mint_blocked() {
        let (env, client, _admin) = setup_env();
        let fake_issuer = Address::generate(&env);
        let patient = Address::generate(&env);

        let result = client.try_mint_vaccination(
            &patient,
            &String::from_str(&env, "COVID-19"),
            &String::from_str(&env, "2024-01-15"),
            &fake_issuer,
        );
        assert_eq!(result, Err(Ok(ContractError::Unauthorized)));
    }

    #[test]
    fn test_duplicate_mint_blocked() {
        let (env, client, _admin) = setup_env();
        let issuer = Address::generate(&env);
        let patient = Address::generate(&env);

        client.add_issuer(
            &issuer,
            &String::from_str(&env, "General Hospital"),
            &String::from_str(&env, "LIC-12345"),
            &String::from_str(&env, "USA"),
        );

        client.mint_vaccination(
            &patient,
            &String::from_str(&env, "COVID-19"),
            &String::from_str(&env, "2024-01-15"),
            &issuer,
        );

        let result = client.try_mint_vaccination(
            &patient,
            &String::from_str(&env, "COVID-19"),
            &String::from_str(&env, "2024-01-15"),
            &issuer,
        );
        assert_eq!(result, Err(Ok(ContractError::DuplicateRecord)));
    }

    #[test]
    fn test_transfer_blocked() {
        let (env, client, _admin) = setup_env();
        let from = Address::generate(&env);
        let to = Address::generate(&env);

        let result = client.try_transfer(&from, &to, &1u64);
        assert_eq!(result, Err(Ok(ContractError::SoulboundToken)));
    }

    #[test]
    fn test_verify_empty_wallet() {
        let (env, client, _admin) = setup_env();
        let wallet = Address::generate(&env);

        let (vaccinated, records) = client.verify_vaccination(&wallet);
        assert!(!vaccinated);
        assert_eq!(records.len(), 0);
    }

    #[test]
    fn test_revoke_vaccination() {
        let (env, client, _admin) = setup_env();
        let issuer = Address::generate(&env);
        let patient = Address::generate(&env);

        client.add_issuer(
            &issuer,
            &String::from_str(&env, "General Hospital"),
            &String::from_str(&env, "LIC-12345"),
            &String::from_str(&env, "USA"),
        );

        let token_id = client.mint_vaccination(
            &patient,
            &String::from_str(&env, "COVID-19"),
            &String::from_str(&env, "2024-01-15"),
            &issuer,
        ).unwrap();

        client.revoke_vaccination(&token_id, &issuer).unwrap();

        let (vaccinated, records) = client.verify_vaccination(&patient);
        assert!(!vaccinated);
        assert_eq!(records.len(), 0);
    }

    #[test]
    fn test_admin_only_actions() {
        let (env, client, _admin) = setup_env();
        let non_admin = Address::generate(&env);
        let issuer = Address::generate(&env);

        // Try add_issuer as non-admin
        env.mock_auths(&[soroban_sdk::testutils::MockAuth {
            address: &non_admin,
            invoke: &soroban_sdk::testutils::MockAuthInvoke {
                contract: &client.address,
                fn_name: "add_issuer",
                args: (
                    issuer.clone(),
                    String::from_str(&env, "Hospital"),
                    String::from_str(&env, "LIC"),
                    String::from_str(&env, "USA")
                ).into_val(&env),
                sub_invokes: &[],
            },
        }]);

        let result = client.try_add_issuer(
            &issuer,
            &String::from_str(&env, "Hospital"),
            &String::from_str(&env, "LIC"),
            &String::from_str(&env, "USA"),
        );
        assert!(result.is_err()); // Should be unauthorized auth failure
    }

    #[test]
    fn test_batch_verify() {
        let (env, client, _admin) = setup_env();
        let issuer = Address::generate(&env);
        client.add_issuer(
            &issuer,
            &String::from_str(&env, "Hospital"),
            &String::from_str(&env, "LIC"),
            &String::from_str(&env, "USA"),
        ).unwrap();

        let mut wallets = Vec::new(&env);
        for _ in 0..5 {
            let patient = Address::generate(&env);
            client.mint_vaccination(
                &patient,
                &String::from_str(&env, "Vax"),
                &String::from_str(&env, "2024"),
                &issuer,
            ).unwrap();
            wallets.push_back(patient);
        }

        let results = client.batch_verify(&wallets);
        assert_eq!(results.len(), 5);
        for i in 0..5 {
            let (_, vaccinated, _) = results.get(i).unwrap();
            assert!(vaccinated);
        }
    }

    #[test]
    fn test_input_validation() {
        let (env, client, _admin) = setup_env();
        let issuer = Address::generate(&env);
        
        let long_name = String::from_str(&env, &"A".repeat(101));
        let result = client.try_add_issuer(
            &issuer,
            &long_name,
            &String::from_str(&env, "LIC"),
            &String::from_str(&env, "USA"),
        );
        assert_eq!(result, Err(Ok(ContractError::InvalidInputIssuerName)));
    }
}
