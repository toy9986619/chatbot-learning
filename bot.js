// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityTypes, MessageFactory, TurnContext } = require('botbuilder');

// import dialog
const {ChoicePrompt, DialogSet, Dialog, WaterfallDialog, DialogTurnStatus} = require('botbuilder-dialogs');

const { WeatherDialog } = require('./dialogs/weatherDialog'); 

// Define waterfall dialog property
const DIALOG_INFO_PROPERTY = 'dialogInfo';
const USER_INFO_PROPERTY = 'user';

const WEATHER_DIALOG = 'weatherDialog';

const LOCATION_PROMPT = 'location_prompt';

class MyBot {

    constructor(conversationState, userState) {
        // Create the state property accessors
        this.dialogInfoAccessor = conversationState.createProperty(DIALOG_INFO_PROPERTY);
        this.userInfoAccessor = userState.createProperty(USER_INFO_PROPERTY);

        // The state management object
        this.conversationState = conversationState;
        this.userState = userState;
        
        // create dialogs
        this.dialogs = new DialogSet(this.dialogInfoAccessor);

        // add prompts that will be used by the main dialog
        this.dialogs.add(new ChoicePrompt(LOCATION_PROMPT))
            .add(new WeatherDialog(WEATHER_DIALOG))
            .add(new WaterfallDialog('mainDialog', [
                this.promptForChoice.bind(this),
                this.startChildDialog.bind(this)
        ]));
    }

    /**
     *
     * @param {TurnContext} on turn context object.
     */
    async onTurn(turnContext) {
        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        if (turnContext.activity.type === ActivityTypes.Message) {
            // create a dialog context object
            const dc = await this.dialogs.createContext(turnContext); 
            const user = await this.userInfoAccessor.get(turnContext, {});
            const dialogTrunResult = await dc.continueDialog();

            if(dialogTrunResult.status === DialogTurnStatus.complete){
                await dc.beginDialog('mainDialog');
            } else if (!turnContext.responded) {
                await dc.beginDialog('mainDialog');
            }
            

            await this.userState.saveChanges(turnContext);
            await this.conversationState.saveChanges(turnContext);   
        } else if (turnContext.activity.type === ActivityTypes.ConversationUpdate){
            await this.sendWelcomeMessage(turnContext);
        } else {
            await this.sendActivity(`[${ turnContext.activity.type } event detected]`);
        }
    }

    async sendWelcomeMessage(turnContext) {
        // const message = MessageFactory.suggestedActions(['查詢天氣'], "歡迎來到個人小幫手!");
        const message = await turnContext.sendActivity("歡迎來到個人小幫手!");

        if (turnContext.activity && turnContext.activity.membersAdded) {
            async function welcomeUserFunc(conversationMember) {
                if(conversationMember.id !== this.activity.recipient.id) {
                    await turnContext.sendActivity(message);
                }
            }

            const replyPromises = turnContext.activity.membersAdded.map(welcomeUserFunc.bind(turnContext));
            await Promise.all(replyPromises);
        }  
    }

    async promptForChoice(step) {
        const menu = ['查詢天氣'];
        const reply = MessageFactory.suggestedActions(menu, '您要使用什麼服務?');
        await step.context.sendActivity(reply);
    }

    async startChildDialog(step) {
        const user = await this.userInfoAccessor.get(step.context);

        switch(step.result) {
            case '查詢天氣':
                return await step.beginDialog(WEATHER_DIALOG);
                break;
            default:
                await step.context.sendActivity('我不清楚你的選擇');
                return await step.replaceDialog('mainDialog');
                break;
        }
    }
    
}

module.exports.MyBot = MyBot;
