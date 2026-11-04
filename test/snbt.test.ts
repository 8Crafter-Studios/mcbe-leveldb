import { extractSNBT, prettyPrintSNBT, prismarineToSNBT, toLongParts } from "../SNBTUtils.ts";
import { JSONB } from "../utils/JSONB.ts";

const HEADER_PREFIX = "\x1b[40m\x1b[95m";
const END_FORMATTING = "\x1b[0m";

let passed = 0;
let failed = 0;

function logHeader(header: string): void {
    console.log(`${HEADER_PREFIX}${header}${END_FORMATTING}`);
}

console.log("======== Parser Tests ========");
// TODO: Make these actually verify that the results are correct.
try {
    logHeader("-0f test");
    console.log("\x1b[92mTest passed; result:" + END_FORMATTING, JSONB.stringify(extractSNBT("{ testVal: -0f }").value));
    passed++;
} catch (e) {
    console.error("\x1b[91mTest failed; error:" + END_FORMATTING, e);
    failed++;
}
try {
    logHeader("-0d test");
    console.log("\x1b[92mTest passed; result:" + END_FORMATTING, JSONB.stringify(extractSNBT("{ testVal: -0d }").value));
    passed++;
} catch (e) {
    console.error("\x1b[91mTest failed; error:" + END_FORMATTING, e);
    failed++;
}
try {
    logHeader("NaN test");
    console.log("\x1b[92mTest passed; result:" + END_FORMATTING, JSONB.stringify(extractSNBT("{ testVal: NaN }").value));
    passed++;
} catch (e) {
    console.error("\x1b[91mTest failed; error:" + END_FORMATTING, e);
    failed++;
}
try {
    logHeader("NaNf test");
    console.log("\x1b[92mTest passed; result:" + END_FORMATTING, JSONB.stringify(extractSNBT("{ testVal: NaNf }").value));
    passed++;
} catch (e) {
    console.error("\x1b[91mTest failed; error:" + END_FORMATTING, e);
    failed++;
}
try {
    logHeader("NaNd test");
    console.log("\x1b[92mTest passed; result:" + END_FORMATTING, JSONB.stringify(extractSNBT("{ testVal: NaNd }").value));
    passed++;
} catch (e) {
    console.error("\x1b[91mTest failed; error:" + END_FORMATTING, e);
    failed++;
}
try {
    logHeader("Infinity test");
    console.log("\x1b[92mTest passed; result:" + END_FORMATTING, JSONB.stringify(extractSNBT("{ testVal: Infinity }").value));
    passed++;
} catch (e) {
    console.error("\x1b[91mTest failed; error:" + END_FORMATTING, e);
    failed++;
}
try {
    logHeader("Infinityf test");
    console.log("\x1b[92mTest passed; result:" + END_FORMATTING, JSONB.stringify(extractSNBT("{ testVal: Infinityf }").value));
    passed++;
} catch (e) {
    console.error("\x1b[91mTest failed; error:" + END_FORMATTING, e);
    failed++;
}
try {
    logHeader("Infinityd test");
    console.log("\x1b[92mTest passed; result:" + END_FORMATTING, JSONB.stringify(extractSNBT("{ testVal: Infinityd }").value));
    passed++;
} catch (e) {
    console.error("\x1b[91mTest failed; error:" + END_FORMATTING, e);
    failed++;
}
try {
    logHeader("-Infinity test");
    console.log("\x1b[92mTest passed; result:" + END_FORMATTING, JSONB.stringify(extractSNBT("{ testVal: -Infinity }").value));
    passed++;
} catch (e) {
    console.error("\x1b[91mTest failed; error:" + END_FORMATTING, e);
    failed++;
}
try {
    logHeader("-Infinityf test");
    console.log("\x1b[92mTest passed; result:" + END_FORMATTING, JSONB.stringify(extractSNBT("{ testVal: -Infinityf }").value));
    passed++;
} catch (e) {
    console.error("\x1b[91mTest failed; error:" + END_FORMATTING, e);
    failed++;
}
try {
    logHeader("-Infinityd test");
    console.log("\x1b[92mTest passed; result:" + END_FORMATTING, JSONB.stringify(extractSNBT("{ testVal: -Infinityd }").value));
    passed++;
} catch (e) {
    console.error("\x1b[91mTest failed; error:" + END_FORMATTING, e);
    failed++;
}
try {
    logHeader("Double quoted string with escaped double quote test");
    console.log("\x1b[92mTest passed; result:" + END_FORMATTING, JSONB.stringify(extractSNBT('{ testVal: "test\\"test" }').value));
    passed++;
} catch (e) {
    console.error("\x1b[91mTest failed; error:" + END_FORMATTING, e);
    failed++;
}
try {
    logHeader("Double quoted string with escaped single quote test");
    console.log("\x1b[92mTest passed; result:" + END_FORMATTING, JSONB.stringify(extractSNBT('{ testVal: "test\\\'test" }').value));
    passed++;
} catch (e) {
    console.error("\x1b[91mTest failed; error:" + END_FORMATTING, e);
    failed++;
}
try {
    logHeader("Single quoted string with escaped double quote test");
    console.log("\x1b[92mTest passed; result:" + END_FORMATTING, JSONB.stringify(extractSNBT("{ testVal: 'test\\\"test' }").value));
    passed++;
} catch (e) {
    console.error("\x1b[91mTest failed; error:" + END_FORMATTING, e);
    failed++;
}
try {
    logHeader("Single quoted string with escaped single quote test");
    console.log("\x1b[92mTest passed; result:" + END_FORMATTING, JSONB.stringify(extractSNBT("{ testVal: 'test\\'test' }").value));
    passed++;
} catch (e) {
    console.error("\x1b[91mTest failed; error:" + END_FORMATTING, e);
    failed++;
}
try {
    logHeader("Double quoted key with escaped double quote test");
    console.log("\x1b[92mTest passed; result:" + END_FORMATTING, JSONB.stringify(extractSNBT('{ "test\\"Val": "test" }').value));
    passed++;
} catch (e) {
    console.error("\x1b[91mTest failed; error:" + END_FORMATTING, e);
    failed++;
}
try {
    logHeader("Double quoted key with escaped single quote test");
    console.log("\x1b[92mTest passed; result:" + END_FORMATTING, JSONB.stringify(extractSNBT('{ "test\\\'Val": "test" }').value));
    passed++;
} catch (e) {
    console.error("\x1b[91mTest failed; error:" + END_FORMATTING, e);
    failed++;
}
try {
    logHeader("Single quoted key with escaped double quote test");
    console.log("\x1b[92mTest passed; result:" + END_FORMATTING, JSONB.stringify(extractSNBT("{ 'test\\\"Val': 'test' }").value));
    passed++;
} catch (e) {
    console.error("\x1b[91mTest failed; error:" + END_FORMATTING, e);
    failed++;
}
try {
    logHeader("Single quoted key with escaped single quote test");
    console.log("\x1b[92mTest passed; result:" + END_FORMATTING, JSONB.stringify(extractSNBT("{ 'test\\'Val': 'test' }").value));
    passed++;
} catch (e) {
    console.error("\x1b[91mTest failed; error:" + END_FORMATTING, e);
    failed++;
}

