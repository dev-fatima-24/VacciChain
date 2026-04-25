#![no_std]

mod storage;
mod events;
mod mint;
mod verify;

use soroban_sdk::{contract, contractimpl, contracterror, Address, BytesN, Env, String, Vec};
use storage::{DataKey, IssuerRecord, VaccinationRecord};

/// Contract errors.
///
/// | Code | Name             | Description                                      |
/// |------|------------------|--------------------------------------------------|
/// | 1    | AlreadyInitialized | Contract has already been initialized           |
/// | 2    | NotInitialized   | Contract has not been initialized                |
/// | 3    | Unauthorized     | Caller is not an authorized issuer               |
/// | 4    | ProposalExpired  | Admin transfer proposal has expired              |
/// | 5    | NoPendingTransfer | No pending admin transfer exists                |
/// | 6    | DuplicateRecord  | Identical vaccination record already exists      |
/// | 7    | SoulboundToken   | Tokens are non-transferable (soulbound)          |
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
}

#[contract]
pub struct VacciChainContract;

#[contractimpl]
impl VacciChainContract {
    /// Initialize contract with an admin address
    pub fn initialize(env: Env, admin: Address) -> Result<(), ContractError> {
        if env.storage().persistent().has(&DataKey::Initialized) {
            return Err(ContractError::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().persistent().set(&DataKey::Initialized, &true);
        env.storage().persistent().set(&DataKey::Admin, &admin);
        Ok(())
    }

    /// Admin: authorize a new issuer with metadata
    pub fn add_issuer(env: Env, issuer: Address, name: String, license: String, country: String) {
        let admin: Address = env.storage().persistent().get(&DataKey::Admin).expect("not initialized");
        admin.require_auth();

        let record = IssuerRecord {
            name,
            license,
            country,
            authorized: true,
        };

        env.storage().persistent().set(&DataKey::Issuer(issuer.clone()), &record);
        events::emit_issuer_added(&env, &issuer, &admin);
    }

    /// Public: get issuer metadata
    pub fn get_issuer(env: Env, address: Address) -> Option<IssuerRecord> {
        env.storage().persistent().get(&DataKey::Issuer(address))
    }

    /// Admin: revoke an issuer
    pub fn revoke_issuer(env: Env, issuer: Address) {
        let admin: Address = env.storage().persistent().get(&DataKey::Admin).expect("not initialized");
        admin.require_auth();

        if let Some(mut record) = env.storage().persistent().get::<DataKey, IssuerRecord>(&DataKey::Issuer(issuer.clone())) {
            record.authorized = false;
            env.storage().persistent().set(&DataKey::Issuer(issuer.clone()), &record);
            events::emit_issuer_revoked(&env, &issuer, &admin);
        }
    }

    /// Issuer: mint a soulbound vaccination NFT
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
    /// The record is marked revoked: true but never deleted (audit trail preserved).
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

        // Only the original issuer or the current admin may revoke
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
        // Also set a dedicated revocation flag for fast lookup
        env.storage().persistent().set(&DataKey::Revoked(token_id), &true);

        events::emit_revoked(&env, token_id, &revoker);

        Ok(())
    }

    /// Transfer is permanently blocked — soulbound enforcement
    pub fn transfer(_env: Env, _from: Address, _to: Address, _token_id: u64) {
        panic!("soulbound: transfers are disabled");
    }

    /// Public: verify vaccination status for a wallet
    pub fn verify_vaccination(env: Env, wallet: Address) -> (bool, Vec<VaccinationRecord>) {
        verify::verify_vaccination(&env, wallet)
    }

    /// Public: batch verify vaccination status for multiple wallets (max 100)
    pub fn batch_verify(env: Env, wallets: Vec<Address>) -> Vec<(Address, bool, Vec<VaccinationRecord>)> {
        verify::batch_verify(&env, wallets)
    }

    /// Check if an address is an authorized issuer
    pub fn is_issuer(env: Env, address: Address) -> bool {
        env.storage()
            .persistent()
            .get::<DataKey, IssuerRecord>(&DataKey::Issuer(address))
            .map(|r| r.authorized)
            .unwrap_or(false)
    }

    /// Admin: propose a new admin (two-step transfer). Proposal expires after 24 hours.
    pub fn propose_admin(env: Env, new_admin: Address) -> Result<(), ContractError> {
        let admin: Address = env.storage().persistent().get(&DataKey::Admin)
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
        let pending: Address = env.storage().persistent().get(&DataKey::PendingAdmin)
            .ok_or(ContractError::NoPendingTransfer)?;
        let expires_at: u64 = env.storage().persistent().get(&DataKey::AdminTransferExpiry)
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
        let admin: Address = env.storage().persistent().get(&DataKey::Admin)
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
    use soroban_sdk::{testutils::Address as _, testutils::Ledger as _, Env, String};
    use soroban_sdk::{testutils::{Address as _, Ledger}, BytesN, Env, String};

    #[test]
    fn test_mint_and_verify() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(VacciChainContract, ());
        let client = VacciChainContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let issuer = Address::generate(&env);
        let patient = Address::generate(&env);

        client.initialize(&admin);
        client.add_issuer(&issuer);
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

        assert_eq!(token_id, 1);

        let (vaccinated, records) = client.verify_vaccination(&patient);
        assert!(vaccinated);
        assert_eq!(records.len(), 1);
    }

    /// transfer() must always return SoulboundToken regardless of caller or token ID.
    #[test]
    fn test_transfer_always_fails_with_soulbound_error() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(VacciChainContract, ());
        let client = VacciChainContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        client.initialize(&admin);

        let from = Address::generate(&env);
        let to = Address::generate(&env);

        // Any caller, any token ID — always SoulboundToken
        let result = client.try_transfer(&from, &to, &1u64);
        assert_eq!(result, Err(Ok(ContractError::SoulboundToken)));

        // Also verify with a different caller
        let result2 = client.try_transfer(&admin, &to, &99u64);
        assert_eq!(result2, Err(Ok(ContractError::SoulboundToken)));
    }

