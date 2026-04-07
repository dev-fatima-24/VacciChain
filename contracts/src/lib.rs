#![no_std]

mod storage;
mod events;
mod mint;
mod verify;

use soroban_sdk::{contract, contractimpl, Address, Env, String, Vec};
use storage::{DataKey, VaccinationRecord};

#[contract]
pub struct VacciChainContract;

#[contractimpl]
impl VacciChainContract {
    /// Initialize contract with an admin address
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().persistent().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        admin.require_auth();
        env.storage().persistent().set(&DataKey::Admin, &admin);
    }

    /// Admin: authorize a new issuer
    pub fn add_issuer(env: Env, issuer: Address) {
        let admin: Address = env.storage().persistent().get(&DataKey::Admin).expect("not initialized");
        admin.require_auth();
        env.storage().persistent().set(&DataKey::Issuer(issuer.clone()), &true);
        events::emit_issuer_added(&env, &issuer);
    }

    /// Admin: revoke an issuer
    pub fn revoke_issuer(env: Env, issuer: Address) {
        let admin: Address = env.storage().persistent().get(&DataKey::Admin).expect("not initialized");
        admin.require_auth();
        env.storage().persistent().set(&DataKey::Issuer(issuer.clone()), &false);
        events::emit_issuer_revoked(&env, &issuer);
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
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env, String};

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
        client.initialize(&admin);

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

        client.initialize(&admin);
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

        client.initialize(&admin);
        client.add_issuer(&issuer);

        client.mint_vaccination(
            &patient,
            &String::from_str(&env, "COVID-19"),
            &String::from_str(&env, "2024-01-15"),
            &issuer,
        );
        // Second mint with same vaccine + issuer should panic
        client.mint_vaccination(
            &patient,
            &String::from_str(&env, "COVID-19"),
            &String::from_str(&env, "2024-02-01"),
            &issuer,
        );
    }
}
