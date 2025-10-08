# v1.5.0

## Additions

-   Added custom serializers and parsers for the following content types:
    -   `BlockEntity`
    -   `Entity`
    -   `PendingTicks`
    -   `RandomTicks`

## Changes

-   Marked the following content types as deprecated:
    -   `FlatWorldLayers`
    -   `Entity`

# v1.4.0

## Critical fixes

-   Fixed a bug where if the object passed into the `indices` parameter of the `generateChunkKeyFromIndices` function had a `subChunkIndex` property with a value of `undefined`, then the function would return the chunk key with the sub-chunk index set to `0` instead of not including the sub-chunk index in the key, which would result in incorrect chunk keys.

## Additions

-   Added the format type for the following content types:
    -   `ForcedWorldCorruption`
-   Added default values for the following content types:
    -   `Version`
    -   `FinalizedState`
    -   `LevelDat`
    -   `DynamicProperties`
    -   `ForcedWorldCorruption`
-   Added the `rawFileExtension` property to the following content types:
    -   `StructureTemplate`
    -   `LevelDat`
-   Added a custom serializer and parser for the `LevelDat` content types as it was actually not just pure NBT, as there was 8 bytes of important extra data before the NBT data.
-   Added/Updated documentation for several content types.
-   Added the `DynamicProperties` NBT schema.

## Changes

-   Changed the return type of the `serialize` method for the `Data3D` and `SubChunkPrefix` content types from `Buffer<ArrayBufferLike>` to `Buffer<ArrayBuffer>`.
-   Changed many types to use the more explicit `Buffer<ArrayBuffer>` type instead of `Buffer` (i.e. `Buffer<ArrayBufferLike>`).
-   The properties of the `EntryContentTypeFormatData` type are now read-only.

## Fixes

-   Fixed a bug where the `getChunkKeyIndices` function return an object containing a `subChunkIndex` property with a value of `undefined` when the key had no sub-chunk index, instead of not including that property at all.

## Performance Improvements

-   Performance improvements to the `getKeysOfTypes` function when passing buffers to it (it now only gets the content type of each key once instead of twice).

# v1.3.4

## Critical Fixes

-   Fixed a bug where the SNBT stringifier did not escape control characters (`\x00-\x1F`), characters in the `\uD800-\uDFFF` range, or characters `\u2028` or `\u2029`.

# v1.3.3

## Fixes

-   Fixed a bug where the `getKeyDisplayName` function did not include the sub-chunk index in the display name if it was 0.

# v1.3.2

## Critical Fixes

-   Fixed the parser and serializer for the `Data3D` content type.

# v1.3.1

## Fixes

-   Fixed the `StructureTemplate` NBT schema.

# v1.3.0

## Additions

-   Added the `generateChunkKeyFromIndices` function.
-   Added the `getIntFromChunkKeyType` function.
-   Added the `DBChunkKeyEntryContentType` type.

# v1.2.4

## Fixes

-   The `getChunkKeyIndices` function now correctly converts the sub-chunk index to a signed integer instead of an unsigned integer.

# v1.2.3

## Fixes

-   Fixed the `chunkBlockIndexToOffset` and `offsetToChunkBlockIndex` mixing up the Y and Z axes.

# v1.2.2

## Changes

-   Updated the `TickingArea` NBT schema.

# v1.2.1

## Additions

-   Documented a lot more of the module.

## Fixes

-   Fixed the `Entity` NBT schemas and the `world_policies` property of the `LevelDat` NBT schema.

# v1.2.0

## Changes

-   Replaced the [`leveldb-zlib`](https://www.npmjs.com/package/leveldb-zlib) package with the [`@8crafter/leveldb-zlib`](https://www.npmjs.com/package/@8crafter/leveldb-zlib) package.

# v1.1.0

## Additions

-   Added a Changelog file.
-   Added two new NBT schemas:
    -   `SubChunkPrefix`
    -   `SubChunkPrefixLayer`
-   Added some more NBT schema aliases.

## Fixes

-   Fixed many bugs where the NBT schema to TypeScript type converter, and used it to fix some major issues with the types in the `NBTSchemas.NBTSchemaTypes` namespace.

## Development Changes

-   Updated the list of unwanted VSCode extension recommendations.

# v1.0.1

## Additions

-   Added a README file.

# v1.0.0

-   Initial Release
