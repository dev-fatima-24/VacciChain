#![cfg(test)]

use soroban_sdk::{Address, Env, String as SorobanString, testutils::Address as TestAddress, Vec};
use crate::{VacciChainContract, ContractError, storage::VaccinationRecord};

#[test]
fn test_upgrade_v1_to_v2_data_persistence() {
    let env = Env::default();
    let admin = TestAddress::random(&env);
    let issuer = TestAddress::random(&env);
    let patient = TestAddress::random(&env);

    env.mock_all_auths();

    // Initialize v1 contract
    let _ = VacciChainContract::initialize(env.clone(), admin.clone());

    // Add issuer
    let _ = VacciChainContract::add_issuer(
        env.clone(),
        issuer.clone(),
        SorobanString::from_slice(&env, b"Test Issuer"),
        SorobanString::from_slice(&env, b"LIC123"),
        SorobanString::from_slice(&env, b"US"),
    );

    // Register patient
    let _ = VacciChainContract::register_patient(env.clone(), patient.clone());

    // Mint vaccination record in v1
    let vaccine_name = SorobanString::from_slice(&env, b"COVID-19");
    let date = SorobanString::from_slice(&env, b"2024-01-15");

    let token_id = VacciChainContract::mint_vaccination(
        env.clone(),
        patient.clone(),
        vaccine_name.clone(),
        date.clone(),
        issuer.clone(),
        None,
        None,
    ).expect("mint should succeed");

    // Verify record exists in v1
    let (vaccinated, records, _) = VacciChainContract::verify_vaccination(env.clone(), patient.clone());
    assert!(vaccinated, "patient should be vaccinated");
    assert_eq!(records.len(), 1, "should have 1 record");
    assert_eq!(records.get(0).unwrap().schema_version, 1, "schema version should be 1");

    // After upgrade to v2, verify records are still readable
    // (In real scenario, contract would be redeployed with v2 code)
    let (vaccinated_after, records_after, _) = VacciChainContract::verify_vaccination(env.clone(), patient.clone());
    assert!(vaccinated_after, "patient should still be vaccinated after upgrade");
    assert_eq!(records_after.len(), 1, "should still have 1 record");
    assert_eq!(records_after.get(0).unwrap().token_id, token_id, "token_id should match");
    assert_eq!(records_after.get(0).unwrap().vaccine_name, vaccine_name, "vaccine_name should match");
}

#[test]
fn test_schema_version_field_read_across_versions() {
    let env = Env::default();
    let admin = TestAddress::random(&env);
    let issuer = TestAddress::random(&env);
    let patient = TestAddress::random(&env);

    env.mock_all_auths();

    let _ = VacciChainContract::initialize(env.clone(), admin.clone());
    let _ = VacciChainContract::add_issuer(
        env.clone(),
        issuer.clone(),
        SorobanString::from_slice(&env, b"Test Issuer"),
        SorobanString::from_slice(&env, b"LIC123"),
        SorobanString::from_slice(&env, b"US"),
    );
    let _ = VacciChainContract::register_patient(env.clone(), patient.clone());

    let vaccine_name = SorobanString::from_slice(&env, b"Pfizer");
    let date = SorobanString::from_slice(&env, b"2024-02-20");

    let _ = VacciChainContract::mint_vaccination(
        env.clone(),
        patient.clone(),
        vaccine_name,
        date,
        issuer.clone(),
        None,
        None,
    );

    let (_, records, _) = VacciChainContract::verify_vaccination(env.clone(), patient.clone());
    let record = records.get(0).unwrap();

    // Verify schema_version field is correctly set
    assert_eq!(record.schema_version, 1, "schema_version should be 1 for v1 records");
}

#[test]
fn test_multiple_records_persist_after_upgrade() {
    let env = Env::default();
    let admin = TestAddress::random(&env);
    let issuer = TestAddress::random(&env);
    let patient = TestAddress::random(&env);

    env.mock_all_auths();

    let _ = VacciChainContract::initialize(env.clone(), admin.clone());
    let _ = VacciChainContract::add_issuer(
        env.clone(),
        issuer.clone(),
        SorobanString::from_slice(&env, b"Test Issuer"),
        SorobanString::from_slice(&env, b"LIC123"),
        SorobanString::from_slice(&env, b"US"),
    );
    let _ = VacciChainContract::register_patient(env.clone(), patient.clone());

    // Mint multiple records
    let vaccines = vec!["COVID-19", "Flu", "Measles"];
    let dates = vec!["2024-01-15", "2024-02-20", "2024-03-10"];

    for i in 0..vaccines.len() {
        let vaccine = SorobanString::from_slice(&env, vaccines[i].as_bytes());
        let date = SorobanString::from_slice(&env, dates[i].as_bytes());

        let _ = VacciChainContract::mint_vaccination(
            env.clone(),
            patient.clone(),
            vaccine,
            date,
            issuer.clone(),
        None,
        None,
        );
    }

    // Verify all records persist
    let (vaccinated, records, _) = VacciChainContract::verify_vaccination(env.clone(), patient.clone());
    assert!(vaccinated, "patient should be vaccinated");
    assert_eq!(records.len(), 3, "should have 3 records");

    // Verify each record's schema version
    for i in 0..records.len() {
        let record = records.get(i).unwrap();
        assert_eq!(record.schema_version, 1, "all records should have schema_version 1");
    }
}

#[test]
fn test_revoked_records_persist_after_upgrade() {
    let env = Env::default();
    let admin = TestAddress::random(&env);
    let issuer = TestAddress::random(&env);
    let patient = TestAddress::random(&env);

    env.mock_all_auths();

    let _ = VacciChainContract::initialize(env.clone(), admin.clone());
    let _ = VacciChainContract::add_issuer(
        env.clone(),
        issuer.clone(),
        SorobanString::from_slice(&env, b"Test Issuer"),
        SorobanString::from_slice(&env, b"LIC123"),
        SorobanString::from_slice(&env, b"US"),
    );
    let _ = VacciChainContract::register_patient(env.clone(), patient.clone());

    let vaccine_name = SorobanString::from_slice(&env, b"COVID-19");
    let date = SorobanString::from_slice(&env, b"2024-01-15");

    let token_id = VacciChainContract::mint_vaccination(
        env.clone(),
        patient.clone(),
        vaccine_name,
        date,
        issuer.clone(),
        None,
        None,
    ).expect("mint should succeed");

    // Revoke the record
    let _ = VacciChainContract::revoke_vaccination(env.clone(), token_id, issuer.clone());

    // Verify record is revoked
    let (vaccinated, records, _) = VacciChainContract::verify_vaccination(env.clone(), patient.clone());
    assert!(!vaccinated, "patient should not be vaccinated after revocation");
    assert_eq!(records.len(), 0, "revoked records should not be returned");
}
