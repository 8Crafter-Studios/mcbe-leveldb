import NBT, { type Compound } from "prismarine-nbt";
import type { OmitNeverValueKeys, VerifyConstraint } from "./types.js";

function toPrimitive(tag: any): number {
    switch (tag.type) {
        case "byte":
        case "short":
        case "int":
        case "float":
        case "double":
            return tag.value;
        case "long":
            return Number(toLong(tag.value));
        default:
            throw new SyntaxError("Cannot convert to primitive: " + tag.type);
    }
}

function uuidToIntArray(uuidStr: string): number[] {
    const hex: string = uuidStr.replace(/-/g, "");
    if (hex.length !== 32)
        throw new SyntaxError("Invalid UUID: " + uuidStr, {
            cause: {
                position: 0,
                stack: [
                    {
                        input: uuidStr,
                        positionInInput: 0,
                        function: "uuidToIntArray",
                        error: { type: "InvalidUUID", uuid: uuidStr },
                    },
                ],
            } as const satisfies SNBTParseErrorCause,
        });
    const arr: number[] = [];
    for (let i: number = 0; i < 16; i += 4) {
        arr.push((parseInt(hex.slice(i, i + 4), 16) << 16) >> 16); // 32-bit signed chunks
    }
    return arr;
}

/**
 * The type of an SNBT parse error.
 */
export type SNBTParseErrorType =
    | NonNullable<
          Extract<
              SNBTParseErrorCauseStackItem,
              {
                  /**
                   * @ignore
                   */
                  error?: any;
              }
          >["error"]
      >["type"]
    | "ExpectedEndOfInput"
    | "ExpectedCompoundOrList";

/**
 * Maps SNBT parse error types to error codes.
 */
export const SNBTParseErrorTypeToCode = {
    /**
     * An error that occurred because a disallowed type was found in a typed array.
     */
    DisallowedTypeInTypedArray: "disallowed-type-in-typed-array",
    /**
     * An error that occurred because an expected compound or list was not found.
     */
    ExpectedCompoundOrList: "expected-compound-or-list",
    /**
     * An error that occurred because an argument to a function was invalid.
     */
    InvalidArgumentToFunction: "invalid-argument-to-function",
    /**
     * An error that occurred because an SNBT key was invalid.
     */
    InvalidSNBTKey: "invalid-snbt-key",
    /**
     * An error that occurred because an SNBT string was invalid.
     */
    InvalidSNBTString: "invalid-snbt-string",
    /**
     * An error that occurred because a UUID was invalid.
     */
    InvalidUUID: "invalid-uuid",
    /**
     * An error that occurred because an unsupported function was called.
     */
    UnsupportedFunction: "unsupported-function",
    /**
     * An error that occurred because an unsupported SNBT primitive was found.
     */
    UnsupportedSNBTPrimitive: "unsupported-snbt-primitive",
    /**
     * An error that occurred because a list contained multiple types.
     */
    MixedListTypesNotAllowed: "mixed-list-types-not-allowed",
    /**
     * An error that occurred because an unsupported type was found in a typed array.
     */
    UnsupportedTypeInTypedArray: "unsupported-type-in-typed-array",
    /**
     * An error that occurred because the end of the input was expected.
     */
    ExpectedEndOfInput: "expected-end-of-input",
} as const satisfies Record<SNBTParseErrorType, string>;

/**
 * The namespace of SNBT parse errors.
 */
export const SNBTParseErrorDisplayNamespace = "mcbe-leveldb";

/**
 * A stack item in an SNBT parse error.
 */
export type SNBTParseErrorCauseStackItem =
    | {
          /**
           * The position of the error in the input.
           */
          positionInInput: number;
          /**
           * The input.
           */
          input: any;
          /**
           * The function associated with this stack item.
           */
          function: "parseSNBTPrimitive";
          /**
           * The error associated with this stack item.
           */
          error?:
              | {
                    /**
                     * The type of this error.
                     */
                    type: "InvalidArgumentToFunction";
                    /**
                     * The name of the function.
                     */
                    functionName: "bool" | "uuid";
                    /**
                     * The argument that caused this error.
                     */
                    argument: string;
                }
              | {
                    /**
                     * The type of this error.
                     */
                    type: "UnsupportedFunction";
                    /**
                     * The name of the unsupported function.
                     */
                    functionName: string;
                }
              | {
                    /**
                     * The type of this error.
                     */
                    type: "UnsupportedSNBTPrimitive";
                    /**
                     * The raw SNBT primitive value that caused this error.
                     */
                    raw: any;
                }
              | {
                    /**
                     * The type of this error.
                     */
                    type: "InvalidSNBTString";
                    /**
                     * The raw SNBT string value that caused this error.
                     */
                    raw: any;
                };
      }
    | {
          /**
           * The position of the error in the input.
           */
          positionInInput: number;
          /**
           * The input.
           */
          input: string;
          /**
           * The function associated with this stack item.
           */
          function: "uuidToIntArray";
          /**
           * The error associated with this stack item.
           */
          error: {
              /**
               * The type of this error.
               */
              type: "InvalidUUID";
              /**
               * The invalid UUID that caused this error.
               */
              uuid: string;
          };
      }
    | {
          /**
           * The position of the error in the input item.
           */
          positionInInputItem: number;
          /**
           * The input items (the items in the typed array).
           */
          inputItems: string[];
          /**
           * The input item associated with this stack item.
           */
          inputItem: string;
          /**
           * The index of the input item associated with this stack item.
           */
          inputItemIndex: number;
          /**
           * The type of the typed array associated with this stack item.
           */
          arrayType: `${TypedArrayLetterTypes.B | TypedArrayLetterTypes.S | TypedArrayLetterTypes.I | TypedArrayLetterTypes.L}`;
          /**
           * The function associated with this stack item.
           */
          function: "parseTypedArray";
          /**
           * The error associated with this stack item.
           */
          error?:
              | {
                    /**
                     * The type of this error.
                     */
                    type: "DisallowedTypeInTypedArray";
                    /**
                     * The type of the item that caused this error.
                     */
                    itemType: `${TypedArrayLetterTypes.B | TypedArrayLetterTypes.S | TypedArrayLetterTypes.I | TypedArrayLetterTypes.L}`;
                    /**
                     * The allowed types.
                     */
                    allowedTypes: `${TypedArrayLetterTypes.B | TypedArrayLetterTypes.S | TypedArrayLetterTypes.I | TypedArrayLetterTypes.L}`[];
                }
              | {
                    /**
                     * The type of this error.
                     */
                    type: "UnsupportedTypeInTypedArray";
                    /**
                     * Should only be undefined if the item is unable to be parsed.
                     */
                    itemType?: `${NBT.TagType}` | undefined;
                };
      }
    | {
          /**
           * The position of the error in the input item.
           */
          positionInInputItem: number;
          /**
           * The input items (the items in the list).
           */
          inputItems: string[];
          /**
           * The input item associated with this stack item.
           */
          inputItem: string;
          /**
           * The index of the input item associated with this stack item.
           */
          inputItemIndex: number;
          /**
           * The function associated with this stack item.
           */
          function: "parseList";
          /**
           * The error associated with this stack item.
           */
          error?: {
              /**
               * The type of this error.
               */
              type: "MixedListTypesNotAllowed";
              /**
               * The type of the item that caused this error.
               */
              itemType: `${NBT.TagType}`;
              /**
               * The detected type of the item that caused this error.
               */
              item: NBT.Tags[NBT.TagType];
              /**
               * The detected type of the list.
               */
              detectedArrayType: `${NBT.TagType}`;
          };
      }
    | {
          /**
           * The position of the error in the input.
           */
          positionInInput: number;
          /**
           * The input.
           */
          input: string;
          /**
           * The property key associated with this stack item.
           */
          key?: string;
          /**
           * The function associated with this stack item.
           */
          function: "extractSNBT" | "parseSNBTCompoundString";
          /**
           * The error associated with this stack item.
           */
          error?: {
              /**
               * The type of this error.
               */
              type: "InvalidSNBTKey";
              /**
               * The raw SNBT key value that caused this error.
               */
              raw: any;
          };
      };

/**
 * The cause of an SNBT parse error.
 */
export interface SNBTParseErrorCause {
    /**
     * The position of the error in the input.
     */
    position: number;
    /**
     * The stack trace of the error.
     */
    stack: [initialError: SNBTParseErrorCauseStackItem, ...outerStack: SNBTParseErrorCauseStackItem[]];
}

/**
 * Represents an error that occurred while parsing SNBT.
 *
 * @template T Whether the error's full stack has been resolved.
 */
