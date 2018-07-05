export interface JSTypeMap {
    'string': string;
    'number': number;
    'boolean': boolean;
    'undefined': undefined;
    'function': Function;
    'object': object;
}

export type JSTypeName<Type> =
    Type extends string ? 'string' :
    Type extends number ? 'number' :
    Type extends boolean ? 'boolean' :
    Type extends undefined ? 'undefined' :
    Type extends Function ? 'function' :
    'object';
