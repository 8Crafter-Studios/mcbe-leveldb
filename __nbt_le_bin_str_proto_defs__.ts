/**
 * The protodef definitions for NBT LE with binary string encoding.
 *
 * @internal
 */
export const __NBT_LE_binary_string_encoding_proto_defs__ = {
    void: "native",
    container: "native",
    i8: "native",
    switch: "native",
    compound: "native",
    nbtTagName: "native",
    li16: "native",
    lu16: "native",
    li32: "native",
    li64: "native",
    lf32: "native",
    lf64: "native",
    pstring: "native",
    shortString: [
        "pstring",
        {
            countType: "lu16",
        },
    ],
    shortStringBinary: [
        "pstring",
        {
            countType: "lu16",
            encoding: "binary",
        },
    ],
    byteArray: [
        "array",
        {
            countType: "li32",
            type: "i8",
        },
    ],
    list: [
        "container",
        [
            {
                name: "type",
                type: "nbtMapper",
            },
            {
                name: "value",
                type: [
                    "array",
                    {
                        countType: "li32",
                        type: [
                            "nbtSwitch",
                            {
                                type: "type",
                            },
                        ],
                    },
                ],
            },
        ],
    ],
    intArray: [
        "array",
        {
            countType: "li32",
            type: "li32",
        },
    ],
    longArray: [
        "array",
        {
            countType: "li32",
            type: "li64",
        },
    ],
    nbtMapper: [
        "mapper",
        {
            type: "i8",
            mappings: {
                "0": "end",
                "1": "byte",
                "2": "short",
                "3": "int",
                "4": "long",
                "5": "float",
                "6": "double",
                "7": "byteArray",
                "8": "string",
                "9": "list",
                "10": "compound",
                "11": "intArray",
                "12": "longArray",
            },
        },
    ],
    nbtSwitch: [
        "switch",
        {
            compareTo: "$type",
            fields: {
                end: "void",
                byte: "i8",
                short: "li16",
                int: "li32",
                long: "li64",
                float: "lf32",
                double: "lf64",
                byteArray: "byteArray",
                string: "shortStringBinary",
                list: "list",
                compound: "compound",
                intArray: "intArray",
                longArray: "longArray",
            },
        },
    ],
    nbt: [
        "container",
        [
            {
                name: "type",
                type: "nbtMapper",
            },
            {
                name: "name",
                type: "nbtTagName",
            },
            {
                name: "value",
                type: [
                    "nbtSwitch",
                    {
                        type: "type",
                    },
                ],
            },
        ],
    ],
    anonymousNbt: [
        "container",
        [
            {
                name: "type",
                type: "nbtMapper",
            },
            {
                name: "value",
                type: [
                    "nbtSwitch",
                    {
                        type: "type",
                    },
                ],
            },
        ],
    ],
    anonOptionalNbt: [
        "optionalNbtType",
        {
            tagType: "anonymousNbt",
        },
    ],
    optionalNbt: [
        "optionalNbtType",
        {
            tagType: "nbt",
        },
    ],
} as const;
