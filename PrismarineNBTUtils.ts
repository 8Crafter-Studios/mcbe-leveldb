import type { TagType } from "prismarine-nbt";
import NBT from "prismarine-nbt";
import type { NegativeInfinity, PositiveInfinity } from "type-fest";

/**
 * Types for JSON serializable Prismarine-NBT.
 *
 * @see {@link toJSONSafePrismarineNBT}
 * @see {@link fromJSONSafePrismarineNBT}
 */
export namespace JSONSafePrismarineNBT {
    export type Byte = { type: `${TagType.Byte}`; value: number };

    export type Short = { type: `${TagType.Short}`; value: number };

    export type Int = { type: `${TagType.Int}`; value: number };

    export type Long = { type: `${TagType.Long}`; value: [high: number, low: number] };

    export type Float = { type: `${TagType.Float}`; value: number | "NaN" | "Infinity" | "-Infinity" };

    export type Double = { type: `${TagType.Double}`; value: number | "NaN" | "Infinity" | "-Infinity" };

    export type String = { type: `${TagType.String}`; value: string };

    export type List<T extends JSONSafePrismarineNBTTagType> = {
        type: `${TagType.List}`;
        value: { type: Tags[T]["type"]; value: Tags[T]["value"][] };
    };

    export type Compound = { type: `${TagType.Compound}`; value: Record<string, undefined | Tags[TagType]> };

    export type ByteArray = { type: `${TagType.ByteArray}`; value: Byte["value"][] };

    export type ShortArray = { type: `${TagType.ShortArray}`; value: Short["value"][] };

    export type IntArray = { type: `${TagType.IntArray}`; value: Int["value"][] };

    export type LongArray = { type: `${TagType.LongArray}`; value: Long["value"][] };

    export type Tags = {
        ["end"]: { type: `${"end"}`; value: null }; // TODO: Add this to Prismarine-NBT Tags with the type as undefined, or maybe add it only to the list type.
        [TagType.Byte]: Byte;
        [TagType.Short]: Short;
        [TagType.Int]: Int;
        [TagType.Long]: Long;
        [TagType.Float]: Float;
        [TagType.Double]: Double;
        [TagType.String]: String;
        [TagType.List]: List<TagType>;
        [TagType.Compound]: Compound;
        [TagType.ByteArray]: ByteArray;
        [TagType.ShortArray]: ShortArray;
        [TagType.IntArray]: IntArray;
        [TagType.LongArray]: LongArray;
    };

    export type NBT = Tags["compound"] & { name: string };

    /**
     * A tag type in JSON serializable Prismarine-NBT data.
     *
     * NOTE: This type is just temporary until "end" is added to the Prismarine-NBT type definitions, after which it will be removed.
     */
    export type JSONSafePrismarineNBTTagType = NBT.TagType | "end"; // TEMP: This type is just until "end" is added to the Prismarine-NBT type definitions.

    type ToJSONSafeNumber<T> =
        T extends PositiveInfinity ? "Infinity"
        : T extends NegativeInfinity ? "-Infinity"
        : number extends T ? T | "NaN"
        : T;

    type FromJSONSafeNumber<T> =
        T extends "Infinity" ? PositiveInfinity
        : T extends "-Infinity" ? NegativeInfinity
        : T extends "NaN" ? number
        : T;

    type ToJSONSafeFloatOrDoubleValue<T> = T extends readonly unknown[] ? { [K in keyof T]: ToJSONSafeFloatOrDoubleValue<T[K]> } : ToJSONSafeNumber<T>;

    type FromJSONSafeFloatOrDoubleValue<T> = T extends readonly unknown[] ? { [K in keyof T]: FromJSONSafeFloatOrDoubleValue<T[K]> } : FromJSONSafeNumber<T>;

    type ToJSONSafeListValue<T> =
        T extends readonly unknown[] ? { [K in keyof T]: ToJSONSafeNumber<T[K]> }
        : T extends unknown[] ? ToJSONSafeNumber<T[number]>[]
        : T;

    type FromJSONSafeListValue<T> =
        T extends readonly unknown[] ? { [K in keyof T]: FromJSONSafeNumber<T[K]> }
        : T extends unknown[] ? FromJSONSafeNumber<T[number]>[]
        : T;

