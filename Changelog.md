# v1.9.0

## Additions

-   Added the `LevelChunkMetaDataDictionary` NBT schema.
-   Added the `Digest` NBT schema.

## Changes

-   Changed the custom data structure of the `Digest` content type.

## Fixes

-   `prettyPrintSNBT` no longer inserts newlines when the `indent` option is set to `0`. 

# v1.8.0

## Critical Fixes

-   Fixed a bug that has been around since the first version of this module where `MetaDataHash` keys were detected as `BlendingBiomeHeight` keys, `GeneratedPreCavesAndCliffsBlending` keys were detected as `MetaDataHash` keys, and `BlendingBiomeHeight` keys were detected as `GeneratedPreCavesAndCliffsBlending` keys.

## Additions

-   Added a custom serializer and parser for the `LevelChunkMetaDataDictionary` content type.
-   Added the `BiomeIdsTable` content type.
-   Added the `BiomeIdsTable` NBT schema.
-   Added the `VillageRaid` content type.
-   Added the `VillageRaid` NBT schema.
-   Added the `PositionTrackingDB` content type.
-   Added the `PositionTrackingLastId` content type.
-   Added the `GenerationSeed` content type.
-   Added the `LegacyDimension` content type.
-   Added the `MVillages` content type.
-   Added the `Villages` content type.
-   Added the `LevelSpawnWasFixed` content type.
-   Added a default value to the following properties of the following NBT schemas:
    -   `Map`
        -   `unlimitedTracking`
        -   `scale`
    -   `Scoreboard`
        -   `DisplayObjectives[number].SortOrder`
    -   `LevelDat`
        -   `functioncommandlimit`
        -   `maxcommandchainlength`
        -   `prid`
    -   `ActorPrefix`
        -   `Color`
        -   `Color2`
        -   `MarkVariant`
        -   `OwnerNew`
        -   `SkinID`
        -   `Strength`
        -   `StrengthMax`
        -   `Variant`
    -   `Entity_ItemEntity`
        -   `OwnerID`
    -   `Block_Piston`
        -   `NewState`
-   Added enums to the following non-boolean properties of the following NBT schemas (added enums on boolean properties are not being listed in the changelog):
    -   `Scoreboard`
        -   `DisplayObjectives[number].SortOrder`
        -   `Objectives[number].Criteria`
-   Added enums to many boolean NBT schema properties.
-   Added descriptions and titles to many NBT schema properties.
-   Added the `verticalFlySpeed` property to the `abilities` property of the `LevelDat` NBT schema.
-   Added the `isRandomSeedAllowed` property to the `LevelDat` NBT schema.
-   Added the `projectilescanbreakblocks` property to the `LevelDat` NBT schema.
-   Added the `showrecipemessages` property to the `LevelDat` NBT schema.
-   Added the `tntexplosiondropdecay` property to the `LevelDat` NBT schema.
-   Documented the `InventoryVersion` property of the `LevelDat` NBT schema.
-   Added more information to the documentation of the `texturePacksRequired` property of the `LevelDat` NBT schema.

## Changes

-   Documentation refactor to replace `Unknown.` in documentation entries of NBT schemas with one of:
    -   `UNKNOWN.`: If the schema for that tag is incomplete or completely empty as it is unknown what properties it has.
    -   `UNDOCUMENTED.`: If the tag with that description has not been documented yet or it is unknown what it does.
-   Updated the `BiomeData` from `v1.21.80` to `v1.21.110` (the update has zero actual changes).
-   Many properties of the `VillageDwellers`, `VillageInfo`, `VillagePOI`, and `VillagePlayers` NBT schemas are now marked as required.

## Fixes

