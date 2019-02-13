const { ComponentDialog, ChoicePrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { ActionTypes, ActivityTypes, CardFactory } = require('botbuilder');
const request = require('request');
const fetch = require('node-fetch');

class CatImgDialog extends ComponentDialog {
    constructor(dialogId) {
        super(dialogId);

        this.initialDialogId = dialogId;

        this.addDialog(new WaterfallDialog(dialogId, [
            async function(step) {
                let imgUrl;

                await fetch("https://api.thecatapi.com/v1/images/search", {
                        headers: {
                            'x-api-key': '2061f446-1450-404a-9e82-97fec45f78c8'
                        }
                    })
                    .then(res => res.json())
                    .then(json => imgUrl = json[0].url)
                    .catch(err => console.log(err));

                const card = CardFactory.heroCard('', [imgUrl],
                undefined, { text: 'cute cat, right?' });

                const reply = { type: ActivityTypes.Message };
                reply.attachments = [card];

                await step.context.sendActivity(reply);
                return await step.endDialog();
            }
        ]))
    }
}

exports.CatImgDialog = CatImgDialog;