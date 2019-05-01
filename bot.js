// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityTypes } = require('botbuilder');
const { ChoicePrompt, DialogSet, NumberPrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');

const DIALOG_STATE_PROPERTY = 'dialogState';
const USER_PROFILE_PROPERTY = 'user';

const HAVING_FUN = "having_fun";
const WHY = "why";
const THANKS = "thanks";

const FLOWS = Object.freeze({
    PRIMARY: "primary"
})

class SimpleFunBot {
    /**
     *
     * @param {Object} conversationState
     * @param {Object} userState
     */
    constructor(conversationState, userState) {

        this.conversationState = conversationState;
        this.userState = userState;

        this.dialogState = this.conversationState.createProperty(DIALOG_STATE_PROPERTY);

        this.userProfile = this.userState.createProperty(USER_PROFILE_PROPERTY);

        this.dialogs = new DialogSet(this.dialogState);

        // Add prompts that will be used by the main dialogs.
        this.dialogs.add(new ChoicePrompt(HAVING_FUN));
        this.dialogs.add(new TextPrompt(WHY));
        this.dialogs.add(new TextPrompt(THANKS));

        this.dialogs.add(new WaterfallDialog(FLOWS.PRIMARY, [
            async (step) => {
                return await step.prompt(HAVING_FUN, "Are you having fun?", ['yes', 'no'])
            },
            async (step) => {
                if(step.result && step.result.value.trim().toLowerCase() == "yes") {
                    return await step.prompt(WHY, "Why?")
                } else {
                    return await step.prompt(WHY, "Why not?")
                }
            },
            async (step) => {
               await step.prompt(THANKS, "Thanks for talking to me!");
               return step.endDialog();
            }
        ]));

    }

    /**
     *
     * @param {Object} context on turn context object.
     */
    async onTurn(turnContext) {
        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        if (turnContext.activity.type === ActivityTypes.Message) {
            // Create dialog context
            const dc = await this.dialogs.createContext(turnContext);

            // Continue the current dialog
            if (!turnContext.responded) {
                await dc.continueDialog();
            }

            // Show menu if no response sent
            if (!turnContext.responded) {
                await dc.beginDialog(FLOWS.PRIMARY);
            }
        } else if (turnContext.activity.type === ActivityTypes.ConversationUpdate) {
            // Do we have any new members added to the conversation?
            if (turnContext.activity.membersAdded.length !== 0) {
                // Iterate over all new members added to the conversation
                for (let idx in turnContext.activity.membersAdded) {
                    // Greet anyone that was not the target (recipient) of this message.
                    // Since the bot is the recipient for events from the channel,
                    // context.activity.membersAdded === context.activity.recipient.Id indicates the
                    // bot was added to the conversation, and the opposite indicates this is a user.
                    if (turnContext.activity.membersAdded[idx].id !== turnContext.activity.recipient.id) {
                        // Send a "this is what the bot does" message to this user.
                        await turnContext.sendActivity('I am the fun bot.');
                    }
                }
            }
        }

        // Save changes to the user name.
        await this.userState.saveChanges(turnContext);

        // End this turn by saving changes to the conversation state.
        await this.conversationState.saveChanges(turnContext);
    }
}

module.exports.SimpleFunBot = SimpleFunBot;
