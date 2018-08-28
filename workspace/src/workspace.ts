#!/usr/bin/env node
/* -*- mode: typescript -*- */

import { join, relative } from 'path';
import { readFileSync, lstatSync, writeFileSync } from 'fs';
import { spawnSync } from 'child_process';
import { moveSync, removeSync, mkdirpSync } from 'fs-extra';

const args = process.argv.slice(2);

interface Command {
    args: string;
    help: string;
    run: (packages: PackagesInfo, ...args: string[]) => void;
}

const commands: Record<string, Command> = {
    show: {
        args: '[package]', help: 'Show package(s) info',
        run: (packages: PackagesInfo, pkg?: string) => { for_packages(packages, show_package, pkg); }
    },
    install: {
        args: '[package]', help: 'Install package(s)',
        run: (packages: PackagesInfo, pkg?: string) => { for_packages(packages, install_package, pkg); }
    },
    test: {
        args: '[package]', help: 'Test package(s)',
        run: (packages: PackagesInfo, pkg?: string) => { for_packages(packages, test_package, pkg); }
    },
    pack: {
        args: '[package]', help: 'Pack package(s)',
        run: (packages: PackagesInfo, pkg?: string) => { for_packages(packages, pack_package, pkg); }
    },
    run: {
        args: '<script> [package] [-- <...arguments>]', help: 'Run script for package(s)',
        run: (packages: PackagesInfo, name: string, ...args: string[]) => {
            let pkg: string | undefined;
            if (args.length > 0 && args[0] != '--') {
                pkg = args[0];
                args.shift();
            }
            if (args.length > 0 && args[0] == '--') {
                args.shift();
            }
            for_packages(packages, run_script(name, ...args), pkg);
        }
    },
    purge: {
        args: '[package]', help: 'Clean package(s) installation',
        run: (packages: PackagesInfo, pkg?: string) => {
            for_packages(packages, purge_package, pkg);
            if (!pkg) purge_package_path('.');
        }
    },
    unlock: {
        args: '[package]', help: 'Remove package(s) lock file (package-lock.json)',
        run: (packages: PackagesInfo, pkg?: string) => {
            for_packages(packages, unlock_package, pkg);
            if (!pkg) remove_package_lock('.');
        }
    },
    modify: {
        args: '<link-deps,unlink-deps> [package]', help: 'Modify package(s) manifest (package.json)',
        run: (packages: PackagesInfo, op: string, pkg?: string) => {
            const op_ = op == 'link-deps' ? PackageJsonOp.LinkDeps :
                op == 'unlink-deps' ? PackageJsonOp.UnlinkDeps :
                    undefined;
            if (op_) {
                for_packages(packages, modify_package_json(op_), pkg);
            } else {
                console.log('Please specify correct operation: link-deps, unlink-deps.');
            }
        }
    }
};

if (!args.length || !commands[args[0]]) {
    console.log(`Usage: workspace <command> <...arguments>
Commands:`);
    for (const name in commands) {
        const { args, help } = commands[name];
        console.log(`  ${name} ${args}\t\t${help}`);
    }
} else {
    commands[args[0]].run(list_packages(), ...args.slice(1));
}

interface PackageInfo {
    path: string;
    name: string;
    vers: string;
    scrs: string[];
    deps: string[];
}

type PackagesInfo = Record<string, PackageInfo>;

function list_packages(): PackagesInfo {
    const packages: PackagesInfo = {};
    const json = read_package_json('.');
    if (json && json.packages) {
        for (const path of json.packages) {
            const json = read_package_json(path);
            if (json) {
                const { name, version, scripts, dependencies, devDependencies, peerDependencies } = json;
                const deps: string[] = [
                    ...Object.keys(dependencies || {}),
                    ...Object.keys(devDependencies || {}),
                    ...Object.keys(peerDependencies || {}),
                ];
                packages[name] = { path, name, vers: version, deps, scrs: Object.keys(scripts || {}) };
            }
        }
    }
    for (const name in packages) {
        const pkg = packages[name];
        pkg.deps = pkg.deps.filter(name => name in packages);
    }
    for (const name in packages) {
        const pkg = packages[name];
        pkg.deps = all_dependencies(packages, name);
    }
    return packages;
}

function all_dependencies(packages: PackagesInfo, name: string, all_deps: string[] = []): string[] {
    const { deps } = packages[name];

    for (const dep of deps) {
        all_dependencies(packages, dep, all_deps);
        if (all_deps.indexOf(dep) == -1) {
            all_deps.push(dep);
        }
    }

    return all_deps;
}

function for_packages<R>(packages: PackagesInfo, operation: (packages: PackagesInfo, name: string) => R, names?: string | string[]): Record<string, R> {
    if (typeof names == 'string') {
        names = [names];
    }

    const res: Record<string, R> = {};

    for (const name in packages) {
        if (!names || names.indexOf(name) != -1 ||
            names.indexOf(packages[name].path) != -1) {
            operation(packages, name);
        }
    }

    return res;
}

