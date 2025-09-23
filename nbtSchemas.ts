import type { DBEntryContentType } from "./LevelUtils.ts";
import * as NBT from "prismarine-nbt";
import { toLongParts } from "./SNBTUtils.ts";
import type { LooseAutocomplete, MergeObjectTypes } from "./types.js";

export namespace NBTSchemas {
    function defineNBTSchemasMapping<
        T extends Record<string, NBTSchema | NBTSchemaFragment>,
        M extends {
            [key in string]: key extends keyof T
                ? never
                : { key: keyof T; title: LooseAutocomplete<"">; description: LooseAutocomplete<""> } | { key: keyof T };
        }
    >(
        schemas: T,
        mappings: M
    ): T & {
        readonly [K in keyof M]: Omit<T[M[K]["key"]], "description"> &
            (Extract<M[K], { description: string }>["description"] extends string
                ? { description: Extract<M[K], { description: string }>["description"] }
                : { description: T[M[K]["key"]]["description"] }) &
            (Extract<M[K], { title: string }> extends never
                ? { title: T[M[K]["key"]]["title"] }
                : Extract<M[K], { title: string }>["title"] extends string
                ? { title: Extract<M[K], { title: string }>["title"] }
                : { title: T[M[K]["key"]]["title"] }) & {
                $aliasOf: M[K]["key"];
            };
    } {
        return {
            ...schemas,
            ...(Object.fromEntries(
                Object.entries(mappings).map(([k, v]) => [
                    k,
                    {
                        ...schemas[v.key],
                        id: k,
                        description: "description" in v && v.description ? v.description : schemas[v.key]!.description,
                        $aliasOf: v.key,
                    },
                ])
            ) as unknown as {
                readonly [K in keyof M]: Omit<T[M[K]["key"]], "description"> &
                    (Extract<M[K], { description: string }>["description"] extends string
                        ? { description: Extract<M[K], { description: string }>["description"] }
                        : { description: T[M[K]["key"]]["description"] }) &
                    (Extract<M[K], { title: string }> extends never
                        ? { title: T[M[K]["key"]]["title"] }
                        : Extract<M[K], { title: string }>["title"] extends string
                        ? { title: Extract<M[K], { title: string }>["title"] }
                        : { title: T[M[K]["key"]]["title"] }) & {
                        $aliasOf: M[K]["key"];
                    };
            }),
        };
    }
    export const nbtSchemas = defineNBTSchemasMapping(
        {
            //#region Top-Level Schemas
            ActorPrefix: {
                id: "ActorPrefix",
                title: "The ActorPrefix schema.",
                description: "All entities share this base.",
                type: "compound",
                required: [
                    "Chested",
                    "Color",
                    "Color2",
                    "CustomNameVisible",
                    "FallDistance",
                    "Fire",
                    "identifier",
                    "internalComponents",
                    "Invulnerable",
                    "IsAngry",
                    "IsAutonomous",
                    "IsBaby",
                    "IsEating",
                    "IsGliding",
                    "IsGlobal",
                    "IsIllagerCaptain",
                    "IsOrphaned",
                    "IsOutOfControl",
                    "IsRoaring",
                    "IsScared",
                    "IsStunned",
                    "IsSwimming",
                    "IsTamed",
                    "IsTrusting",
                    "LootDropped",
                    "MarkVariant",
                    "OnGround",
                    "OwnerNew",
                    "Persistent",
                    "PortalCooldown",
                    "Pos",
                    "Rotation",
                    "Saddled",
                    "Sheared",
                    "ShowBottom",
                    "Sitting",
                    "SkinID",
                    "Strength",
                    "StrengthMax",
                    "UniqueID",
                    "Variant",
                ],
                properties: {
                    Chested: {
                        description: "1 or 0 (true/false) - true if this entity is chested. Used by donkey, llama, and mule.",
                        type: "byte",
                    },
                    Color: {
                        description: "The main color value of the entity. Used by sheep, llama, shulker, tropical fish, etc. Defaults to 0.",
                        type: "byte",
                    },
                    Color2: {
                        description: "The entity's second color value. Used by tropical fish. Defaults to 0.",
                        type: "byte",
                    },
                    CustomName: {
                        description: "(May not exist) The custom name of this entity.",
                        type: "string",
                    },
                    CustomNameVisible: {
                        description:
                            "1 or 0 (true/false) - (may not exist) if true, and this entity has a custom name, the name always appears above the entity, regardless of where the cursor points. If the entity does not have a custom name, a default name is shown.",
                        type: "byte",
                    },
                    definitions: {
                        description: "(May not exist) The namespaced ID of this entity and its current and previous component groups.",
                        type: "list",
                        items: {
                            description: "Unknown",
                            type: "string",
                        },
                    },
                    FallDistance: {
                        description: "Distance the entity has fallen. Larger values cause more damage when the entity lands.",
                        type: "float",
                    },
                    Fire: {
                        description: "Number of ticks until the fire is put out. Default 0 when not on fire.",
                        type: "short",
                    },
                    identifier: {
                        description: "The namespaced ID of this entity.",
                        type: "string",
                    },
                    internalComponents: {
                        description: "Unknown.",
                        type: "compound",
                        required: ["EntityStorageKeyComponent"],
                        properties: {
                            EntityStorageKeyComponent: {
                                description: "Unknown.",
                                type: "compound",
                                required: ["StorageKey"],
                                properties: {
                                    StorageKey: {
                                        description: "Unknown.",
                                        type: "string",
                                    },
                                },
                            },
                        },
                    },
                    Invulnerable: {
                        description:
                            "1 or 0 (true/false) - true if the entity should not take damage. This applies to living and nonliving entities alike: mobs should not take damage from any source (including potion effects), and cannot be moved by fishing rods, attacks, explosions, or projectiles, and objects such as vehicles cannot be destroyed. Invulnerable player entities are also ignored by any hostile mobs. Note that these entities can be damaged by players in Creative mode.*needs testing*",
                        type: "byte",
                    },
                    IsAngry: {
                        description: "1 or 0 (true/false) - true if this entity is angry. Used by wolf and bee.",
                        type: "byte",
                    },
                    IsAutonomous: {
                        description: "1 or 0 (true/false) - true if this entity is an autonomous entity.",
                        type: "byte",
                    },
                    IsBaby: {
                        description: "1 or 0 (true/false) - true if this entity is a baby.",
                        type: "byte",
                    },
                    IsEating: {
                        description: "1 or 0 (true/false) - true if this entity is eating.",
                        type: "byte",
                    },
                    IsGliding: {
                        description: "1 or 0 (true/false) - true if this entity is gliding.",
                        type: "byte",
                    },
                    IsGlobal: {
                        description: "1 or 0 (true/false) - true if this entity is a global entity (e.g. lightning bolt, ender dragon, arrow).",
                        type: "byte",
                    },
                    IsIllagerCaptain: {
                        description: "1 or 0 (true/false) - true if the entity is an illager captain. Used by pillager and vindicator.",
                        type: "byte",
                    },
                    IsOrphaned: {
                        description: "1 or 0 (true/false) - true if this entity is not spawn from its parents. Used by all the mobs that can breed.",
                        type: "byte",
                    },
                    IsOutOfControl: {
                        description: "1 or 0 (true/false) - true if the entity is out of control. Used by boat.",
                        type: "byte",
                    },
                    IsRoaring: {
                        description: "1 or 0 (true/false) - true if this entity is roaring. Used by ravager.",
                        type: "byte",
                    },
                    IsScared: {
                        description: "1 or 0 (true/false) - true if this entity is scared.",
                        type: "byte",
                    },
                    IsStunned: {
                        description: "1 or 0 (true/false) - true if this entity is stunned. Used by ravager.",
                        type: "byte",
                    },
                    IsSwimming: {
                        description: "1 or 0 (true/false) - true if this entity is swimming.",
                        type: "byte",
                    },
                    IsTamed: {
                        description: "1 or 0 (true/false) - true if this entity is tamed.",
                        type: "byte",
                    },
                    IsTrusting: {
                        description: "1 or 0 (true/false) - true if this entity is trusting a player. Used by fox and ocelot.",
                        type: "byte",
                    },
                    LastDimensionId: {
                        description: "(May not exist) Unknown.",
                        type: "int",
                    },
                    LinksTag: {
                        description: "(May not exist) Unknown",
                        type: "compound",
                        required: ["entityID", "LinkID"],
                        properties: {
                            entityID: {
                                description: "The Unique ID of an entity.",
                                type: "long",
                            },
                            LinkID: {
                                description: "Unknown.",
                                type: "int",
                            },
                        },
                    },
                    LootDropped: {
                        description: "1 or 0 (true/false) - true if this entity can drop [loot](https://minecraft.wiki/w/Drops#Mob_drops) when died.",
                        type: "byte",
                    },
                    MarkVariant: {
                        description: "The ID of the mark variant. Used by villager, horse, bee etc. Defaults to 0.",
                        type: "int",
                    },
                    Motion: {
                        description: "(May not exist) Three TAG_Floats describing the current dX, dY and dZ velocity of the entity in meters per tick.",
                        type: "list",
                        items: [
                            {
                                description: "dX",
                                type: "float",
                            },
                            {
                                description: "dY",
                                type: "float",
                            },
                            {
                                description: "dZ",
                                type: "float",
                            },
                        ],
                    },
                    OnGround: {
                        description: "1 or 0 (true/false) - true if the entity is touching the ground.",
                        type: "byte",
                    },
                    OwnerNew: {
                        description: "Unknown. Defaults to -1.",
                        type: "long",
                    },
                    Persistent: {
                        description:
                            "1 or 0 (true/false) - true if an entity should be [persistent](https://minecraft.wiki/w/Mob spawning#Despawning) in the world.",
                        type: "byte",
                    },
                    PortalCooldown: {
                        description:
                            "The number of ticks before which the entity may be teleported back through a nether portal. Initially starts at 300 ticks (15 seconds) after teleportation and counts down to 0.",
                        type: "int",
                    },
                    Pos: {
                        description: "Three TAG_Floats describing the current X, Y and Z position of the entity.",
                        type: "list",
                        items: [
                            {
                                description: "X",
                                type: "float",
                            },
                            {
                                description: "Y",
                                type: "float",
                            },
                            {
                                description: "Z",
                                type: "float",
                            },
                        ],
                    },
                    Rotation: {
                        description: "Two TAG_Floats representing rotation in degrees.",
                        type: "list",
                        items: [
                            {
                                description: "The entity's rotation clockwise around the Y axis (called yaw). Due south is 0. Does not exceed 360 degrees.",
                                type: "float",
                            },
                            {
                                description:
                                    "The entity's declination from the horizon (called pitch). Horizontal is 0. Positive values look downward. Does not exceed positive or negative 90 degrees.",
                                type: "float",
                            },
                        ],
                    },
                    Saddled: {
                        description: "1 or 0 (true/false) - true if this entity is saddled.",
                        type: "byte",
                    },
                    Sheared: {
                        description: "1 or 0 (true/false) - true if this entity is sheared. Used by sheep and snow golem.",
                        type: "byte",
                    },
                    ShowBottom: {
                        description: "1 or 0 (true/false) - true if the End Crystal shows the bedrock slate underneath.*needs testing*",
                        type: "byte",
                    },
                    Sitting: {
                        description: "1 or 0 (true/false) - true if this entity is sitting.",
                        type: "byte",
                    },
                    SkinID: {
                        description: "The entity's Skin ID value. Used by villager and zombified villager. Defaults to 0.",
                        type: "int",
                    },
                    Strength: {
                        description: "Determines the number of items the entity can carry (items = 3 × strength). Used by llama. Defaults to 0.",
                        type: "int",
                    },
                    StrengthMax: {
                        description: "Determines the maximum number of items the entity can carry (items = 3 × strength). Defaults to 0.",
                        type: "int",
                    },
                    Tags: {
                        description: "(May not exist) List of [scoreboard tags](https://minecraft.wiki/w/Scoreboard) of this entity.",
                        type: "list",
                        items: {
                            description: "A tag.",
                            type: "string",
                        },
                    },
                    UniqueID: {
                        description: "The Unique ID of this entity.",
                        type: "long",
                    },
                    Variant: {
                        description: "The ID of the variant. Used by cat, villager, horse, etc. Defaults to 0.",
                        type: "int",
                    },
                },
                $fragment: false,
            },
            AutonomousEntities: {
                id: "AutonomousEntities",
                title: "The AutonomousEntities schema.",
                description: "The autonomous entities data.",
                type: "compound",
                required: ["AutonomousEntityList"],
                properties: {
                    AutonomousEntityList: {
                        description: "Unknown.",
                        type: "list",
                    },
                },
                $fragment: false,
            },
            BiomeData: {
                id: "BiomeData",
                title: "The BiomeData schema.",
                description: "The [biome](https://minecraft.wiki/w/biome) data.",
                type: "compound",
                required: ["list"],
                properties: {
                    list: {
                        description: "A list of compound tags representing biomes.",
                        type: "list",
                        items: {
                            description: "A biome.",
                            type: "compound",
                            required: ["id", "snowAccumulation"],
                            properties: {
                                id: {
                                    description: "The numerical [biome ID](https://minecraft.wiki/w/Biome).",
                                    type: "byte",
                                },
                                snowAccumulation: {
                                    description: "The biome's snow accumulation. Eg. `0.125`.",
                                    type: "float",
                                },
                            },
                        },
                    },
                },
                $fragment: false,
            },
            BlockEntity: {
                id: "BlockEntity",
                title: "The BlockEntity schema.",
                description: "All block entities share this base.",
                type: "compound",
                required: ["id", "isMovable", "x", "y", "z"],
                properties: {
                    CustomName: {
                        description: "(May not exist) The custom name of the block entity.",
                        type: "string",
                    },
                    id: {
                        description: "The savegame ID of the block entity.",
                        type: "string",
                    },
                    isMovable: {
                        description: "1 or 0 (true/false) - true if the block entity is movable with a piston.",
                        type: "byte",
                    },
                    x: {
                        description: "X coordinate of the block entity.",
                        type: "int",
                    },
                    y: {
                        description: "Y coordinate of the block entity.",
                        type: "int",
                    },
                    z: {
                        description: "Z coordinate of the block entity.",
                        type: "int",
                    },
                },
            },
            Data3D: {
                id: "Data3D",
                title: "The Data3D schema.",
                description:
                    "The NBT structure of the parsed data of the Data3D content type.\n\nNote: This NBT structure is specific to the parser and serializer implemented by this module.\nThis is because the actual data is stored in binary format.",
                type: "compound",
                required: ["heightMap", "biomes"],
                properties: {
                    heightMap: {
                        description: "The height map data.\n\nIn it is stored as a 2D matrix with [x][z] height values.",
                        type: "list",
                        minItems: 16,
                        maxItems: 16,
                        items: {
                            description: "A height map row. Its index corresponds to the offset on the x axis.",
                            type: "list",
                            minItems: 16,
                            maxItems: 16,
                            items: {
                                description: "A height value. Its index corresponds to the offset on the z axis.",
                                type: `${NBT.TagType.Short}`,
                            },
                        },
                    },
                    biomes: {
                        description: "The biome data.",
                        type: "list",
                        items: {
                            type: "compound",
                            required: ["values", "palette"],
                            properties: {
                                values: {
                                    description: "The biome values.\n\nThis is an array of indices in the biome palette, one for each block.",
                                    type: "list",
                                    items: {
                                        type: "int",
                                    },
                                },
                                palette: {
                                    description: "The biome palette.\n\nThis is an array of the biome numeric IDs.",
                                    type: "list",
                                    items: {
                                        type: "int",
                                    },
                                },
                            },
                        },
                    },
                },
            },
            LevelDat: {
                id: "LevelDat",
                title: "The LevelDat schema.",
                description: "World data.",
                type: "compound",
                properties: {
                    abilities: {
                        type: "compound",
                        properties: {
                            attackmobs: {
                                type: "byte",
                                description: "1 or 0 (true/false) - true if the player can attack mobs.",
                                enumDescriptions: ["true", "false"],
                                enum: [
                                    { type: "byte", value: 0 },
                                    { type: "byte", value: 1 },
                                ],
                            },
                            attackplayers: {
                                type: "byte",
                                description: "1 or 0 (true/false) - true if the player can attack other players.",
                                enumDescriptions: ["true", "false"],
                                enum: [
                                    { type: "byte", value: 0 },
                                    { type: "byte", value: 1 },
                                ],
                            },
                            build: {
                                type: "byte",
                                description: "1 or 0 (true/false) - true if the player can place blocks.",
                                enumDescriptions: ["true", "false"],
                                enum: [
                                    { type: "byte", value: 0 },
                                    { type: "byte", value: 1 },
                                ],
                            },
                            doorsandswitches: {
                                type: "byte",
                                description: "1 or 0 (true/false) - true if the player is able to interact with redstone components.",
                                enumDescriptions: ["true", "false"],
                                enum: [
                                    { type: "byte", value: 0 },
                                    { type: "byte", value: 1 },
                                ],
                            },
                            flying: {
                                type: "byte",
                                description: "1 or 0 (true/false) - true if the player is currently flying.",
                                enumDescriptions: ["true", "false"],
                                enum: [
                                    { type: "byte", value: 0 },
                                    { type: "byte", value: 1 },
                                ],
                            },
                            flySpeed: {
                                type: "float",
                                description: "The flying speed, always 0.05.",
                                default: {
                                    type: "float",
                                    value: 0.05,
                                },
                            },
                            instabuild: {
                                type: "byte",
                                description: "1 or 0 (true/false) - true if the player can instantly destroy blocks.",
                                enumDescriptions: ["true", "false"],
                                enum: [
                                    { type: "byte", value: 0 },
                                    { type: "byte", value: 1 },
                                ],
                            },
                            invulnerable: {
                                type: "byte",
                                description: "1 or 0 (true/false) - true if the player is immune to all damage and harmful effects.",
                                enumDescriptions: ["true", "false"],
                                enum: [
                                    { type: "byte", value: 0 },
                                    { type: "byte", value: 1 },
                                ],
                            },
                            lightning: {
                                type: "byte",
                                description: "1 or 0 (true/false) - true if the player was struck by lightning.",
                                enumDescriptions: ["true", "false"],
                                enum: [
                                    { type: "byte", value: 0 },
                                    { type: "byte", value: 1 },
                                ],
                            },
                            mayfly: {
                                type: "byte",
                                description: "1 or 0 (true/false) - true if the player can fly.",
                                enumDescriptions: ["true", "false"],
                                enum: [
                                    { type: "byte", value: 0 },
                                    { type: "byte", value: 1 },
                                ],
                            },
                            mine: {
                                type: "byte",
                                description: "1 or 0 (true/false) - true if the player can destroy blocks.",
                                enumDescriptions: ["true", "false"],
                                enum: [
                                    { type: "byte", value: 0 },
                                    { type: "byte", value: 1 },
                                ],
                            },
                            mute: {
                                type: "byte",
                                description: "1 or 0 (true/false) - true if the player messages cannot be seen by other players.",
                                enumDescriptions: ["true", "false"],
                                enum: [
                                    { type: "byte", value: 0 },
                                    { type: "byte", value: 1 },
                                ],
                            },
                            noclip: {
                                type: "byte",
                                description: "1 or 0 (true/false) - true if the player can phase through blocks.",
                                enumDescriptions: ["true", "false"],
                                enum: [
                                    { type: "byte", value: 0 },
                                    { type: "byte", value: 1 },
                                ],
                            },
                            op: {
                                type: "byte",
                                description: "1 or 0 (true/false) - true if the player has operator commands.",
                                enumDescriptions: ["true", "false"],
                                enum: [
                                    { type: "byte", value: 0 },
                                    { type: "byte", value: 1 },
                                ],
                            },
                            opencontainers: {
                                type: "byte",
                                description: "1 or 0 (true/false) - true if the player is able to open containers.",
                                enumDescriptions: ["true", "false"],
                                enum: [
                                    { type: "byte", value: 0 },
                                    { type: "byte", value: 1 },
                                ],
                            },
                            permissionsLevel: {
                                type: "int",
                                description: "What permissions a player defaults to, when joining a world.",
                                default: {
                                    type: "int",
                                    value: 0,
                                },
                            },
                            playerPermissionsLevel: {
                                type: "int",
                                description: "What permissions a player has.",
                                default: {
                                    type: "int",
                                    value: 0,
                                },
                            },
                            teleport: {
                                type: "byte",
                                description: "1 or 0 (true/false) - true if the player is allowed to teleport.",
                                enumDescriptions: ["true", "false"],
                                enum: [
                                    { type: "byte", value: 0 },
                                    { type: "byte", value: 1 },
                                ],
                            },
                            walkSpeed: {
                                type: "float",
                                description: "The walking speed, always 0.1.",
                                default: {
                                    type: "float",
                                    value: 0.1,
                                },
                            },
                            worldbuilder: {
                                type: "byte",
                                description: "1 or 0 (true/false) - true if the player is a world builder.",
                                enumDescriptions: ["true", "false"],
                                enum: [
                                    { type: "byte", value: 0 },
                                    { type: "byte", value: 1 },
                                ],
                            },
                        },
                        description: "The default permissions for players in the world.",
                    },
                    allowdestructiveobjects: {
                        type: "byte",
                        description: "The `allowdestructiveobjects` [game rule](game rule).",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    allowmobs: {
                        type: "byte",
                        description: "The `allowmobs` [game rule](game rule).",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    baseGameVersion: {
                        type: "string",
                        description:
                            "The version of Minecraft that is the maximum version to load resources from. Eg. setting this to `1.16.0` removes any features that were added after version `1.16.0`.",
                        default: {
                            type: "string",
                            value: "*",
                        },
                    },
                    BiomeOverride: {
                        type: "string",
                        description:
                            "Makes the world into a [single biome](single biome) world and the biome set here is the biome of this single biome world.",
                    },
                    bonusChestEnabled: {
                        type: "byte",
                        description: "1 or 0 (true/false) - true if the bonus chest is enabled.",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    bonusChestSpawned: {
                        type: "byte",
                        description:
                            "1 or 0 (true/false) - true if the bonus chest has been placed in the world. Turning this to false spawns another bonus chest near the spawn coordinates.",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    codebuilder: {
                        type: "byte",
                        description: "UNDOCUMENTED.",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    commandblockoutput: {
                        type: "byte",
                        description: "The `commandblockoutput` [game rule](game rule).",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    CenterMapsToOrigin: {
                        type: "byte",
                        description: "1 or 0 (true/false) - true if the maps should be on a grid or centered to exactly where they are created. Default to 0.",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    commandblocksenabled: {
                        type: "byte",
                        description: "The `commandblocksenabled` [game rule](game rule).",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    commandsEnabled: {
                        type: "byte",
                        description: "1 or 0 (true/false) - true if cheats are on.",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    ConfirmedPlatformLockedContent: {
                        type: "byte",
                        description:
                            "1 or 0 (true/false) - tells if the world has Platform-Specific texture packs or content. Used to prevent cross play in specific worlds, that use assets allowed only on specific consoles.",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    currentTick: {
                        type: "long",
                        description: "UNDOCUMENTED.",
                    },
                    Difficulty: {
                        type: "int",
                        description: "The current difficulty setting. 0 is Peaceful, 1 is Easy, 2 is Normal, and 3 is Hard.",
                        enumDescriptions: ["Peaceful", "Easy", "Normal", "Hard"],
                        enum: [
                            { type: "int", value: 0 },
                            { type: "int", value: 1 },
                            { type: "int", value: 2 },
                            { type: "int", value: 3 },
                        ],
                    },
                    Dimension: {
                        type: "int",
                        description: "The dimension the player is in. 0 is the Overworld, 1 is the Nether, and 2 is the End.",
                        enumDescriptions: ["Overworld", "Nether", "The End"],
                        enum: [
                            { type: "int", value: 0 },
                            { type: "int", value: 1 },
                            { type: "int", value: 2 },
                        ],
                    },
                    dodaylightcycle: {
                        type: "byte",
                        description: "The `dodaylightcycle` [game rule](game rule).",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    doentitiydrops: {
                        type: "byte",
                        description: "The `doentitiydrops` [game rule](game rule).",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    dofiretick: {
                        type: "byte",
                        description: "The `dofiretick` [game rule](game rule).",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    doimmediaterespawn: {
                        type: "byte",
                        description: "The `doimmediaterespawn` [game rule](game rule).",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    doinsomnia: {
                        type: "byte",
                        description: "The `doinsomnia` [game rule](game rule).",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    dolimitedcrafting: {
                        type: "byte",
                        description: "The `dolimitedcrafting` [game rule](game rule).",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    domobloot: {
                        type: "byte",
                        description: "The `domobloot` [game rule](game rule).",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    domobspawning: {
                        type: "byte",
                        description: "The `domobspawning` [game rule](game rule).",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    dotiledrops: {
                        type: "byte",
                        description: "The `dotiledrops` [game rule](game rule).",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    doweathercycle: {
                        type: "byte",
                        description: "The `doweathercycle` [game rule](game rule).",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    drowningdamage: {
                        type: "byte",
                        description: "The `drowningdamage` [game rule](game rule).",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    educationFeaturesEnabled: {
                        type: "byte",
                        description: "UNDOCUMENTED.",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    EducationOid: {
                        type: "string",
                        description: "A [UUID](UUID). *info needed*",
                    },
                    EducationProductId: {
                        type: "string",
                        description: "UNDOCUMENTED.",
                    },
                    eduOffer: {
                        type: "int",
                        description: "Marks a world as an Education Edition world (worlds with this set to 1 do not open on Bedrock!).",
                        default: {
                            type: "byte",
                            value: 0,
                        },
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    eduSharedResource: {
                        type: "compound",
                        properties: {
                            buttonName: {
                                type: "string",
                                description:
                                    "Unused in Bedrock Edition, but is used in Education Edition as part of the Resource Link feature on the Pause Screen. It defines the Resource Link Button Text.",
                            },
                            linkUri: {
                                type: "string",
                                description:
                                    "Unused in Bedrock Edition, but is used in Education Edition as part of the Resource Link feature on the Pause Screen. It defines what link opens upon clicking the Resource Link Button.",
                            },
                        },
                    },
                    experiments: {
                        type: "compound",
                        description: "The experimental toggles.",
                        properties: {
                            experiments_ever_used: {
                                type: "byte",
                                description: "1 or 0 (true/false) - true if the world is locked on [experimental gameplay](experimental gameplay).",
                                enumDescriptions: ["true", "false"],
                                enum: [
                                    { type: "byte", value: 0 },
                                    { type: "byte", value: 1 },
                                ],
                            },
                            saved_with_toggled_experiments: {
                                type: "byte",
                                description: "1 or 0 (true/false) - true if the world has been saved with experiments on before.",
                                enumDescriptions: ["true", "false"],
                                enum: [
                                    { type: "byte", value: 0 },
                                    { type: "byte", value: 1 },
                                ],
                            },
                            gametest: {
                                type: "byte",
                                description: "1 or 0 (true/false) - true if the beta APIs experimental toggle is enabled.",
                                enumDescriptions: ["true", "false"],
                                enum: [
                                    { type: "byte", value: 0 },
                                    { type: "byte", value: 1 },
                                ],
                            },
                            camera_aim_assist: {
                                type: "byte",
                                description: "1 or 0 (true/false) - true if the camera aim assist experimental toggle is enabled.",
                                enumDescriptions: ["true", "false"],
                                enum: [
                                    { type: "byte", value: 0 },
                                    { type: "byte", value: 1 },
                                ],
                            },
                            data_driven_biomes: {
                                type: "byte",
                                description: "1 or 0 (true/false) - true if the data driven biomes experimental toggle is enabled.",
                                enumDescriptions: ["true", "false"],
                                enum: [
                                    { type: "byte", value: 0 },
                                    { type: "byte", value: 1 },
                                ],
                            },
                            experimental_creator_cameras: {
                                type: "byte",
                                description: "1 or 0 (true/false) - true if the experimental creator cameras experimental toggle is enabled.",
                                enumDescriptions: ["true", "false"],
                                enum: [
                                    { type: "byte", value: 0 },
                                    { type: "byte", value: 1 },
                                ],
                            },
                            jigsaw_structures: {
                                type: "byte",
                                description: "1 or 0 (true/false) - true if the jigsaw structures experimental toggle is enabled.",
                                enumDescriptions: ["true", "false"],
                                enum: [
                                    { type: "byte", value: 0 },
                                    { type: "byte", value: 1 },
                                ],
                            },
                            locator_bar: {
                                type: "byte",
                                description: "1 or 0 (true/false) - true if the locator bar experimental toggle is enabled.",
                                enumDescriptions: ["true", "false"],
                                enum: [
                                    { type: "byte", value: 0 },
                                    { type: "byte", value: 1 },
                                ],
                            },
                            upcoming_creator_features: {
                                type: "byte",
                                description: "1 or 0 (true/false) - true if the upcoming creator features experimental toggle is enabled.",
                                enumDescriptions: ["true", "false"],
                                enum: [
                                    { type: "byte", value: 0 },
                                    { type: "byte", value: 1 },
                                ],
                            },
                            y_2025_drop_1: {
                                type: "byte",
                                description: "1 or 0 (true/false) - true if the y_2025_drop_1 experimental toggle is enabled.",
                                enumDescriptions: ["true", "false"],
                                enum: [
                                    { type: "byte", value: 0 },
                                    { type: "byte", value: 1 },
                                ],
                            },
                            y_2025_drop_2: {
                                type: "byte",
                                description: "1 or 0 (true/false) - true if the y_2025_drop_2 experimental toggle is enabled.",
                                enumDescriptions: ["true", "false"],
                                enum: [
                                    { type: "byte", value: 0 },
                                    { type: "byte", value: 1 },
                                ],
                            },
                            y_2025_drop_3: {
                                type: "byte",
                                description: "1 or 0 (true/false) - true if the y_2025_drop_3 experimental toggle is enabled.",
                                enumDescriptions: ["true", "false"],
                                enum: [
                                    { type: "byte", value: 0 },
                                    { type: "byte", value: 1 },
                                ],
                            },
                        },
                        additionalProperties: {
                            type: "byte",
                            enumDescriptions: ["true", "false"],
                            enum: [
                                { type: "byte", value: 0 },
                                { type: "byte", value: 1 },
                            ],
                        },
                    },
                    falldamage: {
                        type: "byte",
                        description: "The `falldamage` [game rule](game rule).",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    firedamage: {
                        type: "byte",
                        description: "The `firedamage` [game rule](game rule).",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    FlatWorldLayers: {
                        type: "string",
                        description:
                            'JSON that controls generation of flat worlds. Default is `{"biome_id":1,"block_layers":[{"block_name":"minecraft:bedrock","count":1},{"block_name":"minecraft:dirt","count":2},{"block_name":"minecraft:grass_block","count":1}],"encoding_version":6,"structure_options":null,"world_version":"version.post_1_18"}`.',
                        default: {
                            type: "string",
                            value: `{"biome_id":1,"block_layers":[{"block_name":"minecraft:bedrock","count":1},{"block_name":"minecraft:dirt","count":2},{"block_name":"minecraft:grass_block","count":1}],"encoding_version":6,"structure_options":null,"world_version":"version.post_1_18"}`,
                        },
                    },
                    freezedamage: {
                        type: "byte",
                        description: "The `freezedamage` [game rule](game rule).",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    functioncommandlimit: {
                        type: "int",
                        description: "The `functioncommandlimit` [game rule](game rule).",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    globalmute: {
                        type: "byte",
                        description: "The `globalmute` [game rule](game rule).",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    ForceGameType: {
                        type: "byte",
                        description: "1 or 0 (true/false) - true if force the player into the game mode defined in `GameType`.",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    GameType: {
                        type: "int",
                        description:
                            "The default game mode of the player. 0 is [Survival](Survival), 1 is [Creative](Creative), 2 is [Adventure](Adventure), 5 is [Default](Game_mode#Default), and 6 is [Spectator](Spectator).",
                        oneOf: [
                            {
                                not: {
                                    enum: [
                                        { type: "int", value: 0 },
                                        { type: "int", value: 1 },
                                        { type: "int", value: 2 },
                                        { type: "int", value: 5 },
                                        { type: "int", value: 6 },
                                    ],
                                },
                            },
                            {
                                enumDescriptions: ["Survival", "Creative", "Adventure", "Default", "Spectator"],
                                enum: [
                                    { type: "int", value: 0 },
                                    { type: "int", value: 1 },
                                    { type: "int", value: 2 },
                                    { type: "int", value: 5 },
                                    { type: "int", value: 6 },
                                ],
                            },
                        ],
                    },
                    Generator: {
                        type: "int",
                        description: "The world type. 0 is Old, 1 is Infinite, 2 is Flat, and 5 is Void.",
                        oneOf: [
                            {
                                not: {
                                    enum: [
                                        { type: "int", value: 0 },
                                        { type: "int", value: 1 },
                                        { type: "int", value: 2 },
                                        { type: "int", value: 5 },
                                    ],
                                },
                            },
                            {
                                enumDescriptions: ["Old", "Infinite", "Flat", "Void"],
                                enum: [
                                    { type: "int", value: 0 },
                                    { type: "int", value: 1 },
                                    { type: "int", value: 2 },
                                    { type: "int", value: 5 },
                                ],
                            },
                        ],
                    },
                    hasBeenLoadedInCreative: {
                        type: "byte",
                        description:
                            "Whether the world has achievements locked. Set to 1 if the default game mode is set to Creative, if [cheats](Commands#Cheats) have been enabled, or if a [behavior pack](add-on) has been equipped.",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    hasLockedBehaviorPack: {
                        type: "byte",
                        description: "UNDOCUMENTED.",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    hasLockedResourcePack: {
                        type: "byte",
                        description: "UNDOCUMENTED.",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    immutableWorld: {
                        type: "byte",
                        description: "Is read-only.",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    InventoryVersion: {
                        type: "string",
                        description: "UNDOCUMENTED.",
                    },
                    isCreatedInEditor: {
                        type: "byte",
                        description: "1 or 0 (true/false) - true if it was created from the [bedrock editor](Bedrock Editor).",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    isExportedFromEditor: {
                        type: "byte",
                        description: "1 or 0 (true/false) - true if exported from the [bedrock editor](Bedrock Editor).",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    isFromLockedTemplate: {
                        type: "byte",
                        description:
                            "1 or 0 (true/false) - true if the world is created from a world template where the world options were intended not to be modified.",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    isFromWorldTemplate: {
                        type: "byte",
                        description: "1 or 0 (true/false) - true if the world is created from a world template.",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    IsHardcore: {
                        type: "byte",
                        description: "1 or 0 (true/false) - true if the world is in [Hardcore](Hardcore) mode.",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    IsSingleUseWorld: {
                        type: "byte",
                        description:
                            "1 or 0 (true/false) - (unused) may cause world to not save, or delete after use. Seems to default back to false when a world is loaded.",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    isWorldTemplateOptionLocked: {
                        type: "byte",
                        description:
                            "1 or 0 (true/false) - true if the world options cannot be modified until the user accepts that they are changing the map.",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    keepinventory: {
                        type: "byte",
                        description: "The `keepinventory` [game rule](game rule).",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    LANBroadcast: {
                        type: "byte",
                        description: 'Whether the world has been opened with the "Visible to LAN players" world setting enabled.',
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    LANBroadcastIntent: {
                        type: "byte",
                        description: 'Whether the "Visible to LAN players" world toggle is enabled.',
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    lastOpenedWithVersion: {
                        type: "list",
                        description:
                            "Five ints representing the last version with which the world was opened. Eg. for the [beta/_Preview_ 1.20.30.22](Bedrock Edition Preview 1.20.30.22) the version is `1 20 30 22 1`.",
                        items: [
                            {
                                title: "Major",
                                type: "int",
                            },
                            {
                                title: "Minor",
                                type: "int",
                            },
                            {
                                title: "Patch",
                                type: "int",
                            },
                            {
                                title: "Build",
                                type: "int",
                            },
                            {
                                title: "Preview",
                                type: "int",
                                enumDescriptions: ["true", "false"],
                                enum: [
                                    { type: "int", value: 0 },
                                    { type: "int", value: 1 },
                                ],
                            },
                        ],
                    },
                    LastPlayed: {
                        type: "long",
                        description: "Stores a timestamp of when the world was last played as the number of seconds since the epoch (1/1/1970).",
                    },
                    LevelName: {
                        type: "string",
                        description: "Specifies the name of the world.",
                        default: "My World",
                    },
                    lightningLevel: {
                        type: "float",
                        description: "UNDOCUMENTED.",
                    },
                    lightningTime: {
                        type: "int",
                        description: "UNDOCUMENTED.",
                    },
                    LimitedWorldOriginX: {
                        type: "int",
                        description: "The X coordinate where limited (old) world generation started.",
                        default: {
                            type: "int",
                            value: 0,
                        },
                    },
                    LimitedWorldOriginY: {
                        type: "int",
                        description: "The Y coordinate where limited (old) world generation started.",
                        default: {
                            type: "int",
                            value: 0,
                        },
                    },
                    LimitedWorldOriginZ: {
                        type: "int",
                        description: "The Z coordinate where limited (old) world generation started.",
                        default: {
                            type: "int",
                            value: 0,
                        },
                    },
                    LimitedWorldWidth: {
                        type: "int",
                        description: "The width (in chunks) of the borders surrounding the (old) world generation. Defaults to 16.",
                        default: {
                            type: "int",
                            value: 16,
                        },
                    },
                    LimitedWorldDepth: {
                        type: "int",
                        description: "The depth (in chunks) of the borders surrounding the (old) world generation. Defaults to 16.",
                        default: {
                            type: "int",
                            value: 16,
                        },
                    },
                    maxcommandchainlength: {
                        type: "int",
                        description: "The `maxcommandchainlength` [game rule](game rule).",
                    },
                    MinimumCompatibleClientVersion: {
                        type: "list",
                        description:
                            "Five ints representing the minimum compatible client version that is needed to open the world. Eg. for the [beta/_Preview_ 1.20.30.22](Bedrock Edition Preview 1.20.30.22) the minimum compatible version is `1 20 30 0 0`.",
                        items: [
                            {
                                title: "Major",
                                type: "int",
                            },
                            {
                                title: "Minor",
                                type: "int",
                            },
                            {
                                title: "Patch",
                                type: "int",
                            },
                            {
                                title: "Build",
                                type: "int",
                            },
                            {
                                title: "Preview",
                                type: "int",
                                enumDescriptions: ["true", "false"],
                                enum: [
                                    { type: "int", value: 0 },
                                    { type: "int", value: 1 },
                                ],
                            },
                        ],
                    },
                    mobgriefing: {
                        type: "byte",
                        description: "UNDOCUMENTED.",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    MultiplayerGame: {
                        type: "byte",
                        description: 'Whether the world has been opened with the "Multiplayer Game" world setting enabled.',
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    MultiplayerGameIntent: {
                        type: "byte",
                        description: 'Whether the "Multiplayer Game" world toggle is enabled.',
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    naturalregeneration: {
                        type: "byte",
                        description: "The `naturalregeneration` [game rule](game rule).",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    NetherScale: {
                        type: "int",
                        description:
                            "Defaults to 8. This is used to tell the game how many Overworld blocks go into one nether block (X blocks in the nether = 1 block in the overworld).",
                        default: {
                            type: "int",
                            value: 8,
                        },
                    },
                    NetworkVersion: {
                        type: "int",
                        description: "The protocol version of the version the world was last played on.",
                    },
                    Platform: {
                        type: "int",
                        description: "Seems to store the platform that the level is created on. Currently observed value is 2.",
                        default: {
                            type: "int",
                            value: 2,
                        },
                    },
                    PlatformBroadcastIntent: {
                        type: "int",
                        description: "UNDOCUMENTED.",
                    },
                    prid: {
                        type: "string",
                        description:
                            "The UUID of the premium world template this world was created with. Used for [Marketplace worlds](Marketplace#Worlds).*info needed*",
                    },
                    pvp: {
                        type: "byte",
                        description: "The `pvp` [game rule](game rule).",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    rainLevel: {
                        type: "float",
                        description: "UNDOCUMENTED.",
                    },
                    rainTime: {
                        type: "int",
                        description: "UNDOCUMENTED.",
                    },
                    RandomSeed: {
                        type: "long",
                        description: "Level seed.",
                    },
                    randomtickspeed: {
                        type: "int",
                        description: "The `randomtickspeed` [game rule](game rule).",
                        default: {
                            type: "int",
                            value: 1,
                        },
                    },
                    recipesunlock: {
                        type: "byte",
                        description: "The `recipesunlock` [game rule](game rule).",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    requiresCopiedPackRemovalCheck: {
                        type: "byte",
                        description: "UNDOCUMENTED.",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    respawnblocksexplode: {
                        type: "byte",
                        description: "The `respawnblocksexplode` [game rule](game rule).",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    sendcommandfeedback: {
                        type: "byte",
                        description: "The `sendcommandfeedback` [game rule](game rule).",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    serverChunkTickRange: {
                        type: "int",
                        description: "Simulation distance.*info needed*",
                        default: {
                            type: "int",
                            value: 4,
                        },
                    },
                    showbordereffect: {
                        type: "byte",
                        description: "The `showbordereffect` [game rule](game rule).",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    showcoordinates: {
                        type: "byte",
                        description: "The `showcoordinates` [game rule](game rule).",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    showdaysplayed: {
                        type: "byte",
                        description: "The `showdaysplayed` [game rule](game rule).",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    showdeathmessages: {
                        type: "byte",
                        description: "The `showdeathmessages` [game rule](game rule).",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    showtags: {
                        type: "byte",
                        description: "The `showtags` [game rule](game rule).",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    spawnMobs: {
                        type: "byte",
                        description: "1 or 0 (true/false) - true if mobs can spawn.",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    spawnradius: {
                        type: "int",
                        description: "The `spawnradius` [game rule](game rule).",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    SpawnV1Villagers: {
                        type: "byte",
                        description: "Spawn pre-1.10.0 villagers.",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    SpawnX: {
                        type: "int",
                        description: "The X coordinate of the world spawn position. Defaults to 0.",
                        default: {
                            type: "int",
                            value: 0,
                        },
                    },
                    SpawnY: {
                        type: "int",
                        description: "The Y coordinate of the world spawn position. Defaults to 64.",
                        default: {
                            type: "int",
                            value: 64,
                        },
                    },
                    SpawnZ: {
                        type: "int",
                        description: "The Z coordinate of the world spawn position. Defaults to 0.",
                        default: {
                            type: "int",
                            value: 0,
                        },
                    },
                    startWithMapEnabled: {
                        type: "byte",
                        description: "1 or 0 (true/false) - true if new players spawn with a locator map.",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    StorageVersion: {
                        type: "int",
                        description: "Version of _Bedrock Edition_ Storage Tool, currently is 10.",
                        default: {
                            type: "int",
                            value: 10,
                        },
                    },
                    texturePacksRequired: {
                        type: "byte",
                        description: "1 or 0 (true/false) - true if the user must download the texture packs applied to the world to join.",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    Time: {
                        type: "long",
                        description:
                            'Stores the current "time of day" in ticks. There are 20 ticks per real-life second, and 24000 ticks per Minecraft [daylight cycle](daylight cycle), making the full cycle length 20 minutes. 0 is the start of [daytime](Daylight cycle#Daytime), 12000 is the start of [sunset](Daylight cycle#Sunset/dusk), 13800 is the start of [nighttime](Daylight cycle#Nighttime), 22200 is the start of [sunrise](Daylight cycle#Sunrise/dawn), and 24000 is daytime again. The value stored in level.dat is always increasing and can be larger than 24000, but the "time of day" is always modulo 24000 of the "Time" field value.',
                        default: {
                            type: "long",
                            value: 0n,
                        },
                    },
                    tntexplodes: {
                        type: "byte",
                        description: "The `tntexplodes` [game rule](game rule).",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    useMsaGamertagsOnly: {
                        type: "byte",
                        description: "Whether the world is restricted to Microsoft Accounts only (players must be signed in).",
                        enumDescriptions: ["true", "false"],
                        enum: [
                            { type: "byte", value: 0 },
                            { type: "byte", value: 1 },
                        ],
                    },
                    world_policies: {
                        type: "compound",
                        properties: {},
                        description: "UNDOCUMENTED.",
                    },
                    worldStartCount: {
                        type: "long",
                        description: "Counts how many times the game has been closed since the world was created, with its value decreasing by 1 each time.",
                    },
                    XBLBroadcastIntent: {
                        type: "int",
                        description:
                            'The [multiplayer](multiplayer) exposure for Xbox Live services, corresponding to the "Microsoft Account Settings" world setting. 0 is disabled,*info needed* 1 is "Invite Only," 2 is "Friends Only," and 3 is "Friends of Friends."',
                        oneOf: [
                            {
                                not: {
                                    enum: [
                                        {
                                            type: "int",
                                            value: 0,
                                        },
                                        {
                                            type: "int",
                                            value: 1,
                                        },
                                        {
                                            type: "int",
                                            value: 2,
                                        },
                                        {
                                            type: "int",
                                            value: 3,
                                        },
                                    ],
                                },
                            },
                            {
                                type: "int",
                                enumDescriptions: ["disabled", "Invite Only", "Friends Only", "Friends of Friends"],
                                enum: [
                                    {
                                        type: "int",
                                        value: 0,
                                    },
                                    {
                                        type: "int",
                                        value: 1,
                                    },
                                    {
                                        type: "int",
                                        value: 2,
                                    },
                                    {
                                        type: "int",
                                        value: 3,
                                    },
                                ],
                            },
                        ],
                    },
                },
            },
            LimboEntities: {
                id: "LimboEntities",
                description: "The limbo entities data.",
                type: "compound",
                required: ["data"],
                properties: {
                    data: {
                        description: "A compound with a list of limbo entities.",
                        type: "compound",
                        required: ["LimboEntities"],
                        properties: {
                            LimboEntities: {
                                description: "Unknown.",
                                type: "list",
                            },
                        },
                    },
                },
                $fragment: false,
            },
            Map: {
                id: "Map",
                title: "The Map schema.",
                description: "NBT structure of a map.",
                type: "compound",
                required: [
                    "mapId",
                    "parentMapId",
                    "dimension",
                    "fullyExplored",
                    "mapLocked",
                    "scale",
                    "unlimitedTracking",
                    "height",
                    "width",
                    "xCenter",
                    "zCenter",
                    "decorations",
                    "colors",
                ],
                properties: {
                    mapId: {
                        description: "The Unique ID of the map.",
                        type: "long",
                    },
                    parentMapId: {
                        description: "The Unique ID's of the parent maps.",
                        type: "long",
                    },
                    dimension: {
                        description:
                            "0 = The [Overworld](https://minecraft.wiki/w/Overworld), 1 = [The Nether](https://minecraft.wiki/w/The Nether), 2 = [The End](https://minecraft.wiki/w/The End), any other value = a static image with no player pin.",
                        type: "byte",
                    },
                    fullyExplored: {
                        description: "1 if the map is full explored.",
                        type: "byte",
                    },
                    mapLocked: {
                        description: "1 if the map has been locked in a [cartography table](https://minecraft.wiki/w/cartography table).",
                        type: "byte",
                    },
                    scale: {
                        description:
                            "How zoomed in the map is, and must be a number between 0 and 4 (inclusive) that represent the level. Default 0. If this is changed in an [anvil](https://minecraft.wiki/w/anvil) or a [cartography table](https://minecraft.wiki/w/cartography table), the Unique ID of the map changes.",
                        type: "byte",
                    },
                    unlimitedTracking: {
                        description: "Unknown. Default 0.",
                        type: "byte",
                    },
                    height: {
                        description: "The height of the map. Is associated with the scale level.",
                        type: "short",
                    },
                    width: {
                        description: "The width of the map. Is associated with the scale level.",
                        type: "short",
                    },
                    xCenter: {
                        description: "Center of the map according to real world by X.",
                        type: "int",
                    },
                    zCenter: {
                        description: "Center of the map according to real world by Z.",
                        type: "int",
                    },
                    decorations: {
                        description: "A list of optional icons to display on the map.",
                        type: "list",
                        items: {
                            description: "An individual decoration.",
                            type: "compound",
                            properties: {
                                data: {
                                    type: "compound",
                                    required: ["rot", "type", "x", "y"],
                                    properties: {
                                        rot: {
                                            description: "The rotation of the symbol, ranging from 0 to 15. South = 0, West = 4, North = 8, East = 12.",
                                            type: "int",
                                        },
                                        type: {
                                            description: "The ID of the [map icon](https://minecraft.wiki/w/Map icons.png) to display.",
                                            type: "int",
                                        },
                                        x: {
                                            description: "The horizontal column (x) where the decoration is located on the map (per pixel).",
                                            type: "int",
                                        },
                                        y: {
                                            description: "The vertical column (y) where the decoration is located on the map (per pixel).",
                                            type: "int",
                                        },
                                    },
                                },
                                key: {
                                    type: "compound",
                                    required: ["blockX", "blockY", "blockZ", "type"],
                                    properties: {
                                        blockX: {
                                            description: "The world x-position of the decoration.",
                                            type: "int",
                                        },
                                        blockY: {
                                            description: "The world y-position of the decoration.",
                                            type: "int",
                                        },
                                        blockZ: {
                                            description: "The world z-position of the decoration.",
                                            type: "int",
                                        },
                                        type: {
                                            description: "Unknown.",
                                            type: "int",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    colors: {
                        description: "An array of bytes that represent color values (**65536 entries** for a default 128×128 map).",
                        type: "byteArray",
                    },
                },
                $fragment: false,
            },
            MobEvents: {
                id: "MobEvents",
                description: "NBT structure of [mob event](https://minecraft.wiki/w/Commands/mobevent)s.",
                type: "compound",
                required: ["events_enabled", "minecraft:ender_dragon_event", "minecraft:pillager_patrols_event", "minecraft:wandering_trader_event"],
                properties: {
                    events_enabled: {
                        description: "1 or 0 (true/false) - true if the mob events can occur.",
                        type: "byte",
                    },
                    "minecraft:ender_dragon_event": {
                        description: "1 or 0 (true/false) - true if the [ender dragon](https://minecraft.wiki/w/ender dragon) can spawn.",
                        type: "byte",
                    },
                    "minecraft:pillager_patrols_event": {
                        description: "1 or 0 (true/false) - true if the [illager patrol](https://minecraft.wiki/w/illager patrol) can spawn.",
                        type: "byte",
                    },
                    "minecraft:wandering_trader_event": {
                        description: "1 or 0 (true/false) - true if the [wandering trader](https://minecraft.wiki/w/wandering trader) can spawn.",
                        type: "byte",
                    },
                },
                $fragment: false,
            },
            PlayerClient: {
                id: "PlayerClient",
                title: "The PlayerClient schema.",
                description: "The player client data.",
                type: "compound",
                properties: {
                    MsaId: {
                        type: "string",
                    },
                    SelfSignedId: {
                        type: "string",
                    },
                    ServerId: {
                        type: "string",
                    },
                },
                $fragment: false,
            },
            Portals: {
                id: "Portals",
                title: "The Portals schema.",
                description: "The portals data.",
                type: "compound",
                properties: {
                    data: {
                        type: "compound",
                        properties: {
                            PortalRecords: {
                                type: "list",
                                items: {
                                    type: "compound",
                                    properties: {
                                        DimId: {
                                            type: "int",
                                        },
                                        Span: {
                                            type: "byte",
                                        },
                                        TpX: {
                                            type: "int",
                                        },
                                        TpY: {
                                            type: "int",
                                        },
                                        TpZ: {
                                            type: "int",
                                        },
                                        Xa: {
                                            type: "byte",
                                        },
                                        Za: {
                                            type: "byte",
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                $fragment: false,
            },
            SchedulerWT: {
                id: "SchedulerWT",
                title: "The SchedulerWT schema.",
                description: "The schedulerWT data.",
                type: "compound",
                properties: {
                    daysSinceLastWTSpawn: {
                        type: "int",
                    },
                    isSpawningWT: {
                        type: "byte",
                    },
                    nextWTSpawnCheckTick: {
                        type: "long",
                    },
                },
                $fragment: false,
            },
            Scoreboard: {
                id: "Scoreboard",
                title: "The Scoreboard schema.",
                description: "NBT structure of [scoreboard](https://minecraft.wiki/w/scoreboard)s.",
                type: "compound",
                required: ["DisplayObjectives", "Entries", "Objectives"],
                properties: {
                    Criteria: {
                        type: "list",
                    },
                    DisplayObjectives: {
                        description: "A  list of compound tags representing specific displayed objectives.",
                        type: "list",
                        items: {
                            description: "A displayed objective.",
                            type: "compound",
                            required: ["Name", "ObjectiveName", "SortOrder"],
                            properties: {
                                Name: {
                                    description: "The **display slot** of this objective.",
                                    type: "string",
                                },
                                ObjectiveName: {
                                    description: "The internal **name** of the objective displayed.",
                                    type: "string",
                                },
                                SortOrder: {
                                    description:
                                        "The **sort order** of the objective displayed. 0 = `ascending`, 1 = `descending`. If not specified, or the **display slot** is `belowname`, 1 by default.",
                                    type: "byte",
                                },
                            },
                        },
                    },
                    Entries: {
                        description: "A list of compound tags representing individual entities.",
                        type: "list",
                        items: {
                            description: "An entity.",
                            type: "compound",
                            required: ["IdentityType", "EntityId", "PlayerId", "ScoreboardId"],
                            properties: {
                                IdentityType: {
                                    description: "The identity type of this entity. 1 = Players, 2 = Others.",
                                    type: "byte",
                                },
                                EntityId: {
                                    description: "Optional. The entity's Unique ID.",
                                    type: "long",
                                },
                                PlayerId: {
                                    description: "Optional. The player's Unique ID.",
                                    type: "long",
                                },
                                ScoreboardId: {
                                    description: "The numerical ID given to this entity on the scoreboard system, starting from 1.",
                                    type: "long",
                                },
                            },
                        },
                    },
                    Objectives: {
                        description: "A list of compound tags representing objectives.",
                        type: "list",
                        items: [
                            {
                                description: "An objective.",
                                type: "compound",
                                required: ["Criteria", "DisplayName", "Name", "Scores"],
                                properties: {
                                    Criteria: {
                                        description: "The **criterion** of this objective, currently, always `dummy`.",
                                        type: "string",
                                    },
                                    DisplayName: {
                                        description: "The **display name** of this objective.",
                                        type: "string",
                                    },
                                    Name: {
                                        description: "The internal **name** of this objective.",
                                        type: "string",
                                    },
                                    Scores: {
                                        description: "A list of compound tags representing scores tracked on this objective.",
                                        type: "list",
                                        items: {
                                            description: "A tracked entity with a score.",
                                            type: "compound",
                                            required: ["Score", "ScoreboardId"],
                                            properties: {
                                                Score: {
                                                    description: "The score this entity has on this objective.",
                                                    type: "int",
                                                },
                                                ScoreboardId: {
                                                    description: "The numerical ID given to this entity on the scoreboard system.",
                                                    type: "long",
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                            {
                                description: "The numerical ID given to the last entity added on the scoreboard system.",
                                type: "long",
                            },
                        ],
                    },
                },
                $fragment: false,
            },
            StructureTemplate: {
                id: "StructureTemplate",
                title: "The StructureTemplate schema.",
                type: "compound",
                required: ["structure", "size", "structure_world_origin", "format_version"],
                properties: {
                    structure: {
                        description: "The structure data.",
                        type: "compound",
                        required: ["palette", "block_indices", "entities"],
                        properties: {
                            palette: {
                                description: "The block palette.",
                                type: "compound",
                                required: ["default"],
                                properties: {
                                    default: {
                                        description: "The default block palette.",
                                        type: "compound",
                                        required: ["block_position_data", "block_palette"],
                                        properties: {
                                            block_position_data: {
                                                description: "The block entity data.",
                                                type: "compound",
                                                patternProperties: {
                                                    "[0-9]+": {
                                                        $ref: "BlockEntity",
                                                    },
                                                },
                                            },
                                            block_palette: {
                                                description: "The block palette.",
                                                type: "list",
                                                items: {
                                                    description: "The block palette array.",
                                                    $ref: "Block",
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                            block_indices: {
                                description: `The block indices.

These are two arrays of indices in the block palette.

The first layer is the block layer.

The second layer is the waterlog layer, even though it is mainly used for waterlogging, other blocks can be put here to,
which allows for putting two blocks in the same location, or creating ghost blocks (as blocks in this layer cannot be interacted with,
however when the corresponding block in the block layer is broken, this block gets moved to the block layer).`,
                                type: "list",
                                items: {
                                    description: "The layers.",
                                    type: "list",
                                    items: [
                                        {
                                            title: "Block Layer",
                                            description: "The block layer.",
                                            type: "list",
                                            items: {
                                                description: "A block index in this layer.",
                                                type: "int",
                                            },
                                        },
                                        {
                                            title: "Waterlog Layer",
                                            description: "The waterlog layer.",
                                            type: "list",
                                            items: {
                                                description: "A block index in this layer.",
                                                type: "int",
                                            },
                                        },
                                    ],
                                },
                            },
                            entities: {
                                description: "The list of entities in the structure.",
                                type: "list",
                                items: {
                                    $ref: "ActorPrefix",
                                },
                            },
                        },
                    },
                    size: {
                        description: "The size of the structure, as a tuple of 3 integers.",
                        type: "list",
                        items: [
                            {
                                title: "x",
                                description: "The size of the x axis.",
                                type: "int",
                                minimum: 0,
                            },
                            {
                                title: "y",
                                description: "The size of the y axis.",
                                type: "int",
                                minimum: 0,
                            },
                            {
                                title: "z",
                                description: "The size of the z axis.",
                                type: "int",
                                minimum: 0,
                            },
                        ],
                    },
                    structure_world_origin: {
                        description:
                            "The world origin of the structure, as a tuple of 3 integers.\n\nThis is used for entity and block entity data, to get relative positions.",
                        type: "list",
                        items: [
                            {
                                title: "x",
                                description: "The size of the x axis.",
                                type: "int",
                                minimum: 0,
                            },
                            {
                                title: "y",
                                description: "The size of the y axis.",
                                type: "int",
                                minimum: 0,
                            },
                            {
                                title: "z",
                                description: "The size of the z axis.",
                                type: "int",
                                minimum: 0,
                            },
                        ],
                    },
                    /**
                     * The format version of the structure.
                     */
                    format_version: {
                        description: "The format version of the structure.",
                        type: "int",
                        enum: [
                            {
                                type: "int",
                                value: 1,
                            },
                        ],
                    },
                },
            },
            TickingArea: {
                id: "TickingArea",
                title: "The TickingArea schema.",
                description: "The tickingarea data.",
                type: "compound",
                properties: {
                    Dimension: {
                        type: "int",
                    },
                    IsCircle: {
                        type: "byte",
                    },
                    MaxX: {
                        type: "int",
                    },
                    MaxZ: {
                        type: "int",
                    },
                    MinX: {
                        type: "int",
                    },
                    MinZ: {
                        type: "int",
                    },
                    Name: {
                        type: "string",
                    },
                    Preload: {
                        type: "byte",
                    },
                },
                $fragment: false,
            },
            VILLAGE_DWELLERS: {
                id: "VILLAGE_DWELLERS",
                title: "The VILLAGE_DWELLERS schema.",
                description: "The village dwellers data.",
                type: "compound",
                properties: {
                    Dwellers: {
                        type: "list",
                        items: {
                            type: "compound",
                            properties: {
                                actors: {
                                    type: "list",
                                    items: {
                                        type: "compound",
                                        properties: {
                                            ID: {
                                                type: "long",
                                            },
                                            last_saved_pos: {
                                                type: "list",
                                                items: [
                                                    {
                                                        type: "int",
                                                    },
                                                    {
                                                        type: "int",
                                                    },
                                                    {
                                                        type: "int",
                                                    },
                                                ],
                                            },
                                            TS: {
                                                type: "long",
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                $fragment: false,
            },
            VILLAGE_INFO: {
                id: "VILLAGE_INFO",
                title: "The VILLAGE_INFO schema.",
                description: "The village info data.",
                type: "compound",
                properties: {
                    BDTime: {
                        type: "long",
                    },
                    GDTime: {
                        type: "long",
                    },
                    Initialized: {
                        type: "byte",
                    },
                    MTick: {
                        type: "long",
                    },
                    PDTick: {
                        type: "long",
                    },
                    RX0: {
                        type: "int",
                    },
                    RX1: {
                        type: "int",
                    },
                    RY0: {
                        type: "int",
                    },
                    RY1: {
                        type: "int",
                    },
                    RZ0: {
                        type: "int",
                    },
                    RZ1: {
                        type: "int",
                    },
                    Tick: {
                        type: "long",
                    },
                    Version: {
                        type: "byte",
                    },
                    X0: {
                        type: "int",
                    },
                    X1: {
                        type: "int",
                    },
                    Y0: {
                        type: "int",
                    },
                    Y1: {
                        type: "int",
                    },
                    Z0: {
                        type: "int",
                    },
                    Z1: {
                        type: "int",
                    },
                },
                $fragment: false,
            },
            VILLAGE_PLAYERS: {
                id: "VILLAGE_PLAYERS",
                title: "The VILLAGE_PLAYERS schema.",
                description: "The village players data.",
                type: "compound",
                properties: {
                    Players: {
                        type: "list",
                    },
                },
                $fragment: false,
            },
            VILLAGE_POI: {
                id: "VILLAGE_POI",
                title: "The VILLAGE_POI schema.",
                description: "The village POIs data.",
                type: "compound",
                properties: {
                    POI: {
                        type: "list",
                        items: {
                            type: "compound",
                            properties: {
                                instances: {
                                    type: "list",
                                    items: {
                                        type: "compound",
                                        properties: {
                                            Capacity: {
                                                type: "long",
                                            },
                                            InitEvent: {
                                                type: "string",
                                            },
                                            Name: {
                                                type: "string",
                                            },
                                            OwnerCount: {
                                                type: "long",
                                            },
                                            Radius: {
                                                type: "float",
                                            },
                                            Skip: {
                                                type: "byte",
                                            },
                                            SoundEvent: {
                                                type: "string",
                                            },
                                            Type: {
                                                type: "int",
                                            },
                                            UseAABB: {
                                                type: "byte",
                                            },
                                            Weight: {
                                                type: "long",
                                            },
                                            X: {
                                                type: "int",
                                            },
                                            Y: {
                                                type: "int",
                                            },
                                            Z: {
                                                type: "int",
                                            },
                                        },
                                    },
                                },
                                VillagerID: {
                                    type: "long",
                                },
                            },
                        },
                    },
                },
                $fragment: false,
            },
            //#endregion
            //#region Schema Fragments
            Abilities: {
                id: "Abilities",
                description: "NBT structure of players' ability info.",
                type: "compound",
                required: ["abilities"],
                properties: {
                    abilities: {
                        description: "The player's ability setting.",
                        type: "compound",
                        required: [
                            "attackmobs",
                            "attackplayers",
                            "build",
                            "doorsandswitches",
                            "flying",
                            "flySpeed",
                            "instabuild",
                            "invulnerable",
                            "lightning",
                            "mayfly",
                            "mine",
                            "mute",
                            "noclip",
                            "op",
                            "opencontainers",
                            "permissionsLevel",
                            "playerPermissionsLevel",
                            "teleport",
                            "walkSpeed",
                            "worldbuilder",
                        ],
                        properties: {
                            attackmobs: {
                                description: "1 or 0 (true/false) - true if the player can attack mobs.",
                                type: "byte",
                            },
                            attackplayers: {
                                description: "1 or 0 (true/false) - true if the player can attack other players.",
                                type: "byte",
                            },
                            build: {
                                description: "1 or 0 (true/false) - true if the player can place blocks.",
                                type: "byte",
                            },
                            doorsandswitches: {
                                description: "1 or 0 (true/false) - true if the player is able to interact with redstone components.",
                                type: "byte",
                            },
                            flying: {
                                description: "1 or 0 (true/false) - true if the player is currently flying.",
                                type: "byte",
                            },
                            flySpeed: {
                                description: "The flying speed, always 0.05.",
                                type: "float",
                            },
                            instabuild: {
                                description: "1 or 0 (true/false) - true if the player can instantly destroy blocks.",
                                type: "byte",
                            },
                            invulnerable: {
                                description: "1 or 0 (true/false) - true if the player is immune to all damage and harmful effects.",
                                type: "byte",
                            },
                            lightning: {
                                description: "1 or 0 (true/false) - true if the player was struck by lightning.",
                                type: "byte",
                            },
                            mayfly: {
                                description: "1 or 0 (true/false) - true if the player can fly.",
                                type: "byte",
                            },
                            mine: {
                                description: "1 or 0 (true/false) - true if the player can destroy blocks.",
                                type: "byte",
                            },
                            mute: {
                                description: "1 or 0 (true/false) - true if the player messages cannot be seen by other players.",
                                type: "byte",
                            },
                            noclip: {
                                description: "1 or 0 (true/false) - true if the player can phase through blocks.",
                                type: "byte",
                            },
                            op: {
                                description: "1 or 0 (true/false) - true if the player has operator commands.",
                                type: "byte",
                            },
                            opencontainers: {
                                description: "1 or 0 (true/false) - true if the player is able to open containers.",
                                type: "byte",
                            },
                            permissionsLevel: {
                                description: "What permissions a player will default to, when joining a world.",
                                type: "int",
                            },
                            playerPermissionsLevel: {
                                description: "What permissions a player has.",
                                type: "int",
                            },
                            teleport: {
                                description: "1 or 0 (true/false) - true if the player is allowed to teleport.",
                                type: "byte",
                            },
                            walkSpeed: {
                                description: "The walking speed, always 0.1.",
                                type: "float",
                            },
                            worldbuilder: {
                                description: "1 or 0 (true/false) - true if the player is a world builder.",
                                type: "byte",
                            },
                        },
                    },
                },
                $fragment: true,
            },
            Attribute: {
                id: "Attribute",
                description: "NBT structure of an [attribute](https://minecraft.wiki/w/attribute).",
                type: "compound",
                required: ["Base", "Current", "DefaultMax", "DefaultMin", "Max", "Min", "Name"],
                properties: {
                    Base: {
                        description: "The base value of this Attribute.",
                        type: "float",
                    },
                    Current: {
                        description: "Unknown.",
                        type: "float",
                    },
                    DefaultMax: {
                        description: "Unknown.",
                        type: "float",
                    },
                    DefaultMin: {
                        description: "Unknown.",
                        type: "float",
                    },
                    Max: {
                        description: "Unknown.",
                        type: "float",
                    },
                    Min: {
                        description: "Unknown.",
                        type: "float",
                    },
                    Modifiers: {
                        description: "(May not exist) List of [Modifiers](https://minecraft.wiki/w/Attribute#Modifiers).",
                        type: "list",
                        items: {
                            description: "An individual Modifier.",
                            type: "compound",
                            $ref: "AttributeModifier",
                        },
                    },
                    Name: {
                        description: "The name of this Attribute.",
                        type: "string",
                    },
                    TemporalBuffs: {
                        description: "(May not exist) Unknown.",
                        type: "list",
                        items: [
                            {
                                description: "Unknown.",
                                type: "float",
                            },
                            {
                                description: "Unknown.",
                                type: "int",
                            },
                            {
                                description: "Unknown.",
                                type: "int",
                            },
                            {
                                description: "Unknown.",
                                type: "int",
                            },
                        ],
                    },
                },
                $fragment: true,
            },
            Attributes: {
                id: "Attributes",
                description: "List of [attribute](https://minecraft.wiki/w/attribute)s.",
                type: "list",
                items: {
                    description: "An attribute.",
                    type: "compound",
                    $ref: "Attribute",
                },
                $fragment: true,
            },
            AttributeModifier: {
                id: "AttributeModifier",
                description: "NBT structure of an attribute [modifier](https://minecraft.wiki/w/modifier).",
                type: "compound",
                required: ["Amount", "Name", "Operand", "Operation", "UUIDLeast", "UUIDMost"],
                properties: {
                    Amount: {
                        description: "The amount by which this Modifier modifies the Base value in calculations.",
                        type: "float",
                    },
                    Name: {
                        description: "The Modifier's name.",
                        type: "string",
                    },
                    Operand: {
                        description: "Unknown.",
                        type: "int",
                    },
                    Operation: {
                        description:
                            "Defines the operation this Modifier executes on the Attribute's Base value. 0: Increment X by Amount, 1: Increment Y by X * Amount, 2: Y = Y * (1 + Amount) (equivalent to Increment Y by Y * Amount).*needs testing*",
                        type: "int",
                    },
                    UUIDLeast: {
                        description: "This modifier's UUID Least.",
                        type: "long",
                    },
                    UUIDMost: {
                        description: "This modifier's UUID Most.",
                        type: "long",
                    },
                },
                $fragment: true,
            },
            Block: {
                id: "Block",
                title: "The Block schema.",
                description: "NBT structure of a [block](https://minecraft.wiki/w/block).",
                type: "compound",
                required: ["name", "states", "version"],
                properties: {
                    name: {
                        description: "The namespaced ID of this block.",
                        type: "string",
                    },
                    states: {
                        description: "The block states of the block.",
                        type: "compound",
                        additionalProperties: true,
                    },
                    version: {
                        description: "The data version.",
                        type: "int",
                        examples: [
                            { type: "int", value: 18163713 },
                            { type: "int", value: 18168865 },
                        ],
                    },
                },
                $fragment: true,
            },
            CommandBlock: {
                id: "CommandBlock",
                description:
                    "NBT structure of [command block](https://minecraft.wiki/w/command block) and [minecart with command block](https://minecraft.wiki/w/minecart with command block).",
                type: "compound",
                required: [
                    "Command",
                    "CustomName",
                    "ExecuteOnFirstTick",
                    "LastExecution",
                    "LastOutput",
                    "LastOutputParams",
                    "SuccessCount",
                    "TickDelay",
                    "TrackOutput",
                    "Version",
                ],
                properties: {
                    Command: {
                        description: "The command entered into the command block.",
                        type: "string",
                    },
                    CustomName: {
                        description: "The custom name or hover text of this command block.",
                        type: "string",
                    },
                    ExecuteOnFirstTick: {
                        description: "1 or 0 (true/false) - true if it executes on the first tick once saved or activated.",
                        type: "byte",
                    },
                    LastExecution: {
                        description: "Stores the time when a command block was last executed.",
                        type: "long",
                    },
                    LastOutput: {
                        description:
                            "The translation key of the output's last line generated by the command block. Still stored even if the [gamerule](https://minecraft.wiki/w/gamerule) commandBlockOutput is false. Appears in the command GUI.",
                        type: "string",
                    },
                    LastOutputParams: {
                        description: "The params for the output's translation key.",
                        type: "list",
                        items: {
                            description: "A param.",
                            type: "string",
                        },
                    },
                    SuccessCount: {
                        description: "Represents the strength of the analog signal output by redstone comparators attached to this command block.",
                        type: "int",
                    },
                    TickDelay: {
                        description: "The delay between each execution.",
                        type: "int",
                    },
                    TrackOutput: {
                        description:
                            '1 or 0 (true/false) - true if the `LastOutput` is stored. Can be toggled in the GUI by clicking a button near the "Previous Output" textbox.',
                        type: "byte",
                    },
                    Version: {
                        description: "The data version.",
                        type: "int",
                    },
                },
                $fragment: true,
            },
            FireworkExplosion: {
                id: "FireworkExplosion",
                description: "NBT structure of [firework](https://minecraft.wiki/w/firework) and [firework star](https://minecraft.wiki/w/firework star).",
                type: "compound",
                required: ["FireworkColor", "FireworkFade", "FireworkFlicker", "FireworkTrail", "FireworkType"],
                properties: {
                    FireworkColor: {
                        description: "Array of byte values corresponding to the primary colors of this firework's explosion.",
                        type: "byteArray",
                    },
                    FireworkFade: {
                        description: "Array of byte values corresponding to the fading colors of this firework's explosion.",
                        type: "byteArray",
                    },
                    FireworkFlicker: {
                        description: "1 or 0 (true/false) - true if this explosion has the twinkle effect (glowstone dust).",
                        type: "byte",
                    },
                    FireworkTrail: {
                        description: "1 or 0 (true/false) - true if this explosion has the trail effect (diamond).",
                        type: "byte",
                    },
                    FireworkType: {
                        description:
                            "The shape of this firework's explosion. 0 = Small Ball, 1 = Large Ball, 2 = Star-shaped, 3 = Creeper-shaped, and 4 = Burst.*needs testing*",
                        type: "byte",
                    },
                },
                $fragment: true,
            },
            MobEffect: {
                id: "MobEffect",
                description: "NBT structure of a [status effect](https://minecraft.wiki/w/status effect).",
                type: "compound",
                required: [
                    "Ambient",
                    "Amplifier",
                    "DisplayOnScreenTextureAnimation",
                    "Duration",
                    "DurationEasy",
                    "DurationHard",
                    "DurationNormal",
                    "Id",
                    "ShowParticles",
                ],
                properties: {
                    Ambient: {
                        description: "1 or 0 (true/false) - true if this effect is provided by a beacon and therefore should be less intrusive on screen.",
                        type: "byte",
                    },
                    Amplifier: {
                        description: "The potion effect level. 0 is level 1.",
                        type: "byte",
                    },
                    DisplayOnScreenTextureAnimation: {
                        description: "Unknown.",
                        type: "byte",
                    },
                    Duration: {
                        description: "The number of ticks before the effect wears off.",
                        type: "int",
                    },
                    DurationEasy: {
                        description: "Duration for Easy mode.",
                        type: "int",
                    },
                    DurationHard: {
                        description: "Duration for Hard mode.",
                        type: "int",
                    },
                    DurationNormal: {
                        description: "Duration for Normal mode.",
                        type: "int",
                    },
                    FactorCalculationData: {
                        type: "compound",
                        properties: {
                            change_timestamp: {
                                type: "int",
                            },
                            factor_current: {
                                type: "float",
                            },
                            factor_previous: {
                                type: "float",
                            },
                            factor_start: {
                                type: "float",
                            },
                            factor_target: {
                                type: "float",
                            },
                            had_applied: {
                                type: "byte",
                            },
                            had_last_tick: {
                                type: "byte",
                            },
                            padding_duration: {
                                type: "int",
                            },
                        },
                    },
                    Id: {
                        description: "The numerical effect ID.",
                        type: "byte",
                    },
                    ShowParticles: {
                        description: "1 or 0 (true/false) - true if particles are shown.",
                        type: "byte",
                    },
                },
                $fragment: true,
            },
            MonsterSpawner: {
                id: "MonsterSpawner",
                description: "NBT structure of a [monster spawner](https://minecraft.wiki/w/monster spawner).",
                type: "compound",
                required: [
                    "Delay",
                    "DisplayEntityHeight",
                    "DisplayEntityScale",
                    "DisplayEntityWidth",
                    "EntityIdentifier",
                    "MaxNearbyEntities",
                    "MaxSpawnDelay",
                    "MinSpawnDelay",
                    "RequiredPlayerRange",
                    "SpawnCount",
                    "SpawnRange",
                ],
                properties: {
                    Delay: {
                        description: "Ticks until next spawn. If 0, it spawns immediately when a player enters its range.",
                        type: "short",
                    },
                    DisplayEntityHeight: {
                        description: "The height of entity model that displayed in the block.",
                        type: "float",
                    },
                    DisplayEntityScale: {
                        description: "The scale of entity model that displayed in the block.",
                        type: "float",
                    },
                    DisplayEntityWidth: {
                        description: "The width of entity model that displayed in the block.",
                        type: "float",
                    },
                    EntityIdentifier: {
                        description: "The id of the entity to be summoned.more info",
                        type: "string",
                    },
                    MaxNearbyEntities: {
                        description:
                            "The maximum number of nearby (within a box of `SpawnRange`*2+1 × `SpawnRange`*2+1 × 8 centered around the spawner block *needs testing*) entities whose IDs match this spawner's entity ID.",
                        type: "short",
                    },
                    MaxSpawnDelay: {
                        description: "The maximum random delay for the next spawn delay.",
                        type: "short",
                    },
                    MinSpawnDelay: {
                        description: "The minimum random delay for the next spawn delay.",
                        type: "short",
                    },
                    RequiredPlayerRange: {
                        description: "Overrides the block radius of the sphere of activation by players for this spawner.",
                        type: "short",
                    },
                    SpawnCount: {
                        description: "How many mobs to attempt to spawn each time.",
                        type: "short",
                    },
                    SpawnData: {
                        description: "(May not exist) Contains tags to copy to the next spawned entity(s) after spawning.",
                        type: "compound",
                        required: ["Properties", "TypeId", "Weight"],
                        properties: {
                            Properties: {
                                description: "Unknown.",
                                type: "compound",
                            },
                            TypeId: {
                                description: "The entity's namespaced ID.",
                                type: "string",
                            },
                            Weight: {
                                description: "Unknown.",
                                type: "int",
                            },
                        },
                    },
                    SpawnPotentials: {
                        description: "(May not exist) List of possible entities to spawn.",
                        type: "list",
                        items: {
                            description: "A potential future spawn.",
                            type: "compound",
                            required: ["Properties", "TypeId", "Weight"],
                            properties: {
                                Properties: {
                                    description: "Unknown.",
                                    type: "compound",
                                },
                                TypeId: {
                                    description: "The entity's namespaced ID.",
                                    type: "string",
                                },
                                Weight: {
                                    description:
                                        "The chance that this spawn gets picked in comparison to other spawn weights. Must be positive and at least 1.",
                                    type: "int",
                                },
                            },
                        },
                    },
                    SpawnRange: {
                        description:
                            "The radius around which the spawner attempts to place mobs randomly. The spawn area is square, includes the block the spawner is in, and is centered around the spawner's x,z coordinates - not the spawner itself.*needs testing* Default value is 4.",
                        type: "short",
                    },
                },
                $fragment: true,
            },
            //#endregion
            //#region Entity NBT Schemas
            Entity_Minecart: {
                id: "Entity_Minecart",
                description: "Minecart entities include.",
                type: "compound",
                required: ["CustomDisplayTile"],
                properties: {
                    CustomDisplayTile: {
                        description: "1 or 0 (true/false) - (may not exist) if is displayed the custom tile in this minecart.",
                        type: "byte",
                    },
                    DisplayBlock: {
                        description: "(May not exist) The custom block in the minecart.",
                        type: "compound",
                        $ref: "Block",
                    },
                    DisplayOffset: {
                        description:
                            "(May not exist) The offset of the block displayed in the Minecart in pixels. Positive values move the block upwards, while negative values move it downwards. A value of 16 moves the block up by exactly one multiple of its height.*needs testing*",
                        type: "int",
                    },
                },
                $fragment: false,
            },
            Entity_Villagers: {
                id: "Entity_Villagers",
                description: "Villager entities include.",
                type: "compound",
                required: ["Willing"],
                properties: {
                    Willing: {
                        description:
                            "1 or 0 (true/false) - true if the villager is willing to mate. Becomes true after certain trades (those that would cause offers to be refreshed), and false after mating.",
                        type: "byte",
                    },
                },
                $fragment: false,
            },
            Entity_Monster: {
                id: "Entity_Monster",
                description: "Monster entities include.",
                type: "compound",
                required: ["SpawnedByNight"],
                properties: {
                    SpawnedByNight: {
                        description: "1 or 0 (true/false) - true if is spawned by night.more info",
                        type: "byte",
                    },
                },
                $fragment: false,
            },
            Entity_HumanoidMonster: {
                id: "Entity_HumanoidMonster",
                description: "Humanoid monster entities include.",
                type: "compound",
                properties: {
                    ItemInHand: {
                        description: "(May not exist) The items in the entity's hand.",
                        type: "compound",
                        $ref: "Item_ItemStack",
                    },
                },
                $fragment: false,
            },
            Entity_Mob: {
                id: "Entity_Mob",
                description: "Mob entities include.",
                type: "compound",
                required: [
                    "Air",
                    "Armor",
                    "AttackTime",
                    "Attributes",
                    "boundX",
                    "boundY",
                    "boundZ",
                    "canPickupItems",
                    "Dead",
                    "DeathTime",
                    "hasBoundOrigin",
                    "hasSetCanPickupItems",
                    "HurtTime",
                    "LeasherID",
                    "limitedLife",
                    "Mainhand",
                    "NaturalSpawn",
                    "Offhand",
                    "Surface",
                    "TargetID",
                ],
                properties: {
                    ActiveEffects: {
                        description: "(May not exist) The list of potion effects on this mob.",
                        type: "list",
                        items: {
                            description: "An effect.",
                            type: "compound",
                            $ref: "MobEffect",
                        },
                    },
                    Air: {
                        description: "How much air the living entity has, in ticks.",
                        type: "short",
                    },
                    Armor: {
                        description: "The list of items the mob is wearing as armor.",
                        type: "list",
                        items: [
                            {
                                description: "The item on the head.",
                                type: "compound",
                                $ref: "Item_ItemStack",
                            },
                            {
                                description: "The item on the chest.",
                                type: "compound",
                                $ref: "Item_ItemStack",
                            },
                            {
                                description: "The item on the legs.",
                                type: "compound",
                                $ref: "Item_ItemStack",
                            },
                            {
                                description: "The item on the feets.",
                                type: "compound",
                                $ref: "Item_ItemStack",
                            },
                        ],
                    },
                    AttackTime: {
                        description: "Number of ticks the mob attacks for. 0 when not attacking.",
                        type: "short",
                    },
                    Attributes: {
                        description:
                            "A list of [Attribute](https://minecraft.wiki/w/Attribute)s for this mob. These are used for many purposes in internal calculations. Valid Attributes for a given mob are listed in the [main article](https://minecraft.wiki/w/Attribute).",
                        type: "list",
                        items: {
                            description: "An Attribute.",
                            type: "compound",
                            $ref: "Attribute",
                        },
                    },
                    BodyRot: {
                        description: "(May not exist) Unknown.",
                        type: "float",
                    },
                    boundX: {
                        description: "X of the bound origin.",
                        type: "int",
                    },
                    boundY: {
                        description: "Y of the bound origin.",
                        type: "int",
                    },
                    boundZ: {
                        description: "Z of the bound origin.",
                        type: "int",
                    },
                    canPickupItems: {
                        description: "1 or 0 (true/false) - true if this entity can pick up items.",
                        type: "byte",
                    },
                    Dead: {
                        description: "1 or 0 (true/false) - true if dead.",
                        type: "byte",
                    },
                    DeathTime: {
                        description: "Number of ticks the mob has been dead for. Controls death animations. 0 when alive.",
                        type: "short",
                    },
                    hasBoundOrigin: {
                        description:
                            "1 or 0 (true/false) - if this mob has bound origin. Only *needs testing* effects [Vex](https://minecraft.wiki/w/Vex). When a vex is idle, it wanders, selecting air blocks from within a 15×11×15 *needs testing* cuboid range centered at BoundX, BoundY, BoundZ. when it summoned the vex, this value is set to true, and the central spot is the location of the evoker. Or if an evoker was not involved, this value is false.",
                        type: "byte",
                    },
                    hasSetCanPickupItems: {
                        description: "1 or 0 (true/false) - true if `canPickupItems` has been set by the game.",
                        type: "byte",
                    },
                    HurtTime: {
                        description: "Number of ticks the mob turns red for after being hit. 0 when not recently hit.",
                        type: "short",
                    },
                    LeasherID: {
                        description: "The Unique ID of an entity that is leashing it with a lead. Set to -1 if there's no leasher.",
                        type: "long",
                    },
                    limitedLife: {
                        description:
                            "The left time in ticks until this entity disapears. Only *needs testing* effects [Evoker Fang](https://minecraft.wiki/w/Evoker Fang)s. For other entities, it is set to 0.",
                        type: "long",
                    },
                    Mainhand: {
                        description: "The item being held in the mob's main hand.",
                        type: "list",
                        items: {
                            description: "The item.",
                            type: "compound",
                            $ref: "Item_ItemStack",
                        },
                    },
                    NaturalSpawn: {
                        description: "1 or 0 (true/false) - true if it is naturally spawned.",
                        type: "byte",
                    },
                    Offhand: {
                        description: "The item being held in the mob's off hand.",
                        type: "list",
                        items: {
                            description: "The item.",
                            type: "compound",
                            $ref: "Item_ItemStack",
                        },
                    },
                    persistingOffers: {
                        description: "(May not exist) Unknown.",
                        type: "compound",
                    },
                    persistingRiches: {
                        description: "(May not exist) Unknown.",
                        type: "int",
                    },
                    Surface: {
                        description: "1 or 0 (true/false) - true if it is naturally spawned on the surface.",
                        type: "byte",
                    },
                    TargetCaptainID: {
                        description: "(May not exist) The Unique ID of a captain to follow. Used by pillager and vindicator.",
                        type: "long",
                    },
                    TargetID: {
                        description: "The Unique ID of an entity that this entity is angry at.",
                        type: "long",
                    },
                    TradeExperience: {
                        description: "(May not exist) Trade experiences of this trader entity.",
                        type: "int",
                    },
                    TradeTier: {
                        description: "(May not exist) Trade tier of this trader entity.",
                        type: "int",
                    },
                    WantsToBeJockey: {
                        description: "(May not exist) unknown.",
                        type: "byte",
                    },
                },
                $fragment: false,
            },
            Entity_AbstractArrow: {
                id: "Entity_AbstractArrow",
                description: "Abstract arrow entities include.",
                type: "compound",
                required: ["isCreative", "OwnerID", "player"],
                properties: {
                    isCreative: {
                        description: "1 or 0 (true/false) - true if its owner is a player in Creative mode.",
                        type: "byte",
                    },
                    OwnerID: {
                        description: "The Unique ID of the entity this projectile was thrown by. Set to -1 if it has no owner.",
                        type: "long",
                    },
                    player: {
                        description: "1 or 0 (true/false) - true if its owner is a player.",
                        type: "byte",
                    },
                },
                $fragment: false,
            },
            Entity_Throwable: {
                id: "Entity_Throwable",
                description: "Throwable entities include.",
                type: "compound",
                required: ["inGround", "OwnerID", "shake"],
                properties: {
                    inGround: {
                        description: "Unknown.",
                        type: "byte",
                    },
                    OwnerID: {
                        description: "The Unique ID of the entity this projectile was thrown by.",
                        type: "long",
                    },
                    shake: {
                        description: "Unknown.",
                        type: "byte",
                    },
                },
                $fragment: false,
            },
            Entity_Allay: {
                id: "Entity_Allay",
                description: "Additional fields for [allay](https://minecraft.wiki/w/allay).",
                type: "compound",
                required: ["AllayDuplicationCooldown", "VibrationListener"],
                properties: {
                    AllayDuplicationCooldown: {
                        description: "The allay's duplication cooldown in ticks. This is set to 6000 ticks (5 minutes) when the allay duplicates.",
                        type: "long",
                    },
                    VibrationListener: {
                        description: "The vibration event listener of this allay.",
                        type: "compound",
                        required: ["event", "pending", "selector", "ticks"],
                        properties: {
                            event: {
                                description: "Unknown.",
                                type: "int",
                            },
                            pending: {
                                description: "Unknown.",
                                type: "compound",
                                required: ["distance", "source", "vibration", "x", "y", "z"],
                                properties: {
                                    distance: {
                                        description: "Unknown.",
                                        type: "float",
                                    },
                                    source: {
                                        description: "Unknown.",
                                        type: "long",
                                    },
                                    vibration: {
                                        description: "Unknown.",
                                        type: "int",
                                    },
                                    x: {
                                        description: "Unknown.",
                                        type: "int",
                                    },
                                    y: {
                                        description: "Unknown.",
                                        type: "int",
                                    },
                                    z: {
                                        description: "Unknown.",
                                        type: "int",
                                    },
                                },
                            },
                            selector: {
                                description: "Unknown.",
                                type: "compound",
                            },
                            ticks: {
                                description: "Unknown.",
                                type: "int",
                            },
                        },
                    },
                },
                allOf: [
                    {
                        $ref: "Component_Inventory",
                    },
                ],
                $fragment: false,
            },
            Entity_AreaEffectCloud: {
                id: "Entity_AreaEffectCloud",
                description: "Additional fields for [area effect cloud](https://minecraft.wiki/w/area effect cloud).",
                type: "compound",
                required: [
                    "Duration",
                    "DurationOnUse",
                    "InitialRadius",
                    "mobEffects",
                    "OwnerId",
                    "ParticleColor",
                    "ParticleId",
                    "PickupCount",
                    "PotionId",
                    "Radius",
                    "RadiusChangeOnPickup",
                    "RadiusOnUse",
                    "RadiusPerTick",
                    "ReapplicationDelay",
                    "SpawnTick",
                ],
                properties: {
                    Duration: {
                        description: "The maximum age of the field.",
                        type: "int",
                    },
                    DurationOnUse: {
                        description: "The amount the duration of the field changes upon applying the effect.",
                        type: "int",
                    },
                    InitialRadius: {
                        description: "The field's initial radius.",
                        type: "float",
                    },
                    mobEffects: {
                        description: "A list of the applied [effect](https://minecraft.wiki/w/effect)s.",
                        type: "list",
                        items: {
                            $ref: "MobEffect",
                        },
                    },
                    OwnerId: {
                        description: "The Unique ID of the entity who created the cloud. If it has no owner, defaults to -1.",
                        type: "long",
                    },
                    ParticleColor: {
                        description: "The color of the particles.",
                        type: "int",
                    },
                    ParticleId: {
                        description: "The particles displayed by the field.",
                        type: "int",
                    },
                    PickupCount: {
                        description: "How many [dragon's breath](https://minecraft.wiki/w/dragon's breath) can be picked up.",
                        type: "int",
                    },
                    PotionId: {
                        description:
                            "The name of the default potion effect. See [potion data values](https://minecraft.wiki/w/potion#Item data) for valid IDs.",
                        type: "short",
                    },
                    Radius: {
                        description: "The field's current radius.",
                        type: "float",
                    },
                    RadiusChangeOnPickup: {
                        description: "The amount the radius changes when picked up by a glass bottle.",
                        type: "float",
                    },
                    RadiusOnUse: {
                        description: "The amount the radius changes upon applying the effect. Normally negative.",
                        type: "float",
                    },
                    RadiusPerTick: {
                        description: "The amount the radius changes per tick. Normally negative.",
                        type: "float",
                    },
                    ReapplicationDelay: {
                        description: "The number of ticks before reapplying the effect.",
                        type: "int",
                    },
                    SpawnTick: {
                        description: "The time when it was spawned.",
                        type: "long",
                    },
                },
                $fragment: false,
            },
            Entity_Armadillo: {
                id: "Entity_Armadillo",
                description: "Additional fields for [armadillo](https://minecraft.wiki/w/armadillo).",
                type: "compound",
                required: ["properties"],
                properties: {
                    properties: {
                        description: "The armadillo `properties`.",
                        type: "compound",
                        required: ["minecraft:is_rolled_up", "minecraft:is_threatened", "minecraft:is_trying_to_relax"],
                        properties: {
                            "minecraft:is_rolled_up": {
                                description: "1 or 0 (true/false) - true if the armadillo is rolled up.",
                                type: "byte",
                            },
                            "minecraft:is_threatened": {
                                description: "1 or 0 (true/false) - true if the armadillo was hit.",
                                type: "byte",
                            },
                            "minecraft:is_trying_to_relax": {
                                description: "1 or 0 (true/false) -  *info needed*.",
                                type: "byte",
                            },
                        },
                    },
                },
                allOf: [
                    {
                        $ref: "Component_Ageable",
                    },
                ],
                $fragment: false,
            },
            Entity_ArmorStand: {
                id: "Entity_ArmorStand",
                description: "Additional fields for [armor stand](https://minecraft.wiki/w/armor stand).",
                type: "compound",
                required: ["Pose"],
                properties: {
                    Pose: {
                        description: "The ArmorStand's pose.",
                        type: "compound",
                        required: ["LastSignal", "PoseIndex"],
                        properties: {
                            LastSignal: {
                                description: "The redstone signal level it received.",
                                type: "int",
                            },
                            PoseIndex: {
                                description: "The index of current pose.",
                                type: "int",
                            },
                        },
                    },
                },
                $fragment: false,
            },
            Entity_Arrow: {
                id: "Entity_Arrow",
                description: "Additional fields for [arrow](https://minecraft.wiki/w/arrow).",
                type: "compound",
                required: ["auxValue", "enchantFlame", "enchantInfinity", "mobEffects", "enchantPower", "enchantPunch"],
                properties: {
                    auxValue: {
                        description: "The metadata of this arrow. See [Arrow#Metadata](https://minecraft.wiki/w/Arrow#Metadata).",
                        type: "byte",
                    },
                    enchantFlame: {
                        description:
                            "The level of [Flame](https://minecraft.wiki/w/Flame) enchantment on the bow that shot this arrow, where 1 is level 1. 0 if no Flame enchantment.",
                        type: "byte",
                    },
                    enchantInfinity: {
                        description:
                            "The level of [Infinity](https://minecraft.wiki/w/Infinity) enchantment on the bow that shot this arrow, where 1 is level 1. 0 if no Infinity enchantment.",
                        type: "byte",
                    },
                    mobEffects: {
                        description: "Effects on a tipped arrow.",
                        type: "list",
                        items: {
                            description: "An effect.",
                            type: "compound",
                            $ref: "MobEffect",
                        },
                    },
                    enchantPower: {
                        description:
                            "The level of [Power](https://minecraft.wiki/w/Power) enchantment on the bow that shot this arrow, where 1 is level 1. 0 if no Power enchantment.",
                        type: "byte",
                    },
                    enchantPunch: {
                        description:
                            "The level of [Punch](https://minecraft.wiki/w/Punch) enchantment on the bow that shot this arrow, where 1 is level 1. 0 if no Punch enchantment.",
                        type: "byte",
                    },
                },
                allOf: [
                    {
                        $ref: "Component_Projectile",
                    },
                ],
                $fragment: false,
            },
            Entity_Axolotl: {
                id: "Entity_Axolotl",
                description: "Additional fields for [axolotl](https://minecraft.wiki/w/axolotl).",
                type: "compound",
                required: ["TicksRemainingUntilDryOut"],
                properties: {
                    DamageTime: {
                        description: "(May not exist) Applies a defined amount of damage to the axolotl at specified intervals.",
                        type: "short",
                    },
                    TicksRemainingUntilDryOut: {
                        description:
                            "Number of ticks until the axolotl dies when it is on the surface. Initially starts at 6000 ticks (5 minutes) and counts down to 0.",
                        type: "int",
                    },
                },
                allOf: [
                    {
                        $ref: "Component_Ageable",
                    },
                ],
                $fragment: false,
            },
            Entity_Bat: {
                id: "Entity_Bat",
                description: "Additional fields for [bat](https://minecraft.wiki/w/bat).",
                type: "compound",
                required: ["BatFlags"],
                properties: {
                    BatFlags: {
                        description: "1 when hanging upside down and 0 when flying.More info",
                        type: "byte",
                    },
                },
                $fragment: false,
            },
            Entity_Bee: {
                id: "Entity_Bee",
                description: "Additional fields for [bee](https://minecraft.wiki/w/bee).",
                type: "compound",
                required: ["properties"],
                properties: {
                    properties: {
                        description: "The bee `properties`.",
                        type: "compound",
                        required: ["minecraft:has_nectar"],
                        properties: {
                            "minecraft:has_nectar": {
                                description: "1 or 0 (true/false) - true if the bee is carrying pollen.",
                                type: "byte",
                            },
                        },
                    },
                },
                allOf: [
                    {
                        $ref: "Component_Ageable",
                    },
                ],
                $fragment: false,
            },
            Entity_BoatWithChest: {
                id: "Entity_BoatWithChest",
                description: "Additional fields for [boat with chest](https://minecraft.wiki/w/boat with chest).",
                type: "compound",
                $ref: "Component_Inventory",
                $fragment: false,
            },
            Entity_Breeze: {
                id: "Entity_Breeze",
                description: "Additional fields for [breeze](https://minecraft.wiki/w/breeze).",
                type: "compound",
                required: ["properties"],
                properties: {
                    properties: {
                        description: "The breeze `properties`.",
                        type: "compound",
                        required: ["minecraft:is_playing_idle_ground_sound"],
                        properties: {
                            "minecraft:is_playing_idle_ground_sound": {
                                description: "1 or 0 (true/false) - true if the breeze is playing the `mob.breeze.idle_ground` sound.",
                                type: "byte",
                            },
                        },
                    },
                },
                $fragment: false,
            },
            Entity_Camel: {
                id: "Entity_Camel",
                description: "Additional fields for [camel](https://minecraft.wiki/w/camel).",
                type: "compound",
                $ref: "Component_Ageable",
                $fragment: false,
            },
            Entity_Cat: {
                id: "Entity_Cat",
                description: "Additional fields for [cat](https://minecraft.wiki/w/cat).",
                type: "compound",
                $ref: "Component_Ageable",
                $fragment: false,
            },
            Entity_Chicken: {
                id: "Entity_Chicken",
                description: "Additional fields for [chicken](https://minecraft.wiki/w/chicken).",
                type: "compound",
                properties: {
                    entries: {
                        type: "list",
                        items: {
                            description: "An entry.",
                            type: "compound",
                            required: ["SpawnTimer", "StopSpawning"],
                            properties: {
                                SpawnTimer: {
                                    description: "Unknown.",
                                    type: "int",
                                },
                                StopSpawning: {
                                    description: "Unknown.",
                                    type: "byte",
                                },
                            },
                        },
                    },
                },
                allOf: [
                    {
                        $ref: "Component_Ageable",
                    },
                ],
                $fragment: false,
            },
            Entity_Cow: {
                id: "Entity_Cow",
                description: "Additional fields for [cow](https://minecraft.wiki/w/cow).",
                type: "compound",
                $ref: "Component_Ageable",
                $fragment: false,
            },
            Entity_Creeper: {
                id: "Entity_Creeper",
                description: "Additional fields for [creeper](https://minecraft.wiki/w/creeper).",
                type: "compound",
                $ref: "Component_Explode",
                $fragment: false,
            },
            Entity_Dolphin: {
                id: "Entity_Dolphin",
                description: "Additional fields for [dolphin](https://minecraft.wiki/w/dolphin).",
                type: "compound",
                required: ["BribeTime", "TicksRemainingUntilDryOut"],
                properties: {
                    BribeTime: {
                        description: "Unknown.",
                        type: "int",
                    },
                    DamageTime: {
                        description: "(May not exist) Applies a defined amount of damage to the dolphin at specified intervals.",
                        type: "short",
                    },
                    TicksRemainingUntilDryOut: {
                        description:
                            "Number of ticks until the dolphin dies when it is on the surface. Initially starts at 2400 ticks (2 minutes) and counts down to 0.",
                        type: "int",
                    },
                },
                allOf: [
                    {
                        $ref: "Component_Ageable",
                    },
                ],
                $fragment: false,
            },
            Entity_Donkey: {
                id: "Entity_Donkey",
                description: "Additional fields for [donkey](https://minecraft.wiki/w/donkey).",
                type: "compound",
                required: ["Temper"],
                properties: {
                    Temper: {
                        description:
                            "Random number that ranges from 0 to 100; increases with feeding or trying to tame it. Higher values make the donkey easier to tame.",
                        type: "int",
                    },
                },
                allOf: [
                    {
                        $ref: "Component_Ageable",
                    },
                ],
                $fragment: false,
            },
            Entity_Egg: {
                id: "Entity_Egg",
                description: "Additional fields for [egg](https://minecraft.wiki/w/egg).",
                type: "compound",
                $ref: "Component_Projectile",
                $fragment: false,
            },
            Entity_EnderCrystal: {
                id: "Entity_EnderCrystal",
                description: "Additional fields for [ender crystal](https://minecraft.wiki/w/ender crystal).",
                type: "compound",
                properties: {
                    BlockTargetX: {
                        description: "(May not exist) The block location its beam points to.",
                        type: "int",
                    },
                    BlockTargetY: {
                        description: "(May not exist) See above.",
                        type: "int",
                    },
                    BlockTargetZ: {
                        description: "(May not exist) See above.",
                        type: "int",
                    },
                },
                allOf: [
                    {
                        $ref: "Component_Explode",
                    },
                ],
                $fragment: false,
            },
            Entity_Enderman: {
                id: "Entity_Enderman",
                description: "Additional fields for [enderman](https://minecraft.wiki/w/enderman).",
                type: "compound",
                required: ["carriedBlock"],
                properties: {
                    carriedBlock: {
                        description: "The block carried by the enderman.",
                        type: "compound",
                        $ref: "Block",
                    },
                },
                $fragment: false,
            },
            Entity_Endermite: {
                id: "Entity_Endermite",
                description: "Additional fields for [endermite](https://minecraft.wiki/w/endermite).",
                type: "compound",
                required: ["Lifetime"],
                properties: {
                    Lifetime: {
                        description: "How long the endermite has existed in ticks. Disappears when this reaches around 2400.",
                        type: "int",
                    },
                },
                $fragment: false,
            },
            Entity_Evoker: {
                id: "Entity_Evoker",
                description: "Additional fields for [evoker](https://minecraft.wiki/w/evoker).",
                type: "compound",
                $ref: "Component_Dweller",
                $fragment: false,
            },
            Entity_ExperienceOrb: {
                id: "Entity_ExperienceOrb",
                description: "Additional fields for [experience orb](https://minecraft.wiki/w/experience orb).",
                type: "compound",
                required: ["Age", "experience value"],
                properties: {
                    Age: {
                        description: 'The number of ticks the XP orb has been "untouched". After 6000 ticks (5 minutes) the orb is destroyed.*needs testing*',
                        type: "short",
                    },
                    "experience value": {
                        description: "The amount of experience the orb gives when picked up.",
                        type: "int",
                    },
                },
                $fragment: false,
            },
            Entity_ExperiencePotion: {
                id: "Entity_ExperiencePotion",
                description: "Additional fields for [experience potion](https://minecraft.wiki/w/experience potion).",
                type: "compound",
                $ref: "Component_Projectile",
                $fragment: false,
            },
            Entity_FallingBlock: {
                id: "Entity_FallingBlock",
                description: "Additional fields for [falling block](https://minecraft.wiki/w/falling block).",
                type: "compound",
                required: ["Time"],
                properties: {
                    FallingBlock: {
                        type: "compound",
                        $ref: "Block",
                    },
                    Time: {
                        description:
                            "The number of ticks the entity has existed. If set to 0, the moment it ticks to 1, it vanishes if the block at its location has a different ID than the entity's `FallingBlock.Name`. If the block at its location has the same ID as its `FallingBlock.Name` when `Time` ticks from 0 to 1, the block is deleted, and the entity continues to fall, having overwritten it. When Time goes above 600, or above 100 while the block is below Y=1 or is outside building height, the entity is deleted. *needs testing*",
                        type: "byte",
                    },
                },
                $fragment: false,
            },
            Entity_Fireball: {
                id: "Entity_Fireball",
                description: "Additional fields for [fireball](https://minecraft.wiki/w/fireball).",
                type: "compound",
                required: ["Direction", "inGround", "power"],
                properties: {
                    Direction: {
                        description: "List of 3 doubles. Should be identical to Motion.*needs testing*",
                        type: "list",
                        items: [
                            {
                                description: "X",
                                type: "float",
                            },
                            {
                                description: "Y",
                                type: "float",
                            },
                            {
                                description: "Z",
                                type: "float",
                            },
                        ],
                    },
                    inGround: {
                        description: "Unknown.",
                        type: "byte",
                    },
                    power: {
                        description: "List of 3 floats that adds to `Direction` every tick. Act as the acceleration.",
                        type: "list",
                        items: [
                            {
                                description: "X",
                                type: "float",
                            },
                            {
                                description: "Y",
                                type: "float",
                            },
                            {
                                description: "Z",
                                type: "float",
                            },
                        ],
                    },
                },
                allOf: [
                    {
                        $ref: "Component_Explode",
                    },
                ],
                $fragment: false,
            },
            Entity_FireworksRocket: {
                id: "Entity_FireworksRocket",
                description: "Additional fields for [firework rocket](https://minecraft.wiki/w/firework).",
                type: "compound",
                required: ["Life", "LifeTime"],
                properties: {
                    Life: {
                        description: "The number of ticks this fireworks rocket has been flying for.",
                        type: "int",
                    },
                    LifeTime: {
                        description:
                            "The number of ticks before this fireworks rocket explodes. This value is randomized when the firework is launched.*needs testing*",
                        type: "int",
                    },
                },
                $fragment: false,
            },
            Entity_FishingBobber: {
                id: "Entity_FishingBobber",
                description: "Additional fields for [fishing bobber](https://minecraft.wiki/w/fishing bobber).",
                type: "compound",
                $ref: "Component_Projectile",
                $fragment: false,
            },
            Entity_Fox: {
                id: "Entity_Fox",
                description: "Additional fields for [fox](https://minecraft.wiki/w/fox).",
                type: "compound",
                required: ["TrustedPlayersAmount", "TrustedPlayer[0-9]+"],
                properties: {
                    TrustedPlayersAmount: {
                        description: "The number of players who are trusted by the fox.",
                        type: "int",
                    },
                },
                patternProperties: {
                    "TrustedPlayer[0-9]+": {
                        description: "A player's Unique ID. Note that `<_num_>` counts from 0.",
                        type: "long",
                    },
                },
                allOf: [
                    {
                        $ref: "Component_Ageable",
                    },
                ],
                $fragment: false,
            },
            Entity_Frog: {
                id: "Entity_Frog",
                description: "Additional fields for [frog](https://minecraft.wiki/w/frog).",
                type: "compound",
                $ref: "Component_Breedable",
                $fragment: false,
            },
            Entity_Goat: {
                id: "Entity_Goat",
                description: "Additional fields for [goat](https://minecraft.wiki/w/goat).",
                type: "compound",
                required: ["GoatHornCount"],
                properties: {
                    GoatHornCount: {
                        description: "Unknown.",
                        type: "int",
                    },
                },
                allOf: [
                    {
                        $ref: "Component_Ageable",
                    },
                ],
                $fragment: false,
            },
            Entity_GuardianAndElderGuardian: {
                id: "Entity_GuardianAndElderGuardian",
                description:
                    "Additional fields for [guardian](https://minecraft.wiki/w/guardian) and [elder guardian](https://minecraft.wiki/w/elder guardian).",
                type: "compound",
                required: ["Elder"],
                properties: {
                    Elder: {
                        description: "1 or 0 (true/false) - true if it is an elder guardian.",
                        type: "byte",
                    },
                },
                allOf: [
                    {
                        $ref: "Component_Home",
                    },
                ],
                $fragment: false,
            },
            Entity_Hoglin: {
                id: "Entity_Hoglin",
                description: "Additional fields for [hoglin](https://minecraft.wiki/w/hoglin).",
                type: "compound",
                $ref: "Component_Ageable",
                $fragment: false,
            },
            Entity_Horse: {
                id: "Entity_Horse",
                description: "Additional fields for [horse](https://minecraft.wiki/w/horse).",
                type: "compound",
                required: ["Temper"],
                properties: {
                    Temper: {
                        description:
                            "Random number that ranges from 0 to 100; increases with feeding or trying to tame it. Higher values make the horse easier to tame.",
                        type: "int",
                    },
                },
                allOf: [
                    {
                        $ref: "Component_Ageable",
                    },
                ],
                $fragment: false,
            },
            Entity_Husk: {
                id: "Entity_Husk",
                description: "Additional fields for [husk](https://minecraft.wiki/w/husk).",
                type: "compound",
                $ref: "Component_Timer",
                $fragment: false,
            },
            Entity_IronGolem: {
                id: "Entity_IronGolem",
                description: "Additional fields for [iron golem](https://minecraft.wiki/w/iron golem).",
                type: "compound",
                $ref: "Component_Dweller",
                $fragment: false,
            },
            Entity_ItemEntity: {
                id: "Entity_ItemEntity",
                description: "Additional fields for [item entity](https://minecraft.wiki/w/Item (entity)).",
                type: "compound",
                required: ["Age", "Health", "Item", "OwnerID"],
                properties: {
                    Age: {
                        description: 'The number of ticks the item has been "untouched". After 6000 ticks (5 minutes) the item is destroyed.',
                        type: "short",
                    },
                    Health: {
                        description:
                            "The health of the item, which starts at 5. Items take damage from fire, lava, and explosions. The item is destroyed when its health reaches 0.*needs testing*",
                        type: "short",
                    },
                    Item: {
                        description: "The item of this stack.",
                        type: "compound",
                        $ref: "Item_ItemStack",
                    },
                    OwnerID: {
                        description: "If present, only the player *needs testing* with this Unique ID can pick up the item.",
                        type: "long",
                    },
                },
                $fragment: false,
            },
            Entity_Llama: {
                id: "Entity_Llama",
                description: "Additional fields for [llama](https://minecraft.wiki/w/llama).",
                type: "compound",
                required: ["Temper"],
                properties: {
                    Temper: {
                        description:
                            "Random number that ranges from 0 to 100; increases with feeding or trying to tame it. Higher values make the llama easier to tame.",
                        type: "int",
                    },
                },
                allOf: [
                    {
                        $ref: "Component_Ageable",
                    },
                ],
                $fragment: false,
            },
            Entity_LlamaSpit: {
                id: "Entity_LlamaSpit",
                description: "Additional fields for [llama spit](https://minecraft.wiki/w/Llama_Spit).",
                type: "compound",
                $ref: "Component_Projectile",
                $fragment: false,
            },
            Entity_MinecartWithChest: {
                id: "Entity_MinecartWithChest",
                description: "Additional fields for [minecart with chest](https://minecraft.wiki/w/minecart with chest).",
                type: "compound",
                $ref: "Component_Inventory",
                $fragment: false,
            },
            Entity_MinecartWithCommandBlock: {
                id: "Entity_MinecartWithCommandBlock",
                description: "Additional fields for [minecart with command block](https://minecraft.wiki/w/minecart with command block).",
                type: "compound",
                required: ["CurrentTickCount", "Ticking"],
                properties: {
                    CurrentTickCount: {
                        description: "Number of ticks until it executes the command again.",
                        type: "int",
                    },
                    Ticking: {
                        description: "Unknown.",
                        type: "byte",
                    },
                },
                $fragment: false,
            },
            Entity_MinecartWithHopper: {
                id: "Entity_MinecartWithHopper",
                description: "Additional fields for [minecart with hopper](https://minecraft.wiki/w/minecart with hopper).",
                type: "compound",
                $ref: "Component_Inventory",
                $fragment: false,
            },
            Entity_MinecartWithTNT: {
                id: "Entity_MinecartWithTNT",
                description: "Additional fields for [minecart with tnt](https://minecraft.wiki/w/minecart with tnt).",
                type: "compound",
                $ref: "Component_Explode",
                $fragment: false,
            },
            Entity_Mooshroom: {
                id: "Entity_Mooshroom",
                description: "Additional fields for [mooshroom](https://minecraft.wiki/w/mooshroom).",
                type: "compound",
                $ref: "Component_Ageable",
                $fragment: false,
            },
            Entity_Mule: {
                id: "Entity_Mule",
                description: "Additional fields for [mule](https://minecraft.wiki/w/mule).",
                type: "compound",
                required: ["Temper"],
                properties: {
                    Temper: {
                        description:
                            "Random number that ranges from 0 to 100; increases with feeding or trying to tame it. Higher values make the mule easier to tame.",
                        type: "int",
                    },
                },
                allOf: [
                    {
                        $ref: "Component_Ageable",
                    },
                ],
                $fragment: false,
            },
            Entity_NPC: {
                id: "Entity_NPC",
                description: "Additional fields for [NPC](https://minecraft.wiki/w/NPC).",
                type: "compound",
                properties: {
                    Actions: {
                        description: "(May not exist) The actions.more info",
                        type: "string",
                    },
                    InterativeText: {
                        description: "(May not exist) The interactive text.more info",
                        type: "string",
                    },
                    PlayerSceneMapping: {
                        description: "(May not exist) Unknown",
                        type: "list",
                        items: {
                            description: "A key-value pair.",
                            type: "compound",
                            required: ["PlayerID", "SceneName"],
                            properties: {
                                PlayerID: {
                                    description: "A player's Unique ID.",
                                    type: "long",
                                },
                                SceneName: {
                                    description: "Unknown",
                                    type: "string",
                                },
                            },
                        },
                    },
                    RawtextName: {
                        description: "(May not exist) The name.more info",
                        type: "string",
                    },
                },
                $fragment: false,
            },
            Entity_Ocelot: {
                id: "Entity_Ocelot",
                description: "Additional fields for [ocelot](https://minecraft.wiki/w/ocelot).",
                type: "compound",
                $ref: "Component_Ageable",
                $fragment: false,
            },
            Entity_Painting: {
                id: "Entity_Painting",
                description: "Additional fields for [painting](https://minecraft.wiki/w/painting).",
                type: "compound",
                required: ["Dir", "Direction"],
                properties: {
                    Dir: {
                        description: "The direction the painting faces: 0 is south, 1 is west, 2 is north, 3 is east.*needs testing*",
                        type: "byte",
                    },
                    Direction: {
                        description: "Unknown.",
                        type: "byte",
                    },
                    Motif: {
                        description: "(May not exist) The ID of the painting's artwork.",
                        type: "string",
                    },
                },
                $fragment: false,
            },
            Entity_Panda: {
                id: "Entity_Panda",
                description: "Additional fields for [panda](https://minecraft.wiki/w/panda).",
                type: "compound",
                $ref: "Component_Ageable",
                $fragment: false,
            },
            Entity_Pig: {
                id: "Entity_Pig",
                description: "Additional fields for [pig](https://minecraft.wiki/w/pig).",
                type: "compound",
                $ref: "Component_Ageable",
                $fragment: false,
            },
            Entity_Piglin: {
                id: "Entity_Piglin",
                description: "Additional fields for [piglin](https://minecraft.wiki/w/piglin).",
                type: "compound",
                $ref: "Component_Inventory",
                $fragment: false,
            },
            Entity_PiglinBrute: {
                id: "Entity_PiglinBrute",
                description: "Additional fields for [piglin brute](https://minecraft.wiki/w/piglin brute).",
                type: "compound",
                $ref: "Component_Home",
                $fragment: false,
            },
            Entity_Pillager: {
                id: "Entity_Pillager",
                description: "Additional fields for [pillager](https://minecraft.wiki/w/pillager).",
                type: "compound",
                $ref: "Component_Dweller",
                $fragment: false,
            },
            Entity_Player: {
                id: "Entity_Player",
                description: "Additional fields for [player](https://minecraft.wiki/w/player).",
                type: "compound",
                required: [
                    "AgentID",
                    "DimensionId",
                    "EnchantmentSeed",
                    "EnderChestInventory",
                    "fogCommandStack",
                    "format_version",
                    "HasSeenCredits",
                    "Inventory",
                    "LeftShoulderRiderID",
                    "MapIndex",
                    "PlayerGameMode",
                    "PlayerLevel",
                    "PlayerLevelProgress",
                    "PlayerUIItems",
                    "recipe_unlocking",
                    "RideID",
                    "RightShoulderRiderID",
                    "SelectedContainerId",
                    "SelectedInventorySlot",
                    "Sleeping",
                    "SleepTimer",
                    "Sneaking",
                    "SpawnBlockPositionX",
                    "SpawnBlockPositionY",
                    "SpawnBlockPositionZ",
                    "SpawnDimension",
                    "SpawnX",
                    "SpawnY",
                    "SpawnZ",
                    "TimeSinceRest",
                    "WardenThreatDecreaseTimer",
                    "WardenThreatLevel",
                    "WardenThreatLevelIncreaseCooldown",
                ],
                properties: {
                    AgentID: {
                        description: "The Unique ID of the player's agent.",
                        type: "long",
                    },
                    DimensionId: {
                        description: "The ID of the dimension the player is in.",
                        type: "int",
                    },
                    EnchantmentSeed: {
                        description: "The seed used for the next enchantment in [enchantment table](https://minecraft.wiki/w/enchantment table)s.",
                        type: "int",
                    },
                    EnderChestInventory: {
                        description: "Each compound tag in this list is an item in the player's 27-slot ender chest inventory.",
                        type: "list",
                        items: {
                            description: "An item in the inventory.",
                            type: "compound",
                            required: ["Slot"],
                            properties: {
                                Slot: {
                                    description: "The slot the item is in.",
                                    type: "byte",
                                },
                            },
                        },
                    },
                    fogCommandStack: {
                        description: "Unknown.",
                        type: "list",
                        items: {
                            description: "Unknown.",
                            type: "string",
                        },
                    },
                    format_version: {
                        description: "The format version of this NBT.",
                        type: "string",
                    },
                    HasSeenCredits: {
                        description:
                            "1 or 0 (true/false) - true if the player has traveled to the [Overworld](https://minecraft.wiki/w/Overworld) via an [End portal](https://minecraft.wiki/w/End portal).",
                        type: "byte",
                    },
                    Inventory: {
                        description: "Each compound tag in this list is an item in the player's inventory.",
                        type: "list",
                        items: {
                            description: "An item in the inventory, including the slot tag.",
                            type: "compound",
                            required: ["Slot"],
                            properties: {
                                Slot: {
                                    description: "The slot the item is in.",
                                    type: "byte",
                                },
                            },
                        },
                    },
                    LeftShoulderRiderID: {
                        description: "The Unique ID of the entity that is on the player's left shoulder.",
                        type: "long",
                    },
                    MapIndex: {
                        description: "Unknown.",
                        type: "int",
                    },
                    PlayerGameMode: {
                        description: "The game mode of the player.",
                        type: "int",
                    },
                    PlayerLevel: {
                        description: "The level shown on the [XP](https://minecraft.wiki/w/XP) bar.",
                        type: "int",
                    },
                    PlayerLevelProgress: {
                        description: "The progress/percent across the XP bar to the next level.",
                        type: "float",
                    },
                    PlayerUIItems: {
                        description: "Unknown",
                        type: "list",
                        items: {
                            description: "An item in the UI, including the slot tag.",
                            type: "compound",
                            required: ["Slot"],
                            properties: {
                                Slot: {
                                    description: "The slot the item is in.",
                                    type: "byte",
                                },
                            },
                        },
                    },
                    recipe_unlocking: {
                        description: "Contains information about the recipes that the player has unlocked.",
                        type: "compound",
                        required: ["unlocked_recipes", "used_contexts"],
                        properties: {
                            unlocked_recipes: {
                                description: "A list of all recipes the player has unlocked.",
                                type: "list",
                                items: {
                                    description: "The name of a recipe, for instance `minecraft:stick` or `minecraft:ladder`.",
                                    type: "string",
                                },
                            },
                            used_contexts: {
                                description: "Unknown. Defaults to 2.",
                                type: "int",
                            },
                        },
                    },
                    RideID: {
                        description: "The Unique ID of the entity that the player is riding.",
                        type: "long",
                    },
                    RightShoulderRiderID: {
                        description: "The Unique ID of the entity that is on the player's right shoulder.",
                        type: "long",
                    },
                    SelectedContainerId: {
                        description: "The ID of the selected container.*needs testing*",
                        type: "int",
                    },
                    SelectedInventorySlot: {
                        description: "The selected inventory slot of the player.",
                        type: "int",
                    },
                    Sleeping: {
                        description: "1 or 0 (true/false) - true if the player is sleeping.",
                        type: "byte",
                    },
                    SleepTimer: {
                        description:
                            "The number of ticks the player had been in bed. 0 when the player is not sleeping. In bed, increases up to 100, then stops. Skips the night after all players in bed have reached 100. When getting out of bed, instantly changes to 100 and then increases for another 9 ticks (up to 109) before returning to 0.*needs testing*",
                        type: "short",
                    },
                    Sneaking: {
                        description: "1 or 0 (true/false) - true if the player is sneaking.",
                        type: "byte",
                    },
                    SpawnBlockPositionX: {
                        description: "The X coordinate of the player's spawn block.",
                        type: "int",
                    },
                    SpawnBlockPositionY: {
                        description: "The Y coordinate of the player's spawn block.",
                        type: "int",
                    },
                    SpawnBlockPositionZ: {
                        description: "The Z coordinate of the player's spawn block.",
                        type: "int",
                    },
                    SpawnDimension: {
                        description: "The dimension of the player's spawn point.",
                        type: "int",
                    },
                    SpawnX: {
                        description: "The X coordinate of the player's spawn point.",
                        type: "int",
                    },
                    SpawnY: {
                        description: "The Y coordinate of the player's spawn point.",
                        type: "int",
                    },
                    SpawnZ: {
                        description: "The Z coordinate of the player's spawn point.",
                        type: "int",
                    },
                    TimeSinceRest: {
                        description: "The time in ticks since last rest.",
                        type: "int",
                    },
                    WardenThreatDecreaseTimer: {
                        description:
                            "The number of ticks since the player was threatened for warden spawning. Increases by 1 every tick. After 12000 ticks (10 minutes) it will be set back to 0, and the `WardenThreatLevel` will be decreased by 1.",
                        type: "int",
                    },
                    WardenThreatLevel: {
                        description: "A threat level between 0 and 4 (inclusive). The warden will spawn at level 4.",
                        type: "int",
                    },
                    WardenThreatLevelIncreaseCooldown: {
                        description:
                            "The number of ticks before the `WardenThreatLevel` can be increased again. Decreases by 1 every tick. It is set 200 ticks (10 seconds) every time the threat level is increased.",
                        type: "int",
                    },
                },
                allOf: [
                    {
                        $ref: "Abilities",
                    },
                ],
                $fragment: false,
            },
            Entity_PolarBear: {
                id: "Entity_PolarBear",
                description: "Additional fields for [polar bear](https://minecraft.wiki/w/polar bear).",
                type: "compound",
                $ref: "Component_Ageable",
                $fragment: false,
            },
            Entity_Pufferfish: {
                id: "Entity_Pufferfish",
                description: "Additional fields for [pufferfish](https://minecraft.wiki/w/pufferfish).",
                type: "compound",
                $ref: "Component_Timer",
                $fragment: false,
            },
            Entity_Rabbit: {
                id: "Entity_Rabbit",
                description: "Additional fields for [rabbit](https://minecraft.wiki/w/rabbit).",
                type: "compound",
                required: ["CarrotsEaten", "MoreCarrotTicks"],
                properties: {
                    CarrotsEaten: {
                        description: "Unknown.",
                        type: "int",
                    },
                    MoreCarrotTicks: {
                        description: "Set to 40 when a carrot crop is eaten, decreases by 0–2 every tick until it reaches 0.*needs testing*",
                        type: "int",
                    },
                },
                allOf: [
                    {
                        $ref: "Component_Ageable",
                    },
                ],
                $fragment: false,
            },
            Entity_Ravager: {
                id: "Entity_Ravager",
                description: "Additional fields for [ravager](https://minecraft.wiki/w/ravager).",
                type: "compound",
                $ref: "Component_Dweller",
                $fragment: false,
            },
            Entity_Sheep: {
                id: "Entity_Sheep",
                description: "Additional fields for [sheep](https://minecraft.wiki/w/sheep).",
                type: "compound",
                $ref: "Component_Ageable",
                $fragment: false,
            },
            Entity_ShulkerBullet: {
                id: "Entity_ShulkerBullet",
                description: "Additional fields for [shulker bullet](https://minecraft.wiki/w/shulker bullet).",
                type: "compound",
                $ref: "Component_Projectile",
                $fragment: false,
            },
            Entity_Skeleton: {
                id: "Entity_Skeleton",
                description: "Additional fields for [skeleton](https://minecraft.wiki/w/skeleton).",
                type: "compound",
                required: ["ItemInHand"],
                properties: {
                    ItemInHand: {
                        description: "The item in its hand. Defaults to a bow.",
                        type: "compound",
                        $ref: "Item_ItemStack",
                    },
                },
                allOf: [
                    {
                        $ref: "Component_Timer",
                    },
                ],
                $fragment: false,
            },
            Entity_SkeletonHorse: {
                id: "Entity_SkeletonHorse",
                description: "Additional fields for [skeleton horse](https://minecraft.wiki/w/skeleton horse).",
                type: "compound",
                $ref: "Component_Ageable",
                $fragment: false,
            },
            Entity_Slime: {
                id: "Entity_Slime",
                description: "Additional fields for [slime](https://minecraft.wiki/w/slime).",
                type: "compound",
                required: ["Size"],
                properties: {
                    Size: {
                        description: "The size of the slime. Note that this value is zero-based, so 0 is the smallest slime, 1 is the next larger, etc.",
                        type: "byte",
                    },
                },
                $fragment: false,
            },
            Entity_Sniffer: {
                id: "Entity_Sniffer",
                description: "Additional fields for [sniffer](https://minecraft.wiki/w/sniffer).",
                type: "compound",
                $ref: "Component_Ageable",
                $fragment: false,
            },
            Entity_Snowball: {
                id: "Entity_Snowball",
                description: "Additional fields for [snowball](https://minecraft.wiki/w/snowball).",
                type: "compound",
                $ref: "Component_Projectile",
                $fragment: false,
            },
            Entity_Strider: {
                id: "Entity_Strider",
                description: "Additional fields for [strider](https://minecraft.wiki/w/strider).",
                type: "compound",
                $ref: "Component_Ageable",
                $fragment: false,
            },
            Entity_Tadpole: {
                id: "Entity_Tadpole",
                description: "Additional fields for [tadpole](https://minecraft.wiki/w/tadpole).",
                type: "compound",
                $ref: "Component_Ageable",
                $fragment: false,
            },
            Entity_ThrownEnderPearl: {
                id: "Entity_ThrownEnderPearl",
                description: "Additional fields for thrown [ender pearl](https://minecraft.wiki/w/ender pearl).",
                type: "compound",
                $ref: "Component_Projectile",
                $fragment: false,
            },
            Entity_ThrownPotion: {
                id: "Entity_ThrownPotion",
                description: "Additional fields for thrown [potion](https://minecraft.wiki/w/potion).",
                type: "compound",
                required: ["PotionId"],
                properties: {
                    PotionId: {
                        description: "The [ID of the potion effect](https://minecraft.wiki/w/Potion#Item data).",
                        type: "short",
                    },
                },
                allOf: [
                    {
                        $ref: "Component_Projectile",
                    },
                ],
                $fragment: false,
            },
            Entity_ThrownTrident: {
                id: "Entity_ThrownTrident",
                description: "Additional fields for thrown [trident](https://minecraft.wiki/w/trident).",
                type: "compound",
                required: ["favoredSlot", "Trident"],
                properties: {
                    favoredSlot: {
                        description:
                            "The slot id when it is thrown out.This means thrown trident with [Loyalty](https://minecraft.wiki/w/Loyalty) prefers to return to this slot when this slot is empty. Set to -1 when without [Loyalty](https://minecraft.wiki/w/Loyalty) enchantment.",
                        type: "int",
                    },
                    Trident: {
                        description: "The item that is given when the entity is picked up.",
                        type: "compound",
                        $ref: "Item_ItemStack",
                    },
                },
                allOf: [
                    {
                        $ref: "Component_Projectile",
                    },
                ],
                $fragment: false,
            },
            Entity_TNT: {
                id: "Entity_TNT",
                description: "Additional fields for [tnt](https://minecraft.wiki/w/tnt).",
                type: "compound",
                $ref: "Component_Explode",
                $fragment: false,
            },
            Entity_Turtle: {
                id: "Entity_Turtle",
                description: "Additional fields for [turtle](https://minecraft.wiki/w/turtle).",
                type: "compound",
                required: ["IsPregnant"],
                properties: {
                    IsPregnant: {
                        description: "1 or 0 (true/false) - true if the turtle has eggs.",
                        type: "byte",
                    },
                },
                allOf: [
                    {
                        $ref: "Component_Ageable",
                    },
                ],
                $fragment: false,
            },
            Entity_Vex: {
                id: "Entity_Vex",
                description: "Additional fields for [vex](https://minecraft.wiki/w/vex).",
                type: "compound",
                required: ["ItemInHand"],
                properties: {
                    ItemInHand: {
                        description: "The item in its hand. Defaults to an iron sword.",
                        type: "compound",
                        $ref: "Item_ItemStack",
                    },
                },
                $fragment: false,
            },
            Entity_Villager_V2: {
                id: "Entity_Villager_V2",
                description: "Additional fields for [villager](https://minecraft.wiki/w/villager) (v2).",
                type: "compound",
                required: ["HasResupplied", "IsInRaid", "ReactToBell"],
                properties: {
                    HasResupplied: {
                        description: "1 or 0 (true/false) - true if the villager's trade has been resupplied.",
                        type: "byte",
                    },
                    IsInRaid: {
                        description: "Unknown.",
                        type: "byte",
                    },
                    ReactToBell: {
                        description: "Unknown.",
                        type: "byte",
                    },
                },
                allOf: [
                    {
                        $ref: "Component_Ageable",
                    },
                ],
                $fragment: false,
            },
            Entity_Vindicator: {
                id: "Entity_Vindicator",
                description: "Additional fields for [vindicator](https://minecraft.wiki/w/vindicator).",
                type: "compound",
                $ref: "Component_Dweller",
                $fragment: false,
            },
            Entity_WanderingTrader: {
                id: "Entity_WanderingTrader",
                description: "Additional fields for [wandering trader](https://minecraft.wiki/w/wandering trader).",
                type: "compound",
                properties: {
                    entries: {
                        type: "list",
                        items: {
                            description: "An entry.",
                            type: "compound",
                            required: ["SpawnTimer", "StopSpawning"],
                            properties: {
                                SpawnTimer: {
                                    description: "Unknown.",
                                    type: "int",
                                },
                                StopSpawning: {
                                    description: "Unknown.",
                                    type: "byte",
                                },
                            },
                        },
                    },
                },
                allOf: [
                    {
                        $ref: "Component_Economy_trade_table",
                    },
                ],
                $fragment: false,
            },
            Entity_Warden: {
                id: "Entity_Warden",
                description: "Additional fields for [warden](https://minecraft.wiki/w/warden).",
                type: "compound",
                required: ["Nuisances", "VibrationListener"],
                properties: {
                    Nuisances: {
                        description: "List of nuisances that have angered the warden.",
                        type: "list",
                        items: {
                            description: "A nuisance.",
                            type: "compound",
                            required: ["ActorId", "Anger", "Priority"],
                            properties: {
                                ActorId: {
                                    description: "The Unique ID of the entity that is associated with the anger.",
                                    type: "long",
                                },
                                Anger: {
                                    description: "The level of anger. It has a maximum value of 150 and decreases by 1 every second.",
                                    type: "int",
                                },
                                Priority: {
                                    description: "1 or 0 (true/false) - true if the nuisance is priority.",
                                    type: "byte",
                                },
                            },
                        },
                    },
                    VibrationListener: {
                        description: "The vibration event listener of the warden.",
                        type: "compound",
                        required: ["event", "pending", "selector", "ticks"],
                        properties: {
                            event: {
                                description: "Unknown.",
                                type: "int",
                            },
                            pending: {
                                description: "Unknown.",
                                type: "compound",
                                required: ["distance", "source", "vibration", "x", "y", "z"],
                                properties: {
                                    distance: {
                                        description: "Unknown.",
                                        type: "float",
                                    },
                                    source: {
                                        description: "Unknown.",
                                        type: "long",
                                    },
                                    vibration: {
                                        description: "Unknown.",
                                        type: "int",
                                    },
                                    x: {
                                        description: "Unknown.",
                                        type: "int",
                                    },
                                    y: {
                                        description: "Unknown.",
                                        type: "int",
                                    },
                                    z: {
                                        description: "Unknown.",
                                        type: "int",
                                    },
                                },
                            },
                            selector: {
                                description: "Unknown.",
                                type: "compound",
                            },
                            ticks: {
                                description: "Unknown.",
                                type: "int",
                            },
                        },
                    },
                },
                $fragment: false,
            },
            Entity_WindChargeProjectile: {
                id: "Entity_WindChargeProjectile",
                description: "Additional fields for [wind charge projectile](https://minecraft.wiki/w/wind charge projectile).",
                type: "compound",
                $ref: "Component_Projectile",
                $fragment: false,
            },
            Entity_Witch: {
                id: "Entity_Witch",
                description: "Additional fields for [witch](https://minecraft.wiki/w/witch).",
                type: "compound",
                $ref: "Component_Dweller",
                $fragment: false,
            },
            Entity_Wither: {
                id: "Entity_Wither",
                description: "Additional fields for [wither](https://minecraft.wiki/w/wither).",
                type: "compound",
                required: [
                    "AirAttack",
                    "dyingFrames",
                    "firerate",
                    "Invul",
                    "lastHealthInterval",
                    "maxHealth",
                    "oldSwellAmount",
                    "overlayAlpha",
                    "Phase",
                    "ShieldHealth",
                    "SpawningFrames",
                    "swellAmount",
                ],
                properties: {
                    AirAttack: {
                        description:
                            "Whether the wither exhibits first or second phase behavior, as well as whether the shield effect is visible - 1 for first phase and shield invisible, 0 for second phase and shield visible.",
                        type: "byte",
                    },
                    dyingFrames: {
                        description: "The number of ticks remaining before the wither explodes during its death animation.",
                        type: "int",
                    },
                    firerate: {
                        description: "The delay in ticks between wither skull shots. Does not affect the delay between volleys.",
                        type: "int",
                    },
                    Invul: {
                        description:
                            "The remaining number of ticks the wither will be invulnerable for. Updated to match SpawningFrames or dyingFrames every tick during spawn/death animation, otherwise remains static.",
                        type: "int",
                    },
                    lastHealthInterval: {
                        description: "The greatest multiple of 75 that is fewer than the wither's lowest health. Does not increase if the wither is healed.",
                        type: "int",
                    },
                    maxHealth: {
                        description: "Unknown.",
                        type: "int",
                    },
                    oldSwellAmount: {
                        description: "The swellAmount in the previous tick.",
                        type: "float",
                    },
                    overlayAlpha: {
                        description:
                            "The alpha/brightness of the wither texture overlay during its death animation. Has no effect outside the death animation.",
                        type: "float",
                    },
                    Phase: {
                        description:
                            "Which phase the wither is in. Has no effect on wither behavior or shield visibility. Has a value of 1 during spawning and first phase and 0 during second phase and death.",
                        type: "int",
                    },
                    ShieldHealth: {
                        description: "Unknown.",
                        type: "int",
                    },
                    SpawningFrames: {
                        description: "The number of ticks remaining before the wither finishes its spawning animation and becomes vulnerable.",
                        type: "int",
                    },
                    swellAmount: {
                        description: "How much the wither has swelled during its death animation. Has no effect outside the death animation.",
                        type: "float",
                    },
                },
                $fragment: false,
            },
            Entity_WitherSkull: {
                id: "Entity_WitherSkull",
                description: "Additional fields for [wither skull](https://minecraft.wiki/w/Wither).",
                type: "compound",
                $ref: "Component_Explode",
                $fragment: false,
            },
            Entity_Wolf: {
                id: "Entity_Wolf",
                description: "Additional fields for [wolf](https://minecraft.wiki/w/wolf).",
                type: "compound",
                required: ["properties"],
                properties: {
                    properties: {
                        description: "The wolf `properties`.",
                        type: "compound",
                        required: ["minecraft:has_armor", "minecraft:has_increased_max_health", "minecraft:is_armorable"],
                        properties: {
                            "minecraft:has_armor": {
                                description: "1 or 0 (true/false) - true if the wolf has [wolf armor](https://minecraft.wiki/w/wolf armor).",
                                type: "byte",
                            },
                            "minecraft:has_increased_max_health": {
                                description: "1 or 0 (true/false) - true if the wolf's maximum health is 40.",
                                type: "byte",
                            },
                            "minecraft:is_armorable": {
                                description: "1 or 0 (true/false) - true if the wolf can be equipped with [wolf armor](https://minecraft.wiki/w/wolf armor).",
                                type: "byte",
                            },
                        },
                    },
                },
                allOf: [
                    {
                        $ref: "Component_Ageable",
                    },
                ],
                $fragment: false,
            },
            Entity_Zombie: {
                id: "Entity_Zombie",
                description: "Additional fields for [zombie](https://minecraft.wiki/w/zombie).",
                type: "compound",
                $ref: "Component_Timer",
                $fragment: false,
            },
            Entity_ZombieHorse: {
                id: "Entity_ZombieHorse",
                description: "Additional fields for [zombie horse](https://minecraft.wiki/w/zombie horse).",
                type: "compound",
                $ref: "Component_Ageable",
                $fragment: false,
            },
            Entity_ZombieVillager: {
                id: "Entity_ZombieVillager",
                description: "Additional fields for [zombie villager](https://minecraft.wiki/w/zombie villager).",
                type: "compound",
                required: ["SpawnedFromVillage"],
                properties: {
                    SpawnedFromVillage: {
                        description: "1 or 0 (true/false) - true if spawned from village.",
                        type: "byte",
                    },
                },
                $fragment: false,
            },
            Entity_ZombifiedPiglin: {
                id: "Entity_ZombifiedPiglin",
                description: "Additional fields for [zombified piglin](https://minecraft.wiki/w/zombified piglin).",
                type: "compound",
                required: ["Anger"],
                properties: {
                    Anger: {
                        description: "Unknown.",
                        type: "short",
                    },
                },
                $fragment: false,
            },
            //#endregion
            //#region Block NBT Schemas
            Block_Banner: {
                id: "Block_Banner",
                description: "Additional fields for [banner](https://minecraft.wiki/w/banner).",
                type: "compound",
                required: ["Base", "Type"],
                properties: {
                    Base: {
                        description: "The base color of the banner. See [Banner#Block_data](https://minecraft.wiki/w/Banner#Block_data).",
                        type: "int",
                    },
                    Patterns: {
                        description: "(May not exist) List of all patterns applied to the banner.",
                        type: "list",
                        items: {
                            description: "An individual pattern.",
                            type: "compound",
                            required: ["Color", "Pattern"],
                            properties: {
                                Color: {
                                    description: "The base color of the pattern. See [Banner#Block_data](https://minecraft.wiki/w/Banner#Block_data).",
                                    type: "int",
                                },
                                Pattern: {
                                    description: "The pattern ID code. See [Banner#Block_data](https://minecraft.wiki/w/Banner#Block_data).",
                                    type: "string",
                                },
                            },
                        },
                    },
                    Type: {
                        description: "The type of the block entity. 0 is normal banner. 1 is ominous banner.",
                        type: "int",
                    },
                },
                $fragment: false,
            },
            Block_Beacon: {
                id: "Block_Beacon",
                description: "Additional fields for [beacon](https://minecraft.wiki/w/beacon).",
                type: "compound",
                required: ["primary", "secondary"],
                properties: {
                    primary: {
                        description:
                            "The primary effect selected, see [Potion effects](https://minecraft.wiki/w/Status_effect) for IDs. Set to 0 when no effect is selected.",
                        type: "int",
                    },
                    secondary: {
                        description:
                            "The secondary effect selected, see [Potion effects](https://minecraft.wiki/w/Status_effect) for IDs. Set to 0 when no effect is selected. When set without a primary effect, does nothing. When set to the same as the primary, the effect is given at level 2 (the normally available behavior for 5 effects). When set to a different value than the primary (normally only Regeneration), gives the effect at level 1.*needs testing*",
                        type: "int",
                    },
                },
                $fragment: false,
            },
            Block_Bed: {
                id: "Block_Bed",
                description: "Additional fields for [bed](https://minecraft.wiki/w/bed).",
                type: "compound",
                required: ["color"],
                properties: {
                    color: {
                        description:
                            "The data value that determines the color of the half-bed block. When a bed is broken, the color of the block entity at the bed's head becomes the color of the bed item when it drops. See [Bed#Metadata](https://minecraft.wiki/w/Bed#Metadata).",
                        type: "byte",
                    },
                },
                $fragment: false,
            },
            Block_BeehiveAndBeeNest: {
                id: "Block_BeehiveAndBeeNest",
                description: "Additional fields for [beehive](https://minecraft.wiki/w/beehive) and bee nest.",
                type: "compound",
                required: ["ShouldSpawnBees"],
                properties: {
                    Occupants: {
                        description: "(May not exist) Entities currently in the hive.",
                        type: "list",
                        items: {
                            description: "An entity in the hive.",
                            type: "compound",
                            required: ["ActorIdentifier", "SaveData", "TicksLeftToStay"],
                            properties: {
                                ActorIdentifier: {
                                    description: "The entity in the hive. Always `minecraft:bee<>` in vanilla game. more info",
                                    type: "string",
                                },
                                SaveData: {
                                    description: "The NBT data of the entity in the hive.",
                                    type: "compound",
                                    $ref: "ActorPrefix",
                                },
                                TicksLeftToStay: {
                                    description: "The time in ticks until the entity leave the beehive.",
                                    type: "int",
                                },
                            },
                        },
                    },
                    ShouldSpawnBees: {
                        description: "1 or 0 (true/false) - true if new bees will be spawned.",
                        type: "byte",
                    },
                },
                $fragment: false,
            },
            Block_Bell: {
                id: "Block_Bell",
                description: "Additional fields for [bell](https://minecraft.wiki/w/bell).",
                type: "compound",
                required: ["Direction", "Ringing", "Ticks"],
                properties: {
                    Direction: {
                        description: "The direction data of this bell.more info",
                        type: "int",
                    },
                    Ringing: {
                        description: "1 or 0 (true/false) - true if it is ringing.",
                        type: "byte",
                    },
                    Ticks: {
                        description: "Unknown.more info",
                        type: "int",
                    },
                },
                $fragment: false,
            },
            Block_BrewingStand: {
                id: "Block_BrewingStand",
                description: "Additional fields for [brewing stand](https://minecraft.wiki/w/brewing stand).",
                type: "compound",
                required: ["CookTime", "FuelAmount", "FuelTotal", "Items"],
                properties: {
                    CookTime: {
                        description: "The number of ticks until the potions are finished.",
                        type: "short",
                    },
                    FuelAmount: {
                        description: "Remaining fuel for the brewing stand.",
                        type: "short",
                    },
                    FuelTotal: {
                        description: "The max fuel numder for the fuel bar.",
                        type: "short",
                    },
                    Items: {
                        description: "List of items in brewing stand.",
                        type: "list",
                        items: {
                            description: "An item in the brewing stand, including the slot tag.",
                            type: "compound",
                            required: ["Slot"],
                            properties: {
                                Slot: {
                                    description: "The slot the item is in.",
                                    type: "byte",
                                },
                            },
                        },
                    },
                },
                $fragment: false,
            },
            Block_CampfireAndSoulCampfire: {
                id: "Block_CampfireAndSoulCampfire",
                description: "Additional fields for [campfire](https://minecraft.wiki/w/campfire) and [soul campfire](https://minecraft.wiki/w/soul campfire).",
                type: "compound",
                required: ["ItemTime[0-9]+"],
                patternProperties: {
                    "Item[0-9]+": {
                        description: "(May not exist) An items currently cooking. `<_num_>` is 1, 2, 3, and 4.",
                        type: "compound",
                        $ref: "Item_ItemStack",
                    },
                    "ItemTime[0-9]+": {
                        description: "How long each item has been cooking. `<_num_>` is 1, 2, 3, and 4.",
                        type: "int",
                    },
                },
                $fragment: false,
            },
            Block_Cauldron: {
                id: "Block_Cauldron",
                description: "Additional fields for [cauldron](https://minecraft.wiki/w/cauldron).",
                type: "compound",
                required: ["Items", "PotionId", "PotionType"],
                properties: {
                    CustomColor: {
                        description: "(May not exist) This tag exists only if the cauldron stores dyed water; stores a 32-bit ARGB encoded color.",
                        type: "int",
                    },
                    Items: {
                        description: "List of items in this container.",
                        type: "list",
                        items: {
                            description: "An item, including the slot tag.",
                            type: "compound",
                            required: ["Slot"],
                            properties: {
                                Slot: {
                                    description: "The inventory slot the item is in.",
                                    type: "byte",
                                },
                            },
                        },
                    },
                    PotionId: {
                        description:
                            "If the cauldron contains a potion, this tag stores the ID of that potion. If there is no potion stored, then this tag is set to -1.",
                        type: "short",
                    },
                    PotionType: {
                        description:
                            "If the cauldron contains a potion, this tag stores the type of that potion. 0 is normal, 1 is splash, 2 is lingering. If there is no potion stored, then this tag is set to -1.",
                        type: "short",
                    },
                },
                $fragment: false,
            },
            Block_Chalkboard: {
                id: "Block_Chalkboard",
                description: "Additional fields for [chalkboard](https://minecraft.wiki/w/chalkboard).",
                type: "compound",
                required: ["BaseX", "BaseY", "BaseZ", "Locked", "OnGround", "Owner", "Size", "Text"],
                properties: {
                    BaseX: {
                        description: "The X position of its base.",
                        type: "int",
                    },
                    BaseY: {
                        description: "The Y position of its base.",
                        type: "int",
                    },
                    BaseZ: {
                        description: "The Z position of its base.",
                        type: "int",
                    },
                    Locked: {
                        description: "1 or 0 (true/false) - true if it is on locked.",
                        type: "byte",
                    },
                    OnGround: {
                        description: "1 or 0 (true/false) - true if it is on ground.",
                        type: "byte",
                    },
                    Owner: {
                        description: "The Unique ID of its owner.",
                        type: "long",
                    },
                    Size: {
                        description: "The size of this chalkboard.",
                        type: "int",
                    },
                    Text: {
                        description: "The text on the chalkboard.",
                        type: "string",
                    },
                },
                $fragment: false,
            },
            Block_ChemistryTables: {
                id: "Block_ChemistryTables",
                description:
                    "Additional fields for chemistry tables ([compound creator](https://minecraft.wiki/w/compound creator), [element constructor](https://minecraft.wiki/w/element constructor), [lab table](https://minecraft.wiki/w/lab table), [material reducer](https://minecraft.wiki/w/material reducer)).",
                type: "compound",
                required: ["itemAux", "itemId", "itemStack"],
                properties: {
                    itemAux: {
                        description: "(Only for Lab Table) Unknown.",
                        type: "short",
                    },
                    itemId: {
                        description: "(Only for Lab Table) Unknown.",
                        type: "int",
                    },
                    itemStack: {
                        description: "(Only for Lab Table) Unknown.",
                        type: "byte",
                    },
                },
                $fragment: false,
            },
            Block_Chests: {
                id: "Block_Chests",
                description:
                    "Additional fields for [chest](https://minecraft.wiki/w/chest), [trapped chest](https://minecraft.wiki/w/trapped chest), [barrel](https://minecraft.wiki/w/barrel), and [ender chest](https://minecraft.wiki/w/ender chest).",
                type: "compound",
                required: ["Findable", "forceunpair", "Items"],
                properties: {
                    Findable: {
                        description: "Unknown.",
                        type: "byte",
                    },
                    forceunpair: {
                        description: "1 or 0 (true/false) - (may not exist) true if this chest is unpair with chest next to it.",
                        type: "byte",
                    },
                    Items: {
                        description: "List of items in this container.",
                        type: "list",
                        items: {
                            description: "An item, including the slot tag.",
                            type: "compound",
                            required: ["Slot"],
                            properties: {
                                Slot: {
                                    description: "The inventory slot the item is in.",
                                    type: "byte",
                                },
                            },
                        },
                    },
                    LootTable: {
                        description:
                            "(May not exist) Loot table to be used to fill the chest when it is next opened, or the items are otherwise interacted with.",
                        type: "string",
                    },
                    LootTableSeed: {
                        description: "(May not exist) Seed for generating the loot table. 0 or omitted use a random seed.",
                        type: "int",
                    },
                    pairlead: {
                        description: "(May not exist) Unknown.",
                        type: "byte",
                    },
                    pairx: {
                        description: "(May not exist) The X position of the chest paired with.",
                        type: "int",
                    },
                    pairz: {
                        description: "(May not exist) The Z position of the chest paired with.",
                        type: "int",
                    },
                },
                $fragment: false,
            },
            Block_ChiseledBookshelf: {
                id: "Block_ChiseledBookshelf",
                description: "Additional fields for [chiseled bookshelf](https://minecraft.wiki/w/chiseled bookshelf).",
                type: "compound",
                required: ["Items", "LastInteractedSlot"],
                properties: {
                    Items: {
                        description: "List of books in the bookshelf.",
                        type: "list",
                        items: {
                            description: "An item in the chiseled bookshelf.",
                            type: "compound",
                            $ref: "Item_ItemStack",
                        },
                    },
                    LastInteractedSlot: {
                        description: "Last interacted slot (1-6), or 0 if no slot has been interacted with yet.",
                        type: "int",
                    },
                },
                $fragment: false,
            },
            Block_CommandBlock: {
                id: "Block_CommandBlock",
                description: "Additional fields for [command block](https://minecraft.wiki/w/command block).",
                type: "compound",
                required: ["auto", "conditionMet", "LPCondionalMode", "LPRedstoneMode", "LPCommandMode", "powered"],
                properties: {
                    auto: {
                        description: "1 or 0 (true/false) - Allows to activate the command without the requirement of a redstone signal.",
                        type: "byte",
                    },
                    conditionalMode: {
                        description: "(May not exist) Unknown.",
                        type: "byte",
                    },
                    conditionMet: {
                        description:
                            "1 or 0 (true/false) - if a conditional command block had its condition met when last activated. True if not a conditional command block.",
                        type: "byte",
                    },
                    LPCondionalMode: {
                        description: "Unknown.",
                        type: "byte",
                    },
                    LPRedstoneMode: {
                        description: "Unknown.",
                        type: "byte",
                    },
                    LPCommandMode: {
                        description: "Unknown.",
                        type: "byte",
                    },
                    powered: {
                        description: "1 or 0 (true/false) - true if the command block is powered by redstone.",
                        type: "byte",
                    },
                },
                allOf: [
                    {
                        $ref: "CommandBlock",
                    },
                ],
                $fragment: false,
            },
            Block_Comparator: {
                id: "Block_Comparator",
                description: "Additional fields for [comparator](https://minecraft.wiki/w/comparator).",
                type: "compound",
                required: ["OutputSignal"],
                properties: {
                    OutputSignal: {
                        description: "Represents the strength of the analog signal output of this redstone comparator.",
                        type: "int",
                    },
                },
                $fragment: false,
            },
            Block_Conduit: {
                id: "Block_Conduit",
                description: "Additional fields for [conduit](https://minecraft.wiki/w/conduit).",
                type: "compound",
                required: ["Active", "Target"],
                properties: {
                    Active: {
                        description: "1 or 0 (true/false) - true if it is active.",
                        type: "byte",
                    },
                    Target: {
                        description: "The Unique ID of the hostile mob the conduit is currently attacking. If there's no target, defaults to -1.",
                        type: "long",
                    },
                },
                $fragment: false,
            },
            Block_Crafter: {
                id: "Block_Crafter",
                description: "Additional fields for [crafter](https://minecraft.wiki/w/crafter).",
                type: "compound",
                required: ["disabled_slots", "Items"],
                properties: {
                    disabled_slots: {
                        description: "Indexes of slots that are disabled.",
                        type: "short",
                    },
                    Items: {
                        description: "List of items in the crafter.",
                        type: "list",
                        items: {
                            description: "An item in the crafter, including the slot tag. Crafter slots are numbered 0-8. 0 starts in the top left corner.",
                            type: "compound",
                            required: ["Slot"],
                            properties: {
                                Slot: {
                                    description: "The inventory slot the item is in.",
                                    type: "byte",
                                },
                            },
                        },
                    },
                },
                $fragment: false,
            },
            Block_DecoratedPot: {
                id: "Block_DecoratedPot",
                description: "Additional fields for [decorated pot](https://minecraft.wiki/w/decorated pot).",
                type: "compound",
                required: ["item", "sherds"],
                properties: {
                    item: {
                        description: "The item in the decorated pot.",
                        type: "compound",
                        $ref: "Item_ItemStack",
                    },
                    sherds: {
                        description: "List of sherds on this decorated pot.",
                        type: "list",
                        items: {
                            description: "[Item ID](https://minecraft.wiki/w/Bedrock Edition data values) of this face. Defaults to `minecraft:brick`.",
                            type: "string",
                        },
                    },
                },
                $fragment: false,
            },
            Block_DispenserAndDropper: {
                id: "Block_DispenserAndDropper",
                description: "Additional fields for [dispenser](https://minecraft.wiki/w/dispenser) and [dropper](https://minecraft.wiki/w/dropper).",
                type: "compound",
                required: ["Items"],
                properties: {
                    Items: {
                        description: "List of items in this container.",
                        type: "list",
                        items: {
                            description: "An item, including the slot tag.",
                            type: "compound",
                            required: ["Slot"],
                            properties: {
                                Slot: {
                                    description: "The inventory slot the item is in.",
                                    type: "byte",
                                },
                            },
                        },
                    },
                    LootTable: {
                        description:
                            "(May not exist) Loot table to be used to fill the chest when it is next opened, or the items are otherwise interacted with.",
                        type: "string",
                    },
                    LootTableSeed: {
                        description: "(May not exist) Seed for generating the loot table. 0 or omitted use a random seed.",
                        type: "int",
                    },
                },
                $fragment: false,
            },
            Block_EnchantmentTable: {
                id: "Block_EnchantmentTable",
                description: "Additional fields for [Enchantment table](https://minecraft.wiki/w/Enchantment table).",
                type: "compound",
                required: ["rott"],
                properties: {
                    CustomName: {
                        description: "(May not exist) The name of this enchantment table.",
                        type: "string",
                    },
                    rott: {
                        description: "The clockwise rotation of the book in radians. Top of the book points West when 0.",
                        type: "float",
                    },
                },
                $fragment: false,
            },
            Block_EndGateway: {
                id: "Block_EndGateway",
                description: "Additional fields for [end gateway](https://minecraft.wiki/w/end gateway).",
                type: "compound",
                required: ["Age", "ExitPortal"],
                properties: {
                    Age: {
                        description: "Age of the portal, in ticks. This is used to determine when the beam is rendered.",
                        type: "int",
                    },
                    ExitPortal: {
                        description: "Location entities are teleported to when entering the portal.",
                        type: "list",
                        items: [
                            {
                                description: "X coordinate of target location.",
                                type: "int",
                            },
                            {
                                description: "Y coordinate of target location.",
                                type: "int",
                            },
                            {
                                description: "Z coordinate of target location.",
                                type: "int",
                            },
                        ],
                    },
                },
                $fragment: false,
            },
            Block_FlowerPot: {
                id: "Block_FlowerPot",
                description: "Additional fields for [flower pot](https://minecraft.wiki/w/flower pot).",
                type: "compound",
                properties: {
                    PlantBlock: {
                        description: "(May not exist) The block in the pot.",
                        type: "compound",
                        $ref: "Block",
                    },
                },
                $fragment: false,
            },
            Block_Furnace: {
                id: "Block_Furnace",
                description:
                    "Additional fields for [furnace](https://minecraft.wiki/w/furnace), [smoker](https://minecraft.wiki/w/smoker), and [blast furnace](https://minecraft.wiki/w/blast furnace).",
                type: "compound",
                required: ["BurnDuration", "BurnTime", "CookTime", "Items", "StoredXPInt"],
                properties: {
                    BurnDuration: {
                        description: "The total time that in ticks that the currently used fuel can burn.",
                        type: "short",
                    },
                    BurnTime: {
                        description: "Number of ticks left before the current fuel runs out.",
                        type: "short",
                    },
                    CookTime: {
                        description:
                            "Number of ticks the item has been smelting for. The item finishes smelting when this value reaches 200 (10 seconds). Is reset to 0 if BurnTime reaches 0.*needs testing*",
                        type: "short",
                    },
                    Items: {
                        description: "List of items in this container.",
                        type: "list",
                        items: {
                            description: "An item in the furnace, including the slot tag.",
                            type: "compound",
                            required: ["Slot"],
                            properties: {
                                Slot: {
                                    description: "The inventory slot the item is in.",
                                    type: "byte",
                                },
                            },
                        },
                    },
                    StoredXPInt: {
                        description: "The number of experiences it stores.",
                        type: "int",
                    },
                },
                $fragment: false,
            },
            Block_Hopper: {
                id: "Block_Hopper",
                description: "Additional fields for [hopper](https://minecraft.wiki/w/hopper).",
                type: "compound",
                required: ["Items", "TransferCooldown"],
                properties: {
                    Items: {
                        description: "List of items in this container.",
                        type: "list",
                        items: {
                            description: "An item, including the slot tag.",
                            type: "compound",
                            required: ["Slot"],
                            properties: {
                                Slot: {
                                    description: "The inventory slot the item is in.",
                                    type: "byte",
                                },
                            },
                        },
                    },
                    TransferCooldown: {
                        description: "Time until the next transfer in game ticks, naturally between 1 and 8 or 0 if there is no transfer.",
                        type: "int",
                    },
                },
                $fragment: false,
            },
            Block_ItemFrame: {
                id: "Block_ItemFrame",
                description: "Additional fields for [item frame](https://minecraft.wiki/w/item frame).",
                type: "compound",
                required: ["Item"],
                properties: {
                    Item: {
                        description: "The items in this item frame.",
                        type: "compound",
                        $ref: "Item_ItemStack",
                    },
                    ItemDropChance: {
                        description: "(May not exist) The chance of item dropping when the item frame is broken.",
                        type: "float",
                    },
                    ItemRotation: {
                        description: "(May not exist) The rotation of the item in the item frame.",
                        type: "float",
                    },
                },
                $fragment: false,
            },
            Block_Jigsaw: {
                id: "Block_Jigsaw",
                description: "Additional fields for [jigsaw](https://minecraft.wiki/w/jigsaw).",
                type: "compound",
                required: ["final_state", "joint", "name", "target", "target_pool"],
                properties: {
                    final_state: {
                        description: "The block that this jigsaw block becomes.",
                        type: "string",
                    },
                    joint: {
                        description: 'The joint option value, either "rollable" or "aligned".',
                        type: "string",
                    },
                    name: {
                        description:
                            "The jigsaw block's name. This jigsaw block will be aligned with another structure's jigsaw block which has this value in the target tag.",
                        type: "string",
                    },
                    target: {
                        description:
                            "The jigsaw block's target name. This jigsaw block will be aligned with another structure's jigsaw block which has this value in the name tag.",
                        type: "string",
                    },
                    target_pool: {
                        description: "The jigsaw block's target pool to select a structure from.",
                        type: "string",
                    },
                },
                $fragment: false,
            },
            Block_Jukebox: {
                id: "Block_Jukebox",
                description: "Additional fields for [jukebox](https://minecraft.wiki/w/jukebox).",
                type: "compound",
                properties: {
                    RecordItem: {
                        description: "(May not exist) The record item in it.",
                        type: "compound",
                        $ref: "Item_ItemStack",
                    },
                },
                $fragment: false,
            },
            Block_Lectern: {
                id: "Block_Lectern",
                description: "Additional fields for [lectern](https://minecraft.wiki/w/lectern).",
                type: "compound",
                required: ["hasBook"],
                properties: {
                    book: {
                        description: "(May not exist) The book item currently on the lectern.",
                        type: "compound",
                        $ref: "Item_ItemStack",
                    },
                    hasBook: {
                        description: "1 or 0 (true/false) - (may not exist) true if it has a book.",
                        type: "byte",
                    },
                    page: {
                        description: "(May not exist) The page the book is currently on, starting from 0.",
                        type: "int",
                    },
                    totalPages: {
                        description: "(May not exist) The total pages the book has.",
                        type: "int",
                    },
                },
                $fragment: false,
            },
            Block_Lodestone: {
                id: "Block_Lodestone",
                description: "Additional fields for [lodestone](https://minecraft.wiki/w/lodestone).",
                type: "compound",
                properties: {
                    trackingHandle: {
                        description: "(May not exist) The id of lodestone.",
                        type: "int",
                    },
                },
                $fragment: false,
            },
            Block_MonsterSpawner: {
                id: "Block_MonsterSpawner",
                description: "Additional fields for [monster spawner](https://minecraft.wiki/w/monster spawner).",
                type: "compound",
                $ref: "MonsterSpawner",
                $fragment: false,
            },
            Block_MovingBlock: {
                id: "Block_MovingBlock",
                description: "Additional fields for [moving block](https://minecraft.wiki/w/moving block).",
                type: "compound",
                required: ["movingBlock", "movingBlockExtra", "pistonPosX", "pistonPosY", "pistonPosZ"],
                properties: {
                    movingBlock: {
                        description: "The main layer of moving block represented by this block entity.",
                        type: "compound",
                        $ref: "Block",
                    },
                    movingBlockExtra: {
                        description: "The [extra moving block layer](https://minecraft.wiki/w/Waterlogging) represented by this block entity.",
                        type: "compound",
                        $ref: "Block",
                    },
                    movingEntity: {
                        description: "(May not exist) The block entity stored in this moving block.",
                        type: "compound",
                        $ref: "BlockEntity",
                    },
                    pistonPosX: {
                        description: "X coordinate of the piston base.",
                        type: "int",
                    },
                    pistonPosY: {
                        description: "Y coordinate of the piston base.",
                        type: "int",
                    },
                    pistonPosZ: {
                        description: "Z coordinate of the piston base.",
                        type: "int",
                    },
                },
                $fragment: false,
            },
            Block_NoteBlock: {
                id: "Block_NoteBlock",
                description: "Additional fields for [note block](https://minecraft.wiki/w/note block).",
                type: "compound",
                required: ["note"],
                properties: {
                    note: {
                        description: "The pitch of the note block.",
                        type: "byte",
                    },
                },
                $fragment: false,
            },
            Block_NetherReactor: {
                id: "Block_NetherReactor",
                description: "Additional fields for [nether reactor](https://minecraft.wiki/w/nether reactor).",
                type: "compound",
                required: ["HasFinished", "IsInitialized", "Progress"],
                properties: {
                    HasFinished: {
                        description: "1 or 0 (true/false) - true if the reactor has completed its activation phase, and has gone dark.",
                        type: "byte",
                    },
                    IsInitialized: {
                        description: "1 or 0 (true/false) - true if the reactor has been activated, and has turned red.",
                        type: "byte",
                    },
                    Progress: {
                        description: "Number of ticks the reactor has been active for. It finishes after 900 game ticks (45 seconds).",
                        type: "short",
                    },
                },
                $fragment: false,
            },
            Block_Piston: {
                id: "Block_Piston",
                description: "Additional fields for [piston](https://minecraft.wiki/w/piston).",
                type: "compound",
                required: ["AttachedBlocks", "BreakBlocks", "LastProgress", "NewState", "Progress", "State", "Sticky"],
                properties: {
                    AttachedBlocks: {
                        description: "The list of positions of blocks it should move.",
                        type: "list",
                        items: [
                            {
                                description: "A block's X coordinate.",
                                type: "int",
                            },
                            {
                                description: "A block's Y coordinate.",
                                type: "int",
                            },
                            {
                                description: "A block's Z coordinate.",
                                type: "int",
                            },
                            {
                                description: "Another block's X coordinate.",
                                type: "int",
                            },
                            {
                                description: "Another block's Y coordinate.",
                                type: "int",
                            },
                            {
                                description: "Another block's Z coordinate.",
                                type: "int",
                            },
                            {
                                description: "etc.",
                                type: "int",
                            },
                        ],
                    },
                    BreakBlocks: {
                        description: "The list of positions of blocks it should break.",
                        type: "list",
                        items: [
                            {
                                description: "A block's X coordinate.",
                                type: "int",
                            },
                            {
                                description: "A block's Y coordinate.",
                                type: "int",
                            },
                            {
                                description: "A block's Z coordinate.",
                                type: "int",
                            },
                            {
                                description: "Another block's X coordinate.",
                                type: "int",
                            },
                            {
                                description: "Another block's Y coordinate.",
                                type: "int",
                            },
                            {
                                description: "Another block's Z coordinate.",
                                type: "int",
                            },
                            {
                                description: "etc.",
                                type: "int",
                            },
                        ],
                    },
                    LastProgress: {
                        description: "Progress in last tick.",
                        type: "float",
                    },
                    NewState: {
                        description: "Next state. Can be 0 (unextended), 1 (pushing), 2 (extended), or 3 (pulling).",
                        type: "byte",
                    },
                    Progress: {
                        description: "How far the block has been moved. Can be 0.0, 0.5, and 1.0.",
                        type: "float",
                    },
                    State: {
                        description: "Current state.",
                        type: "byte",
                    },
                    Sticky: {
                        description: "1 or 0 (true/false) - true if this piston is sticky.",
                        type: "byte",
                    },
                },
                $fragment: false,
            },
            Block_SculkCatalyst: {
                id: "Block_SculkCatalyst",
                description: "Additional fields for [sculk catalyst](https://minecraft.wiki/w/sculk catalyst).",
                type: "compound",
                required: ["cursors"],
                properties: {
                    cursors: {
                        description: "List of charges associated with the sculk catalyst.",
                        type: "list",
                        items: {
                            description: "A charge.",
                            type: "compound",
                            required: ["charge", "decay", "facing", "update", "x", "y", "z"],
                            properties: {
                                charge: {
                                    description: "How much power is in the charge.",
                                    type: "short",
                                },
                                decay: {
                                    description:
                                        "Be 1 if the charge was spread from a sculk or sculk vein, 0 otherwise. The charge can spread to any block if this tag is 1. If it is 0, all the powers in the charge disappear when it spreads to a block not in sculk family.*needs testing*",
                                    type: "short",
                                },
                                facing: {
                                    description: "UNDOCUMENTED.",
                                    type: "short",
                                },
                                update: {
                                    description: "Delay in ticks until the charge begins to travel after being created.*needs testing*",
                                    type: "short",
                                },
                                x: {
                                    description: "X coordinate of the charge.",
                                    type: "int",
                                },
                                y: {
                                    description: "Y coordinate of the charge.",
                                    type: "int",
                                },
                                z: {
                                    description: "Z coordinate of the charge.",
                                    type: "int",
                                },
                            },
                        },
                    },
                },
                $fragment: false,
            },
            Block_SculkShrieker_SculkSensor_AndCalibratedSculkSensor: {
                id: "Block_SculkShrieker_SculkSensor_AndCalibratedSculkSensor",
                description:
                    "Additional fields for [sculk shrieker](https://minecraft.wiki/w/sculk shrieker), [sculk sensor](https://minecraft.wiki/w/sculk sensor), and [calibrated sculk sensor](https://minecraft.wiki/w/calibrated sculk sensor).",
                type: "compound",
                required: ["VibrationListener"],
                properties: {
                    VibrationListener: {
                        description: "The vibration event listener of the sculk shrieker, sculk sensor, and calibrated sculk sensor.",
                        type: "compound",
                        required: ["event", "pending", "selector", "ticks"],
                        properties: {
                            event: {
                                description: "Unknown.",
                                type: "int",
                            },
                            pending: {
                                description: "Unknown.",
                                type: "compound",
                                required: ["distance", "source", "vibration", "x", "y", "z"],
                                properties: {
                                    distance: {
                                        description: "Unknown.",
                                        type: "float",
                                    },
                                    source: {
                                        description: "Unknown.",
                                        type: "long",
                                    },
                                    vibration: {
                                        description: "Unknown.",
                                        type: "int",
                                    },
                                    x: {
                                        description: "Unknown.",
                                        type: "int",
                                    },
                                    y: {
                                        description: "Unknown.",
                                        type: "int",
                                    },
                                    z: {
                                        description: "Unknown.",
                                        type: "int",
                                    },
                                },
                            },
                            selector: {
                                description: "Unknown.",
                                type: "compound",
                            },
                            ticks: {
                                description: "Unknown.",
                                type: "int",
                            },
                        },
                    },
                },
                $fragment: false,
            },
            Block_ShulkerBox: {
                id: "Block_ShulkerBox",
                description: "Additional fields for [shulker box](https://minecraft.wiki/w/shulker box).",
                type: "compound",
                required: ["facing"],
                properties: {
                    facing: {
                        description: "The facing of this shulker box.more info",
                        type: "float",
                    },
                },
                allOf: [
                    {
                        $ref: "Block_Chests",
                    },
                ],
                $fragment: false,
            },
            Block_SignAndHangingSign: {
                id: "Block_SignAndHangingSign",
                description: "Additional fields for [sign](https://minecraft.wiki/w/sign) and hanging sign.",
                type: "compound",
                required: ["BackText", "FrontText", "IsWaxed"],
                properties: {
                    BackText: {
                        description: "A compound which discribes back text. The same structure as FrontText.",
                        type: "compound",
                    },
                    FrontText: {
                        description: "A compound which discribes front text.",
                        type: "compound",
                        required: ["HideGlowOutline", "IgnoreLighting", "PersistFormatting", "SignTextColor", "Text", "TextOwner"],
                        properties: {
                            HideGlowOutline: {
                                description: "1 or 0 (true/false) - true if the outer glow of a sign with glowing text does not show.",
                                type: "byte",
                            },
                            IgnoreLighting: {
                                description:
                                    "1 or 0 (true/false) - true if the sign has been dyed with a [glow ink sac](https://minecraft.wiki/w/glow ink sac).",
                                type: "byte",
                            },
                            PersistFormatting: {
                                description: "Unknown. Defaults to 1.",
                                type: "byte",
                            },
                            SignTextColor: {
                                description:
                                    'The color that has been used to dye the sign. Is a 32-bit encoded color, defaults to `-16777216` (black). One of `-986896` for "White", `-425955` for "Orange", `-3715395` for "Magenta", `-12930086` for "Light Blue", `-75715` for "Yellow", `-8337633` for "Lime", `-816214` for "Pink", `-12103854` for "Gray", `-6447721` for "Light Gray", `-15295332` for "Cyan", `-7785800` for "Purple", `-12827478` for "Blue", `-8170446` for "Brown", `-10585066` for "Green", `-5231066` for "Red", and `-16777216` for "Black".',
                                type: "int",
                            },
                            Text: {
                                description: "The text on it.",
                                type: "string",
                            },
                            TextOwner: {
                                description: "Unknown.",
                                type: "string",
                            },
                        },
                    },
                    IsWaxed: {
                        description: "1 or 0 (true/false) - true if the text is locked with [honeycomb](https://minecraft.wiki/w/honeycomb).",
                        type: "byte",
                    },
                },
                $fragment: false,
            },
            Block_Skull: {
                id: "Block_Skull",
                description: "Additional fields for [skull](https://minecraft.wiki/w/skull).",
                type: "compound",
                required: ["MouthMoving", "MouthTickCount", "Rotation"],
                properties: {
                    MouthMoving: {
                        description: "1 or 0 (true/false) - true if this dragon head's mouth is moving.",
                        type: "byte",
                    },
                    MouthTickCount: {
                        description: "The animation frame of the dragon head's mouth movement.*needs testing*",
                        type: "int",
                    },
                    Rotation: {
                        description: "The rotation of this skull.more info",
                        type: "float",
                    },
                },
                $fragment: false,
            },
            Block_StructureBlock: {
                id: "Block_StructureBlock",
                description: "Additional fields for [structure block](https://minecraft.wiki/w/structure block).",
                type: "compound",
                required: [
                    "animationMode",
                    "animationSeconds",
                    "data",
                    "dataField",
                    "ignoreEntities",
                    "integrity",
                    "isPowered",
                    "mirror",
                    "redstoneSaveMode",
                    "removeBlocks",
                    "rotation",
                    "seed",
                    "showBoundingBox",
                    "structureName",
                    "xStructureOffset",
                    "yStructureOffset",
                    "zStructureOffset",
                    "xStructureSize",
                    "yStructureSize",
                    "zStructureSize",
                ],
                properties: {
                    animationMode: {
                        description: "The mode of animation.more info",
                        type: "byte",
                    },
                    animationSeconds: {
                        description: "The duration of the animation.more info",
                        type: "float",
                    },
                    data: {
                        description:
                            "The mode of the structure block, values for data are the same as the data values for the item. Ex. 0 = Data, 1 = Save, 2 = Load, 3 = Corner, 4 = Inventory, 5 = Export.",
                        type: "int",
                    },
                    dataField: {
                        description: "Unknown.",
                        type: "string",
                    },
                    ignoreEntities: {
                        description: "1 or 0 (true/false) - true if the entities should be ignored in the structure.",
                        type: "byte",
                    },
                    integrity: {
                        description: "How complete the structure is that gets placed.",
                        type: "float",
                    },
                    isPowered: {
                        description: "1 or 0 (true/false) - true if this structure block is being powered by redstone.",
                        type: "byte",
                    },
                    mirror: {
                        description: "How the structure is mirrored.more info",
                        type: "byte",
                    },
                    redstoneSaveMode: {
                        description: "The current redstone mode of this structure block.more info",
                        type: "int",
                    },
                    removeBlocks: {
                        description: "1 or 0 (true/false) - true if the blocks should be removed in the structure.",
                        type: "byte",
                    },
                    rotation: {
                        description: "Rotation of the structure.more info",
                        type: "byte",
                    },
                    seed: {
                        description: "The seed to use for the structure integrity, 0 means random.*needs testing*",
                        type: "long",
                    },
                    showBoundingBox: {
                        description: "1 or 0 (true/false) - true if show the structure's bounding box to players in Creative mode.",
                        type: "byte",
                    },
                    structureName: {
                        description: "Name of the structure.",
                        type: "string",
                    },
                    xStructureOffset: {
                        description: "X-offset of the structure.",
                        type: "int",
                    },
                    yStructureOffset: {
                        description: "Y-offset of the structure.",
                        type: "int",
                    },
                    zStructureOffset: {
                        description: "Z-offset of the structure.",
                        type: "int",
                    },
                    xStructureSize: {
                        description: "X-size of the structure.",
                        type: "int",
                    },
                    yStructureSize: {
                        description: "Y-size of the structure.",
                        type: "int",
                    },
                    zStructureSize: {
                        description: "Z-size of the structure.",
                        type: "int",
                    },
                },
                $fragment: false,
            },
            Block_SuspiciousBlock: {
                id: "Block_SuspiciousBlock",
                description:
                    "Additional fields for [suspicious sand](https://minecraft.wiki/w/suspicious sand) and [suspicious gravel](https://minecraft.wiki/w/suspicious gravel).",
                type: "compound",
                required: ["brush_count", "brush_direction", "type"],
                properties: {
                    brush_count: {
                        description:
                            "The number of times the suspicious block is being brushed by the player, from 1 to 10 (the item will be extracted when it reaches 10). If the player stops brushing, it will progressively return to 0. And if it hasn't been brushed yet, defaults to 0.",
                        type: "int",
                    },
                    brush_direction: {
                        description:
                            "The direction of the suspicious block that was brushed. 0 = Down, 1 = Up, 2 = North, 3 = South, 4 = West, 5 = East, or 6 if it has not been brushed yet.",
                        type: "byte",
                    },
                    item: {
                        description: "(May not exist) The item in the suspicious block.",
                        type: "compound",
                        $ref: "Item_ItemStack",
                    },
                    LootTable: {
                        description: "(May not exist) Loot table to be used to generate the hidden item when brushed.",
                        type: "string",
                    },
                    LootTableSeed: {
                        description: "(May not exist) Seed for generating the loot table. 0 or omitted use a random seed.",
                        type: "int",
                    },
                    type: {
                        description: "The type of suspicious block. Valid types are `minecraft:suspicious_sand` and `minecraft:suspicious_gravel`.",
                        type: "string",
                    },
                },
                $fragment: false,
            },
            Block_TrialSpawner: {
                id: "Block_TrialSpawner",
                description:
                    "Additional fields for [trial spawner](https://minecraft.wiki/w/trial spawner) and [ominous trial spawner](https://minecraft.wiki/w/ominous trial spawner).",
                type: "compound",
                required: [
                    "required_player_range",
                    "normal_config",
                    "ominous_config",
                    "registered_players",
                    "current_mobs",
                    "cooldown_end_at",
                    "next_mob_spawns_at",
                    "spawn_data",
                    "selected_loot_table",
                ],
                properties: {
                    required_player_range: {
                        description: "Between 1 and 128. Defaults to 14. &mdash; Maximum distance in blocks for players to join the battle.",
                        type: "int",
                    },
                    normal_config: {
                        description: "Optional, see configuration for defaults. &mdash; The configuration to use when not ominous.",
                        type: "compound",
                        required: [
                            "spawn_range",
                            "total_mobs",
                            "simultaneous_mobs",
                            "total_mobs_added_per_player",
                            "simultaneous_mobs_added_per_player",
                            "ticks_between_spawn",
                            "target_cooldown_length",
                            "spawn_potentials",
                            "loot_tables_to_eject",
                            "items_to_drop_when_ominous",
                        ],
                        properties: {
                            spawn_range: {
                                description: "Between 1 and 128. Defaults to 4. &mdash; Maximum distance in blocks that mobs can spawn.",
                                type: "int",
                            },
                            total_mobs: {
                                description: "Defaults to 6. &mdash; Total amount of mobs spawned before cooldown for a single player.",
                                type: "float",
                            },
                            simultaneous_mobs: {
                                description: "Defaults to 2. &mdash; The amount of spawned mobs from this spawner that are allowed to exist simultaneously.",
                                type: "float",
                            },
                            total_mobs_added_per_player: {
                                description: "Defaults to 2. &mdash; Amount of total mobs added for each additional player.",
                                type: "float",
                            },
                            simultaneous_mobs_added_per_player: {
                                description: "Defaults to 1. &mdash; Amount of simultaneous mobs added for each additional player.",
                                type: "float",
                            },
                            ticks_between_spawn: {
                                description: "Defaults to 20. &mdash; Time in ticks between spawn attempts.",
                                type: "int",
                            },
                            target_cooldown_length: {
                                description: "Defaults to 36000. &mdash; Time in ticks of the cooldown period. Includes the time spend dispensing the reward.",
                                type: "int",
                            },
                            spawn_potentials: {
                                description: "List of possible entities to spawn.",
                                type: "list",
                                items: {
                                    description:
                                        "A potential future spawn. _After_ the spawner makes an attempt at spawning, it chooses one of these entries at random and uses it to prepare for the next spawn.",
                                    type: "compound",
                                    required: ["Weight", "TypeID", "equipment_loot_table"],
                                    properties: {
                                        Weight: {
                                            description:
                                                "The chance that this spawn gets picked in comparison to other spawn weights. Must be positive and at least 1.",
                                            type: "int",
                                        },
                                        TypeID: {
                                            description: "An entity ID.",
                                            type: "string",
                                        },
                                        equipment_loot_table: {
                                            description:
                                                "Optional path to a [loot table](https://minecraft.wiki/w/loot table). Determines the equipment the entity will wear.",
                                            type: "string",
                                        },
                                    },
                                },
                            },
                            loot_tables_to_eject: {
                                description: "List of possible loot tables to give as reward.",
                                type: "list",
                                items: {
                                    description: "A potential loot table.",
                                    type: "compound",
                                    required: ["weight", "data"],
                                    properties: {
                                        weight: {
                                            description:
                                                "The chance that this loot table gets picked in comparison to other loot table weights. Must be positive and at least 1.",
                                            type: "int",
                                        },
                                        data: {
                                            description: "A path to a [loot table](https://minecraft.wiki/w/loot table).",
                                            type: "string",
                                        },
                                    },
                                },
                            },
                            items_to_drop_when_ominous: {
                                description:
                                    "Defaults to `loot_tables/spawners/trial_chamber/items_to_drop_when_ominous.json` &mdash; A path to a [loot table](https://minecraft.wiki/w/loot table). Determines the items used by [ominous item spawner](https://minecraft.wiki/w/ominous item spawner)s spawned during the active phase when ominous. Ignored in normal mode.",
                                type: "string",
                            },
                        },
                    },
                    ominous_config: {
                        description:
                            "Optional, defaults to normal_config. When individual entries are omitted, they also default to their setting in normal_config. &mdash; The configuration to use when ominous.",
                        type: "compound",
                    },
                    registered_players: {
                        description:
                            "A set of player UUIDs. &mdash; All the players that have joined the battle. The length of this array determines the amount of mobs and amount of reward.",
                        type: "list",
                        items: {
                            description: "A player UUID.",
                            type: "compound",
                            required: ["uuid"],
                            properties: {
                                uuid: {
                                    description: "The UUID.",
                                    type: "long",
                                },
                            },
                        },
                    },
                    current_mobs: {
                        description: "A set of mob UUIDs. &mdash; The mobs that were spawned by this spawner and are still alive.",
                        type: "list",
                        items: {
                            description: "An entity UUID.",
                            type: "compound",
                            required: ["uuid"],
                            properties: {
                                uuid: {
                                    description: "The UUID.",
                                    type: "long",
                                },
                            },
                        },
                    },
                    cooldown_end_at: {
                        description: "Gametime in ticks when the cooldown ends. 0 if not currently in cooldown.",
                        type: "long",
                    },
                    next_mob_spawns_at: {
                        description: "Gametime in ticks when the next spawn attempt happens. 0 if not currently active.",
                        type: "long",
                    },
                    spawn_data: {
                        description:
                            "The next mob to attempt to spawn. Selected from spawn_potentials after the last attempt. Determines the mob displayed in the spawner.",
                        type: "compound",
                        required: ["Weight", "TypeID", "equipment_loot_table"],
                        properties: {
                            Weight: {
                                description: "Unknown.",
                                type: "int",
                            },
                            TypeID: {
                                description: "An entity ID.",
                                type: "string",
                            },
                            equipment_loot_table: {
                                description:
                                    "Optional path to a [loot table](https://minecraft.wiki/w/loot table). Determines the equipment the entity will wear.",
                                type: "string",
                            },
                        },
                    },
                    selected_loot_table: {
                        description:
                            "A path to the [loot table](https://minecraft.wiki/w/loot table) that is given as reward. Unset if not currently giving rewards. Selected from loot_tables_to_eject after all mobs are defeated.",
                        type: "string",
                    },
                },
                $fragment: false,
            },
            Block_Vault: {
                id: "Block_Vault",
                description: "Additional fields for [vault](https://minecraft.wiki/w/vault) and [ominous vault](https://minecraft.wiki/w/ominous vault).",
                type: "compound",
                required: ["config", "data"],
                properties: {
                    config: {
                        description: "Configuration data that does not automatically change. All fields are optional.",
                        type: "compound",
                        required: ["activation_range", "deactivation_range", "loot_table", "override_loot_table_to_display", "key_item"],
                        properties: {
                            activation_range: {
                                description: "The range in blocks when the vault should activate. Defaults to 4.",
                                type: "float",
                            },
                            deactivation_range: {
                                description: "The range in blocks when the vault should deactivate. Defaults to 4.5.",
                                type: "float",
                            },
                            loot_table: {
                                description:
                                    "A path to the [loot table](https://minecraft.wiki/w/loot table) that is ejected when unlocking the vault. Defaults to `loot_tables/chests/trial_chambers/reward.json` for _normal_ vaults and `loot_tables/chests/trial_chambers/reward_ominous.json` for _ominous_ vaults.",
                                type: "string",
                            },
                            override_loot_table_to_display: {
                                description:
                                    "A path to the loot table that is used to display items in the vault. If not present, the game will use the loot_table field.",
                                type: "string",
                            },
                            key_item: {
                                description:
                                    "The key item that is used to check for valid keys. Defaults to `minecraft:trial_key` for _normal_ vaults and `minecraft:ominous_trial_key` for _ominous_ vaults.",
                                type: "compound",
                                $ref: "Item_ItemStack",
                            },
                        },
                    },
                    data: {
                        description: "Data that is used to keep track of the current state of the vault.",
                        type: "compound",
                        required: ["display_item", "items_to_eject", "rewarded_players", "state_updating_resumes_at", "total_ejections_needed"],
                        properties: {
                            display_item: {
                                description: "The item that is currently being displayed.",
                                type: "compound",
                                $ref: "Item_ItemStack",
                            },
                            items_to_eject: {
                                description: "List of item stacks that have been rolled by the loot table and are waiting to be ejected.",
                                type: "list",
                                items: {
                                    description: "An item stack.",
                                    type: "compound",
                                    $ref: "Item_ItemStack",
                                },
                            },
                            rewarded_players: {
                                description: "A set of player UUIDs that have already received their rewards from this vault.",
                                type: "list",
                                items: {
                                    description: "A UUID.",
                                    type: "long",
                                },
                            },
                            state_updating_resumes_at: {
                                description:
                                    "The game time when the vault will process block state changes, such as changing from `unlocking` to `ejecting` after a delay.",
                                type: "long",
                            },
                            total_ejections_needed: {
                                description: "The total amount of item stacks that need to be ejected.",
                                type: "long",
                            },
                        },
                    },
                },
                $fragment: false,
            },
            //#endregion
            //#region Item NBT Schemas
            Item_ItemStack: {
                id: "Item_ItemStack",
                description: "All items share this base.",
                type: "compound",
                required: ["Count", "Damage", "Name", "WasPickedUp"],
                properties: {
                    Block: {
                        description: "(May not exist) What block is placed when placing a block item.",
                        type: "compound",
                        $ref: "Block",
                    },
                    CanDestroy: {
                        description: "(May not exist) Controls what block types this item can destroy.",
                        type: "list",
                        items: {
                            description: "A block ID.",
                            type: "string",
                        },
                    },
                    CanPlaceOn: {
                        description: "(May not exist) Controls what block types this block may be placed on.",
                        type: "list",
                        items: {
                            description: "A block ID.",
                            type: "string",
                        },
                    },
                    Count: {
                        description: "Number of items stacked in this inventory slot.",
                        type: "byte",
                    },
                    Damage: {
                        description: "The metadata value. Note that this tag does not store items' damage value.",
                        type: "short",
                    },
                    Name: {
                        description: "The item ID.",
                        type: "string",
                    },
                    tag: {
                        description: "(May not exist) Additional information about the item.",
                        type: "compound",
                    },
                    WasPickedUp: {
                        description: "Unknown.",
                        type: "byte",
                    },
                },
                $fragment: true,
            },
            Item_ArmorTrim: {
                id: "Item_ArmorTrim",
                description: "Additional fields when an [armor](https://minecraft.wiki/w/armor) is [trimmed](https://minecraft.wiki/w/Smithing Template).",
                type: "compound",
                properties: {
                    tag: {
                        type: "compound",
                        required: ["Trim"],
                        properties: {
                            Trim: {
                                description: "Properties of the armor trim.",
                                type: "compound",
                                required: ["Material", "Pattern"],
                                properties: {
                                    Material: {
                                        description: "The material which decides the color of armor trim.",
                                        type: "string",
                                    },
                                    Pattern: {
                                        description: "The pattern of armor trim.",
                                        type: "string",
                                    },
                                },
                            },
                        },
                    },
                },
                $ref: "Item_ItemStack",
                $fragment: true,
            },
            Item_BookAndQuills: {
                id: "Item_BookAndQuills",
                description: "Additional fields for [book and quill](https://minecraft.wiki/w/book and quill)s.",
                type: "compound",
                properties: {
                    tag: {
                        type: "compound",
                        properties: {
                            pages: {
                                description: "(May not exist) The list of pages in the book.",
                                type: "list",
                                items: {
                                    description: "A single page in the book.",
                                    type: "compound",
                                    required: ["photoname", "text"],
                                    properties: {
                                        photoname: {
                                            description: "Filename of a [photo](https://minecraft.wiki/w/photo) in this page if included.",
                                            type: "string",
                                        },
                                        text: {
                                            description: "The text in this page.",
                                            type: "string",
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                $ref: "Item_ItemStack",
                $fragment: true,
            },
            Item_BucketOfAquaticMob: {
                id: "Item_BucketOfAquaticMob",
                description: "Additional fields for [bucket](https://minecraft.wiki/w/bucket).",
                type: "compound",
                properties: {
                    tag: {
                        type: "compound",
                        required: ["AppendCustomName"],
                        properties: {
                            AppendCustomName: {
                                description: "1 or 0 (true/false) - true if the entity color, state, and id are used to generate the bucket item's name.",
                                type: "byte",
                            },
                            BodyID: {
                                description: "(May not exist) The translation key of entity's state. Used to generate the bucket item's name.",
                                type: "string",
                            },
                            ColorID: {
                                description: "(May not exist) The translation key of a color. Used to generate the bucket item's name.",
                                type: "string",
                            },
                            Color2ID: {
                                description: "(May not exist) The translation key of another color. Used to generate the bucket item's name.",
                                type: "string",
                            },
                            CustomName: {
                                description: "(May not exist) The custom name of entity in it. Used to generate the bucket item's name.",
                                type: "string",
                            },
                            GroupName: {
                                description: "(May not exist) Unknown. Used to generate the bucket item's name.",
                                type: "string",
                            },
                        },
                        allOf: [
                            {
                                $ref: "ActorPrefix",
                            },
                        ],
                    },
                },
                $ref: "Item_ItemStack",
                $fragment: true,
            },
            Item_Crossbow: {
                id: "Item_Crossbow",
                description: "Additional fields for [crossbow](https://minecraft.wiki/w/crossbow).",
                type: "compound",
                properties: {
                    tag: {
                        type: "compound",
                        required: ["chargedItem"],
                        properties: {
                            chargedItem: {
                                description: "The items this crossbow has charged.",
                                type: "compound",
                                $ref: "Item_ItemStack",
                            },
                        },
                    },
                },
                $ref: "Item_ItemStack",
                $fragment: true,
            },
            Item_FilledMap: {
                id: "Item_FilledMap",
                description: "Additional fields for [filled map](https://minecraft.wiki/w/filled map).",
                type: "compound",
                properties: {
                    tag: {
                        type: "compound",
                        required: ["map_display_players", "map_name_index", "map_uuid"],
                        properties: {
                            map_display_players: {
                                description: "1 or 0 (true/false) - (may not exist) true if the map displays player markers.",
                                type: "byte",
                            },
                            map_is_init: {
                                description: "(May not exist) Unknown.",
                                type: "byte",
                            },
                            map_is_scaling: {
                                description: "(May not exist) Unknown.",
                                type: "byte",
                            },
                            map_name_index: {
                                description: "The index of the map's name.",
                                type: "int",
                            },
                            map_scale: {
                                description: "(May not exist) Unknown.",
                                type: "int",
                            },
                            map_uuid: {
                                description: "The UUID of the map used in this item.",
                                type: "long",
                            },
                        },
                    },
                },
                $ref: "Item_ItemStack",
                $fragment: true,
            },
            Item_FireworkRocket: {
                id: "Item_FireworkRocket",
                description: "Additional fields for [firework rocket](https://minecraft.wiki/w/firework rocket).",
                type: "compound",
                properties: {
                    tag: {
                        type: "compound",
                        properties: {
                            Fireworks: {
                                type: "compound",
                                required: ["Explosions", "Flight"],
                                properties: {
                                    Explosions: {
                                        description: "List of compounds representing each explosion this firework causes.",
                                        type: "list",
                                        items: {
                                            description: "A explosion effect.",
                                            type: "compound",
                                            $ref: "FireworkExplosion",
                                        },
                                    },
                                    Flight: {
                                        description:
                                            "Indicates the flight duration of the firework (equals the amount of gunpowder used in crafting the rocket). Can be anything from -128 to 127.",
                                        type: "byte",
                                    },
                                },
                            },
                        },
                    },
                },
                $ref: "Item_ItemStack",
                $fragment: true,
            },
            Item_FireworkStar: {
                id: "Item_FireworkStar",
                description: "Additional fields for [firework star](https://minecraft.wiki/w/firework star).",
                type: "compound",
                properties: {
                    tag: {
                        type: "compound",
                        required: ["customColor", "FireworksItem"],
                        properties: {
                            customColor: {
                                description: "The color of this firework star.",
                                type: "int",
                            },
                            FireworksItem: {
                                description: "The explosion effect contributed by this firework star.",
                                type: "compound",
                                $ref: "FireworkExplosion",
                            },
                        },
                    },
                },
                $ref: "Item_ItemStack",
                $fragment: true,
            },
            Item_GlowStick: {
                id: "Item_GlowStick",
                description: "Additional fields for [glow stick](https://minecraft.wiki/w/glow stick).",
                type: "compound",
                properties: {
                    active_time: {
                        description: "(May not exist) Unknown.",
                        type: "long",
                    },
                },
                $ref: "Item_ItemStack",
                $fragment: true,
            },
            Item_HorseArmor: {
                id: "Item_HorseArmor",
                description: "Additional fields for [horse armor](https://minecraft.wiki/w/horse armor).",
                type: "compound",
                properties: {
                    tag: {
                        type: "compound",
                        properties: {
                            customColor: {
                                description: "(May not exist) The color of the leather armor.",
                                type: "int",
                            },
                        },
                    },
                },
                $ref: "Item_ItemStack",
                $fragment: true,
            },
            Item_LodestoneCompass: {
                id: "Item_LodestoneCompass",
                description: "Additional fields for [lodestone compass](https://minecraft.wiki/w/lodestone compass).",
                type: "compound",
                properties: {
                    tag: {
                        type: "compound",
                        required: ["trackingHandle"],
                        properties: {
                            trackingHandle: {
                                description: "The ID of lodestone to track.",
                                type: "int",
                            },
                        },
                    },
                },
                $ref: "Item_ItemStack",
                $fragment: true,
            },
            Item_Potion: {
                id: "Item_Potion",
                description: "Additional fields for [potion](https://minecraft.wiki/w/potion).",
                type: "compound",
                properties: {
                    tag: {
                        type: "compound",
                        required: ["wasJustBrewed"],
                        properties: {
                            wasJustBrewed: {
                                description: "1 or 0 (true/false) - (may not exist) true if item is brewed in brewing stand.",
                                type: "byte",
                            },
                        },
                    },
                },
                $ref: "Item_ItemStack",
                $fragment: true,
            },
            Item_Shield: {
                id: "Item_Shield",
                description: "Additional fields for [shield](https://minecraft.wiki/w/shield).",
                type: "compound",
                properties: {
                    tag: {
                        type: "compound",
                        required: ["Base"],
                        properties: {
                            Base: {
                                description: "The base color of the banner on the shield. See [Banner#Block_data](https://minecraft.wiki/w/Banner#Block_data).",
                                type: "int",
                            },
                            Patterns: {
                                description: "(May not exist) List of all patterns applied to the banner on the shield.",
                                type: "list",
                                items: {
                                    description: "An individual pattern.",
                                    type: "compound",
                                    required: ["Color", "Pattern"],
                                    properties: {
                                        Color: {
                                            description: "The base color of the pattern. See [Banner#Block_data](https://minecraft.wiki/w/Banner#Block_data).",
                                            type: "int",
                                        },
                                        Pattern: {
                                            description: "The pattern ID code. See [Banner#Block_data](https://minecraft.wiki/w/Banner#Block_data).",
                                            type: "string",
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                $ref: "Item_ItemStack",
                $fragment: true,
            },
            Item_WrittenBook: {
                id: "Item_WrittenBook",
                description: "Additional fields for [written book](https://minecraft.wiki/w/written book).",
                type: "compound",
                properties: {
                    tag: {
                        type: "compound",
                        required: ["author", "generation", "pages", "title", "xuid"],
                        properties: {
                            author: {
                                description: "The author of this book.",
                                type: "string",
                            },
                            generation: {
                                description: "The copy tier of the book. 0 = Original, 1 = Copy of original, 2 = Copy of copy.",
                                type: "int",
                            },
                            pages: {
                                description: "The list of pages in the book.",
                                type: "list",
                                items: {
                                    description: "A single page in the book.",
                                    type: "compound",
                                    required: ["photoname", "text"],
                                    properties: {
                                        photoname: {
                                            description: "Filename of a [photo](https://minecraft.wiki/w/photo) in this page if included.",
                                            type: "string",
                                        },
                                        text: {
                                            description: "The text in this page.",
                                            type: "string",
                                        },
                                    },
                                },
                            },
                            title: {
                                description: "The title of this book.",
                                type: "string",
                            },
                            xuid: {
                                description: "Unknown.",
                                type: "long",
                            },
                        },
                    },
                },
                $ref: "Item_ItemStack",
                $fragment: true,
            },
            //#endregion
            //#region Component NBT Schemas
            Component_Economy_trade_table: {
                id: "Component_Economy_trade_table",
                description: "This component is used by villagers and wandering traders.",
                type: "compound",
                required: ["Riches"],
                properties: {
                    Riches: {
                        description: "Unknown.",
                        type: "int",
                    },
                    Offers: {
                        description: "(May not exist) The trade info.",
                        type: "compound",
                        required: ["Recipes", "TierExpRequirements"],
                        properties: {
                            Recipes: {
                                description: "The list of trade recipes.",
                                type: "list",
                                items: {
                                    description: "A recipe.",
                                    type: "compound",
                                    required: [
                                        "buyA",
                                        "sell",
                                        "tier",
                                        "uses",
                                        "maxUses",
                                        "traderExp",
                                        "rewardExp",
                                        "demand",
                                        "buyCountA",
                                        "buyCountB",
                                        "priceMultiplierA",
                                        "priceMultiplierB",
                                    ],
                                    properties: {
                                        buyA: {
                                            description: "The first 'cost' item.",
                                            type: "compound",
                                            $ref: "Item_ItemStack",
                                        },
                                        buyB: {
                                            description: "(May not exist) The second 'cost' item",
                                            type: "compound",
                                            $ref: "Item_ItemStack",
                                        },
                                        sell: {
                                            description: "The item being sold for each set of cost items.",
                                            type: "compound",
                                            $ref: "Item_ItemStack",
                                        },
                                        tier: {
                                            description: "The tier that the trader needs to reach to access this recipe.",
                                            type: "int",
                                        },
                                        uses: {
                                            description:
                                                "The number of times this trade has been used. The trade becomes disabled when this is greater or equal to maxUses.",
                                            type: "int",
                                        },
                                        maxUses: {
                                            description:
                                                "The maximum number of times this trade can be used before it is disabled. Increases by a random amount from 2 to 12 when offers are refreshed.*needs testing*",
                                            type: "int",
                                        },
                                        traderExp: {
                                            description: "The trade experiences to be rewarded to this trader entity.",
                                            type: "int",
                                        },
                                        rewardExp: {
                                            description: "1 or 0 (true/false) - true if this trade provides XP orb drops.",
                                            type: "byte",
                                        },
                                        demand: {
                                            description: "The price adjuster of the first 'cost' item based on demand. Updated when a villager resupply.",
                                            type: "int",
                                        },
                                        buyCountA: {
                                            description: "The count needed for the first 'cost' item.",
                                            type: "int",
                                        },
                                        buyCountB: {
                                            description: "The count needed for the second 'cost' item.",
                                            type: "int",
                                        },
                                        priceMultiplierA: {
                                            description:
                                                "The multiplier on the demand and discount price adjuster; the final adjusted price is added to the first 'cost' item's price.",
                                            type: "float",
                                        },
                                        priceMultiplierB: {
                                            description:
                                                "The multiplier on the demand and discount price adjuster; the final adjusted price is added to the second 'cost' item's price.",
                                            type: "float",
                                        },
                                    },
                                },
                            },
                            TierExpRequirements: {
                                description: "Trade experiences required to become each trade tier.",
                                type: "list",
                                items: {
                                    description: "A tier.",
                                    type: "compound",
                                    required: ["<''tier_level_num''>"],
                                    properties: {
                                        "<''tier_level_num''>": {
                                            description: "Trade xperiences required to become this tier.",
                                            type: "int",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    ConvertedFromVillagerV1: {
                        description: "(May not exist) Unknown.",
                        type: "byte",
                    },
                    TradeTablePath: {
                        description: "(May not exist) The path of the json file of the trade table.",
                        type: "string",
                    },
                    LowTierCuredDiscount: {
                        description: "(May not exist) The discount price adjuster gained by curing zombie villagers",
                        type: "int",
                    },
                    HighTierCuredDiscount: {
                        description: "(May not exist) The discount price adjuster gained by curing zombie villagers",
                        type: "int",
                    },
                    NearbyCuredDiscount: {
                        description: "(May not exist) The discount price adjuster gained by curing nearby zombie villagers",
                        type: "int",
                    },
                    NearbyCuredDiscountTimeStamp: {
                        description: "(May not exist) The discount price adjuster gained by curing nearby zombie villagers",
                        type: "int",
                    },
                },
                $fragment: false,
            },
            Component_Ageable: {
                id: "Component_Ageable",
                description:
                    "This component is used by axolotls, bees, cats, chickens, cows, dolphins, donkeys, foxes, goats, hoglins, horses, llamas, mooshrooms, mules, ocelots, pandas, pigs, polar bears, rabbits, sheep, skeleton horses, sniffers, striders, tadpoles, turtles, villagers, wolves, and zombie horses.",
                type: "compound",
                required: ["Age"],
                properties: {
                    Age: {
                        description: "Represents the age of the entity in ticks; when negative, the entity is a baby. When 0, the entity becomes an adult.",
                        type: "int",
                    },
                },
                $fragment: false,
            },
            Component_Balloon: {
                id: "Component_Balloon",
                description:
                    "This component is used by allays, bees, chickens, cows, donkeys, foxes, glow squids, horses, iron golems, llamas, mooshrooms, mules, pandas, pigs, rabbits, sheep, skeleton horses, snow golems, and zombie horses.",
                type: "compound",
                required: ["ballon_attached", "ballon_max_height", "ballon_should_drop"],
                properties: {
                    ballon_attached: {
                        description: "The Unique ID of the attached entity.",
                        type: "long",
                    },
                    ballon_max_height: {
                        description: "Max height.",
                        type: "float",
                    },
                    ballon_should_drop: {
                        description: "Unknown",
                        type: "byte",
                    },
                },
                $fragment: false,
            },
            Component_Breathable: {
                id: "Component_Breathable",
                description:
                    "This component is used by axolotls, bats, bees, cats, cave spiders, chickens, cows, creepers, dolphins, donkeys, drowned, elder guardians, endermen, endermites, evokers, fish, foxes, frogs, ghasts, glow squids, goats, guardians, hoglins, horses, husks, llamas, magma cubes, mooshrooms, mules, ocelots, pandas, parrots, phantoms, piglins, piglin brutes, pillagers, pigs, players, polar bears, pufferfish, rabbits, ravagers, salmon, sheep, shulkers, silverfish, skeletons, skeleton horses, slimes, sniffers, snow golems, tropical fish, spiders, squids, sea turtles, strays, villagers, vindicators, wardens, wandering traders, withers, wither skeletons, tadpoles, witches, wolves, zombies, zoglins, zombie horses, zombified piglins, and zombie villagers.",
                type: "compound",
                required: ["Air"],
                properties: {
                    Air: {
                        description: "How much air the living entity has, in ticks.",
                        type: "short",
                    },
                },
                $fragment: false,
            },
            Component_Breedable: {
                id: "Component_Breedable",
                description:
                    "This component is used by axolotls, bees, cats, chickens, cows, dolphins, donkeys, foxes, goats, hoglins, horses, llamas, mooshrooms, mules, ocelots, pandas, pigs, polar bears, rabbits, sheep, skeleton horses, sniffers, striders, tadpoles, turtles, villagers, wolves, and zombie horses.",
                type: "compound",
                required: ["InLove", "LoveCause", "BreedCooldown"],
                properties: {
                    InLove: {
                        description:
                            "Number of ticks until the entity loses its breeding hearts and stops searching for a mate. 0 when not searching for a mate *needs testing*.",
                        type: "int",
                    },
                    LoveCause: {
                        description: "The Unique ID of the entity that caused this animal to breed.",
                        type: "long",
                    },
                    BreedCooldown: {
                        description: "Unknown",
                        type: "int",
                    },
                },
                $fragment: false,
            },
            Component_Bribeable: {
                id: "Component_Bribeable",
                description: "This component is only used by dolphins.",
                type: "compound",
                required: ["BribeTime"],
                properties: {
                    BribeTime: {
                        description: "Unknown<!--Time in ticks before the Entity can be bribed again.*needs testing*-->",
                        type: "int",
                    },
                },
                $fragment: false,
            },
            Component_Inventory: {
                id: "Component_Inventory",
                description:
                    "This component is used by minecarts with chest, minecarts with command block, minecarts with hopper, horses, donkeys, llamas, mules, pandas, and villagers.",
                type: "compound",
                required: ["InventoryVersion", "LootTable", "LootTableSeed"],
                properties: {
                    ChestItems: {
                        type: "list",
                        items: {
                            description: "An item in the inventory, including the slot tag.",
                            type: "compound",
                            required: ["Slot"],
                            properties: {
                                Slot: {
                                    description: "The slot the item is in.",
                                    type: "byte",
                                },
                            },
                        },
                    },
                    InventoryVersion: {
                        description: "e.g. 1.17.20-beta23",
                        type: "string",
                    },
                    LootTable: {
                        description: "Loot table to be used to fill the inventory when it is next opened, or the items are otherwise interacted with.",
                        type: "string",
                    },
                    LootTableSeed: {
                        description: "Seed for generating the loot table. 0 or omitted uses a random seed *needs testing*.",
                        type: "int",
                    },
                },
                $fragment: false,
            },
            Component_Damage_over_time: {
                id: "Component_Damage_over_time",
                description: "This component is used by axolotls and dolphins.",
                type: "compound",
                required: ["DamageTime"],
                properties: {
                    DamageTime: {
                        description: "Unknown",
                        type: "short",
                    },
                },
                $fragment: false,
            },
            Component_Drying_out_timer: {
                id: "Component_Drying_out_timer",
                description: "This component is used by axolotls and dolphins.",
                type: "compound",
                required: ["CompleteTick", "State"],
                properties: {
                    CompleteTick: {
                        description: "The time when this entity completely dries out.",
                        type: "long",
                    },
                    State: {
                        description: "Must be a boolean. 1 if it already dried out.",
                        type: "int",
                    },
                },
                $fragment: false,
            },
            Component_Dweller: {
                id: "Component_Dweller",
                description:
                    'This component is used by cats, iron golems, villagers, evokers, pillagers, ravagers, vindicators, and witches. These mobs are classified into "roles" in the component, with cats being "passive", iron golems being "defenders", evokers, pillagers, ravagers, vindicators, and witches being "hostile", and villagers being "inhabitants".',
                type: "compound",
                required: ["DwellingUniqueID", "RewardPlayersOnFirstFounding"],
                properties: {
                    DwellingUniqueID: {
                        description: "Unknown",
                        type: "string",
                    },
                    RewardPlayersOnFirstFounding: {
                        description: "Unknown",
                        type: "byte",
                    },
                    PreferredProfession: {
                        description: "(May not exist) Unknown",
                        type: "string",
                    },
                },
                $fragment: false,
            },
            Component_Explode: {
                id: "Component_Explode",
                description: "This component is used by TNT, minecarts with TNT, creepers, ghast fireballs, end crystals, and wither skulls.",
                type: "compound",
                properties: {
                    Fuse: {
                        description: "(May not exist)  Number of ticks before the explosion",
                        type: "byte",
                    },
                    IsFuseLit: {
                        description: "(May not exist)  Does the time before the explosion started decreasing",
                        type: "byte",
                    },
                    AllowUnderwater: {
                        description: "(May not exist)  Explosion will cause damage to territory even underwater",
                        type: "byte",
                    },
                },
                $fragment: false,
            },
            Component_Genetics: {
                id: "Component_Genetics",
                description: "This component is used by goat and pandas.",
                type: "compound",
                properties: {
                    GeneArray: {
                        type: "list",
                        items: {
                            description: "A gene pair",
                            type: "compound",
                            required: ["HiddenAllele", "MainAllele"],
                            properties: {
                                HiddenAllele: {
                                    description: "the hidden allele.more info",
                                    type: "int",
                                },
                                MainAllele: {
                                    description: "the main allele.more info",
                                    type: "int",
                                },
                            },
                        },
                    },
                },
                $fragment: false,
            },
            Component_Home: {
                id: "Component_Home",
                description: "This component is used by bees, elder guardians, guardians, piglin brutes, and turtles.",
                type: "compound",
                required: ["HomePos", "HomeDimensionId"],
                properties: {
                    HomePos: {
                        description: "The position of the entity's home.",
                        type: "list",
                        items: [
                            {
                                description: "X",
                                type: "float",
                            },
                            {
                                description: "Y",
                                type: "float",
                            },
                            {
                                description: "Z",
                                type: "float",
                            },
                        ],
                    },
                    HomeDimensionId: {
                        description: "The dimension where the entity's home is.",
                        type: "int",
                    },
                },
                $fragment: false,
            },
            Component_Insomnia: {
                id: "Component_Insomnia",
                description: "This component is only used by players.",
                type: "compound",
                required: ["TimeSinceRest"],
                properties: {
                    TimeSinceRest: {
                        description: "The time in ticks since last rest.",
                        type: "int",
                    },
                },
                $fragment: false,
            },
            Component_Trade_table: {
                id: "Component_Trade_table",
                description: "This component is used by old villagers.",
                type: "compound",
                required: ["sizeOfTradeFirstTimeVector", "TradeTier", "Riches", "Willing"],
                properties: {
                    sizeOfTradeFirstTimeVector: {
                        description: "Unknown",
                        type: "int",
                    },
                    FirstTimeTrade: {
                        description: "(May not exist) Unknown",
                        type: "int",
                    },
                    TradeTier: {
                        description: "Unknown",
                        type: "int",
                    },
                    Riches: {
                        description: "Unknown",
                        type: "int",
                    },
                    Willing: {
                        description: "Unknown",
                        type: "byte",
                    },
                    Offers: {
                        description: "(May not exist) Unknown",
                        type: "list",
                    },
                },
                $fragment: false,
            },
            Component_Tamemount: {
                id: "Component_Tamemount",
                description: "This component is used by horses, donkeys, mules, and llamas.",
                type: "compound",
                required: ["Temper"],
                properties: {
                    Temper: {
                        description:
                            "Random number that ranges from 0 to 100; increases with feeding or trying to tame it. Higher values make a horse easier to tame.",
                        type: "int",
                    },
                },
                $fragment: false,
            },
            Component_Npc: {
                id: "Component_Npc",
                description: "This component is only used by NPCs.",
                type: "compound",
                properties: {
                    RawtextName: {
                        description: "(May not exist) The name.more info",
                        type: "string",
                    },
                    InteractiveText: {
                        description: "(May not exist) The interactive text.more info",
                        type: "string",
                    },
                    Actions: {
                        description: "(May not exist) The actions.more info",
                        type: "string",
                    },
                    PlayerSceneMapping: {
                        description: "(May not exist) Unknown",
                        type: "list",
                        items: {
                            description: "A key-value pair.",
                            type: "compound",
                            required: ["PlayerID", "SceneName"],
                            properties: {
                                PlayerID: {
                                    description: "A player's Unique ID.",
                                    type: "long",
                                },
                                SceneName: {
                                    description: "Unknown",
                                    type: "string",
                                },
                            },
                        },
                    },
                },
                $fragment: false,
            },
            Component_Projectile: {
                id: "Component_Projectile",
                description: "The entity's root tag.",
                type: "compound",
                required: ["TargetID", "StuckToBlockPos", "CollisionPos"],
                properties: {
                    TargetID: {
                        description: "Optional. The UniqueID of the entity which the projectile was launched to.",
                        type: "long",
                    },
                    StuckToBlockPos: {
                        description: "Unknown.",
                        type: "list",
                        items: [
                            {
                                description: "X",
                                type: "int",
                            },
                            {
                                description: "Y",
                                type: "int",
                            },
                            {
                                description: "Z",
                                type: "int",
                            },
                        ],
                    },
                    CollisionPos: {
                        description: "Unknown.",
                        type: "list",
                        items: [
                            {
                                description: "X",
                                type: "float",
                            },
                            {
                                description: "Y",
                                type: "float",
                            },
                            {
                                description: "Z",
                                type: "float",
                            },
                        ],
                    },
                },
                $fragment: false,
            },
            Component_Spawn_entity: {
                id: "Component_Spawn_entity",
                description: "This component is used by chickens and wandering traders.",
                type: "compound",
                properties: {
                    entries: {
                        type: "list",
                        items: {
                            description: "An entry.",
                            type: "compound",
                            required: ["SpawnTimer", "StopSpawning"],
                            properties: {
                                SpawnTimer: {
                                    description: "Unknown",
                                    type: "int",
                                },
                                StopSpawning: {
                                    description: "Unknown",
                                    type: "byte",
                                },
                            },
                        },
                    },
                },
                $fragment: false,
            },
            Component_Timer: {
                id: "Component_Timer",
                description:
                    "This component is used by bees, boats, guardians, hoglins, husks, piglins, piglin brutes, players, pufferfish, ravagers, skeletons, wandering traders, and zombies.",
                type: "compound",
                required: ["TimeStamp", "HasExecuted", "CountTime"],
                properties: {
                    TimeStamp: {
                        description: "Unknown",
                        type: "long",
                    },
                    HasExecuted: {
                        description: "Unknown",
                        type: "byte",
                    },
                    CountTime: {
                        description: "Deprecated. Unknown",
                        type: "int",
                    },
                },
                $fragment: false,
            },
            Component_Trade_resupply: {
                id: "Component_Trade_resupply",
                description: "This component is only used by villagers.",
                type: "compound",
                required: ["HasResupplied"],
                properties: {
                    HasResupplied: {
                        description: "Unknown",
                        type: "byte",
                    },
                },
                $fragment: false,
            },
            Component_Trust: {
                id: "Component_Trust",
                description: "This component is only used by foxes.",
                type: "compound",
                required: ["TrustedPlayersAmount", "TrustedPlayer[0-9]+"],
                properties: {
                    TrustedPlayersAmount: {
                        description: "The number of players who are trusted by this entity.",
                        type: "int",
                    },
                },
                patternProperties: {
                    "TrustedPlayer[0-9]+": {
                        description: "A player's Unique ID. Note that <num> counts from 0.",
                        type: "long",
                    },
                },
                $fragment: false,
            },
            Component_CommandBlockComponent: {
                id: "Component_CommandBlockComponent",
                description:
                    "This component may be not accessable with [Behavior Pack](https://minecraft.wiki/w/Add-on). But it is used by activated [Minecart with Command Block](https://minecraft.wiki/w/Minecart with Command Block)",
                type: "compound",
                required: ["Ticking", "CurrentTickCount"],
                properties: {
                    Ticking: {
                        description: "Unknown",
                        type: "byte",
                    },
                    CurrentTickCount: {
                        description: "Number of ticks until it executes the command again.",
                        type: "int",
                    },
                },
                $fragment: false,
            },
            Component_FogCommandComponent: {
                id: "Component_FogCommandComponent",
                description: "This component may be not accessable with [Behavior Pack](https://minecraft.wiki/w/Add-on). But it is used by player entity.",
                type: "compound",
                required: ["fogCommandStack"],
                properties: {
                    fogCommandStack: {
                        description: "Unknown.",
                        type: "list",
                        items: {
                            description: "Unknown.",
                            type: "string",
                        },
                    },
                },
                $fragment: false,
            },
            Component_Hide: {
                id: "Component_Hide",
                description: "This component is only used by villagers.",
                type: "compound",
                required: ["IsInRaid", "ReactToBell"],
                properties: {
                    IsInRaid: {
                        description: "Unknown",
                        type: "byte",
                    },
                    ReactToBell: {
                        description: "Unknown",
                        type: "byte",
                    },
                },
                $fragment: false,
            },
            //#endregion
        } as const satisfies Record<string, NBTSchema | NBTSchemaFragment> & Partial<Record<DBEntryContentType, NBTSchema>>,
        {
            /**
             * This is an alias of {@link nbtSchemas.PlayerClient}, this only exists because it is what it is called on the Minecraft Wiki, so it is here for the Minecraft Wiki data to schema converter.
             *
             * @deprecated Use {@link nbtSchemas.PlayerClient} instead.
             */
            Players: {
                key: "PlayerClient",
                description: "The players data.",
            },
            /**
             * This is an alias of {@link nbtSchemas.TickingArea}, this only exists because it is what it is called on the Minecraft Wiki, so it is here for the Minecraft Wiki data to schema converter.
             *
             * @deprecated Use {@link nbtSchemas.TickingArea} instead.
             */
            Tickingarea: {
                key: "TickingArea",
            },
        }
    );

    export const GenericPrismarineJSONNBTSchema: JSONSchema = {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $id: "https://example.com/compound.schema.json",
        title: "Prismarine NBT JSON Schema",
        type: "object",
        required: ["type", "value"],
        properties: {
            type: {
                const: "compound",
            },
            value: {
                type: "object",
                additionalProperties: {
                    anyOf: [
                        { type: "null" },
                        {
                            type: "object",
                            oneOf: [
                                {
                                    properties: {
                                        type: { const: "byte" },
                                        value: { type: "integer" },
                                    },
                                    required: ["type", "value"],
                                },
                                {
                                    properties: {
                                        type: { const: "short" },
                                        value: { type: "integer" },
                                    },
                                    required: ["type", "value"],
                                },
                                {
                                    properties: {
                                        type: { const: "int" },
                                        value: { type: "integer" },
                                    },
                                    required: ["type", "value"],
                                },
                                {
                                    properties: {
                                        type: { const: "long" },
                                        value: {
                                            type: "array",
                                            items: { type: "integer" },
                                            minItems: 2,
                                            maxItems: 2,
                                        },
                                    },
                                    required: ["type", "value"],
                                },
                                {
                                    properties: {
                                        type: { const: "float" },
                                        value: { type: "number" },
                                    },
                                    required: ["type", "value"],
                                },
                                {
                                    properties: {
                                        type: { const: "double" },
                                        value: { type: "number" },
                                    },
                                    required: ["type", "value"],
                                },
                                {
                                    properties: {
                                        type: { const: "string" },
                                        value: { type: "string" },
                                    },
                                    required: ["type", "value"],
                                },
                                {
                                    properties: {
                                        type: { const: "list" },
                                        value: {
                                            type: "object",
                                            properties: {
                                                type: { type: "string" },
                                                value: {
                                                    type: "array",
                                                },
                                            },
                                            required: ["type", "value"],
                                        },
                                    },
                                    required: ["type", "value"],
                                },
                                {
                                    properties: {
                                        type: { const: "compound" },
                                        value: { $ref: "#" },
                                    },
                                    required: ["type", "value"],
                                },
                                {
                                    properties: {
                                        type: { const: "byteArray" },
                                        value: {
                                            type: "array",
                                            items: { type: "integer" },
                                        },
                                    },
                                    required: ["type", "value"],
                                },
                                {
                                    properties: {
                                        type: { const: "shortArray" },
                                        value: {
                                            type: "array",
                                            items: { type: "integer" },
                                        },
                                    },
                                    required: ["type", "value"],
                                },
                                {
                                    properties: {
                                        type: { const: "intArray" },
                                        value: {
                                            type: "array",
                                            items: { type: "integer" },
                                        },
                                    },
                                    required: ["type", "value"],
                                },
                                {
                                    properties: {
                                        type: { const: "longArray" },
                                        value: {
                                            type: "array",
                                            items: {
                                                type: "array",
                                                items: { type: "integer" },
                                                minItems: 2,
                                                maxItems: 2,
                                            },
                                        },
                                    },
                                    required: ["type", "value"],
                                },
                            ],
                        },
                    ],
                },
            },
        },
    };

    /**
     * A top-level NBT schema.
     */
    export interface NBTSchema extends NBTSubSchema {
        /**
         * The ID of this schema.
         */
        id: string;
        /**
         * If this is a schema fragment.
         *
         * A schema fragment is a top-level schema that is able to have types other than compound, but is only meant to be used inside of other schemas.
         *
         * @default false
         */
        $fragment?: false;
        type: "compound";
    }

    /**
     * A top-level NBT schema fragment.
     */
    export interface NBTSchemaFragment extends NBTSubSchema {
        /**
         * The ID of this schema.
         */
        id: string;
        /**
         * If this is a schema fragment.
         *
         * A schema fragment is a top-level schema that is able to have types other than compound, but is only meant to be used inside of other schemas.
         *
         * @default false
         */
        $fragment: true;
    }

    /**
     * A reference to an NBT schema.
     */
    export type NBTSchemaRef = NBTSchema | NBTSchemaFragment | boolean;

    /**
     * A reference to an NBT sub-schema.
     */
    export type NBTSubSchemaRef = NBTSubSchema | boolean;

    /**
     * An NBT sub-schema.
     *
     * This type should NOT be used for top-level schemas or schema fragments, use {@link NBTSchema} or {@link NBTSchemaFragment} instead.
     */
    export interface NBTSubSchema {
        id?: string;
        $id?: string;
        $schema?: string;
        /**
         * If this is a schema fragment.
         *
         * A schema fragment is a top-level schema that is able to have types other than compound, but is only meant to be used inside of other schemas.
         *
         * @default false
         */
        $fragment?: boolean;
        type?: `${NBT.TagType}` | `${NBT.TagType}`[];
        /**
         * @todo
         */
        title?: string;
        /**
         * @todo
         */
        default?: any;
        /**
         * @todo
         */
        definitions?: {
            [name: string]: NBTSchema;
        };
        /**
         * @todo
         */
        description?: string;
        /**
         * @todo
         */
        properties?: NBTSchemaMap;
        /**
         * @todo
         */
        patternProperties?: NBTSchemaMap;
        /**
         * @todo
         */
        patternPropertiesTS?: NBTSchemaMap;
        /**
         * @todo
         */
        additionalProperties?: boolean | NBTSubSchemaRef;
        /**
         * @todo
         */
        minProperties?: number;
        /**
         * @todo
         */
        maxProperties?: number;
        /**
         * @todo
         */
        dependencies?:
            | NBTSchemaMap
            | {
                  [prop: string]: string[];
              };
        /**
         * @todo
         */
        items?: NBTSubSchemaRef | NBTSubSchemaRef[];
        /**
         * @todo
         */
        minItems?: number;
        /**
         * @todo
         */
        maxItems?: number;
        /**
         * @todo
         */
        uniqueItems?: boolean;
        /**
         * @todo
         */
        additionalItems?: boolean | NBTSubSchemaRef;
        /**
         * @todo
         */
        pattern?: string;
        /**
         * @todo
         */
        minLength?: number;
        /**
         * @todo
         */
        maxLength?: number;
        /**
         * @todo
         */
        minimum?: number;
        /**
         * @todo
         */
        maximum?: number;
        /**
         * @todo
         */
        exclusiveMinimum?: boolean | number;
        /**
         * @todo
         */
        exclusiveMaximum?: boolean | number;
        /**
         * @todo
         */
        multipleOf?: number;
        /**
         * @todo
         */
        required?: string[];
        /**
         * @todo
         */
        $ref?: string;
        /**
         * @todo
         */
        anyOf?: NBTSubSchemaRef[];
        /**
         * @todo
         */
        allOf?: NBTSubSchemaRef[];
        /**
         * @todo
         */
        oneOf?: NBTSubSchemaRef[];
        /**
         * @todo
         */
        not?: NBTSubSchemaRef;
        /**
         * @todo
         */
        enum?: NBT.Tags[NBT.TagType][];
        /**
         * @todo
         */
        format?: string;
        /**
         * @todo
         */
        const?: any;
        /**
         * @todo
         */
        contains?: NBTSubSchemaRef;
        /**
         * @todo
         */
        propertyNames?: NBTSubSchemaRef;
        /**
         * @todo
         */
        examples?: NBT.Tags[NBT.TagType][];
        /**
         * @todo
         */
        $comment?: string;
        /**
         * @todo
         */
        if?: NBTSubSchemaRef;
        /**
         * @todo
         */
        then?: NBTSubSchemaRef;
        /**
         * @todo
         */
        else?: NBTSubSchemaRef;
        /**
         * @todo
         */
        defaultSnippets?: {
            label?: string;
            description?: string;
            markdownDescription?: string;
            body?: any;
            bodyText?: string;
        }[];
        /**
         * @todo
         */
        errorMessage?: string;
        /**
         * @todo
         */
        patternErrorMessage?: string;
        /**
         * @todo
         */
        deprecationMessage?: string;
        /**
         * @todo
         */
        enumDescriptions?: string[];
        /**
         * @todo
         */
        markdownEnumDescriptions?: string[];
        /**
         * @todo
         */
        markdownDescription?: string;
        /**
         * @todo
         */
        doNotSuggest?: boolean;
        /**
         * @todo
         */
        suggestSortText?: string;
        /**
         * @todo
         */
        allowComments?: boolean;
        /**
         * @todo
         */
        allowTrailingCommas?: boolean;
    }

    /**
     * An NBT schema map.
     *
     * Used for certain schema properties like {@link NBTSubSchema.properties} and {@link NBTSubSchema.patternProperties}.
     */
    export interface NBTSchemaMap {
        /**
         * An entry in this NBT schema map.
         */
        [name: string]: NBTSubSchema;
    }

    /**
     * Utilities for working with NBT schemas.
     */
    export namespace Utils {
        /**
         * Utilities for converting to and from NBT schemas.
         */
        export namespace Conversion {
            /**
             * Utilities for converting NBT schemas to JSON schemas.
             */
            export namespace ToJSONSchema {
                export interface ConvertOptions {
                    inlineRefs?: boolean; // default: true (backwards-compatible)
                }

                /**
                 * Convert a custom NBT schema into JSON Schema for NBT tags.
                 */
                export function nbtSchemaToJsonSchema(
                    schema: Partial<(Omit<NBTSchema, keyof NBTSubSchema> & NBTSubSchema) | boolean>,
                    allSchemas: Record<string, NBTSchema | NBTSchemaFragment> = nbtSchemas,
                    options: ConvertOptions = {}
                ): JSONSchemaRef {
                    if (typeof schema === "boolean") {
                        return schema;
                    }

                    if (schema.$ref) {
                        if (options.inlineRefs ?? true) {
                            const refTarget: NBTSchema | NBTSchemaFragment | undefined = allSchemas[schema.$ref];
                            if (!refTarget) {
                                throw new Error(`Unknown $ref: ${schema.$ref}`);
                            }
                            return nbtSchemaToJsonSchema(refTarget, allSchemas, options);
                        } else {
                            return { $ref: schema.$ref }; // preserve the ref
                        }
                    }

                    const jsonSchema: JSONSchema = {
                        id: schema.id,
                        $id: schema.$id,
                        $schema: schema.$schema,
                        title: schema.title,
                        description: schema.description,
                    };

                    if (schema.type) {
                        if (Array.isArray(schema.type)) {
                            jsonSchema.oneOf = schema.type.map((t) => tagTypeToSchema(t, schema, allSchemas, options));
                        } else {
                            if (schema.type === "compound" && schema.id && !schema.properties) {
                                const data: JSONSchema = tagTypeToSchema(schema.type, schema, allSchemas, options);
                                Object.assign(jsonSchema, { ...data, ...(data.properties!.value as JSONSchema) });
                            } else {
                                Object.assign(jsonSchema, tagTypeToSchema(schema.type, schema, allSchemas, options));
                            }
                        }
                    }

                    if (schema.required) {
                        jsonSchema.required = schema.required;
                    }

                    if (schema.properties) {
                        jsonSchema.type = "object";
                        jsonSchema.properties = {};
                        for (const [k, v] of Object.entries(schema.properties)) {
                            jsonSchema.properties[k] = nbtSchemaToJsonSchema(v, allSchemas, options);
                        }
                    }

                    if (schema.patternProperties) {
                        jsonSchema.patternProperties = {};
                        for (const [k, v] of Object.entries(schema.patternProperties)) {
                            jsonSchema.patternProperties[k] = nbtSchemaToJsonSchema(v, allSchemas, options);
                        }
                    }

                    if (schema.additionalProperties !== undefined) {
                        if (typeof schema.additionalProperties === "boolean") {
                            jsonSchema.additionalProperties = schema.additionalProperties;
                        } else {
                            jsonSchema.additionalProperties = nbtSchemaToJsonSchema(schema.additionalProperties, allSchemas, options);
                        }
                    }

                    // Only apply top-level items if this schema is a plain JSON array, not an NBT list
                    if (schema.items && schema.type !== NBT.TagType.List) {
                        if (Array.isArray(schema.items)) {
                            jsonSchema.items = schema.items.map((item: NBTSubSchemaRef): JSONSchemaRef => nbtSchemaToJsonSchema(item, allSchemas, options));
                        } else if (typeof schema.items === "object") {
                            jsonSchema.items = nbtSchemaToJsonSchema(schema.items, allSchemas, options);
                        }
                    }

                    // copy over JSON-Schema-like constraints (minItems, maxItems, etc.)
                    for (const k of [
                        "minItems",
                        "maxItems",
                        "minLength",
                        "maxLength",
                        "minimum",
                        "maximum",
                        "enum",
                        "const",
                    ] as const satisfies (keyof JSONSchema & (keyof NBTSubSchema | keyof NBTSchema | keyof NBTSchemaFragment))[] as (keyof JSONSchema &
                        keyof NBTSubSchema &
                        keyof NBTSchema &
                        keyof NBTSchemaFragment)[]) {
                        if (schema[k] !== undefined) {
                            jsonSchema[k] = schema[k];
                        }
                    }

                    return jsonSchema;
                }

                function tagTypeToSchema(
                    type: string,
                    schema: NBTSubSchema,
                    allSchemas: Record<string, NBTSchema | NBTSchemaFragment>,
                    options: ConvertOptions
                ): JSONSchema {
                    switch (type) {
                        case NBT.TagType.Byte:
                        case NBT.TagType.Short:
                        case NBT.TagType.Int:
                            return {
                                type: "object",
                                properties: {
                                    type: { const: type },
                                    value: { type: "integer" },
                                },
                                required: ["type", "value"],
                            };

                        case NBT.TagType.Long:
                            return {
                                type: "object",
                                properties: {
                                    type: { const: type },
                                    value: {
                                        type: "array",
                                        items: { type: "integer" },
                                        minItems: 2,
                                        maxItems: 2,
                                    },
                                },
                                required: ["type", "value"],
                            };

                        case NBT.TagType.Float:
                        case NBT.TagType.Double:
                            return {
                                type: "object",
                                properties: {
                                    type: { const: type },
                                    value: { type: "number" },
                                },
                                required: ["type", "value"],
                            };

                        case NBT.TagType.String:
                            return {
                                type: "object",
                                properties: {
                                    type: { const: type },
                                    value: { type: "string" },
                                },
                                required: ["type", "value"],
                            };

                        case NBT.TagType.List:
                            return {
                                type: "object",
                                properties: {
                                    type: { const: "list" },
                                    value: {
                                        type: "object",
                                        properties: {
                                            type: { type: "string" },
                                            value: {
                                                type: "array",
                                                items: schema.items ? nbtSchemaToJsonSchema(schema.items as NBTSubSchema, allSchemas, options) : {},
                                            },
                                        },
                                        required: ["type", "value"],
                                    },
                                },
                                required: ["type", "value"],
                            };

                        case NBT.TagType.Compound:
                            return {
                                type: "object",
                                properties: {
                                    type: { const: "compound" },
                                    value: {
                                        type: "object",
                                        properties: schema.properties
                                            ? Object.fromEntries(
                                                  Object.entries(schema.properties).map(([k, v]): [string, JSONSchemaRef] => [
                                                      k,
                                                      nbtSchemaToJsonSchema(v, allSchemas, options),
                                                  ])
                                              )
                                            : {},
                                        required: schema.required,
                                        additionalProperties: schema.additionalProperties ?? true,
                                    },
                                },
                                required: ["type", "value"],
                            };

                        case NBT.TagType.ByteArray:
                        case NBT.TagType.ShortArray:
                        case NBT.TagType.IntArray:
                            return {
                                type: "object",
                                properties: {
                                    type: { const: type },
                                    value: {
                                        type: "array",
                                        items: { type: "integer" },
                                    },
                                },
                                required: ["type", "value"],
                            };

                        case NBT.TagType.LongArray:
                            return {
                                type: "object",
                                properties: {
                                    type: { const: type },
                                    value: {
                                        type: "array",
                                        items: {
                                            type: "array",
                                            items: { type: "integer" },
                                            minItems: 2,
                                            maxItems: 2,
                                        },
                                    },
                                },
                                required: ["type", "value"],
                            };

                        default:
                            throw new Error(`Unsupported NBT type: ${type}`);
                    }
                }

                /**
                 * Convert the whole nbtSchemas object.
                 */
                export function convertAllSchemas(
                    schemas: Record<string, NBTSchema | NBTSchemaFragment>,
                    options: ConvertOptions = { inlineRefs: true }
                ): Record<string, JSONSchema> {
                    const result: Record<string, any> = {};
                    for (const [name, schema] of Object.entries(schemas)) {
                        result[name] = nbtSchemaToJsonSchema(schema, schemas, options);
                    }
                    return result;
                }
            }
            /**
             * Utilities for converting NBT schemas to TypeScript types.
             */
            export namespace ToTypeScriptType {
                export type GeneratedNBTSchemaTypeScriptType = NBT.Compound;
                export type GeneratedNBTSchemaTypeScriptTypeFragment = GeneratedNBTSchemaTypeScriptType["value"];
                /**
                 * Options for converting NBT schemas to TypeScript interfaces.
                 *
                 * @see {@link nbtSchemaToTypeScriptType}
                 */
                export interface NBTSchemaToTypeScriptInterfaceConversionOptions {
                    /**
                     * Allows extra properties in compounds.
                     *
                     * @todo This is currently bugged.
                     *
                     * @default false
                     */
                    allowExtraProps?: boolean;
                    /**
                     * Allows extra array items in lists.
                     *
                     * @todo This is currently bugged.
                     *
                     * @default false
                     */
                    allowExtraArrayItems?: boolean;
                    /**
                     * Emit named type aliases for union branches.
                     *
                     * @todo This is currently bugged.
                     *
                     * @default true
                     */
                    emitHelperTypes?: boolean;
                    /**
                     * Lookup for NBT schemas for the `$ref` property of NBT schemas.
                     *
                     * @default nbtSchemas
                     *
                     * @example To make refs in the schemas stay as a ref, referencing the other types:
                     * ```typescript
                     * writeFileSync(
                     *     path.join(import.meta.dirname, "./nbtSchemaTypeScriptTypes.d.ts"),
                     *     Object.entries(NBTSchemas.nbtSchemas)
                     *         .map(([name, schema]) =>
                     *             NBTSchemas.Utils.Conversion.ToTypeScriptType.nbtSchemaToTypeScriptType(schema, "DataTypes_" + name, {
                     *                 refLookup: Object.keys(NBTSchemas.nbtSchemas).reduce((acc, key) => ({ ...acc, [key]: `DataTypes_${key}` }), {}), // This makes it map references to their interface types instead of inlining them.
                     *             })
                     *         )
                     *         .join("\n\n")
                     * );
                     * ```
                     */
                    refLookup?: Record<string, NBTSchema | NBTSchemaFragment | string>;

                    /**
                     * Lookup for NBT schema TypeScript types from the `$ref` property of NBT schemas.
                     *
                     * @param schemaID The ID of the NBT schema.
                     * @returns The symbol name of the TypeScript interface.
                     *
                     * @default
                     * (schemaID: string) => schemaID
                     */
                    schemaIDToSymbolNameResolver?(schemaID: string): string;
                    /**
                     * The values to put in the `@see` TSDoc comment of the TypeScript interface.
                     */
                    originalSymbolReference?: string | string[] | undefined;
                    // /**
                    //  * Whether to include the root `type` and `value` properties in the TypeScript interface, instead of the interface just being the value of the `value` property.
                    //  *
                    //  * If set to `"auto"`, it will include it if the schema is not a schema fragment.
                    //  *
                    //  * When resolved to `true`, the outputted interface will match {@link GeneratedNBTSchemaTypeScriptType}.
                    //  *
                    //  * When resolved to `false`, the outputted interface will match {@link GeneratedNBTSchemaTypeScriptTypeFragment}.
                    //  *
                    //  * @default true
                    //  *
                    //  * @deprecated
                    //  */
                    // includeRoot?: boolean | "auto";
                    /**
                     * Whether to inline references to other NBT schemas.
                     *
                     * @default false
                     */
                    inlineRefs?: boolean;
                    // /**
                    //  * Lookup for whether a generated NBT schema TypeScript interface is a fragment.
                    //  *
                    //  * Only applies if {@link inlineRefs} is `false`.
                    //  *
                    //  * This is used for determining how to resolve the ref type.
                    //  * If the ref is in the in the {@link NBTSubSchema.allOf} or the {@link NBTSubSchema.oneOf} arrays of a compound, then if it is a fragment, it will merge the type with {@link NBTSubSchema.properties}, otherwise it will merge the type with the whole {@link NBTSubSchema}.
                    //  * If the ref in inside of a list, then if it is a fragment, it will insert the type as-is, otherwise it will insert the type as `type["value"]`.
                    //  *
                    //  * It should return whether the interface being referenced is a fragment.
                    //  *
                    //  * A fragment interface matches the type of {@link GeneratedNBTSchemaTypeScriptInterfaceFragment}.
                    //  *
                    //  * A non-fragment interface matches the type of {@link GeneratedNBTSchemaTypeScriptInterface}.
                    //  *
                    //  * If not provided, it will guess based on {@link includeRoot}:
                    //  *
                    //  * - If {@link includeRoot} is `true`, it will return `false`.
                    //  * - If {@link includeRoot} is `false`, it will return `true`.
                    //  * - If {@link includeRoot} is `"auto"`, it will return `true` if the original NBT schema is a schema fragment, and `false` otherwise.
                    //  *
                    //  * @param schemaSymbolName The resolved symbol name of the TypeScript interface, it is the result of passing the {@link schemaID} into the {@link schemaIDToSymbolNameResolver} function, or the {@link schemaID} directly if no resolver is provided.
                    //  * @param schemaID The original ID of the NBT schema.
                    //  * @returns Whether the interface being referenced is a fragment.
                    //  *
                    //  * @default
                    //  * (schemaSymbolName: string, schemaID: string) => opts.includeRoot === "auto" ? NBTSchemas.nbtSchemas[schemaID]?.$fragment : opts.includeRoot
                    //  */
                    // schemaRefToRenderedInterfaceIsFragmentResolver?(schemaSymbolName: string, schemaID: string, schema?: NBTSubSchema): boolean;
                }

                /**
                 * Context for converting NBT schemas to TypeScript interfaces.
                 */
                interface NBTSchemaToTypeScriptInterfaceConversionContext {
                    /**
                     * Names of helper types that have been emitted.
                     *
                     * @default []
                     */
                    helperTypes: string[];
                    /**
                     * Counter for helper type names.
                     *
                     * @default 0
                     */
                    helperCounter: number;
                }

                /**
                 * Format a value for use in a TypeScript type.
                 *
                 * @param value The value to format.
                 * @returns The formatted value.
                 *
                 * @internal
                 */
                function formatValue(value: any): string {
                    if (Array.isArray(value)) {
                        return value.map(formatValue).join(" | ");
                    }
                    if (typeof value === "bigint") {
                        // return value.toString() + "n"; // preserve as bigint literal
                        return `[high: ${toLongParts(value).join(", low: ")}]`; // Convert the long back to the high and low parts.
                    }
                    if (typeof value === "object" && value !== null) {
                        if ("value" in value) return formatValue(value.value);
                        try {
                            return JSON.stringify(value);
                        } catch {
                            return String(value);
                        }
                    }
                    return typeof value === "string" ? JSON.stringify(value) : String(value);
                }

                /**
                 * Format a list of enum values for use in a TypeScript type.
                 *
                 * @param enumValues The enum values to format.
                 * @returns The formatted enum values.
                 *
                 * @internal
                 */
                function formatEnum(enumValues: any[]): string {
                    return enumValues
                        .map((v) => {
                            if (typeof v === "object" && v.value !== undefined) {
                                return formatValue(v.value);
                            }
                            return formatValue(v);
                        })
                        .join(" | ");
                }

                function makeHelperName(base: string, ctx: NBTSchemaToTypeScriptInterfaceConversionContext): string {
                    ctx.helperCounter++;
                    return `${base}Variant${ctx.helperCounter}`;
                }

                /**
                 * Maps primitive NBT types to their Prismarine-NBT value representation.
                 *
                 * @internal
                 */
                function primitiveValueType(t: string): string {
                    switch (t) {
                        case "byte":
                        case "short":
                        case "int":
                        case "float":
                        case "double":
                            return "number";
                        case "long":
                            return "[high: number, low: number]";
                        case "string":
                            return "string";
                        case "byteArray":
                        case "intArray":
                        case "shortArray":
                            return "number[]";
                        case "longArray":
                            return "[high: number, low: number][]";
                        case "end":
                            return "[]";
                        default:
                            return "any";
                    }
                }

                /**
                 * Renders a TSDoc comment block for a schema node.
                 *
                 * @internal
                 */
                function renderComment(schema: NBTSubSchema | undefined, symbolReference?: string[] | undefined, indent: string = ""): string {
                    if (!schema) return "";
                    const parts: string[] = [];

                    if (schema.title) parts.push(schema.title);
                    if (schema.description) parts.push(schema.description);
                    // if (schema.description) parts.push(schema.title ? "@description\n" + schema.description : schema.description); // Alternate version if you the description should use the `description` TSDoc tag if there is a title.

                    if (symbolReference && symbolReference.length > 0)
                        parts.push(symbolReference.map((ref: string, i: number): string => `@see {@link ${ref}}`).join("\n"));

                    // Handle default value
                    if (schema.default !== undefined) {
                        const defVal: string = formatValue(schema.default);
                        // Put on new line if contains non-alphanumeric characters
                        if (/[^a-zA-Z0-9_.=+-]/.test(defVal) && !/^"[a-zA-Z0-9_.=+-\s]+"$/.test(defVal)) {
                            parts.push(`@default\n${indent}${defVal}`);
                        } else {
                            parts.push(`@default ${defVal}`);
                        }
                    }

                    // Handle examples
                    if (schema.examples && Array.isArray(schema.examples)) {
                        for (const ex of schema.examples) {
                            const exVal = formatValue(ex);
                            if (/[^a-zA-Z0-9_]/.test(exVal)) {
                                parts.push(`@example\n${indent}${exVal}`);
                            } else {
                                parts.push(`@example ${exVal}`);
                            }
                        }
                    }

                    // Handle enum
                    if (schema.enum && Array.isArray(schema.enum)) {
                        parts.push(`@enum ${formatEnum(schema.enum)}`);

                        if (schema.enumDescriptions && Array.isArray(schema.enumDescriptions)) {
                            parts.push(
                                `@enumDescriptions\n${indent}${schema.enumDescriptions
                                    .map(
                                        (d: string, i: number): string =>
                                            `- ${schema.enum![i]?.value !== undefined ? `\`${schema.enum![i]?.value}\`` : `UNKNOWN_ENUM_MEMBER_${i}`}: ${d}`
                                    )
                                    .join("\n")}`
                            );
                        }
                    }

                    if (parts.length === 0) return "";
                    const lines = parts
                        .join("\n\n")
                        .split("\n")
                        .map((l) => `${indent} * ${l}`);
                    return `${indent}/**\n${lines.join("\n")}\n${indent} */\n`;
                }

                /**
                 * Normalize an NBTSubSchemaRef (schema | boolean) into a TypeScript type string.
                 * true -> any, false -> never, schema -> schemaToType(...)
                 *
                 * @internal
                 */
                function refToType<T extends NBTSubSchemaRef | boolean | NBTSubSchemaRef[] = NBTSubSchemaRef | boolean | NBTSubSchemaRef[]>(
                    ref: T,
                    indent: string,
                    opts: NBTSchemaToTypeScriptInterfaceConversionOptions,
                    ctx: NBTSchemaToTypeScriptInterfaceConversionContext
                ):
                    | (T extends true ? SpecificBuiltType<"any", "any"> : never)
                    | (T extends false ? SpecificBuiltType<"never", "never"> : never)
                    | (T extends NBTSubSchemaRef[] ? SpecificBuiltType<BuiltType, '"list"'> : never)
                    | (T extends NBTSubSchemaRef ? BuiltType : never);
                function refToType<T extends NBTSubSchemaRef | boolean | NBTSubSchemaRef[] = NBTSubSchemaRef | boolean | NBTSubSchemaRef[]>(
                    ref: T,
                    indent: string,
                    opts: NBTSchemaToTypeScriptInterfaceConversionOptions = {},
                    ctx: NBTSchemaToTypeScriptInterfaceConversionContext = { helperTypes: [], helperCounter: 0 }
                ):
                    | SpecificBuiltType<"any", "any">
                    | SpecificBuiltType<"never", "never">
                    | SpecificBuiltType<SpecificBuiltType<string | BuiltType | BuiltType[], string>, '"list"'> {
                    const refLookup = opts.refLookup ?? nbtSchemas;
                    const resolvedRef: T = (
                        typeof ref === "boolean"
                            ? ref
                            : Array.isArray(ref)
                            ? ref.map((r: NBTSubSchemaRef): NBTSubSchemaRef => {
                                  if (typeof r === "boolean" || !r.$ref || !(r.$ref in refLookup)) return r;
                                  const refName: string = resolveSchemaRefName(r.$ref, !(opts.inlineRefs ?? false), opts);
                                  return typeof refLookup[refName as keyof typeof refLookup] === "string"
                                      ? r
                                      : {
                                            type: (refLookup[r.$ref as keyof typeof refLookup] as NBTSubSchema).type,
                                            ...r /* Object.fromEntries(Object.entries(r).filter(([key]): boolean => key !== "$ref")) */,
                                        };
                              })
                            : ((r: NBTSubSchemaRef): NBTSubSchemaRef => {
                                  if (typeof r === "boolean" || !r.$ref || !(r.$ref in refLookup)) return r;
                                  const refName: string = resolveSchemaRefName(r.$ref, !(opts.inlineRefs ?? false), opts);
                                  return typeof refLookup[refName as keyof typeof refLookup] === "string"
                                      ? r
                                      : {
                                            type: (refLookup[r.$ref as keyof typeof refLookup] as NBTSubSchema).type,
                                            ...r /* Object.fromEntries(Object.entries(r).filter(([key]): boolean => key !== "$ref")) */,
                                        };
                              })(ref)
                    ) as T; /* ref.$ref !== undefined && ref.$ref in refLookup
                            ? typeof refLookup[ref.$ref as keyof typeof refLookup] === "string"
                                ? ref
                                : {
                                      ...(refLookup[ref.$ref as keyof typeof refLookup] as object),
                                      ...Object.fromEntries(Object.entries(ref).filter(([key]) => key !== "$ref")),
                                  }
                            : ref */
                    if (resolvedRef === true) {
                        return { type: "any", value: "any" };
                    }
                    if (resolvedRef === false) {
                        return { type: "never", value: "never" };
                    }
                    if (Array.isArray(resolvedRef)) {
                        if (resolvedRef.length === 0) return { type: "never", value: "never" };

                        // tuple-style list -> union of each item
                        const children: BuiltType[] = resolvedRef.map((r) => refToType(r, indent, opts, ctx));

                        const allSameType: boolean = children.every((c) => c.type === children[0]!.type);

                        if (allSameType) {
                            // collapse into single type wrapping array of values
                            return {
                                type: '"list"',
                                value: {
                                    type: children[0]!.type,
                                    value: children.map((c) => ({
                                        type: c.type,
                                        value: c.value,
                                    })),
                                },
                            };
                        } else {
                            // mixed types not supported in NBT, fallback to unknown
                            return {
                                type: '"list"',
                                value: {
                                    type: "unknown",
                                    value: children,
                                },
                            };
                        }
                    }

                    // single schema
                    return schemaToBuiltType(resolvedRef, indent, opts, ctx) as any;
                }

                function schemaToBuiltType(
                    schema: NBTSubSchema,
                    indent: string,
                    opts: NBTSchemaToTypeScriptInterfaceConversionOptions,
                    ctx: NBTSchemaToTypeScriptInterfaceConversionContext
                ): BuiltType {
                    const refLookup = opts.refLookup ?? nbtSchemas;
                    const st = schema.type as Exclude<NBTSubSchema["type"], any[]>;
                    const mainSchemaRefName: string | undefined = schema.$ref
                        ? resolveSchemaRefName(schema.$ref, !(opts.inlineRefs ?? false), opts)
                        : undefined;
                    const resolvedSchema =
                        opts.inlineRefs && schema.$ref && mainSchemaRefName && mainSchemaRefName in refLookup
                            ? {
                                  ...(refLookup[mainSchemaRefName as keyof typeof refLookup] as NBTSubSchema),
                                  ...schema,
                              }
                            : schema;
                    let allOfRefTypes: [string, ...string[]] | undefined =
                        opts.inlineRefs ?? false
                            ? undefined
                            : typeof schema === "object" && schema.$ref !== undefined && mainSchemaRefName !== undefined /*  && schema.$ref in refLookup */
                            ? [mainSchemaRefName]
                            : undefined;
                    if (!(opts.inlineRefs ?? false) && schema.allOf !== undefined) {
                        const refAllOfs: (NBTSubSchema & { $ref: string })[] = schema.allOf.filter(
                            (ref: NBTSubSchemaRef): ref is NBTSubSchema & { $ref: string } => typeof ref === "object" && !!ref.$ref
                        );
                        if (refAllOfs.length > 0) {
                            allOfRefTypes ??= [] as unknown as [string];
                            for (const refAllOf of refAllOfs) {
                                allOfRefTypes.push(resolveSchemaRefName(refAllOf.$ref, !(opts.inlineRefs ?? false), opts));
                            }
                        }
                    }
                    let oneOfRefTypes: [string, ...string[]] | undefined = undefined;
                    if (!(opts.inlineRefs ?? false) && schema.oneOf !== undefined) {
                        const refOneOfs: (NBTSubSchema & { $ref: string })[] = schema.oneOf.filter(
                            (ref: NBTSubSchemaRef): ref is NBTSubSchema & { $ref: string } => typeof ref === "object" && !!ref.$ref
                        );
                        if (refOneOfs.length > 0) {
                            oneOfRefTypes ??= [] as unknown as [string];
                            for (const refOneOf of refOneOfs) {
                                oneOfRefTypes.push(resolveSchemaRefName(refOneOf.$ref, !(opts.inlineRefs ?? false), opts));
                            }
                        }
                    }
                    const inlineRefTypes = {
                        allOf: [] as string[],
                        oneOf: [] as string[],
                    };
                    if (opts.inlineRefs ?? false) {
                        if (allOfRefTypes)
                            for (const refType of allOfRefTypes) {
                                const types = (refLookup[refType as keyof typeof refLookup] as NBTSubSchema).type ?? resolvedSchema.type;
                                if (!types) continue;
                                inlineRefTypes.allOf.push(
                                    Array.isArray(types)
                                        ? types
                                              .map((t: string): string =>
                                                  buildTypeForTag(t, refLookup[refType as keyof typeof refLookup] as NBTSubSchema, indent, opts, ctx)
                                              )
                                              .join("|")
                                        : buildTypeForTag(types, refLookup[refType as keyof typeof refLookup] as NBTSubSchema, indent, opts, ctx)
                                );
                            }
                        if (oneOfRefTypes)
                            for (const refType of oneOfRefTypes) {
                                const types = (refLookup[refType as keyof typeof refLookup] as NBTSubSchema).type ?? resolvedSchema.type;
                                if (!types) continue;
                                inlineRefTypes.oneOf.push(
                                    Array.isArray(types)
                                        ? types
                                              .map((t: string): string =>
                                                  buildTypeForTag(t, refLookup[refType as keyof typeof refLookup] as NBTSubSchema, indent, opts, ctx)
                                              )
                                              .join("|")
                                        : buildTypeForTag(types, refLookup[refType as keyof typeof refLookup] as NBTSubSchema, indent, opts, ctx)
                                );
                            }
                    }

                    if (!st) {
                        if (resolvedSchema.properties) {
                            const compoundType: SpecificBuiltType<string> = buildBuiltTypeForTag("compound", resolvedSchema, indent, opts, ctx!);
                            return {
                                type: "compound",
                                value:
                                    opts.inlineRefs ?? false
                                        ? `(${compoundType.value})${inlineRefTypes.allOf ? ` & ${inlineRefTypes.allOf.join(" & ")}` : ""}${
                                              inlineRefTypes.oneOf ? ` & (${inlineRefTypes.oneOf.join(" | ")})` : ""
                                          }`
                                        : `(${compoundType.value})${allOfRefTypes ? ` & ${allOfRefTypes.join(" & ")}` : ""}${
                                              oneOfRefTypes ? ` & (${oneOfRefTypes.join(" | ")})` : ""
                                          }`,
                            };
                        }
                        // BUG: This is not resolving $ref properties.
                        return { type: "unknown", value: "any" };
                    }

                    const builtType: SpecificBuiltType<string> = buildBuiltTypeForTag(st, resolvedSchema, indent, opts, ctx!);
                    return {
                        type: builtType.type,
                        value:
                            opts.inlineRefs ?? false
                                ? `(${builtType.value})${inlineRefTypes.allOf ? ` & ${inlineRefTypes.allOf.join(" & ")}` : ""}${
                                      inlineRefTypes.oneOf ? ` & (${inlineRefTypes.oneOf.join(" | ")})` : ""
                                  }`
                                : `(${builtType.value})${allOfRefTypes ? ` & ${allOfRefTypes.join(" & ")}` : ""}${
                                      oneOfRefTypes ? ` & (${oneOfRefTypes.join(" | ")})` : ""
                                  }`,
                    };
                }

                /**
                 * Generic version of the utility type to hold both the type string and value string.
                 *
                 * @see {@link SpecificBuiltType}
                 *
                 * @internal
                 */
                interface BuiltType extends SpecificBuiltType<string | BuiltType | BuiltType[], string> {}

                /**
                 * Utility type to hold both the type string and value string.
                 *
                 * @internal
                 */
                interface SpecificBuiltType<
                    T extends string | SpecificBuiltType<any> | SpecificBuiltType<any>[] = string | BuiltType | BuiltType[],
                    K extends string = string
                > {
                    type: K;
                    value: T;
                }

                function buildBuiltTypeForTag(
                    tagType: string,
                    schema: NBTSubSchema,
                    indent: string,
                    opts: NBTSchemaToTypeScriptInterfaceConversionOptions,
                    ctx: NBTSchemaToTypeScriptInterfaceConversionContext
                ): SpecificBuiltType<string, `"${string}"`> {
                    const t: string = tagType;

                    // primitive/simple
                    const primitiveNames = new Set([
                        "byte",
                        "short",
                        "int",
                        "long",
                        "float",
                        "double",
                        "string",
                        "byteArray",
                        "shortArray",
                        "intArray",
                        "longArray",
                        "end",
                    ]);

                    if (primitiveNames.has(t)) {
                        const enumVals = schema.enum;
                        if (enumVals && enumVals.length > 0) {
                            const literals = formatEnum(enumVals);
                            return { type: `"${t}"`, value: literals };
                        }
                        return { type: `"${t}"`, value: primitiveValueType(t) };
                    }

                    // LIST
                    if (t === "list") {
                        const items: NBTSubSchemaRef | NBTSubSchemaRef[] | undefined = schema.items;

                        // zero-length list
                        if (Array.isArray(items) && items.length === 0) {
                            if (opts.allowExtraArrayItems) {
                                return { type: '"list"', value: `{ type: "end", value: [] } | { type: any, value: any[] }` };
                            }
                            return { type: '"list"', value: `{ type: "end", value: [] }` };
                        }

                        // unknown list -> union of all Prismarine-NBT types
                        if (!items) {
                            const primitiveListTypes = [
                                "byte",
                                "short",
                                "int",
                                "long",
                                "float",
                                "double",
                                "string",
                                "byteArray",
                                "shortArray",
                                "intArray",
                                "longArray",
                            ] as const;
                            const primitiveUnion = primitiveListTypes.map((pt) => {
                                const valType =
                                    pt === "long"
                                        ? "[high: number, low: number]"
                                        : pt === "longArray"
                                        ? "[high: number, low: number][]"
                                        : pt.endsWith("Array")
                                        ? "number[]"
                                        : "number";
                                return { type: `"${pt}"`, value: `${valType}[]` };
                            });
                            const compound = { type: '"compound"', value: "Record<string, any>" };
                            const list = { type: '"list"', value: "any[]" };
                            return {
                                type: '"list"',
                                value: `(${[...primitiveUnion, compound, list].map((v) => `{ type: ${v.type}, value: ${v.value} }`).join(" | ")})[]`,
                            };
                        }

                        if (items === true) {
                            return { type: '"list"', value: `{ type: any, value: any[] }` };
                        }

                        // homogeneous list

                        if (Array.isArray(items)) {
                            const child = refToType(items, indent + "  ", opts, ctx);
                            function builtTypeValueToTupleList(value: BuiltType["value"]): string {
                                return typeof value === "string"
                                    ? value
                                    : Array.isArray(value)
                                    ? value.map(builtTypeValueToTupleList).join(", ")
                                    : builtTypeValueToTupleList(value.value);
                            }

                            if (opts.allowExtraArrayItems) {
                                return {
                                    type: child.type,
                                    value: `{ type: ${child.value.type}, value: [${builtTypeValueToTupleList(child.value.value)}, ...any[]] }`,
                                };
                            }
                            return {
                                type: child.type,
                                value: `{ type: ${child.value.type}, value: [${builtTypeValueToTupleList(child.value.value)}] }`,
                            };
                        } else {
                            // TO-DO: Test this, as it may not work correctly.
                            const child = refToType(items, indent + "  ", opts, ctx);
                            function builtTypeValueToUnionList(value: BuiltType["value"]): string {
                                return typeof value === "string"
                                    ? value
                                    : Array.isArray(value)
                                    ? "(" + value.map(builtTypeValueToUnionList).join(" | ") + ")"
                                    : builtTypeValueToUnionList(value.value);
                            }

                            return { type: '"list"', value: `{ type: ${child.type}, value: ${builtTypeValueToUnionList(child.value)}[] }` };
                        }
                    }

                    // compound
                    if (t === "compound") {
                        const props = schema.properties ?? {};
                        const parentReq = new Set<string>((schema.required as any) ?? []);

                        const lines: string[] = Object.entries(props).map(([key, val]: [key: string, value: unknown]): string => {
                            const childSchema = val as NBTSubSchema;
                            const comment = renderComment(childSchema, undefined, indent);
                            const required = parentReq.has(key) || (childSchema as any).required === true;
                            const sep = required ? ":" : "?:";

                            return comment + `${indent}${JSON.stringify(key)}${sep} ${schemaToType(childSchema, indent + "  ", opts, ctx)};`;
                        });

                        const propLinesCount: number = lines.length;

                        if (schema.patternProperties) {
                            let found: [keyType: string, valueType: string][] = [];
                            for (const [key, value] of Object.entries(schema.patternProperties)) {
                                let keyType: string = "string";
                                switch (true) {
                                    case key === "[0-9]+":
                                    case key === "\\d+":
                                    case key === "[+-]?[0-9]+":
                                    case key === "[+-]?\\d+":
                                    case key === "\\+[0-9]+":
                                    case key === "\\+\\d+":
                                    case key === "-[0-9]+":
                                    case key === "-\\d+":
                                        keyType = "`${bigint}`";
                                        break;
                                    case key === "[0-9]+(\\.[0-9]+)?":
                                    case key === "\\d+(\\.\\d+)?":
                                    case key === "[+-]?[0-9]+(\\.[0-9]+)?":
                                    case key === "[+-]?\\d+(\\.\\d+)?":
                                    case key === "\\+[0-9]+(\\.[0-9]+)?":
                                    case key === "\\+\\d+(\\.\\d+)?":
                                    case key === "-[0-9]+(\\.[0-9]+)?":
                                    case key === "-\\d+(\\.\\d+)?":
                                        keyType = "number";
                                        break;
                                    case key.includes("[0-9]+"):
                                        keyType = `\`${key.replaceAll("[0-9]+", "${bigint}")}\``;
                                        break;
                                    case key.includes("\\d+"):
                                        keyType = `\`${key.replaceAll("\\d+", "${number}")}\``;
                                        break;
                                }
                                found.push([keyType, schemaToType(value, indent + "  ", opts, ctx)]);
                            }
                            for (const key of new Set(found.map(([key]) => key))) {
                                if (found.filter(([key2]) => key2 === key).length === 1) {
                                    lines.push(
                                        `${propLinesCount > 0 ? `${indent}} & {\n` : ""}${indent}[key: ${key}]: ${found.find(([key2]) => key2 === key)![1]};`
                                    );
                                } else {
                                    lines.push(
                                        `${propLinesCount > 0 ? `${indent}} & {\n` : ""}${indent}[key: ${key}]: (${found
                                            .filter(([key2]) => key2 === key)
                                            .map(([, value]) => value)
                                            .join(") | (")});`
                                    );
                                }
                            }
                        }
                        if (schema.additionalProperties !== undefined) {
                            if (schema.additionalProperties !== false) {
                                if (schema.additionalProperties === true) {
                                    lines.push(`${propLinesCount > 0 ? `${indent}} & {\n` : ""}${indent}[key: string]: { type: any, value: any };`);
                                } else {
                                    lines.push(
                                        `${propLinesCount > 0 ? `${indent}} & {\n` : ""}${indent}[key: string]: ${schemaToType(
                                            schema.additionalProperties,
                                            indent + "  ",
                                            opts,
                                            ctx
                                        )};`
                                    );
                                }
                            }
                        } else if (opts.allowExtraProps) {
                            lines.push(`${propLinesCount > 0 ? `${indent}} & {\n` : ""}${indent}[key: string]: { type: string; value: any };`);
                        }

                        return { type: '"compound"', value: `{\n${lines.join("\n")}\n${indent}}` };
                    }

                    // fallback
                    return { type: `"${tagType}"`, value: "any" };
                }

                /**
                 * Build the TypeScript type string for a single tag type given the schema object.
                 * Does NOT handle `schema.type` arrays, that's handled by {@link schemaToType}.
                 *
                 * @internal
                 */
                function buildTypeForTag(
                    tagType: string,
                    schema: NBTSubSchema,
                    indent: string,
                    opts: NBTSchemaToTypeScriptInterfaceConversionOptions,
                    ctx: NBTSchemaToTypeScriptInterfaceConversionContext
                ): string {
                    const builtType: BuiltType = buildBuiltTypeForTag(tagType, schema, indent, opts, ctx);
                    return `{ type: ${builtType.type}, value: ${builtType.value} }`;
                }

                function resolveSchemaRefName(
                    ref: string,
                    resolveSymbolName: boolean = true,
                    opts: NBTSchemaToTypeScriptInterfaceConversionOptions = {}
                ): string {
                    const refLookup = opts.refLookup ?? nbtSchemas;
                    if (
                        ref in refLookup &&
                        typeof refLookup[ref as keyof typeof refLookup] === "string" &&
                        !(refLookup[ref as keyof typeof refLookup] === ref) &&
                        !(refLookup[refLookup[ref as keyof typeof refLookup] as keyof typeof refLookup] === ref)
                    ) {
                        return resolveSchemaRefName(refLookup[ref as keyof typeof refLookup] as string, resolveSymbolName, opts);
                    }
                    return resolveSymbolName ? opts.schemaIDToSymbolNameResolver?.(ref) ?? ref : ref;
                }
                // function resolveSchemaRefIsRenderedAsFragment(
                //     ref: string,
                //     originalID: string,
                //     schema?: NBTSubSchema | undefined,
                //     opts: NBTSchemaToTypeScriptInterfaceConversionOptions = {}
                // ): boolean | undefined {
                //     const refLookup = opts.refLookup ?? nbtSchemas;
                //     if (opts.schemaRefToRenderedInterfaceIsFragmentResolver) {
                //         return opts.schemaRefToRenderedInterfaceIsFragmentResolver(ref, originalID, schema);
                //     }
                //     if (typeof opts.includeRoot === "boolean") return opts.includeRoot;
                //     if (ref in refLookup) {
                //         if (typeof refLookup[ref as keyof typeof refLookup] === "string")
                //             return resolveSchemaRefIsRenderedAsFragment(refLookup[ref as keyof typeof refLookup] as string, originalID, opts);
                //         return (refLookup[ref as keyof typeof refLookup] as NBTSchema | NBTSchemaFragment).$fragment ?? true;
                //     }
                //     return undefined;
                // }
                // function resolveSchemaRefType(ref: string, schema: NBTSubSchema, type: "listitem" | "list" | "compound", opts: NBTSchemaToTypeScriptInterfaceConversionOptions = {}): string {
                //     const refLookup = opts.refLookup ?? nbtSchemas;
                //     const refName = resolveSchemaRefName(ref, opts);
                //     const isFragment = resolveSchemaRefIsRenderedAsFragment(refName, ref, schema, opts);
                //     if (isFragment !== undefined) {
                //         if (isFragment) {
                //                 switch (type) {
                //                     case "compound":
                //                         return `{ properties: ${refName} }`;
                //                     case "list":
                //                         return `{}`
                //                 }
                //         }
                //     }
                // }

                /**
                 * Recursively convert a schema into a TypeScript type string matching Prismarine-NBT JSON.
                 *
                 * @param schema The schema object to convert.
                 * @param indent The indentation string to use for nested types. Defaults to 4 spaces.
                 * @param opts Options for the conversion.
                 * @param ctx Context for the conversion.
                 * @returns The TypeScript type string.
                 *
                 * @internal
                 */
                function schemaToType(
                    schema: NBTSubSchema,
                    indent: string = "s".repeat(4),
                    opts: NBTSchemaToTypeScriptInterfaceConversionOptions = {},
                    ctx: NBTSchemaToTypeScriptInterfaceConversionContext = { helperTypes: [], helperCounter: 0 }
                ): string {
                    const refLookup = opts.refLookup ?? nbtSchemas;
                    if (schema.$ref !== undefined && schema.$ref in refLookup && typeof refLookup[schema.$ref as keyof typeof refLookup] === "string") {
                        return ((Object.keys(schema).length > 1
                            ? `(${schemaToType(Object.fromEntries(Object.entries(schema).filter(([key]): boolean => key !== "$ref")), indent, opts, ctx)}) & `
                            : "") + refLookup[schema.$ref as keyof typeof refLookup]) as string;
                    }
                    const resolvedSchema: NBTSubSchema =
                        schema.$ref !== undefined && schema.$ref in refLookup
                            ? /* opts.inlineRefs ?? false
                                ? {
                                      ...(refLookup[schema.$ref as keyof typeof refLookup] as NBTSubSchema),
                                      //   ...(allOfRefTypes && allOfRefTypes.length > 0
                                      //       ? allOfRefTypes.reduce(
                                      //             (a, b): NBTSubSchema => ({
                                      //                 ...a,
                                      //                 ...(typeof refLookup[b as keyof typeof refLookup] === "object"
                                      //                     ? (refLookup[b as keyof typeof refLookup] as Extract<
                                      //                           (typeof refLookup)[keyof typeof refLookup],
                                      //                           object
                                      //                       >)
                                      //                     : {}),
                                      //             }),
                                      //             {}
                                      //         )
                                      //       : {}),
                                      ...Object.fromEntries(Object.entries(schema).filter(([key]): boolean => key !== "$ref")),
                                  }
                                : */ {
                                  type: (refLookup[schema.$ref as keyof typeof refLookup] as NBTSubSchema).type,
                                  ...Object.fromEntries(Object.entries(schema).filter(([key]): boolean => key !== "$ref")),
                              }
                            : schema;
                    // const inlineRefTypes = {
                    //     allOf: [] as string[],
                    //     oneOf: [] as string[],
                    // };
                    // if (opts.inlineRefs ?? false) {
                    //     if (allOfRefTypes)
                    //         for (const refType of allOfRefTypes) {
                    //             const types = (refLookup[refType as keyof typeof refLookup] as NBTSubSchema).type ?? schema.type;
                    //             if (!types) continue;
                    //             inlineRefTypes.allOf.push(
                    //                 Array.isArray(types)
                    //                     ? types
                    //                           .map((t: string): string =>
                    //                               buildTypeForTag(t, refLookup[refType as keyof typeof refLookup] as NBTSubSchema, indent, opts, ctx)
                    //                           )
                    //                           .join("|")
                    //                     : buildTypeForTag(types, refLookup[refType as keyof typeof refLookup] as NBTSubSchema, indent, opts, ctx)
                    //             );
                    //         }
                    //     if (oneOfRefTypes)
                    //         for (const refType of oneOfRefTypes) {
                    //             const types = (refLookup[refType as keyof typeof refLookup] as NBTSubSchema).type ?? schema.type;
                    //             if (!types) continue;
                    //             inlineRefTypes.oneOf.push(
                    //                 Array.isArray(types)
                    //                     ? types
                    //                           .map((t: string): string =>
                    //                               buildTypeForTag(t, refLookup[refType as keyof typeof refLookup] as NBTSubSchema, indent, opts, ctx)
                    //                           )
                    //                           .join("|")
                    //                     : buildTypeForTag(types, refLookup[refType as keyof typeof refLookup] as NBTSubSchema, indent, opts, ctx)
                    //             );
                    //         }
                    // }
                    if (Array.isArray(resolvedSchema.type)) {
                        const types: string[] = resolvedSchema.type.map((t: string): string => {
                            const built: string = buildTypeForTag(t, resolvedSchema, indent, opts, ctx);
                            if (opts.emitHelperTypes) {
                                const helperName: string = makeHelperName("NBT", ctx);
                                ctx.helperTypes.push(`export type ${helperName} = ${built};`);
                                return helperName;
                            }
                            return built;
                        });
                        return `(${types.join(" | ")})`;
                        // if (opts.inlineRefs ?? false) {
                        //     return `(${types.join(" | ")})${inlineRefTypes.allOf ? ` & ${inlineRefTypes.allOf.join(" & ")}` : ""}${
                        //         inlineRefTypes.oneOf ? ` & (${inlineRefTypes.oneOf.join(" | ")})` : ""
                        //     }`;
                        // } else {
                        //     return `(${types.join(" | ")})${allOfRefTypes ? ` & ${allOfRefTypes.join(" & ")}` : ""}${
                        //         oneOfRefTypes ? ` & (${oneOfRefTypes.join(" | ")})` : ""
                        //     }`;
                        // }
                    }

                    const st = resolvedSchema.type;
                    if (!st) {
                        if (resolvedSchema.properties) {
                            return buildTypeForTag("compound", resolvedSchema, indent, opts, ctx);
                        }
                        return "any";
                    }

                    return buildTypeForTag(st, resolvedSchema, indent, opts, ctx);
                }

                /**
                 * Generates a TypeScript type from a top-level {@link NBTSchema} or {@link NBTSchemaFragment}.
                 *
                 * @param schema The schema object to convert.
                 * @param name The name of the type.
                 * @param opts Options for the conversion.
                 * @returns The TypeScript type string.
                 *
                 * @todo Add support for `oneOf`, `anyOf`, `allOf`, `not`, `patternProperties`, and `$ref`.
                 * @todo `minProperties`, `maxProperties`, `minItems`, `maxItems`, `minLength`, `maxLength`, `minimum`, `maximum`, `pattern`, `deprecationMessage`, `exclusiveMinimum`, `exclusiveMaximum`, `multipleOf`, and `uniqueItems` should add a TSDoc comment.
                 * @todo Add support for using the `title` property on items of lists for their labels in their tuple types.
                 */
                export function nbtSchemaToTypeScriptType(
                    schema: NBTSchema | NBTSchemaFragment,
                    name: string,
                    opts: NBTSchemaToTypeScriptInterfaceConversionOptions = {}
                ): string {
                    if (!schema.$fragment && schema.type !== "compound") {
                        throw new Error("Top-level schema must be a compound");
                    }

                    const ctx: NBTSchemaToTypeScriptInterfaceConversionContext = { helperTypes: [], helperCounter: 0 };

                    const header: string = renderComment(
                        schema as NBTSubSchema,
                        opts.originalSymbolReference !== undefined
                            ? Array.isArray(opts.originalSymbolReference)
                                ? opts.originalSymbolReference
                                : [opts.originalSymbolReference]
                            : undefined
                    );

                    const indent: string = "    ";

                    const typeString: string = schemaToType(schema, indent, opts, ctx);

                    const helpers: string = ctx.helperTypes.length > 0 ? ctx.helperTypes.join("\n") + "\n\n" : "";
                    return `${helpers}${header}export type ${name} = ${typeString}`;
                }
                // // v1
                // export function nbtSchemaToTypeScriptInterface(
                //     schema: NBTSchema | NBTSchemaFragment,
                //     name: string,
                //     opts: NBTSchemaToTypeScriptInterfaceConversionOptions = {}
                // ): string {
                //     if (!schema.$fragment && schema.type !== "compound") {
                //         throw new Error("Top-level schema must be a compound");
                //     }

                //     const includeRoot: boolean = opts.includeRoot === undefined || opts.includeRoot === "auto" ? !schema.$fragment : opts.includeRoot;

                //     const ctx: NBTSchemaToTypeScriptInterfaceConversionContext = { helperTypes: [], helperCounter: 0 };

                //     const props: NBTSchemaMap = schema.properties ?? {};
                //     const header: string = renderComment(
                //         schema as NBTSubSchema,
                //         opts.originalSymbolReference !== undefined
                //             ? Array.isArray(opts.originalSymbolReference)
                //                 ? opts.originalSymbolReference
                //                 : [opts.originalSymbolReference]
                //             : undefined
                //     );

                //     const baseIndent: string = "    ";
                //     const indent: string = baseIndent.repeat(1 + +includeRoot);

                //     const lines: string[] = Object.entries(props).map(([key, val]: [key: string, value: NBTSubSchema]): string => {
                //         const childSchema: NBTSubSchema = val;
                //         const comment: string = renderComment(childSchema, undefined, indent);
                //         const parentReq = new Set<string>(schema.required ?? []);
                //         const required: boolean = parentReq.has(key) || (childSchema.required as any) === true;
                //         const sep = required ? ":" : "?:";
                //         return comment + `  ${JSON.stringify(key)}${sep} ${schemaToType(childSchema, "    ", opts, ctx)};`;
                //     });
                //     const propLinesCount: number = lines.length;
                //     if (schema.patternProperties) {
                //         let found: [keyType: string, valueType: string][] = [];
                //         for (const [key, value] of Object.entries(schema.patternProperties)) {
                //             let keyType: string = "string";
                //             switch (true) {
                //                 case key === "[0-9]+":
                //                 case key === "\\d+":
                //                 case key === "[+-]?[0-9]+":
                //                 case key === "[+-]?\\d+":
                //                 case key === "\\+[0-9]+":
                //                 case key === "\\+\\d+":
                //                 case key === "-[0-9]+":
                //                 case key === "-\\d+":
                //                     keyType = "`${bigint}`";
                //                     break;
                //                 case key === "[0-9]+(\\.[0-9]+)?":
                //                 case key === "\\d+(\\.\\d+)?":
                //                 case key === "[+-]?[0-9]+(\\.[0-9]+)?":
                //                 case key === "[+-]?\\d+(\\.\\d+)?":
                //                 case key === "\\+[0-9]+(\\.[0-9]+)?":
                //                 case key === "\\+\\d+(\\.\\d+)?":
                //                 case key === "-[0-9]+(\\.[0-9]+)?":
                //                 case key === "-\\d+(\\.\\d+)?":
                //                     keyType = "number";
                //                     break;
                //                 case key.includes("[0-9]+"):
                //                     keyType = `\`${key.replaceAll("[0-9]+", "${bigint}")}\``;
                //                     break;
                //                 case key.includes("\\d+"):
                //                     keyType = `\`${key.replaceAll("\\d+", "${number}")}\``;
                //                     break;
                //             }
                //             found.push([keyType, schemaToType(value, indent, opts, ctx)]);
                //         }
                //         for (const key of new Set(found.map(([key]) => key))) {
                //             if (found.filter(([key2]) => key2 === key).length === 1) {
                //                 lines.push(`${indent}[key: ${key}]: ${found.find(([key2]) => key2 === key)![1]};`);
                //             } else {
                //                 lines.push(
                //                     `${indent}[key: ${key}]: (${found
                //                         .filter(([key2]) => key2 === key)
                //                         .map(([, value]) => value)
                //                         .join(") | (")});`
                //                 );
                //             }
                //         }
                //     }
                //     const extendsLines: string[] = [];
                //     const oneOfLines: string[] = [];
                //     if (schema.$ref) extendsLines.push(opts.schemaIDToSymbolNameResolver?.(schema.$ref) ?? schema.$ref);
                //     if (schema.allOf)
                //         extendsLines.push(
                //             ...schema.allOf
                //                 .filter((v: NBTSubSchemaRef): v is NBTSubSchema & { $ref: string } => typeof v === "object" && v.$ref !== undefined)
                //                 .map((v: NBTSubSchema & { $ref: string }): string => opts.schemaIDToSymbolNameResolver?.(v.$ref) ?? v.$ref)
                //         );
                //     if (schema.oneOf)
                //         extendsLines.push(
                //             ...schema.oneOf
                //                 .filter((v: NBTSubSchemaRef): v is NBTSubSchema & { $ref: string } => typeof v === "object" && v.$ref !== undefined)
                //                 .map((v: NBTSubSchema & { $ref: string }): string => opts.schemaIDToSymbolNameResolver?.(v.$ref) ?? v.$ref)
                //         );
                //     if (schema.additionalProperties !== undefined) {
                //         if (schema.additionalProperties !== false) {
                //             if (schema.additionalProperties === true) {
                //                 extendsLines.push(`Omit<{ [key: string]: { type: any, value: any } }, never>`);
                //             } else {
                //                 extendsLines.push(`Omit<{ [key: string]: ${schemaToType(schema.additionalProperties, indent + "  ", opts, ctx)} }, never>`);
                //             }
                //         }
                //     } else if (opts.allowExtraProps) {
                //         extendsLines.push(`Omit<{ [key: string]: { type: string; value: any } }, never>`);
                //     }

                //     // if (opts.allowExtraProps) {
                //     //     lines.push(`  [key: string]: { type: string; value: any };`);
                //     // }

                //     const helpers: string = ctx.helperTypes.length > 0 ? ctx.helperTypes.join("\n") + "\n\n" : "";
                //     if (includeRoot) {
                //         return `${helpers}${header}export type ${name} = {\n${indent}type: "${schema.type}";\n${indent}value: {\n${lines.join("\n")}\n${indent}};\n}${
                //             extendsLines.length > 0 ? ` & ${extendsLines.join(" & ")}` : ""
                //         }`;
                //     } else {
                //         return `${helpers}${header}export interface ${name}${
                //             extendsLines.length > 0 ? ` extends ${extendsLines.join(",")}` : ""
                //         } {\n${lines.join("\n")}\n}`;
                //     }
                // }
            }
            /**
             * Utilities for converting raw Minecraft Wiki data into NBT schemas.
             */
            export namespace FromMinecraftWikiData {
                /**
                 * Represents a parsed node in the Minecraft Wiki data.
                 *
                 * @internal
                 */
                type ParsedNode = {
                    /**
                     * The type of the node.
                     */
                    type: LooseAutocomplete<`${NBT.TagType | "end" | "schemaRef"}`>;
                    /**
                     * The name of the node.
                     */
                    name?: string;
                    /**
                     * The description of the node.
                     */
                    description?: string;
                    /**
                     * The children of the node.
                     */
                    children: ParsedNode[];
                    /**
                     * The reference to another NBT schema.
                     */
                    $ref?: string;
                };

                /**
                 * Convert a wiki-style description to Markdown.
                 *
                 * @internal
                 */
                function wikiToMarkdown(desc: string): string {
                    if (!desc) return "";

                    return (
                        desc
                            .trim()
                            // Replace {{info needed}} that has nothing around it with "UNDOCUMENTED."
                            .replace(/^\{\{info needed\}\}$/gi, "UNDOCUMENTED.")
                            // Replace {{info needed}} with " *info needed*"
                            .replace(/\{\{info needed\}\}/gi, " *info needed*")
                            // Replace {{needs testing}} that is not touching a word with "*needs testing*"
                            .replace(/(?<!\w)\{\{needs testing\}\}(?!\w)/gi, "*needs testing*")
                            // Replace {{needs testing}} with "*needs testing*"
                            .replace(/\{\{needs testing\}\}/gi, " *needs testing*")
                            // Replace {{code|...}} with `...`
                            .replace(/\{\{code\|([^}]*)\}\}/gi, "`$1`")
                            // Replace [[target|label]] with [label](https://minecraft.wiki/w/target)
                            .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "[$2](https://minecraft.wiki/w/$1)")
                            // Replace [[target]] with [target](https://minecraft.wiki/w/target)
                            .replace(/\[\[([^\]]+)\]\]/g, "[$1](https://minecraft.wiki/w/$1)")
                            // Handle bold/italic.
                            .replace(/'''([^']+)'''/g, "**$1**")
                            .replace(/''([^']+)''/g, "_$1_")
                            // Replace inline HTML-like <code>...</code> with `...`
                            .replace(/<code>(.*?)<\/code>/gi, "`$1`")
                            .replace(/\{\{(?:[^\|\}]*\|)*([^\|\}]+)\}\}/g, "$1")
                            // Remove remaining curly braces for safety
                            .replace(/\{\{|\}\}/g, "")
                            .trim()
                    );
                }

                /**
                 * Parse the wiki-style NBT lines into a tree of ParsedNode.
                 *
                 * @internal
                 */
                function parseWikiLines(input: string, options: WikiNBTToNBTSchemaOptions): ParsedNode[] {
                    const lines: string[] = input.split("\n").filter((l: string): boolean => l.trim().startsWith("*"));
                    const root: ParsedNode = { type: "compound", name: "root", children: [] };
                    const stack: { level: number; node: ParsedNode }[] = [{ level: 0, node: root }];

                    const re = /^(\*+)\s*\{\{nbt\|([^}]*)\}\}:?\s*(.*)$/i;

                    const schemaRefRegex: RegExp = /\{\{bedrock nbt\|(?<name>[^}|]*)(?:\|(?<category>[^}|]*)?)?\}\}/gi;

                    for (const raw of lines) {
                        const line: string = raw.trim();
                        const match: RegExpMatchArray | null = line.match(re);
                        if (!match) {
                            for (const match of line.matchAll(schemaRefRegex)) {
                                const name: string = match.groups!.name!;
                                const category: WikiNBTSchemaCategory = (match.groups!.category ?? "others") as WikiNBTSchemaCategory;
                                const node: ParsedNode = {
                                    type: "schemaRef",
                                    children: [],
                                    $ref: (options.refNameResolver ?? defaultRefNameResolver)(name, category),
                                };
                                stack[stack.length - 1]!.node.children.push(node);
                                stack.push({ level: stack[stack.length - 1]!.level + 1, node });
                            }

                            continue;
                        }

                        const level: number = match[1]!.length;
                        const parts: string[] = match[2]!.split("|").map((s: string): string => s.trim());
                        const type: string = parts[0] || "";
                        const name: string = parts[1] ?? ""; // optional, default empty
                        const description: string | undefined = match[3] ? wikiToMarkdown(match[3]!.trim()) : undefined;

                        const node: ParsedNode = { type, name, description, children: [] };

                        while (stack.length > 1 && stack[stack.length - 1]!.level >= level) {
                            stack.pop();
                        }

                        stack[stack.length - 1]!.node.children.push(node);
                        stack.push({ level, node });
                    }

                    return root.children;
                }

                /**
                 * Convert parsed nodes into your NBTSchema (NBTSubSchema) structure.
                 * - unnamed compound nodes merge their children into the parent
                 * - lists use .items as either single schema or tuple array
                 *
                 * @internal
                 */
                function nodeToNBTSchema(node: ParsedNode, options: WikiNBTToNBTSchemaOptions): NBTSubSchema {
                    const alternativeTagNameMapping: Record<string, `${NBT.TagType | "end"}`> = {
                        "byte-array": "byteArray",
                        "short-array": "shortArray",
                        "int-array": "intArray",
                        "long-array": "longArray",
                    };

                    const tagTypeList: `${NBT.TagType | "end" | "schemaRef"}`[] = [
                        "byte",
                        "short",
                        "int",
                        "long",
                        "float",
                        "double",
                        "string",
                        "byteArray",
                        "shortArray",
                        "intArray",
                        "longArray",
                        "list",
                        "compound",
                        "end",
                        "schemaRef",
                    ];

                    const primitiveTags: Set<`${NBT.TagType | "end" | "schemaRef"}`> = new Set([
                        "byte",
                        "short",
                        "int",
                        "long",
                        "float",
                        "double",
                        "string",
                        "byteArray",
                        "shortArray",
                        "intArray",
                        "longArray",
                        "end",
                    ] as const);

                    const t: string = tagTypeList.includes(node.type as any)
                        ? node.type
                        : tagTypeList.find((t: `${NBT.TagType | "end" | "schemaRef"}`): boolean => t.toLowerCase() === node.type.toLowerCase()) ??
                          alternativeTagNameMapping[node.type.toLowerCase()] ??
                          node.type;

                    if (primitiveTags.has(t as `${NBT.TagType | "end"}`)) {
                        const base: NBTSubSchema = { type: t as `${NBT.TagType}` };
                        if (node.description) base.description = node.description;
                        return Utils.Misc.fixNBTSchemaPropertyOrder(base);
                    }

                    if (t === "list") {
                        const out: NBTSubSchema = { type: "list" };
                        if (node.description) out.description = node.description;

                        if (node.children.length === 0) {
                            // unknown element type
                        } else if (node.children.length === 1) {
                            out.items =
                                node.children[0]!.type === "schemaRef"
                                    ? { ...(node.children[0]!.description ? { description: node.children[0]!.description } : {}), $ref: node.children[0]!.$ref }
                                    : nodeToNBTSchema(node.children[0]!, options);
                        } else {
                            out.items = node.children.map(
                                (c: ParsedNode): NBTSubSchema =>
                                    c.type === "schemaRef"
                                        ? { ...(c.description ? { description: c.description } : {}), $ref: c.$ref }
                                        : nodeToNBTSchema(c, options)
                            );
                        }

                        return Utils.Misc.fixNBTSchemaPropertyOrder(out);
                    }

                    if (t === "compound") {
                        const out: NBTSubSchema = { type: "compound", description: node.description, properties: {} };
                        if (!node.description) delete out.description; // Remove description if empty instead of adding if present to make it positioned before properties when JSON.stringified.

                        for (const child of node.children) {
                            const type = tagTypeList.includes(child.type as any)
                                ? child.type
                                : tagTypeList.find((t: `${NBT.TagType | "end" | "schemaRef"}`): boolean => t.toLowerCase() === child.type.toLowerCase()) ??
                                  alternativeTagNameMapping[child.type.toLowerCase()] ??
                                  child.type;
                            if (child.$ref) {
                                out.allOf ??= [];
                                out.allOf.push({ $ref: child.$ref });
                                if (type === "schemaRef") continue;
                            }
                            if (!child.name) {
                                if (type === "compound") {
                                    const childSchema: NBTSubSchema = nodeToNBTSchema(child, options);
                                    if (childSchema && childSchema.properties) {
                                        for (const [k, v] of Object.entries(childSchema.properties)) {
                                            if (!out.properties![k]) {
                                                out.properties![k] = v;
                                                if (v.description && !v.description.includes("(May not exist)")) {
                                                    out.required ??= [];
                                                    out.required.push(k);
                                                }
                                            }
                                        }
                                    }
                                }
                            } else {
                                out.properties![child.name] = nodeToNBTSchema(child, options);
                                if (child.description && !child.description.includes("(May not exist)")) {
                                    out.required ??= [];
                                    out.required.push(child.name);
                                }
                            }
                        }

                        if (!out.properties || Object.keys(out.properties).length === 0) {
                            delete out.properties;
                            if (out.allOf && out.allOf.length === 1 && typeof out.allOf[0] === "object" && out.allOf[0]?.$ref) {
                                out.$ref = out.allOf[0]!.$ref;
                                delete out.allOf;
                            }
                        }

                        return Utils.Misc.fixNBTSchemaPropertyOrder(out);
                    }

                    const fallback: NBTSubSchema = { type: node.type as `${NBT.TagType}` };
                    if (node.description) fallback.description = node.description;
                    return Utils.Misc.fixNBTSchemaPropertyOrder(fallback);
                }

                /**
                 * Default reference name resolver for {@link wikiNBTToNBTSchema}.
                 *
                 * @see {@link WikiNBTToNBTSchemaOptions.refNameResolver}
                 *
                 * @param schemaName The name of the schema (ex. "Item Stack", "Abilities", or "timer").
                 * @param schemaCategory The category of the schema. (ex. "component" or "item")
                 * @returns The ID to use for the schema `$ref`.
                 */
                export function defaultRefNameResolver(schemaName: string, schemaCategory: WikiNBTSchemaCategory): string {
                    let resolvedSchemaName: string;
                    switch (true) {
                        case schemaName === "Structuretemplate_<''name''>":
                            resolvedSchemaName = "StructureTemplate";
                            break;
                        case schemaName === "Entity" && (schemaCategory === "entity" || schemaCategory === "others"):
                            return "ActorPrefix";
                        case schemaName === "Block Entity" && schemaCategory === "block":
                            return "BlockEntity";
                        default:
                            resolvedSchemaName = wikiToMarkdown(
                                schemaName
                                    .replaceAll(/[,]/g, "_")
                                    .replaceAll("_[0-9a-f\\-]+", "")
                                    .replaceAll(/(?<!^)\(([^\)]*?)\)(?!$)/g, "_$1_")
                                    .replaceAll(/(?<!^)\(([^\)]*?)\)$/g, "_$1")
                                    .replaceAll(/^\(([^\)]*?)\)(?!$)/g, "$1_")
                                    .replaceAll(/^\(([^\)]*?)\)$/g, "$1")
                            )
                                .split(" ")
                                .map((s: string): string => (s.length > 0 ? s[0]!.toUpperCase() + s.slice(1) : s))
                                .join("");
                    }
                    switch (schemaCategory) {
                        case "block":
                            return `Block_${resolvedSchemaName}`;
                        case "component":
                            return `Component_${resolvedSchemaName}`;
                        case "entity":
                            return `Entity_${resolvedSchemaName}`;
                        case "item":
                            return `Item_${resolvedSchemaName}`;
                        case "others":
                            return `${resolvedSchemaName}`;
                    }
                }

                /**
                 * The category of a Minecraft Wiki NBT schema.
                 *
                 * - `block`: [Bedrock Edition level format/Block entity format](https://minecraft.wiki/w/Bedrock%20Edition%20level%20format/Block%20entity%20format)
                 * - `component`: [Bedrock Edition level format/Entity format/Components](https://minecraft.wiki/w/Bedrock%20Edition%20level%20format/Entity%20format/Components)
                 * - `entity`: [Bedrock Edition level format/Entity format](https://minecraft.wiki/w/Bedrock%20Edition%20level%20format/Entity%20format)
                 * - `item`: [Bedrock Edition level format/Item format](https://minecraft.wiki/w/Bedrock%20Edition%20level%20format/Item%20format)
                 * - `others`: [Bedrock Edition level format/Other data format](https://minecraft.wiki/w/Bedrock%20Edition%20level%20format/Other%20data%20format)
                 */
                export type WikiNBTSchemaCategory = "block" | "component" | "entity" | "item" | "others";

                /**
                 * Options for {@link wikiNBTToNBTSchema}.
                 */
                export interface WikiNBTToNBTSchemaOptions {
                    /**
                     * A resolver for reference names (used when you see `Tags common to *` on the wiki).
                     *
                     * @see {@link defaultRefNameResolver}
                     *
                     * @param schemaName The name of the schema (ex. "Item Stack", "Abilities", or "timer").
                     * @param schemaCategory The category of the schema. (ex. "component" or "item")
                     * @returns The ID to use for the schema `$ref`.
                     *
                     * @default defaultRefNameResolver
                     */
                    refNameResolver?(schemaName: string, schemaCategory: WikiNBTSchemaCategory): string;
                }

                /**
                 * Converts raw Minecraft Wiki data into an NBT schema.
                 *
                 * To find the data to input into this, go on the Minecraft Wiki and look for NBT/Level Format documentation,
                 * then find the data structure you want to convert and click "Edit Source", then copy the text in between
                 * `<div class="treeview">` and `</div>`, all the lines should begin with an asterisk.
                 *
                 * @example Convert map format to an NBT schema.
                 * ```typescript
                 * const data = `*{{nbt|compound}}: The root tag.
                 * **{{nbt|long|mapId}}: The Unique ID of the map.
                 * **{{nbt|long|parentMapId}}: The Unique ID's of the parent maps.
                 * **{{nbt|byte|dimension}}: 0 = The [[Overworld]], 1 = [[The Nether]], 2 = [[The End]], any other value = a static image with no player pin.
                 * **{{nbt|byte|fullyExplored}}: 1 if the map is full explored.
                 * **{{nbt|byte|mapLocked}}: 1 if the map has been locked in a [[cartography table]].
                 * **{{nbt|byte|scale}}: How zoomed in the map is, and must be a number between 0 and 4 (inclusive) that represent the level. Default 0. If this is changed in an [[anvil]] or a [[cartography table]], the Unique ID of the map changes.
                 * **{{nbt|byte|unlimitedTracking}}: Unknown. Default 0.
                 * **{{nbt|short|height}}: The height of the map. Is associated with the scale level.
                 * **{{nbt|short|width}} The width of the map. Is associated with the scale level.
                 * **{{nbt|int|xCenter}}: Center of the map according to real world by X.
                 * **{{nbt|int|zCenter}}: Center of the map according to real world by Z.
                 * **{{nbt|list|decorations}}: A list of optional icons to display on the map.
                 * ***{{nbt|compound}}: An individual decoration.
                 * ****{{nbt|compound|data}}
                 * *****{{nbt|int|rot}}: The rotation of the symbol, ranging from 0 to 15. South = 0, West = 4, North = 8, East = 12.
                 * *****{{nbt|int|type}}: The ID of the [[Map icons.png|map icon]] to display.
                 * *****{{nbt|int|x}}: The horizontal column (x) where the decoration is located on the map (per pixel).
                 * *****{{nbt|int|y}}: The vertical column (y) where the decoration is located on the map (per pixel).
                 * ****{{nbt|compound|key}}
                 * *****{{nbt|int|blockX}}: The world x-position of the decoration.
                 * *****{{nbt|int|blockY}}: The world y-position of the decoration.
                 * *****{{nbt|int|blockZ}}: The world z-position of the decoration.
                 * *****{{nbt|int|type}}: Unknown.
                 * **{{nbt|byte-array|colors}}: An array of bytes that represent color values ('''65536 entries''' for a default 128×128 map).`;
                 *
                 * writeFileSync(path.join(import.meta.dirname, "./nbtSchema.json"), JSON.stringify(NBTSchemas.Utils.Conversion.FromMinecraftWikiData.wikiNBTToNBTSchema(data), null, 4));
                 * ```
                 */
                export function wikiNBTToNBTSchema<F extends boolean | "auto" = "auto">(
                    input: string,
                    fragment: F = "auto" as F,
                    options: WikiNBTToNBTSchemaOptions = {}
                ): F extends true ? NBTSchemaFragment : F extends false ? NBTSchema : NBTSchemaFragment | NBTSchema {
                    const parsed: ParsedNode[] = parseWikiLines(input, options);
                    // console.log(JSON.stringify(parsed, null, 4));
                    let isFragment: boolean = fragment !== "auto" ? fragment : false;
                    if (fragment === "auto" && parsed[0]?.description === "Parent tag.") {
                        isFragment = true;
                        delete parsed[0]?.description;
                    }

                    if (parsed.length === 1 && parsed[0] && (isFragment || parsed[0].type === "compound") && !parsed[0]!.name) {
                        // console.log(JSON.stringify(parsed, null, 4));
                        let root: F extends true ? NBTSchemaFragment : NBTSchema;
                        if (isFragment && parsed[0].children.length === 1 && parsed[0].children[0] && !parsed[0].children[0].name) {
                            root = nodeToNBTSchema(parsed[0].children[0], options) as F extends true ? NBTSchemaFragment : NBTSchema;
                        } else {
                            root = nodeToNBTSchema(parsed[0], options) as F extends true ? NBTSchemaFragment : NBTSchema;
                        }
                        // console.log(JSON.stringify(root, null, 4));
                        return Utils.Misc.fixNBTSchemaPropertyOrder({ ...root, $fragment: isFragment } as const satisfies F extends true
                            ? NBTSchemaFragment
                            : NBTSchema);
                    }

                    const root: NBTSchema | NBTSchemaFragment = { id: "", type: "compound", properties: {} };

                    for (const node of parsed) {
                        if (!node.name) {
                            if (node.type === "compound") {
                                const merged: NBTSubSchema = nodeToNBTSchema(node, options);
                                if (merged && merged.properties) {
                                    for (const [k, v] of Object.entries(merged.properties)) {
                                        if (!root.properties![k]) {
                                            root.properties![k] = v;
                                        }
                                    }
                                }
                            }
                        } else {
                            root.properties![node.name] = nodeToNBTSchema(node, options);
                        }
                    }

                    return Utils.Misc.fixNBTSchemaPropertyOrder({ ...root, $fragment: isFragment } as const satisfies NBTSchemaFragment | NBTSchema as any);
                }

                /**
                 * Options for {@link extractNBTSchemasFromFullWikiNBTPageData}.
                 */
                export interface ExtractNBTSchemasFromFullWikiNBTPageDataOptions extends WikiNBTToNBTSchemaOptions {
                    /**
                     * Whether to generate IDs for the NBT schemas.
                     *
                     * @default true
                     */
                    generateIDs?: boolean;
                    /**
                     * The category of the NBT schemas.
                     *
                     * @default "others"
                     */
                    category?: WikiNBTSchemaCategory;
                    /**
                     * Whether to replace the root tag description with the description text.
                     *
                     * @default false
                     */
                    replaceSchemaRootTagDescriptionsWithDescriptionText?: boolean;
                }

                /**
                 * Extracts NBT schemas from a full Minecraft Wiki page's source contents.
                 *
                 * @param input The full Minecraft Wiki page's source contents.
                 * @param options Options for the extraction.
                 * @returns An array of NBT schemas.
                 */
                export function extractNBTSchemasFromFullWikiNBTPageData(
                    input: string,
                    options: ExtractNBTSchemasFromFullWikiNBTPageDataOptions = {}
                ): (NBTSchema | NBTSchemaFragment)[] {
                    const containers: RegExpMatchArray | null = input.match(/(?<=(^|\n)<div class="treeview">\s*).+?\n(?=<\/div>($|\n))/gs);
                    if (!containers) return [];

                    const schemas: (NBTSchema | NBTSchemaFragment)[] = [];

                    for (const container of containers) {
                        // console.log(1.792, container);
                        if (
                            !/(?<=(^|\n)===? (?<header>[^\n]+?) ===?\s*?\n(?:(?<description>\w[^\n]*?)\n)?)(?<schema>\*[^\n]+?(?:\n\*[^\n]+?|\n\w[^\n]+?)+?)(?=\n+?(?:===? [^\n]+? ===?\n)*?===? [^\n]+? ===?\s*?\n(?:\w[^\n]*?\n)?|\s*?$)/.test(
                                container
                            )
                        )
                            continue;

                        // console.log(2.792);

                        const schemaSubContainers: RegExpStringIterator<RegExpExecArray> = container.matchAll(
                            /(?<=(^|\n)===? (?<header>[^\n]+?) ===?\s*?\n(?:(?<description>\w[^\n]*?)\n)?)(?<schema>\*[^\n]+?(?:\n\*[^\n]+?|\n\w[^\n]+?)+?)(?=\n+?(?:===? [^\n]+? ===?\n)*?===? [^\n]+? ===?\s*?\n(?:\w[^\n]*?\n)?|\s*?$)/g
                        );

                        for (const schemaSubContainer of schemaSubContainers) {
                            // console.log(3.792, schemaSubContainer);
                            const header: string = schemaSubContainer.groups!.header!;
                            const schema: NBTSchema | NBTSchemaFragment = wikiNBTToNBTSchema(schemaSubContainer.groups!.schema!, "auto", options);
                            let result: NBTSchema | NBTSchemaFragment = { ...schema };
                            if (options.generateIDs ?? true) {
                                result = {
                                    ...{ id: void 0, title: void 0, description: void 0, type: void 0, required: void 0, properties: void 0 }, // Moves these properties to this position in this order.
                                    ...result,
                                    id: (options.refNameResolver ?? defaultRefNameResolver)(header, options.category ?? "others"), // Set the ID here to override any value in the result variable .
                                };
                            }
                            if (
                                schemaSubContainer.groups!.description &&
                                (!result.description || (options.replaceSchemaRootTagDescriptionsWithDescriptionText ?? true))
                            )
                                result.description = wikiToMarkdown(schemaSubContainer.groups!.description!.replace(/:$/, "."));
                            for (const prop of ["id", "title", "description", "type", "required", "properties"] as const satisfies (
                                | keyof NBTSchema
                                | keyof NBTSchemaFragment
                            )[]) {
                                if (prop in result && result[prop] === undefined) delete result[prop];
                            }
                            schemas.push(result);
                        }
                    }

                    return schemas;
                }
            }
        }
        export namespace Misc {
            /**
             * Fixes the order of properties in an NBT schema, schema fragment, or sub-schema.
             *
             * This is mainly for consistency when stringifying (ex. using {@link JSON.stringify}).
             *
             * @param schema The NBT schema to fix.
             * @returns The fixed NBT schema.
             */
            export function fixNBTSchemaPropertyOrder<T extends NBTSubSchema | NBTSchema | NBTSchemaFragment>(schema: T): T {
                let result: T = {
                    ...{ id: void 0, title: void 0, description: void 0, type: void 0, required: void 0, properties: void 0 }, // Moves these properties to this position in this order.
                    ...schema,
                };
                for (const prop of ["id", "title", "description", "type", "required", "properties"] as const satisfies (
                    | keyof NBTSubSchema
                    | keyof NBTSchema
                    | keyof NBTSchemaFragment
                )[] as (keyof T)[]) {
                    if (prop in result && !(prop in schema)) delete result[prop];
                }
                return result;
            }
        }
    }

    /**
     * TypeScript types for the NBT schemas.
     */
    export namespace NBTSchemaTypes {
        /**
         * The ActorPrefix schema.
         *
         * All entities share this base.
         *
         * @see {@link NBTSchemas.nbtSchemas.ActorPrefix}
         */
        export type ActorPrefix = {
            type: "compound";
            value: {
                /**
                 * 1 or 0 (true/false) - true if this entity is chested. Used by donkey, llama, and mule.
                 */
                Chested: { type: "byte"; value: number };
                /**
                 * The main color value of the entity. Used by sheep, llama, shulker, tropical fish, etc. Defaults to 0.
                 */
                Color: { type: "byte"; value: number };
                /**
                 * The entity's second color value. Used by tropical fish. Defaults to 0.
                 */
                Color2: { type: "byte"; value: number };
                /**
                 * (May not exist) The custom name of this entity.
                 */
                CustomName?: { type: "string"; value: string };
                /**
                 * 1 or 0 (true/false) - (may not exist) if true, and this entity has a custom name, the name always appears above the entity, regardless of where the cursor points. If the entity does not have a custom name, a default name is shown.
                 */
                CustomNameVisible: { type: "byte"; value: number };
                /**
                 * (May not exist) The namespaced ID of this entity and its current and previous component groups.
                 */
                definitions?: { type: "list"; value: { type: "string"; value: string[] } };
                /**
                 * Distance the entity has fallen. Larger values cause more damage when the entity lands.
                 */
                FallDistance: { type: "float"; value: number };
                /**
                 * Number of ticks until the fire is put out. Default 0 when not on fire.
                 */
                Fire: { type: "short"; value: number };
                /**
                 * The namespaced ID of this entity.
                 */
                identifier: { type: "string"; value: string };
                /**
                 * Unknown.
                 */
                internalComponents: {
                    type: "compound";
                    value: {
                        /**
                         * Unknown.
                         */
                        EntityStorageKeyComponent: {
                            type: "compound";
                            value: {
                                /**
                                 * Unknown.
                                 */
                                StorageKey: { type: "string"; value: string };
                            };
                        };
                    };
                };
                /**
                 * 1 or 0 (true/false) - true if the entity should not take damage. This applies to living and nonliving entities alike: mobs should not take damage from any source (including potion effects), and cannot be moved by fishing rods, attacks, explosions, or projectiles, and objects such as vehicles cannot be destroyed. Invulnerable player entities are also ignored by any hostile mobs. Note that these entities can be damaged by players in Creative mode.*needs testing*
                 */
                Invulnerable: { type: "byte"; value: number };
                /**
                 * 1 or 0 (true/false) - true if this entity is angry. Used by wolf and bee.
                 */
                IsAngry: { type: "byte"; value: number };
                /**
                 * 1 or 0 (true/false) - true if this entity is an autonomous entity.
                 */
                IsAutonomous: { type: "byte"; value: number };
                /**
                 * 1 or 0 (true/false) - true if this entity is a baby.
                 */
                IsBaby: { type: "byte"; value: number };
                /**
                 * 1 or 0 (true/false) - true if this entity is eating.
                 */
                IsEating: { type: "byte"; value: number };
                /**
                 * 1 or 0 (true/false) - true if this entity is gliding.
                 */
                IsGliding: { type: "byte"; value: number };
                /**
                 * 1 or 0 (true/false) - true if this entity is a global entity (e.g. lightning bolt, ender dragon, arrow).
                 */
                IsGlobal: { type: "byte"; value: number };
                /**
                 * 1 or 0 (true/false) - true if the entity is an illager captain. Used by pillager and vindicator.
                 */
                IsIllagerCaptain: { type: "byte"; value: number };
                /**
                 * 1 or 0 (true/false) - true if this entity is not spawn from its parents. Used by all the mobs that can breed.
                 */
                IsOrphaned: { type: "byte"; value: number };
                /**
                 * 1 or 0 (true/false) - true if the entity is out of control. Used by boat.
                 */
                IsOutOfControl: { type: "byte"; value: number };
                /**
                 * 1 or 0 (true/false) - true if this entity is roaring. Used by ravager.
                 */
                IsRoaring: { type: "byte"; value: number };
                /**
                 * 1 or 0 (true/false) - true if this entity is scared.
                 */
                IsScared: { type: "byte"; value: number };
                /**
                 * 1 or 0 (true/false) - true if this entity is stunned. Used by ravager.
                 */
                IsStunned: { type: "byte"; value: number };
                /**
                 * 1 or 0 (true/false) - true if this entity is swimming.
                 */
                IsSwimming: { type: "byte"; value: number };
                /**
                 * 1 or 0 (true/false) - true if this entity is tamed.
                 */
                IsTamed: { type: "byte"; value: number };
                /**
                 * 1 or 0 (true/false) - true if this entity is trusting a player. Used by fox and ocelot.
                 */
                IsTrusting: { type: "byte"; value: number };
                /**
                 * (May not exist) Unknown.
                 */
                LastDimensionId?: { type: "int"; value: number };
                /**
                 * (May not exist) Unknown
                 */
                LinksTag?: {
                    type: "compound";
                    value: {
                        /**
                         * The Unique ID of an entity.
                         */
                        entityID: { type: "long"; value: [high: number, low: number] };
                        /**
                         * Unknown.
                         */
                        LinkID: { type: "int"; value: number };
                    };
                };
                /**
                 * 1 or 0 (true/false) - true if this entity can drop [loot](https://minecraft.wiki/w/Drops#Mob_drops) when died.
                 */
                LootDropped: { type: "byte"; value: number };
                /**
                 * The ID of the mark variant. Used by villager, horse, bee etc. Defaults to 0.
                 */
                MarkVariant: { type: "int"; value: number };
                /**
                 * (May not exist) Three TAG_Floats describing the current dX, dY and dZ velocity of the entity in meters per tick.
                 */
                Motion?: { type: "list"; value: { type: "float"; value: [number, number, number] } };
                /**
                 * 1 or 0 (true/false) - true if the entity is touching the ground.
                 */
                OnGround: { type: "byte"; value: number };
                /**
                 * Unknown. Defaults to -1.
                 */
                OwnerNew: { type: "long"; value: [high: number, low: number] };
                /**
                 * 1 or 0 (true/false) - true if an entity should be [persistent](https://minecraft.wiki/w/Mob spawning#Despawning) in the world.
                 */
                Persistent: { type: "byte"; value: number };
                /**
                 * The number of ticks before which the entity may be teleported back through a nether portal. Initially starts at 300 ticks (15 seconds) after teleportation and counts down to 0.
                 */
                PortalCooldown: { type: "int"; value: number };
                /**
                 * Three TAG_Floats describing the current X, Y and Z position of the entity.
                 */
                Pos: { type: "list"; value: { type: "float"; value: [number, number, number] } };
                /**
                 * Two TAG_Floats representing rotation in degrees.
                 */
                Rotation: { type: "list"; value: { type: "float"; value: [number, number] } };
                /**
                 * 1 or 0 (true/false) - true if this entity is saddled.
                 */
                Saddled: { type: "byte"; value: number };
                /**
                 * 1 or 0 (true/false) - true if this entity is sheared. Used by sheep and snow golem.
                 */
                Sheared: { type: "byte"; value: number };
                /**
                 * 1 or 0 (true/false) - true if the End Crystal shows the bedrock slate underneath.*needs testing*
                 */
                ShowBottom: { type: "byte"; value: number };
                /**
                 * 1 or 0 (true/false) - true if this entity is sitting.
                 */
                Sitting: { type: "byte"; value: number };
                /**
                 * The entity's Skin ID value. Used by villager and zombified villager. Defaults to 0.
                 */
                SkinID: { type: "int"; value: number };
                /**
                 * Determines the number of items the entity can carry (items = 3 × strength). Used by llama. Defaults to 0.
                 */
                Strength: { type: "int"; value: number };
                /**
                 * Determines the maximum number of items the entity can carry (items = 3 × strength). Defaults to 0.
                 */
                StrengthMax: { type: "int"; value: number };
                /**
                 * (May not exist) List of [scoreboard tags](https://minecraft.wiki/w/Scoreboard) of this entity.
                 */
                Tags?: { type: "list"; value: { type: "string"; value: string[] } };
                /**
                 * The Unique ID of this entity.
                 */
                UniqueID: { type: "long"; value: [high: number, low: number] };
                /**
                 * The ID of the variant. Used by cat, villager, horse, etc. Defaults to 0.
                 */
                Variant: { type: "int"; value: number };
            };
        };

        /**
         * The AutonomousEntities schema.
         *
         * The autonomous entities data.
         *
         * @see {@link NBTSchemas.nbtSchemas.AutonomousEntities}
         */
        export type AutonomousEntities = {
            type: "compound";
            value: {
                /**
                 * Unknown.
                 */
                AutonomousEntityList: {
                    type: "list";
                    value: (
                        | { type: "byte"; value: number[] }
                        | { type: "short"; value: number[] }
                        | { type: "int"; value: number[] }
                        | { type: "long"; value: [high: number, low: number][] }
                        | { type: "float"; value: number[] }
                        | { type: "double"; value: number[] }
                        | { type: "string"; value: number[] }
                        | { type: "byteArray"; value: number[][] }
                        | { type: "shortArray"; value: number[][] }
                        | { type: "intArray"; value: number[][] }
                        | { type: "longArray"; value: [high: number, low: number][][] }
                        | { type: "compound"; value: Record<string, any> }
                        | { type: "list"; value: any[] }
                    )[];
                };
            };
        };

        /**
         * The BiomeData schema.
         *
         * The [biome](https://minecraft.wiki/w/biome) data.
         *
         * @see {@link NBTSchemas.nbtSchemas.BiomeData}
         */
        export type BiomeData = {
            type: "compound";
            value: {
                /**
                 * A list of compound tags representing biomes.
                 */
                list: {
                    type: "list";
                    value: {
                        type: "compound";
                        value: {
                            /**
                             * The numerical [biome ID](https://minecraft.wiki/w/Biome).
                             */
                            id: { type: "byte"; value: number };
                            /**
                             * The biome's snow accumulation. Eg. `0.125`.
                             */
                            snowAccumulation: { type: "float"; value: number };
                        }[];
                    };
                };
            };
        };

        /**
         * The BlockEntity schema.
         *
         * All block entities share this base.
         *
         * @see {@link NBTSchemas.nbtSchemas.BlockEntity}
         */
        export type BlockEntity = {
            type: "compound";
            value: {
                /**
                 * (May not exist) The custom name of the block entity.
                 */
                CustomName?: { type: "string"; value: string };
                /**
                 * The savegame ID of the block entity.
                 */
                id: { type: "string"; value: string };
                /**
                 * 1 or 0 (true/false) - true if the block entity is movable with a piston.
                 */
                isMovable: { type: "byte"; value: number };
                /**
                 * X coordinate of the block entity.
                 */
                x: { type: "int"; value: number };
                /**
                 * Y coordinate of the block entity.
                 */
                y: { type: "int"; value: number };
                /**
                 * Z coordinate of the block entity.
                 */
                z: { type: "int"; value: number };
            };
        };

        /**
         * The Data3D schema.
         *
         * The NBT structure of the parsed data of the Data3D content type.
         *
         * Note: This NBT structure is specific to the parser and serializer implemented by this module.
         * This is because the actual data is stored in binary format.
         *
         * @see {@link NBTSchemas.nbtSchemas.Data3D}
         */
        export type Data3D = {
            type: "compound";
            value: {
                /**
                 * The height map data.
                 *
                 * In it is stored as a 2D matrix with [x][z] height values.
                 */
                heightMap: { type: "list"; value: { type: "list"; value: { type: "short"; value: number[] }[] } };
                /**
                 * The biome data.
                 */
                biomes: {
                    type: "list";
                    value: {
                        type: "compound";
                        value: {
                            /**
                             * The biome values.
                             *
                             * This is an array of indices in the biome palette, one for each block.
                             */
                            values: { type: "list"; value: { type: "int"; value: number[] } };
                            /**
                             * The biome palette.
                             *
                             * This is an array of the biome numeric IDs.
                             */
                            palette: { type: "list"; value: { type: "int"; value: number[] } };
                        }[];
                    };
                };
            };
        };

        /**
         * The LevelDat schema.
         *
         * World data.
         *
         * @see {@link NBTSchemas.nbtSchemas.LevelDat}
         */
        export type LevelDat = {
            type: "compound";
            value: {
                /**
                 * The default permissions for players in the world.
                 */
                abilities?: {
                    type: "compound";
                    value: {
                        /**
                         * 1 or 0 (true/false) - true if the player can attack mobs.
                         *
                         * @enum 0 | 1
                         *
                         * @enumDescriptions
                         *       - `0`: true
                         * - `1`: false
                         */
                        attackmobs?: { type: "byte"; value: 0 | 1 };
                        /**
                         * 1 or 0 (true/false) - true if the player can attack other players.
                         *
                         * @enum 0 | 1
                         *
                         * @enumDescriptions
                         *       - `0`: true
                         * - `1`: false
                         */
                        attackplayers?: { type: "byte"; value: 0 | 1 };
                        /**
                         * 1 or 0 (true/false) - true if the player can place blocks.
                         *
                         * @enum 0 | 1
                         *
                         * @enumDescriptions
                         *       - `0`: true
                         * - `1`: false
                         */
                        build?: { type: "byte"; value: 0 | 1 };
                        /**
                         * 1 or 0 (true/false) - true if the player is able to interact with redstone components.
                         *
                         * @enum 0 | 1
                         *
                         * @enumDescriptions
                         *       - `0`: true
                         * - `1`: false
                         */
                        doorsandswitches?: { type: "byte"; value: 0 | 1 };
                        /**
                         * 1 or 0 (true/false) - true if the player is currently flying.
                         *
                         * @enum 0 | 1
                         *
                         * @enumDescriptions
                         *       - `0`: true
                         * - `1`: false
                         */
                        flying?: { type: "byte"; value: 0 | 1 };
                        /**
                         * The flying speed, always 0.05.
                         *
                         * @default 0.05
                         */
                        flySpeed?: { type: "float"; value: number };
                        /**
                         * 1 or 0 (true/false) - true if the player can instantly destroy blocks.
                         *
                         * @enum 0 | 1
                         *
                         * @enumDescriptions
                         *       - `0`: true
                         * - `1`: false
                         */
                        instabuild?: { type: "byte"; value: 0 | 1 };
                        /**
                         * 1 or 0 (true/false) - true if the player is immune to all damage and harmful effects.
                         *
                         * @enum 0 | 1
                         *
                         * @enumDescriptions
                         *       - `0`: true
                         * - `1`: false
                         */
                        invulnerable?: { type: "byte"; value: 0 | 1 };
                        /**
                         * 1 or 0 (true/false) - true if the player was struck by lightning.
                         *
                         * @enum 0 | 1
                         *
                         * @enumDescriptions
                         *       - `0`: true
                         * - `1`: false
                         */
                        lightning?: { type: "byte"; value: 0 | 1 };
                        /**
                         * 1 or 0 (true/false) - true if the player can fly.
                         *
                         * @enum 0 | 1
                         *
                         * @enumDescriptions
                         *       - `0`: true
                         * - `1`: false
                         */
                        mayfly?: { type: "byte"; value: 0 | 1 };
                        /**
                         * 1 or 0 (true/false) - true if the player can destroy blocks.
                         *
                         * @enum 0 | 1
                         *
                         * @enumDescriptions
                         *       - `0`: true
                         * - `1`: false
                         */
                        mine?: { type: "byte"; value: 0 | 1 };
                        /**
                         * 1 or 0 (true/false) - true if the player messages cannot be seen by other players.
                         *
                         * @enum 0 | 1
                         *
                         * @enumDescriptions
                         *       - `0`: true
                         * - `1`: false
                         */
                        mute?: { type: "byte"; value: 0 | 1 };
                        /**
                         * 1 or 0 (true/false) - true if the player can phase through blocks.
                         *
                         * @enum 0 | 1
                         *
                         * @enumDescriptions
                         *       - `0`: true
                         * - `1`: false
                         */
                        noclip?: { type: "byte"; value: 0 | 1 };
                        /**
                         * 1 or 0 (true/false) - true if the player has operator commands.
                         *
                         * @enum 0 | 1
                         *
                         * @enumDescriptions
                         *       - `0`: true
                         * - `1`: false
                         */
                        op?: { type: "byte"; value: 0 | 1 };
                        /**
                         * 1 or 0 (true/false) - true if the player is able to open containers.
                         *
                         * @enum 0 | 1
                         *
                         * @enumDescriptions
                         *       - `0`: true
                         * - `1`: false
                         */
                        opencontainers?: { type: "byte"; value: 0 | 1 };
                        /**
                         * What permissions a player defaults to, when joining a world.
                         *
                         * @default 0
                         */
                        permissionsLevel?: { type: "int"; value: number };
                        /**
                         * What permissions a player has.
                         *
                         * @default 0
                         */
                        playerPermissionsLevel?: { type: "int"; value: number };
                        /**
                         * 1 or 0 (true/false) - true if the player is allowed to teleport.
                         *
                         * @enum 0 | 1
                         *
                         * @enumDescriptions
                         *       - `0`: true
                         * - `1`: false
                         */
                        teleport?: { type: "byte"; value: 0 | 1 };
                        /**
                         * The walking speed, always 0.1.
                         *
                         * @default 0.1
                         */
                        walkSpeed?: { type: "float"; value: number };
                        /**
                         * 1 or 0 (true/false) - true if the player is a world builder.
                         *
                         * @enum 0 | 1
                         *
                         * @enumDescriptions
                         *       - `0`: true
                         * - `1`: false
                         */
                        worldbuilder?: { type: "byte"; value: 0 | 1 };
                    };
                };
                /**
                 * The `allowdestructiveobjects` [game rule](game rule).
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                allowdestructiveobjects?: { type: "byte"; value: 0 | 1 };
                /**
                 * The `allowmobs` [game rule](game rule).
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                allowmobs?: { type: "byte"; value: 0 | 1 };
                /**
                 * The version of Minecraft that is the maximum version to load resources from. Eg. setting this to `1.16.0` removes any features that were added after version `1.16.0`.
                 *
                 * @default
                 *     "*"
                 */
                baseGameVersion?: { type: "string"; value: string };
                /**
                 * Makes the world into a [single biome](single biome) world and the biome set here is the biome of this single biome world.
                 */
                BiomeOverride?: { type: "string"; value: string };
                /**
                 * 1 or 0 (true/false) - true if the bonus chest is enabled.
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                bonusChestEnabled?: { type: "byte"; value: 0 | 1 };
                /**
                 * 1 or 0 (true/false) - true if the bonus chest has been placed in the world. Turning this to false spawns another bonus chest near the spawn coordinates.
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                bonusChestSpawned?: { type: "byte"; value: 0 | 1 };
                /**
                 * UNDOCUMENTED.
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                codebuilder?: { type: "byte"; value: 0 | 1 };
                /**
                 * The `commandblockoutput` [game rule](game rule).
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                commandblockoutput?: { type: "byte"; value: 0 | 1 };
                /**
                 * 1 or 0 (true/false) - true if the maps should be on a grid or centered to exactly where they are created. Default to 0.
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                CenterMapsToOrigin?: { type: "byte"; value: 0 | 1 };
                /**
                 * The `commandblocksenabled` [game rule](game rule).
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                commandblocksenabled?: { type: "byte"; value: 0 | 1 };
                /**
                 * 1 or 0 (true/false) - true if cheats are on.
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                commandsEnabled?: { type: "byte"; value: 0 | 1 };
                /**
                 * 1 or 0 (true/false) - tells if the world has Platform-Specific texture packs or content. Used to prevent cross play in specific worlds, that use assets allowed only on specific consoles.
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                ConfirmedPlatformLockedContent?: { type: "byte"; value: 0 | 1 };
                /**
                 * UNDOCUMENTED.
                 */
                currentTick?: { type: "long"; value: [high: number, low: number] };
                /**
                 * The current difficulty setting. 0 is Peaceful, 1 is Easy, 2 is Normal, and 3 is Hard.
                 *
                 * @enum 0 | 1 | 2 | 3
                 *
                 * @enumDescriptions
                 *     - `0`: Peaceful
                 * - `1`: Easy
                 * - `2`: Normal
                 * - `3`: Hard
                 */
                Difficulty?: { type: "int"; value: 0 | 1 | 2 | 3 };
                /**
                 * The dimension the player is in. 0 is the Overworld, 1 is the Nether, and 2 is the End.
                 *
                 * @enum 0 | 1 | 2
                 *
                 * @enumDescriptions
                 *     - `0`: Overworld
                 * - `1`: Nether
                 * - `2`: The End
                 */
                Dimension?: { type: "int"; value: 0 | 1 | 2 };
                /**
                 * The `dodaylightcycle` [game rule](game rule).
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                dodaylightcycle?: { type: "byte"; value: 0 | 1 };
                /**
                 * The `doentitiydrops` [game rule](game rule).
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                doentitiydrops?: { type: "byte"; value: 0 | 1 };
                /**
                 * The `dofiretick` [game rule](game rule).
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                dofiretick?: { type: "byte"; value: 0 | 1 };
                /**
                 * The `doimmediaterespawn` [game rule](game rule).
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                doimmediaterespawn?: { type: "byte"; value: 0 | 1 };
                /**
                 * The `doinsomnia` [game rule](game rule).
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                doinsomnia?: { type: "byte"; value: 0 | 1 };
                /**
                 * The `dolimitedcrafting` [game rule](game rule).
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                dolimitedcrafting?: { type: "byte"; value: 0 | 1 };
                /**
                 * The `domobloot` [game rule](game rule).
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                domobloot?: { type: "byte"; value: 0 | 1 };
                /**
                 * The `domobspawning` [game rule](game rule).
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                domobspawning?: { type: "byte"; value: 0 | 1 };
                /**
                 * The `dotiledrops` [game rule](game rule).
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                dotiledrops?: { type: "byte"; value: 0 | 1 };
                /**
                 * The `doweathercycle` [game rule](game rule).
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                doweathercycle?: { type: "byte"; value: 0 | 1 };
                /**
                 * The `drowningdamage` [game rule](game rule).
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                drowningdamage?: { type: "byte"; value: 0 | 1 };
                /**
                 * UNDOCUMENTED.
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                educationFeaturesEnabled?: { type: "byte"; value: 0 | 1 };
                /**
                 * A [UUID](UUID). *info needed*
                 */
                EducationOid?: { type: "string"; value: string };
                /**
                 * UNDOCUMENTED.
                 */
                EducationProductId?: { type: "string"; value: string };
                /**
                 * Marks a world as an Education Edition world (worlds with this set to 1 do not open on Bedrock!).
                 *
                 * @default 0
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                eduOffer?: { type: "int"; value: 0 | 1 };
                eduSharedResource?: {
                    type: "compound";
                    value: {
                        /**
                         * Unused in Bedrock Edition, but is used in Education Edition as part of the Resource Link feature on the Pause Screen. It defines the Resource Link Button Text.
                         */
                        buttonName?: { type: "string"; value: string };
                        /**
                         * Unused in Bedrock Edition, but is used in Education Edition as part of the Resource Link feature on the Pause Screen. It defines what link opens upon clicking the Resource Link Button.
                         */
                        linkUri?: { type: "string"; value: string };
                    };
                };
                /**
                 * The experimental toggles.
                 */
                experiments?: {
                    type: "compound";
                    value: {
                        /**
                         * 1 or 0 (true/false) - true if the world is locked on [experimental gameplay](experimental gameplay).
                         *
                         * @enum 0 | 1
                         *
                         * @enumDescriptions
                         *       - `0`: true
                         * - `1`: false
                         */
                        experiments_ever_used?: { type: "byte"; value: 0 | 1 };
                        /**
                         * 1 or 0 (true/false) - true if the world has been saved with experiments on before.
                         *
                         * @enum 0 | 1
                         *
                         * @enumDescriptions
                         *       - `0`: true
                         * - `1`: false
                         */
                        saved_with_toggled_experiments?: { type: "byte"; value: 0 | 1 };
                        /**
                         * 1 or 0 (true/false) - true if the beta APIs experimental toggle is enabled.
                         *
                         * @enum 0 | 1
                         *
                         * @enumDescriptions
                         *       - `0`: true
                         * - `1`: false
                         */
                        gametest?: { type: "byte"; value: 0 | 1 };
                        /**
                         * 1 or 0 (true/false) - true if the camera aim assist experimental toggle is enabled.
                         *
                         * @enum 0 | 1
                         *
                         * @enumDescriptions
                         *       - `0`: true
                         * - `1`: false
                         */
                        camera_aim_assist?: { type: "byte"; value: 0 | 1 };
                        /**
                         * 1 or 0 (true/false) - true if the data driven biomes experimental toggle is enabled.
                         *
                         * @enum 0 | 1
                         *
                         * @enumDescriptions
                         *       - `0`: true
                         * - `1`: false
                         */
                        data_driven_biomes?: { type: "byte"; value: 0 | 1 };
                        /**
                         * 1 or 0 (true/false) - true if the experimental creator cameras experimental toggle is enabled.
                         *
                         * @enum 0 | 1
                         *
                         * @enumDescriptions
                         *       - `0`: true
                         * - `1`: false
                         */
                        experimental_creator_cameras?: { type: "byte"; value: 0 | 1 };
                        /**
                         * 1 or 0 (true/false) - true if the jigsaw structures experimental toggle is enabled.
                         *
                         * @enum 0 | 1
                         *
                         * @enumDescriptions
                         *       - `0`: true
                         * - `1`: false
                         */
                        jigsaw_structures?: { type: "byte"; value: 0 | 1 };
                        /**
                         * 1 or 0 (true/false) - true if the locator bar experimental toggle is enabled.
                         *
                         * @enum 0 | 1
                         *
                         * @enumDescriptions
                         *       - `0`: true
                         * - `1`: false
                         */
                        locator_bar?: { type: "byte"; value: 0 | 1 };
                        /**
                         * 1 or 0 (true/false) - true if the upcoming creator features experimental toggle is enabled.
                         *
                         * @enum 0 | 1
                         *
                         * @enumDescriptions
                         *       - `0`: true
                         * - `1`: false
                         */
                        upcoming_creator_features?: { type: "byte"; value: 0 | 1 };
                        /**
                         * 1 or 0 (true/false) - true if the y_2025_drop_1 experimental toggle is enabled.
                         *
                         * @enum 0 | 1
                         *
                         * @enumDescriptions
                         *       - `0`: true
                         * - `1`: false
                         */
                        y_2025_drop_1?: { type: "byte"; value: 0 | 1 };
                        /**
                         * 1 or 0 (true/false) - true if the y_2025_drop_2 experimental toggle is enabled.
                         *
                         * @enum 0 | 1
                         *
                         * @enumDescriptions
                         *       - `0`: true
                         * - `1`: false
                         */
                        y_2025_drop_2?: { type: "byte"; value: 0 | 1 };
                        /**
                         * 1 or 0 (true/false) - true if the y_2025_drop_3 experimental toggle is enabled.
                         *
                         * @enum 0 | 1
                         *
                         * @enumDescriptions
                         *       - `0`: true
                         * - `1`: false
                         */
                        y_2025_drop_3?: { type: "byte"; value: 0 | 1 };
                    } & {
                        [key: string]: { type: "byte"; value: 0 | 1 };
                    };
                };
                /**
                 * The `falldamage` [game rule](game rule).
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                falldamage?: { type: "byte"; value: 0 | 1 };
                /**
                 * The `firedamage` [game rule](game rule).
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                firedamage?: { type: "byte"; value: 0 | 1 };
                /**
                 * JSON that controls generation of flat worlds. Default is `{"biome_id":1,"block_layers":[{"block_name":"minecraft:bedrock","count":1},{"block_name":"minecraft:dirt","count":2},{"block_name":"minecraft:grass_block","count":1}],"encoding_version":6,"structure_options":null,"world_version":"version.post_1_18"}`.
                 *
                 * @default
                 *     "{\"biome_id\":1,\"block_layers\":[{\"block_name\":\"minecraft:bedrock\",\"count\":1},{\"block_name\":\"minecraft:dirt\",\"count\":2},{\"block_name\":\"minecraft:grass_block\",\"count\":1}],\"encoding_version\":6,\"structure_options\":null,\"world_version\":\"version.post_1_18\"}"
                 */
                FlatWorldLayers?: { type: "string"; value: string };
                /**
                 * The `freezedamage` [game rule](game rule).
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                freezedamage?: { type: "byte"; value: 0 | 1 };
                /**
                 * The `functioncommandlimit` [game rule](game rule).
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                functioncommandlimit?: { type: "int"; value: 0 | 1 };
                /**
                 * The `globalmute` [game rule](game rule).
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                globalmute?: { type: "byte"; value: 0 | 1 };
                /**
                 * 1 or 0 (true/false) - true if force the player into the game mode defined in `GameType`.
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                ForceGameType?: { type: "byte"; value: 0 | 1 };
                /**
                 * The default game mode of the player. 0 is [Survival](Survival), 1 is [Creative](Creative), 2 is [Adventure](Adventure), 5 is [Default](Game_mode#Default), and 6 is [Spectator](Spectator).
                 */
                GameType?: { type: "int"; value: number };
                /**
                 * The world type. 0 is Old, 1 is Infinite, 2 is Flat, and 5 is Void.
                 */
                Generator?: { type: "int"; value: number };
                /**
                 * Whether the world has achievements locked. Set to 1 if the default game mode is set to Creative, if [cheats](Commands#Cheats) have been enabled, or if a [behavior pack](add-on) has been equipped.
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                hasBeenLoadedInCreative?: { type: "byte"; value: 0 | 1 };
                /**
                 * UNDOCUMENTED.
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                hasLockedBehaviorPack?: { type: "byte"; value: 0 | 1 };
                /**
                 * UNDOCUMENTED.
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                hasLockedResourcePack?: { type: "byte"; value: 0 | 1 };
                /**
                 * Is read-only.
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                immutableWorld?: { type: "byte"; value: 0 | 1 };
                /**
                 * UNDOCUMENTED.
                 */
                InventoryVersion?: { type: "string"; value: string };
                /**
                 * 1 or 0 (true/false) - true if it was created from the [bedrock editor](Bedrock Editor).
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                isCreatedInEditor?: { type: "byte"; value: 0 | 1 };
                /**
                 * 1 or 0 (true/false) - true if exported from the [bedrock editor](Bedrock Editor).
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                isExportedFromEditor?: { type: "byte"; value: 0 | 1 };
                /**
                 * 1 or 0 (true/false) - true if the world is created from a world template where the world options were intended not to be modified.
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                isFromLockedTemplate?: { type: "byte"; value: 0 | 1 };
                /**
                 * 1 or 0 (true/false) - true if the world is created from a world template.
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                isFromWorldTemplate?: { type: "byte"; value: 0 | 1 };
                /**
                 * 1 or 0 (true/false) - true if the world is in [Hardcore](Hardcore) mode.
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                IsHardcore?: { type: "byte"; value: 0 | 1 };
                /**
                 * 1 or 0 (true/false) - (unused) may cause world to not save, or delete after use. Seems to default back to false when a world is loaded.
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                IsSingleUseWorld?: { type: "byte"; value: 0 | 1 };
                /**
                 * 1 or 0 (true/false) - true if the world options cannot be modified until the user accepts that they are changing the map.
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                isWorldTemplateOptionLocked?: { type: "byte"; value: 0 | 1 };
                /**
                 * The `keepinventory` [game rule](game rule).
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                keepinventory?: { type: "byte"; value: 0 | 1 };
                /**
                 * Whether the world has been opened with the "Visible to LAN players" world setting enabled.
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                LANBroadcast?: { type: "byte"; value: 0 | 1 };
                /**
                 * Whether the "Visible to LAN players" world toggle is enabled.
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                LANBroadcastIntent?: { type: "byte"; value: 0 | 1 };
                /**
                 * Five ints representing the last version with which the world was opened. Eg. for the [beta/_Preview_ 1.20.30.22](Bedrock Edition Preview 1.20.30.22) the version is `1 20 30 22 1`.
                 */
                lastOpenedWithVersion?: { type: "list"; value: { type: "int"; value: [number, number, number, number, 0 | 1] } };
                /**
                 * Stores a timestamp of when the world was last played as the number of seconds since the epoch (1/1/1970).
                 */
                LastPlayed?: { type: "long"; value: [high: number, low: number] };
                /**
                 * Specifies the name of the world.
                 *
                 * @default "My World"
                 */
                LevelName?: { type: "string"; value: string };
                /**
                 * UNDOCUMENTED.
                 */
                lightningLevel?: { type: "float"; value: number };
                /**
                 * UNDOCUMENTED.
                 */
                lightningTime?: { type: "int"; value: number };
                /**
                 * The X coordinate where limited (old) world generation started.
                 *
                 * @default 0
                 */
                LimitedWorldOriginX?: { type: "int"; value: number };
                /**
                 * The Y coordinate where limited (old) world generation started.
                 *
                 * @default 0
                 */
                LimitedWorldOriginY?: { type: "int"; value: number };
                /**
                 * The Z coordinate where limited (old) world generation started.
                 *
                 * @default 0
                 */
                LimitedWorldOriginZ?: { type: "int"; value: number };
                /**
                 * The width (in chunks) of the borders surrounding the (old) world generation. Defaults to 16.
                 *
                 * @default 16
                 */
                LimitedWorldWidth?: { type: "int"; value: number };
                /**
                 * The depth (in chunks) of the borders surrounding the (old) world generation. Defaults to 16.
                 *
                 * @default 16
                 */
                LimitedWorldDepth?: { type: "int"; value: number };
                /**
                 * The `maxcommandchainlength` [game rule](game rule).
                 */
                maxcommandchainlength?: { type: "int"; value: number };
                /**
                 * Five ints representing the minimum compatible client version that is needed to open the world. Eg. for the [beta/_Preview_ 1.20.30.22](Bedrock Edition Preview 1.20.30.22) the minimum compatible version is `1 20 30 0 0`.
                 */
                MinimumCompatibleClientVersion?: { type: "list"; value: { type: "int"; value: [number, number, number, number, 0 | 1] } };
                /**
                 * UNDOCUMENTED.
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                mobgriefing?: { type: "byte"; value: 0 | 1 };
                /**
                 * Whether the world has been opened with the "Multiplayer Game" world setting enabled.
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                MultiplayerGame?: { type: "byte"; value: 0 | 1 };
                /**
                 * Whether the "Multiplayer Game" world toggle is enabled.
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                MultiplayerGameIntent?: { type: "byte"; value: 0 | 1 };
                /**
                 * The `naturalregeneration` [game rule](game rule).
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                naturalregeneration?: { type: "byte"; value: 0 | 1 };
                /**
                 * Defaults to 8. This is used to tell the game how many Overworld blocks go into one nether block (X blocks in the nether = 1 block in the overworld).
                 *
                 * @default 8
                 */
                NetherScale?: { type: "int"; value: number };
                /**
                 * The protocol version of the version the world was last played on.
                 */
                NetworkVersion?: { type: "int"; value: number };
                /**
                 * Seems to store the platform that the level is created on. Currently observed value is 2.
                 *
                 * @default 2
                 */
                Platform?: { type: "int"; value: number };
                /**
                 * UNDOCUMENTED.
                 */
                PlatformBroadcastIntent?: { type: "int"; value: number };
                /**
                 * The UUID of the premium world template this world was created with. Used for [Marketplace worlds](Marketplace#Worlds).*info needed*
                 */
                prid?: { type: "string"; value: string };
                /**
                 * The `pvp` [game rule](game rule).
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                pvp?: { type: "byte"; value: 0 | 1 };
                /**
                 * UNDOCUMENTED.
                 */
                rainLevel?: { type: "float"; value: number };
                /**
                 * UNDOCUMENTED.
                 */
                rainTime?: { type: "int"; value: number };
                /**
                 * Level seed.
                 */
                RandomSeed?: { type: "long"; value: [high: number, low: number] };
                /**
                 * The `randomtickspeed` [game rule](game rule).
                 *
                 * @default 1
                 */
                randomtickspeed?: { type: "int"; value: number };
                /**
                 * The `recipesunlock` [game rule](game rule).
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                recipesunlock?: { type: "byte"; value: 0 | 1 };
                /**
                 * UNDOCUMENTED.
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                requiresCopiedPackRemovalCheck?: { type: "byte"; value: 0 | 1 };
                /**
                 * The `respawnblocksexplode` [game rule](game rule).
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                respawnblocksexplode?: { type: "byte"; value: 0 | 1 };
                /**
                 * The `sendcommandfeedback` [game rule](game rule).
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                sendcommandfeedback?: { type: "byte"; value: 0 | 1 };
                /**
                 * Simulation distance.*info needed*
                 *
                 * @default 4
                 */
                serverChunkTickRange?: { type: "int"; value: number };
                /**
                 * The `showbordereffect` [game rule](game rule).
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                showbordereffect?: { type: "byte"; value: 0 | 1 };
                /**
                 * The `showcoordinates` [game rule](game rule).
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                showcoordinates?: { type: "byte"; value: 0 | 1 };
                /**
                 * The `showdaysplayed` [game rule](game rule).
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                showdaysplayed?: { type: "byte"; value: 0 | 1 };
                /**
                 * The `showdeathmessages` [game rule](game rule).
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                showdeathmessages?: { type: "byte"; value: 0 | 1 };
                /**
                 * The `showtags` [game rule](game rule).
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                showtags?: { type: "byte"; value: 0 | 1 };
                /**
                 * 1 or 0 (true/false) - true if mobs can spawn.
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                spawnMobs?: { type: "byte"; value: 0 | 1 };
                /**
                 * The `spawnradius` [game rule](game rule).
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                spawnradius?: { type: "int"; value: 0 | 1 };
                /**
                 * Spawn pre-1.10.0 villagers.
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                SpawnV1Villagers?: { type: "byte"; value: 0 | 1 };
                /**
                 * The X coordinate of the world spawn position. Defaults to 0.
                 *
                 * @default 0
                 */
                SpawnX?: { type: "int"; value: number };
                /**
                 * The Y coordinate of the world spawn position. Defaults to 64.
                 *
                 * @default 64
                 */
                SpawnY?: { type: "int"; value: number };
                /**
                 * The Z coordinate of the world spawn position. Defaults to 0.
                 *
                 * @default 0
                 */
                SpawnZ?: { type: "int"; value: number };
                /**
                 * 1 or 0 (true/false) - true if new players spawn with a locator map.
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                startWithMapEnabled?: { type: "byte"; value: 0 | 1 };
                /**
                 * Version of _Bedrock Edition_ Storage Tool, currently is 10.
                 *
                 * @default 10
                 */
                StorageVersion?: { type: "int"; value: number };
                /**
                 * 1 or 0 (true/false) - true if the user must download the texture packs applied to the world to join.
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                texturePacksRequired?: { type: "byte"; value: 0 | 1 };
                /**
                 * Stores the current "time of day" in ticks. There are 20 ticks per real-life second, and 24000 ticks per Minecraft [daylight cycle](daylight cycle), making the full cycle length 20 minutes. 0 is the start of [daytime](Daylight cycle#Daytime), 12000 is the start of [sunset](Daylight cycle#Sunset/dusk), 13800 is the start of [nighttime](Daylight cycle#Nighttime), 22200 is the start of [sunrise](Daylight cycle#Sunrise/dawn), and 24000 is daytime again. The value stored in level.dat is always increasing and can be larger than 24000, but the "time of day" is always modulo 24000 of the "Time" field value.
                 *
                 * @default
                 *     [high: 0, low: 0]
                 */
                Time?: { type: "long"; value: [high: number, low: number] };
                /**
                 * The `tntexplodes` [game rule](game rule).
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                tntexplodes?: { type: "byte"; value: 0 | 1 };
                /**
                 * Whether the world is restricted to Microsoft Accounts only (players must be signed in).
                 *
                 * @enum 0 | 1
                 *
                 * @enumDescriptions
                 *     - `0`: true
                 * - `1`: false
                 */
                useMsaGamertagsOnly?: { type: "byte"; value: 0 | 1 };
                /**
                 * UNDOCUMENTED.
                 */
                world_policies?: { type: "compound"; value: {} };
                /**
                 * Counts how many times the game has been closed since the world was created, with its value decreasing by 1 each time.
                 */
                worldStartCount?: { type: "long"; value: [high: number, low: number] };
                /**
                 * The [multiplayer](multiplayer) exposure for Xbox Live services, corresponding to the "Microsoft Account Settings" world setting. 0 is disabled,*info needed* 1 is "Invite Only," 2 is "Friends Only," and 3 is "Friends of Friends."
                 */
                XBLBroadcastIntent?: { type: "int"; value: number };
            };
        };

        /**
         * The limbo entities data.
         *
         * @see {@link NBTSchemas.nbtSchemas.LimboEntities}
         */
        export type LimboEntities = {
            type: "compound";
            value: {
                /**
                 * A compound with a list of limbo entities.
                 */
                data: {
                    type: "compound";
                    value: {
                        /**
                         * Unknown.
                         */
                        LimboEntities: {
                            type: "list";
                            value: (
                                | { type: "byte"; value: number[] }
                                | { type: "short"; value: number[] }
                                | { type: "int"; value: number[] }
                                | { type: "long"; value: [high: number, low: number][] }
                                | { type: "float"; value: number[] }
                                | { type: "double"; value: number[] }
                                | { type: "string"; value: number[] }
                                | { type: "byteArray"; value: number[][] }
                                | { type: "shortArray"; value: number[][] }
                                | { type: "intArray"; value: number[][] }
                                | { type: "longArray"; value: [high: number, low: number][][] }
                                | { type: "compound"; value: Record<string, any> }
                                | { type: "list"; value: any[] }
                            )[];
                        };
                    };
                };
            };
        };

        /**
         * The Map schema.
         *
         * NBT structure of a map.
         *
         * @see {@link NBTSchemas.nbtSchemas.Map}
         */
        export type Map = {
            type: "compound";
            value: {
                /**
                 * The Unique ID of the map.
                 */
                mapId: { type: "long"; value: [high: number, low: number] };
                /**
                 * The Unique ID's of the parent maps.
                 */
                parentMapId: { type: "long"; value: [high: number, low: number] };
                /**
                 * 0 = The [Overworld](https://minecraft.wiki/w/Overworld), 1 = [The Nether](https://minecraft.wiki/w/The Nether), 2 = [The End](https://minecraft.wiki/w/The End), any other value = a static image with no player pin.
                 */
                dimension: { type: "byte"; value: number };
                /**
                 * 1 if the map is full explored.
                 */
                fullyExplored: { type: "byte"; value: number };
                /**
                 * 1 if the map has been locked in a [cartography table](https://minecraft.wiki/w/cartography table).
                 */
                mapLocked: { type: "byte"; value: number };
                /**
                 * How zoomed in the map is, and must be a number between 0 and 4 (inclusive) that represent the level. Default 0. If this is changed in an [anvil](https://minecraft.wiki/w/anvil) or a [cartography table](https://minecraft.wiki/w/cartography table), the Unique ID of the map changes.
                 */
                scale: { type: "byte"; value: number };
                /**
                 * Unknown. Default 0.
                 */
                unlimitedTracking: { type: "byte"; value: number };
                /**
                 * The height of the map. Is associated with the scale level.
                 */
                height: { type: "short"; value: number };
                /**
                 * The width of the map. Is associated with the scale level.
                 */
                width: { type: "short"; value: number };
                /**
                 * Center of the map according to real world by X.
                 */
                xCenter: { type: "int"; value: number };
                /**
                 * Center of the map according to real world by Z.
                 */
                zCenter: { type: "int"; value: number };
                /**
                 * A list of optional icons to display on the map.
                 */
                decorations: {
                    type: "list";
                    value: {
                        type: "compound";
                        value: {
                            data?: {
                                type: "compound";
                                value: {
                                    /**
                                     * The rotation of the symbol, ranging from 0 to 15. South = 0, West = 4, North = 8, East = 12.
                                     */
                                    rot: { type: "int"; value: number };
                                    /**
                                     * The ID of the [map icon](https://minecraft.wiki/w/Map icons.png) to display.
                                     */
                                    type: { type: "int"; value: number };
                                    /**
                                     * The horizontal column (x) where the decoration is located on the map (per pixel).
                                     */
                                    x: { type: "int"; value: number };
                                    /**
                                     * The vertical column (y) where the decoration is located on the map (per pixel).
                                     */
                                    y: { type: "int"; value: number };
                                };
                            };
                            key?: {
                                type: "compound";
                                value: {
                                    /**
                                     * The world x-position of the decoration.
                                     */
                                    blockX: { type: "int"; value: number };
                                    /**
                                     * The world y-position of the decoration.
                                     */
                                    blockY: { type: "int"; value: number };
                                    /**
                                     * The world z-position of the decoration.
                                     */
                                    blockZ: { type: "int"; value: number };
                                    /**
                                     * Unknown.
                                     */
                                    type: { type: "int"; value: number };
                                };
                            };
                        }[];
                    };
                };
                /**
                 * An array of bytes that represent color values (**65536 entries** for a default 128×128 map).
                 */
                colors: { type: "byteArray"; value: number[] };
            };
        };

        /**
         * NBT structure of [mob event](https://minecraft.wiki/w/Commands/mobevent)s.
         *
         * @see {@link NBTSchemas.nbtSchemas.MobEvents}
         */
        export type MobEvents = {
            type: "compound";
            value: {
                /**
                 * 1 or 0 (true/false) - true if the mob events can occur.
                 */
                events_enabled: { type: "byte"; value: number };
                /**
                 * 1 or 0 (true/false) - true if the [ender dragon](https://minecraft.wiki/w/ender dragon) can spawn.
                 */
                "minecraft:ender_dragon_event": { type: "byte"; value: number };
                /**
                 * 1 or 0 (true/false) - true if the [illager patrol](https://minecraft.wiki/w/illager patrol) can spawn.
                 */
                "minecraft:pillager_patrols_event": { type: "byte"; value: number };
                /**
                 * 1 or 0 (true/false) - true if the [wandering trader](https://minecraft.wiki/w/wandering trader) can spawn.
                 */
                "minecraft:wandering_trader_event": { type: "byte"; value: number };
            };
        };

        /**
         * The PlayerClient schema.
         *
         * The player client data.
         *
         * @see {@link NBTSchemas.nbtSchemas.PlayerClient}
         */
        export type PlayerClient = {
            type: "compound";
            value: {
                MsaId?: { type: "string"; value: string };
                SelfSignedId?: { type: "string"; value: string };
                ServerId?: { type: "string"; value: string };
            };
        };

        /**
         * The Portals schema.
         *
         * The portals data.
         *
         * @see {@link NBTSchemas.nbtSchemas.Portals}
         */
        export type Portals = {
            type: "compound";
            value: {
                data?: {
                    type: "compound";
                    value: {
                        PortalRecords?: {
                            type: "list";
                            value: {
                                type: "compound";
                                value: {
                                    DimId?: { type: "int"; value: number };
                                    Span?: { type: "byte"; value: number };
                                    TpX?: { type: "int"; value: number };
                                    TpY?: { type: "int"; value: number };
                                    TpZ?: { type: "int"; value: number };
                                    Xa?: { type: "byte"; value: number };
                                    Za?: { type: "byte"; value: number };
                                }[];
                            };
                        };
                    };
                };
            };
        };

        /**
         * The SchedulerWT schema.
         *
         * The schedulerWT data.
         *
         * @see {@link NBTSchemas.nbtSchemas.SchedulerWT}
         */
        export type SchedulerWT = {
            type: "compound";
            value: {
                daysSinceLastWTSpawn?: { type: "int"; value: number };
                isSpawningWT?: { type: "byte"; value: number };
                nextWTSpawnCheckTick?: { type: "long"; value: [high: number, low: number] };
            };
        };

        /**
         * The Scoreboard schema.
         *
         * NBT structure of [scoreboard](https://minecraft.wiki/w/scoreboard)s.
         *
         * @see {@link NBTSchemas.nbtSchemas.Scoreboard}
         */
        export type Scoreboard = {
            type: "compound";
            value: {
                Criteria?: {
                    type: "list";
                    value: (
                        | { type: "byte"; value: number[] }
                        | { type: "short"; value: number[] }
                        | { type: "int"; value: number[] }
                        | { type: "long"; value: [high: number, low: number][] }
                        | { type: "float"; value: number[] }
                        | { type: "double"; value: number[] }
                        | { type: "string"; value: number[] }
                        | { type: "byteArray"; value: number[][] }
                        | { type: "shortArray"; value: number[][] }
                        | { type: "intArray"; value: number[][] }
                        | { type: "longArray"; value: [high: number, low: number][][] }
                        | { type: "compound"; value: Record<string, any> }
                        | { type: "list"; value: any[] }
                    )[];
                };
                /**
                 * A  list of compound tags representing specific displayed objectives.
                 */
                DisplayObjectives: {
                    type: "list";
                    value: {
                        type: "compound";
                        value: {
                            /**
                             * The **display slot** of this objective.
                             */
                            Name: { type: "string"; value: string };
                            /**
                             * The internal **name** of the objective displayed.
                             */
                            ObjectiveName: { type: "string"; value: string };
                            /**
                             * The **sort order** of the objective displayed. 0 = `ascending`, 1 = `descending`. If not specified, or the **display slot** is `belowname`, 1 by default.
                             */
                            SortOrder: { type: "byte"; value: number };
                        }[];
                    };
                };
                /**
                 * A list of compound tags representing individual entities.
                 */
                Entries: {
                    type: "list";
                    value: {
                        type: "compound";
                        value: {
                            /**
                             * The identity type of this entity. 1 = Players, 2 = Others.
                             */
                            IdentityType: { type: "byte"; value: number };
                            /**
                             * Optional. The entity's Unique ID.
                             */
                            EntityId: { type: "long"; value: [high: number, low: number] };
                            /**
                             * Optional. The player's Unique ID.
                             */
                            PlayerId: { type: "long"; value: [high: number, low: number] };
                            /**
                             * The numerical ID given to this entity on the scoreboard system, starting from 1.
                             */
                            ScoreboardId: { type: "long"; value: [high: number, low: number] };
                        }[];
                    };
                };
                /**
                 * A list of compound tags representing objectives.
                 */
                Objectives: {
                    type: "list";
                    value: {
                        type: unknown;
                        value: [
                            {
                                /**
                                 * The **criterion** of this objective, currently, always `dummy`.
                                 */
                                Criteria: { type: "string"; value: string };
                                /**
                                 * The **display name** of this objective.
                                 */
                                DisplayName: { type: "string"; value: string };
                                /**
                                 * The internal **name** of this objective.
                                 */
                                Name: { type: "string"; value: string };
                                /**
                                 * A list of compound tags representing scores tracked on this objective.
                                 */
                                Scores: {
                                    type: "list";
                                    value: {
                                        type: "compound";
                                        value: {
                                            /**
                                             * The score this entity has on this objective.
                                             */
                                            Score: { type: "int"; value: number };
                                            /**
                                             * The numerical ID given to this entity on the scoreboard system.
                                             */
                                            ScoreboardId: { type: "long"; value: [high: number, low: number] };
                                        }[];
                                    };
                                };
                            },
                            [high: number, low: number]
                        ];
                    };
                };
            };
        };

        /**
         * The StructureTemplate schema.
         *
         * @see {@link NBTSchemas.nbtSchemas.StructureTemplate}
         */
        export type StructureTemplate = {
            type: "compound";
            value: {
                /**
                 * The structure data.
                 */
                structure: {
                    type: "compound";
                    value: {
                        /**
                         * The block palette.
                         */
                        palette: {
                            type: "compound";
                            value: {
                                /**
                                 * The default block palette.
                                 */
                                default: {
                                    type: "compound";
                                    value: {
                                        /**
                                         * The block entity data.
                                         */
                                        block_position_data: {
                                            type: "compound";
                                            value: {
                                                [key: `${bigint}`]: BlockEntity;
                                            };
                                        };
                                        /**
                                         * The block palette.
                                         */
                                        block_palette: { type: "list"; value: { type: unknown; value: any[] } };
                                    };
                                };
                            };
                        };
                        /**
                         * The block indices.
                         *
                         * These are two arrays of indices in the block palette.
                         *
                         * The first layer is the block layer.
                         *
                         * The second layer is the waterlog layer, even though it is mainly used for waterlogging, other blocks can be put here to,
                         * which allows for putting two blocks in the same location, or creating ghost blocks (as blocks in this layer cannot be interacted with,
                         * however when the corresponding block in the block layer is broken, this block gets moved to the block layer).
                         */
                        block_indices: {
                            type: "list";
                            value: { type: "list"; value: { type: "list"; value: [{ type: "int"; value: number[] }, { type: "int"; value: number[] }] }[] };
                        };
                        /**
                         * The list of entities in the structure.
                         */
                        entities: { type: "list"; value: { type: unknown; value: any[] } };
                    };
                };
                /**
                 * The size of the structure, as a tuple of 3 integers.
                 */
                size: { type: "list"; value: { type: "int"; value: [number, number, number] } };
                /**
                 * The world origin of the structure, as a tuple of 3 integers.
                 *
                 * This is used for entity and block entity data, to get relative positions.
                 */
                structure_world_origin: { type: "list"; value: { type: "int"; value: [number, number, number] } };
                /**
                 * The format version of the structure.
                 *
                 * @enum 1
                 */
                format_version: { type: "int"; value: 1 };
            };
        };

        /**
         * The TickingArea schema.
         *
         * The tickingarea data.
         *
         * @see {@link NBTSchemas.nbtSchemas.TickingArea}
         */
        export type TickingArea = {
            type: "compound";
            value: {
                Dimension?: { type: "int"; value: number };
                IsCircle?: { type: "byte"; value: number };
                MaxX?: { type: "int"; value: number };
                MaxZ?: { type: "int"; value: number };
                MinX?: { type: "int"; value: number };
                MinZ?: { type: "int"; value: number };
                Name?: { type: "string"; value: string };
                Preload?: { type: "byte"; value: number };
            };
        };

        /**
         * The VILLAGE_DWELLERS schema.
         *
         * The village dwellers data.
         *
         * @see {@link NBTSchemas.nbtSchemas.VILLAGE_DWELLERS}
         */
        export type VILLAGE_DWELLERS = {
            type: "compound";
            value: {
                Dwellers?: {
                    type: "list";
                    value: {
                        type: "compound";
                        value: {
                            actors?: {
                                type: "list";
                                value: {
                                    type: "compound";
                                    value: {
                                        ID?: { type: "long"; value: [high: number, low: number] };
                                        last_saved_pos?: { type: "list"; value: { type: "int"; value: [number, number, number] } };
                                        TS?: { type: "long"; value: [high: number, low: number] };
                                    }[];
                                };
                            };
                        }[];
                    };
                };
            };
        };

        /**
         * The VILLAGE_INFO schema.
         *
         * The village info data.
         *
         * @see {@link NBTSchemas.nbtSchemas.VILLAGE_INFO}
         */
        export type VILLAGE_INFO = {
            type: "compound";
            value: {
                BDTime?: { type: "long"; value: [high: number, low: number] };
                GDTime?: { type: "long"; value: [high: number, low: number] };
                Initialized?: { type: "byte"; value: number };
                MTick?: { type: "long"; value: [high: number, low: number] };
                PDTick?: { type: "long"; value: [high: number, low: number] };
                RX0?: { type: "int"; value: number };
                RX1?: { type: "int"; value: number };
                RY0?: { type: "int"; value: number };
                RY1?: { type: "int"; value: number };
                RZ0?: { type: "int"; value: number };
                RZ1?: { type: "int"; value: number };
                Tick?: { type: "long"; value: [high: number, low: number] };
                Version?: { type: "byte"; value: number };
                X0?: { type: "int"; value: number };
                X1?: { type: "int"; value: number };
                Y0?: { type: "int"; value: number };
                Y1?: { type: "int"; value: number };
                Z0?: { type: "int"; value: number };
                Z1?: { type: "int"; value: number };
            };
        };

        /**
         * The VILLAGE_PLAYERS schema.
         *
         * The village players data.
         *
         * @see {@link NBTSchemas.nbtSchemas.VILLAGE_PLAYERS}
         */
        export type VILLAGE_PLAYERS = {
            type: "compound";
            value: {
                Players?: {
                    type: "list";
                    value: (
                        | { type: "byte"; value: number[] }
                        | { type: "short"; value: number[] }
                        | { type: "int"; value: number[] }
                        | { type: "long"; value: [high: number, low: number][] }
                        | { type: "float"; value: number[] }
                        | { type: "double"; value: number[] }
                        | { type: "string"; value: number[] }
                        | { type: "byteArray"; value: number[][] }
                        | { type: "shortArray"; value: number[][] }
                        | { type: "intArray"; value: number[][] }
                        | { type: "longArray"; value: [high: number, low: number][][] }
                        | { type: "compound"; value: Record<string, any> }
                        | { type: "list"; value: any[] }
                    )[];
                };
            };
        };

        /**
         * The VILLAGE_POI schema.
         *
         * The village POIs data.
         *
         * @see {@link NBTSchemas.nbtSchemas.VILLAGE_POI}
         */
        export type VILLAGE_POI = {
            type: "compound";
            value: {
                POI?: {
                    type: "list";
                    value: {
                        type: "compound";
                        value: {
                            instances?: {
                                type: "list";
                                value: {
                                    type: "compound";
                                    value: {
                                        Capacity?: { type: "long"; value: [high: number, low: number] };
                                        InitEvent?: { type: "string"; value: string };
                                        Name?: { type: "string"; value: string };
                                        OwnerCount?: { type: "long"; value: [high: number, low: number] };
                                        Radius?: { type: "float"; value: number };
                                        Skip?: { type: "byte"; value: number };
                                        SoundEvent?: { type: "string"; value: string };
                                        Type?: { type: "int"; value: number };
                                        UseAABB?: { type: "byte"; value: number };
                                        Weight?: { type: "long"; value: [high: number, low: number] };
                                        X?: { type: "int"; value: number };
                                        Y?: { type: "int"; value: number };
                                        Z?: { type: "int"; value: number };
                                    }[];
                                };
                            };
                            VillagerID?: { type: "long"; value: [high: number, low: number] };
                        }[];
                    };
                };
            };
        };

        /**
         * NBT structure of players' ability info.
         *
         * @see {@link NBTSchemas.nbtSchemas.Abilities}
         */
        export type Abilities = {
            type: "compound";
            value: {
                /**
                 * The player's ability setting.
                 */
                abilities: {
                    type: "compound";
                    value: {
                        /**
                         * 1 or 0 (true/false) - true if the player can attack mobs.
                         */
                        attackmobs: { type: "byte"; value: number };
                        /**
                         * 1 or 0 (true/false) - true if the player can attack other players.
                         */
                        attackplayers: { type: "byte"; value: number };
                        /**
                         * 1 or 0 (true/false) - true if the player can place blocks.
                         */
                        build: { type: "byte"; value: number };
                        /**
                         * 1 or 0 (true/false) - true if the player is able to interact with redstone components.
                         */
                        doorsandswitches: { type: "byte"; value: number };
                        /**
                         * 1 or 0 (true/false) - true if the player is currently flying.
                         */
                        flying: { type: "byte"; value: number };
                        /**
                         * The flying speed, always 0.05.
                         */
                        flySpeed: { type: "float"; value: number };
                        /**
                         * 1 or 0 (true/false) - true if the player can instantly destroy blocks.
                         */
                        instabuild: { type: "byte"; value: number };
                        /**
                         * 1 or 0 (true/false) - true if the player is immune to all damage and harmful effects.
                         */
                        invulnerable: { type: "byte"; value: number };
                        /**
                         * 1 or 0 (true/false) - true if the player was struck by lightning.
                         */
                        lightning: { type: "byte"; value: number };
                        /**
                         * 1 or 0 (true/false) - true if the player can fly.
                         */
                        mayfly: { type: "byte"; value: number };
                        /**
                         * 1 or 0 (true/false) - true if the player can destroy blocks.
                         */
                        mine: { type: "byte"; value: number };
                        /**
                         * 1 or 0 (true/false) - true if the player messages cannot be seen by other players.
                         */
                        mute: { type: "byte"; value: number };
                        /**
                         * 1 or 0 (true/false) - true if the player can phase through blocks.
                         */
                        noclip: { type: "byte"; value: number };
                        /**
                         * 1 or 0 (true/false) - true if the player has operator commands.
                         */
                        op: { type: "byte"; value: number };
                        /**
                         * 1 or 0 (true/false) - true if the player is able to open containers.
                         */
                        opencontainers: { type: "byte"; value: number };
                        /**
                         * What permissions a player will default to, when joining a world.
                         */
                        permissionsLevel: { type: "int"; value: number };
                        /**
                         * What permissions a player has.
                         */
                        playerPermissionsLevel: { type: "int"; value: number };
                        /**
                         * 1 or 0 (true/false) - true if the player is allowed to teleport.
                         */
                        teleport: { type: "byte"; value: number };
                        /**
                         * The walking speed, always 0.1.
                         */
                        walkSpeed: { type: "float"; value: number };
                        /**
                         * 1 or 0 (true/false) - true if the player is a world builder.
                         */
                        worldbuilder: { type: "byte"; value: number };
                    };
                };
            };
        };

        /**
         * NBT structure of an [attribute](https://minecraft.wiki/w/attribute).
         *
         * @see {@link NBTSchemas.nbtSchemas.Attribute}
         */
        export type Attribute = {
            type: "compound";
            value: {
                /**
                 * The base value of this Attribute.
                 */
                Base: { type: "float"; value: number };
                /**
                 * Unknown.
                 */
                Current: { type: "float"; value: number };
                /**
                 * Unknown.
                 */
                DefaultMax: { type: "float"; value: number };
                /**
                 * Unknown.
                 */
                DefaultMin: { type: "float"; value: number };
                /**
                 * Unknown.
                 */
                Max: { type: "float"; value: number };
                /**
                 * Unknown.
                 */
                Min: { type: "float"; value: number };
                /**
                 * (May not exist) List of [Modifiers](https://minecraft.wiki/w/Attribute#Modifiers).
                 */
                Modifiers?: { type: "list"; value: { type: "compound"; value: {} & AttributeModifier[] } };
                /**
                 * The name of this Attribute.
                 */
                Name: { type: "string"; value: string };
                /**
                 * (May not exist) Unknown.
                 */
                TemporalBuffs?: { type: "list"; value: { type: unknown; value: [number, number, number, number] } };
            };
        };

        /**
         * List of [attribute](https://minecraft.wiki/w/attribute)s.
         *
         * @see {@link NBTSchemas.nbtSchemas.Attributes}
         */
        export type Attributes = { type: "list"; value: { type: "compound"; value: {} & Attribute[] } };

        /**
         * NBT structure of an attribute [modifier](https://minecraft.wiki/w/modifier).
         *
         * @see {@link NBTSchemas.nbtSchemas.AttributeModifier}
         */
        export type AttributeModifier = {
            type: "compound";
            value: {
                /**
                 * The amount by which this Modifier modifies the Base value in calculations.
                 */
                Amount: { type: "float"; value: number };
                /**
                 * The Modifier's name.
                 */
                Name: { type: "string"; value: string };
                /**
                 * Unknown.
                 */
                Operand: { type: "int"; value: number };
                /**
                 * Defines the operation this Modifier executes on the Attribute's Base value. 0: Increment X by Amount, 1: Increment Y by X * Amount, 2: Y = Y * (1 + Amount) (equivalent to Increment Y by Y * Amount).*needs testing*
                 */
                Operation: { type: "int"; value: number };
                /**
                 * This modifier's UUID Least.
                 */
                UUIDLeast: { type: "long"; value: [high: number, low: number] };
                /**
                 * This modifier's UUID Most.
                 */
                UUIDMost: { type: "long"; value: [high: number, low: number] };
            };
        };

        /**
         * The Block schema.
         *
         * NBT structure of a [block](https://minecraft.wiki/w/block).
         *
         * @see {@link NBTSchemas.nbtSchemas.Block}
         */
        export type Block = {
            type: "compound";
            value: {
                /**
                 * The namespaced ID of this block.
                 */
                name: { type: "string"; value: string };
                /**
                 * The block states of the block.
                 */
                states: {
                    type: "compound";
                    value: {
                        [key: string]: { type: any; value: any };
                    };
                };
                /**
                 * The data version.
                 *
                 * @example 18163713
                 *
                 * @example 18168865
                 */
                version: { type: "int"; value: number };
            };
        };

        /**
         * NBT structure of [command block](https://minecraft.wiki/w/command block) and [minecart with command block](https://minecraft.wiki/w/minecart with command block).
         *
         * @see {@link NBTSchemas.nbtSchemas.CommandBlock}
         */
        export type CommandBlock = {
            type: "compound";
            value: {
                /**
                 * The command entered into the command block.
                 */
                Command: { type: "string"; value: string };
                /**
                 * The custom name or hover text of this command block.
                 */
                CustomName: { type: "string"; value: string };
                /**
                 * 1 or 0 (true/false) - true if it executes on the first tick once saved or activated.
                 */
                ExecuteOnFirstTick: { type: "byte"; value: number };
                /**
                 * Stores the time when a command block was last executed.
                 */
                LastExecution: { type: "long"; value: [high: number, low: number] };
                /**
                 * The translation key of the output's last line generated by the command block. Still stored even if the [gamerule](https://minecraft.wiki/w/gamerule) commandBlockOutput is false. Appears in the command GUI.
                 */
                LastOutput: { type: "string"; value: string };
                /**
                 * The params for the output's translation key.
                 */
                LastOutputParams: { type: "list"; value: { type: "string"; value: string[] } };
                /**
                 * Represents the strength of the analog signal output by redstone comparators attached to this command block.
                 */
                SuccessCount: { type: "int"; value: number };
                /**
                 * The delay between each execution.
                 */
                TickDelay: { type: "int"; value: number };
                /**
                 * 1 or 0 (true/false) - true if the `LastOutput` is stored. Can be toggled in the GUI by clicking a button near the "Previous Output" textbox.
                 */
                TrackOutput: { type: "byte"; value: number };
                /**
                 * The data version.
                 */
                Version: { type: "int"; value: number };
            };
        };

        /**
         * NBT structure of [firework](https://minecraft.wiki/w/firework) and [firework star](https://minecraft.wiki/w/firework star).
         *
         * @see {@link NBTSchemas.nbtSchemas.FireworkExplosion}
         */
        export type FireworkExplosion = {
            type: "compound";
            value: {
                /**
                 * Array of byte values corresponding to the primary colors of this firework's explosion.
                 */
                FireworkColor: { type: "byteArray"; value: number[] };
                /**
                 * Array of byte values corresponding to the fading colors of this firework's explosion.
                 */
                FireworkFade: { type: "byteArray"; value: number[] };
                /**
                 * 1 or 0 (true/false) - true if this explosion has the twinkle effect (glowstone dust).
                 */
                FireworkFlicker: { type: "byte"; value: number };
                /**
                 * 1 or 0 (true/false) - true if this explosion has the trail effect (diamond).
                 */
                FireworkTrail: { type: "byte"; value: number };
                /**
                 * The shape of this firework's explosion. 0 = Small Ball, 1 = Large Ball, 2 = Star-shaped, 3 = Creeper-shaped, and 4 = Burst.*needs testing*
                 */
                FireworkType: { type: "byte"; value: number };
            };
        };

        /**
         * NBT structure of a [status effect](https://minecraft.wiki/w/status effect).
         *
         * @see {@link NBTSchemas.nbtSchemas.MobEffect}
         */
        export type MobEffect = {
            type: "compound";
            value: {
                /**
                 * 1 or 0 (true/false) - true if this effect is provided by a beacon and therefore should be less intrusive on screen.
                 */
                Ambient: { type: "byte"; value: number };
                /**
                 * The potion effect level. 0 is level 1.
                 */
                Amplifier: { type: "byte"; value: number };
                /**
                 * Unknown.
                 */
                DisplayOnScreenTextureAnimation: { type: "byte"; value: number };
                /**
                 * The number of ticks before the effect wears off.
                 */
                Duration: { type: "int"; value: number };
                /**
                 * Duration for Easy mode.
                 */
                DurationEasy: { type: "int"; value: number };
                /**
                 * Duration for Hard mode.
                 */
                DurationHard: { type: "int"; value: number };
                /**
                 * Duration for Normal mode.
                 */
                DurationNormal: { type: "int"; value: number };
                FactorCalculationData?: {
                    type: "compound";
                    value: {
                        change_timestamp?: { type: "int"; value: number };
                        factor_current?: { type: "float"; value: number };
                        factor_previous?: { type: "float"; value: number };
                        factor_start?: { type: "float"; value: number };
                        factor_target?: { type: "float"; value: number };
                        had_applied?: { type: "byte"; value: number };
                        had_last_tick?: { type: "byte"; value: number };
                        padding_duration?: { type: "int"; value: number };
                    };
                };
                /**
                 * The numerical effect ID.
                 */
                Id: { type: "byte"; value: number };
                /**
                 * 1 or 0 (true/false) - true if particles are shown.
                 */
                ShowParticles: { type: "byte"; value: number };
            };
        };

        /**
         * NBT structure of a [monster spawner](https://minecraft.wiki/w/monster spawner).
         *
         * @see {@link NBTSchemas.nbtSchemas.MonsterSpawner}
         */
        export type MonsterSpawner = {
            type: "compound";
            value: {
                /**
                 * Ticks until next spawn. If 0, it spawns immediately when a player enters its range.
                 */
                Delay: { type: "short"; value: number };
                /**
                 * The height of entity model that displayed in the block.
                 */
                DisplayEntityHeight: { type: "float"; value: number };
                /**
                 * The scale of entity model that displayed in the block.
                 */
                DisplayEntityScale: { type: "float"; value: number };
                /**
                 * The width of entity model that displayed in the block.
                 */
                DisplayEntityWidth: { type: "float"; value: number };
                /**
                 * The id of the entity to be summoned.more info
                 */
                EntityIdentifier: { type: "string"; value: string };
                /**
                 * The maximum number of nearby (within a box of `SpawnRange`*2+1 × `SpawnRange`*2+1 × 8 centered around the spawner block *needs testing*) entities whose IDs match this spawner's entity ID.
                 */
                MaxNearbyEntities: { type: "short"; value: number };
                /**
                 * The maximum random delay for the next spawn delay.
                 */
                MaxSpawnDelay: { type: "short"; value: number };
                /**
                 * The minimum random delay for the next spawn delay.
                 */
                MinSpawnDelay: { type: "short"; value: number };
                /**
                 * Overrides the block radius of the sphere of activation by players for this spawner.
                 */
                RequiredPlayerRange: { type: "short"; value: number };
                /**
                 * How many mobs to attempt to spawn each time.
                 */
                SpawnCount: { type: "short"; value: number };
                /**
                 * (May not exist) Contains tags to copy to the next spawned entity(s) after spawning.
                 */
                SpawnData?: {
                    type: "compound";
                    value: {
                        /**
                         * Unknown.
                         */
                        Properties: { type: "compound"; value: {} };
                        /**
                         * The entity's namespaced ID.
                         */
                        TypeId: { type: "string"; value: string };
                        /**
                         * Unknown.
                         */
                        Weight: { type: "int"; value: number };
                    };
                };
                /**
                 * (May not exist) List of possible entities to spawn.
                 */
                SpawnPotentials?: {
                    type: "list";
                    value: {
                        type: "compound";
                        value: {
                            /**
                             * Unknown.
                             */
                            Properties: { type: "compound"; value: {} };
                            /**
                             * The entity's namespaced ID.
                             */
                            TypeId: { type: "string"; value: string };
                            /**
                             * The chance that this spawn gets picked in comparison to other spawn weights. Must be positive and at least 1.
                             */
                            Weight: { type: "int"; value: number };
                        }[];
                    };
                };
                /**
                 * The radius around which the spawner attempts to place mobs randomly. The spawn area is square, includes the block the spawner is in, and is centered around the spawner's x,z coordinates - not the spawner itself.*needs testing* Default value is 4.
                 */
                SpawnRange: { type: "short"; value: number };
            };
        };

        /**
         * Minecart entities include.
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Minecart}
         */
        export type Entity_Minecart = {
            type: "compound";
            value: {
                /**
                 * 1 or 0 (true/false) - (may not exist) if is displayed the custom tile in this minecart.
                 */
                CustomDisplayTile: { type: "byte"; value: number };
                /**
                 * (May not exist) The custom block in the minecart.
                 */
                DisplayBlock?: { type: "compound"; value: {} } & Block;
                /**
                 * (May not exist) The offset of the block displayed in the Minecart in pixels. Positive values move the block upwards, while negative values move it downwards. A value of 16 moves the block up by exactly one multiple of its height.*needs testing*
                 */
                DisplayOffset?: { type: "int"; value: number };
            };
        };

        /**
         * Villager entities include.
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Villagers}
         */
        export type Entity_Villagers = {
            type: "compound";
            value: {
                /**
                 * 1 or 0 (true/false) - true if the villager is willing to mate. Becomes true after certain trades (those that would cause offers to be refreshed), and false after mating.
                 */
                Willing: { type: "byte"; value: number };
            };
        };

        /**
         * Monster entities include.
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Monster}
         */
        export type Entity_Monster = {
            type: "compound";
            value: {
                /**
                 * 1 or 0 (true/false) - true if is spawned by night.more info
                 */
                SpawnedByNight: { type: "byte"; value: number };
            };
        };

        /**
         * Humanoid monster entities include.
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_HumanoidMonster}
         */
        export type Entity_HumanoidMonster = {
            type: "compound";
            value: {
                /**
                 * (May not exist) The items in the entity's hand.
                 */
                ItemInHand?: { type: "compound"; value: {} } & Item_ItemStack;
            };
        };

        /**
         * Mob entities include.
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Mob}
         */
        export type Entity_Mob = {
            type: "compound";
            value: {
                /**
                 * (May not exist) The list of potion effects on this mob.
                 */
                ActiveEffects?: { type: "list"; value: { type: "compound"; value: {} & MobEffect[] } };
                /**
                 * How much air the living entity has, in ticks.
                 */
                Air: { type: "short"; value: number };
                /**
                 * The list of items the mob is wearing as armor.
                 */
                Armor: {
                    type: "list";
                    value: { type: "compound"; value: [{} & Item_ItemStack, {} & Item_ItemStack, {} & Item_ItemStack, {} & Item_ItemStack] };
                };
                /**
                 * Number of ticks the mob attacks for. 0 when not attacking.
                 */
                AttackTime: { type: "short"; value: number };
                /**
                 * A list of [Attribute](https://minecraft.wiki/w/Attribute)s for this mob. These are used for many purposes in internal calculations. Valid Attributes for a given mob are listed in the [main article](https://minecraft.wiki/w/Attribute).
                 */
                Attributes: { type: "list"; value: { type: "compound"; value: {} & Attribute[] } };
                /**
                 * (May not exist) Unknown.
                 */
                BodyRot?: { type: "float"; value: number };
                /**
                 * X of the bound origin.
                 */
                boundX: { type: "int"; value: number };
                /**
                 * Y of the bound origin.
                 */
                boundY: { type: "int"; value: number };
                /**
                 * Z of the bound origin.
                 */
                boundZ: { type: "int"; value: number };
                /**
                 * 1 or 0 (true/false) - true if this entity can pick up items.
                 */
                canPickupItems: { type: "byte"; value: number };
                /**
                 * 1 or 0 (true/false) - true if dead.
                 */
                Dead: { type: "byte"; value: number };
                /**
                 * Number of ticks the mob has been dead for. Controls death animations. 0 when alive.
                 */
                DeathTime: { type: "short"; value: number };
                /**
                 * 1 or 0 (true/false) - if this mob has bound origin. Only *needs testing* effects [Vex](https://minecraft.wiki/w/Vex). When a vex is idle, it wanders, selecting air blocks from within a 15×11×15 *needs testing* cuboid range centered at BoundX, BoundY, BoundZ. when it summoned the vex, this value is set to true, and the central spot is the location of the evoker. Or if an evoker was not involved, this value is false.
                 */
                hasBoundOrigin: { type: "byte"; value: number };
                /**
                 * 1 or 0 (true/false) - true if `canPickupItems` has been set by the game.
                 */
                hasSetCanPickupItems: { type: "byte"; value: number };
                /**
                 * Number of ticks the mob turns red for after being hit. 0 when not recently hit.
                 */
                HurtTime: { type: "short"; value: number };
                /**
                 * The Unique ID of an entity that is leashing it with a lead. Set to -1 if there's no leasher.
                 */
                LeasherID: { type: "long"; value: [high: number, low: number] };
                /**
                 * The left time in ticks until this entity disapears. Only *needs testing* effects [Evoker Fang](https://minecraft.wiki/w/Evoker Fang)s. For other entities, it is set to 0.
                 */
                limitedLife: { type: "long"; value: [high: number, low: number] };
                /**
                 * The item being held in the mob's main hand.
                 */
                Mainhand: { type: "list"; value: { type: "compound"; value: {} & Item_ItemStack[] } };
                /**
                 * 1 or 0 (true/false) - true if it is naturally spawned.
                 */
                NaturalSpawn: { type: "byte"; value: number };
                /**
                 * The item being held in the mob's off hand.
                 */
                Offhand: { type: "list"; value: { type: "compound"; value: {} & Item_ItemStack[] } };
                /**
                 * (May not exist) Unknown.
                 */
                persistingOffers?: { type: "compound"; value: {} };
                /**
                 * (May not exist) Unknown.
                 */
                persistingRiches?: { type: "int"; value: number };
                /**
                 * 1 or 0 (true/false) - true if it is naturally spawned on the surface.
                 */
                Surface: { type: "byte"; value: number };
                /**
                 * (May not exist) The Unique ID of a captain to follow. Used by pillager and vindicator.
                 */
                TargetCaptainID?: { type: "long"; value: [high: number, low: number] };
                /**
                 * The Unique ID of an entity that this entity is angry at.
                 */
                TargetID: { type: "long"; value: [high: number, low: number] };
                /**
                 * (May not exist) Trade experiences of this trader entity.
                 */
                TradeExperience?: { type: "int"; value: number };
                /**
                 * (May not exist) Trade tier of this trader entity.
                 */
                TradeTier?: { type: "int"; value: number };
                /**
                 * (May not exist) unknown.
                 */
                WantsToBeJockey?: { type: "byte"; value: number };
            };
        };

        /**
         * Abstract arrow entities include.
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_AbstractArrow}
         */
        export type Entity_AbstractArrow = {
            type: "compound";
            value: {
                /**
                 * 1 or 0 (true/false) - true if its owner is a player in Creative mode.
                 */
                isCreative: { type: "byte"; value: number };
                /**
                 * The Unique ID of the entity this projectile was thrown by. Set to -1 if it has no owner.
                 */
                OwnerID: { type: "long"; value: [high: number, low: number] };
                /**
                 * 1 or 0 (true/false) - true if its owner is a player.
                 */
                player: { type: "byte"; value: number };
            };
        };

        /**
         * Throwable entities include.
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Throwable}
         */
        export type Entity_Throwable = {
            type: "compound";
            value: {
                /**
                 * Unknown.
                 */
                inGround: { type: "byte"; value: number };
                /**
                 * The Unique ID of the entity this projectile was thrown by.
                 */
                OwnerID: { type: "long"; value: [high: number, low: number] };
                /**
                 * Unknown.
                 */
                shake: { type: "byte"; value: number };
            };
        };

        /**
         * Additional fields for [allay](https://minecraft.wiki/w/allay).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Allay}
         */
        export type Entity_Allay = {
            type: "compound";
            value: {
                /**
                 * The allay's duplication cooldown in ticks. This is set to 6000 ticks (5 minutes) when the allay duplicates.
                 */
                AllayDuplicationCooldown: { type: "long"; value: [high: number, low: number] };
                /**
                 * The vibration event listener of this allay.
                 */
                VibrationListener: {
                    type: "compound";
                    value: {
                        /**
                         * Unknown.
                         */
                        event: { type: "int"; value: number };
                        /**
                         * Unknown.
                         */
                        pending: {
                            type: "compound";
                            value: {
                                /**
                                 * Unknown.
                                 */
                                distance: { type: "float"; value: number };
                                /**
                                 * Unknown.
                                 */
                                source: { type: "long"; value: [high: number, low: number] };
                                /**
                                 * Unknown.
                                 */
                                vibration: { type: "int"; value: number };
                                /**
                                 * Unknown.
                                 */
                                x: { type: "int"; value: number };
                                /**
                                 * Unknown.
                                 */
                                y: { type: "int"; value: number };
                                /**
                                 * Unknown.
                                 */
                                z: { type: "int"; value: number };
                            };
                        };
                        /**
                         * Unknown.
                         */
                        selector: { type: "compound"; value: {} };
                        /**
                         * Unknown.
                         */
                        ticks: { type: "int"; value: number };
                    };
                };
            };
        };

        /**
         * Additional fields for [area effect cloud](https://minecraft.wiki/w/area effect cloud).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_AreaEffectCloud}
         */
        export type Entity_AreaEffectCloud = {
            type: "compound";
            value: {
                /**
                 * The maximum age of the field.
                 */
                Duration: { type: "int"; value: number };
                /**
                 * The amount the duration of the field changes upon applying the effect.
                 */
                DurationOnUse: { type: "int"; value: number };
                /**
                 * The field's initial radius.
                 */
                InitialRadius: { type: "float"; value: number };
                /**
                 * A list of the applied [effect](https://minecraft.wiki/w/effect)s.
                 */
                mobEffects: { type: "list"; value: { type: unknown; value: any[] } };
                /**
                 * The Unique ID of the entity who created the cloud. If it has no owner, defaults to -1.
                 */
                OwnerId: { type: "long"; value: [high: number, low: number] };
                /**
                 * The color of the particles.
                 */
                ParticleColor: { type: "int"; value: number };
                /**
                 * The particles displayed by the field.
                 */
                ParticleId: { type: "int"; value: number };
                /**
                 * How many [dragon's breath](https://minecraft.wiki/w/dragon's breath) can be picked up.
                 */
                PickupCount: { type: "int"; value: number };
                /**
                 * The name of the default potion effect. See [potion data values](https://minecraft.wiki/w/potion#Item data) for valid IDs.
                 */
                PotionId: { type: "short"; value: number };
                /**
                 * The field's current radius.
                 */
                Radius: { type: "float"; value: number };
                /**
                 * The amount the radius changes when picked up by a glass bottle.
                 */
                RadiusChangeOnPickup: { type: "float"; value: number };
                /**
                 * The amount the radius changes upon applying the effect. Normally negative.
                 */
                RadiusOnUse: { type: "float"; value: number };
                /**
                 * The amount the radius changes per tick. Normally negative.
                 */
                RadiusPerTick: { type: "float"; value: number };
                /**
                 * The number of ticks before reapplying the effect.
                 */
                ReapplicationDelay: { type: "int"; value: number };
                /**
                 * The time when it was spawned.
                 */
                SpawnTick: { type: "long"; value: [high: number, low: number] };
            };
        };

        /**
         * Additional fields for [armadillo](https://minecraft.wiki/w/armadillo).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Armadillo}
         */
        export type Entity_Armadillo = {
            type: "compound";
            value: {
                /**
                 * The armadillo `properties`.
                 */
                properties: {
                    type: "compound";
                    value: {
                        /**
                         * 1 or 0 (true/false) - true if the armadillo is rolled up.
                         */
                        "minecraft:is_rolled_up": { type: "byte"; value: number };
                        /**
                         * 1 or 0 (true/false) - true if the armadillo was hit.
                         */
                        "minecraft:is_threatened": { type: "byte"; value: number };
                        /**
                         * 1 or 0 (true/false) -  *info needed*.
                         */
                        "minecraft:is_trying_to_relax": { type: "byte"; value: number };
                    };
                };
            };
        };

        /**
         * Additional fields for [armor stand](https://minecraft.wiki/w/armor stand).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_ArmorStand}
         */
        export type Entity_ArmorStand = {
            type: "compound";
            value: {
                /**
                 * The ArmorStand's pose.
                 */
                Pose: {
                    type: "compound";
                    value: {
                        /**
                         * The redstone signal level it received.
                         */
                        LastSignal: { type: "int"; value: number };
                        /**
                         * The index of current pose.
                         */
                        PoseIndex: { type: "int"; value: number };
                    };
                };
            };
        };

        /**
         * Additional fields for [arrow](https://minecraft.wiki/w/arrow).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Arrow}
         */
        export type Entity_Arrow = {
            type: "compound";
            value: {
                /**
                 * The metadata of this arrow. See [Arrow#Metadata](https://minecraft.wiki/w/Arrow#Metadata).
                 */
                auxValue: { type: "byte"; value: number };
                /**
                 * The level of [Flame](https://minecraft.wiki/w/Flame) enchantment on the bow that shot this arrow, where 1 is level 1. 0 if no Flame enchantment.
                 */
                enchantFlame: { type: "byte"; value: number };
                /**
                 * The level of [Infinity](https://minecraft.wiki/w/Infinity) enchantment on the bow that shot this arrow, where 1 is level 1. 0 if no Infinity enchantment.
                 */
                enchantInfinity: { type: "byte"; value: number };
                /**
                 * Effects on a tipped arrow.
                 */
                mobEffects: { type: "list"; value: { type: "compound"; value: {} & MobEffect[] } };
                /**
                 * The level of [Power](https://minecraft.wiki/w/Power) enchantment on the bow that shot this arrow, where 1 is level 1. 0 if no Power enchantment.
                 */
                enchantPower: { type: "byte"; value: number };
                /**
                 * The level of [Punch](https://minecraft.wiki/w/Punch) enchantment on the bow that shot this arrow, where 1 is level 1. 0 if no Punch enchantment.
                 */
                enchantPunch: { type: "byte"; value: number };
            };
        };

        /**
         * Additional fields for [axolotl](https://minecraft.wiki/w/axolotl).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Axolotl}
         */
        export type Entity_Axolotl = {
            type: "compound";
            value: {
                /**
                 * (May not exist) Applies a defined amount of damage to the axolotl at specified intervals.
                 */
                DamageTime?: { type: "short"; value: number };
                /**
                 * Number of ticks until the axolotl dies when it is on the surface. Initially starts at 6000 ticks (5 minutes) and counts down to 0.
                 */
                TicksRemainingUntilDryOut: { type: "int"; value: number };
            };
        };

        /**
         * Additional fields for [bat](https://minecraft.wiki/w/bat).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Bat}
         */
        export type Entity_Bat = {
            type: "compound";
            value: {
                /**
                 * 1 when hanging upside down and 0 when flying.More info
                 */
                BatFlags: { type: "byte"; value: number };
            };
        };

        /**
         * Additional fields for [bee](https://minecraft.wiki/w/bee).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Bee}
         */
        export type Entity_Bee = {
            type: "compound";
            value: {
                /**
                 * The bee `properties`.
                 */
                properties: {
                    type: "compound";
                    value: {
                        /**
                         * 1 or 0 (true/false) - true if the bee is carrying pollen.
                         */
                        "minecraft:has_nectar": { type: "byte"; value: number };
                    };
                };
            };
        };

        /**
         * Additional fields for [boat with chest](https://minecraft.wiki/w/boat with chest).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_BoatWithChest}
         */
        export type Entity_BoatWithChest = { type: "compound"; value: {} } & Component_Inventory;

        /**
         * Additional fields for [breeze](https://minecraft.wiki/w/breeze).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Breeze}
         */
        export type Entity_Breeze = {
            type: "compound";
            value: {
                /**
                 * The breeze `properties`.
                 */
                properties: {
                    type: "compound";
                    value: {
                        /**
                         * 1 or 0 (true/false) - true if the breeze is playing the `mob.breeze.idle_ground` sound.
                         */
                        "minecraft:is_playing_idle_ground_sound": { type: "byte"; value: number };
                    };
                };
            };
        };

        /**
         * Additional fields for [camel](https://minecraft.wiki/w/camel).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Camel}
         */
        export type Entity_Camel = { type: "compound"; value: {} } & Component_Ageable;

        /**
         * Additional fields for [cat](https://minecraft.wiki/w/cat).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Cat}
         */
        export type Entity_Cat = { type: "compound"; value: {} } & Component_Ageable;

        /**
         * Additional fields for [chicken](https://minecraft.wiki/w/chicken).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Chicken}
         */
        export type Entity_Chicken = {
            type: "compound";
            value: {
                entries?: {
                    type: "list";
                    value: {
                        type: "compound";
                        value: {
                            /**
                             * Unknown.
                             */
                            SpawnTimer: { type: "int"; value: number };
                            /**
                             * Unknown.
                             */
                            StopSpawning: { type: "byte"; value: number };
                        }[];
                    };
                };
            };
        };

        /**
         * Additional fields for [cow](https://minecraft.wiki/w/cow).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Cow}
         */
        export type Entity_Cow = { type: "compound"; value: {} } & Component_Ageable;

        /**
         * Additional fields for [creeper](https://minecraft.wiki/w/creeper).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Creeper}
         */
        export type Entity_Creeper = { type: "compound"; value: {} } & Component_Explode;

        /**
         * Additional fields for [dolphin](https://minecraft.wiki/w/dolphin).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Dolphin}
         */
        export type Entity_Dolphin = {
            type: "compound";
            value: {
                /**
                 * Unknown.
                 */
                BribeTime: { type: "int"; value: number };
                /**
                 * (May not exist) Applies a defined amount of damage to the dolphin at specified intervals.
                 */
                DamageTime?: { type: "short"; value: number };
                /**
                 * Number of ticks until the dolphin dies when it is on the surface. Initially starts at 2400 ticks (2 minutes) and counts down to 0.
                 */
                TicksRemainingUntilDryOut: { type: "int"; value: number };
            };
        };

        /**
         * Additional fields for [donkey](https://minecraft.wiki/w/donkey).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Donkey}
         */
        export type Entity_Donkey = {
            type: "compound";
            value: {
                /**
                 * Random number that ranges from 0 to 100; increases with feeding or trying to tame it. Higher values make the donkey easier to tame.
                 */
                Temper: { type: "int"; value: number };
            };
        };

        /**
         * Additional fields for [egg](https://minecraft.wiki/w/egg).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Egg}
         */
        export type Entity_Egg = { type: "compound"; value: {} } & Component_Projectile;

        /**
         * Additional fields for [ender crystal](https://minecraft.wiki/w/ender crystal).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_EnderCrystal}
         */
        export type Entity_EnderCrystal = {
            type: "compound";
            value: {
                /**
                 * (May not exist) The block location its beam points to.
                 */
                BlockTargetX?: { type: "int"; value: number };
                /**
                 * (May not exist) See above.
                 */
                BlockTargetY?: { type: "int"; value: number };
                /**
                 * (May not exist) See above.
                 */
                BlockTargetZ?: { type: "int"; value: number };
            };
        };

        /**
         * Additional fields for [enderman](https://minecraft.wiki/w/enderman).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Enderman}
         */
        export type Entity_Enderman = {
            type: "compound";
            value: {
                /**
                 * The block carried by the enderman.
                 */
                carriedBlock: { type: "compound"; value: {} } & Block;
            };
        };

        /**
         * Additional fields for [endermite](https://minecraft.wiki/w/endermite).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Endermite}
         */
        export type Entity_Endermite = {
            type: "compound";
            value: {
                /**
                 * How long the endermite has existed in ticks. Disappears when this reaches around 2400.
                 */
                Lifetime: { type: "int"; value: number };
            };
        };

        /**
         * Additional fields for [evoker](https://minecraft.wiki/w/evoker).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Evoker}
         */
        export type Entity_Evoker = { type: "compound"; value: {} } & Component_Dweller;

        /**
         * Additional fields for [experience orb](https://minecraft.wiki/w/experience orb).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_ExperienceOrb}
         */
        export type Entity_ExperienceOrb = {
            type: "compound";
            value: {
                /**
                 * The number of ticks the XP orb has been "untouched". After 6000 ticks (5 minutes) the orb is destroyed.*needs testing*
                 */
                Age: { type: "short"; value: number };
                /**
                 * The amount of experience the orb gives when picked up.
                 */
                "experience value": { type: "int"; value: number };
            };
        };

        /**
         * Additional fields for [experience potion](https://minecraft.wiki/w/experience potion).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_ExperiencePotion}
         */
        export type Entity_ExperiencePotion = { type: "compound"; value: {} } & Component_Projectile;

        /**
         * Additional fields for [falling block](https://minecraft.wiki/w/falling block).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_FallingBlock}
         */
        export type Entity_FallingBlock = {
            type: "compound";
            value: {
                FallingBlock?: { type: "compound"; value: {} } & Block;
                /**
                 * The number of ticks the entity has existed. If set to 0, the moment it ticks to 1, it vanishes if the block at its location has a different ID than the entity's `FallingBlock.Name`. If the block at its location has the same ID as its `FallingBlock.Name` when `Time` ticks from 0 to 1, the block is deleted, and the entity continues to fall, having overwritten it. When Time goes above 600, or above 100 while the block is below Y=1 or is outside building height, the entity is deleted. *needs testing*
                 */
                Time: { type: "byte"; value: number };
            };
        };

        /**
         * Additional fields for [fireball](https://minecraft.wiki/w/fireball).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Fireball}
         */
        export type Entity_Fireball = {
            type: "compound";
            value: {
                /**
                 * List of 3 doubles. Should be identical to Motion.*needs testing*
                 */
                Direction: { type: "list"; value: { type: "float"; value: [number, number, number] } };
                /**
                 * Unknown.
                 */
                inGround: { type: "byte"; value: number };
                /**
                 * List of 3 floats that adds to `Direction` every tick. Act as the acceleration.
                 */
                power: { type: "list"; value: { type: "float"; value: [number, number, number] } };
            };
        };

        /**
         * Additional fields for [firework rocket](https://minecraft.wiki/w/firework).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_FireworksRocket}
         */
        export type Entity_FireworksRocket = {
            type: "compound";
            value: {
                /**
                 * The number of ticks this fireworks rocket has been flying for.
                 */
                Life: { type: "int"; value: number };
                /**
                 * The number of ticks before this fireworks rocket explodes. This value is randomized when the firework is launched.*needs testing*
                 */
                LifeTime: { type: "int"; value: number };
            };
        };

        /**
         * Additional fields for [fishing bobber](https://minecraft.wiki/w/fishing bobber).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_FishingBobber}
         */
        export type Entity_FishingBobber = { type: "compound"; value: {} } & Component_Projectile;

        /**
         * Additional fields for [fox](https://minecraft.wiki/w/fox).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Fox}
         */
        export type Entity_Fox = {
            type: "compound";
            value: {
                /**
                 * The number of players who are trusted by the fox.
                 */
                TrustedPlayersAmount: { type: "int"; value: number };
            } & {
                [key: `TrustedPlayer${bigint}`]: { type: "long"; value: [high: number, low: number] };
            };
        };

        /**
         * Additional fields for [frog](https://minecraft.wiki/w/frog).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Frog}
         */
        export type Entity_Frog = { type: "compound"; value: {} } & Component_Breedable;

        /**
         * Additional fields for [goat](https://minecraft.wiki/w/goat).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Goat}
         */
        export type Entity_Goat = {
            type: "compound";
            value: {
                /**
                 * Unknown.
                 */
                GoatHornCount: { type: "int"; value: number };
            };
        };

        /**
         * Additional fields for [guardian](https://minecraft.wiki/w/guardian) and [elder guardian](https://minecraft.wiki/w/elder guardian).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_GuardianAndElderGuardian}
         */
        export type Entity_GuardianAndElderGuardian = {
            type: "compound";
            value: {
                /**
                 * 1 or 0 (true/false) - true if it is an elder guardian.
                 */
                Elder: { type: "byte"; value: number };
            };
        };

        /**
         * Additional fields for [hoglin](https://minecraft.wiki/w/hoglin).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Hoglin}
         */
        export type Entity_Hoglin = { type: "compound"; value: {} } & Component_Ageable;

        /**
         * Additional fields for [horse](https://minecraft.wiki/w/horse).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Horse}
         */
        export type Entity_Horse = {
            type: "compound";
            value: {
                /**
                 * Random number that ranges from 0 to 100; increases with feeding or trying to tame it. Higher values make the horse easier to tame.
                 */
                Temper: { type: "int"; value: number };
            };
        };

        /**
         * Additional fields for [husk](https://minecraft.wiki/w/husk).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Husk}
         */
        export type Entity_Husk = { type: "compound"; value: {} } & Component_Timer;

        /**
         * Additional fields for [iron golem](https://minecraft.wiki/w/iron golem).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_IronGolem}
         */
        export type Entity_IronGolem = { type: "compound"; value: {} } & Component_Dweller;

        /**
         * Additional fields for [item entity](https://minecraft.wiki/w/Item (entity)).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_ItemEntity}
         */
        export type Entity_ItemEntity = {
            type: "compound";
            value: {
                /**
                 * The number of ticks the item has been "untouched". After 6000 ticks (5 minutes) the item is destroyed.
                 */
                Age: { type: "short"; value: number };
                /**
                 * The health of the item, which starts at 5. Items take damage from fire, lava, and explosions. The item is destroyed when its health reaches 0.*needs testing*
                 */
                Health: { type: "short"; value: number };
                /**
                 * The item of this stack.
                 */
                Item: { type: "compound"; value: {} } & Item_ItemStack;
                /**
                 * If present, only the player *needs testing* with this Unique ID can pick up the item.
                 */
                OwnerID: { type: "long"; value: [high: number, low: number] };
            };
        };

        /**
         * Additional fields for [llama](https://minecraft.wiki/w/llama).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Llama}
         */
        export type Entity_Llama = {
            type: "compound";
            value: {
                /**
                 * Random number that ranges from 0 to 100; increases with feeding or trying to tame it. Higher values make the llama easier to tame.
                 */
                Temper: { type: "int"; value: number };
            };
        };

        /**
         * Additional fields for [llama spit](https://minecraft.wiki/w/Llama_Spit).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_LlamaSpit}
         */
        export type Entity_LlamaSpit = { type: "compound"; value: {} } & Component_Projectile;

        /**
         * Additional fields for [minecart with chest](https://minecraft.wiki/w/minecart with chest).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_MinecartWithChest}
         */
        export type Entity_MinecartWithChest = { type: "compound"; value: {} } & Component_Inventory;

        /**
         * Additional fields for [minecart with command block](https://minecraft.wiki/w/minecart with command block).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_MinecartWithCommandBlock}
         */
        export type Entity_MinecartWithCommandBlock = {
            type: "compound";
            value: {
                /**
                 * Number of ticks until it executes the command again.
                 */
                CurrentTickCount: { type: "int"; value: number };
                /**
                 * Unknown.
                 */
                Ticking: { type: "byte"; value: number };
            };
        };

        /**
         * Additional fields for [minecart with hopper](https://minecraft.wiki/w/minecart with hopper).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_MinecartWithHopper}
         */
        export type Entity_MinecartWithHopper = { type: "compound"; value: {} } & Component_Inventory;

        /**
         * Additional fields for [minecart with tnt](https://minecraft.wiki/w/minecart with tnt).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_MinecartWithTNT}
         */
        export type Entity_MinecartWithTNT = { type: "compound"; value: {} } & Component_Explode;

        /**
         * Additional fields for [mooshroom](https://minecraft.wiki/w/mooshroom).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Mooshroom}
         */
        export type Entity_Mooshroom = { type: "compound"; value: {} } & Component_Ageable;

        /**
         * Additional fields for [mule](https://minecraft.wiki/w/mule).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Mule}
         */
        export type Entity_Mule = {
            type: "compound";
            value: {
                /**
                 * Random number that ranges from 0 to 100; increases with feeding or trying to tame it. Higher values make the mule easier to tame.
                 */
                Temper: { type: "int"; value: number };
            };
        };

        /**
         * Additional fields for [NPC](https://minecraft.wiki/w/NPC).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_NPC}
         */
        export type Entity_NPC = {
            type: "compound";
            value: {
                /**
                 * (May not exist) The actions.more info
                 */
                Actions?: { type: "string"; value: string };
                /**
                 * (May not exist) The interactive text.more info
                 */
                InterativeText?: { type: "string"; value: string };
                /**
                 * (May not exist) Unknown
                 */
                PlayerSceneMapping?: {
                    type: "list";
                    value: {
                        type: "compound";
                        value: {
                            /**
                             * A player's Unique ID.
                             */
                            PlayerID: { type: "long"; value: [high: number, low: number] };
                            /**
                             * Unknown
                             */
                            SceneName: { type: "string"; value: string };
                        }[];
                    };
                };
                /**
                 * (May not exist) The name.more info
                 */
                RawtextName?: { type: "string"; value: string };
            };
        };

        /**
         * Additional fields for [ocelot](https://minecraft.wiki/w/ocelot).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Ocelot}
         */
        export type Entity_Ocelot = { type: "compound"; value: {} } & Component_Ageable;

        /**
         * Additional fields for [painting](https://minecraft.wiki/w/painting).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Painting}
         */
        export type Entity_Painting = {
            type: "compound";
            value: {
                /**
                 * The direction the painting faces: 0 is south, 1 is west, 2 is north, 3 is east.*needs testing*
                 */
                Dir: { type: "byte"; value: number };
                /**
                 * Unknown.
                 */
                Direction: { type: "byte"; value: number };
                /**
                 * (May not exist) The ID of the painting's artwork.
                 */
                Motif?: { type: "string"; value: string };
            };
        };

        /**
         * Additional fields for [panda](https://minecraft.wiki/w/panda).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Panda}
         */
        export type Entity_Panda = { type: "compound"; value: {} } & Component_Ageable;

        /**
         * Additional fields for [pig](https://minecraft.wiki/w/pig).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Pig}
         */
        export type Entity_Pig = { type: "compound"; value: {} } & Component_Ageable;

        /**
         * Additional fields for [piglin](https://minecraft.wiki/w/piglin).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Piglin}
         */
        export type Entity_Piglin = { type: "compound"; value: {} } & Component_Inventory;

        /**
         * Additional fields for [piglin brute](https://minecraft.wiki/w/piglin brute).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_PiglinBrute}
         */
        export type Entity_PiglinBrute = { type: "compound"; value: {} } & Component_Home;

        /**
         * Additional fields for [pillager](https://minecraft.wiki/w/pillager).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Pillager}
         */
        export type Entity_Pillager = { type: "compound"; value: {} } & Component_Dweller;

        /**
         * Additional fields for [player](https://minecraft.wiki/w/player).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Player}
         */
        export type Entity_Player = {
            type: "compound";
            value: {
                /**
                 * The Unique ID of the player's agent.
                 */
                AgentID: { type: "long"; value: [high: number, low: number] };
                /**
                 * The ID of the dimension the player is in.
                 */
                DimensionId: { type: "int"; value: number };
                /**
                 * The seed used for the next enchantment in [enchantment table](https://minecraft.wiki/w/enchantment table)s.
                 */
                EnchantmentSeed: { type: "int"; value: number };
                /**
                 * Each compound tag in this list is an item in the player's 27-slot ender chest inventory.
                 */
                EnderChestInventory: {
                    type: "list";
                    value: {
                        type: "compound";
                        value: {
                            /**
                             * The slot the item is in.
                             */
                            Slot: { type: "byte"; value: number };
                        }[];
                    };
                };
                /**
                 * Unknown.
                 */
                fogCommandStack: { type: "list"; value: { type: "string"; value: string[] } };
                /**
                 * The format version of this NBT.
                 */
                format_version: { type: "string"; value: string };
                /**
                 * 1 or 0 (true/false) - true if the player has traveled to the [Overworld](https://minecraft.wiki/w/Overworld) via an [End portal](https://minecraft.wiki/w/End portal).
                 */
                HasSeenCredits: { type: "byte"; value: number };
                /**
                 * Each compound tag in this list is an item in the player's inventory.
                 */
                Inventory: {
                    type: "list";
                    value: {
                        type: "compound";
                        value: {
                            /**
                             * The slot the item is in.
                             */
                            Slot: { type: "byte"; value: number };
                        }[];
                    };
                };
                /**
                 * The Unique ID of the entity that is on the player's left shoulder.
                 */
                LeftShoulderRiderID: { type: "long"; value: [high: number, low: number] };
                /**
                 * Unknown.
                 */
                MapIndex: { type: "int"; value: number };
                /**
                 * The game mode of the player.
                 */
                PlayerGameMode: { type: "int"; value: number };
                /**
                 * The level shown on the [XP](https://minecraft.wiki/w/XP) bar.
                 */
                PlayerLevel: { type: "int"; value: number };
                /**
                 * The progress/percent across the XP bar to the next level.
                 */
                PlayerLevelProgress: { type: "float"; value: number };
                /**
                 * Unknown
                 */
                PlayerUIItems: {
                    type: "list";
                    value: {
                        type: "compound";
                        value: {
                            /**
                             * The slot the item is in.
                             */
                            Slot: { type: "byte"; value: number };
                        }[];
                    };
                };
                /**
                 * Contains information about the recipes that the player has unlocked.
                 */
                recipe_unlocking: {
                    type: "compound";
                    value: {
                        /**
                         * A list of all recipes the player has unlocked.
                         */
                        unlocked_recipes: { type: "list"; value: { type: "string"; value: string[] } };
                        /**
                         * Unknown. Defaults to 2.
                         */
                        used_contexts: { type: "int"; value: number };
                    };
                };
                /**
                 * The Unique ID of the entity that the player is riding.
                 */
                RideID: { type: "long"; value: [high: number, low: number] };
                /**
                 * The Unique ID of the entity that is on the player's right shoulder.
                 */
                RightShoulderRiderID: { type: "long"; value: [high: number, low: number] };
                /**
                 * The ID of the selected container.*needs testing*
                 */
                SelectedContainerId: { type: "int"; value: number };
                /**
                 * The selected inventory slot of the player.
                 */
                SelectedInventorySlot: { type: "int"; value: number };
                /**
                 * 1 or 0 (true/false) - true if the player is sleeping.
                 */
                Sleeping: { type: "byte"; value: number };
                /**
                 * The number of ticks the player had been in bed. 0 when the player is not sleeping. In bed, increases up to 100, then stops. Skips the night after all players in bed have reached 100. When getting out of bed, instantly changes to 100 and then increases for another 9 ticks (up to 109) before returning to 0.*needs testing*
                 */
                SleepTimer: { type: "short"; value: number };
                /**
                 * 1 or 0 (true/false) - true if the player is sneaking.
                 */
                Sneaking: { type: "byte"; value: number };
                /**
                 * The X coordinate of the player's spawn block.
                 */
                SpawnBlockPositionX: { type: "int"; value: number };
                /**
                 * The Y coordinate of the player's spawn block.
                 */
                SpawnBlockPositionY: { type: "int"; value: number };
                /**
                 * The Z coordinate of the player's spawn block.
                 */
                SpawnBlockPositionZ: { type: "int"; value: number };
                /**
                 * The dimension of the player's spawn point.
                 */
                SpawnDimension: { type: "int"; value: number };
                /**
                 * The X coordinate of the player's spawn point.
                 */
                SpawnX: { type: "int"; value: number };
                /**
                 * The Y coordinate of the player's spawn point.
                 */
                SpawnY: { type: "int"; value: number };
                /**
                 * The Z coordinate of the player's spawn point.
                 */
                SpawnZ: { type: "int"; value: number };
                /**
                 * The time in ticks since last rest.
                 */
                TimeSinceRest: { type: "int"; value: number };
                /**
                 * The number of ticks since the player was threatened for warden spawning. Increases by 1 every tick. After 12000 ticks (10 minutes) it will be set back to 0, and the `WardenThreatLevel` will be decreased by 1.
                 */
                WardenThreatDecreaseTimer: { type: "int"; value: number };
                /**
                 * A threat level between 0 and 4 (inclusive). The warden will spawn at level 4.
                 */
                WardenThreatLevel: { type: "int"; value: number };
                /**
                 * The number of ticks before the `WardenThreatLevel` can be increased again. Decreases by 1 every tick. It is set 200 ticks (10 seconds) every time the threat level is increased.
                 */
                WardenThreatLevelIncreaseCooldown: { type: "int"; value: number };
            };
        };

        /**
         * Additional fields for [polar bear](https://minecraft.wiki/w/polar bear).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_PolarBear}
         */
        export type Entity_PolarBear = { type: "compound"; value: {} } & Component_Ageable;

        /**
         * Additional fields for [pufferfish](https://minecraft.wiki/w/pufferfish).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Pufferfish}
         */
        export type Entity_Pufferfish = { type: "compound"; value: {} } & Component_Timer;

        /**
         * Additional fields for [rabbit](https://minecraft.wiki/w/rabbit).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Rabbit}
         */
        export type Entity_Rabbit = {
            type: "compound";
            value: {
                /**
                 * Unknown.
                 */
                CarrotsEaten: { type: "int"; value: number };
                /**
                 * Set to 40 when a carrot crop is eaten, decreases by 0–2 every tick until it reaches 0.*needs testing*
                 */
                MoreCarrotTicks: { type: "int"; value: number };
            };
        };

        /**
         * Additional fields for [ravager](https://minecraft.wiki/w/ravager).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Ravager}
         */
        export type Entity_Ravager = { type: "compound"; value: {} } & Component_Dweller;

        /**
         * Additional fields for [sheep](https://minecraft.wiki/w/sheep).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Sheep}
         */
        export type Entity_Sheep = { type: "compound"; value: {} } & Component_Ageable;

        /**
         * Additional fields for [shulker bullet](https://minecraft.wiki/w/shulker bullet).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_ShulkerBullet}
         */
        export type Entity_ShulkerBullet = { type: "compound"; value: {} } & Component_Projectile;

        /**
         * Additional fields for [skeleton](https://minecraft.wiki/w/skeleton).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Skeleton}
         */
        export type Entity_Skeleton = {
            type: "compound";
            value: {
                /**
                 * The item in its hand. Defaults to a bow.
                 */
                ItemInHand: { type: "compound"; value: {} } & Item_ItemStack;
            };
        };

        /**
         * Additional fields for [skeleton horse](https://minecraft.wiki/w/skeleton horse).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_SkeletonHorse}
         */
        export type Entity_SkeletonHorse = { type: "compound"; value: {} } & Component_Ageable;

        /**
         * Additional fields for [slime](https://minecraft.wiki/w/slime).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Slime}
         */
        export type Entity_Slime = {
            type: "compound";
            value: {
                /**
                 * The size of the slime. Note that this value is zero-based, so 0 is the smallest slime, 1 is the next larger, etc.
                 */
                Size: { type: "byte"; value: number };
            };
        };

        /**
         * Additional fields for [sniffer](https://minecraft.wiki/w/sniffer).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Sniffer}
         */
        export type Entity_Sniffer = { type: "compound"; value: {} } & Component_Ageable;

        /**
         * Additional fields for [snowball](https://minecraft.wiki/w/snowball).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Snowball}
         */
        export type Entity_Snowball = { type: "compound"; value: {} } & Component_Projectile;

        /**
         * Additional fields for [strider](https://minecraft.wiki/w/strider).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Strider}
         */
        export type Entity_Strider = { type: "compound"; value: {} } & Component_Ageable;

        /**
         * Additional fields for [tadpole](https://minecraft.wiki/w/tadpole).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Tadpole}
         */
        export type Entity_Tadpole = { type: "compound"; value: {} } & Component_Ageable;

        /**
         * Additional fields for thrown [ender pearl](https://minecraft.wiki/w/ender pearl).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_ThrownEnderPearl}
         */
        export type Entity_ThrownEnderPearl = { type: "compound"; value: {} } & Component_Projectile;

        /**
         * Additional fields for thrown [potion](https://minecraft.wiki/w/potion).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_ThrownPotion}
         */
        export type Entity_ThrownPotion = {
            type: "compound";
            value: {
                /**
                 * The [ID of the potion effect](https://minecraft.wiki/w/Potion#Item data).
                 */
                PotionId: { type: "short"; value: number };
            };
        };

        /**
         * Additional fields for thrown [trident](https://minecraft.wiki/w/trident).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_ThrownTrident}
         */
        export type Entity_ThrownTrident = {
            type: "compound";
            value: {
                /**
                 * The slot id when it is thrown out.This means thrown trident with [Loyalty](https://minecraft.wiki/w/Loyalty) prefers to return to this slot when this slot is empty. Set to -1 when without [Loyalty](https://minecraft.wiki/w/Loyalty) enchantment.
                 */
                favoredSlot: { type: "int"; value: number };
                /**
                 * The item that is given when the entity is picked up.
                 */
                Trident: { type: "compound"; value: {} } & Item_ItemStack;
            };
        };

        /**
         * Additional fields for [tnt](https://minecraft.wiki/w/tnt).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_TNT}
         */
        export type Entity_TNT = { type: "compound"; value: {} } & Component_Explode;

        /**
         * Additional fields for [turtle](https://minecraft.wiki/w/turtle).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Turtle}
         */
        export type Entity_Turtle = {
            type: "compound";
            value: {
                /**
                 * 1 or 0 (true/false) - true if the turtle has eggs.
                 */
                IsPregnant: { type: "byte"; value: number };
            };
        };

        /**
         * Additional fields for [vex](https://minecraft.wiki/w/vex).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Vex}
         */
        export type Entity_Vex = {
            type: "compound";
            value: {
                /**
                 * The item in its hand. Defaults to an iron sword.
                 */
                ItemInHand: { type: "compound"; value: {} } & Item_ItemStack;
            };
        };

        /**
         * Additional fields for [villager](https://minecraft.wiki/w/villager) (v2).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Villager_V2}
         */
        export type Entity_Villager_V2 = {
            type: "compound";
            value: {
                /**
                 * 1 or 0 (true/false) - true if the villager's trade has been resupplied.
                 */
                HasResupplied: { type: "byte"; value: number };
                /**
                 * Unknown.
                 */
                IsInRaid: { type: "byte"; value: number };
                /**
                 * Unknown.
                 */
                ReactToBell: { type: "byte"; value: number };
            };
        };

        /**
         * Additional fields for [vindicator](https://minecraft.wiki/w/vindicator).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Vindicator}
         */
        export type Entity_Vindicator = { type: "compound"; value: {} } & Component_Dweller;

        /**
         * Additional fields for [wandering trader](https://minecraft.wiki/w/wandering trader).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_WanderingTrader}
         */
        export type Entity_WanderingTrader = {
            type: "compound";
            value: {
                entries?: {
                    type: "list";
                    value: {
                        type: "compound";
                        value: {
                            /**
                             * Unknown.
                             */
                            SpawnTimer: { type: "int"; value: number };
                            /**
                             * Unknown.
                             */
                            StopSpawning: { type: "byte"; value: number };
                        }[];
                    };
                };
            };
        };

        /**
         * Additional fields for [warden](https://minecraft.wiki/w/warden).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Warden}
         */
        export type Entity_Warden = {
            type: "compound";
            value: {
                /**
                 * List of nuisances that have angered the warden.
                 */
                Nuisances: {
                    type: "list";
                    value: {
                        type: "compound";
                        value: {
                            /**
                             * The Unique ID of the entity that is associated with the anger.
                             */
                            ActorId: { type: "long"; value: [high: number, low: number] };
                            /**
                             * The level of anger. It has a maximum value of 150 and decreases by 1 every second.
                             */
                            Anger: { type: "int"; value: number };
                            /**
                             * 1 or 0 (true/false) - true if the nuisance is priority.
                             */
                            Priority: { type: "byte"; value: number };
                        }[];
                    };
                };
                /**
                 * The vibration event listener of the warden.
                 */
                VibrationListener: {
                    type: "compound";
                    value: {
                        /**
                         * Unknown.
                         */
                        event: { type: "int"; value: number };
                        /**
                         * Unknown.
                         */
                        pending: {
                            type: "compound";
                            value: {
                                /**
                                 * Unknown.
                                 */
                                distance: { type: "float"; value: number };
                                /**
                                 * Unknown.
                                 */
                                source: { type: "long"; value: [high: number, low: number] };
                                /**
                                 * Unknown.
                                 */
                                vibration: { type: "int"; value: number };
                                /**
                                 * Unknown.
                                 */
                                x: { type: "int"; value: number };
                                /**
                                 * Unknown.
                                 */
                                y: { type: "int"; value: number };
                                /**
                                 * Unknown.
                                 */
                                z: { type: "int"; value: number };
                            };
                        };
                        /**
                         * Unknown.
                         */
                        selector: { type: "compound"; value: {} };
                        /**
                         * Unknown.
                         */
                        ticks: { type: "int"; value: number };
                    };
                };
            };
        };

        /**
         * Additional fields for [wind charge projectile](https://minecraft.wiki/w/wind charge projectile).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_WindChargeProjectile}
         */
        export type Entity_WindChargeProjectile = { type: "compound"; value: {} } & Component_Projectile;

        /**
         * Additional fields for [witch](https://minecraft.wiki/w/witch).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Witch}
         */
        export type Entity_Witch = { type: "compound"; value: {} } & Component_Dweller;

        /**
         * Additional fields for [wither](https://minecraft.wiki/w/wither).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Wither}
         */
        export type Entity_Wither = {
            type: "compound";
            value: {
                /**
                 * Whether the wither exhibits first or second phase behavior, as well as whether the shield effect is visible - 1 for first phase and shield invisible, 0 for second phase and shield visible.
                 */
                AirAttack: { type: "byte"; value: number };
                /**
                 * The number of ticks remaining before the wither explodes during its death animation.
                 */
                dyingFrames: { type: "int"; value: number };
                /**
                 * The delay in ticks between wither skull shots. Does not affect the delay between volleys.
                 */
                firerate: { type: "int"; value: number };
                /**
                 * The remaining number of ticks the wither will be invulnerable for. Updated to match SpawningFrames or dyingFrames every tick during spawn/death animation, otherwise remains static.
                 */
                Invul: { type: "int"; value: number };
                /**
                 * The greatest multiple of 75 that is fewer than the wither's lowest health. Does not increase if the wither is healed.
                 */
                lastHealthInterval: { type: "int"; value: number };
                /**
                 * Unknown.
                 */
                maxHealth: { type: "int"; value: number };
                /**
                 * The swellAmount in the previous tick.
                 */
                oldSwellAmount: { type: "float"; value: number };
                /**
                 * The alpha/brightness of the wither texture overlay during its death animation. Has no effect outside the death animation.
                 */
                overlayAlpha: { type: "float"; value: number };
                /**
                 * Which phase the wither is in. Has no effect on wither behavior or shield visibility. Has a value of 1 during spawning and first phase and 0 during second phase and death.
                 */
                Phase: { type: "int"; value: number };
                /**
                 * Unknown.
                 */
                ShieldHealth: { type: "int"; value: number };
                /**
                 * The number of ticks remaining before the wither finishes its spawning animation and becomes vulnerable.
                 */
                SpawningFrames: { type: "int"; value: number };
                /**
                 * How much the wither has swelled during its death animation. Has no effect outside the death animation.
                 */
                swellAmount: { type: "float"; value: number };
            };
        };

        /**
         * Additional fields for [wither skull](https://minecraft.wiki/w/Wither).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_WitherSkull}
         */
        export type Entity_WitherSkull = { type: "compound"; value: {} } & Component_Explode;

        /**
         * Additional fields for [wolf](https://minecraft.wiki/w/wolf).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Wolf}
         */
        export type Entity_Wolf = {
            type: "compound";
            value: {
                /**
                 * The wolf `properties`.
                 */
                properties: {
                    type: "compound";
                    value: {
                        /**
                         * 1 or 0 (true/false) - true if the wolf has [wolf armor](https://minecraft.wiki/w/wolf armor).
                         */
                        "minecraft:has_armor": { type: "byte"; value: number };
                        /**
                         * 1 or 0 (true/false) - true if the wolf's maximum health is 40.
                         */
                        "minecraft:has_increased_max_health": { type: "byte"; value: number };
                        /**
                         * 1 or 0 (true/false) - true if the wolf can be equipped with [wolf armor](https://minecraft.wiki/w/wolf armor).
                         */
                        "minecraft:is_armorable": { type: "byte"; value: number };
                    };
                };
            };
        };

        /**
         * Additional fields for [zombie](https://minecraft.wiki/w/zombie).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_Zombie}
         */
        export type Entity_Zombie = { type: "compound"; value: {} } & Component_Timer;

        /**
         * Additional fields for [zombie horse](https://minecraft.wiki/w/zombie horse).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_ZombieHorse}
         */
        export type Entity_ZombieHorse = { type: "compound"; value: {} } & Component_Ageable;

        /**
         * Additional fields for [zombie villager](https://minecraft.wiki/w/zombie villager).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_ZombieVillager}
         */
        export type Entity_ZombieVillager = {
            type: "compound";
            value: {
                /**
                 * 1 or 0 (true/false) - true if spawned from village.
                 */
                SpawnedFromVillage: { type: "byte"; value: number };
            };
        };

        /**
         * Additional fields for [zombified piglin](https://minecraft.wiki/w/zombified piglin).
         *
         * @see {@link NBTSchemas.nbtSchemas.Entity_ZombifiedPiglin}
         */
        export type Entity_ZombifiedPiglin = {
            type: "compound";
            value: {
                /**
                 * Unknown.
                 */
                Anger: { type: "short"; value: number };
            };
        };

        /**
         * Additional fields for [banner](https://minecraft.wiki/w/banner).
         *
         * @see {@link NBTSchemas.nbtSchemas.Block_Banner}
         */
        export type Block_Banner = {
            type: "compound";
            value: {
                /**
                 * The base color of the banner. See [Banner#Block_data](https://minecraft.wiki/w/Banner#Block_data).
                 */
                Base: { type: "int"; value: number };
                /**
                 * (May not exist) List of all patterns applied to the banner.
                 */
                Patterns?: {
                    type: "list";
                    value: {
                        type: "compound";
                        value: {
                            /**
                             * The base color of the pattern. See [Banner#Block_data](https://minecraft.wiki/w/Banner#Block_data).
                             */
                            Color: { type: "int"; value: number };
                            /**
                             * The pattern ID code. See [Banner#Block_data](https://minecraft.wiki/w/Banner#Block_data).
                             */
                            Pattern: { type: "string"; value: string };
                        }[];
                    };
                };
                /**
                 * The type of the block entity. 0 is normal banner. 1 is ominous banner.
                 */
                Type: { type: "int"; value: number };
            };
        };

        /**
         * Additional fields for [beacon](https://minecraft.wiki/w/beacon).
         *
         * @see {@link NBTSchemas.nbtSchemas.Block_Beacon}
         */
        export type Block_Beacon = {
            type: "compound";
            value: {
                /**
                 * The primary effect selected, see [Potion effects](https://minecraft.wiki/w/Status_effect) for IDs. Set to 0 when no effect is selected.
                 */
                primary: { type: "int"; value: number };
                /**
                 * The secondary effect selected, see [Potion effects](https://minecraft.wiki/w/Status_effect) for IDs. Set to 0 when no effect is selected. When set without a primary effect, does nothing. When set to the same as the primary, the effect is given at level 2 (the normally available behavior for 5 effects). When set to a different value than the primary (normally only Regeneration), gives the effect at level 1.*needs testing*
                 */
                secondary: { type: "int"; value: number };
            };
        };

        /**
         * Additional fields for [bed](https://minecraft.wiki/w/bed).
         *
         * @see {@link NBTSchemas.nbtSchemas.Block_Bed}
         */
        export type Block_Bed = {
            type: "compound";
            value: {
                /**
                 * The data value that determines the color of the half-bed block. When a bed is broken, the color of the block entity at the bed's head becomes the color of the bed item when it drops. See [Bed#Metadata](https://minecraft.wiki/w/Bed#Metadata).
                 */
                color: { type: "byte"; value: number };
            };
        };

        /**
         * Additional fields for [beehive](https://minecraft.wiki/w/beehive) and bee nest.
         *
         * @see {@link NBTSchemas.nbtSchemas.Block_BeehiveAndBeeNest}
         */
        export type Block_BeehiveAndBeeNest = {
            type: "compound";
            value: {
                /**
                 * (May not exist) Entities currently in the hive.
                 */
                Occupants?: {
                    type: "list";
                    value: {
                        type: "compound";
                        value: {
                            /**
                             * The entity in the hive. Always `minecraft:bee<>` in vanilla game. more info
                             */
                            ActorIdentifier: { type: "string"; value: string };
                            /**
                             * The NBT data of the entity in the hive.
                             */
                            SaveData: { type: "compound"; value: {} } & ActorPrefix;
                            /**
                             * The time in ticks until the entity leave the beehive.
                             */
                            TicksLeftToStay: { type: "int"; value: number };
                        }[];
                    };
                };
                /**
                 * 1 or 0 (true/false) - true if new bees will be spawned.
                 */
                ShouldSpawnBees: { type: "byte"; value: number };
            };
        };

        /**
         * Additional fields for [bell](https://minecraft.wiki/w/bell).
         *
         * @see {@link NBTSchemas.nbtSchemas.Block_Bell}
         */
        export type Block_Bell = {
            type: "compound";
            value: {
                /**
                 * The direction data of this bell.more info
                 */
                Direction: { type: "int"; value: number };
                /**
                 * 1 or 0 (true/false) - true if it is ringing.
                 */
                Ringing: { type: "byte"; value: number };
                /**
                 * Unknown.more info
                 */
                Ticks: { type: "int"; value: number };
            };
        };

        /**
         * Additional fields for [brewing stand](https://minecraft.wiki/w/brewing stand).
         *
         * @see {@link NBTSchemas.nbtSchemas.Block_BrewingStand}
         */
        export type Block_BrewingStand = {
            type: "compound";
            value: {
                /**
                 * The number of ticks until the potions are finished.
                 */
                CookTime: { type: "short"; value: number };
                /**
                 * Remaining fuel for the brewing stand.
                 */
                FuelAmount: { type: "short"; value: number };
                /**
                 * The max fuel numder for the fuel bar.
                 */
                FuelTotal: { type: "short"; value: number };
                /**
                 * List of items in brewing stand.
                 */
                Items: {
                    type: "list";
                    value: {
                        type: "compound";
                        value: {
                            /**
                             * The slot the item is in.
                             */
                            Slot: { type: "byte"; value: number };
                        }[];
                    };
                };
            };
        };

        /**
         * Additional fields for [campfire](https://minecraft.wiki/w/campfire) and [soul campfire](https://minecraft.wiki/w/soul campfire).
         *
         * @see {@link NBTSchemas.nbtSchemas.Block_CampfireAndSoulCampfire}
         */
        export type Block_CampfireAndSoulCampfire = {
            type: "compound";
            value: {
                [key: `Item${bigint}`]: { type: "compound"; value: {} } & Item_ItemStack;
                [key: `ItemTime${bigint}`]: { type: "int"; value: number };
            };
        };

        /**
         * Additional fields for [cauldron](https://minecraft.wiki/w/cauldron).
         *
         * @see {@link NBTSchemas.nbtSchemas.Block_Cauldron}
         */
        export type Block_Cauldron = {
            type: "compound";
            value: {
                /**
                 * (May not exist) This tag exists only if the cauldron stores dyed water; stores a 32-bit ARGB encoded color.
                 */
                CustomColor?: { type: "int"; value: number };
                /**
                 * List of items in this container.
                 */
                Items: {
                    type: "list";
                    value: {
                        type: "compound";
                        value: {
                            /**
                             * The inventory slot the item is in.
                             */
                            Slot: { type: "byte"; value: number };
                        }[];
                    };
                };
                /**
                 * If the cauldron contains a potion, this tag stores the ID of that potion. If there is no potion stored, then this tag is set to -1.
                 */
                PotionId: { type: "short"; value: number };
                /**
                 * If the cauldron contains a potion, this tag stores the type of that potion. 0 is normal, 1 is splash, 2 is lingering. If there is no potion stored, then this tag is set to -1.
                 */
                PotionType: { type: "short"; value: number };
            };
        };

        /**
         * Additional fields for [chalkboard](https://minecraft.wiki/w/chalkboard).
         *
         * @see {@link NBTSchemas.nbtSchemas.Block_Chalkboard}
         */
        export type Block_Chalkboard = {
            type: "compound";
            value: {
                /**
                 * The X position of its base.
                 */
                BaseX: { type: "int"; value: number };
                /**
                 * The Y position of its base.
                 */
                BaseY: { type: "int"; value: number };
                /**
                 * The Z position of its base.
                 */
                BaseZ: { type: "int"; value: number };
                /**
                 * 1 or 0 (true/false) - true if it is on locked.
                 */
                Locked: { type: "byte"; value: number };
                /**
                 * 1 or 0 (true/false) - true if it is on ground.
                 */
                OnGround: { type: "byte"; value: number };
                /**
                 * The Unique ID of its owner.
                 */
                Owner: { type: "long"; value: [high: number, low: number] };
                /**
                 * The size of this chalkboard.
                 */
                Size: { type: "int"; value: number };
                /**
                 * The text on the chalkboard.
                 */
                Text: { type: "string"; value: string };
            };
        };

        /**
         * Additional fields for chemistry tables ([compound creator](https://minecraft.wiki/w/compound creator), [element constructor](https://minecraft.wiki/w/element constructor), [lab table](https://minecraft.wiki/w/lab table), [material reducer](https://minecraft.wiki/w/material reducer)).
         *
         * @see {@link NBTSchemas.nbtSchemas.Block_ChemistryTables}
         */
        export type Block_ChemistryTables = {
            type: "compound";
            value: {
                /**
                 * (Only for Lab Table) Unknown.
                 */
                itemAux: { type: "short"; value: number };
                /**
                 * (Only for Lab Table) Unknown.
                 */
                itemId: { type: "int"; value: number };
                /**
                 * (Only for Lab Table) Unknown.
                 */
                itemStack: { type: "byte"; value: number };
            };
        };

        /**
         * Additional fields for [chest](https://minecraft.wiki/w/chest), [trapped chest](https://minecraft.wiki/w/trapped chest), [barrel](https://minecraft.wiki/w/barrel), and [ender chest](https://minecraft.wiki/w/ender chest).
         *
         * @see {@link NBTSchemas.nbtSchemas.Block_Chests}
         */
        export type Block_Chests = {
            type: "compound";
            value: {
                /**
                 * Unknown.
                 */
                Findable: { type: "byte"; value: number };
                /**
                 * 1 or 0 (true/false) - (may not exist) true if this chest is unpair with chest next to it.
                 */
                forceunpair: { type: "byte"; value: number };
                /**
                 * List of items in this container.
                 */
                Items: {
                    type: "list";
                    value: {
                        type: "compound";
                        value: {
                            /**
                             * The inventory slot the item is in.
                             */
                            Slot: { type: "byte"; value: number };
                        }[];
                    };
                };
                /**
                 * (May not exist) Loot table to be used to fill the chest when it is next opened, or the items are otherwise interacted with.
                 */
                LootTable?: { type: "string"; value: string };
                /**
                 * (May not exist) Seed for generating the loot table. 0 or omitted use a random seed.
                 */
                LootTableSeed?: { type: "int"; value: number };
                /**
                 * (May not exist) Unknown.
                 */
                pairlead?: { type: "byte"; value: number };
                /**
                 * (May not exist) The X position of the chest paired with.
                 */
                pairx?: { type: "int"; value: number };
                /**
                 * (May not exist) The Z position of the chest paired with.
                 */
                pairz?: { type: "int"; value: number };
            };
        };

        /**
         * Additional fields for [chiseled bookshelf](https://minecraft.wiki/w/chiseled bookshelf).
         *
         * @see {@link NBTSchemas.nbtSchemas.Block_ChiseledBookshelf}
         */
        export type Block_ChiseledBookshelf = {
            type: "compound";
            value: {
                /**
                 * List of books in the bookshelf.
                 */
                Items: { type: "list"; value: { type: "compound"; value: {} & Item_ItemStack[] } };
                /**
                 * Last interacted slot (1-6), or 0 if no slot has been interacted with yet.
                 */
                LastInteractedSlot: { type: "int"; value: number };
            };
        };

        /**
         * Additional fields for [command block](https://minecraft.wiki/w/command block).
         *
         * @see {@link NBTSchemas.nbtSchemas.Block_CommandBlock}
         */
        export type Block_CommandBlock = {
            type: "compound";
            value: {
                /**
                 * 1 or 0 (true/false) - Allows to activate the command without the requirement of a redstone signal.
                 */
                auto: { type: "byte"; value: number };
                /**
                 * (May not exist) Unknown.
                 */
                conditionalMode?: { type: "byte"; value: number };
                /**
                 * 1 or 0 (true/false) - if a conditional command block had its condition met when last activated. True if not a conditional command block.
                 */
                conditionMet: { type: "byte"; value: number };
                /**
                 * Unknown.
                 */
                LPCondionalMode: { type: "byte"; value: number };
                /**
                 * Unknown.
                 */
                LPRedstoneMode: { type: "byte"; value: number };
                /**
                 * Unknown.
                 */
                LPCommandMode: { type: "byte"; value: number };
                /**
                 * 1 or 0 (true/false) - true if the command block is powered by redstone.
                 */
                powered: { type: "byte"; value: number };
            };
        };

        /**
         * Additional fields for [comparator](https://minecraft.wiki/w/comparator).
         *
         * @see {@link NBTSchemas.nbtSchemas.Block_Comparator}
         */
        export type Block_Comparator = {
            type: "compound";
            value: {
                /**
                 * Represents the strength of the analog signal output of this redstone comparator.
                 */
                OutputSignal: { type: "int"; value: number };
            };
        };

        /**
         * Additional fields for [conduit](https://minecraft.wiki/w/conduit).
         *
         * @see {@link NBTSchemas.nbtSchemas.Block_Conduit}
         */
        export type Block_Conduit = {
            type: "compound";
            value: {
                /**
                 * 1 or 0 (true/false) - true if it is active.
                 */
                Active: { type: "byte"; value: number };
                /**
                 * The Unique ID of the hostile mob the conduit is currently attacking. If there's no target, defaults to -1.
                 */
                Target: { type: "long"; value: [high: number, low: number] };
            };
        };

        /**
         * Additional fields for [crafter](https://minecraft.wiki/w/crafter).
         *
         * @see {@link NBTSchemas.nbtSchemas.Block_Crafter}
         */
        export type Block_Crafter = {
            type: "compound";
            value: {
                /**
                 * Indexes of slots that are disabled.
                 */
                disabled_slots: { type: "short"; value: number };
                /**
                 * List of items in the crafter.
                 */
                Items: {
                    type: "list";
                    value: {
                        type: "compound";
                        value: {
                            /**
                             * The inventory slot the item is in.
                             */
                            Slot: { type: "byte"; value: number };
                        }[];
                    };
                };
            };
        };

        /**
         * Additional fields for [decorated pot](https://minecraft.wiki/w/decorated pot).
         *
         * @see {@link NBTSchemas.nbtSchemas.Block_DecoratedPot}
         */
        export type Block_DecoratedPot = {
            type: "compound";
            value: {
                /**
                 * The item in the decorated pot.
                 */
                item: { type: "compound"; value: {} } & Item_ItemStack;
                /**
                 * List of sherds on this decorated pot.
                 */
                sherds: { type: "list"; value: { type: "string"; value: string[] } };
            };
        };

        /**
         * Additional fields for [dispenser](https://minecraft.wiki/w/dispenser) and [dropper](https://minecraft.wiki/w/dropper).
         *
         * @see {@link NBTSchemas.nbtSchemas.Block_DispenserAndDropper}
         */
        export type Block_DispenserAndDropper = {
            type: "compound";
            value: {
                /**
                 * List of items in this container.
                 */
                Items: {
                    type: "list";
                    value: {
                        type: "compound";
                        value: {
                            /**
                             * The inventory slot the item is in.
                             */
                            Slot: { type: "byte"; value: number };
                        }[];
                    };
                };
                /**
                 * (May not exist) Loot table to be used to fill the chest when it is next opened, or the items are otherwise interacted with.
                 */
                LootTable?: { type: "string"; value: string };
                /**
                 * (May not exist) Seed for generating the loot table. 0 or omitted use a random seed.
                 */
                LootTableSeed?: { type: "int"; value: number };
            };
        };

        /**
         * Additional fields for [Enchantment table](https://minecraft.wiki/w/Enchantment table).
         *
         * @see {@link NBTSchemas.nbtSchemas.Block_EnchantmentTable}
         */
        export type Block_EnchantmentTable = {
            type: "compound";
            value: {
                /**
                 * (May not exist) The name of this enchantment table.
                 */
                CustomName?: { type: "string"; value: string };
                /**
                 * The clockwise rotation of the book in radians. Top of the book points West when 0.
                 */
                rott: { type: "float"; value: number };
            };
        };

        /**
         * Additional fields for [end gateway](https://minecraft.wiki/w/end gateway).
         *
         * @see {@link NBTSchemas.nbtSchemas.Block_EndGateway}
         */
        export type Block_EndGateway = {
            type: "compound";
            value: {
                /**
                 * Age of the portal, in ticks. This is used to determine when the beam is rendered.
                 */
                Age: { type: "int"; value: number };
                /**
                 * Location entities are teleported to when entering the portal.
                 */
                ExitPortal: { type: "list"; value: { type: "int"; value: [number, number, number] } };
            };
        };

        /**
         * Additional fields for [flower pot](https://minecraft.wiki/w/flower pot).
         *
         * @see {@link NBTSchemas.nbtSchemas.Block_FlowerPot}
         */
        export type Block_FlowerPot = {
            type: "compound";
            value: {
                /**
                 * (May not exist) The block in the pot.
                 */
                PlantBlock?: { type: "compound"; value: {} } & Block;
            };
        };

        /**
         * Additional fields for [furnace](https://minecraft.wiki/w/furnace), [smoker](https://minecraft.wiki/w/smoker), and [blast furnace](https://minecraft.wiki/w/blast furnace).
         *
         * @see {@link NBTSchemas.nbtSchemas.Block_Furnace}
         */
        export type Block_Furnace = {
            type: "compound";
            value: {
                /**
                 * The total time that in ticks that the currently used fuel can burn.
                 */
                BurnDuration: { type: "short"; value: number };
                /**
                 * Number of ticks left before the current fuel runs out.
                 */
                BurnTime: { type: "short"; value: number };
                /**
                 * Number of ticks the item has been smelting for. The item finishes smelting when this value reaches 200 (10 seconds). Is reset to 0 if BurnTime reaches 0.*needs testing*
                 */
                CookTime: { type: "short"; value: number };
                /**
                 * List of items in this container.
                 */
                Items: {
                    type: "list";
                    value: {
                        type: "compound";
                        value: {
                            /**
                             * The inventory slot the item is in.
                             */
                            Slot: { type: "byte"; value: number };
                        }[];
                    };
                };
                /**
                 * The number of experiences it stores.
                 */
                StoredXPInt: { type: "int"; value: number };
            };
        };

        /**
         * Additional fields for [hopper](https://minecraft.wiki/w/hopper).
         *
         * @see {@link NBTSchemas.nbtSchemas.Block_Hopper}
         */
        export type Block_Hopper = {
            type: "compound";
            value: {
                /**
                 * List of items in this container.
                 */
                Items: {
                    type: "list";
                    value: {
                        type: "compound";
                        value: {
                            /**
                             * The inventory slot the item is in.
                             */
                            Slot: { type: "byte"; value: number };
                        }[];
                    };
                };
                /**
                 * Time until the next transfer in game ticks, naturally between 1 and 8 or 0 if there is no transfer.
                 */
                TransferCooldown: { type: "int"; value: number };
            };
        };

        /**
         * Additional fields for [item frame](https://minecraft.wiki/w/item frame).
         *
         * @see {@link NBTSchemas.nbtSchemas.Block_ItemFrame}
         */
        export type Block_ItemFrame = {
            type: "compound";
            value: {
                /**
                 * The items in this item frame.
                 */
                Item: { type: "compound"; value: {} } & Item_ItemStack;
                /**
                 * (May not exist) The chance of item dropping when the item frame is broken.
                 */
                ItemDropChance?: { type: "float"; value: number };
                /**
                 * (May not exist) The rotation of the item in the item frame.
                 */
                ItemRotation?: { type: "float"; value: number };
            };
        };

        /**
         * Additional fields for [jigsaw](https://minecraft.wiki/w/jigsaw).
         *
         * @see {@link NBTSchemas.nbtSchemas.Block_Jigsaw}
         */
        export type Block_Jigsaw = {
            type: "compound";
            value: {
                /**
                 * The block that this jigsaw block becomes.
                 */
                final_state: { type: "string"; value: string };
                /**
                 * The joint option value, either "rollable" or "aligned".
                 */
                joint: { type: "string"; value: string };
                /**
                 * The jigsaw block's name. This jigsaw block will be aligned with another structure's jigsaw block which has this value in the target tag.
                 */
                name: { type: "string"; value: string };
                /**
                 * The jigsaw block's target name. This jigsaw block will be aligned with another structure's jigsaw block which has this value in the name tag.
                 */
                target: { type: "string"; value: string };
                /**
                 * The jigsaw block's target pool to select a structure from.
                 */
                target_pool: { type: "string"; value: string };
            };
        };

        /**
         * Additional fields for [jukebox](https://minecraft.wiki/w/jukebox).
         *
         * @see {@link NBTSchemas.nbtSchemas.Block_Jukebox}
         */
        export type Block_Jukebox = {
            type: "compound";
            value: {
                /**
                 * (May not exist) The record item in it.
                 */
                RecordItem?: { type: "compound"; value: {} } & Item_ItemStack;
            };
        };

        /**
         * Additional fields for [lectern](https://minecraft.wiki/w/lectern).
         *
         * @see {@link NBTSchemas.nbtSchemas.Block_Lectern}
         */
        export type Block_Lectern = {
            type: "compound";
            value: {
                /**
                 * (May not exist) The book item currently on the lectern.
                 */
                book?: { type: "compound"; value: {} } & Item_ItemStack;
                /**
                 * 1 or 0 (true/false) - (may not exist) true if it has a book.
                 */
                hasBook: { type: "byte"; value: number };
                /**
                 * (May not exist) The page the book is currently on, starting from 0.
                 */
                page?: { type: "int"; value: number };
                /**
                 * (May not exist) The total pages the book has.
                 */
                totalPages?: { type: "int"; value: number };
            };
        };

        /**
         * Additional fields for [lodestone](https://minecraft.wiki/w/lodestone).
         *
         * @see {@link NBTSchemas.nbtSchemas.Block_Lodestone}
         */
        export type Block_Lodestone = {
            type: "compound";
            value: {
                /**
                 * (May not exist) The id of lodestone.
                 */
                trackingHandle?: { type: "int"; value: number };
            };
        };

        /**
         * Additional fields for [monster spawner](https://minecraft.wiki/w/monster spawner).
         *
         * @see {@link NBTSchemas.nbtSchemas.Block_MonsterSpawner}
         */
        export type Block_MonsterSpawner = { type: "compound"; value: {} } & MonsterSpawner;

        /**
         * Additional fields for [moving block](https://minecraft.wiki/w/moving block).
         *
         * @see {@link NBTSchemas.nbtSchemas.Block_MovingBlock}
         */
        export type Block_MovingBlock = {
            type: "compound";
            value: {
                /**
                 * The main layer of moving block represented by this block entity.
                 */
                movingBlock: { type: "compound"; value: {} } & Block;
                /**
                 * The [extra moving block layer](https://minecraft.wiki/w/Waterlogging) represented by this block entity.
                 */
                movingBlockExtra: { type: "compound"; value: {} } & Block;
                /**
                 * (May not exist) The block entity stored in this moving block.
                 */
                movingEntity?: { type: "compound"; value: {} } & BlockEntity;
                /**
                 * X coordinate of the piston base.
                 */
                pistonPosX: { type: "int"; value: number };
                /**
                 * Y coordinate of the piston base.
                 */
                pistonPosY: { type: "int"; value: number };
                /**
                 * Z coordinate of the piston base.
                 */
                pistonPosZ: { type: "int"; value: number };
            };
        };

        /**
         * Additional fields for [note block](https://minecraft.wiki/w/note block).
         *
         * @see {@link NBTSchemas.nbtSchemas.Block_NoteBlock}
         */
        export type Block_NoteBlock = {
            type: "compound";
            value: {
                /**
                 * The pitch of the note block.
                 */
                note: { type: "byte"; value: number };
            };
        };

        /**
         * Additional fields for [nether reactor](https://minecraft.wiki/w/nether reactor).
         *
         * @see {@link NBTSchemas.nbtSchemas.Block_NetherReactor}
         */
        export type Block_NetherReactor = {
            type: "compound";
            value: {
                /**
                 * 1 or 0 (true/false) - true if the reactor has completed its activation phase, and has gone dark.
                 */
                HasFinished: { type: "byte"; value: number };
                /**
                 * 1 or 0 (true/false) - true if the reactor has been activated, and has turned red.
                 */
                IsInitialized: { type: "byte"; value: number };
                /**
                 * Number of ticks the reactor has been active for. It finishes after 900 game ticks (45 seconds).
                 */
                Progress: { type: "short"; value: number };
            };
        };

        /**
         * Additional fields for [piston](https://minecraft.wiki/w/piston).
         *
         * @see {@link NBTSchemas.nbtSchemas.Block_Piston}
         */
        export type Block_Piston = {
            type: "compound";
            value: {
                /**
                 * The list of positions of blocks it should move.
                 */
                AttachedBlocks: { type: "list"; value: { type: "int"; value: [number, number, number, number, number, number, number] } };
                /**
                 * The list of positions of blocks it should break.
                 */
                BreakBlocks: { type: "list"; value: { type: "int"; value: [number, number, number, number, number, number, number] } };
                /**
                 * Progress in last tick.
                 */
                LastProgress: { type: "float"; value: number };
                /**
                 * Next state. Can be 0 (unextended), 1 (pushing), 2 (extended), or 3 (pulling).
                 */
                NewState: { type: "byte"; value: number };
                /**
                 * How far the block has been moved. Can be 0.0, 0.5, and 1.0.
                 */
                Progress: { type: "float"; value: number };
                /**
                 * Current state.
                 */
                State: { type: "byte"; value: number };
                /**
                 * 1 or 0 (true/false) - true if this piston is sticky.
                 */
                Sticky: { type: "byte"; value: number };
            };
        };

        /**
         * Additional fields for [sculk catalyst](https://minecraft.wiki/w/sculk catalyst).
         *
         * @see {@link NBTSchemas.nbtSchemas.Block_SculkCatalyst}
         */
        export type Block_SculkCatalyst = {
            type: "compound";
            value: {
                /**
                 * List of charges associated with the sculk catalyst.
                 */
                cursors: {
                    type: "list";
                    value: {
                        type: "compound";
                        value: {
                            /**
                             * How much power is in the charge.
                             */
                            charge: { type: "short"; value: number };
                            /**
                             * Be 1 if the charge was spread from a sculk or sculk vein, 0 otherwise. The charge can spread to any block if this tag is 1. If it is 0, all the powers in the charge disappear when it spreads to a block not in sculk family.*needs testing*
                             */
                            decay: { type: "short"; value: number };
                            /**
                             * UNDOCUMENTED.
                             */
                            facing: { type: "short"; value: number };
                            /**
                             * Delay in ticks until the charge begins to travel after being created.*needs testing*
                             */
                            update: { type: "short"; value: number };
                            /**
                             * X coordinate of the charge.
                             */
                            x: { type: "int"; value: number };
                            /**
                             * Y coordinate of the charge.
                             */
                            y: { type: "int"; value: number };
                            /**
                             * Z coordinate of the charge.
                             */
                            z: { type: "int"; value: number };
                        }[];
                    };
                };
            };
        };

        /**
         * Additional fields for [sculk shrieker](https://minecraft.wiki/w/sculk shrieker), [sculk sensor](https://minecraft.wiki/w/sculk sensor), and [calibrated sculk sensor](https://minecraft.wiki/w/calibrated sculk sensor).
         *
         * @see {@link NBTSchemas.nbtSchemas.Block_SculkShrieker_SculkSensor_AndCalibratedSculkSensor}
         */
        export type Block_SculkShrieker_SculkSensor_AndCalibratedSculkSensor = {
            type: "compound";
            value: {
                /**
                 * The vibration event listener of the sculk shrieker, sculk sensor, and calibrated sculk sensor.
                 */
                VibrationListener: {
                    type: "compound";
                    value: {
                        /**
                         * Unknown.
                         */
                        event: { type: "int"; value: number };
                        /**
                         * Unknown.
                         */
                        pending: {
                            type: "compound";
                            value: {
                                /**
                                 * Unknown.
                                 */
                                distance: { type: "float"; value: number };
                                /**
                                 * Unknown.
                                 */
                                source: { type: "long"; value: [high: number, low: number] };
                                /**
                                 * Unknown.
                                 */
                                vibration: { type: "int"; value: number };
                                /**
                                 * Unknown.
                                 */
                                x: { type: "int"; value: number };
                                /**
                                 * Unknown.
                                 */
                                y: { type: "int"; value: number };
                                /**
                                 * Unknown.
                                 */
                                z: { type: "int"; value: number };
                            };
                        };
                        /**
                         * Unknown.
                         */
                        selector: { type: "compound"; value: {} };
                        /**
                         * Unknown.
                         */
                        ticks: { type: "int"; value: number };
                    };
                };
            };
        };

        /**
         * Additional fields for [shulker box](https://minecraft.wiki/w/shulker box).
         *
         * @see {@link NBTSchemas.nbtSchemas.Block_ShulkerBox}
         */
        export type Block_ShulkerBox = {
            type: "compound";
            value: {
                /**
                 * The facing of this shulker box.more info
                 */
                facing: { type: "float"; value: number };
            };
        };

        /**
         * Additional fields for [sign](https://minecraft.wiki/w/sign) and hanging sign.
         *
         * @see {@link NBTSchemas.nbtSchemas.Block_SignAndHangingSign}
         */
        export type Block_SignAndHangingSign = {
            type: "compound";
            value: {
                /**
                 * A compound which discribes back text. The same structure as FrontText.
                 */
                BackText: { type: "compound"; value: {} };
                /**
                 * A compound which discribes front text.
                 */
                FrontText: {
                    type: "compound";
                    value: {
                        /**
                         * 1 or 0 (true/false) - true if the outer glow of a sign with glowing text does not show.
                         */
                        HideGlowOutline: { type: "byte"; value: number };
                        /**
                         * 1 or 0 (true/false) - true if the sign has been dyed with a [glow ink sac](https://minecraft.wiki/w/glow ink sac).
                         */
                        IgnoreLighting: { type: "byte"; value: number };
                        /**
                         * Unknown. Defaults to 1.
                         */
                        PersistFormatting: { type: "byte"; value: number };
                        /**
                         * The color that has been used to dye the sign. Is a 32-bit encoded color, defaults to `-16777216` (black). One of `-986896` for "White", `-425955` for "Orange", `-3715395` for "Magenta", `-12930086` for "Light Blue", `-75715` for "Yellow", `-8337633` for "Lime", `-816214` for "Pink", `-12103854` for "Gray", `-6447721` for "Light Gray", `-15295332` for "Cyan", `-7785800` for "Purple", `-12827478` for "Blue", `-8170446` for "Brown", `-10585066` for "Green", `-5231066` for "Red", and `-16777216` for "Black".
                         */
                        SignTextColor: { type: "int"; value: number };
                        /**
                         * The text on it.
                         */
                        Text: { type: "string"; value: string };
                        /**
                         * Unknown.
                         */
                        TextOwner: { type: "string"; value: string };
                    };
                };
                /**
                 * 1 or 0 (true/false) - true if the text is locked with [honeycomb](https://minecraft.wiki/w/honeycomb).
                 */
                IsWaxed: { type: "byte"; value: number };
            };
        };

        /**
         * Additional fields for [skull](https://minecraft.wiki/w/skull).
         *
         * @see {@link NBTSchemas.nbtSchemas.Block_Skull}
         */
        export type Block_Skull = {
            type: "compound";
            value: {
                /**
                 * 1 or 0 (true/false) - true if this dragon head's mouth is moving.
                 */
                MouthMoving: { type: "byte"; value: number };
                /**
                 * The animation frame of the dragon head's mouth movement.*needs testing*
                 */
                MouthTickCount: { type: "int"; value: number };
                /**
                 * The rotation of this skull.more info
                 */
                Rotation: { type: "float"; value: number };
            };
        };

        /**
         * Additional fields for [structure block](https://minecraft.wiki/w/structure block).
         *
         * @see {@link NBTSchemas.nbtSchemas.Block_StructureBlock}
         */
        export type Block_StructureBlock = {
            type: "compound";
            value: {
                /**
                 * The mode of animation.more info
                 */
                animationMode: { type: "byte"; value: number };
                /**
                 * The duration of the animation.more info
                 */
                animationSeconds: { type: "float"; value: number };
                /**
                 * The mode of the structure block, values for data are the same as the data values for the item. Ex. 0 = Data, 1 = Save, 2 = Load, 3 = Corner, 4 = Inventory, 5 = Export.
                 */
                data: { type: "int"; value: number };
                /**
                 * Unknown.
                 */
                dataField: { type: "string"; value: string };
                /**
                 * 1 or 0 (true/false) - true if the entities should be ignored in the structure.
                 */
                ignoreEntities: { type: "byte"; value: number };
                /**
                 * How complete the structure is that gets placed.
                 */
                integrity: { type: "float"; value: number };
                /**
                 * 1 or 0 (true/false) - true if this structure block is being powered by redstone.
                 */
                isPowered: { type: "byte"; value: number };
                /**
                 * How the structure is mirrored.more info
                 */
                mirror: { type: "byte"; value: number };
                /**
                 * The current redstone mode of this structure block.more info
                 */
                redstoneSaveMode: { type: "int"; value: number };
                /**
                 * 1 or 0 (true/false) - true if the blocks should be removed in the structure.
                 */
                removeBlocks: { type: "byte"; value: number };
                /**
                 * Rotation of the structure.more info
                 */
                rotation: { type: "byte"; value: number };
                /**
                 * The seed to use for the structure integrity, 0 means random.*needs testing*
                 */
                seed: { type: "long"; value: [high: number, low: number] };
                /**
                 * 1 or 0 (true/false) - true if show the structure's bounding box to players in Creative mode.
                 */
                showBoundingBox: { type: "byte"; value: number };
                /**
                 * Name of the structure.
                 */
                structureName: { type: "string"; value: string };
                /**
                 * X-offset of the structure.
                 */
                xStructureOffset: { type: "int"; value: number };
                /**
                 * Y-offset of the structure.
                 */
                yStructureOffset: { type: "int"; value: number };
                /**
                 * Z-offset of the structure.
                 */
                zStructureOffset: { type: "int"; value: number };
                /**
                 * X-size of the structure.
                 */
                xStructureSize: { type: "int"; value: number };
                /**
                 * Y-size of the structure.
                 */
                yStructureSize: { type: "int"; value: number };
                /**
                 * Z-size of the structure.
                 */
                zStructureSize: { type: "int"; value: number };
            };
        };

        /**
         * Additional fields for [suspicious sand](https://minecraft.wiki/w/suspicious sand) and [suspicious gravel](https://minecraft.wiki/w/suspicious gravel).
         *
         * @see {@link NBTSchemas.nbtSchemas.Block_SuspiciousBlock}
         */
        export type Block_SuspiciousBlock = {
            type: "compound";
            value: {
                /**
                 * The number of times the suspicious block is being brushed by the player, from 1 to 10 (the item will be extracted when it reaches 10). If the player stops brushing, it will progressively return to 0. And if it hasn't been brushed yet, defaults to 0.
                 */
                brush_count: { type: "int"; value: number };
                /**
                 * The direction of the suspicious block that was brushed. 0 = Down, 1 = Up, 2 = North, 3 = South, 4 = West, 5 = East, or 6 if it has not been brushed yet.
                 */
                brush_direction: { type: "byte"; value: number };
                /**
                 * (May not exist) The item in the suspicious block.
                 */
                item?: { type: "compound"; value: {} } & Item_ItemStack;
                /**
                 * (May not exist) Loot table to be used to generate the hidden item when brushed.
                 */
                LootTable?: { type: "string"; value: string };
                /**
                 * (May not exist) Seed for generating the loot table. 0 or omitted use a random seed.
                 */
                LootTableSeed?: { type: "int"; value: number };
                /**
                 * The type of suspicious block. Valid types are `minecraft:suspicious_sand` and `minecraft:suspicious_gravel`.
                 */
                type: { type: "string"; value: string };
            };
        };

        /**
         * Additional fields for [trial spawner](https://minecraft.wiki/w/trial spawner) and [ominous trial spawner](https://minecraft.wiki/w/ominous trial spawner).
         *
         * @see {@link NBTSchemas.nbtSchemas.Block_TrialSpawner}
         */
        export type Block_TrialSpawner = {
            type: "compound";
            value: {
                /**
                 * Between 1 and 128. Defaults to 14. &mdash; Maximum distance in blocks for players to join the battle.
                 */
                required_player_range: { type: "int"; value: number };
                /**
                 * Optional, see configuration for defaults. &mdash; The configuration to use when not ominous.
                 */
                normal_config: {
                    type: "compound";
                    value: {
                        /**
                         * Between 1 and 128. Defaults to 4. &mdash; Maximum distance in blocks that mobs can spawn.
                         */
                        spawn_range: { type: "int"; value: number };
                        /**
                         * Defaults to 6. &mdash; Total amount of mobs spawned before cooldown for a single player.
                         */
                        total_mobs: { type: "float"; value: number };
                        /**
                         * Defaults to 2. &mdash; The amount of spawned mobs from this spawner that are allowed to exist simultaneously.
                         */
                        simultaneous_mobs: { type: "float"; value: number };
                        /**
                         * Defaults to 2. &mdash; Amount of total mobs added for each additional player.
                         */
                        total_mobs_added_per_player: { type: "float"; value: number };
                        /**
                         * Defaults to 1. &mdash; Amount of simultaneous mobs added for each additional player.
                         */
                        simultaneous_mobs_added_per_player: { type: "float"; value: number };
                        /**
                         * Defaults to 20. &mdash; Time in ticks between spawn attempts.
                         */
                        ticks_between_spawn: { type: "int"; value: number };
                        /**
                         * Defaults to 36000. &mdash; Time in ticks of the cooldown period. Includes the time spend dispensing the reward.
                         */
                        target_cooldown_length: { type: "int"; value: number };
                        /**
                         * List of possible entities to spawn.
                         */
                        spawn_potentials: {
                            type: "list";
                            value: {
                                type: "compound";
                                value: {
                                    /**
                                     * The chance that this spawn gets picked in comparison to other spawn weights. Must be positive and at least 1.
                                     */
                                    Weight: { type: "int"; value: number };
                                    /**
                                     * An entity ID.
                                     */
                                    TypeID: { type: "string"; value: string };
                                    /**
                                     * Optional path to a [loot table](https://minecraft.wiki/w/loot table). Determines the equipment the entity will wear.
                                     */
                                    equipment_loot_table: { type: "string"; value: string };
                                }[];
                            };
                        };
                        /**
                         * List of possible loot tables to give as reward.
                         */
                        loot_tables_to_eject: {
                            type: "list";
                            value: {
                                type: "compound";
                                value: {
                                    /**
                                     * The chance that this loot table gets picked in comparison to other loot table weights. Must be positive and at least 1.
                                     */
                                    weight: { type: "int"; value: number };
                                    /**
                                     * A path to a [loot table](https://minecraft.wiki/w/loot table).
                                     */
                                    data: { type: "string"; value: string };
                                }[];
                            };
                        };
                        /**
                         * Defaults to `loot_tables/spawners/trial_chamber/items_to_drop_when_ominous.json` &mdash; A path to a [loot table](https://minecraft.wiki/w/loot table). Determines the items used by [ominous item spawner](https://minecraft.wiki/w/ominous item spawner)s spawned during the active phase when ominous. Ignored in normal mode.
                         */
                        items_to_drop_when_ominous: { type: "string"; value: string };
                    };
                };
                /**
                 * Optional, defaults to normal_config. When individual entries are omitted, they also default to their setting in normal_config. &mdash; The configuration to use when ominous.
                 */
                ominous_config: { type: "compound"; value: {} };
                /**
                 * A set of player UUIDs. &mdash; All the players that have joined the battle. The length of this array determines the amount of mobs and amount of reward.
                 */
                registered_players: {
                    type: "list";
                    value: {
                        type: "compound";
                        value: {
                            /**
                             * The UUID.
                             */
                            uuid: { type: "long"; value: [high: number, low: number] };
                        }[];
                    };
                };
                /**
                 * A set of mob UUIDs. &mdash; The mobs that were spawned by this spawner and are still alive.
                 */
                current_mobs: {
                    type: "list";
                    value: {
                        type: "compound";
                        value: {
                            /**
                             * The UUID.
                             */
                            uuid: { type: "long"; value: [high: number, low: number] };
                        }[];
                    };
                };
                /**
                 * Gametime in ticks when the cooldown ends. 0 if not currently in cooldown.
                 */
                cooldown_end_at: { type: "long"; value: [high: number, low: number] };
                /**
                 * Gametime in ticks when the next spawn attempt happens. 0 if not currently active.
                 */
                next_mob_spawns_at: { type: "long"; value: [high: number, low: number] };
                /**
                 * The next mob to attempt to spawn. Selected from spawn_potentials after the last attempt. Determines the mob displayed in the spawner.
                 */
                spawn_data: {
                    type: "compound";
                    value: {
                        /**
                         * Unknown.
                         */
                        Weight: { type: "int"; value: number };
                        /**
                         * An entity ID.
                         */
                        TypeID: { type: "string"; value: string };
                        /**
                         * Optional path to a [loot table](https://minecraft.wiki/w/loot table). Determines the equipment the entity will wear.
                         */
                        equipment_loot_table: { type: "string"; value: string };
                    };
                };
                /**
                 * A path to the [loot table](https://minecraft.wiki/w/loot table) that is given as reward. Unset if not currently giving rewards. Selected from loot_tables_to_eject after all mobs are defeated.
                 */
                selected_loot_table: { type: "string"; value: string };
            };
        };

        /**
         * Additional fields for [vault](https://minecraft.wiki/w/vault) and [ominous vault](https://minecraft.wiki/w/ominous vault).
         *
         * @see {@link NBTSchemas.nbtSchemas.Block_Vault}
         */
        export type Block_Vault = {
            type: "compound";
            value: {
                /**
                 * Configuration data that does not automatically change. All fields are optional.
                 */
                config: {
                    type: "compound";
                    value: {
                        /**
                         * The range in blocks when the vault should activate. Defaults to 4.
                         */
                        activation_range: { type: "float"; value: number };
                        /**
                         * The range in blocks when the vault should deactivate. Defaults to 4.5.
                         */
                        deactivation_range: { type: "float"; value: number };
                        /**
                         * A path to the [loot table](https://minecraft.wiki/w/loot table) that is ejected when unlocking the vault. Defaults to `loot_tables/chests/trial_chambers/reward.json` for _normal_ vaults and `loot_tables/chests/trial_chambers/reward_ominous.json` for _ominous_ vaults.
                         */
                        loot_table: { type: "string"; value: string };
                        /**
                         * A path to the loot table that is used to display items in the vault. If not present, the game will use the loot_table field.
                         */
                        override_loot_table_to_display: { type: "string"; value: string };
                        /**
                         * The key item that is used to check for valid keys. Defaults to `minecraft:trial_key` for _normal_ vaults and `minecraft:ominous_trial_key` for _ominous_ vaults.
                         */
                        key_item: { type: "compound"; value: {} } & Item_ItemStack;
                    };
                };
                /**
                 * Data that is used to keep track of the current state of the vault.
                 */
                data: {
                    type: "compound";
                    value: {
                        /**
                         * The item that is currently being displayed.
                         */
                        display_item: { type: "compound"; value: {} } & Item_ItemStack;
                        /**
                         * List of item stacks that have been rolled by the loot table and are waiting to be ejected.
                         */
                        items_to_eject: { type: "list"; value: { type: "compound"; value: {} & Item_ItemStack[] } };
                        /**
                         * A set of player UUIDs that have already received their rewards from this vault.
                         */
                        rewarded_players: { type: "list"; value: { type: "long"; value: [high: number, low: number][] } };
                        /**
                         * The game time when the vault will process block state changes, such as changing from `unlocking` to `ejecting` after a delay.
                         */
                        state_updating_resumes_at: { type: "long"; value: [high: number, low: number] };
                        /**
                         * The total amount of item stacks that need to be ejected.
                         */
                        total_ejections_needed: { type: "long"; value: [high: number, low: number] };
                    };
                };
            };
        };

        /**
         * All items share this base.
         *
         * @see {@link NBTSchemas.nbtSchemas.Item_ItemStack}
         */
        export type Item_ItemStack = {
            type: "compound";
            value: {
                /**
                 * (May not exist) What block is placed when placing a block item.
                 */
                Block?: { type: "compound"; value: {} } & Block;
                /**
                 * (May not exist) Controls what block types this item can destroy.
                 */
                CanDestroy?: { type: "list"; value: { type: "string"; value: string[] } };
                /**
                 * (May not exist) Controls what block types this block may be placed on.
                 */
                CanPlaceOn?: { type: "list"; value: { type: "string"; value: string[] } };
                /**
                 * Number of items stacked in this inventory slot.
                 */
                Count: { type: "byte"; value: number };
                /**
                 * The metadata value. Note that this tag does not store items' damage value.
                 */
                Damage: { type: "short"; value: number };
                /**
                 * The item ID.
                 */
                Name: { type: "string"; value: string };
                /**
                 * (May not exist) Additional information about the item.
                 */
                tag?: { type: "compound"; value: {} };
                /**
                 * Unknown.
                 */
                WasPickedUp: { type: "byte"; value: number };
            };
        };

        /**
         * Additional fields when an [armor](https://minecraft.wiki/w/armor) is [trimmed](https://minecraft.wiki/w/Smithing Template).
         *
         * @see {@link NBTSchemas.nbtSchemas.Item_ArmorTrim}
         */
        export type Item_ArmorTrim = {
            type: "compound";
            value: {
                tag?: {
                    type: "compound";
                    value: {
                        /**
                         * Properties of the armor trim.
                         */
                        Trim: {
                            type: "compound";
                            value: {
                                /**
                                 * The material which decides the color of armor trim.
                                 */
                                Material: { type: "string"; value: string };
                                /**
                                 * The pattern of armor trim.
                                 */
                                Pattern: { type: "string"; value: string };
                            };
                        };
                    };
                };
            };
        } & Item_ItemStack;

        /**
         * Additional fields for [book and quill](https://minecraft.wiki/w/book and quill)s.
         *
         * @see {@link NBTSchemas.nbtSchemas.Item_BookAndQuills}
         */
        export type Item_BookAndQuills = {
            type: "compound";
            value: {
                tag?: {
                    type: "compound";
                    value: {
                        /**
                         * (May not exist) The list of pages in the book.
                         */
                        pages?: {
                            type: "list";
                            value: {
                                type: "compound";
                                value: {
                                    /**
                                     * Filename of a [photo](https://minecraft.wiki/w/photo) in this page if included.
                                     */
                                    photoname: { type: "string"; value: string };
                                    /**
                                     * The text in this page.
                                     */
                                    text: { type: "string"; value: string };
                                }[];
                            };
                        };
                    };
                };
            };
        } & Item_ItemStack;

        /**
         * Additional fields for [bucket](https://minecraft.wiki/w/bucket).
         *
         * @see {@link NBTSchemas.nbtSchemas.Item_BucketOfAquaticMob}
         */
        export type Item_BucketOfAquaticMob = {
            type: "compound";
            value: {
                tag?: {
                    type: "compound";
                    value: {
                        /**
                         * 1 or 0 (true/false) - true if the entity color, state, and id are used to generate the bucket item's name.
                         */
                        AppendCustomName: { type: "byte"; value: number };
                        /**
                         * (May not exist) The translation key of entity's state. Used to generate the bucket item's name.
                         */
                        BodyID?: { type: "string"; value: string };
                        /**
                         * (May not exist) The translation key of a color. Used to generate the bucket item's name.
                         */
                        ColorID?: { type: "string"; value: string };
                        /**
                         * (May not exist) The translation key of another color. Used to generate the bucket item's name.
                         */
                        Color2ID?: { type: "string"; value: string };
                        /**
                         * (May not exist) The custom name of entity in it. Used to generate the bucket item's name.
                         */
                        CustomName?: { type: "string"; value: string };
                        /**
                         * (May not exist) Unknown. Used to generate the bucket item's name.
                         */
                        GroupName?: { type: "string"; value: string };
                    };
                };
            };
        } & Item_ItemStack;

        /**
         * Additional fields for [crossbow](https://minecraft.wiki/w/crossbow).
         *
         * @see {@link NBTSchemas.nbtSchemas.Item_Crossbow}
         */
        export type Item_Crossbow = {
            type: "compound";
            value: {
                tag?: {
                    type: "compound";
                    value: {
                        /**
                         * The items this crossbow has charged.
                         */
                        chargedItem: { type: "compound"; value: {} } & Item_ItemStack;
                    };
                };
            };
        } & Item_ItemStack;

        /**
         * Additional fields for [filled map](https://minecraft.wiki/w/filled map).
         *
         * @see {@link NBTSchemas.nbtSchemas.Item_FilledMap}
         */
        export type Item_FilledMap = {
            type: "compound";
            value: {
                tag?: {
                    type: "compound";
                    value: {
                        /**
                         * 1 or 0 (true/false) - (may not exist) true if the map displays player markers.
                         */
                        map_display_players: { type: "byte"; value: number };
                        /**
                         * (May not exist) Unknown.
                         */
                        map_is_init?: { type: "byte"; value: number };
                        /**
                         * (May not exist) Unknown.
                         */
                        map_is_scaling?: { type: "byte"; value: number };
                        /**
                         * The index of the map's name.
                         */
                        map_name_index: { type: "int"; value: number };
                        /**
                         * (May not exist) Unknown.
                         */
                        map_scale?: { type: "int"; value: number };
                        /**
                         * The UUID of the map used in this item.
                         */
                        map_uuid: { type: "long"; value: [high: number, low: number] };
                    };
                };
            };
        } & Item_ItemStack;

        /**
         * Additional fields for [firework rocket](https://minecraft.wiki/w/firework rocket).
         *
         * @see {@link NBTSchemas.nbtSchemas.Item_FireworkRocket}
         */
        export type Item_FireworkRocket = {
            type: "compound";
            value: {
                tag?: {
                    type: "compound";
                    value: {
                        Fireworks?: {
                            type: "compound";
                            value: {
                                /**
                                 * List of compounds representing each explosion this firework causes.
                                 */
                                Explosions: { type: "list"; value: { type: "compound"; value: {} & FireworkExplosion[] } };
                                /**
                                 * Indicates the flight duration of the firework (equals the amount of gunpowder used in crafting the rocket). Can be anything from -128 to 127.
                                 */
                                Flight: { type: "byte"; value: number };
                            };
                        };
                    };
                };
            };
        } & Item_ItemStack;

        /**
         * Additional fields for [firework star](https://minecraft.wiki/w/firework star).
         *
         * @see {@link NBTSchemas.nbtSchemas.Item_FireworkStar}
         */
        export type Item_FireworkStar = {
            type: "compound";
            value: {
                tag?: {
                    type: "compound";
                    value: {
                        /**
                         * The color of this firework star.
                         */
                        customColor: { type: "int"; value: number };
                        /**
                         * The explosion effect contributed by this firework star.
                         */
                        FireworksItem: { type: "compound"; value: {} } & FireworkExplosion;
                    };
                };
            };
        } & Item_ItemStack;

        /**
         * Additional fields for [glow stick](https://minecraft.wiki/w/glow stick).
         *
         * @see {@link NBTSchemas.nbtSchemas.Item_GlowStick}
         */
        export type Item_GlowStick = {
            type: "compound";
            value: {
                /**
                 * (May not exist) Unknown.
                 */
                active_time?: { type: "long"; value: [high: number, low: number] };
            };
        } & Item_ItemStack;

        /**
         * Additional fields for [horse armor](https://minecraft.wiki/w/horse armor).
         *
         * @see {@link NBTSchemas.nbtSchemas.Item_HorseArmor}
         */
        export type Item_HorseArmor = {
            type: "compound";
            value: {
                tag?: {
                    type: "compound";
                    value: {
                        /**
                         * (May not exist) The color of the leather armor.
                         */
                        customColor?: { type: "int"; value: number };
                    };
                };
            };
        } & Item_ItemStack;

        /**
         * Additional fields for [lodestone compass](https://minecraft.wiki/w/lodestone compass).
         *
         * @see {@link NBTSchemas.nbtSchemas.Item_LodestoneCompass}
         */
        export type Item_LodestoneCompass = {
            type: "compound";
            value: {
                tag?: {
                    type: "compound";
                    value: {
                        /**
                         * The ID of lodestone to track.
                         */
                        trackingHandle: { type: "int"; value: number };
                    };
                };
            };
        } & Item_ItemStack;

        /**
         * Additional fields for [potion](https://minecraft.wiki/w/potion).
         *
         * @see {@link NBTSchemas.nbtSchemas.Item_Potion}
         */
        export type Item_Potion = {
            type: "compound";
            value: {
                tag?: {
                    type: "compound";
                    value: {
                        /**
                         * 1 or 0 (true/false) - (may not exist) true if item is brewed in brewing stand.
                         */
                        wasJustBrewed: { type: "byte"; value: number };
                    };
                };
            };
        } & Item_ItemStack;

        /**
         * Additional fields for [shield](https://minecraft.wiki/w/shield).
         *
         * @see {@link NBTSchemas.nbtSchemas.Item_Shield}
         */
        export type Item_Shield = {
            type: "compound";
            value: {
                tag?: {
                    type: "compound";
                    value: {
                        /**
                         * The base color of the banner on the shield. See [Banner#Block_data](https://minecraft.wiki/w/Banner#Block_data).
                         */
                        Base: { type: "int"; value: number };
                        /**
                         * (May not exist) List of all patterns applied to the banner on the shield.
                         */
                        Patterns?: {
                            type: "list";
                            value: {
                                type: "compound";
                                value: {
                                    /**
                                     * The base color of the pattern. See [Banner#Block_data](https://minecraft.wiki/w/Banner#Block_data).
                                     */
                                    Color: { type: "int"; value: number };
                                    /**
                                     * The pattern ID code. See [Banner#Block_data](https://minecraft.wiki/w/Banner#Block_data).
                                     */
                                    Pattern: { type: "string"; value: string };
                                }[];
                            };
                        };
                    };
                };
            };
        } & Item_ItemStack;

        /**
         * Additional fields for [written book](https://minecraft.wiki/w/written book).
         *
         * @see {@link NBTSchemas.nbtSchemas.Item_WrittenBook}
         */
        export type Item_WrittenBook = {
            type: "compound";
            value: {
                tag?: {
                    type: "compound";
                    value: {
                        /**
                         * The author of this book.
                         */
                        author: { type: "string"; value: string };
                        /**
                         * The copy tier of the book. 0 = Original, 1 = Copy of original, 2 = Copy of copy.
                         */
                        generation: { type: "int"; value: number };
                        /**
                         * The list of pages in the book.
                         */
                        pages: {
                            type: "list";
                            value: {
                                type: "compound";
                                value: {
                                    /**
                                     * Filename of a [photo](https://minecraft.wiki/w/photo) in this page if included.
                                     */
                                    photoname: { type: "string"; value: string };
                                    /**
                                     * The text in this page.
                                     */
                                    text: { type: "string"; value: string };
                                }[];
                            };
                        };
                        /**
                         * The title of this book.
                         */
                        title: { type: "string"; value: string };
                        /**
                         * Unknown.
                         */
                        xuid: { type: "long"; value: [high: number, low: number] };
                    };
                };
            };
        } & Item_ItemStack;

        /**
         * This component is used by villagers and wandering traders.
         *
         * @see {@link NBTSchemas.nbtSchemas.Component_Economy_trade_table}
         */
        export type Component_Economy_trade_table = {
            type: "compound";
            value: {
                /**
                 * Unknown.
                 */
                Riches: { type: "int"; value: number };
                /**
                 * (May not exist) The trade info.
                 */
                Offers?: {
                    type: "compound";
                    value: {
                        /**
                         * The list of trade recipes.
                         */
                        Recipes: {
                            type: "list";
                            value: {
                                type: "compound";
                                value: {
                                    /**
                                     * The first 'cost' item.
                                     */
                                    buyA: { type: "compound"; value: {} } & Item_ItemStack;
                                    /**
                                     * (May not exist) The second 'cost' item
                                     */
                                    buyB?: { type: "compound"; value: {} } & Item_ItemStack;
                                    /**
                                     * The item being sold for each set of cost items.
                                     */
                                    sell: { type: "compound"; value: {} } & Item_ItemStack;
                                    /**
                                     * The tier that the trader needs to reach to access this recipe.
                                     */
                                    tier: { type: "int"; value: number };
                                    /**
                                     * The number of times this trade has been used. The trade becomes disabled when this is greater or equal to maxUses.
                                     */
                                    uses: { type: "int"; value: number };
                                    /**
                                     * The maximum number of times this trade can be used before it is disabled. Increases by a random amount from 2 to 12 when offers are refreshed.*needs testing*
                                     */
                                    maxUses: { type: "int"; value: number };
                                    /**
                                     * The trade experiences to be rewarded to this trader entity.
                                     */
                                    traderExp: { type: "int"; value: number };
                                    /**
                                     * 1 or 0 (true/false) - true if this trade provides XP orb drops.
                                     */
                                    rewardExp: { type: "byte"; value: number };
                                    /**
                                     * The price adjuster of the first 'cost' item based on demand. Updated when a villager resupply.
                                     */
                                    demand: { type: "int"; value: number };
                                    /**
                                     * The count needed for the first 'cost' item.
                                     */
                                    buyCountA: { type: "int"; value: number };
                                    /**
                                     * The count needed for the second 'cost' item.
                                     */
                                    buyCountB: { type: "int"; value: number };
                                    /**
                                     * The multiplier on the demand and discount price adjuster; the final adjusted price is added to the first 'cost' item's price.
                                     */
                                    priceMultiplierA: { type: "float"; value: number };
                                    /**
                                     * The multiplier on the demand and discount price adjuster; the final adjusted price is added to the second 'cost' item's price.
                                     */
                                    priceMultiplierB: { type: "float"; value: number };
                                }[];
                            };
                        };
                        /**
                         * Trade experiences required to become each trade tier.
                         */
                        TierExpRequirements: {
                            type: "list";
                            value: {
                                type: "compound";
                                value: {
                                    /**
                                     * Trade xperiences required to become this tier.
                                     */
                                    "<''tier_level_num''>": { type: "int"; value: number };
                                }[];
                            };
                        };
                    };
                };
                /**
                 * (May not exist) Unknown.
                 */
                ConvertedFromVillagerV1?: { type: "byte"; value: number };
                /**
                 * (May not exist) The path of the json file of the trade table.
                 */
                TradeTablePath?: { type: "string"; value: string };
                /**
                 * (May not exist) The discount price adjuster gained by curing zombie villagers
                 */
                LowTierCuredDiscount?: { type: "int"; value: number };
                /**
                 * (May not exist) The discount price adjuster gained by curing zombie villagers
                 */
                HighTierCuredDiscount?: { type: "int"; value: number };
                /**
                 * (May not exist) The discount price adjuster gained by curing nearby zombie villagers
                 */
                NearbyCuredDiscount?: { type: "int"; value: number };
                /**
                 * (May not exist) The discount price adjuster gained by curing nearby zombie villagers
                 */
                NearbyCuredDiscountTimeStamp?: { type: "int"; value: number };
            };
        };

        /**
         * This component is used by axolotls, bees, cats, chickens, cows, dolphins, donkeys, foxes, goats, hoglins, horses, llamas, mooshrooms, mules, ocelots, pandas, pigs, polar bears, rabbits, sheep, skeleton horses, sniffers, striders, tadpoles, turtles, villagers, wolves, and zombie horses.
         *
         * @see {@link NBTSchemas.nbtSchemas.Component_Ageable}
         */
        export type Component_Ageable = {
            type: "compound";
            value: {
                /**
                 * Represents the age of the entity in ticks; when negative, the entity is a baby. When 0, the entity becomes an adult.
                 */
                Age: { type: "int"; value: number };
            };
        };

        /**
         * This component is used by allays, bees, chickens, cows, donkeys, foxes, glow squids, horses, iron golems, llamas, mooshrooms, mules, pandas, pigs, rabbits, sheep, skeleton horses, snow golems, and zombie horses.
         *
         * @see {@link NBTSchemas.nbtSchemas.Component_Balloon}
         */
        export type Component_Balloon = {
            type: "compound";
            value: {
                /**
                 * The Unique ID of the attached entity.
                 */
                ballon_attached: { type: "long"; value: [high: number, low: number] };
                /**
                 * Max height.
                 */
                ballon_max_height: { type: "float"; value: number };
                /**
                 * Unknown
                 */
                ballon_should_drop: { type: "byte"; value: number };
            };
        };

        /**
         * This component is used by axolotls, bats, bees, cats, cave spiders, chickens, cows, creepers, dolphins, donkeys, drowned, elder guardians, endermen, endermites, evokers, fish, foxes, frogs, ghasts, glow squids, goats, guardians, hoglins, horses, husks, llamas, magma cubes, mooshrooms, mules, ocelots, pandas, parrots, phantoms, piglins, piglin brutes, pillagers, pigs, players, polar bears, pufferfish, rabbits, ravagers, salmon, sheep, shulkers, silverfish, skeletons, skeleton horses, slimes, sniffers, snow golems, tropical fish, spiders, squids, sea turtles, strays, villagers, vindicators, wardens, wandering traders, withers, wither skeletons, tadpoles, witches, wolves, zombies, zoglins, zombie horses, zombified piglins, and zombie villagers.
         *
         * @see {@link NBTSchemas.nbtSchemas.Component_Breathable}
         */
        export type Component_Breathable = {
            type: "compound";
            value: {
                /**
                 * How much air the living entity has, in ticks.
                 */
                Air: { type: "short"; value: number };
            };
        };

        /**
         * This component is used by axolotls, bees, cats, chickens, cows, dolphins, donkeys, foxes, goats, hoglins, horses, llamas, mooshrooms, mules, ocelots, pandas, pigs, polar bears, rabbits, sheep, skeleton horses, sniffers, striders, tadpoles, turtles, villagers, wolves, and zombie horses.
         *
         * @see {@link NBTSchemas.nbtSchemas.Component_Breedable}
         */
        export type Component_Breedable = {
            type: "compound";
            value: {
                /**
                 * Number of ticks until the entity loses its breeding hearts and stops searching for a mate. 0 when not searching for a mate *needs testing*.
                 */
                InLove: { type: "int"; value: number };
                /**
                 * The Unique ID of the entity that caused this animal to breed.
                 */
                LoveCause: { type: "long"; value: [high: number, low: number] };
                /**
                 * Unknown
                 */
                BreedCooldown: { type: "int"; value: number };
            };
        };

        /**
         * This component is only used by dolphins.
         *
         * @see {@link NBTSchemas.nbtSchemas.Component_Bribeable}
         */
        export type Component_Bribeable = {
            type: "compound";
            value: {
                /**
                 * Unknown<!--Time in ticks before the Entity can be bribed again.*needs testing*-->
                 */
                BribeTime: { type: "int"; value: number };
            };
        };

        /**
         * This component is used by minecarts with chest, minecarts with command block, minecarts with hopper, horses, donkeys, llamas, mules, pandas, and villagers.
         *
         * @see {@link NBTSchemas.nbtSchemas.Component_Inventory}
         */
        export type Component_Inventory = {
            type: "compound";
            value: {
                ChestItems?: {
                    type: "list";
                    value: {
                        type: "compound";
                        value: {
                            /**
                             * The slot the item is in.
                             */
                            Slot: { type: "byte"; value: number };
                        }[];
                    };
                };
                /**
                 * e.g. 1.17.20-beta23
                 */
                InventoryVersion: { type: "string"; value: string };
                /**
                 * Loot table to be used to fill the inventory when it is next opened, or the items are otherwise interacted with.
                 */
                LootTable: { type: "string"; value: string };
                /**
                 * Seed for generating the loot table. 0 or omitted uses a random seed *needs testing*.
                 */
                LootTableSeed: { type: "int"; value: number };
            };
        };

        /**
         * This component is used by axolotls and dolphins.
         *
         * @see {@link NBTSchemas.nbtSchemas.Component_Damage_over_time}
         */
        export type Component_Damage_over_time = {
            type: "compound";
            value: {
                /**
                 * Unknown
                 */
                DamageTime: { type: "short"; value: number };
            };
        };

        /**
         * This component is used by axolotls and dolphins.
         *
         * @see {@link NBTSchemas.nbtSchemas.Component_Drying_out_timer}
         */
        export type Component_Drying_out_timer = {
            type: "compound";
            value: {
                /**
                 * The time when this entity completely dries out.
                 */
                CompleteTick: { type: "long"; value: [high: number, low: number] };
                /**
                 * Must be a boolean. 1 if it already dried out.
                 */
                State: { type: "int"; value: number };
            };
        };

        /**
         * This component is used by cats, iron golems, villagers, evokers, pillagers, ravagers, vindicators, and witches. These mobs are classified into "roles" in the component, with cats being "passive", iron golems being "defenders", evokers, pillagers, ravagers, vindicators, and witches being "hostile", and villagers being "inhabitants".
         *
         * @see {@link NBTSchemas.nbtSchemas.Component_Dweller}
         */
        export type Component_Dweller = {
            type: "compound";
            value: {
                /**
                 * Unknown
                 */
                DwellingUniqueID: { type: "string"; value: string };
                /**
                 * Unknown
                 */
                RewardPlayersOnFirstFounding: { type: "byte"; value: number };
                /**
                 * (May not exist) Unknown
                 */
                PreferredProfession?: { type: "string"; value: string };
            };
        };

        /**
         * This component is used by TNT, minecarts with TNT, creepers, ghast fireballs, end crystals, and wither skulls.
         *
         * @see {@link NBTSchemas.nbtSchemas.Component_Explode}
         */
        export type Component_Explode = {
            type: "compound";
            value: {
                /**
                 * (May not exist)  Number of ticks before the explosion
                 */
                Fuse?: { type: "byte"; value: number };
                /**
                 * (May not exist)  Does the time before the explosion started decreasing
                 */
                IsFuseLit?: { type: "byte"; value: number };
                /**
                 * (May not exist)  Explosion will cause damage to territory even underwater
                 */
                AllowUnderwater?: { type: "byte"; value: number };
            };
        };

        /**
         * This component is used by goat and pandas.
         *
         * @see {@link NBTSchemas.nbtSchemas.Component_Genetics}
         */
        export type Component_Genetics = {
            type: "compound";
            value: {
                GeneArray?: {
                    type: "list";
                    value: {
                        type: "compound";
                        value: {
                            /**
                             * the hidden allele.more info
                             */
                            HiddenAllele: { type: "int"; value: number };
                            /**
                             * the main allele.more info
                             */
                            MainAllele: { type: "int"; value: number };
                        }[];
                    };
                };
            };
        };

        /**
         * This component is used by bees, elder guardians, guardians, piglin brutes, and turtles.
         *
         * @see {@link NBTSchemas.nbtSchemas.Component_Home}
         */
        export type Component_Home = {
            type: "compound";
            value: {
                /**
                 * The position of the entity's home.
                 */
                HomePos: { type: "list"; value: { type: "float"; value: [number, number, number] } };
                /**
                 * The dimension where the entity's home is.
                 */
                HomeDimensionId: { type: "int"; value: number };
            };
        };

        /**
         * This component is only used by players.
         *
         * @see {@link NBTSchemas.nbtSchemas.Component_Insomnia}
         */
        export type Component_Insomnia = {
            type: "compound";
            value: {
                /**
                 * The time in ticks since last rest.
                 */
                TimeSinceRest: { type: "int"; value: number };
            };
        };

        /**
         * This component is used by old villagers.
         *
         * @see {@link NBTSchemas.nbtSchemas.Component_Trade_table}
         */
        export type Component_Trade_table = {
            type: "compound";
            value: {
                /**
                 * Unknown
                 */
                sizeOfTradeFirstTimeVector: { type: "int"; value: number };
                /**
                 * (May not exist) Unknown
                 */
                FirstTimeTrade?: { type: "int"; value: number };
                /**
                 * Unknown
                 */
                TradeTier: { type: "int"; value: number };
                /**
                 * Unknown
                 */
                Riches: { type: "int"; value: number };
                /**
                 * Unknown
                 */
                Willing: { type: "byte"; value: number };
                /**
                 * (May not exist) Unknown
                 */
                Offers?: {
                    type: "list";
                    value: (
                        | { type: "byte"; value: number[] }
                        | { type: "short"; value: number[] }
                        | { type: "int"; value: number[] }
                        | { type: "long"; value: [high: number, low: number][] }
                        | { type: "float"; value: number[] }
                        | { type: "double"; value: number[] }
                        | { type: "string"; value: number[] }
                        | { type: "byteArray"; value: number[][] }
                        | { type: "shortArray"; value: number[][] }
                        | { type: "intArray"; value: number[][] }
                        | { type: "longArray"; value: [high: number, low: number][][] }
                        | { type: "compound"; value: Record<string, any> }
                        | { type: "list"; value: any[] }
                    )[];
                };
            };
        };

        /**
         * This component is used by horses, donkeys, mules, and llamas.
         *
         * @see {@link NBTSchemas.nbtSchemas.Component_Tamemount}
         */
        export type Component_Tamemount = {
            type: "compound";
            value: {
                /**
                 * Random number that ranges from 0 to 100; increases with feeding or trying to tame it. Higher values make a horse easier to tame.
                 */
                Temper: { type: "int"; value: number };
            };
        };

        /**
         * This component is only used by NPCs.
         *
         * @see {@link NBTSchemas.nbtSchemas.Component_Npc}
         */
        export type Component_Npc = {
            type: "compound";
            value: {
                /**
                 * (May not exist) The name.more info
                 */
                RawtextName?: { type: "string"; value: string };
                /**
                 * (May not exist) The interactive text.more info
                 */
                InteractiveText?: { type: "string"; value: string };
                /**
                 * (May not exist) The actions.more info
                 */
                Actions?: { type: "string"; value: string };
                /**
                 * (May not exist) Unknown
                 */
                PlayerSceneMapping?: {
                    type: "list";
                    value: {
                        type: "compound";
                        value: {
                            /**
                             * A player's Unique ID.
                             */
                            PlayerID: { type: "long"; value: [high: number, low: number] };
                            /**
                             * Unknown
                             */
                            SceneName: { type: "string"; value: string };
                        }[];
                    };
                };
            };
        };

        /**
         * The entity's root tag.
         *
         * @see {@link NBTSchemas.nbtSchemas.Component_Projectile}
         */
        export type Component_Projectile = {
            type: "compound";
            value: {
                /**
                 * Optional. The UniqueID of the entity which the projectile was launched to.
                 */
                TargetID: { type: "long"; value: [high: number, low: number] };
                /**
                 * Unknown.
                 */
                StuckToBlockPos: { type: "list"; value: { type: "int"; value: [number, number, number] } };
                /**
                 * Unknown.
                 */
                CollisionPos: { type: "list"; value: { type: "float"; value: [number, number, number] } };
            };
        };

        /**
         * This component is used by chickens and wandering traders.
         *
         * @see {@link NBTSchemas.nbtSchemas.Component_Spawn_entity}
         */
        export type Component_Spawn_entity = {
            type: "compound";
            value: {
                entries?: {
                    type: "list";
                    value: {
                        type: "compound";
                        value: {
                            /**
                             * Unknown
                             */
                            SpawnTimer: { type: "int"; value: number };
                            /**
                             * Unknown
                             */
                            StopSpawning: { type: "byte"; value: number };
                        }[];
                    };
                };
            };
        };

        /**
         * This component is used by bees, boats, guardians, hoglins, husks, piglins, piglin brutes, players, pufferfish, ravagers, skeletons, wandering traders, and zombies.
         *
         * @see {@link NBTSchemas.nbtSchemas.Component_Timer}
         */
        export type Component_Timer = {
            type: "compound";
            value: {
                /**
                 * Unknown
                 */
                TimeStamp: { type: "long"; value: [high: number, low: number] };
                /**
                 * Unknown
                 */
                HasExecuted: { type: "byte"; value: number };
                /**
                 * Deprecated. Unknown
                 */
                CountTime: { type: "int"; value: number };
            };
        };

        /**
         * This component is only used by villagers.
         *
         * @see {@link NBTSchemas.nbtSchemas.Component_Trade_resupply}
         */
        export type Component_Trade_resupply = {
            type: "compound";
            value: {
                /**
                 * Unknown
                 */
                HasResupplied: { type: "byte"; value: number };
            };
        };

        /**
         * This component is only used by foxes.
         *
         * @see {@link NBTSchemas.nbtSchemas.Component_Trust}
         */
        export type Component_Trust = {
            type: "compound";
            value: {
                /**
                 * The number of players who are trusted by this entity.
                 */
                TrustedPlayersAmount: { type: "int"; value: number };
            } & {
                [key: `TrustedPlayer${bigint}`]: { type: "long"; value: [high: number, low: number] };
            };
        };

        /**
         * This component may be not accessable with [Behavior Pack](https://minecraft.wiki/w/Add-on). But it is used by activated [Minecart with Command Block](https://minecraft.wiki/w/Minecart with Command Block)
         *
         * @see {@link NBTSchemas.nbtSchemas.Component_CommandBlockComponent}
         */
        export type Component_CommandBlockComponent = {
            type: "compound";
            value: {
                /**
                 * Unknown
                 */
                Ticking: { type: "byte"; value: number };
                /**
                 * Number of ticks until it executes the command again.
                 */
                CurrentTickCount: { type: "int"; value: number };
            };
        };

        /**
         * This component may be not accessable with [Behavior Pack](https://minecraft.wiki/w/Add-on). But it is used by player entity.
         *
         * @see {@link NBTSchemas.nbtSchemas.Component_FogCommandComponent}
         */
        export type Component_FogCommandComponent = {
            type: "compound";
            value: {
                /**
                 * Unknown.
                 */
                fogCommandStack: { type: "list"; value: { type: "string"; value: string[] } };
            };
        };

        /**
         * This component is only used by villagers.
         *
         * @see {@link NBTSchemas.nbtSchemas.Component_Hide}
         */
        export type Component_Hide = {
            type: "compound";
            value: {
                /**
                 * Unknown
                 */
                IsInRaid: { type: "byte"; value: number };
                /**
                 * Unknown
                 */
                ReactToBell: { type: "byte"; value: number };
            };
        };

        /**
         * The PlayerClient schema.
         *
         * The players data.
         *
         * @see {@link NBTSchemas.nbtSchemas.Players}
         */
        export type Players = {
            type: "compound";
            value: {
                MsaId?: { type: "string"; value: string };
                SelfSignedId?: { type: "string"; value: string };
                ServerId?: { type: "string"; value: string };
            };
        };

        /**
         * The TickingArea schema.
         *
         * The tickingarea data.
         *
         * @see {@link NBTSchemas.nbtSchemas.Tickingarea}
         */
        export type Tickingarea = {
            type: "compound";
            value: {
                Dimension?: { type: "int"; value: number };
                IsCircle?: { type: "byte"; value: number };
                MaxX?: { type: "int"; value: number };
                MaxZ?: { type: "int"; value: number };
                MinX?: { type: "int"; value: number };
                MinZ?: { type: "int"; value: number };
                Name?: { type: "string"; value: string };
                Preload?: { type: "byte"; value: number };
            };
        };
    }
}

// const jsonSchemas = {} as const satisfies Record<string, JSONSchema> & Partial<Record<DBEntryContentType, JSONSchema>>;

type JSONSchemaRef = JSONSchema | boolean;
interface JSONSchemaMap {
    [name: string]: JSONSchemaRef;
}
interface JSONSchema {
    id?: string;
    $id?: string;
    $schema?: string;
    type?: string | string[];
    title?: string;
    default?: any;
    definitions?: {
        [name: string]: JSONSchema;
    };
    description?: string;
    properties?: JSONSchemaMap;
    patternProperties?: JSONSchemaMap;
    additionalProperties?: boolean | JSONSchemaRef;
    minProperties?: number;
    maxProperties?: number;
    dependencies?:
        | JSONSchemaMap
        | {
              [prop: string]: string[];
          };
    items?: JSONSchemaRef | JSONSchemaRef[];
    minItems?: number;
    maxItems?: number;
    uniqueItems?: boolean;
    additionalItems?: boolean | JSONSchemaRef;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    minimum?: number;
    maximum?: number;
    exclusiveMinimum?: boolean | number;
    exclusiveMaximum?: boolean | number;
    multipleOf?: number;
    required?: string[];
    $ref?: string;
    anyOf?: JSONSchemaRef[];
    allOf?: JSONSchemaRef[];
    oneOf?: JSONSchemaRef[];
    not?: JSONSchemaRef;
    enum?: any[];
    format?: string;
    const?: any;
    contains?: JSONSchemaRef;
    propertyNames?: JSONSchemaRef;
    examples?: any[];
    $comment?: string;
    if?: JSONSchemaRef;
    then?: JSONSchemaRef;
    else?: JSONSchemaRef;
    defaultSnippets?: {
        label?: string;
        description?: string;
        markdownDescription?: string;
        body?: any;
        bodyText?: string;
    }[];
    errorMessage?: string;
    patternErrorMessage?: string;
    deprecationMessage?: string;
    enumDescriptions?: string[];
    markdownEnumDescriptions?: string[];
    markdownDescription?: string;
    doNotSuggest?: boolean;
    suggestSortText?: string;
    allowComments?: boolean;
    allowTrailingCommas?: boolean;
}