    /**
     * Converts a Prismarine-NBT data type to a JSON serializable Prismarine-NBT data type.
     *
     * @see {@link toJSONSafePrismarineNBT}
     */
    export type ToJSONSafePrismarineNBT<T> =
        T extends { type: "float"; value: infer V } ?
            Omit<T, "value"> & {
                value: ToJSONSafeFloatOrDoubleValue<V>;
            }
        : T extends { type: "double"; value: infer V } ?
            Omit<T, "value"> & {
                value: ToJSONSafeFloatOrDoubleValue<V>;
            }
        : T extends (
            {
                type: "list";
                value: {
                    type: infer ElementType;
                    value: infer ElementValues;
                };
            }
        ) ?
            Omit<T, "value"> & {
                value: ElementType extends "float" | "double" ?
                    {
                        type: ElementType;
                        value: ToJSONSafeListValue<ElementValues>;
                    }
                :   {
                        type: ElementType;
                        value: ToJSONSafePrismarineNBT<ElementValues>;
                    };
            }
        : T extends readonly unknown[] ?
            {
                [K in keyof T]: ToJSONSafePrismarineNBT<T[K]>;
            }
        : T extends object ?
            {
                [K in keyof T]: ToJSONSafePrismarineNBT<T[K]>;
            }
        :   T;

    /**
     * Converts a JSON serializable Prismarine-NBT data type to a Prismarine-NBT data type.
     *
     * @see {@link fromJSONSafePrismarineNBT}
     */
    export type FromJSONSafePrismarineNBT<T> =
        T extends { type: "float"; value: infer V } ?
            Omit<T, "value"> & {
                value: FromJSONSafeFloatOrDoubleValue<V>;
            }
        : T extends { type: "double"; value: infer V } ?
            Omit<T, "value"> & {
                value: FromJSONSafeFloatOrDoubleValue<V>;
            }
        : T extends (
            {
                type: "list";
                value: {
                    type: infer ElementType;
                    value: infer ElementValues;
                };
            }
        ) ?
            Omit<T, "value"> & {
                value: ElementType extends "float" | "double" ?
                    {
                        type: ElementType;
                        value: FromJSONSafeListValue<ElementValues>;
                    }
                :   {
                        type: ElementType;
                        value: FromJSONSafePrismarineNBT<ElementValues>;
                    };
            }
        : T extends readonly unknown[] ?
            {
                [K in keyof T]: FromJSONSafePrismarineNBT<T[K]>;
            }
        : T extends object ?
            {
                [K in keyof T]: FromJSONSafePrismarineNBT<T[K]>;
            }
        :   T;
}

const NBT_NAN = "NaN";
const NBT_POSITIVE_INFINITY = "Infinity";
const NBT_NEGATIVE_INFINITY = "-Infinity";

function encodeSpecialNumber(value: NBT.Tags[NBT.TagType]["value"] | undefined, dataType: NBT.TagType | "end"): unknown {
    switch (dataType) {
        case NBT.TagType.Float:
        case NBT.TagType.Double:
            if (typeof value !== "number") return value;
            if (Number.isNaN(value)) return NBT_NAN;
            if (value === Infinity) return NBT_POSITIVE_INFINITY;
            if (value === -Infinity) return NBT_NEGATIVE_INFINITY;
            return value;
        case "end":
            if (value === undefined) return null;
            return value;
        default:
            return value;
    }
}

function decodeSpecialNumber(
    value: JSONSafePrismarineNBT.Tags[JSONSafePrismarineNBT.JSONSafePrismarineNBTTagType]["value"],
    dataType: JSONSafePrismarineNBT.JSONSafePrismarineNBTTagType
): unknown {
    switch (dataType) {
        case NBT.TagType.Float:
        case NBT.TagType.Double:
            switch (value) {
                case NBT_NAN:
                    return NaN;
                case NBT_POSITIVE_INFINITY:
                    return Infinity;
                case NBT_NEGATIVE_INFINITY:
                    return -Infinity;
                default:
                    return value;
            }
        case "end":
            if (value === null) return undefined;
            return value;
        default:
            return value;
    }
}

// IDEA: Add bigint support.

// TODO: See if the to and from functions can throw errors with certain non-Prismarine-NBT values.

/**
 * Converts Prismarine-NBT data into a JSON serializable format, preventing things like `NaN`, `Infinity`, and `-Infinity` from being lost.
 *
 * NOTE: This does not touch `-0`, you will still need a JSON stringifier that preserves `-0`.
 *
 * @template TagType The type of Prismarine-NBT data to convert.
 *
 * @param nbt The Prismarine-NBT data to convert.
 * @returns The resulting JSON serializable Prismarine-NBT data.
 */
export function toJSONSafePrismarineNBT<TagType extends NBT.TagType | `${NBT.TagType}`>(
    nbt: NBT.Tags[Extract<NBT.TagType, TagType>] & { type: TagType | `${TagType}` }
): JSONSafePrismarineNBT.Tags[Extract<JSONSafePrismarineNBT.JSONSafePrismarineNBTTagType, TagType>];
/**
 * Converts Prismarine-NBT data into a JSON serializable format, preventing things like `NaN`, `Infinity`, and `-Infinity` from being lost.
 *
 * NOTE: This does not touch `-0`, you will still need a JSON stringifier that preserves `-0`.
 *
 * @template T The type of Prismarine-NBT data to convert.
 *
 * @param nbt The Prismarine-NBT data to convert.
 * @param preserveDataTypeInformation Putting a `1` or a `true` here causes the returned type to preserve the structure of the passed NBT data, this has no effect at runtime.
 * @returns The resulting JSON serializable Prismarine-NBT data.
 */