function show_package(packages: PackagesInfo, name: string) {
    const { vers, path, deps } = packages[name];
    console.log(`${name}@${vers} (${path}) [${deps.join(' ')}]`);
}

function run_script(name: string, ...args: string[]): (packages: PackagesInfo, name: string) => void {
    return (packages: PackagesInfo, pkg: string) => {
        const { path, scrs } = packages[pkg];
        if (scrs.indexOf(name) >= 0) {
            invoke_npm(path, 'run', name, ...args);
        } else {
            console.log(`# package: ${pkg} has no script: ${name}`);
        }
    };
}

function test_package(packages: PackagesInfo, name: string) {
    const { path, scrs } = packages[name];
    if (scrs.indexOf('test') != -1) {
        invoke_npm(path, 'test');
    }
}

function install_package(packages: PackagesInfo, name: string) {
    console.log(`# install package ${name}`);
    install_dependencies(packages, name);

    const { path } = packages[name];
    invoke_npm(path, 'install');
}

function install_dependencies(packages: PackagesInfo, name: string) {
    const { deps } = packages[name];

    for (const dep of deps) {
        if (!package_installed(packages, dep)) {
            install_package(packages, dep);
        } else {
            console.log(`# skip install package ${dep}`);
        }
    }
}

function package_installed(packages: PackagesInfo, name: string): boolean {
    const { path } = packages[name];
    try {
        return lstatSync(join(process.cwd(), path, 'node_modules')).isDirectory();
    } catch (e) {
        return false;
    }
}

function pack_archive(packages: PackagesInfo, name: string, local: boolean = false) {
    const { path, vers } = packages[name];
    name = name.replace(/^@/, '').replace(/\//g, '-');
    return join(process.cwd(), local ? path : '.lws', `${name}-${vers}.tgz`);
}

function pack_package(packages: PackagesInfo, name: string) {
    const { path } = packages[name];
    modify_package_json(PackageJsonOp.UnlinkDeps)(packages, name);
    invoke_npm(path, 'pack');
    modify_package_json(PackageJsonOp.LinkDeps)(packages, name);
    mkdirpSync(join(process.cwd(), '.lws'));
    removeSync(pack_archive(packages, name));
    moveSync(pack_archive(packages, name, true), pack_archive(packages, name));
}

function purge_package(packages: PackagesInfo, name: string) {
    run_script('clean')(packages, name);
    const { path } = packages[name];
    purge_package_path(path);
}

function purge_package_path(path: string) {
    removeSync(join(process.cwd(), path, 'node_modules'));
}

function unlock_package(packages: PackagesInfo, name: string) {
    const { path } = packages[name];
    remove_package_lock(path);
}

function remove_package_lock(path: string) {
    removeSync(join(process.cwd(), path, 'package-lock.json'));
}

const enum PackageJsonOp {
    LinkDeps,
    UnlinkDeps,
}

function modify_package_json(op: PackageJsonOp): (packages: PackagesInfo, name: string) => void {
    return (packages, name) => {
        const pkg = packages[name];
        const path = join(process.cwd(), pkg.path);
        const data = read_package_json(path);
        for (const group of ['dependencies', 'devDependencies', 'peerDependencies'] as (keyof PackageJson)[]) {
            const deps = data[group] as PackageDeps;
            if (deps) {
                for (const dep in deps) {
                    const dep_pkg = packages[dep];
                    if (dep_pkg) {
                        deps[dep] =
                            op == PackageJsonOp.LinkDeps ?
                                'file:' + relative(pkg.path, dep_pkg.path) :
                                op == PackageJsonOp.UnlinkDeps ?
                                    '^' + dep_pkg.vers :
                                    deps[dep];
                    }
                }
            }
        }
        write_package_json(path, data);
    };
}

function invoke_npm(path: string, ...args: string[]) {
    console.log(`$ npm ${args.join(' ')}`);
    const cwd = process.cwd();
    spawnSync('npm', args, {
        cwd: join(cwd, path),
        stdio: 'inherit',
        env: {
            ...process.env,
            npm_config_package_lock: false,
            npm_config_save: false,
        }
    });
}

interface PackageJson {
    name: string;
    version: string;
    scripts?: PackageDeps;
    dependencies?: PackageDeps;
    devDependencies?: PackageDeps;
    peerDependencies?: PackageDeps;
    packages?: string[];
}

type PackageDeps = Record<string, string>;

function read_package_json(path: string): PackageJson {
    const file = join(path, 'package.json');
    try {
        return JSON.parse(readFileSync(file, 'utf8'));
    } catch (e) {
        console.log(`Unable to read: ${file}`);
        process.exit(-1);
        throw 0;
    }
}

function write_package_json(path: string, data: PackageJson) {
    const file = join(path, 'package.json');
    try {
        writeFileSync(file, JSON.stringify(data, null, '  '), 'utf8');
    } catch (e) {
        console.log(`Unable to write: ${file}`);
        process.exit(-1);
    }
}