console.log();
console.log("======== Parser Intended Fail Tests ========");
try {
    logHeader("Double quoted string with unescaped double quote test:");
    console.error("\x1b[91mTest did not fail; result:" + END_FORMATTING, JSONB.stringify(extractSNBT('{ testVal: "test"test" }').value));
    failed++;
} catch (e) {
    console.log("\x1b[92mTest passed." + END_FORMATTING /* , e */);
    passed++;
}
try {
    logHeader("Double quoted string with 2x unescaped double quote test:");
    console.error("\x1b[91mTest did not fail; result:" + END_FORMATTING, JSONB.stringify(extractSNBT('{ testVal: "test"t"est" }').value));
    failed++;
} catch (e) {
    console.log("\x1b[92mTest passed." + END_FORMATTING /* , e */);
    passed++;
}
try {
    logHeader("Single quoted string with unescaped single quote test:");
    console.error("\x1b[91mTest did not fail; result:" + END_FORMATTING, JSONB.stringify(extractSNBT("{ testVal: 'test'test' }").value));
    failed++;
} catch (e) {
    console.log("\x1b[92mTest passed." + END_FORMATTING /* , e */);
    passed++;
}
try {
    logHeader("Single quoted string with 2x unescaped single quote test:");
    console.error("\x1b[91mTest did not fail; result:" + END_FORMATTING, JSONB.stringify(extractSNBT("{ testVal: 'test't'est' }").value));
    failed++;
} catch (e) {
    console.log("\x1b[92mTest passed." + END_FORMATTING /* , e */);
    passed++;
}
try {
    logHeader("Double quoted key with unescaped double quote test:");
    console.error("\x1b[91mTest did not fail; result:" + END_FORMATTING, JSONB.stringify(extractSNBT('{ "test"Val": "test" }').value));
    failed++;
} catch (e) {
    console.log("\x1b[92mTest passed." + END_FORMATTING /* , e */);
    passed++;
}
try {
    logHeader("Double quoted key with 2x unescaped double quote test:");
    console.error("\x1b[91mTest did not fail; result:" + END_FORMATTING, JSONB.stringify(extractSNBT('{ "test"V"al": "test" }').value));
    failed++;
} catch (e) {
    console.log("\x1b[92mTest passed." + END_FORMATTING /* , e */);
    passed++;
}
try {
    logHeader("Single quoted key with unescaped single quote test:");
    console.error("\x1b[91mTest did not fail; result:" + END_FORMATTING, JSONB.stringify(extractSNBT("{ 'test'Val': 'test' }").value));
    failed++;
} catch (e) {
    console.log("\x1b[92mTest passed." + END_FORMATTING /* , e */);
    passed++;
}
try {
    logHeader("Single quoted key with 2x unescaped single quote test:");
    console.error("\x1b[91mTest did not fail; result:" + END_FORMATTING, JSONB.stringify(extractSNBT("{ 'test'V'al': 'test' }").value));
    failed++;
} catch (e) {
    console.log("\x1b[92mTest passed." + END_FORMATTING /* , e */);
    passed++;
}

console.log();
console.log("======== Stringification Tests ========");
// TODO: Make these match the other test structures.
console.log("-0 float test:", prettyPrintSNBT(prismarineToSNBT({ type: "float", value: -0 })));
console.log("-0 double test:", prettyPrintSNBT(prismarineToSNBT({ type: "double", value: -0 })));
console.log("NaN float test:", prettyPrintSNBT(prismarineToSNBT({ type: "float", value: NaN })));
console.log("NaN double test:", prettyPrintSNBT(prismarineToSNBT({ type: "double", value: NaN })));
console.log("Infinity float test:", prettyPrintSNBT(prismarineToSNBT({ type: "float", value: Infinity })));
console.log("Infinity double test:", prettyPrintSNBT(prismarineToSNBT({ type: "double", value: Infinity })));
console.log("-Infinity float test:", prettyPrintSNBT(prismarineToSNBT({ type: "float", value: -Infinity })));
console.log("-Infinity double test:", prettyPrintSNBT(prismarineToSNBT({ type: "double", value: -Infinity })));

console.log(`\n${passed ? "\x1b[92m" : ""}${passed} tests passed\x1b[0m, ${failed ? "\x1b[91m" : ""}${failed} tests failed\x1b[0m.`);
