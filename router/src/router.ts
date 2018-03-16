// satisfy existing argument type
export interface PathArg<TypeMap> { [name: string]: keyof TypeMap }

// map argument type
export type ArgMap<TypeMap, Arg extends PathArg<TypeMap>> = {[Name in keyof Arg]: TypeMap[Arg[Name]]};

export interface TypeImpl<Type> {
    match(path: string): [Type, string] | void;
    build(arg: Type): string;
}

export type TypeApi<TypeMap> = {[Tag in keyof TypeMap]: TypeImpl<TypeMap[Tag]>};

export interface Route<TypeMap, Args extends PathArg<TypeMap>> {
    // argument type IO API
    api: TypeApi<TypeMap>;
    // add extra types
    extra<ExtraTypeMap, ExtraArgs extends PathArg<TypeMap & ExtraTypeMap>>(api: TypeApi<ExtraTypeMap>): Route<TypeMap & ExtraTypeMap, Args & ExtraArgs>;

    // create sub route using path piece
    route(path: string): Route<TypeMap, Args>;
    // create sub route using argument
    route<Arg extends PathArg<TypeMap>>(arg: Arg): Route<TypeMap, Args & Arg>;

    // match beginning of path
    begin(path: string): [ArgMap<TypeMap, Args>, string] | void;
    // match path to end
    match(path: string): ArgMap<TypeMap, Args> | void;
    // build path from arguments
    build(args: ArgMap<TypeMap, Args>): string;
}

function extra<TypeMap, Args extends PathArg<TypeMap>, ExtraTypeMap, ExtraArgs extends PathArg<TypeMap & ExtraTypeMap>>(this: Route<TypeMap, Args>, api: TypeApi<ExtraTypeMap>): Route<TypeMap & ExtraTypeMap, Args & ExtraArgs> {
    return { ...<any>this, api: { ...<any>this.api, ...<any>api } };
}

function route<TypeMap, Args extends PathArg<TypeMap>, Arg extends PathArg<TypeMap>>(this: Route<TypeMap, Args>, arg: string | Arg): Route<TypeMap, Args & Arg> {
    const { api, begin: begin_ } = this;
    const ent: string | {
        key: keyof Arg;
        tag: keyof TypeMap;
        api: TypeImpl<TypeMap[keyof TypeMap]>;
    } = typeof arg == 'string' ? encodeURI(arg) : (() => {
        for (const key in arg) {
            const tag = arg[key];
            return { key, tag, api: api[tag] };
        }
        throw 'No arg';
    })();

    const begin: (path: string) => [ArgMap<TypeMap, Args & Arg>, string] | void = typeof ent == 'string' ? (path: string) => {
        const res = begin_(path);
        if (!res) return;
        const [data, rest] = res;
        if (rest.substr(0, ent.length) != ent) return;
        return [data, rest.substr(ent.length)];
    } : (path: string) => {
        const res = begin_(path);
        if (!res) return;
        const [data, rest] = res;
        const res_ = ent.api.match(rest);
        if (!res_) return;
        const [val, rest_] = res_;
        data[ent.key as keyof Arg] = val;
        return [data, rest_];
    };

    const match: (path: string) => ArgMap<TypeMap, Args & Arg> | void = (path: string) => {
        const res = begin(path);
        if (!res || res[1] != '') return;
        return res[0];
    };

    const build: (args: ArgMap<TypeMap, Args & Arg>) => string = typeof ent == 'string' ?
        args => this.build(args) + ent :
        args => this.build(args) + ent.api.build(args[ent.key as keyof Arg]);

    return { api, extra: <any>extra, route, begin, match, build };
}

function make<TypeMap>(api: TypeApi<TypeMap>): Route<TypeMap, {}> {
    return {
        api, extra: <any>extra, route,
        begin: (path: string) => [{}, path],
        match: (path: string) => path == '' ? {} : void 0,
        build: (args: {}) => ''
    };
}

export type StateArg<TypeMap, Key extends string, Arg extends PathArg<TypeMap>> = {[Id in Key]: Arg};
export type StateMap<TypeMap, Key extends string, Arg extends PathArg<TypeMap>> = {[Id in Key]?: ArgMap<TypeMap, Arg>};

export type Routes<TypeMap, Key extends string, Arg extends PathArg<TypeMap>> = {[Id in Key]: Route<TypeMap, Arg>};

export interface Router<TypeMap, Key extends string, Arg extends PathArg<TypeMap>> {
    routes: Routes<TypeMap, Key, Arg>;

    // match path to end
    match(path: string): StateMap<TypeMap, Key, Arg> | void;
    // build path from arguments
    build(state: StateMap<TypeMap, Key, Arg>): string;

    // add route to router
    add<OtherTypeMap, OtherKey extends string, OtherArg extends PathArg<OtherTypeMap>>(route: Routes<OtherTypeMap, OtherKey, OtherArg>): Router<TypeMap & OtherTypeMap, Key | OtherKey, Arg | OtherArg>;
}

function merge<TypeMap, Key extends string, Arg extends PathArg<TypeMap>, OtherTypeMap, OtherKey extends string, OtherArg extends PathArg<OtherTypeMap>>(this: Router<TypeMap, Key, Arg>, route: Routes<OtherTypeMap, OtherKey, OtherArg>): Router<TypeMap & OtherTypeMap, Key | OtherKey, Arg | OtherArg> {
    const routes: Routes<TypeMap & OtherTypeMap, Key | OtherKey, Arg | OtherArg> = { ...<any>this.routes, ...<any>route };

    const match = (path: string) => {
        let state: StateMap<TypeMap & OtherTypeMap, Key | OtherKey, Arg | OtherArg> | void;
        for (const id in routes) {
            const args = (routes as any)[id].match(path);
            if (args) {
                if (!state) state = {} as StateMap<TypeMap & OtherTypeMap, Key | OtherKey, Arg | OtherArg>;
                (state as any)[id] = args;
            }
        }
        return state;
    }

    const build = (state: StateMap<TypeMap & OtherTypeMap, Key | OtherKey, Arg | OtherArg>) => {
        for (const id in state) {
            const args = (state as any)[id];
            if (args) {
                return (routes as any)[id].build(args);
            }
        }
        throw 'Not route';
    };

    return { routes, match, build, add: merge } as any;
}

export const Route = { new: make, mix: <TypeMap, Key extends string, Arg extends PathArg<TypeMap>>(route: Routes<TypeMap, Key, Arg>): Router<TypeMap, Key, Arg> => merge.call({}, route) };

export interface BaseTypes {
    str: string;
    num: number;
}

export const baseTypes: TypeApi<BaseTypes> = {
    str: {
        match: path => {
            const m = path.match(/^([^\/\?]+)(.*)$/);
            if (m) return [decodeURIComponent(m[1]), m[2]];
        },
        build: arg => encodeURIComponent(arg)
    },
    num: {
        match: path => {
            const m = path.match(/^(\-?\d+(?:\.\d+)?)(.*)$/);
            if (m) return [parseInt(m[1]), m[2]];
        },
        build: arg => `${arg}`
    }
};

export interface NumTypes {
    nat: number;
    int: number;
}

export const numTypes: TypeApi<NumTypes> = {
    nat: {
        match: path => {
            const m = path.match(/^(\d+)(.*)$/);
            if (m) return [parseInt(m[1]), m[2]];
        },
        build: arg => `${Math.max(Math.round(arg), 0)}`
    },
    int: {
        match: path => {
            const m = path.match(/^(\-?\d+)(.*)$/);
            if (m) return [parseInt(m[1]), m[2]];
        },
        build: arg => `${Math.round(arg)}`
    }
};
