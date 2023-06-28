// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, ActivityTypes, EndOfConversationCodes } = require('botbuilder');
const got = require('got');
const crypto = require("crypto");
const url = 'https://api-devel.auracognitive.com/llm-api/v1/generate';
const id = crypto.randomBytes(16).toString("hex");
console.log(id);
let output = "";

class EchoBot extends ActivityHandler {
    constructor() {
        super();
        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.onMessage(async (context, next) => {
            switch (context.activity.text.toLowerCase()) {
            case 'end':
            case 'stop':
                await context.sendActivity({
                    type: ActivityTypes.EndOfConversation,
                    code: EndOfConversationCodes.CompletedSuccessfully
                });
                break;
            default:
                const options = {
                    json: {
                        sesid: id,
                        preset: "movistar-mei",
                        query: context.activity.text.toLowerCase(),
                    },
                    headers: {
                        'X-Api-Key': 'fa4c0998-fe2e-11ed-afb7-13611b8f8dc1'
                    },
                };
                await getOutputText(options)
                    .then(outputText => {
                        console.log('Output:', output.output);
                    })
                    .catch(err => {
                        console.log('Errores: ', err.message);
                    });

                await context.sendActivity(output.output);
            }

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onEndOfConversation(async (context, next) => {
            // This will be called if the root bot is ending the conversation.  Sending additional messages should be
            // avoided as the conversation may have been deleted.
            // Perform cleanup of resources if needed.

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
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

module.exports.EchoBot = EchoBot;
