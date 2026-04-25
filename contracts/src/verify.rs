use soroban_sdk::{Env, Address, Vec};
use crate::storage::{DataKey, VaccinationRecord};

const MAX_BATCH_SIZE: u32 = 100;

pub fn batch_verify(env: &Env, wallets: Vec<Address>) -> Vec<(Address, bool, Vec<VaccinationRecord>)> {
    assert!(wallets.len() <= MAX_BATCH_SIZE, "batch size exceeds maximum of 100");

    let mut results: Vec<(Address, bool, Vec<VaccinationRecord>)> = Vec::new(env);
    for i in 0..wallets.len() {
        let wallet = wallets.get(i).unwrap();
        let (vaccinated, records) = verify_vaccination(env, wallet.clone());
        results.push_back((wallet, vaccinated, records));
    }
    results
}

pub fn verify_vaccination(env: &Env, wallet: Address) -> (bool, Vec<VaccinationRecord>) {
    let tokens: Vec<u64> = env
        .storage()
        .persistent()
        .get(&DataKey::PatientTokens(wallet))
        .unwrap_or(Vec::new(env));

    if tokens.is_empty() {
        return (false, Vec::new(env));
    }

    let mut records: Vec<VaccinationRecord> = Vec::new(env);
    for i in 0..tokens.len() {
        let tid = tokens.get(i).unwrap();
        if let Some(record) = env.storage().persistent().get::<DataKey, VaccinationRecord>(&DataKey::Token(tid)) {
            if !record.revoked {
                records.push_back(record);
            }
        }
    }

    (!records.is_empty(), records)
}
