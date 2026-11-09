import NBT from "prismarine-nbt";
import { fromJSONSafePrismarineNBT, toJSONSafePrismarineNBT } from "../PrismarineNBTUtils.ts";
import { extractSNBT, prettyPrintSNBT, prismarineToSNBT } from "../SNBTUtils.ts";
import { JSONB } from "../utils/JSONB.ts";

const HEADER_PREFIX = "\x1b[40m\x1b[95m";
const END_FORMATTING = "\x1b[0m";

let passed = 0;
let failed = 0;

function logHeader(header: string): void {
    console.log(`${HEADER_PREFIX}${header}${END_FORMATTING}`);
}

console.log("======== JSON Safe Prismarine-NBT Tests ========");
// TODO: Make these actually verify that the results are correct.
currentTest: try {
    logHeader("Complex data test");
    const complexData = {
        name: "testName",
        type: "compound",
        value: {
            aI: {
                type: "float",
                value: Infinity,
            },
            aNI: {
                type: "float",
                value: -Infinity,
            },
            aN: {
                type: "float",
                value: NaN,
            },
            aN0: {
                type: "float",
                value: -0,
            },
            bI: {
                type: "double",
                value: Infinity,
            },
            bNI: {
                type: "double",
                value: -Infinity,
            },
            bN: {
                type: "double",
                value: NaN,
            },
            bN0: {
                type: "double",
                value: -0,
            },
            c: {
                type: "list",
                value: {
                    type: "float",
                    value: [1, NaN, 0, -0, 2, Infinity, -Infinity],
                },
            },
            d: {
                type: "list",
                value: {
                    type: "list",
                    value: [
                        {
                            type: "float",
                            value: [0, 1, NaN, 0, -0, 2, Infinity, -Infinity],
                        },
                        {
                            type: "float",
                            value: [1, 1, NaN, 0, -0, 2, Infinity, -Infinity],
                        },
                    ],
                },
            },
            e: {
                type: "list",
                value: {
                    type: "list",
                    value: [
                        {
                            type: "list",
                            value: [
                                {
                                    type: "float",
                                    value: [0, 0, 1, NaN, 0, -0, 2, Infinity, -Infinity],
                                },
                                {
                                    type: "float",
                                    value: [0, 1, 1, NaN, 0, -0, 2, Infinity, -Infinity],
                                },
                            ],
                        },
                        {
                            type: "list",
                            value: [
                                {
                                    type: "float",
                                    value: [1, 0, 1, NaN, 0, -0, 2, Infinity, -Infinity],
                                },
                                {
                                    type: "float",
                                    value: [1, 1, 1, NaN, 0, -0, 2, Infinity, -Infinity],
                                },
                            ],
                        },
                    ],
                },
            },
        },
    } as const satisfies NBT.NBT;
    const origStringified: string = JSONB.stringify(complexData, undefined, undefined, {
        bigint: true,
        undefined: true,
        Infinity: true,
        NegativeInfinity: true,
        NaN: true,
        get: false,
        set: false,
        function: false,
        class: false,
    });

    const cycledStringified: string = JSONB.stringify(
        fromJSONSafePrismarineNBT(
            JSONB.parse(
                JSONB.stringify(toJSONSafePrismarineNBT(complexData), undefined, undefined, {
                    bigint: false,
                    undefined: false,
                    Infinity: false,
                    NegativeInfinity: false,
                    NaN: false,
                    get: false,
                    set: false,
                    function: false,
                    class: false,
                }),
                undefined,
                {
                    bigint: false,
                    undefined: false,
                    Infinity: false,
                    NegativeInfinity: false,
                    NaN: false,
                    get: false,
                    set: false,
                    function: false,
                    class: false,
                }
            )
        ),
        undefined,
        undefined,
        {
            bigint: true,
            undefined: true,
            Infinity: true,
            NegativeInfinity: true,
            NaN: true,
            get: false,
            set: false,
            function: false,
            class: false,
        }
    );

    if (origStringified !== cycledStringified) {
        console.error("\x1b[91mTest failed; data did not match original." + END_FORMATTING, "\noriginal:\n", origStringified, "\ncycled:\n", cycledStringified);
        failed++;
        break currentTest;
    }
    // console.log(JSONB.stringify(toJSONSafePrismarineNBT(complexData), undefined, undefined, {
    //                     bigint: false,
    //                     undefined: false,
    //                     Infinity: false,
    //                     NegativeInfinity: false,
    //                     NaN: false,
    //                     get: false,
    //                     set: false,
    //                     function: false,
    //                     class: false,
    //                 }));
    console.log("\x1b[92mTest passed." + END_FORMATTING /* , "\noriginal:\n" + origStringified, "\ncycled:\n" + cycledStringified */);
    passed++;
} catch (e) {
    console.error("\x1b[91mTest failed; error:" + END_FORMATTING, e);
    failed++;
}

console.log(`\n${passed ? "\x1b[92m" : ""}${passed} tests passed\x1b[0m, ${failed ? "\x1b[91m" : ""}${failed} tests failed\x1b[0m.`);