export interface SNBTParseError<T extends boolean = boolean> extends Error {
    /**
     * The cause of the error.
     */
    cause: SNBTParseErrorCause;
    /**
     * Whether the error's full stack has been resolved.
     */
    isResolved: T;
    /**
     * The original input that caused the error.
     */
    originalInput: T extends true ? string : null;
    /**
     * Gets the position of the error in the input.
     *
     * @returns The position of the error in the input.
     */
    getErrorPosition(): T extends true ? [line: number, column: number] : null;
    /**
     * Gets the end position of the error in the input.
     *
     * @returns The end position of the error in the input.
     */
    getErrorEndPosition(): T extends true ? [line: number, column: number] : null;
    /**
     * Gets the position of the error in the input with an offset.
     *
     * @param offset The offset to add to the error position.
     * @returns The position of the error in the input.
     */
    getErrorPositionWithOffset(offset: number): T extends true ? [line: number, column: number] : null;
    /**
     * Gets the position of the error in the input for a stack item.
     *
     * @param stackItem The stack item to get the error position for.
     * @returns The position of the error in the input.
     */
    getErrorPositionForStackItem(stackItem: SNBTParseErrorCauseStackItem): [line: number, column: number];
}

/**
 * The options for an SNBT parse error.
 */
export interface SNBTParseErrorOptions extends ErrorOptions {
    /**
     * The cause of the error.
     */
    cause: SNBTParseErrorCause;
    /**
     * Whether the error's full stack has been resolved.
     *
     * Only set this to true if this was from a function that was not called by another SNBT parser function, if the SNBT parser has more to the stack, this should be false.
     *
     * @defaul false
     */
    resolved?: boolean | undefined;
    /**
     * Only set this if {@link resolved} is also true, this is the original input of the SNBT parser function.
     */
    originalInput?: string | undefined;
}

/**
 * The constructor for an SNBT parse error.
 */
export interface SNBTParseErrorConstructor extends Omit<ErrorConstructor, "prototype"> {
    /**
     * Creates a new SNBTParseError.
     *
     * @param message The message of the error.
     * @param options The options for the error.
     * @returns A new SNBTParseError.
     */
    new (message: string, options: SNBTParseErrorOptions): SNBTParseError;
    /**
     * Creates a new SNBTParseError.
     *
     * @param message The message of the error.
     * @param options The options for the error.
     * @returns A new SNBTParseError.
     */
    (message: string, options: SNBTParseErrorOptions): SNBTParseError;
    /**
     * The prototype of an SNBTParseError.
     */
    prototype: SNBTParseError;
}

/**
 * An SNBT parse error.
 */
export var SNBTParseError: SNBTParseErrorConstructor = new Proxy(
    /**
     * An SNBT parse error.
     */
    class SNBTParseError extends Error implements SNBTParseError {
        public declare cause: SNBTParseErrorCause;
        public isResolved: boolean = false;
        public originalInput: string | null = null;
        public constructor(message: string, options: SNBTParseErrorOptions) {
            if (arguments.length !== 2) throw new TypeError(`Incorrect number of arguments to constructor, expected 2 but got ${arguments.length} instead.`);
            if (typeof message !== "string") throw new TypeError(`Expected args[0] (message) to be a string but got ${typeof message} instead.`);
            if (typeof options !== "object" || options === null)
                throw new TypeError(`Expected args[1] (options) to be an object but got ${options === null ? "null" : typeof options} instead.`);
            if (typeof options.cause !== "object" || options.cause === null)
                throw new TypeError(`Expected options.cause to be an object but got ${options === null ? "null" : typeof options.cause} instead.`);
            super(message, options);
            this.isResolved = options.resolved ?? false;
            this.originalInput = options.originalInput ?? null;
        }
        public getErrorPosition(): [line: number, column: number] | null {
            if (!this.isResolved || this.originalInput === null) return null;
            const cause: SNBTParseErrorCause = this.cause;
            const position: SNBTParseErrorCause["position"] = cause.position;
            const input: string = this.originalInput;
            return [input.slice(0, position).split("\n").length, position - input.slice(0, position).lastIndexOf("\n") + 1];
        }
        public getErrorEndPosition(): [line: number, column: number] | null {
            if (!this.isResolved || this.originalInput === null) return null;
            const cause: SNBTParseErrorCause = this.cause;
            let offset: number = 0;
            const stackItem: SNBTParseErrorCauseStackItem = cause.stack[0];
            stackItemFunctionSwitcher: switch (stackItem.function) {
                case "extractSNBT":
                    switch (stackItem.error?.type) {
                        case "InvalidSNBTKey":
                            offset = stackItem.error.raw.length;
                            break stackItemFunctionSwitcher;
                        default:
                            offset = stackItem.input.length - stackItem.positionInInput;
                            break stackItemFunctionSwitcher;
                    }
                case "parseList":
                    switch (stackItem.error?.type) {
                        case "MixedListTypesNotAllowed":
                            offset = stackItem.inputItem.length - stackItem.positionInInputItem;
                            break stackItemFunctionSwitcher;
                        default:
                            offset = stackItem.inputItem.length - stackItem.positionInInputItem;
                            break stackItemFunctionSwitcher;
                    }
                case "parseSNBTCompoundString":
                    switch (stackItem.error?.type) {
                        case "InvalidSNBTKey":
                            offset = stackItem.error.raw.length;
                            break stackItemFunctionSwitcher;
                        default:
                            offset = stackItem.input.length - stackItem.positionInInput;
                            break stackItemFunctionSwitcher;
                    }
                case "parseSNBTPrimitive":
                    switch (stackItem.error?.type) {
                        case "InvalidArgumentToFunction":
                            offset = stackItem.error.argument.length;
                            break stackItemFunctionSwitcher;
                        case "UnsupportedFunction":
                            offset = stackItem.error.functionName.length;
                            break stackItemFunctionSwitcher;
                        case "UnsupportedSNBTPrimitive":
                            offset = stackItem.error.raw.length;
                            break stackItemFunctionSwitcher;
                        case "InvalidSNBTString":
                            offset = stackItem.error.raw.length;
                            break stackItemFunctionSwitcher;
                        default:
                            offset = stackItem.input.length - stackItem.positionInInput;
                            break stackItemFunctionSwitcher;
                    }
                case "parseTypedArray":
                    switch (stackItem.error?.type) {
                        case "DisallowedTypeInTypedArray":
                            offset = stackItem.inputItem.length - stackItem.positionInInputItem;
                            break stackItemFunctionSwitcher;
                        case "UnsupportedTypeInTypedArray":
                            offset = stackItem.inputItem.length - stackItem.positionInInputItem;
                            break stackItemFunctionSwitcher;
                        default:
                            offset = stackItem.inputItem.length - stackItem.positionInInputItem;
                            break stackItemFunctionSwitcher;
                    }
                case "uuidToIntArray":
                    offset = stackItem.error.uuid.length;
                    break;
            }
            const position: SNBTParseErrorCause["position"] = cause.position + offset;
            const input: string = this.originalInput;
            return [input.slice(0, position).split("\n").length, position - input.slice(0, position).lastIndexOf("\n") + 1];
        }
        public getErrorPositionWithOffset(offset: number): [line: number, column: number] | null {
            if (!this.isResolved || this.originalInput === null) return null;
            const cause: SNBTParseErrorCause = this.cause;
            const position: SNBTParseErrorCause["position"] = cause.position + offset;
            const input: string = this.originalInput;
            return [input.slice(0, position).split("\n").length, position - input.slice(0, position).lastIndexOf("\n") + 1];
        }
        public getErrorPositionForStackItem(stackItem: SNBTParseErrorCauseStackItem): [line: number, column: number] {
            const input: string = "input" in stackItem ? stackItem.input : stackItem.inputItem;
            const position: number = "positionInInput" in stackItem ? stackItem.positionInInput : stackItem.positionInInputItem;
            return [input.slice(0, position).split("\n").length, position - input.slice(0, position).lastIndexOf("\n") + 1];
        }
    } as unknown as SNBTParseErrorConstructor,
    {
        apply(target: SNBTParseErrorConstructor, thisArg: any, argumentsList: [any, any]): SNBTParseError {
            return new target(...argumentsList);
        },
    }
);

/**
 * Options for parsing an SNBT-like primitive.
 *
 * @internal
 */
interface ParseSNBTPrimitiveOptions extends ParseSNBTBaseOptions {}

/**
 * Parses an SNBT-like primitive.
 *
 * @internal
 */
function parseSNBTPrimitive(
    raw: any,
    options: ParseSNBTPrimitiveOptions & { keepGoingAfterError: true }
): { value?: NBT.Tags[NBT.TagType]; errors: SNBTParseError[] };
/**
 * Parses an SNBT-like primitive.
 *
 * @internal
 */
