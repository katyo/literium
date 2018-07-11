#!/usr/bin/env node

import { join } from 'path';
import { readFileSync } from 'fs';
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
    return (packages: PackagesInfo, name: string) => {
        const { path, scrs } = packages[name];
        if (scrs.indexOf(name) != -1) {
            invoke_npm(path, 'run', name, ...args);
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
    install_dependencies(packages, name);

    const { path } = packages[name];
    invoke_npm(path, 'install', '--no-package-lock');
    pack_package(packages, name);
}

function install_dependencies(packages: PackagesInfo, name: string) {
    const { path, deps } = packages[name];

    for (const dep of deps) {
        const dep_pack = pack_archive(packages, dep);
        invoke_npm(path, 'install', dep_pack, '--no-save', '--no-package-lock');
    }
}

function pack_archive(packages: PackagesInfo, name: string, local: boolean = false) {
    const { path, vers } = packages[name];
    return join(process.cwd(), local ? path : '.lws', `${name}-${vers}.tgz`);
}

function pack_package(packages: PackagesInfo, name: string) {
    const { path } = packages[name];
    invoke_npm(path, 'pack');
    mkdirpSync(join(process.cwd(), '.lws'));
    removeSync(pack_archive(packages, name));
    moveSync(pack_archive(packages, name, true), pack_archive(packages, name));
}

function purge_package(packages: PackagesInfo, name: string) {
    const { path, scrs } = packages[name];
    if (scrs.indexOf('clean') != -1) {
        invoke_npm(path, 'run', 'clean');
    }
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

function invoke_npm(path: string, ...args: string[]) {
    console.log(`$ npm ${args.join(' ')}`);
    spawnSync('npm', args, {
        cwd: join(process.cwd(), path),
        stdio: 'inherit',
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

function read_package_json(path: string): PackageJson | void {
    try {
        return JSON.parse(readFileSync(join(path, 'package.json'), 'utf8'));
    } catch (e) { }
}
