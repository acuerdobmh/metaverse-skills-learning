// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const {ActivityTypes, InputHints} = require('botbuilder');
const {ComponentDialog, DialogTurnStatus, WaterfallDialog} = require('botbuilder-dialogs');
const {LuisRecognizer} = require('botbuilder-ai');
const {openAiDialog} = require('./openAiDialog');
const crypto = require("crypto");

const ACTIVITY_ROUTER_DIALOG = 'activityRouterDialog';
const WATERFALL_DIALOG = 'waterfallDialog';
const OPENAI_DIALOG = 'openAiDialog';

/**
 * A root dialog that can route activities sent to the skill to different sub-dialogs.
 */
class ActivityRouterDialog extends ComponentDialog {
    constructor(conversationState) {
        super(ACTIVITY_ROUTER_DIALOG);

        if (!conversationState) throw new Error('[MainDialog]: Missing parameter \'conversationState\' is required');

        // Define the main dialog and its related components.
        // This is a sample "book a flight" dialog.
        this.addDialog(new openAiDialog())
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.processActivity.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async processActivity(stepContext) {
        // A skill can send trace activities, if needed.
        const traceActivity = {
            type: ActivityTypes.Trace,
            timestamp: new Date(),
            text: 'ActivityRouterDialog.processActivity()',
            label: `Got activityType: ${stepContext.context.activity.type}`
        };
        await stepContext.context.sendActivity(traceActivity);

        switch (stepContext.context.activity.type) {
            case ActivityTypes.Event:
                return await this.onEventActivity(stepContext);
            case ActivityTypes.Message:
                return await this.onMessageActivity(stepContext);
            default:
                // Catch all for unhandled intents.
                await stepContext.context.sendActivity(
                    `Unrecognized ActivityType: "${stepContext.context.activity.type}".`,
                    undefined,
                    InputHints.IgnoringInput
                );
                return {status: DialogTurnStatus.complete};
        }
    }

    /**
     * This method performs different tasks based on event name.
     */
    async onEventActivity(stepContext) {
        const activity = stepContext.context.activity;
        const traceActivity = {
            type: ActivityTypes.Trace,
            timestamp: new Date(),
            text: 'ActivityRouterDialog.onEventActivity()',
            label: `Name: ${activity.name}, Value: ${JSON.stringify(activity.value)}`
        };
        await stepContext.context.sendActivity(traceActivity);

        // Resolve what to execute based on the event name.
        switch (activity.name) {
            case 'Devices':
                return await this.beginOpenAiDialog(stepContext);
            default:
                // We didn't get an event name we can handle.
                await stepContext.context.sendActivity(
                    `Unrecognized EventName: "${stepContext.context.activity.name}".`,
                    undefined,
                    InputHints.IgnoringInput
                );
                return {status: DialogTurnStatus.complete};
        }
    }

    /**
     * This method just gets a message activity and runs it through LUIS.
     */
    async onMessageActivity(stepContext) {
        const activity = stepContext.context.activity;
        const traceActivity = {
            type: ActivityTypes.Trace,
            timestamp: new Date(),
            text: 'ActivityRouterDialog.onMessageActivity()',
            label: `Text: ${activity.text}, Value: ${JSON.stringify(activity.value)}`
        };
        await stepContext.context.sendActivity(traceActivity);

        // Resolve what to execute based on the event name.
        switch (activity.text) {
            case 'Devices':
                return await this.beginOpenAiDialog(stepContext);
            default:
                // We didn't get an event name we can handle.
                await stepContext.context.sendActivity(
                    `Unrecognized MessageName: "${stepContext.context.activity.text}".`,
                    undefined,
                    InputHints.IgnoringInput
                );
                return {status: DialogTurnStatus.complete};
        }
    }

    async beginOpenAiDialog(stepContext) {
        // Obtaining a random session ID
        const id = crypto.randomBytes(16).toString('hex');
        console.log(id);
        const openAiDetails = {
            sessionId: id
        };

        // Start the openAi dialog.
        const openAiDialog = this.findDialog(OPENAI_DIALOG);
        return await stepContext.beginDialog(openAiDialog.id, openAiDetails);
    }
}

module.exports.ActivityRouterDialog = ActivityRouterDialog;
