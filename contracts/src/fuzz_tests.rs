#![cfg(test)]

use proptest::prelude::*;
use soroban_sdk::{Address, Env, String as SorobanString, testutils::Address as TestAddress};
use crate::{VacciChainContract, ContractError};

// Strategy for generating valid Stellar addresses
fn arb_address() -> impl Strategy<Value = Address> {
    "G[A-Z2-7]{55}".prop_map(|s| {
        Address::from_contract_id(&[0u8; 32])
    })
}

// Strategy for generating vaccine names
fn arb_vaccine_name() -> impl Strategy<Value = SorobanString> {
    r"[a-zA-Z0-9\-\s]{1,100}".prop_map(|s| {
        SorobanString::from_slice(&Env::default(), s.as_bytes())
    })
}

// Strategy for generating dates
fn arb_date() -> impl Strategy<Value = SorobanString> {
    r"\d{4}-\d{2}-\d{2}".prop_map(|s| {
        SorobanString::from_slice(&Env::default(), s.as_bytes())
    })
}

// Fuzz test: mint_vaccination with various inputs
proptest! {
    #[test]
    fn fuzz_mint_vaccination_valid_inputs(
        vaccine_name in r"[a-zA-Z0-9\-\s]{1,100}",
        date in r"\d{4}-\d{2}-\d{2}"
    ) {
        let env = Env::default();
        let admin = TestAddress::random(&env);
        let issuer = TestAddress::random(&env);
        let patient = TestAddress::random(&env);

        // Initialize contract
        env.mock_all_auths();
        let _ = crate::VacciChainContract::initialize(env.clone(), admin.clone());

        // Add issuer
        let _ = crate::VacciChainContract::add_issuer(
            env.clone(),
            issuer.clone(),
            SorobanString::from_slice(&env, b"Test Issuer"),
            SorobanString::from_slice(&env, b"LIC123"),
            SorobanString::from_slice(&env, b"US"),
        );

        // Register patient
        let _ = crate::VacciChainContract::register_patient(env.clone(), patient.clone());

        // Attempt mint
        let vaccine_str = SorobanString::from_slice(&env, vaccine_name.as_bytes());
        let date_str = SorobanString::from_slice(&env, date.as_bytes());

        let result = crate::VacciChainContract::mint_vaccination(
            env.clone(),
            patient.clone(),
            vaccine_str,
            date_str,
            issuer.clone(),
        None,
        None,
        );

        // Should succeed or fail gracefully
        let _ = result;
    }
}

// Fuzz test: mint_vaccination with malformed inputs
proptest! {
    #[test]
    fn fuzz_mint_vaccination_malformed_inputs(
        vaccine_name in r"[\x00-\x7F]{0,200}",
        date in r"[\x00-\x7F]{0,200}"
    ) {
        let env = Env::default();
        let admin = TestAddress::random(&env);
        let issuer = TestAddress::random(&env);
        let patient = TestAddress::random(&env);

        env.mock_all_auths();
        let _ = crate::VacciChainContract::initialize(env.clone(), admin.clone());
        let _ = crate::VacciChainContract::add_issuer(
            env.clone(),
            issuer.clone(),
            SorobanString::from_slice(&env, b"Test Issuer"),
            SorobanString::from_slice(&env, b"LIC123"),
            SorobanString::from_slice(&env, b"US"),
        );
        let _ = crate::VacciChainContract::register_patient(env.clone(), patient.clone());

        let vaccine_str = SorobanString::from_slice(&env, vaccine_name.as_bytes());
        let date_str = SorobanString::from_slice(&env, date.as_bytes());

        let result = crate::VacciChainContract::mint_vaccination(
            env.clone(),
            patient.clone(),
            vaccine_str,
            date_str,
            issuer.clone(),
        None,
        None,
        );

        // Should not panic, may return error
        let _ = result;
    }
}

// Fuzz test: verify_vaccination with non-existent wallets
proptest! {
    #[test]
    fn fuzz_verify_vaccination_nonexistent_wallet(
        _seed in 0u32..1000
    ) {
        let env = Env::default();
        let wallet = TestAddress::random(&env);

        let (vaccinated, records, _) = crate::VacciChainContract::verify_vaccination(env.clone(), wallet);

        // Should return false and empty records for non-existent wallet
        prop_assert!(!vaccinated);
        prop_assert_eq!(records.len(), 0);
    }
}

// Fuzz test: duplicate mint detection
proptest! {
    #[test]
    fn fuzz_duplicate_mint_detection(
        vaccine_name in r"[a-zA-Z0-9\-\s]{1,50}",
        date in r"\d{4}-\d{2}-\d{2}"
    ) {
        let env = Env::default();
        let admin = TestAddress::random(&env);
        let issuer = TestAddress::random(&env);
        let patient = TestAddress::random(&env);

        env.mock_all_auths();
        let _ = crate::VacciChainContract::initialize(env.clone(), admin.clone());
        let _ = crate::VacciChainContract::add_issuer(
            env.clone(),
            issuer.clone(),
            SorobanString::from_slice(&env, b"Test Issuer"),
            SorobanString::from_slice(&env, b"LIC123"),
            SorobanString::from_slice(&env, b"US"),
        );
        let _ = crate::VacciChainContract::register_patient(env.clone(), patient.clone());

        let vaccine_str = SorobanString::from_slice(&env, vaccine_name.as_bytes());
        let date_str = SorobanString::from_slice(&env, date.as_bytes());

        // First mint should succeed
        let result1 = crate::VacciChainContract::mint_vaccination(
            env.clone(),
            patient.clone(),
            vaccine_str.clone(),
            date_str.clone(),
            issuer.clone(),
        None,
        None,
        );

        if result1.is_ok() {
            // Second mint with same inputs should fail with DuplicateRecord
            let result2 = crate::VacciChainContract::mint_vaccination(
                env.clone(),
                patient.clone(),
                vaccine_str,
                date_str,
                issuer.clone(),
        None,
        None,
            );

            prop_assert_eq!(result2, Err(ContractError::DuplicateRecord));
        }
    }
}
