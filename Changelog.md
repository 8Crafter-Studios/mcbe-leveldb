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

-   Replaced the `leveldb-zlib` package with the `@8crafter/leveldb-zlib` package.

# v1.1.0

## Additions

-   Added a Changelog file.
-   Added two new schemas:
    -   `SubChunkPrefix`
    -   `SubChunkPrefixLayer`
-   Added some more schema aliases. 

## Fixes

-   Fixed many bugs where the NBT schema to TypeScript type converter, and used it to fix some major issues with the types in the `NBTSchemas.NBTSchemaTypes` namespace.

## Development Changes

-   Updated the list of unwanted VSCode extension recommendations.

# v1.0.1

## Additions

-   Added a README file.

# v1.0.0

-   Initial Release