export function toJSONSafePrismarineNBT<T extends NBT.Tags[NBT.TagType]>(
    nbt: T,
    preserveDataTypeInformation: 1 | true
): JSONSafePrismarineNBT.ToJSONSafePrismarineNBT<T>;
/**
 * Converts Prismarine-NBT data into a JSON serializable format, preventing things like `NaN`, `Infinity`, and `-Infinity` from being lost.
 *
 * NOTE: This does not touch `-0`, you will still need a JSON stringifier that preserves `-0`.
 *
 * @template T The type of Prismarine-NBT data to convert.
 *
 * @param nbt The Prismarine-NBT data to convert.
 * @returns The resulting JSON serializable Prismarine-NBT data.
 */
export function toJSONSafePrismarineNBT<T extends NBT.Tags[NBT.TagType]>(nbt: T): JSONSafePrismarineNBT.ToJSONSafePrismarineNBT<T> {
    return transformNBT(nbt, encodeSpecialNumber);
}

/**
 * Converts JSON serializable Prismarine-NBT data back to regular Prismarine-NBT data, restoring things like `NaN`, `Infinity`, and `-Infinity`.
 *
 * @template TagType The tag type of the JSON serializable Prismarine-NBT data to convert.
 *
 * @param nbt The JSON serializable Prismarine-NBT data to convert.
 * @returns The resulting Prismarine-NBT data.
 */
export function fromJSONSafePrismarineNBT<
    TagType extends JSONSafePrismarineNBT.JSONSafePrismarineNBTTagType | `${JSONSafePrismarineNBT.JSONSafePrismarineNBTTagType}`,
>(
    nbt: JSONSafePrismarineNBT.Tags[Extract<JSONSafePrismarineNBT.JSONSafePrismarineNBTTagType, TagType>] & { type: TagType | `${TagType}` }
): NBT.Tags[Extract<NBT.TagType, TagType> /* TEMP: This Extract is just until the end tag type is added to the Prismarine-NBT type definitions. */];
/**
 * Converts JSON serializable Prismarine-NBT data back to regular Prismarine-NBT data, restoring things like `NaN`, `Infinity`, and `-Infinity`.
 *
 * @template T The type of the JSON serializable Prismarine-NBT data to convert.
 *
 * @param nbt The JSON serializable Prismarine-NBT data to convert.
 * @param preserveDataTypeInformation Putting a `1` or a `true` here causes the returned type to preserve the structure of the passed NBT data, this has no effect at runtime.
 * @returns The resulting Prismarine-NBT data.
 */
export function fromJSONSafePrismarineNBT<T extends JSONSafePrismarineNBT.Tags[JSONSafePrismarineNBT.JSONSafePrismarineNBTTagType]>(
    nbt: T,
    preserveDataTypeInformation: 1 | true
): JSONSafePrismarineNBT.FromJSONSafePrismarineNBT<T>;
/**
 * Converts JSON serializable Prismarine-NBT data back to regular Prismarine-NBT data, restoring things like `NaN`, `Infinity`, and `-Infinity`.
 *
 * @template T The type of the JSON serializable Prismarine-NBT data to convert.
 *
 * @param nbt The JSON serializable Prismarine-NBT data to convert.
 * @returns The resulting Prismarine-NBT data.
 */
export function fromJSONSafePrismarineNBT<T extends JSONSafePrismarineNBT.Tags[JSONSafePrismarineNBT.JSONSafePrismarineNBTTagType]>(
    nbt: T
): JSONSafePrismarineNBT.FromJSONSafePrismarineNBT<T> {
    return transformNBT(nbt, decodeSpecialNumber);
}

function transformNBT(
    node: NBT.Tags[NBT.TagType] | JSONSafePrismarineNBT.Tags[JSONSafePrismarineNBT.JSONSafePrismarineNBTTagType] | null | undefined,
    transform:
        | ((
              value: JSONSafePrismarineNBT.Tags[JSONSafePrismarineNBT.JSONSafePrismarineNBTTagType]["value"],
              dataType: JSONSafePrismarineNBT.JSONSafePrismarineNBTTagType
          ) => unknown)
        | ((value: NBT.Tags[NBT.TagType]["value"] | undefined, dataType: NBT.TagType | "end") => unknown)
): any {
    if (!node || typeof node !== "object") return node;

    switch (node.type) {
        case NBT.TagType.Float:
        case NBT.TagType.Double:
            return {
                ...node,
                value: transform(node.value, node.type as Extract<NBT.TagType, typeof node.type>),
            };

        case NBT.TagType.Compound:
            return {
                ...node,
                value: Object.fromEntries(Object.entries(node.value).map(([key, child]) => [key, transformNBT(child, transform)])),
            };

        case NBT.TagType.List:
            return {
                ...node,
                value: transformList(node.value, transform),
            };

        default:
            return node;
    }
}

