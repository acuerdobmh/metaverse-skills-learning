// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { InputHints } = require('botbuilder');
const { ComponentDialog, DialogTurnStatus } = require('botbuilder-dialogs');
const got = require('got');
const crypto = require("crypto");

const url = 'https://api-devel.auracognitive.com/llm-api/v1/generate';
let output = "";
const id = crypto.randomBytes(16).toString("hex");
console.log(id);

/**
 * This base class watches for common phrases like "help" and "cancel" and takes action on them
 * BEFORE they reach the normal bot logic.
 */
class CancelAndHelpDialog extends ComponentDialog {
    async onContinueDialog(innerDc) {
        const result = await this.interrupt(innerDc);
        if (result) {
            return result;
        }
        return await super.onContinueDialog(innerDc);
    }

    async interrupt(innerDc) {
        if (innerDc.context.activity.text) {
            const text = innerDc.context.activity.text.toLowerCase();

            switch (text) {
                case 'help':
                case '?': {
                    const helpMessageText = 'Show help here';
                    await innerDc.context.sendActivity(helpMessageText, helpMessageText, InputHints.ExpectingInput);
                    return { status: DialogTurnStatus.waiting };
                }
                case 'cancel':
                case 'quit': {
                    const cancelMessageText = 'Canceling...';
                    await innerDc.context.sendActivity(cancelMessageText, cancelMessageText, InputHints.IgnoringInput);
                    return await innerDc.cancelAllDialogs();
                }
                default:
                    const options = {
                        json: {
                            sesid: id,
                            preset: "movistar-mei",
                            query: innerDc.context.activity.text,
                        },
                        headers: {
                            'X-Api-Key': 'fa4c0998-fe2e-11ed-afb7-13611b8f8dc1'
                        },
                    };

                    await getOutputText(options)
                        .then(res => {
                            console.log('Output1:', output.output);
                        })
                        .catch(err => {
                            console.log('Errores: ', err.message);
                        });

                    await innerDc.context.sendActivity(output.output, output.output, InputHints.IgnoringInput);
                
            }
        }
    }
}

async function getOutputText(options) {
    await got.post(url, options)
        .then(res => {
            console.log('Status Code:', res.statusCode);
            output = JSON.parse(res.body);
        })
        .catch(err => {
            console.log('Errores: ', err.message);
        });
}

module.exports.CancelAndHelpDialog = CancelAndHelpDialog;
