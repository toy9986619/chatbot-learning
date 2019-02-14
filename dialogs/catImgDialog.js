const { ComponentDialog, ChoicePrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { ActionTypes, ActivityTypes, CardFactory } = require('botbuilder');
const fetch = require('node-fetch');

const PROMPT = 'prompt';
const ONE_MORE = 'one_more';
const FINISH = 'finish';


class CatImgDialog extends ComponentDialog {
    constructor(dialogId) {
        super(dialogId);

        this.initialDialogId = dialogId;

        this.addDialog(new TextPrompt(PROMPT));
        this.addDialog(new WaterfallDialog(dialogId, [
            async function(step) {
                let imgUrl;

                const button = [
                    { type: ActionTypes.ImBack, title: '再來一張', value: ONE_MORE },
                    { type: ActionTypes.ImBack, title: '結束', value:FINISH }
                ]

                await fetch("https://api.thecatapi.com/v1/images/search", {
                        headers: {
                            'x-api-key': '2061f446-1450-404a-9e82-97fec45f78c8'
                        }
                    })
                    .then(res => res.json())
                    .then(json => imgUrl = json[0].url)
                    .catch(err => console.log(err));

                const card = CardFactory.heroCard('', [imgUrl],
                    button, { text: 'Cute cat, right?' });

                const reply = { type: ActivityTypes.Message };
                reply.attachments = [card];

                await step.context.sendActivity(reply);
                return await step.prompt(PROMPT, '');
            },

            async function(step) {
                switch(step.result){
                    case ONE_MORE:
                        return await step.replaceDialog(dialogId);
                        break;
                    case FINISH:
                        break;
                    default:
                        break;
                }

                return await step.endDialog();
            }
        ]))
    }
}

exports.CatImgDialog = CatImgDialog;