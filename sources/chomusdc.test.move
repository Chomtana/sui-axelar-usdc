
#[test_only]
module axelar::chomusdc_test {
    use sui::test_scenario;
    use sui::coin::{TreasuryCap};
    use axelar::chomusdc::{Self, CHOMUSDC, TreasuryGate};
    use axelar::messenger::{Self, Axelar};

    #[test]
    fun test_init() {
        let owner = @0x1;
        let scenario_val = test_scenario::begin(owner);
        let scenario = &mut scenario_val;
        {
            let ctx = test_scenario::ctx(scenario);
            chomusdc::test_init(ctx);
        };
        test_scenario::next_tx(scenario, owner);
        {
            assert!(test_scenario::has_most_recent_for_sender<TreasuryCap<CHOMUSDC>>(scenario), 0);
        };

        let treasury_cap = test_scenario::take_from_sender<TreasuryCap<CHOMUSDC>>(scenario);

        test_scenario::next_tx(scenario, owner);
        {
            let ctx = test_scenario::ctx(scenario);
            chomusdc::create_gate(treasury_cap, ctx);
        };

        test_scenario::next_tx(scenario, owner);
        {
            assert!(test_scenario::has_most_recent_shared<TreasuryGate>(), 0);
        };

        test_scenario::end(scenario_val);
    }

    #[test]
    fun test_bridge_unlock() {
        let owner = @0x1;
        let axelarOwner = @0x2;
        let relayer = @0x3;

        let scenario_val = test_scenario::begin(owner);
        let scenario = &mut scenario_val;
        {
            let ctx = test_scenario::ctx(scenario);
            chomusdc::test_init(ctx);
        };

        test_scenario::next_tx(scenario, owner);
        {
            assert!(test_scenario::has_most_recent_for_sender<TreasuryCap<CHOMUSDC>>(scenario), 0);
        };

        let treasury_cap = test_scenario::take_from_sender<TreasuryCap<CHOMUSDC>>(scenario);

        test_scenario::next_tx(scenario, owner);
        {
            let ctx = test_scenario::ctx(scenario);
            chomusdc::create_gate(treasury_cap, ctx);
        };

        test_scenario::next_tx(scenario, owner);
        {
            assert!(test_scenario::has_most_recent_shared<TreasuryGate>(), 0);
        };

        let treasury_gate = test_scenario::take_shared<TreasuryGate>(scenario);

        test_scenario::next_tx(scenario, axelarOwner);
        {
            let ctx = test_scenario::ctx(scenario);
            messenger::create_axelar(ctx);
        };

        test_scenario::next_tx(scenario, axelarOwner);
        {
            assert!(test_scenario::has_most_recent_shared<Axelar>(), 0);
        };

        let axelar = test_scenario::take_shared<Axelar>(scenario);

        // See bcs/index.js
        let message = x"af969c1f9fdfc4feb078692da243e27fac40d107a9948317f0b2120a1422ae358096980000000000e78787a09f2c0000";
        let msg_id = sui::hash::keccak256(&message);

        test_scenario::next_tx(scenario, relayer);
        {
            messenger::submit_usdc_message(
                &mut axelar,
                chomusdc::test_gate_channel_address(&treasury_gate),
                b"ethereum-2",
                b"0xf01Dd015Bc442d872275A79b9caE84A6ff9B2A27",
                message
            );
        };

        test_scenario::next_tx(scenario, relayer);
        {
            let ctx = test_scenario::ctx(scenario);
            chomusdc::mint(
                &mut treasury_gate,
                &mut axelar,
                msg_id,
                ctx
            );
        };

        test_scenario::return_shared(treasury_gate);
        test_scenario::return_shared(axelar);

        test_scenario::end(scenario_val);
    }
}