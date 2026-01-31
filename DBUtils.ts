import type { LevelDB } from "@8crafter/leveldb-zlib";
import { getContentTypeFromDBKey, type DBEntryContentType } from "./LevelUtils.ts";
import NBT from "prismarine-nbt";
import { JSONB } from "./utils/JSONB.ts";

// TO-DO: Make an abstract class version of the LevelDB class to use as the type of the db parameter.

/**
 * Gets the keys from the LevelDB with a specific content type.
 *
 * @template T The content type to look for.
 * @param db The LevelDB. Should match the type of the {@link LevelDB} class from the {@link https://www.npmjs.com/package/@8crafter/leveldb-zlib | @8crafter/leveldb-zlib} package. It does not have to be the one from that package, as long as the types match.
 * @param type The {@link DBEntryContentType | content type} to look for.
 * @returns The keys from the LevelDB with the specified content type, the keys are in Buffer format, this is because some keys contain binary data like chunk indices.
 */
export async function getKeysOfType<T extends DBEntryContentType>(db: LevelDB, type: T): Promise<Buffer<ArrayBuffer>[]>;
/**
 * Gets the keys from the list of LevelDB keys with a specific content type.
 *
 * @template T The content type to look for.
 * @template TArrayBuffer The type of the buffers.
 * @param dbKeys The LevelDB keys. Should be an array of Buffers.
 * @param type The {@link DBEntryContentType | content type} to look for.
 * @returns The keys from the provided LevelDB keys array with the specified content type, the keys are in Buffer format, this is because some keys contain binary data like chunk indices.
 */
export function getKeysOfType<T extends DBEntryContentType, TArrayBuffer extends ArrayBufferLike = ArrayBufferLike>(
    dbKeys: Buffer<TArrayBuffer>[],
    type: T
): Buffer<TArrayBuffer>[];
export function getKeysOfType<T extends DBEntryContentType>(dbOrDBKeys: LevelDB | Buffer[], type: T): Promise<Buffer<ArrayBuffer>[]> | Buffer[] {
    if (Array.isArray(dbOrDBKeys)) return dbOrDBKeys.filter((key: Buffer): boolean => getContentTypeFromDBKey(key) === type);
    return new Promise(
        (resolve: (value: Buffer<ArrayBuffer>[]) => void): void =>
            void (async (): Promise<void> => {
                const foundKeys: Buffer<ArrayBuffer>[] = [];
                for await (const [rawKey, _value] of dbOrDBKeys.getIterator({ keys: true, keyAsBuffer: true, values: false })) {
                    if (getContentTypeFromDBKey(rawKey) === type) foundKeys.push(rawKey);
                }
                resolve(foundKeys);
            })()
    );
}

/**
 * Gets the keys from the LevelDB with one of the specified content types.
 *
 * @template T The content types to look for.
 * @param db The LevelDB. Should match the type of the {@link LevelDB} class from the {@link https://www.npmjs.com/package/@8crafter/leveldb-zlib | @8crafter/leveldb-zlib} package. It does not have to be the one from that package, as long as the types match.
 * @param types The {@link DBEntryContentType | content types} to look for.
 * @returns An object mapping each of the specified content types to the keys from the LevelDB with that content type, the keys are in Buffer format, this is because some keys contain binary data like chunk indices.
 */
export async function getKeysOfTypes<T extends DBEntryContentType[] | readonly DBEntryContentType[]>(
    db: LevelDB,
    types: T
): Promise<{ [key in T[number]]: Buffer<ArrayBuffer>[] }>;
/**
 * Gets the keys from the list of LevelDB keys with one of the specified content types.
 *
 * @template T The content types to look for.
 * @template TArrayBuffer The type of the buffers.
 * @param dbKeys The LevelDB keys. Should be an array of Buffers.
 * @param types The {@link DBEntryContentType | content types} to look for.
 * @returns An object mapping each of the specified content types to the keys from the provided LevelDB keys array with that content type, the keys are in Buffer format, this is because some keys contain binary data like chunk indices.
 */
export function getKeysOfTypes<T extends DBEntryContentType[] | readonly DBEntryContentType[], TArrayBuffer extends ArrayBufferLike>(
    dbKeys: Buffer<TArrayBuffer>[],
    types: T
): { [key in T[number]]: Buffer<TArrayBuffer>[] };
export function getKeysOfTypes<T extends DBEntryContentType[] | readonly DBEntryContentType[]>(
    dbOrDBKeys: LevelDB | Buffer[],
    types: T
): Promise<{ [key in T[number]]: Buffer<ArrayBuffer>[] }> | { [key in T[number]]: Buffer[] } {
    const results = {} as { [key in T[number]]: Buffer<any>[] };
    types.forEach((contentType: T[number]): void => {
        results[contentType] = [];
    });
    if (Array.isArray(dbOrDBKeys)) {
        for (const key of dbOrDBKeys) {
            const contentType: DBEntryContentType = getContentTypeFromDBKey(key);
            if (types.includes(contentType)) results[contentType as T[number]].push(key);
        }
        return results;
    }
    return new Promise(
        (resolve: (value: { [key in T[number]]: Buffer<ArrayBuffer>[] }) => void): void =>
            void (async (): Promise<void> => {
                for await (const [rawKey, _value] of dbOrDBKeys.getIterator({ keys: true, keyAsBuffer: true, values: false })) {
                    const contentType: DBEntryContentType = getContentTypeFromDBKey(rawKey);
                    if (types.includes(contentType)) results[contentType as T[number]].push(rawKey);
                }
                resolve(results);
            })()
    );
}

