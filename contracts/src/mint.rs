use soroban_sdk::{Env, Address, String, Vec};
use crate::storage::{DataKey, VaccinationRecord, IssuerRecord};
use crate::events;
use crate::ContractError;
use crate::validate_input_length;

pub fn mint_vaccination(
    env: &Env,
    patient: Address,
    vaccine_name: String,
    date_administered: String,
    issuer: Address,
) -> Result<u64, ContractError> {
    validate_input_length(&vaccine_name, "vaccine_name")?;
    validate_input_length(&date_administered, "date_administered")?;

    // Require issuer auth
    issuer.require_auth();

    // Check issuer is authorized
    let is_authorized: bool = env
        .storage()
        .persistent()
        .get::<DataKey, IssuerRecord>(&DataKey::Issuer(issuer.clone()))
        .map(|r| r.authorized)
        .unwrap_or(false);
    if !is_authorized {
        return Err(ContractError::Unauthorized);
    }

    // Duplicate detection: (patient, vaccine_name, date_administered) must be unique
    let tokens: Vec<u64> = env
        .storage()
        .persistent()
        .get(&DataKey::PatientTokens(patient.clone()))
        .unwrap_or(Vec::new(env));

    for i in 0..tokens.len() {
        let tid = tokens.get(i).unwrap();
        let record: VaccinationRecord = env
            .storage()
            .persistent()
            .get(&DataKey::Token(tid))
            .unwrap();
        if record.vaccine_name == vaccine_name && record.date_administered == date_administered {
            return Err(ContractError::DuplicateRecord);
        }
    }

    // Assign token ID
    let token_id: u64 = env
        .storage()
        .persistent()
        .get(&DataKey::NextTokenId)
        .unwrap_or(1u64);

    let record = VaccinationRecord {
        token_id,
        patient: patient.clone(),
        vaccine_name: vaccine_name.clone(),
        date_administered,
        issuer: issuer.clone(),
        timestamp: env.ledger().timestamp(),
        schema_version: 1,
        revoked: false,
    };

    // Persist token
    env.storage().persistent().set(&DataKey::Token(token_id), &record);

    // Update patient token list
    let mut patient_tokens = tokens;
    patient_tokens.push_back(token_id);
    env.storage().persistent().set(&DataKey::PatientTokens(patient.clone()), &patient_tokens);

    // Increment next token ID
    env.storage().persistent().set(&DataKey::NextTokenId, &(token_id + 1));

    events::emit_minted(env, token_id, &patient, &vaccine_name, &issuer);

    Ok(token_id)
}
