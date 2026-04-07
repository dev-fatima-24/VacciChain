use soroban_sdk::{symbol_short, Env, Address, String};

pub fn emit_minted(env: &Env, token_id: u64, patient: &Address, vaccine_name: &String, issuer: &Address) {
    env.events().publish(
        (symbol_short!("minted"), token_id),
        (patient.clone(), vaccine_name.clone(), issuer.clone()),
    );
}

pub fn emit_issuer_added(env: &Env, issuer: &Address) {
    env.events().publish(
        (symbol_short!("iss_add"),),
        issuer.clone(),
    );
}

pub fn emit_issuer_revoked(env: &Env, issuer: &Address) {
    env.events().publish(
        (symbol_short!("iss_rev"),),
        issuer.clone(),
    );
}