/**
 * Gets a player's name from their UUID.
 *
 * Only works if the player's name was stored in an add-on's dynamic properties with their ID linked to it, and it only works for a hardcoded list of add-ons,
 * if you have your own add-on that you would like this to be able to read the player's names from, {@link https://www.8crafter.com/main/contact | contact 8Crafter},
 * or make a pull request.
 *
 * @param db The LevelDB. Should match the type of the {@link LevelDB} class from the {@link https://www.npmjs.com/package/@8crafter/leveldb-zlib | @8crafter/leveldb-zlib} package. It does not have to be the one from that package, as long as the types match.
 * @param uuid The UUID of the play to get the name of.
 * @returns The name of the player, or `null` if the player's name cannot be found or the world has no dynamic properties.
 *
 * @throws {any} If there was an error reading the DynamicProperties from the DB.
 */
export async function getPlayerNameFromUUID(db: LevelDB, uuid: string | bigint): Promise<string | null> {
    const dynamicProperties: NBT.NBT | null = await db
        .get("DynamicProperties")
        .then((data: Buffer | null): Promise<NBT.NBT> | null =>
            data ? NBT.parse(data!).then((data: { parsed: NBT.NBT; type: NBT.NBTFormat; metadata: NBT.Metadata }): NBT.NBT => data.parsed) : null
        );
    if (!dynamicProperties) return null;
    return getPlayerNameFromUUIDSync(dynamicProperties, uuid);
}

/**
 * Gets a player's name from their UUID using the provided dynamic properties data.
 *
 * Only works if the player's name was stored in an add-on's dynamic properties with their ID linked to it, and it only works for a hardcoded list of add-ons,
 * if you have your own add-on that you would like this to be able to read the player's names from, {@link https://www.8crafter.com/main/contact | contact 8Crafter},
 * or make a pull request.
 *
 * @param dynamicProperties The dynamic properties data, should be the data from the `DynamicProperties` LevelDB key.
 * @param uuid The UUID of the play to get the name of.
 * @returns The name of the player, or `null` if the player's name cannot be found .
 */
export function getPlayerNameFromUUIDSync(dynamicProperties: NBT.NBT, uuid: string | bigint): string | null {
    const UUIDString: string = uuid.toString();
    for (const parser of playerUUIDToNameDynamicPropertyParsers) {
        const name: string | null = parser(dynamicProperties, UUIDString);
        if (name !== null) return name;
    }
    return null;
}

/**
 * A function that can be used to get a player's name from their UUID from the dynamic properties.
 */
interface PlayerUUIDToNameDynamicPropertyParser {
    /**
     * A function that can be used to get a player's name from their UUID from the dynamic properties.
     *
     * @param dynamicProperties The dynamic properties data, should be the data from the `DynamicProperties` LevelDB key.
     * @param uuid The UUID of the player to get the name of.
     * @returns The name of the player, or `null` if the player's name cannot be found.
     */
    (dynamicProperties: NBT.NBT, uuid: string): string | null;
}

/**
 * The list of functions that can be used to get a player's name from their UUID from the dynamic properties.
 *
 * These will be called in order until one of them returns a non-null value.
 */
const playerUUIDToNameDynamicPropertyParsers: PlayerUUIDToNameDynamicPropertyParser[] = [
    function parse8CraftersServerUtilities(dynamicProperties: NBT.NBT, uuid: string): string | null {
        const addOnUUIDs: string[] = [
            // Internal development version
            "53170125-3e79-4659-9bba-e49eb90b6ded",
            // Release version
            "53170125-3e79-4659-9bba-e49eb90b6dea",
        ];
        for (const addOnUUID of addOnUUIDs) {
            const addonDynamicProperties: NBT.Compound["value"] | null =
                dynamicProperties.value[addOnUUID]?.type === "compound" ? dynamicProperties.value[addOnUUID].value : null;
            if (!addonDynamicProperties) continue;
            for (const key in addonDynamicProperties) {
                if (key !== `player:${uuid}`) continue;
                const dynamicPropertyValue: NBT.Byte | NBT.Double | NBT.String | NBT.List<NBT.TagType.Float> = addonDynamicProperties[key]! as any;
                if (dynamicPropertyValue.type !== "string") continue;
                try {
                    const data: any = JSONB.parse(dynamicPropertyValue.value);
                    if (typeof data === "object" && data !== null && typeof data.name === "string") return data.name;
                } catch (e) {
                    continue;
                }
            }
        }
        return null;
    },
];
