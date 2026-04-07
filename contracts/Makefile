build:
	cargo build --target wasm32-unknown-unknown --release
	@echo "WASM artifact: target/wasm32-unknown-unknown/release/vaccichain.wasm"

test:
	cargo test

deploy:
	@echo "Deploying to Stellar testnet..."
	soroban contract deploy \
		--wasm target/wasm32-unknown-unknown/release/vaccichain.wasm \
		--source $(ADMIN_SECRET_KEY) \
		--network testnet

clean:
	cargo clean

.PHONY: build test deploy clean
