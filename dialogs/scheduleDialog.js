const { ComponentDialog, WaterfallDialog, TextPrompt } = require('botbuilder-dialogs');
const { CardFactory } = require('botbuilder');
const ScheduleFormCard = require('../resource/ScheduleFormCard.json');

const PROMPT = 'prompt';

class ScheduleDialog extends ComponentDialog{
    constructor(dialogId) {
        super(dialogId);

        this.initialDialogId = dialogId;

        this.addDialog(new TextPrompt(PROMPT, this.promptValidator))
        this.addDialog(new WaterfallDialog(dialogId, [
            async function(step) {
                await step.context.sendActivity({
                    attachments: [CardFactory.adaptiveCard(ScheduleFormCard)]
                });

                return await step.prompt(PROMPT, 'waiting for your submit action');
            },

            async function(step) {
                await step.context.sendActivity('get response.');
                const activity = step.context.activity;

                return await step.endDialog();
            }
        ]));
    }
    
    async promptValidator(promptContext){
        const activity = promptContext.context.activity;

        return activity.type === 'message' && activity.channelData.postback;
    }
}

exports.ScheduleDialog = ScheduleDialog;