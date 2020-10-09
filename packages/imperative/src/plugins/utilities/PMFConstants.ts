/*
* This program and the accompanying materials are made available under the terms of the
* Eclipse Public License v2.0 which accompanies this distribution, and is available at
* https://www.eclipse.org/legal/epl-v20.html
*
* SPDX-License-Identifier: EPL-2.0
*
* Copyright Contributors to the Zowe Project.
*
*/

import { ImperativeConfig } from "../../../../utilities";
import { dirname, join } from "path";
import { Logger } from "../../../../logger";
import { Config } from "../../../../config/Config";
import { REPL_MODE_SLOPPY } from "repl";

/**
 * Constants used by the PMF.
 */
export class PMFConstants {
    /**
     * Internal singleton object for the instance of the constants. This is done
     * this way because some of the variables need Imperative to have been
     * initialized first. That initialization happens at run time and not
     * compile time.
     *
     * @private
     * @type {PMFConstants}
     */
    private static mInstance: PMFConstants;

    /**
     * Get the singleton PMFConstants object. The first time this is requested, a
     * new object is created.
     *
     * @returns {PMFConstants} The constants class
     */
    public static get instance(): PMFConstants {
        if (PMFConstants.mInstance == null) {
            PMFConstants.mInstance = new PMFConstants();
        }

        return PMFConstants.mInstance;
    }

    /**
     * The NPM package name for the command line app's core package.
     */
    public readonly CLI_CORE_PKG_NAME: string;

    /**
     * The NPM package name for the command line app's core package.
     */
    public readonly IMPERATIVE_PKG_NAME: string;

    /**
     * The namespace that we use for imperative and our CLI app.
     */
    public readonly NPM_NAMESPACE: string;

    /**
     * The root directory for all plugin related items.
     * @type {string}
     */
    public readonly PMF_ROOT: string;

    /**
     * The plugin.json config file location.
     *
     * @type {string}
     */
    public readonly PLUGIN_JSON: string;

    /**
     * Installation directory for plugins
     * @type {string}
     */
    public readonly PLUGIN_INSTALL_LOCATION: string;

    /**
     * This stores the plugin node_module location. Since linux and windows can
     * differ here, this will be PLUGIN_INSTALL_LOCATION appended with either
     * node_modules or lib/node_modules.
     *
     * @type {string}
     */
    public readonly PLUGIN_NODE_MODULE_LOCATION: string[];

    public readonly PLUGIN_USING_CONFIG: boolean;

    public readonly PLUGIN_CONFIG: Config;

    public readonly PLUGIN_HOME_LOCATION: string;

    constructor() {
        // Load from the config
        const config = Config.load(ImperativeConfig.instance.rootCommandName);

        this.PLUGIN_CONFIG = config;
        this.NPM_NAMESPACE = "@zowe";
        this.CLI_CORE_PKG_NAME = ImperativeConfig.instance.hostPackageName;
        this.IMPERATIVE_PKG_NAME = ImperativeConfig.instance.imperativePackageName;
        this.PMF_ROOT = join(ImperativeConfig.instance.cliHome, "plugins");
        this.PLUGIN_JSON = join(this.PMF_ROOT, "plugins.json");
        this.PLUGIN_USING_CONFIG = config.exists;
        this.PLUGIN_HOME_LOCATION = join(this.PMF_ROOT, "installed");
        this.PLUGIN_INSTALL_LOCATION = this.PLUGIN_HOME_LOCATION;

        // Windows format is <prefix>/node_modules
        let cliHomeModPath;
        if (process.platform === "win32" || this.PLUGIN_USING_CONFIG) {
            cliHomeModPath = join(
                this.PLUGIN_INSTALL_LOCATION,
                "node_modules"
            );
            this.PLUGIN_HOME_LOCATION = join(
                this.PLUGIN_HOME_LOCATION,
                "node_modules"
            );
        }
        // Everyone else is <prefix>/lib/node_modules
        else {
            cliHomeModPath = join(
                this.PLUGIN_INSTALL_LOCATION,
                "lib",
                "node_modules"
            );
            this.PLUGIN_HOME_LOCATION = join(
                this.PLUGIN_HOME_LOCATION,
                "lib",
                "node_modules"
            );
        }

        // Build the paths to find the modules based on the config
        const modPaths: string[] = [];
        if (this.PLUGIN_USING_CONFIG) {
            config.paths.forEach((path: string) => {
                const dir = dirname(path);
                modPaths.push(join(dir, (process.platform !== "win32") ? "lib" : "", "node_modules"));
            });
        }
        modPaths.push(cliHomeModPath);
        modPaths.push(this.PLUGIN_HOME_LOCATION);
        this.PLUGIN_NODE_MODULE_LOCATION = Array.from(new Set(modPaths));

        Logger.getImperativeLogger().debug(`PMF node_modules: ${this.PLUGIN_NODE_MODULE_LOCATION}`);
    }
}
