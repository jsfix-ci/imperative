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

import { ICommandDefinition } from "../../../../../cmd";
import { join } from "path";
import { ImperativeConfig } from "../../../../../utilities";

/**
 * Definition of the init command.
 * @type {ICommandDefinition}
 */
export const initDefinition: ICommandDefinition = {
    name: "init",
    type: "command",
    handler: join(__dirname, "init.handler"),
    summary: "init config files",
    description: `Initialize config files. Defaults to initializing "${ImperativeConfig.instance.rootCommandName}.config.json" in the current ` +
        `working directory unless otherwise specified.\n\nUse "--user-config" to init ` +
        `"${ImperativeConfig.instance.rootCommandName}.config.user.json". Use "--global-config" to initialize the configuration files in your home ` +
        `"~/.zowe" directory.\n\nUse "--no-prompt" to skip prompting for values in a CI environment.`,
    options: [
        {
            name: "global-config",
            description: "Target the global config files.",
            aliases: ["gc"],
            type: "boolean",
            defaultValue: false
        },
        {
            name: "user-config",
            description: "Target the user config files.",
            aliases: ["uc"],
            type: "boolean",
            defaultValue: false
        },
        {
            name: "prompt",
            description: "Prompt for secure values. Useful for disabling prompting in CI environments.",
            type: "boolean",
            defaultValue: true
        },
        {
            name: "overwrite",
            description: "Replace existing config files instead of merging the new changes.",
            aliases: ["ow"],
            type: "boolean",
            conflictsWith: ["dry-run"],
            implies: ["for-sure"]
        },
        {
            name: "for-sure",
            aliases: ["fs"],
            description: "Confirms the overwrite option.",
            type: "boolean",
            defaultValue: false
        },
        {
            name: "dry-run",
            description: "Display the outcome of the initialization without saving it.",
            aliases: ["dr", "dry"],
            type: "boolean",
            conflictsWith: ["overwrite"]
        }
    ],
    examples: [
        {
            description: `Initialize configuration files in your home "~/.zowe" directory.`,
            options: "--global-config"
        },
        {
            description: `Do a dry run of initializing configuration files in your home "~/.zowe" directory.`,
            options: "--global-config --dry-run"
        },
        {
            description: "Initialize the user config files.",
            options: "--user-config"
        },
        {
            description: "Initialize the user config files and do not prompt for secure values.",
            options: "--user-config --prompt false"
        },
        {
            description: "Do a dry run of initializing the user config files and do not prompt for secure values.",
            options: "--user-config --prompt false --dry-run"
        },
        {
            description: "Overwrite any existing global config files.",
            options: "--global-config --overwrite --for-sure"
        },
        {
            description: "Overwrite any existing user config files.",
            options: "--user-config --overwrite --for-sure"
        }
    ]
};
