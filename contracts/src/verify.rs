use soroban_sdk::{Env, Address, Vec, contracttype, String};
use crate::storage::{DataKey, VaccinationRecord};

const MAX_BATCH_SIZE: u32 = 100;

/// Per-vaccine dose completion summary returned by verify_vaccination.
#[contracttype]
#[derive(Clone)]
pub struct DoseStatus {
    pub vaccine_name: String,
    /// Highest dose_number seen across non-revoked records for this vaccine.
    pub doses_received: u32,
    /// dose_series from the record with the highest dose_number (0 = unknown / single-dose).
    pub doses_required: u32,
    /// True when doses_required > 0 && doses_received >= doses_required.
    pub complete: bool,
}

pub fn batch_verify(env: &Env, wallets: Vec<Address>) -> Vec<(Address, bool, Vec<VaccinationRecord>)> {
    assert!(wallets.len() <= MAX_BATCH_SIZE, "batch size exceeds maximum of 100");

    let mut results: Vec<(Address, bool, Vec<VaccinationRecord>)> = Vec::new(env);
    for i in 0..wallets.len() {
        let wallet = wallets.get(i).unwrap();
        let (vaccinated, records, _) = verify_vaccination(env, wallet.clone());
        results.push_back((wallet, vaccinated, records));
    }
    results
}

pub fn verify_vaccination(env: &Env, wallet: Address) -> (bool, Vec<VaccinationRecord>, Vec<DoseStatus>) {
    let tokens: Vec<u64> = env
        .storage()
        .persistent()
        .get(&DataKey::PatientTokens(wallet.clone()))
        .unwrap_or(Vec::new(env));

    if tokens.is_empty() {
        return (false, Vec::new(env), Vec::new(env));
    }

    let mut records: Vec<VaccinationRecord> = Vec::new(env);
    let mut has_active = false;

    for i in 0..tokens.len() {
        let tid = tokens.get(i).unwrap();
        if let Some(record) = env.storage().persistent().get::<DataKey, VaccinationRecord>(&DataKey::Token(tid)) {
            if !record.revoked {
                has_active = true;
                records.push_back(record);
            }
        }
    }

    // Build per-vaccine dose status.
    // We track (doses_received, doses_required) per vaccine name.
    // Using parallel vecs since no_std Map isn't available.
    let mut vaccine_names: Vec<String> = Vec::new(env);
    let mut doses_received: Vec<u32> = Vec::new(env);
    let mut doses_required: Vec<u32> = Vec::new(env);

    for i in 0..records.len() {
        let rec = records.get(i).unwrap();
        let dn = rec.dose_number.unwrap_or(0);
        let ds = rec.dose_series.unwrap_or(0);

        // Find existing entry for this vaccine name
        let mut found = false;
        for j in 0..vaccine_names.len() {
            if vaccine_names.get(j).unwrap() == rec.vaccine_name {
                let prev_dn = doses_received.get(j).unwrap();
                let prev_ds = doses_required.get(j).unwrap();
                if dn > prev_dn {
                    doses_received.set(j, dn);
                }
                if ds > prev_ds {
                    doses_required.set(j, ds);
                }
                found = true;
                break;
            }
        }
        if !found {
            vaccine_names.push_back(rec.vaccine_name.clone());
            doses_received.push_back(dn);
            doses_required.push_back(ds);
        }
    }

    let mut dose_statuses: Vec<DoseStatus> = Vec::new(env);
    for i in 0..vaccine_names.len() {
        let dr = doses_received.get(i).unwrap();
        let dq = doses_required.get(i).unwrap();
        dose_statuses.push_back(DoseStatus {
            vaccine_name: vaccine_names.get(i).unwrap(),
            doses_received: dr,
            doses_required: dq,
            complete: dq > 0 && dr >= dq,
        });
    }

    (has_active, records, dose_statuses)
}
