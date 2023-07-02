// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { InputHints, MessageFactory } = require('botbuilder');
const { TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');

const OPENAI_DIALOG = 'openAiDialog';
const WATERFALL_DIALOG = 'waterfallDialog';
const TEXT_PROMPT = 'textPrompt';

const got = require('got');
const url = 'https://api-devel.auracognitive.com/llm-api/v1/generate';
let input = 'hola';
let output = '';

class openAiDialog extends CancelAndHelpDialog {
    constructor() {
        super(OPENAI_DIALOG);
        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.openAiAPIStep.bind(this),
                this.openAiPromptStep.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    /**
     * OpenAi API Call Step
     */
    async openAiAPIStep(stepContext) {
        const sessionId = stepContext.options.sessionId;
        console.log('sessionId: ' + sessionId);
        const options = {
            json: {
                sesid: sessionId,
                preset: 'movistar-mei',
                query: input
            },
            headers: {
                'X-Api-Key': 'fa4c0998-fe2e-11ed-afb7-13611b8f8dc1'
            }
        };
        await this.getOutputText(options)
            .then(outputText => {
                console.log('Output:', output.output);
            })
            .catch(err => {
                console.log('Errores: ', err.message);
            });
        const messageText = output.output;
        const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
        return await stepContext.prompt(TEXT_PROMPT, {prompt: msg});
    }

    /**
     * OpenAi Prompt Result Step
     */
    async openAiPromptStep(stepContext) {
        // Capture the response to the previous step's prompt.
        input = stepContext.result;
        console.log(input);

        // Preparing the loop to go back to first step to process API call with the new prompt
        const openAiDetails = {
            sessionId: stepContext.options.sessionId
        };
        return await stepContext.replaceDialog(this.id, openAiDetails);
    }

    /**
     * OpenAi API Call
     */
    async getOutputText(options) {
        await got.post(url, options)
            .then(res => {
                console.log('Status Code:', res.statusCode);
                output = JSON.parse(res.body);
            })
            .catch(err => {
                console.log('Errors: ', err.message);
            });
    }
}

module.exports.openAiDialog = openAiDialog;
