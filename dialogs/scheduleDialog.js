const { ComponentDialog, WaterfallDialog, TextPrompt, Dialog } = require('botbuilder-dialogs');
const { CardFactory } = require('botbuilder');
const ScheduleFormCard = require('../resource/ScheduleFormCard.json');

const PROMPT = 'prompt';

class ScheduleDialog extends ComponentDialog{
    constructor(dialogId) {
        super(dialogId);

        this.initialDialogId = dialogId;

        this.addDialog(new WaterfallDialog(dialogId, [
            async function(step) {
                step.values.scheduleInfo = {};

                await step.context.sendActivity({
                    attachments: [CardFactory.adaptiveCard(ScheduleFormCard)]
                });

                return Dialog.EndOfTurn;
            },

            async function(step) {
                await step.context.sendActivity('get response.');
                const activity = step.context.activity;

                if (activity.channelData.postback) {
                    step.values.scheduleInfo.name = activity.value.name;
                } else {
                    await step.context.sendActivity('我不清楚你的操作');
                }

                return await step.endDialog();
            }
        ]));
    }
    
}

exports.ScheduleDialog = ScheduleDialog;