function transformHeadlessNBT(
    node: NBT.Tags[NBT.TagType]["value"] | JSONSafePrismarineNBT.Tags[JSONSafePrismarineNBT.JSONSafePrismarineNBTTagType]["value"],
    dataType: NBT.TagType | "end" | JSONSafePrismarineNBT.JSONSafePrismarineNBTTagType,
    transform:
        | ((
              value: JSONSafePrismarineNBT.Tags[JSONSafePrismarineNBT.JSONSafePrismarineNBTTagType]["value"],
              dataType: JSONSafePrismarineNBT.JSONSafePrismarineNBTTagType
          ) => unknown)
        | ((value: NBT.Tags[NBT.TagType]["value"] | undefined, dataType: NBT.TagType | "end") => unknown)
): any {
    type NodeTypeForDataType<T extends NBT.TagType | "end" | JSONSafePrismarineNBT.JSONSafePrismarineNBTTagType> =
        | NBT.Tags[Extract<NBT.TagType, T>]["value"]
        | JSONSafePrismarineNBT.Tags[Extract<JSONSafePrismarineNBT.JSONSafePrismarineNBTTagType, T>]["value"];

    function fakeAssertNodeIsValidForDataType<T extends NBT.TagType | "end" | JSONSafePrismarineNBT.JSONSafePrismarineNBTTagType>(
        value: unknown
    ): asserts value is NodeTypeForDataType<T> {
        void value;
    }

    switch (dataType) {
        case NBT.TagType.Float:
        case NBT.TagType.Double:
            fakeAssertNodeIsValidForDataType<typeof dataType>(node);
            // if (typeof node !== "number"  && typeof node !== "string") return node;
            return transform(node, dataType);

        case NBT.TagType.Compound:
            fakeAssertNodeIsValidForDataType<typeof dataType>(node);
            return Object.fromEntries(Object.entries(node).map(([key, child]) => [key, transformNBT(child, transform)]));

        case NBT.TagType.List:
            fakeAssertNodeIsValidForDataType<typeof dataType>(node);
            return transformList(node, transform);

        default:
            return node;
    }
}

function transformList(
    list: NBT.List<NBT.TagType>["value"] | JSONSafePrismarineNBT.List<JSONSafePrismarineNBT.JSONSafePrismarineNBTTagType>["value"],
    transform:
        | ((
              value: JSONSafePrismarineNBT.Tags[JSONSafePrismarineNBT.JSONSafePrismarineNBTTagType]["value"],
              dataType: JSONSafePrismarineNBT.JSONSafePrismarineNBTTagType
          ) => unknown)
        | ((value: NBT.Tags[NBT.TagType]["value"] | undefined, dataType: NBT.TagType | "end") => unknown)
): any {
    function fakeAssertNodeIsValidForDataType<T extends NBT.TagType | "end" | JSONSafePrismarineNBT.JSONSafePrismarineNBTTagType>(
        value: unknown
    ): asserts value is
        | NBT.List<Extract<NBT.TagType, T>>["value"]
        | JSONSafePrismarineNBT.List<Extract<JSONSafePrismarineNBT.JSONSafePrismarineNBTTagType, T>>["value"] {
        void value;
    }

    switch (list.type) {
        case NBT.TagType.Float:
        case NBT.TagType.Double:
            fakeAssertNodeIsValidForDataType<Extract<NBT.TagType | "end" | JSONSafePrismarineNBT.JSONSafePrismarineNBTTagType, typeof list.type>>(list);
            return {
                ...list,
                value: list.value.map((v) =>
                    transform(v, list.type as Extract<NBT.TagType | "end" | JSONSafePrismarineNBT.JSONSafePrismarineNBTTagType, typeof list.type>)
                ),
            };

        case NBT.TagType.List:
        case NBT.TagType.Compound:
            fakeAssertNodeIsValidForDataType<Extract<NBT.TagType | "end" | JSONSafePrismarineNBT.JSONSafePrismarineNBTTagType, typeof list.type>>(list);
            return {
                ...list,
                value: list.value.map((child) =>
                    transformHeadlessNBT(
                        child,
                        list.type as Extract<NBT.TagType | "end" | JSONSafePrismarineNBT.JSONSafePrismarineNBTTagType, typeof list.type>,
                        transform
                    )
                ),
            };

        default:
            return list;
    }
}
