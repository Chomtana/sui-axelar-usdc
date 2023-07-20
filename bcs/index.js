import { BCS, getSuiMoveConfig } from "@mysten/bcs";

// initialize the serializer with default Sui Move configurations
const bcs = new BCS(getSuiMoveConfig());

bcs.registerStructType("UnlockMessage", {
  recipient: BCS.ADDRESS,
  amount: BCS.U64,
  nonce: BCS.U64,
});

const result = bcs.ser("UnlockMessage", {
  recipient: "0xaf969c1f9fdfc4feb078692da243e27fac40d107a9948317f0b2120a1422ae35",
  amount: 10000000,
  nonce: Math.floor(Math.random() * 1000000000000000),
});
console.log(result.toString("hex"))