#![no_std]

mod storage;
mod events;
mod mint;
mod verify;

use soroban_sdk::{contract, contractimpl, contracterror, Address, BytesN, Env, String, Vec};
use storage::{DataKey, VaccinationRecord};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum ContractError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    ProposalExpired = 4,
    NoPendingTransfer = 5,
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

    /// Admin: authorize a new issuer
    pub fn add_issuer(env: Env, issuer: Address) {
        let admin: Address = env.storage().persistent().get(&DataKey::Admin).expect("not initialized");
        admin.require_auth();
        env.storage().persistent().set(&DataKey::Issuer(issuer.clone()), &true);
        events::emit_issuer_added(&env, &issuer, &admin);
    }

    /// Admin: revoke an issuer
    pub fn revoke_issuer(env: Env, issuer: Address) {
        let admin: Address = env.storage().persistent().get(&DataKey::Admin).expect("not initialized");
        admin.require_auth();
        env.storage().persistent().set(&DataKey::Issuer(issuer.clone()), &false);
        events::emit_issuer_revoked(&env, &issuer, &admin);
    }

    /// Issuer: mint a soulbound vaccination NFT
    pub fn mint_vaccination(
        env: Env,
        patient: Address,
        vaccine_name: String,
        date_administered: String,
        issuer: Address,
    ) -> u64 {
        mint::mint_vaccination(&env, patient, vaccine_name, date_administered, issuer)
    }

    /// Transfer is permanently blocked — soulbound enforcement
    pub fn transfer(_env: Env, _from: Address, _to: Address, _token_id: u64) {
        panic!("soulbound: transfers are disabled");
    }

    /// Public: verify vaccination status for a wallet
    pub fn verify_vaccination(env: Env, wallet: Address) -> (bool, Vec<VaccinationRecord>) {
        verify::verify_vaccination(&env, wallet)
    }

    /// Check if an address is an authorized issuer
    pub fn is_issuer(env: Env, address: Address) -> bool {
        env.storage()
            .persistent()
            .get(&DataKey::Issuer(address))
            .unwrap_or(false)
    }

    /// Admin: propose a new admin (two-step transfer). Proposal expires after 24 hours.
    pub fn propose_admin(env: Env, new_admin: Address) -> Result<(), ContractError> {
        let admin: Address = env.storage().persistent().get(&DataKey::Admin)
            .ok_or(ContractError::NotInitialized)?;
        admin.require_auth();
        // 24 hours = 86400 seconds
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
    use soroban_sdk::{testutils::Address as _, BytesN, Env, String};

    #[test]
    fn test_mint_and_verify() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(VacciChainContract, ());
        let client = VacciChainContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let issuer = Address::generate(&env);
        let patient = Address::generate(&env);

        client.initialize(&admin).unwrap();
        client.add_issuer(&issuer);

        let token_id = client.mint_vaccination(
            &patient,
            &String::from_str(&env, "COVID-19"),
            &String::from_str(&env, "2024-01-15"),
            &issuer,
        );

        assert_eq!(token_id, 1);

        let (vaccinated, records) = client.verify_vaccination(&patient);
        assert!(vaccinated);
        assert_eq!(records.len(), 1);
    }

    #[test]
    #[should_panic(expected = "soulbound")]
    fn test_transfer_blocked() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(VacciChainContract, ());
        let client = VacciChainContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        client.initialize(&admin).unwrap();

        let from = Address::generate(&env);
        let to = Address::generate(&env);
        client.transfer(&from, &to, &1u64);
    }

    #[test]
    #[should_panic(expected = "unauthorized issuer")]
    fn test_unauthorized_issuer_blocked() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(VacciChainContract, ());
        let client = VacciChainContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let fake_issuer = Address::generate(&env);
        let patient = Address::generate(&env);

        client.initialize(&admin).unwrap();
        client.mint_vaccination(
            &patient,
            &String::from_str(&env, "COVID-19"),
            &String::from_str(&env, "2024-01-15"),
            &fake_issuer,
        );
    }

    #[test]
    #[should_panic(expected = "duplicate vaccination record")]
    fn test_duplicate_record_blocked() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(VacciChainContract, ());
        let client = VacciChainContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let issuer = Address::generate(&env);
        let patient = Address::generate(&env);

        client.initialize(&admin).unwrap();
        client.add_issuer(&issuer);

        client.mint_vaccination(
            &patient,
            &String::from_str(&env, "COVID-19"),
            &String::from_str(&env, "2024-01-15"),
            &issuer,
        );
        client.mint_vaccination(
            &patient,
            &String::from_str(&env, "COVID-19"),
            &String::from_str(&env, "2024-02-01"),
            &issuer,
        );
    }

    #[test]
    fn test_double_init_rejected() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(VacciChainContract, ());
        let client = VacciChainContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        client.initialize(&admin).unwrap();

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

        client.initialize(&admin).unwrap();
        client.propose_admin(&new_admin).unwrap();
        client.accept_admin().unwrap();

        // new_admin should now be admin — verify by calling add_issuer (only admin can)
        let issuer = Address::generate(&env);
        client.add_issuer(&issuer);
    }

    #[test]
    fn test_accept_admin_expired() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(VacciChainContract, ());
        let client = VacciChainContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let new_admin = Address::generate(&env);

        client.initialize(&admin).unwrap();
        client.propose_admin(&new_admin).unwrap();

        // Advance ledger time past 24 hours
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

        // A valid 32-byte hash (all zeros stands in for a real WASM hash in unit tests)
        let wasm_hash = BytesN::from_array(&env, &[0u8; 32]);
        // upgrade() should succeed (auth is mocked; deployer call is a no-op in test env)
        client.upgrade(&wasm_hash).unwrap();
    }

    #[test]
    fn test_upgrade_non_admin_rejected() {
        let env = Env::default();

        let contract_id = env.register(VacciChainContract, ());
        let client = VacciChainContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let non_admin = Address::generate(&env);

        // Only mock auth for admin during initialize, not for non_admin
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
        // Calling upgrade as non_admin (no auth mocked) should panic with auth error
        let result = client.try_upgrade(&wasm_hash);
        assert!(result.is_err());
    }
}
