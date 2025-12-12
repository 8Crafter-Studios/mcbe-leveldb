export * from "./LevelUtils.ts";
export * from "./DBUtils.ts";
export * from "./SNBTUtils.ts";
export * from "./nbtSchemas.ts";
export { default as BiomeData } from "./__biome_data__.ts";

declare module "prismarine-nbt" {
    export function list<T extends string, K extends { type: T; value?: any[] }>(
        value?: K
    ): { type: `${TagType.List}`; value: { type: T | "end"; value: K["value"] extends undefined ? [] : K["value"] } };
    export function byte<T extends number>(val: T): { type: `${TagType.Byte}`; value: T };
    export function long<T extends number | [number, number] | BigInt>(value: T): { type: `${TagType.Long}`; value: T };
    export function longArray<T extends number[] | [high: number, low: number][] | BigInt[]>(value: T): { type: `${TagType.LongArray}`; value: T };
}
