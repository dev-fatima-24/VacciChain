#![cfg(test)]

use proptest::prelude::*;
use soroban_sdk::{Address, Env, String as SorobanString, testutils::Address as TestAddress, Vec};
use crate::{VacciChainContract, ContractError, storage::VaccinationRecord};

// Property: mint then verify always returns the minted record
proptest! {
    #[test]
    fn prop_mint_then_verify_returns_record(
        vaccine_name in r"[a-zA-Z0-9\-\s]{1,50}",
        date in r"\d{4}-\d{2}-\d{2}"
    ) {
        let env = Env::default();
        let admin = TestAddress::random(&env);
        let issuer = TestAddress::random(&env);
        let patient = TestAddress::random(&env);

        env.mock_all_auths();

        // Setup
        let _ = VacciChainContract::initialize(env.clone(), admin.clone());
        let _ = VacciChainContract::add_issuer(
            env.clone(),
            issuer.clone(),
            SorobanString::from_slice(&env, b"Test Issuer"),
            SorobanString::from_slice(&env, b"LIC123"),
            SorobanString::from_slice(&env, b"US"),
        );
        let _ = VacciChainContract::register_patient(env.clone(), patient.clone());

        let vaccine_str = SorobanString::from_slice(&env, vaccine_name.as_bytes());
        let date_str = SorobanString::from_slice(&env, date.as_bytes());

        // Mint
        let mint_result = VacciChainContract::mint_vaccination(
            env.clone(),
            patient.clone(),
            vaccine_str.clone(),
            date_str.clone(),
            issuer.clone(),
        None,
        None,
        );

        if let Ok(token_id) = mint_result {
            // Verify
            let (vaccinated, records, _) = VacciChainContract::verify_vaccination(env.clone(), patient.clone());

            // Property: if mint succeeded, verify should return the record
            prop_assert!(vaccinated, "patient should be vaccinated after mint");
            prop_assert!(records.len() > 0, "should have at least one record");

            // Find the minted record
            let mut found = false;
            for i in 0..records.len() {
                let record = records.get(i).unwrap();
                if record.token_id == token_id && record.vaccine_name == vaccine_str {
                    found = true;
                    prop_assert_eq!(record.date_administered, date_str, "date should match");
                    prop_assert_eq!(record.issuer, issuer, "issuer should match");
                    prop_assert_eq!(record.patient, patient, "patient should match");
                    prop_assert!(!record.revoked, "record should not be revoked");
                    break;
                }
            }
            prop_assert!(found, "minted record should be found in verify results");
        }
    }
}

// Property: transfer always fails (soulbound)
proptest! {
    #[test]
    fn prop_transfer_always_fails(
        _seed in 0u32..100
    ) {
        let env = Env::default();
        let admin = TestAddress::random(&env);
        let issuer = TestAddress::random(&env);
        let patient = TestAddress::random(&env);
        let recipient = TestAddress::random(&env);

        env.mock_all_auths();

        // Setup
        let _ = VacciChainContract::initialize(env.clone(), admin.clone());
        let _ = VacciChainContract::add_issuer(
            env.clone(),
            issuer.clone(),
            SorobanString::from_slice(&env, b"Test Issuer"),
            SorobanString::from_slice(&env, b"LIC123"),
            SorobanString::from_slice(&env, b"US"),
        );
        let _ = VacciChainContract::register_patient(env.clone(), patient.clone());
        let _ = VacciChainContract::register_patient(env.clone(), recipient.clone());

        // Mint a record
        let vaccine_str = SorobanString::from_slice(&env, b"COVID-19");
        let date_str = SorobanString::from_slice(&env, b"2024-01-15");

        let mint_result = VacciChainContract::mint_vaccination(
            env.clone(),
            patient.clone(),
            vaccine_str,
            date_str,
            issuer.clone(),
        None,
        None,
        );

        if let Ok(token_id) = mint_result {
            // Property: transfer should always fail (soulbound)
            let transfer_result = VacciChainContract::transfer(
                env.clone(),
                patient.clone(),
                recipient.clone(),
                token_id,
            );

            prop_assert_eq!(
                transfer_result,
                Err(ContractError::SoulboundToken),
                "transfer should always fail with SoulboundToken error"
            );
        }
    }
}

// Property: duplicate mint always fails
proptest! {
    #[test]
    fn prop_duplicate_mint_always_fails(
        vaccine_name in r"[a-zA-Z0-9\-\s]{1,50}",
        date in r"\d{4}-\d{2}-\d{2}"
    ) {
        let env = Env::default();
        let admin = TestAddress::random(&env);
        let issuer = TestAddress::random(&env);
        let patient = TestAddress::random(&env);

        env.mock_all_auths();

        // Setup
        let _ = VacciChainContract::initialize(env.clone(), admin.clone());
        let _ = VacciChainContract::add_issuer(
            env.clone(),
            issuer.clone(),
            SorobanString::from_slice(&env, b"Test Issuer"),
            SorobanString::from_slice(&env, b"LIC123"),
            SorobanString::from_slice(&env, b"US"),
        );
        let _ = VacciChainContract::register_patient(env.clone(), patient.clone());

        let vaccine_str = SorobanString::from_slice(&env, vaccine_name.as_bytes());
        let date_str = SorobanString::from_slice(&env, date.as_bytes());

        // First mint
        let first_mint = VacciChainContract::mint_vaccination(
            env.clone(),
            patient.clone(),
            vaccine_str.clone(),
            date_str.clone(),
            issuer.clone(),
        None,
        None,
        );

        if first_mint.is_ok() {
            // Second mint with same inputs
            let second_mint = VacciChainContract::mint_vaccination(
                env.clone(),
                patient.clone(),
                vaccine_str,
                date_str,
                issuer.clone(),
        None,
        None,
            );

            // Property: duplicate mint should always fail
            prop_assert_eq!(
                second_mint,
                Err(ContractError::DuplicateRecord),
                "duplicate mint should fail with DuplicateRecord error"
            );
        }
    }
}

