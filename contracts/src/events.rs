use soroban_sdk::{symbol_short, Env, Address, String};

pub fn emit_minted(env: &Env, token_id: u64, patient: &Address, vaccine_name: &String, issuer: &Address) {
    let timestamp = env.ledger().timestamp();
    env.events().publish(
        (symbol_short!("minted"), token_id),
        (patient.clone(), vaccine_name.clone(), issuer.clone(), timestamp),
    );
}

pub fn emit_revoked(env: &Env, token_id: u64, revoker: &Address) {
    let timestamp = env.ledger().timestamp();
    env.events().publish(
        (symbol_short!("revoked"), token_id),
        (revoker.clone(), timestamp),
    );
}

pub fn emit_issuer_added(env: &Env, issuer: &Address, admin: &Address) {
    let timestamp = env.ledger().timestamp();
    env.events().publish(
        (symbol_short!("iss_add"),),
        (issuer.clone(), admin.clone(), timestamp),
    );
}

pub fn emit_issuer_revoked(env: &Env, issuer: &Address, admin: &Address) {
    let timestamp = env.ledger().timestamp();
    env.events().publish(
        (symbol_short!("iss_rev"),),
        (issuer.clone(), admin.clone(), timestamp),
    );
}

pub fn emit_admin_transfer_proposed(env: &Env, current_admin: &Address, new_admin: &Address, expires_at: u64) {
    env.events().publish(
        (symbol_short!("adm_prop"),),
        (current_admin.clone(), new_admin.clone(), expires_at),
    );
}

pub fn emit_admin_transfer_accepted(env: &Env, new_admin: &Address) {
    let timestamp = env.ledger().timestamp();
    env.events().publish(
        (symbol_short!("adm_acc"),),
        (new_admin.clone(), timestamp),
    );
}

pub fn emit_contract_upgraded(env: &Env, new_wasm_hash: &soroban_sdk::BytesN<32>, admin: &Address) {
    let timestamp = env.ledger().timestamp();
    env.events().publish(
        (symbol_short!("upgraded"),),
        (new_wasm_hash.clone(), admin.clone(), timestamp),
    );
}