function parseSNBTPrimitive(raw: any, options?: ParseSNBTPrimitiveOptions & { keepGoingAfterError?: false }): NBT.Tags[NBT.TagType];
/**
 * Parses an SNBT-like primitive.
 *
 * @internal
 */
function parseSNBTPrimitive(raw: any, options?: ParseSNBTPrimitiveOptions): NBT.Tags[NBT.TagType] | { value?: NBT.Tags[NBT.TagType]; errors: SNBTParseError[] };
function parseSNBTPrimitive(
    raw: any,
    options: ParseSNBTPrimitiveOptions = {}
): NBT.Tags[NBT.TagType] | { value?: NBT.Tags[NBT.TagType]; errors: SNBTParseError[] } {
    const errors: SNBTParseError[] = [];
    function structureResult(val?: NBT.Tags[NBT.TagType]): ReturnType<typeof parseSNBTPrimitive> {
        if (options.keepGoingAfterError) return { value: val, errors };
        return val!;
    }
    try {
        if (typeof raw === "string") {
            const originalInput: string = raw;
            raw = raw.trim();

            const funcMatch: RegExpMatchArray | null = raw.match(/^(\w+)\((.*)\)$/s);
            if (funcMatch) {
                const fn: string = funcMatch[1]!;
                const arg: string = funcMatch[2]!.trim();
                switch (fn) {
                    case "bool": {
                        const baseVal = parseSNBTPrimitive(arg, options);
                        if ("errors" in baseVal) {
                            baseVal.errors.forEach((err: SNBTParseError): void => {
                                err.cause.stack.push({
                                    input: originalInput,
                                    positionInInput: originalInput.indexOf(raw) + fn.length + 1,
                                    function: "parseSNBTPrimitive",
                                });
                                err.cause.position += originalInput.indexOf(raw) + fn.length + 1;
                            });
                            errors.push(...baseVal.errors);
                        }
                        const val = "errors" in baseVal ? baseVal.value : baseVal;
                        if (!val) return structureResult();
                        if (val.type === "short" || val.type === "int" || val.type === "long" || val.type === "float" || val.type === "double") {
                            const num: number = Number(toPrimitive(val));
                            return structureResult(NBT.byte(num === 0 ? 0 : 1));
                        }
                        if (val.type === "byte") return val;
                        throw new SNBTParseError(`Invalid argument to bool(): ${arg}`, {
                            cause: {
                                position: originalInput.indexOf(raw) + fn.length + 1,
                                stack: [
                                    {
                                        input: originalInput,
                                        positionInInput: originalInput.indexOf(raw) + fn.length + 1,
                                        function: "parseSNBTPrimitive",
                                        error: { type: "InvalidArgumentToFunction", functionName: "bool", argument: arg },
                                    },
                                ],
                            },
                        });
                    }
                    case "uuid": {
                        const uuidStr: string = arg.replace(/^["']|["']$/g, "");
                        try {
                            const uuidIntArray: number[] = uuidToIntArray(uuidStr);
                            return structureResult(NBT.intArray(uuidIntArray));
                        } catch (e) {
                            if (e instanceof Error && e.cause) {
                                (e.cause as SNBTParseErrorCause).stack.push({
                                    positionInInput: originalInput.indexOf(raw) + fn.length + 1,
                                    input: originalInput,
                                    function: "parseSNBTPrimitive",
                                    error: {
                                        type: "InvalidArgumentToFunction",
                                        functionName: "uuid",
                                        argument: arg,
                                    },
                                });
                                (e.cause as SNBTParseErrorCause).position += originalInput.indexOf(raw) + fn.length + 1;
                            }
                            throw e;
                        }
                    }
                    default:
                        throw (
                            (new ReferenceError(`Unsupported SNBT function: ${fn}`),
                            {
                                cause: {
                                    position: originalInput.indexOf(raw) + fn.length + 1,
                                    stack: [
                                        {
                                            input: originalInput,
                                            positionInInput: originalInput.indexOf(raw) + fn.length + 1,
                                            function: "parseSNBTPrimitive",
                                            error: { type: "UnsupportedFunction", functionName: fn },
                                        },
                                    ],
                                } as const satisfies SNBTParseErrorCause,
                            })
                        );
                }
            }

            const arrMatch: RegExpMatchArray | null = raw.match(/^\[(B|S|I|L);\s*(.*?)\]$/is);
            if (arrMatch) {
                const type = arrMatch[1]!.toUpperCase() as "B" | "S" | "I" | "L";
                const items: string[] = arrMatch[2]!.split(/\s*,\s*/).filter(Boolean);
                const baseVal = parseTypedArray(type, items, options);
                if ("errors" in baseVal) {
                    baseVal.errors.forEach((err: SNBTParseError): void => {
                        const lastStackItem = err.cause.stack.at(-1)! as Extract<SNBTParseErrorCauseStackItem, { function: "parseTypedArray" }>;
                        const baseOffset: number = arrMatch[2]!.match(new RegExp(`^(.*?\\s*(,\\s*|$)){${lastStackItem.inputItemIndex}}`))?.[0]?.length ?? 0;
                        err.cause.stack.push({
                            input: originalInput,
                            positionInInput: originalInput.indexOf(raw) + raw.indexOf(arrMatch[2]) + baseOffset,
                            function: "parseSNBTPrimitive",
                        });
                        err.cause.position += originalInput.indexOf(raw) + raw.indexOf(arrMatch[2]) + baseOffset;
                    });
                    errors.push(...baseVal.errors);
                }
                return structureResult("errors" in baseVal ? baseVal.value : baseVal);
            }

            const listMatch: RegExpMatchArray | null = raw.match(/^\[\s*(.*?)\]$/is);
            if (listMatch) {
                const baseVal = extractSNBT(raw, options);
                if ("errors" in baseVal) {
                    baseVal.errors.forEach((err: SNBTParseError): void => {
                        err.cause.stack.push({
                            input: originalInput,
                            positionInInput: originalInput.indexOf(raw),
                            function: "parseSNBTPrimitive",
                        });
                        err.cause.position += originalInput.indexOf(raw);
                    });
                    errors.push(...baseVal.errors);
                }
                return structureResult("errors" in baseVal ? baseVal.value : baseVal.value);
            }

            const match: RegExpMatchArray | null = raw.match(/^([-+]?0x[\da-fA-F]+|0b[01]+|[-+]?\d*\.?\d*(?:[eE][-+]?\d+)?)([bsilfdBSILFD])?$/i);
            if (match) {
                const numStr: string = match[1]!;
                const suffix: string | undefined = match[2]?.toLowerCase();
                let value: number | bigint;
                if (numStr.startsWith("0x")) value = parseInt(numStr, 16);
                else if (numStr.startsWith("0b")) value = parseInt(numStr.slice(2), 2);
                else if (suffix === "l") value = BigInt(numStr);
                else value = Number(numStr);

                switch (suffix) {
                    case "b":
                        return structureResult(NBT.byte(Number(value)));
                    case "s":
                        return structureResult(NBT.short(Number(value)));
                    case "i":
                        return structureResult(NBT.int(Number(value)));
                    case "l":
                        return structureResult(NBT.long(toLongParts(BigInt(value))));
                    case "f":
                        return structureResult(NBT.float(Number(value)));
                    case "d":
                        return structureResult(NBT.double(Number(value)));
                    default:
                        if (typeof value === "bigint") return structureResult(NBT.long(toLongParts(value)));
                        if (Number.isInteger(value)) return structureResult(NBT.int(value));
                        return structureResult(NBT.double(value));
                }
            }

            if (["true", "false"].includes(raw)) return structureResult(NBT.byte(+(raw === "true")));

            try {
                return structureResult({
                    type: "string",
                    value: parseFormattedString(raw),
                });
            } catch {
                const error = new SNBTParseError("Invalid SNBT string: " + raw, {
                    cause: {
                        position: originalInput.indexOf(raw),
                        stack: [
                            {
                                function: "parseSNBTPrimitive",
                                input: originalInput,
                                positionInInput: originalInput.indexOf(raw),
                                error: {
                                    type: "InvalidSNBTString",
                                    raw,
                                },
                            },
                        ],
                    },
                });
                if (options.keepGoingAfterError) errors.push(error);
                else throw error;
                return structureResult();
            }
        }

        if (typeof raw === "number") {
            if (raw % 1 !== 0) return structureResult(NBT.double(raw));
            return structureResult(NBT.int(raw));
        }

        if (typeof raw === "bigint") return structureResult(NBT.long(toLongParts(raw)));
        if (typeof raw === "boolean") return structureResult(NBT.byte(+raw));

        throw new SNBTParseError("Unsupported SNBT primitive: " + raw, {
            cause: {
                position: 0,
                stack: [
                    {
                        function: "parseSNBTPrimitive",
                        input: raw,
                        positionInInput: 0,
                        error: {
                            type: "UnsupportedSNBTPrimitive",
                            raw,
                        },
                    },
                ],
            },
        });
    } catch (e) {
        if (options.keepGoingAfterError && e instanceof SNBTParseError) errors.push(e);
        else throw e;
        return structureResult();
    }
}

/**
 * The letter types of typed arrays.
 *
 * @internal
 */
enum TypedArrayLetterTypes {
    /**
     * A byte array.
     */
    B = "byte",
    /**
     * A short array.
     */
    S = "short",
    /**
     * An integer array.
     */
    I = "int",
    /**
     * A long array.
     */
    L = "long",
}

/**
 * A typed array.
 *
 * @internal
 */
type TypedArray = NBT.Tags[NBT.TagType.ByteArray | NBT.TagType.ShortArray | NBT.TagType.IntArray | NBT.TagType.LongArray];

function parseTypedArray(
    type: "B" | "S" | "I" | "L",
    items: string[],
    options: ParseSNBTBaseOptions & { keepGoingAfterError: true }
): { value: TypedArray; errors: SNBTParseError[] };
function parseTypedArray(type: "B" | "S" | "I" | "L", items: string[], options?: ParseSNBTBaseOptions & { keepGoingAfterError?: false }): TypedArray;
function parseTypedArray(
    type: "B" | "S" | "I" | "L",
    items: string[],
    options?: ParseSNBTBaseOptions
): TypedArray | { value: TypedArray; errors: SNBTParseError[] };
function parseTypedArray(
    type: "B" | "S" | "I" | "L",
    items: string[],
    options: ParseSNBTBaseOptions = {}
): TypedArray | { value: TypedArray; errors: SNBTParseError[] } {
    const errors: SNBTParseError[] = [];
    const values: any[] = [];

    let i: number = 0;
    for (const x of items) {
        try {
            if (/^-?\d+b$/i.test(x)) {
                const n: number = Number(x.slice(0, -1));
                if (type === "L") values.push(toLongParts(BigInt(n)));
                else if (!["B", "S", "I", "L"].includes(type))
                    throw new SNBTParseError(`Byte value not allowed in ${TypedArrayLetterTypes[type]} array: ${x}`, {
                        cause: {
                            position: 0,
                            stack: [
                                {
                                    function: "parseTypedArray",
                                    inputItems: items,
                                    inputItem: x,
                                    inputItemIndex: i,
                                    positionInInputItem: 0,
                                    arrayType: TypedArrayLetterTypes[type],
                                    error: {
                                        type: "DisallowedTypeInTypedArray",
                                        allowedTypes: [TypedArrayLetterTypes.B, TypedArrayLetterTypes.S, TypedArrayLetterTypes.I, TypedArrayLetterTypes.L],
                                        itemType: NBT.TagType.Byte,
                                    },
                                },
                            ],
                        },
                    });
                else values.push(n);
            } else if (/^-?\d+s$/i.test(x)) {
                const n: number = Number(x.slice(0, -1));
                if (type === "L") values.push(toLongParts(BigInt(n)));
                else if (!["S", "I", "L"].includes(type))
                    throw new SNBTParseError(`Short value not allowed in ${TypedArrayLetterTypes[type]} array: ${x}`, {
                        cause: {
                            position: 0,
                            stack: [
                                {
                                    function: "parseTypedArray",
                                    inputItems: items,
                                    inputItem: x,
                                    inputItemIndex: i,
                                    positionInInputItem: 0,
                                    arrayType: TypedArrayLetterTypes[type],
                                    error: {
                                        type: "DisallowedTypeInTypedArray",
                                        allowedTypes: [TypedArrayLetterTypes.B, TypedArrayLetterTypes.S, TypedArrayLetterTypes.I, TypedArrayLetterTypes.L],
                                        itemType: NBT.TagType.Short,
                                    },
                                },
                            ],
                        },
                    });
                else values.push(n);
            } else if (/^-?\d+l$/i.test(x)) {
                if (type !== "L")
                    throw new SNBTParseError(`Long value not allowed in ${TypedArrayLetterTypes[type]} array: ${x}`, {
                        cause: {
                            position: 0,
                            stack: [
                                {
                                    function: "parseTypedArray",
                                    inputItems: items,
                                    inputItem: x,
                                    inputItemIndex: i,
                                    positionInInputItem: 0,
                                    arrayType: TypedArrayLetterTypes[type],
                                    error: {
                                        type: "DisallowedTypeInTypedArray",
                                        allowedTypes: [TypedArrayLetterTypes.B, TypedArrayLetterTypes.S, TypedArrayLetterTypes.I, TypedArrayLetterTypes.L],
                                        itemType: NBT.TagType.Long,
                                    },
                                },
                            ],
                        },
                    });
                values.push(parseLong(x));
            } else if (/^-?\d+i?$/.test(x)) {
                const n: number = x.toLowerCase().endsWith("i") ? Number(x.slice(0, -1)) : Number(x);
                if (type === "L") values.push(toLongParts(BigInt(n)));
                else if (!["I", "L"].includes(type))
                    throw new SNBTParseError(`Int value not allowed in ${TypedArrayLetterTypes[type]} array: ${x}`, {
                        cause: {
                            position: 0,
                            stack: [
                                {
                                    function: "parseTypedArray",
                                    inputItems: items,
                                    inputItem: x,
                                    inputItemIndex: i,
                                    positionInInputItem: 0,
                                    arrayType: TypedArrayLetterTypes[type],
                                    error: {
                                        type: "DisallowedTypeInTypedArray",
                                        allowedTypes: [TypedArrayLetterTypes.B, TypedArrayLetterTypes.S, TypedArrayLetterTypes.I, TypedArrayLetterTypes.L],
                                        itemType: NBT.TagType.Int,
                                    },
                                },
                            ],
                        },
                    });
                else values.push(n);
            } else if (["true", "false"].includes(x)) {
                values.push(+(x === "true"));
            } else {
                throw new SNBTParseError(`Unsupported value in ${TypedArrayLetterTypes[type]} array: ${x}`, {
                    cause: {
                        position: 0,
                        stack: [
                            {
                                function: "parseTypedArray",
                                inputItems: items,
                                inputItem: x,
                                inputItemIndex: i,
                                positionInInputItem: 0,
                                arrayType: TypedArrayLetterTypes[type],
                                error: {
                                    type: "UnsupportedTypeInTypedArray",
                                    itemType: ((): `${NBT.TagType}` | undefined => {
                                        try {
                                            return parseSNBTPrimitive(x).type;
                                        } catch {
                                            return undefined;
                                        }
                                    })(),
                                },
                            },
                        ],
                    },
                });
            }
        } catch (e) {
            if (options.keepGoingAfterError && e instanceof SNBTParseError) errors.push(e);
            else throw e;
        }
        i++;
    }

    let result: TypedArray;

    switch (type) {
        case "B":
            result = NBT.byteArray(values as number[]);
            break;
        case "S":
            result = NBT.shortArray(values as number[]);
            break;
        case "I":
            result = NBT.intArray(values as number[]);
            break;
        case "L":
            result = NBT.longArray(values as [high: number, low: number][]);
            break;
    }

    return options.keepGoingAfterError ? { value: result, errors } : result;
}

interface ParseListOptions extends ParseSNBTBaseOptions {}

function parseList(items: string[], options: ParseListOptions & { keepGoingAfterError: true }): { value: NBT.List<NBT.TagType>; errors: SNBTParseError[] };
function parseList(items: string[], options?: ParseListOptions & { keepGoingAfterError?: false }): NBT.List<NBT.TagType>;
function parseList(items: string[], options?: ParseListOptions): NBT.List<NBT.TagType> | { value: NBT.List<NBT.TagType>; errors: SNBTParseError[] };
function parseList(items: string[], options: ParseListOptions = {}): NBT.List<NBT.TagType> | { value: NBT.List<NBT.TagType>; errors: SNBTParseError[] } {
    console.log(items, items.length);
    const errors: SNBTParseError[] = [];
    let values: NBT.Tags[NBT.TagType][] = [];
    let valueIndices: number[] = [];
    let i: number = 0;
    for (const x of items) {
        try {
            if (x.trim().startsWith("{")) {
                const baseVal = parseSNBTCompoundString(x, options);
                if ("errors" in baseVal) {
                    baseVal.errors.forEach((err) => {
                        err.cause.stack.push({
                            inputItem: x,
                            inputItemIndex: i,
                            inputItems: items,
                            positionInInputItem: 0,
                            function: "parseList",
                        });
                        err.cause.position += 0;
                    });
                    errors.push(...baseVal.errors);
                }
                values.push("errors" in baseVal ? baseVal.value : baseVal);
            } else {
                const baseVal = parseSNBTPrimitive(x, options);
                if ("errors" in baseVal) {
                    baseVal.errors.forEach((err) => {
                        err.cause.stack.push({
                            inputItem: x,
                            inputItemIndex: i,
                            inputItems: items,
                            positionInInputItem: 0,
                            function: "parseList",
                        });
                        err.cause.position += 0;
                    });
                    errors.push(...baseVal.errors);
                }
                const val = "errors" in baseVal ? baseVal.value : baseVal;
                if (val !== undefined) values.push(val);
            }
            valueIndices.push(i);
        } catch (e) {
            if (options.keepGoingAfterError && e instanceof SNBTParseError) errors.push(e);
            else throw e;
        }
        i++;
    }
    let type: `${NBT.TagType}` | undefined = values[0]?.type;
    if (
        type &&
        !values.every((v, i) => {
            if (v.type === type) {
                return true;
            }
            if (!(options.mixedListsAllowed ?? true)) {
                if (!options.keepGoingAfterError)
                    throw new SNBTParseError("Mixed list types not allowed.", {
                        cause: {
                            position: 0,
                            stack: [
                                {
                                    function: "parseList",
                                    inputItems: items,
                                    inputItem: items[i]!,
                                    inputItemIndex: valueIndices[i]!,
                                    positionInInputItem: 0,
                                    error: {
                                        type: "MixedListTypesNotAllowed",
                                        itemType: v.type,
                                        item: v,
                                        detectedArrayType: type,
                                    },
                                },
                            ],
                        },
                    });
            }
            return false;
        })
    ) {
        if (!(options.mixedListsAllowed ?? true) && options.keepGoingAfterError) {
            const numOfEachType = values.reduce((acc, v) => ({ ...acc, [v.type]: (acc[v.type] ?? 0) + 1 }), {} as Record<`${NBT.TagType}`, number>);
            const mostCommonType = Object.entries(numOfEachType).reduce((a, b) => (a[1] > b[1] ? a : b))[0] as `${NBT.TagType}`;
            for (let i: number = 0; i < values.length; i++) {
                if (values[i]!.type === mostCommonType) continue;
                errors.push(
                    new SNBTParseError("Mixed list types not allowed.", {
                        cause: {
                            position: 0,
                            stack: [
                                {
                                    function: "parseList",
                                    inputItems: items,
                                    inputItem: items[i]!,
                                    inputItemIndex: valueIndices[i]!,
                                    positionInInputItem: 0,
                                    error: {
                                        type: "MixedListTypesNotAllowed",
                                        itemType: values[i]!.type,
                                        item: values[i]!,
                                        detectedArrayType: type,
                                    },
                                },
                            ],
                        },
                    })
                );
            }
        }
        if (options.convertMixedListsToCompoundLists ?? true) values = values.map((v, i) => ({ type: NBT.TagType.Compound, value: { "": v } }));
    }
    const result = NBT.list({ type: values[0]?.type ?? "end", value: values.map((v) => v.value) }) as any;
    return options.keepGoingAfterError ? { value: result, errors } : result;
}

/**
 * Options for parsing SNBT.
 */
export interface ParseSNBTBaseOptions {
    /**
     * Whether to allow lists of mixed types.
     *
     * @default true
     */
    mixedListsAllowed?: boolean;
    /**
     * Whether to convert lists of mixed types to compound lists.
     *
     * @default true
     */
    convertMixedListsToCompoundLists?: boolean;
    /**
     * Whether the function is being called from within an inner stack of a parent SNBT parser function.
     *
     * This is internal only and should not be specified by users.
     *
     * @internal
     * @ignore
     *
     * @default false
     */
    isInnerStack?: boolean;
    /**
     * Whether to keep parsing the SNBT string even if there are errors.
     *
     * It will cause the function to return an object containing the errors, as well as the parts of the value that were able to be extracted.
     *
     * @default false
     */
    keepGoingAfterError?: boolean;
    /**
     * Whether to stop parsing the SNBT string at a negative depth.
     *
     * @default true
     */
    stopAtNegativeDepth?: boolean;
}

/**
 * The result of the {@link parseSNBTCompoundString} function when {@link ParseSNBTBaseOptions.keepGoingAfterError} is `true`.
 */
export type ParseSNBTCompoundStringResultWithErrors = {
    /**
     * The parsed SNBT compound.
     */
    value: Compound;
    /**
     * The errors that occurred while parsing the SNBT compound.
     */
    errors: SNBTParseError[];
};

/**
 * Parse an SNBT compound string into Prismarine-NBT JSON.
 *
 * @param input The SNBT compound string to parse.
 * @param options Options for parsing the SNBT compound string.
 * @returns The parsed SNBT compound.
 */
export function parseSNBTCompoundString(input: string, options: ParseSNBTBaseOptions & { keepGoingAfterError: true }): ParseSNBTCompoundStringResultWithErrors;
export function parseSNBTCompoundString(input: string, options?: ParseSNBTBaseOptions & { keepGoingAfterError?: false }): Compound;
export function parseSNBTCompoundString(input: string, options?: ParseSNBTBaseOptions): Compound | ParseSNBTCompoundStringResultWithErrors;
export function parseSNBTCompoundString(input: string, options: ParseSNBTBaseOptions = {}): Compound | ParseSNBTCompoundStringResultWithErrors {
    const errors: SNBTParseError[] = [];
    const originalInput: string = input;
    input = input.trim();

    if (input.startsWith("{")) {
        input = input.slice(1);
    }

    const result: Record<string, any> = {};
    let depth: number = 0;
    let currentValuePos: number = -1;
    let currentKey: string = "";
    let currentValue: string = "";
    let inString: string | null = null;

    function commitPair(): void {
        if (!currentKey) return;
        result[currentKey.trim()] = parseValue(currentValue.trim(), currentKey, currentValuePos);
        currentKey = "";
        currentValue = "";
        currentValuePos = -1;
    }

    function parseValue(val: string, key: string, pos: number): NBT.Tags[NBT.TagType] | undefined {
        const originalVal: string = val;
        val = val.trim();
        if (!val) return NBT.comp({});

        if (val.startsWith("{") && val.endsWith("}")) {
            const baseVal = parseSNBTCompoundString(val, { ...options, isInnerStack: true });
            if ("errors" in baseVal) {
                baseVal.errors.forEach((err: SNBTParseError): void => {
                    err.cause.stack.push({
                        input: originalInput,
                        positionInInput: originalInput.indexOf(input) + pos + originalVal.indexOf(val),
                        key,
                        function: "extractSNBT",
                    });
                    err.cause.position += originalInput.indexOf(input) + pos + originalVal.indexOf(val);
                });
                errors.push(...baseVal.errors);
            }
            return "errors" in baseVal ? baseVal.value : baseVal;
        }

        if (val.startsWith("[") && val.endsWith("]")) {
            const baseVal = parseSNBTPrimitive(val, { ...options, isInnerStack: true });
            if ("errors" in baseVal) {
                baseVal.errors.forEach((err: SNBTParseError): void => {
                    err.cause.stack.push({
                        input: originalInput,
                        positionInInput: originalInput.indexOf(input) + pos + originalVal.indexOf(val),
                        key,
                        function: "extractSNBT",
                    });
                    err.cause.position += originalInput.indexOf(input) + pos + originalVal.indexOf(val);
                });
                errors.push(...baseVal.errors);
            }
            return "errors" in baseVal ? baseVal.value : baseVal;
        }

        const baseVal = parseSNBTPrimitive(val, { ...options, isInnerStack: true });
        if ("errors" in baseVal) {
            baseVal.errors.forEach((err: SNBTParseError): void => {
                err.cause.stack.push({
                    input: originalInput,
                    positionInInput: originalInput.indexOf(input) + pos + originalVal.indexOf(val),
                    key,
                    function: "extractSNBT",
                });
                err.cause.position += originalInput.indexOf(input) + pos + originalVal.indexOf(val);
            });
            errors.push(...baseVal.errors);
        }
        return "errors" in baseVal ? baseVal.value : baseVal;
    }

    let readingKey: boolean = true;
    for (let i: number = 0; i < input.length; i++) {
        if (depth < 0) break;
        const c: string | undefined = input[i];

        if (c === '"' || c === "'") {
            if (inString === c) inString = null;
            else if (!inString) inString = c;
        }

        if (!inString) {
            if (c === ":" && readingKey) {
                readingKey = false;
                continue;
            } else if (c === "," && depth === 0) {
                commitPair();
                readingKey = true;
                continue;
            } else if (c === "{" || c === "[") {
                depth++;
            } else if (c === "}" || c === "]") {
                depth--;
                if (depth === -1) {
                    commitPair();
                    readingKey = true;
                    continue;
                }
                if ((options.stopAtNegativeDepth ?? true) && depth < 0) {
                    i++;
                    break;
                }
            }
        }

        if (readingKey) currentKey += c;
        else {
            currentValue += c;
            if (currentValuePos === -1 && depth === 0) currentValuePos = i;
        }
    }

    commitPair();

    const val = NBT.comp(
        Object.fromEntries(
            Object.entries(result)
                .map(([k, v]: [string, any]): [string | undefined, any] => [
                    ((): string | undefined => {
                        try {
                            return parseFormattedKey(k.trim());
                        } catch {
                            const error = new SNBTParseError("Invalid SNBT key: " + k.trim(), {
                                cause: {
                                    position: k.indexOf(k.trim()),
                                    stack: [
                                        {
                                            function: "parseSNBTCompoundString",
                                            input: k,
                                            positionInInput: k.indexOf(k.trim()),
                                            key: k.trim(),
                                            error: {
                                                type: "InvalidSNBTKey",
                                                raw: k.trim(),
                                            },
                                        },
                                    ],
                                },
                            });
                            if (options.keepGoingAfterError) errors.push(error);
                            else throw error;
                            return undefined;
                        }
                    })(),
                    v,
                ])
                .filter((v: [string | undefined, any]): v is [string, any] => v[0] !== undefined)
        )
    );

    return options.keepGoingAfterError ? { value: val, errors } : val;
}

/**
 * The result of the {@link extractSNBT} function when {@link ParseSNBTBaseOptions.keepGoingAfterError} is `false` or not provided.
 */
export interface ExtractSNBTResult {
    /**
     * The parsed value.
     */
    value: Compound | NBT.List<NBT.TagType>;
    /**
     * The start position of the parsed value in the input string.
     */
    startPos: number;
    /**
     * The end position of the parsed value in the input string.
     */
    endPos: number;
    /**
     * The remaining text after the parsed value.
     */
    remaining: string;
}

/**
 * The result of the {@link extractSNBT} function when {@link ParseSNBTBaseOptions.keepGoingAfterError} is `true`.
 */
export interface ExtractSNBTResultWithErrors extends ExtractSNBTResult {
    /**
     * The errors that occurred while parsing the input string.
     */
    errors: SNBTParseError[];
}

/**
 * Parses an SNBT string into Prismarine-NBT JSON.
 *
 * @param input The SNBT string to parse.
 * @param options The options to use when parsing the SNBT string.
 * @returns An object containing the parsed value, start position, end position, remaining text, and errors.
 */
export function extractSNBT(input: string, options: ParseSNBTBaseOptions & { keepGoingAfterError: true }): ExtractSNBTResultWithErrors;
export function extractSNBT(input: string, options?: ParseSNBTBaseOptions & { keepGoingAfterError?: false }): ExtractSNBTResult;
export function extractSNBT(input: string, options?: ParseSNBTBaseOptions): ExtractSNBTResult | ExtractSNBTResultWithErrors;
export function extractSNBT(input: string, options: ParseSNBTBaseOptions = {}): ExtractSNBTResult | ExtractSNBTResultWithErrors {
    const errors: SNBTParseError[] = [];
    const originalInput: string = input;
    input = input.trim();
    let resultType: "list" | "compound" = "compound";

    if (input.startsWith("{")) {
        input = input.slice(1);
        resultType = "compound";
    } else if (input.startsWith("[")) {
        input = input.slice(1);
        resultType = "list";
    }

    const result: Record<string, any> = {};
    const listResult: [value: string, pos: number][] = [];
    let depth: number = 0;
    let currentKey: string = "";
    let currentValue: string = "";
    let currentValuePos: number = -1;
    let inString: string | null = null;

    function commitPair(): void {
        if (resultType === "compound") {
            if (!currentKey) return;
            result[currentKey.trim()] = parseValue(currentValue.trim(), currentKey, currentValuePos);
            currentKey = "";
            currentValue = "";
            currentValuePos = -1;
        } else if (resultType === "list") {
            listResult.push([currentValue.trim(), currentValuePos + currentValue.indexOf(currentValue.trim())]);
            currentValue = "";
            currentValuePos = -1;
        }
    }

    function parseValue(val: string, key: string, pos: number) {
        const originalVal: string = val;
        val = val.trim();
        if (!val) return NBT.comp({});

        if (val.startsWith("{") && val.endsWith("}")) {
            const baseVal = parseSNBTCompoundString(val, { ...options, isInnerStack: true });
            if ("errors" in baseVal) {
                baseVal.errors.forEach((err) => {
                    err.cause.stack.push({
                        input: originalInput,
                        positionInInput: originalInput.indexOf(input) + pos + originalVal.indexOf(val),
                        key,
                        function: "extractSNBT",
                    });
                    err.cause.position += originalInput.indexOf(input) + pos + originalVal.indexOf(val);
                });
                errors.push(...baseVal.errors);
            }
            return "errors" in baseVal ? baseVal.value : baseVal;
        }

        if (val.startsWith("[") && val.endsWith("]")) {
            const baseVal = parseSNBTPrimitive(val, { ...options, isInnerStack: true });
            if ("errors" in baseVal) {
                baseVal.errors.forEach((err) => {
                    err.cause.stack.push({
                        input: originalInput,
                        positionInInput: originalInput.indexOf(input) + pos + originalVal.indexOf(val),
                        key,
                        function: "extractSNBT",
                    });
                    err.cause.position += originalInput.indexOf(input) + pos + originalVal.indexOf(val);
                });
                errors.push(...baseVal.errors);
            }
            return "errors" in baseVal ? baseVal.value : baseVal;
        }

        const baseVal = parseSNBTPrimitive(val, { ...options, isInnerStack: true });
        if ("errors" in baseVal) {
            baseVal.errors.forEach((err) => {
                err.cause.stack.push({
                    input: originalInput,
                    positionInInput: originalInput.indexOf(input) + pos + originalVal.indexOf(val),
                    key,
                    function: "extractSNBT",
                });
                err.cause.position += originalInput.indexOf(input) + pos + originalVal.indexOf(val);
            });
            errors.push(...baseVal.errors);
        }
        return "errors" in baseVal ? baseVal.value : baseVal;
    }

    let readingKey: boolean = resultType === "list" ? false : true;
    let bracketTypeStack: ("list" | "compound")[] = [resultType];
    let i: number = 0;
    for (i; i < input.length; i++) {
        const c: string | undefined = input[i];

        if (c === '"' || c === "'") {
            if (inString === c) inString = null;
            else if (!inString) inString = c;
        }

        if (!inString) {
            if (c === ":" && readingKey) {
                readingKey = false;
                continue;
            } else if (c === "," && depth === 0) {
                resultType !== "list" || currentValue.trim() !== "" ? commitPair() : ((currentKey = ""), (currentValue = ""), (currentValuePos = -1));
                if (resultType === "compound") readingKey = true;
                continue;
            } else if (c === "{" || c === "[") {
                bracketTypeStack.push(c === "{" ? "compound" : "list");
                depth++;
            } else if (c === "}" || c === "]") {
                bracketTypeStack.pop();
                depth--;
                if ((options.stopAtNegativeDepth ?? true) && depth < 0) {
                    i++;
                    break;
                }
            }
        }

        if (readingKey) currentKey += c;
        else {
            currentValue += c;
            if (currentValuePos === -1 && depth === 0) currentValuePos = i;
        }
    }

    resultType !== "list" || currentValue.trim() !== "" ? commitPair() : ((currentKey = ""), (currentValue = ""), (currentValuePos = -1));

    if (resultType === "list") {
        const baseVal = parseList(
            listResult.map(([v]: [value: string, pos: number]): string => v),
            { ...options, isInnerStack: true }
        );
        if ("errors" in baseVal) {
            baseVal.errors.forEach((err) => {
                const lastStackItem = err.cause.stack.at(-1)! as Extract<SNBTParseErrorCauseStackItem, { function: "parseTypedArray" }>;
                // console.log(listResult, lastStackItem, lastStackItem.inputItemIndex, err);
                const baseOffset: number = listResult[lastStackItem.inputItemIndex]![1];
                err.cause.stack.push({
                    input: originalInput,
                    positionInInput: originalInput.indexOf(input) + baseOffset,
                    function: "extractSNBT",
                });
                err.cause.position += originalInput.indexOf(input) + baseOffset;
            });
            errors.push(...baseVal.errors);
        }
        if (!options.isInnerStack) {
            errors.forEach((err: SNBTParseError): void => {
                err.isResolved = true;
                err.originalInput = originalInput;
            });
        }
        return {
            value: "errors" in baseVal ? baseVal.value : baseVal,
            remaining: originalInput.slice(i + originalInput.indexOf(input)),
            startPos: originalInput.indexOf(input),
            endPos: i + originalInput.indexOf(input),
            ...(options.keepGoingAfterError ? { errors } : undefined),
        };
    }

    if (!options.isInnerStack) {
        errors.forEach((err) => {
            err.isResolved = true;
            err.originalInput = originalInput;
        });
    }

    return {
        value: NBT.comp(
            Object.fromEntries(
                Object.entries(result)
                    .map(([k, v]: [string, any]): [string | undefined, any] => [
                        ((): string | undefined => {
                            try {
                                return parseFormattedKey(k.trim());
                            } catch {
                                const error = new SNBTParseError("Invalid SNBT key: " + k.trim(), {
                                    cause: {
                                        position: k.indexOf(k.trim()),
                                        stack: [
                                            {
                                                function: "parseSNBTCompoundString",
                                                input: k,
                                                positionInInput: k.indexOf(k.trim()),
                                                key: k.trim(),
                                                error: {
                                                    type: "InvalidSNBTKey",
                                                    raw: k.trim(),
                                                },
                                            },
                                        ],
                                    },
                                });
                                if (options.keepGoingAfterError) errors.push(error);
                                else throw error;
                                return undefined;
                            }
                        })(),
                        v,
                    ])
                    .filter((v: [string | undefined, any]): v is [string, any] => v[0] !== undefined)
            )
        ),
        remaining: originalInput.slice(i + originalInput.indexOf(input)),
        startPos: originalInput.indexOf(input),
        endPos: i + originalInput.indexOf(input),
        ...(options.keepGoingAfterError ? { errors } : undefined),
    };
}

// console.log(
//     parseSNBTCompoundString(`{
//     id: SculkCatalyst,
//     isMovable: 1b,
//     x: -345,
//     y: -40,
//     z: 449
// }`)
// );

// console.log(
//     prismarineToSNBT(
//         parseSNBTCompoundString(`{
//     "id": SculkCatalyst,
//     "isMovable": 1b,
//     "x": -345,
//     "y": -40,
//     "z": 449
// }`)
//     )
// );

// console.log(
//     snbtToPrismarine(
//         prismarineToSNBT(
//             parseSNBTCompoundString(`{
//     "id": SculkCatalyst,
//     "isMovable": 1b,
//     "x": -345,
//     "y": -40,
//     "z": 449
// }`)
//         )
//     )
// );

// console.log(
//     prettyPrintSNBT(
//         prismarineToSNBT(
//             parseSNBTCompoundString(`{
//     "id": SculkCatalyst,
//     "isMovable": 1b,
//     "x": -345,
//     "y": -40,
//     "z": 449
// }`)
//         ),
//         { indent: 4, inlineArrays: false }
//     )
// );

/**
 * Converts SNBT-like JSON into Prismarine-NBT JSON.
 *
 * @param snbt The SNBT-like JSON to convert.
 * @returns The Prismarine-NBT JSON.
 */
export function snbtToPrismarine(snbt: any): Compound {
    const value: Record<string, NBT.Tags[NBT.TagType]> = {};

    for (const [key, raw] of Object.entries(snbt)) {
        if (Array.isArray(raw)) {
            if (raw.length > 0 && typeof raw[0] === "object" && !Array.isArray(raw[0])) {
                value[key] = {
                    type: "list",
                    value: {
                        type: "compound",
                        value: raw.map((entry: any) => {
                            const inner: Record<string, NBT.Tags[NBT.TagType]> = {};
                            for (const [k, v] of Object.entries(entry)) {
                                inner[k] = snbtToPrismarine({ [k]: v });
                            }
                            return inner;
                        }),
                    },
                };
            } else {
                const parsed: NBT.Tags[NBT.TagType][] = raw.map((v) => parseSNBTPrimitive(v));
                const types = new Set(parsed.map((p: NBT.Tags[NBT.TagType]): `${NBT.TagType}` => p.type));
                if (types.size === 1) {
                    const type: `${NBT.TagType}` = [...types][0]!;
                    switch (type) {
                        case "byte":
                            value[key] = NBT.byteArray(parsed.map((p: NBT.Tags[NBT.TagType]): number => p.value as number));
                            continue;
                        case "short":
                            value[key] = NBT.shortArray(parsed.map((p: NBT.Tags[NBT.TagType]): number => p.value as number));
                            continue;
                        case "int":
                            value[key] = NBT.intArray(parsed.map((p: NBT.Tags[NBT.TagType]): number => p.value as number));
                            continue;
                        case "long":
                            value[key] = NBT.longArray(parsed.map((p: NBT.Tags[NBT.TagType]): [high: number, low: number] => p.value as [number, number]));
                            continue;
                    }
                }
                value[key] = {
                    type: "list",
                    value: {
                        type: parsed[0]?.type ?? "int",
                        value: parsed.map((p: NBT.Tags[NBT.TagType]): NBT.Tags[NBT.TagType]["value"] => p.value),
                    },
                };
            }
        } else if (typeof raw === "object" && raw !== null) {
            if ("__typed" in raw && "value" in raw) {
                value[key] = parseTypedArray(
                    raw.__typed as any,
                    (raw.value as any[]).map((v: any): string => (typeof v === "string" ? v : String(v)))
                );
            } else {
                value[key] = snbtToPrismarine(raw);
            }
        } else {
            value[key] = parseSNBTPrimitive(raw);
        }
    }

    return NBT.comp(value);
}

function formatString(s: string): string {
    const unquotedPattern = /^[A-Za-z_][A-Za-z0-9_\-\+\.]*$/;
    if (unquotedPattern.test(s)) return s;

    let quote: '"' | "'" = '"';
    if (!s.includes("'") && s.includes('"')) {
        quote = "'";
    }

    const escaped: string = s
        .replace(/\\/g, "\\\\")
        .replace(new RegExp(quote, "g"), "\\" + quote)
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r")
        .replace(/\t/g, "\\t")
        .replace(/\x08/g, "\\b")
        .replace(/\f/g, "\\f")
        .replaceAll(/([\0-\x1f\u2028\u2029\ud800-\udfff])/g, (string: string): string => {
            return `\\u${string.codePointAt(0)!.toString(16).padStart(4, "0")}`;
        });

    return `${quote}${escaped}${quote}`;
}

function formatKey(key: string): string {
    const unquotedPattern = /^[A-Za-z0-9_\-\+\.]+$/;
    if (unquotedPattern.test(key)) return key;
    return formatString(key);
}

function parseFormattedString(string: string): string {
    return string.startsWith('"') && string.endsWith('"')
        ? JSON.parse(string)
        : string.startsWith("'") && string.endsWith("'")
        ? JSON.parse('"' + string.replaceAll('"', '\\"').slice(1, -1) + '"')
        : /^[A-Za-z_][A-Za-z0-9_\-\+\.]*$/.test(string)
        ? string
        : ((): never => {
              throw new SyntaxError("Invalid SNBT string: " + string);
          })();
}

function parseFormattedKey(key: string): string {
    return /^[A-Za-z0-9_\-\+\.]+$/.test(key)
        ? key
        : key.startsWith('"') && key.endsWith('"')
        ? JSON.parse(key)
        : key.startsWith("'") && key.endsWith("'")
        ? JSON.parse('"' + key.replaceAll('"', '\\"').slice(1, -1) + '"')
        : /^[A-Za-z_][A-Za-z0-9_\-\+\.]*$/.test(key)
        ? key
        : ((): never => {
              throw new SyntaxError("Invalid SNBT key: " + key);
          })();
}

/**
 * The tag types of SNBT-like JSON.
 */
export enum SNBTLikeJSONTagType {
    /**
     * A byte.
     */
    Byte = "byte",
    /**
     * A short.
     */
    Short = "short",
    /**
     * An integer.
     */
    Int = "int",
    /**
     * A long.
     */
    Long = "long",
    /**
     * A float.
     */
    Float = "float",
    /**
     * A double.
     */
    Double = "double",
    /**
     * A string.
     */
    String = "string",
    /**
     * A list.
     */
    List = "list",
    /**
     * A compound.
     */
    Compound = "compound",
    /**
     * An array of bytes.
     */
    ByteArray = "byteArray",
    /**
     * An array of shorts.
     */
    ShortArray = "shortArray",
    /**
     * An array of integers.
     */
    IntArray = "intArray",
    /**
     * An array of longs.
     */
    LongArray = "longArray",
}

/**
 * The types of tag types of SNBT-like JSON.
 */
export type SNBTLikeJSONTags = {
    /**
     * A byte.
     */
    [SNBTLikeJSONTagType.Byte]: `${bigint}${"b" | "B"}`;
    /**
     * A short.
     */
    [SNBTLikeJSONTagType.Short]: `${bigint}${"s" | "S"}`;
    /**
     * An integer.
     */
    [SNBTLikeJSONTagType.Int]: `${bigint}${"" | "i" | "I"}`;
    /**
     * A long.
     */
    [SNBTLikeJSONTagType.Long]: `${bigint}${"l" | "L"}`;
    /**
     * A float.
     */
    [SNBTLikeJSONTagType.Float]: `${number}${"f" | "F"}`;
    /**
     * A double.
     */
    [SNBTLikeJSONTagType.Double]: `${number}${"d" | "D"}`;
    /**
     * A string.
     */
    [SNBTLikeJSONTagType.String]: `"${string}"` | `'${string}'` | `${string}`;
    /**
     * A list.
     */
    [SNBTLikeJSONTagType.List]: SNBTLikeJSONList<SNBTLikeJSONTagType>;
    /**
     * A compound.
     */
    [SNBTLikeJSONTagType.Compound]: SNBTLikeJSONCompound;
    /**
     * An array of bytes.
     */
    [SNBTLikeJSONTagType.ByteArray]: SNBTLikeJSONTypedArray<TypedArrayLetterTypes.B>;
    /**
     * An array of shorts.
     */
    [SNBTLikeJSONTagType.ShortArray]: SNBTLikeJSONTypedArray<TypedArrayLetterTypes.S>;
    /**
     * An array of integers.
     */
    [SNBTLikeJSONTagType.IntArray]: SNBTLikeJSONTypedArray<TypedArrayLetterTypes.I>;
    /**
     * An array of longs.
     */
    [SNBTLikeJSONTagType.LongArray]: SNBTLikeJSONTypedArray<TypedArrayLetterTypes.L>;
};

/**
 * A list tag of SNBT-like JSON.
 */
export type SNBTLikeJSONList<T extends SNBTLikeJSONTagType> = SNBTLikeJSONTags[T][];

/**
 * A typed array tag of SNBT-like JSON.
 */
export type SNBTLikeJSONTypedArray<T extends TypedArrayLetterTypes> = {
    /**
     * The type of the typed array.
     */
    __typed: keyof OmitNeverValueKeys<{ [key in keyof typeof TypedArrayLetterTypes]: (typeof TypedArrayLetterTypes)[key] extends T ? key : never }>;
    /**
     * The values of the typed array.
     */
    value: SNBTLikeJSONTags[VerifyConstraint<T, `${SNBTLikeJSONTagType}`>][];
};

/**
 * A compound tag of SNBT-like JSON.
 */
export type SNBTLikeJSONCompound = { [key: string]: SNBTLikeJSONTag<SNBTLikeJSONTagType> };

/**
 * An SNBT-like JSON tag.
 */
export type SNBTLikeJSONTag<T extends `${SNBTLikeJSONTagType}` | SNBTLikeJSONTagType> = { [key in SNBTLikeJSONTagType as `${key}`]: SNBTLikeJSONTags[key] }[T];

/**
 * Converts Prismarine-NBT JSON to SNBT-like JSON.
 *
 * @param nbt The Prismarine-NBT JSON to convert.
 * @returns The resulting SNBT-like JSON.
 */
export function prismarineToSNBT<T extends NBT.Tags[NBT.TagType]>(nbt: T): SNBTLikeJSONTag<T["type"]> {
    if (nbt.type === "compound") {
        const obj: SNBTLikeJSONCompound = {};
        for (const [key, val] of Object.entries(nbt.value)) {
            obj[key] = prismarineToSNBT(val!);
        }
        return obj as any;
    }

    if (nbt.type === "list") {
        if (nbt.value.type === "compound") {
            return nbt.value.value.map((entry: any): Record<string, any> => {
                const obj: Record<string, any> = {};
                for (const [k, v] of Object.entries(entry)) {
                    obj[k] = prismarineToSNBT(v as any);
                }
                return obj;
            }) as any;
        } else {
            return nbt.value.value.map((v) => prismarineToSNBT({ type: nbt.value.type, value: v as any })) as any;
        }
    }

    switch (nbt.type) {
        case "byteArray":
            return { __typed: "B", value: nbt.value.map((v: number): `${number}b` => `${v}b` as const) } as any;
        case "shortArray":
            return { __typed: "S", value: nbt.value.map((v: number): `${number}s` => `${v}s` as const) } as any;
        case "intArray":
            return { __typed: "I", value: nbt.value.map((v: number): `${number}` => `${v}` as const) } as any;
        case "longArray":
            return { __typed: "L", value: nbt.value.map((v: [number, number]): `${bigint}L` => `${toLong(v)}L` as const) } as any;
    }

    switch (nbt.type) {
        case "byte":
            return `${nbt.value}b` as const as any;
        case "short":
            return `${nbt.value}s` as const as any;
        case "int":
            return nbt.value as any;
        case "long":
            return `${toLong(nbt.value).toString()}L` as const as any;
        case "float":
            return `${nbt.value}f` as const as any;
        case "double":
            return `${nbt.value}d` as const as any;
        case "string":
            return formatString(nbt.value) as any;
    }

    return (nbt as any).value;
}

/**
 * Converts a long in bigint format to tuple form.
 *
 * @param longVal The long as a bigint.
 * @returns The long as a tuple.
 */
export function toLongParts(longVal: bigint): [high: number, low: number] {
    const low: number = Number(longVal & 0xffffffffn) | 0;
    const high: number = Number((longVal >> 32n) & 0xffffffffn) | 0;
    return [high, low];
}

/**
 * Converts a long as a string to a tuple.
 *
 * @param literal A long as a string.
 * @returns The long as a tuple.
 */
export function parseLong(literal: string): [high: number, low: number] {
    const numStr: string = literal.slice(0, -1);
    const value: bigint = BigInt(numStr);
    return toLongParts(value);
}

/**
 * Converts a long in tuple form to bigint form.
 *
 * @param param0 The long as a tuple.
 * @returns The long as a bigint.
 */
export function toLong([high, low]: [high: number, low: number]): bigint {
    const lo: bigint = BigInt(low) & BigInt(0xffffffff);
    const hi: bigint = BigInt(high);
    return (hi << 32n) | lo;
}

/**
 * Options for {@link prettyPrintSNBT}.
 */
export interface PrettyPrintOptions {
    /**
     * Number of spaces to indent.
     *
     * @default 2
     */
    indent?: number;
    /**
     * Whether to inline arrays if possible.
     *
     * @default true
     */
    inlineArrays?: boolean;
    /**
     * Maximum length of an inline array.
     *
     * @default 40
     */
    maxInlineLength?: number;
}

/**
 * Pretty-prints SNBT.
 *
 * @param obj The SNBT-like JSON to pretty-print.
 * @param options The options to use.
 * @returns The pretty-printed SNBT.
 *
 * @example
 * ```typescript
 * prettyPrintSNBT(prismarineToSNBT({
 *     type: "compound",
 *     value: {
 *         enabled: {
 *             type: "byte",
 *             value: 1
 *         }
 *     }
 * }))
 * ```
 */
export function prettyPrintSNBT(obj: any, options: PrettyPrintOptions = {}): string {
    const { indent = 2, inlineArrays = true, maxInlineLength = 40 } = options;

    function format(value: any, level: number): string {
        const pad: string = " ".repeat(level * indent);

        if (value && typeof value === "object" && value.__typed) {
            const type: "B" | "S" | "I" | "L" = value.__typed;
            const inner: string = value.value.join(", ");
            return `[${type}; ${inner}]`;
        }

        if (Array.isArray(value)) {
            if (value.length === 0) return "[]";
            const inline = `[${value.map((v: any): string => format(v, 0)).join(", ")}]`;
            if (inlineArrays && inline.length <= maxInlineLength && !value.some((v: any): boolean => typeof v === "object")) {
                return inline;
            }
            return "[\n" + value.map((v: any): string => pad + " ".repeat(indent) + format(v, level + 1)).join(",\n") + "\n" + pad + "]";
        }

        if (typeof value === "object" && value !== null) {
            const entries: [string, unknown][] = Object.entries(value);
            if (entries.length === 0) return "{}";

            return (
                "{\n" +
                entries.map(([k, v]: [string, unknown]): string => pad + " ".repeat(indent) + `${formatKey(k)}: ${format(v, level + 1)}`).join(",\n") +
                "\n" +
                pad +
                "}"
            );
        }

        return String(value);
    }

    return format(obj, 0);
}