// Property: verify returns consistent results
proptest! {
    #[test]
    fn prop_verify_consistency(
        vaccine_name in r"[a-zA-Z0-9\-\s]{1,50}",
        date in r"\d{4}-\d{2}-\d{2}"
    ) {
        let env = Env::default();
        let admin = TestAddress::random(&env);
        let issuer = TestAddress::random(&env);
        let patient = TestAddress::random(&env);

        env.mock_all_auths();

        // Setup
        let _ = VacciChainContract::initialize(env.clone(), admin.clone());
        let _ = VacciChainContract::add_issuer(
            env.clone(),
            issuer.clone(),
            SorobanString::from_slice(&env, b"Test Issuer"),
            SorobanString::from_slice(&env, b"LIC123"),
            SorobanString::from_slice(&env, b"US"),
        );
        let _ = VacciChainContract::register_patient(env.clone(), patient.clone());

        let vaccine_str = SorobanString::from_slice(&env, vaccine_name.as_bytes());
        let date_str = SorobanString::from_slice(&env, date.as_bytes());

        // Mint
        let _ = VacciChainContract::mint_vaccination(
            env.clone(),
            patient.clone(),
            vaccine_str,
            date_str,
            issuer.clone(),
        None,
        None,
        );

        // Verify multiple times
        let (vaccinated1, records1, _) = VacciChainContract::verify_vaccination(env.clone(), patient.clone());
        let (vaccinated2, records2, _) = VacciChainContract::verify_vaccination(env.clone(), patient.clone());

        // Property: verify should return consistent results
        prop_assert_eq!(vaccinated1, vaccinated2, "vaccination status should be consistent");
        prop_assert_eq!(records1.len(), records2.len(), "record count should be consistent");
    }
}

// Property: revoked records are not returned by verify
proptest! {
    #[test]
    fn prop_revoked_records_not_returned(
        vaccine_name in r"[a-zA-Z0-9\-\s]{1,50}",
        date in r"\d{4}-\d{2}-\d{2}"
    ) {
        let env = Env::default();
        let admin = TestAddress::random(&env);
        let issuer = TestAddress::random(&env);
        let patient = TestAddress::random(&env);

        env.mock_all_auths();

        // Setup
        let _ = VacciChainContract::initialize(env.clone(), admin.clone());
        let _ = VacciChainContract::add_issuer(
            env.clone(),
            issuer.clone(),
            SorobanString::from_slice(&env, b"Test Issuer"),
            SorobanString::from_slice(&env, b"LIC123"),
            SorobanString::from_slice(&env, b"US"),
        );
        let _ = VacciChainContract::register_patient(env.clone(), patient.clone());

        let vaccine_str = SorobanString::from_slice(&env, vaccine_name.as_bytes());
        let date_str = SorobanString::from_slice(&env, date.as_bytes());

        // Mint
        let mint_result = VacciChainContract::mint_vaccination(
            env.clone(),
            patient.clone(),
            vaccine_str,
            date_str,
            issuer.clone(),
        None,
        None,
        );

        if let Ok(token_id) = mint_result {
            // Verify before revocation
            let (vaccinated_before, records_before, _) = VacciChainContract::verify_vaccination(env.clone(), patient.clone());
            prop_assert!(vaccinated_before, "should be vaccinated before revocation");
            prop_assert!(records_before.len() > 0, "should have records before revocation");

            // Revoke
            let _ = VacciChainContract::revoke_vaccination(env.clone(), token_id, issuer.clone());

            // Verify after revocation
            let (vaccinated_after, records_after, _) = VacciChainContract::verify_vaccination(env.clone(), patient.clone());

            // Property: revoked records should not be returned
            prop_assert!(!vaccinated_after, "should not be vaccinated after revocation");
            prop_assert_eq!(records_after.len(), 0, "revoked records should not be returned");
        }
    }
}

// Property: unauthorized issuer cannot mint
proptest! {
    #[test]
    fn prop_unauthorized_issuer_cannot_mint(
        vaccine_name in r"[a-zA-Z0-9\-\s]{1,50}",
        date in r"\d{4}-\d{2}-\d{2}"
    ) {
        let env = Env::default();
        let admin = TestAddress::random(&env);
        let unauthorized_issuer = TestAddress::random(&env);
        let patient = TestAddress::random(&env);

        env.mock_all_auths();

        // Setup (don't add unauthorized_issuer)
        let _ = VacciChainContract::initialize(env.clone(), admin.clone());
        let _ = VacciChainContract::register_patient(env.clone(), patient.clone());

        let vaccine_str = SorobanString::from_slice(&env, vaccine_name.as_bytes());
        let date_str = SorobanString::from_slice(&env, date.as_bytes());

        // Try to mint with unauthorized issuer
        let result = VacciChainContract::mint_vaccination(
            env.clone(),
            patient.clone(),
            vaccine_str,
            date_str,
            unauthorized_issuer.clone(),
        None,
        None,
        );

        // Property: unauthorized issuer should not be able to mint
        prop_assert_eq!(
            result,
            Err(ContractError::Unauthorized),
            "unauthorized issuer should not be able to mint"
        );
    }
}
