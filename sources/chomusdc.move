// Copyright (c) Chomtana Chanjaraswichai
// SPDX-License-Identifier: Apache-2.0
// Disclaimer: Not real USDC, just for development demonstration
// For hackathon only. Don't use it in the production

module axelar::chomusdc {
    use sui::bcs;
    use std::option;
    use sui::coin::{Self, Coin, TreasuryCap};
    use sui::transfer;
    use sui::tx_context::{TxContext};
    use sui::object::{Self, UID};
    use axelar::messenger::{Self, Axelar, Channel};

    /// Name of the coin. By convention, this type has the same name as its parent module
    /// and has no fields. The full type of the coin defined by this module will be `COIN<CHOMUSDC>`.
    struct CHOMUSDC has drop {}

    struct TreasuryGate has key {
        id: UID,
        channel: Channel<TreasuryCap<CHOMUSDC>>
    }

    #[allow(unused_function)]
    /// Register the managed currency to acquire its `TreasuryCap`. Because
    /// this is a module initializer, it ensures the currency only gets
    /// registered once.
    fun init(witness: CHOMUSDC, ctx: &mut TxContext) {
        // Get a treasury cap for the coin and give it to the transaction sender
        let (treasury_cap, metadata) = coin::create_currency<CHOMUSDC>(witness, 2, b"USDC", b"USDC (Chom)", b"A fake USDC token developed for axelar hackathon", option::none(), ctx);

        transfer::public_freeze_object(metadata);
        // transfer::public_transfer(treasury_cap, tx_context::sender(ctx));

        sui::transfer::share_object(TreasuryGate {
            id: object::new(ctx),
            channel: messenger::create_channel(treasury_cap, ctx)
        })
    }

    /// Create and share a new TreasuryGate object.
    // public entry fun create_gate(cap: TreasuryCap<CHOMUSDC>, ctx: &mut TxContext) {
    //     sui::transfer::share_object(TreasuryGate {
    //         id: object::new(ctx),
    //         channel: messenger::create_channel(cap, ctx)
    //     })
    // }

    fun mint_from_axelar(treasury_cap: &mut TreasuryCap<CHOMUSDC>, payload: &vector<u8>, ctx: &mut TxContext) {
        let bcs = bcs::new(*payload);

        // Use `peel_*` functions to peel values from the serialized bytes. 
        // Order has to be the same as we used in serialization!
        let (recipient, amount) = (
            bcs::peel_address(&mut bcs), bcs::peel_u64(&mut bcs)
        );

        coin::mint_and_transfer(treasury_cap, amount, recipient, ctx);
    }

    // Mint from axelar message
    public entry fun mint(
        gate: &mut TreasuryGate,
        axelar: &mut Axelar,
        msg_id: vector<u8>,
        ctx: &mut TxContext
    ) {
        let (treasury_cap, _, _, _, payload) = messenger::consume_message(axelar, &mut gate.channel, msg_id);
        mint_from_axelar(treasury_cap, &payload, ctx)
    }

    /// Manager can mint new coins
    public entry fun mint_centralized(
        treasury_cap: &mut TreasuryCap<CHOMUSDC>, amount: u64, recipient: address, ctx: &mut TxContext
    ) {
        coin::mint_and_transfer(treasury_cap, amount, recipient, ctx)
    }

    /// Manager can burn coins
    public entry fun burn_centralized(treasury_cap: &mut TreasuryCap<CHOMUSDC>, coin: Coin<CHOMUSDC>) {
        coin::burn(treasury_cap, coin);
    }

    #[test_only]
    /// Wrapper of module initializer for testing
    public fun test_init(ctx: &mut TxContext) {
        init(CHOMUSDC {}, ctx)
    }

    #[test_only]
    /// Wrapper gate channel id fetching
    public fun test_gate_channel_address(treasury_gate: &TreasuryGate): address {
        messenger::test_channel_address(&treasury_gate.channel)
    }
}