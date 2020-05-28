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

import { ICommandHandler, IHandlerParameters, ICommandArguments } from "../../../../cmd";
import { Constants } from "../../../../constants";
import { ISession, CredsForSessCfg, Session, SessConstants, AbstractSession } from "../../../../rest";
import { Imperative } from "../../Imperative";
import { ImperativeExpect } from "../../../../expect";
import { ImperativeError } from "../../../../error";

/**
 * This class is used by the auth command handlers as the base class for their implementation.
 */
export abstract class BaseAuthHandler implements ICommandHandler {
    /**
     * The profile type where token type and value should be stored
     */
    protected abstract mProfileType: string;

    /**
     * The default token type to use if not specified as a command line option
     */
    protected abstract mDefaultTokenType: SessConstants.TOKEN_TYPE_CHOICES;

    /**
     * The session being created from the command line arguments / profile
     */
    protected mSession: AbstractSession;

    /**
     * This handler is used for both "auth login" and "auth logout" commands.
     * It determines the correct action to take and calls either `processLogin`
     * or `processLogout` accordingly.
     *
     * @param {IHandlerParameters} commandParameters Command parameters sent by imperative.
     *
     * @returns {Promise<void>}
     */
    public async process(commandParameters: IHandlerParameters) {
        switch (commandParameters.positionals[1]) {
            case Constants.LOGIN_ACTION:
                await this.processLogin(commandParameters);
                break;
            case Constants.LOGOUT_ACTION:
                await this.processLogout(commandParameters);
                break;
            default:
                throw new ImperativeError({
                    msg: `The group name "${commandParameters.positionals[1]}" was passed to the BaseAuthHandler, but it is not valid.`
                });
                break;
        }
    }

    /**
     * This is called by the {@link BaseAuthHandler#process} when it needs a
     * session. Should be used to create a session to connect to the auth
     * service.
     * @abstract
     * @param {ICommandArguments} args The command line arguments to use for building the session
     * @returns {ISession} The session object built from the command line arguments.
     */
    protected abstract createSessCfgFromArgs(args: ICommandArguments): ISession;

    /**
     * This is called by the "auth login" command after it creates a session, to
     * obtain a token that can be stored in a profile.
     * @abstract
     * @param {AbstractSession} session The session object to use to connect to the auth service
     * @returns {Promise<string>} The response from the auth service containing a token
     */
    protected abstract async doLogin(session: AbstractSession): Promise<string>;

    /**
     * This is called by the "auth logout" command after it creates a session, to
     * revoke a token before removing it from a profile.
     * @abstract
     * @param {AbstractSession} session The session object to use to connect to the auth service
     */
    protected abstract async doLogout(session: AbstractSession): Promise<void>;

    /**
     * Performs the login operation. Builds a session to connect to the auth
     * service, sends a login request to it to obtain a token, and stores the
     * resulting token in the profile of type `mProfileType`.
     * @param {IHandlerParameters} params Command parameters sent by imperative.
     */
    private async processLogin(params: IHandlerParameters) {
        const loadedProfile = params.profiles.getMeta(this.mProfileType, false);

        const sessCfg: ISession = this.createSessCfgFromArgs(
            params.arguments
        );
        const sessCfgWithCreds = await CredsForSessCfg.addCredsOrPrompt<ISession>(
            sessCfg, params.arguments,
            { requestToken: true, defaultTokenType: this.mDefaultTokenType }
        );

        this.mSession = new Session(sessCfgWithCreds);

        // login to obtain a token
        const tokenValue = await this.doLogin(this.mSession);

        // update the profile given
        if (loadedProfile.name != null && !params.arguments.showToken) {
            await Imperative.api.profileManager(this.mProfileType).update({
                name: loadedProfile.name,
                args: {
                    "token-type": this.mSession.ISession.tokenType,
                    "token-value": tokenValue
                },
                merge: true
            });
        }

        params.response.console.log("Login successful.");

        if (params.arguments.showToken) {
            params.response.console.log(
                "\nReceived a token of type = " + this.mSession.ISession.tokenType +
                ".\nThe following token was stored in your profile:\n" + tokenValue
            );
        }
    }

    /**
     * Performs the logout operation. Deletes the token and token type from the profile,
     * and rebuilds the session.
     * @param {IHandlerParameters} params Command parameters sent by imperative.
     */
    private async processLogout(params: IHandlerParameters) {
        const loadedProfile = params.profiles.getMeta(this.mProfileType, false);

        const sessCfg: ISession = this.createSessCfgFromArgs(
            params.arguments
        );

        this.mSession = new Session(sessCfg);

        ImperativeExpect.toNotBeNullOrUndefined(params.arguments.tokenType, "Token type not supplied, but is required for logout.");
        ImperativeExpect.toNotBeNullOrUndefined(params.arguments.tokenValue, "Token value not supplied, but is required for logout.");
        ImperativeExpect.toNotBeNullOrUndefined(params.arguments.host, "Host not supplied, but is required for logout.");
        ImperativeExpect.toNotBeNullOrUndefined(params.arguments.port, "Port not supplied, but is required for logout.");

        // we want to receive a token in our response
        this.mSession.ISession.type = SessConstants.AUTH_TYPE_TOKEN;
        this.mSession.ISession.tokenType = params.arguments.tokenType;
        this.mSession.ISession.tokenValue = params.arguments.tokenValue;

        await this.doLogout(this.mSession);

        // If you specified a token on the command line, then don't delete the one in the profile if it doesn't match
        if (loadedProfile.name != null && params.arguments.tokenValue === loadedProfile.profile.tokenValue) {
            await Imperative.api.profileManager(this.mProfileType).save({
                name: loadedProfile.name,
                type: loadedProfile.type,
                overwrite: true,
                profile: {
                        ...loadedProfile.profile,
                        tokenType: undefined,
                        tokenValue: undefined
                }
            });
        }

        this.mSession.ISession.type = SessConstants.AUTH_TYPE_BASIC;
        this.mSession.ISession.tokenType = undefined;
        this.mSession.ISession.tokenValue = undefined;

        params.response.console.log("Logout successful.");

    }
}