-   Fixed a bug where the `list[number].id` property of the `BiomeData` NBT schema was of type `byte` instead of `short`.
-   Fixed an incorrect TypeScript type version of the `Scoreboard` NBT schema.
-   Fixed a bug where empty object types in the TypeScript type versions of NBT schemas were generated as `{}` instead of `object`.
-   Fixed a bug where a few optional properties of the `VibrationListener` property of the `Entity_Allay` NBT schema were incorrectly marked as required.
-   Fixed an incorrect NBT schema for the `decorations[number].key` property of the `Map` NBT schema.
-   Removed a `minimum` value from the list items of the `structure_world_origin` property of the `StructureTemplate` NBT schema that should not have been there.
-   Fixed the descriptions of the list items of the `structure_world_origin` property of the `StructureTemplate` NBT schema.
-   Fixed an incorrect NBT schema for the `structure.palette.default.block_position_data` property of the `StructureTemplate` NBT schema.
-   Fixed incorrect NBT schemas for following properties of the `LevelDat` NBT schema:
    -   `editorWorldType`
    -   `eduOffer`
    -   `functioncommandlimit`
    -   `spawnradius`
-   Fixed a bug where the `LevelDat` NBT schema had the `limitedWorldDepth` property incorrectly capitalized as `LimitedWorldDepth`.
-   Fixed a bug where the `LevelDat` NBT schema had the `limitedWorldWidth` property incorrectly capitalized as `LimitedWorldWidth`.
-   Fixed an incorrectly structured default value for the `LevelName` property of the `LevelDat` NBT schema.
-   Fixed incorrect documentation for the `NetworkVersion` property of the `LevelDat` NBT schema.
-   Fixed a bug where a the following optional properties of the `ActorPrefix` NBT schema were incorrectly marked as required:
    -   `CustomNameVisible`
    -   `Fire`
    -   `Persistent`
-   Minor whitespace fixes with some instances of the following in the documentation:
    -   `*needs testing*`
    -   `*info needed*`

# v1.7.3

## Fixes

-   Fixed a bug where the `LevelDat` NBT schema had the `isSingleUseWorld` property incorrectly capitalized as `IsSingleUseWorld`.

# v1.7.2

## Fixes

-   Fixed an incorrect `Entries` field in the NBT schema for the `Scoreboard` content type.

# v1.7.1

## Fixes

-   Fixed an incorrect NBT schema for the `Scoreboard` content type.

# v1.7.0

## Additions

-   Added a custom serializer and parser for the `Digest` content type.

# v1.6.0

## Additions

-   Added the `ChunkLoadedRequest` content type.
-   Added the `ChunkLoadedRequest` NBT schema.

## Fixes

-   Fixed a bug where the enum descriptions of the NBT schemas and NBT schema types for boolean byte values had `1` mapped to `false` and `0` mapped to `true`.
-   Fixed a bug where the following properties were missing from the type version of the NBT schema for `LevelDat`:
    -   `editorWorldType`
    -   `HasUncompleteWorldFileOnDisk`

# v1.5.7/v1.5.10

## Critical Fixes

-   Overloaded several misconfigured types in the [`prismarine-nbt`](https://www.npmjs.com/package/prismarine-nbt) package to fix several errors.

# v1.5.6

## Changes

-   Updated the `LevelDat` NBT schema to include the following properties:
    -   `editorWorldType`
    -   `HasUncompleteWorldFileOnDisk`
    -   `locatorbar`

# v1.5.4

## Critical Fixes

-   Fixed a bug where the custom parser for the `LevelDat` content type returned an empty compound instead of the expected NBT data.

# v1.5.3

## Fixes

-   Fixed a bug where the format type of the `HardcodedSpawners` content type was `NBT` instead of `unknown`.
-   Fixed a bug where the `type` property of a few of the content types was undocumented.

## Development Changes

-   JSON files generated by the test scripts now use the `CRLF` line ending instead of the `LF` line ending.

# v1.5.2

## Additions

-   Added two new NBT schemas:
    -   `PendingTicks`
    -   `RandomTicks`

# v1.5.1

## Fixes

-   Reverted the following content types back to use the regular NBT format type instead of a custom parser and serializer due to them actually being a single NBT compound and not a list of them (contrary to what the Minecraft Wiki says):
    -   `PendingTicks`
    -   `RandomTicks`

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
-   Added a custom serializer and parser for the `LevelDat` content type as it was actually not just pure NBT, as there was 8 bytes of important extra data before the NBT data.
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
