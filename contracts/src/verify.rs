use soroban_sdk::{Env, Address, Vec};
use crate::storage::{DataKey, VaccinationRecord};

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
        if let Some(record) = env.storage().persistent().get(&DataKey::Token(tid)) {
            records.push_back(record);
        }
    }

    (!records.is_empty(), records)
}
