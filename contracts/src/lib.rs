#![no_std]

#[cfg(test)]
extern crate std;

mod storage;
mod events;
mod mint;
mod verify;

#[cfg(test)]
mod fuzz_tests;

#[cfg(test)]
mod upgrade_tests;

#[cfg(test)]
mod property_tests;

use soroban_sdk::{contract, contractimpl, contracterror, Address, BytesN, Env, String, Vec, IntoVal};
use storage::{DataKey, IssuerRecord, VaccinationRecord, hash_address, compute_token_id};
use verify::DoseStatus;

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

/// Validates that a string field does not exceed the maximum allowed length.
///
/// # Arguments
/// * `field` - The string to validate
/// * `field_name` - The name of the field (used to determine the specific error type)
///
/// # Returns
/// * `Ok(())` if the field length is valid
/// * `Err(ContractError)` with a specific error variant based on the field name
///
/// # Errors
/// Returns field-specific errors:
/// - `InvalidInputVaccineName` if field_name is "vaccine_name"
/// - `InvalidInputDateAdministered` if field_name is "date_administered"
/// - `InvalidInputIssuerName` if field_name is "name"
/// - `InvalidInputLicense` if field_name is "license"
/// - `InvalidInputCountry` if field_name is "country"
/// - `InvalidInput` for unknown field names
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
    /// Initialize the contract with an admin address.
    ///
    /// This function must be called exactly once before any other contract operations.
    /// It sets up the contract state and designates the initial admin.
    ///
    /// # Arguments
    /// * `env` - The Soroban environment
    /// * `admin` - The address that will have admin privileges
    ///
    /// # Returns
    /// * `Ok(())` on successful initialization
    /// * `Err(ContractError::AlreadyInitialized)` if the contract has already been initialized
    ///
    /// # Errors
    /// * `AlreadyInitialized` - Contract is already initialized
    ///
    /// # Authorization
    /// Requires the `admin` address to authorize the transaction via `require_auth()`.
    pub fn initialize(env: Env, admin: Address) -> Result<(), ContractError> {
        if env.storage().persistent().has(&DataKey::Initialized) {
            return Err(ContractError::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().persistent().set(&DataKey::Initialized, &true);
        env.storage().persistent().set(&DataKey::Admin, &admin);
        Ok(())
    }

    /// Authorize a new healthcare provider (issuer) with metadata.
    ///
    /// Only the admin can call this function. Once authorized, an issuer can mint
    /// vaccination NFTs to patient wallets.
    ///
    /// # Arguments
    /// * `env` - The Soroban environment
    /// * `issuer` - The address of the healthcare provider to authorize
    /// * `name` - The name of the healthcare provider (max 100 characters)
    /// * `license` - The license number or identifier (max 100 characters)
    /// * `country` - The country where the provider operates (max 100 characters)
    ///
    /// # Returns
    /// * `Ok(())` on successful authorization
    ///
    /// # Errors
    /// * `NotInitialized` - Contract has not been initialized
    /// * `InvalidInputIssuerName` - `name` exceeds 100 characters
    /// * `InvalidInputLicense` - `license` exceeds 100 characters
    /// * `InvalidInputCountry` - `country` exceeds 100 characters
    ///
    /// # Authorization
    /// Requires the admin address to authorize the transaction.
    ///
    /// # Events
    /// Emits `IssuerAdded` event on success.
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

        env.storage().persistent().set(&DataKey::IssuerMeta(hash_address(&env, &issuer)), &record);

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

    /// Retrieve metadata for an authorized issuer.
    ///
    /// # Arguments
    /// * `env` - The Soroban environment
    /// * `address` - The issuer address to look up
    ///
    /// # Returns
    /// * `Some(IssuerRecord)` if the issuer is found
    /// * `None` if the issuer is not found or not authorized
    ///
    /// # Authorization
    /// This is a public read-only function; no authorization required.
    pub fn get_issuer(env: Env, address: Address) -> Option<IssuerRecord> {
        env.storage()
            .persistent()
            .get(&DataKey::IssuerMeta(hash_address(&env, &address)))
    }

    /// Revoke an issuer's authorization to mint vaccination records.
    ///
    /// Once revoked, the issuer can no longer mint new vaccination NFTs, but existing
    /// records remain valid and verifiable.
    ///
    /// # Arguments
    /// * `env` - The Soroban environment
    /// * `issuer` - The address of the issuer to revoke
    ///
    /// # Returns
    /// * `Ok(())` on successful revocation
    ///
    /// # Errors
    /// * `NotInitialized` - Contract has not been initialized
    ///
    /// # Authorization
    /// Requires the admin address to authorize the transaction.
    ///
    /// # Events
    /// Emits `IssuerRevoked` event on success.
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

    /// Register a patient wallet into the allowlist.
    ///
    /// Patients must self-register before an issuer can mint vaccination records to their wallet.
    /// This is a security measure to prevent unsolicited minting.
    ///
    /// # Arguments
    /// * `env` - The Soroban environment
    /// * `patient` - The wallet address to register
    ///
    /// # Returns
    /// * `Ok(())` on successful registration
    ///
    /// # Authorization
    /// Requires the patient address to authorize the transaction via SEP-10 JWT.
    ///
    /// # Events
    /// Emits `PatientRegistered` event on success.
    pub fn register_patient(env: Env, patient: Address) -> Result<(), ContractError> {
        patient.require_auth();
        env.storage()
            .persistent()
            .set(&DataKey::PatientAllowlist(patient.clone()), &true);
        events::emit_patient_registered(&env, &patient);
        Ok(())
    }

    /// Check whether a wallet has self-registered.
    ///
    /// # Arguments
    /// * `env` - The Soroban environment
    /// * `patient` - The wallet address to check
    ///
    /// # Returns
    /// * `true` if the patient is registered
    /// * `false` if the patient is not registered
    ///
    /// # Authorization
    /// This is a public read-only function; no authorization required.
    pub fn is_patient_registered(env: Env, patient: Address) -> bool {
        env.storage()
            .persistent()
            .get::<DataKey, bool>(&DataKey::PatientAllowlist(patient))
            .unwrap_or(false)
    }

    /// Mint a soulbound vaccination NFT to a patient wallet.
    ///
    /// Only authorized issuers can call this function. The resulting NFT is non-transferable
    /// (soulbound) and permanently bound to the patient's wallet. Duplicate records are rejected.
    ///
    /// # Arguments
    /// * `env` - The Soroban environment
    /// * `patient` - The wallet address receiving the vaccination record
    /// * `vaccine_name` - The name of the vaccine (max 100 characters)
    /// * `date_administered` - The date the vaccine was administered (max 100 characters)
    /// * `issuer` - The address of the authorized healthcare provider
    ///
    /// # Returns
    /// * `Ok(token_id)` - The deterministic token ID of the minted NFT
    ///
    /// # Errors
    /// * `Unauthorized` - Caller is not an authorized issuer
    /// * `PatientNotRegistered` - Patient has not self-registered
    /// * `DuplicateRecord` - An identical record already exists for this patient
    /// * `InvalidInputVaccineName` - `vaccine_name` exceeds 100 characters
    /// * `InvalidInputDateAdministered` - `date_administered` exceeds 100 characters
    ///
    /// # Authorization
    /// Requires the issuer address to authorize the transaction.
    ///
    /// # Events
    /// Emits `VaccinationMinted` event on success.
    pub fn mint_vaccination(
        env: Env,
        patient: Address,
        vaccine_name: String,
        date_administered: String,
        issuer: Address,
        dose_number: Option<u32>,
        dose_series: Option<u32>,
    ) -> Result<u64, ContractError> {
        mint::mint_vaccination(&env, patient, vaccine_name, date_administered, issuer, dose_number, dose_series)
    }

    /// Revoke a vaccination record.
    ///
    /// Only the original issuer or the admin can revoke a record. Revoked records are marked
    /// as such but never deleted (audit trail is preserved). Revoking an already-revoked
    /// record returns an error.
    ///
    /// # Arguments
    /// * `env` - The Soroban environment
    /// * `token_id` - The ID of the vaccination record to revoke
    /// * `revoker` - The address requesting the revocation (issuer or admin)
    ///
    /// # Returns
    /// * `Ok(())` on successful revocation
    ///
    /// # Errors
    /// * `RecordNotFound` - The token ID does not exist
    /// * `AlreadyRevoked` - The record is already revoked
    /// * `Unauthorized` - Caller is neither the original issuer nor the admin
    /// * `NotInitialized` - Contract has not been initialized
    ///
    /// # Authorization
    /// Requires the revoker address to authorize the transaction.
    ///
    /// # Events
    /// Emits `VaccinationRevoked` event on success.
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

    /// Transfer is permanently blocked — soulbound enforcement.
    ///
    /// This function always returns an error to enforce the soulbound property of vaccination NFTs.
    /// Vaccination records cannot be transferred between wallets under any circumstances.
    ///
    /// # Arguments
    /// * `_env` - The Soroban environment (unused)
    /// * `_from` - The source wallet (unused)
    /// * `_to` - The destination wallet (unused)
    /// * `_token_id` - The token ID (unused)
    ///
    /// # Returns
    /// * `Err(ContractError::SoulboundToken)` - Always
    ///
    /// # Errors
    /// * `SoulboundToken` - Transfers are not allowed
    pub fn transfer(_env: Env, _from: Address, _to: Address, _token_id: u64) -> Result<(), ContractError> {
        Err(ContractError::SoulboundToken)
    }

    /// Verify vaccination status for a wallet.
    ///
    /// Returns whether the wallet has any valid (non-revoked) vaccination records and a list
    /// of all such records.
    ///
    /// # Arguments
    /// * `env` - The Soroban environment
    /// * `wallet` - The wallet address to verify
    ///
    /// # Returns
    /// * `(bool, Vec<VaccinationRecord>)` - A tuple of:
    ///   - `bool`: `true` if the wallet has at least one valid record, `false` otherwise
    ///   - `Vec<VaccinationRecord>`: All valid vaccination records for the wallet
    ///
    /// # Authorization
    /// This is a public read-only function; no authorization required.
    pub fn verify_vaccination(env: Env, wallet: Address) -> (bool, Vec<VaccinationRecord>, Vec<DoseStatus>) {
        verify::verify_vaccination(&env, wallet)
    }

    /// Batch verify vaccination status for multiple wallets.
    ///
    /// Efficiently verifies vaccination status for up to 100 wallets in a single call.
    ///
    /// # Arguments
    /// * `env` - The Soroban environment
    /// * `wallets` - A vector of wallet addresses to verify (max 100)
    ///
    /// # Returns
    /// * `Vec<(Address, bool, Vec<VaccinationRecord>)>` - A vector of tuples, one per wallet:
    ///   - `Address`: The wallet address
    ///   - `bool`: `true` if the wallet has at least one valid record
    ///   - `Vec<VaccinationRecord>`: All valid records for the wallet
    ///
    /// # Authorization
    /// This is a public read-only function; no authorization required.
    pub fn batch_verify(env: Env, wallets: Vec<Address>) -> Vec<(Address, bool, Vec<VaccinationRecord>)> {
        verify::batch_verify(&env, wallets)
    }

    /// Check if an address is an authorized issuer.
    ///
    /// # Arguments
    /// * `env` - The Soroban environment
    /// * `address` - The address to check
    ///
    /// # Returns
    /// * `true` if the address is an authorized issuer
    /// * `false` otherwise
    ///
    /// # Authorization
    /// This is a public read-only function; no authorization required.
    pub fn is_issuer(env: Env, address: Address) -> bool {
        env.storage()
            .persistent()
            .get::<DataKey, IssuerRecord>(&DataKey::Issuer(address))
            .map(|r| r.authorized)
            .unwrap_or(false)
    }

    /// List currently authorized issuers with pagination.
    ///
    /// # Arguments
    /// * `env` - The Soroban environment
    /// * `start` - The starting index (0-based)
    /// * `limit` - The maximum number of issuers to return
    ///
    /// # Returns
    /// * `Vec<Address>` - A vector of authorized issuer addresses
    ///
    /// # Authorization
    /// This is a public read-only function; no authorization required.
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

    /// Propose a new admin (two-step transfer).
    ///
    /// Initiates a two-step admin transfer process. The proposed admin must call `accept_admin()`
    /// within 24 hours to complete the transfer. If not accepted within 24 hours, the proposal expires.
    ///
    /// # Arguments
    /// * `env` - The Soroban environment
    /// * `new_admin` - The address of the proposed new admin
    ///
    /// # Returns
    /// * `Ok(())` on successful proposal
    ///
    /// # Errors
    /// * `NotInitialized` - Contract has not been initialized
    ///
    /// # Authorization
    /// Requires the current admin address to authorize the transaction.
    ///
    /// # Events
    /// Emits `AdminTransferProposed` event on success.
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

    /// Accept the admin role (completes two-step transfer).
    ///
    /// Called by the proposed admin to accept the admin role. The proposal must not have expired
    /// (must be within 24 hours of proposal).
    ///
    /// # Returns
    /// * `Ok(())` on successful acceptance
    ///
    /// # Errors
    /// * `NoPendingTransfer` - No pending admin transfer exists
    /// * `ProposalExpired` - The proposal has expired (more than 24 hours old)
    ///
    /// # Authorization
    /// Requires the proposed admin address to authorize the transaction.
    ///
    /// # Events
    /// Emits `AdminTransferAccepted` event on success.
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

    /// Upgrade the contract WASM code.
    ///
    /// Only the admin can upgrade the contract. This replaces the contract code with new WASM.
    ///
    /// # Arguments
    /// * `env` - The Soroban environment
    /// * `new_wasm_hash` - The hash of the new WASM code (32 bytes)
    ///
    /// # Returns
    /// * `Ok(())` on successful upgrade
    ///
    /// # Errors
    /// * `NotInitialized` - Contract has not been initialized
    ///
    /// # Authorization
    /// Requires the admin address to authorize the transaction.
    ///
    /// # Events
    /// Emits `ContractUpgraded` event on success.
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

        let token_id = client.mint_vaccination(&patient, &vaccine, &date, &issuer, &None::<u32>, &None::<u32>);

        // token_id must be a non-zero u64 (hash-derived)
        assert_ne!(token_id, 0);

        // token_id must match the deterministic scheme
        let expected = compute_token_id(&env, &patient, &vaccine, &date, &issuer, seq);
        assert_eq!(token_id, expected);

        let (vaccinated, records, _dose_statuses) = client.verify_vaccination(&patient);
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
            &None::<u32>,
            &None::<u32>,
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
            &None::<u32>,
            &None::<u32>,
        );

        let result = client.try_mint_vaccination(
            &patient,
            &String::from_str(&env, "COVID-19"),
            &String::from_str(&env, "2024-01-15"),
            &issuer,
            &None::<u32>,
            &None::<u32>,
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

        let (vaccinated, records, _dose_statuses) = client.verify_vaccination(&wallet);
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
            &None::<u32>,
            &None::<u32>,
        );

        client.revoke_vaccination(&token_id, &issuer).unwrap();

        let (vaccinated, records, _dose_statuses) = client.verify_vaccination(&patient);
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
                &None::<u32>,
                &None::<u32>,
            );
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