    #[test]
    fn test_unauthorized_issuer_blocked() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(VacciChainContract, ());
        let client = VacciChainContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let fake_issuer = Address::generate(&env);
        let patient = Address::generate(&env);

        client.initialize(&admin);
        client.mint_vaccination(
        client.initialize(&admin).unwrap();

        let result = client.try_mint_vaccination(
            &patient,
            &String::from_str(&env, "COVID-19"),
            &String::from_str(&env, "2024-01-15"),
            &fake_issuer,
        );
        assert_eq!(result, Err(Ok(ContractError::Unauthorized)));
    }

    #[test]
    fn test_duplicate_record_blocked() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(VacciChainContract, ());
        let client = VacciChainContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let issuer = Address::generate(&env);
        let patient = Address::generate(&env);

        client.initialize(&admin);
        client.add_issuer(&issuer);
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
        ).unwrap();

        let result = client.try_mint_vaccination(
            &patient,
            &String::from_str(&env, "COVID-19"),
            &String::from_str(&env, "2024-01-15"),
            &issuer,
        );
        assert_eq!(result, Err(Ok(ContractError::DuplicateRecord)));
    }

    #[test]
    fn test_batch_verify_empty() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(VacciChainContract, ());
        let client = VacciChainContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        client.initialize(&admin);

        let results = client.batch_verify(&Vec::new(&env));
        assert_eq!(results.len(), 0);
    }

    #[test]
    fn test_batch_verify_partial() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(VacciChainContract, ());
        let client = VacciChainContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let issuer = Address::generate(&env);
        let vaccinated_patient = Address::generate(&env);
        let unvaccinated_patient = Address::generate(&env);

        client.initialize(&admin);
        client.add_issuer(
            &issuer,
            &String::from_str(&env, "General Hospital"),
            &String::from_str(&env, "LIC-12345"),
            &String::from_str(&env, "USA"),
        );
        client.mint_vaccination(
            &vaccinated_patient,
            &String::from_str(&env, "COVID-19"),
            &String::from_str(&env, "2024-01-15"),
            &issuer,
        );

        let mut wallets: Vec<Address> = Vec::new(&env);
        wallets.push_back(vaccinated_patient.clone());
        wallets.push_back(unvaccinated_patient.clone());

        let results = client.batch_verify(&wallets);
        assert_eq!(results.len(), 2);

        let (addr0, v0, r0) = results.get(0).unwrap();
        assert_eq!(addr0, vaccinated_patient);
        assert!(v0);
        assert_eq!(r0.len(), 1);

        let (addr1, v1, r1) = results.get(1).unwrap();
        assert_eq!(addr1, unvaccinated_patient);
        assert!(!v1);
        assert_eq!(r1.len(), 0);
    }

    #[test]
    fn test_batch_verify_full() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(VacciChainContract, ());
        let client = VacciChainContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let issuer = Address::generate(&env);
        client.initialize(&admin);
        client.add_issuer(
            &issuer,
            &String::from_str(&env, "General Hospital"),
            &String::from_str(&env, "LIC-12345"),
            &String::from_str(&env, "USA"),
        );

        let mut wallets: Vec<Address> = Vec::new(&env);
        for _ in 0..100u32 {
            let patient = Address::generate(&env);
            client.mint_vaccination(
                &patient,
                &String::from_str(&env, "COVID-19"),
                &String::from_str(&env, "2024-01-15"),
                &issuer,
            );
            wallets.push_back(patient);
        }

        let results = client.batch_verify(&wallets);
        assert_eq!(results.len(), 100);
        for i in 0..100u32 {
            let (_, vaccinated, records) = results.get(i).unwrap();
            assert!(vaccinated);
            assert_eq!(records.len(), 1);
        }
    }

    #[test]
    #[should_panic(expected = "batch size exceeds maximum of 100")]
    fn test_batch_verify_exceeds_limit() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(VacciChainContract, ());
        let client = VacciChainContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        client.initialize(&admin);

        let mut wallets: Vec<Address> = Vec::new(&env);
        for _ in 0..101u32 {
            wallets.push_back(Address::generate(&env));
        }
        client.batch_verify(&wallets);
    }

    #[test]
    fn test_single_verify_unchanged() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(VacciChainContract, ());
        let client = VacciChainContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let issuer = Address::generate(&env);
        let patient = Address::generate(&env);

        client.initialize(&admin);
        client.add_issuer(
            &issuer,
            &String::from_str(&env, "General Hospital"),
            &String::from_str(&env, "LIC-12345"),
            &String::from_str(&env, "USA"),
        );
        client.mint_vaccination(
            &patient,
            &String::from_str(&env, "Flu"),
            &String::from_str(&env, "2024-03-01"),
            &issuer,
        );

        let (vaccinated, records) = client.verify_vaccination(&patient);
        assert!(vaccinated);
        assert_eq!(records.len(), 1);
    }

    #[test]
    fn test_double_init_rejected() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(VacciChainContract, ());
        let client = VacciChainContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        client.initialize(&admin);

        let result = client.try_initialize(&admin);
        assert_eq!(result, Err(Ok(ContractError::AlreadyInitialized)));
    }

    #[test]
    fn test_propose_and_accept_admin() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(VacciChainContract, ());
        let client = VacciChainContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let new_admin = Address::generate(&env);

        client.initialize(&admin);
        client.propose_admin(&new_admin);
        client.accept_admin();

        let issuer = Address::generate(&env);
        client.add_issuer(
            &issuer,
            &String::from_str(&env, "General Hospital"),
            &String::from_str(&env, "LIC-12345"),
            &String::from_str(&env, "USA"),
        );
    }

    #[test]
    fn test_revoke_vaccination() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(VacciChainContract, ());
        let client = VacciChainContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let issuer = Address::generate(&env);
        let patient = Address::generate(&env);

        client.initialize(&admin).unwrap();
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

        // Before revocation: patient is vaccinated
        let (vaccinated, records) = client.verify_vaccination(&patient);
        assert!(vaccinated);
        assert_eq!(records.len(), 1);

        // Revoke by original issuer
        client.revoke_vaccination(&token_id, &issuer).unwrap();

        // After revocation: excluded from active status
        let (vaccinated_after, records_after) = client.verify_vaccination(&patient);
        assert!(!vaccinated_after);
        assert_eq!(records_after.len(), 0);
    }

    #[test]
    fn test_revoke_already_revoked() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(VacciChainContract, ());
        let client = VacciChainContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let issuer = Address::generate(&env);
        let patient = Address::generate(&env);

        client.initialize(&admin).unwrap();
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

        let result = client.try_revoke_vaccination(&token_id, &issuer);
        assert_eq!(result, Err(Ok(ContractError::AlreadyRevoked)));
    }

    #[test]
    fn test_revoke_unauthorized() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(VacciChainContract, ());
        let client = VacciChainContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let issuer = Address::generate(&env);
        let patient = Address::generate(&env);
        let stranger = Address::generate(&env);

        client.initialize(&admin).unwrap();
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

        let result = client.try_revoke_vaccination(&token_id, &stranger);
        assert_eq!(result, Err(Ok(ContractError::Unauthorized)));
    }

    #[test]
    fn test_accept_admin_expired() {        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(VacciChainContract, ());
        let client = VacciChainContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let new_admin = Address::generate(&env);

        client.initialize(&admin);
        client.propose_admin(&new_admin);

        env.ledger().with_mut(|l| l.timestamp += 86401);

        let result = client.try_accept_admin();
        assert_eq!(result, Err(Ok(ContractError::ProposalExpired)));
    }

    #[test]
    fn test_upgrade_admin_only() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(VacciChainContract, ());
        let client = VacciChainContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        client.initialize(&admin).unwrap();

        let wasm_hash = BytesN::from_array(&env, &[0u8; 32]);
        client.upgrade(&wasm_hash).unwrap();
    }

    #[test]
    fn test_upgrade_non_admin_rejected() {
        let env = Env::default();

        let contract_id = env.register(VacciChainContract, ());
        let client = VacciChainContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let non_admin = Address::generate(&env);

        env.mock_auths(&[soroban_sdk::testutils::MockAuth {
            address: &admin,
            invoke: &soroban_sdk::testutils::MockAuthInvoke {
                contract: &contract_id,
                fn_name: "initialize",
                args: (admin.clone(),).into_val(&env),
                sub_invokes: &[],
            },
        }]);
        client.initialize(&admin).unwrap();

        let wasm_hash = BytesN::from_array(&env, &[0u8; 32]);
        let result = client.try_upgrade(&wasm_hash);
        assert!(result.is_err());
    }
}
