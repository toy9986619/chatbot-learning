// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityTypes, MessageFactory, TurnContext } = require('botbuilder');
const request = require('request');

// import dialog
const {ChoicePrompt, DialogSet, TextPrompt, WaterfallDialog} = require('botbuilder-dialogs');


// Define waterfall dialog property
const DIALOG_STATE_PROPERTY = 'dialogState';
const USER_PROFILE_PROPERTY = 'user';

const WEATHER_DIALOG = 'weatherDialog';

const LOCATION_PROMPT = 'location_prompt';

class MyBot {

    constructor(conversationState, userState) {
        // Create the state property accessors
        this.dialogState = conversationState.createProperty(DIALOG_STATE_PROPERTY);
        this.userProfile = userState.createProperty(USER_PROFILE_PROPERTY);

        // The state management object
        this.conversationState = conversationState;
        this.userState = userState;
        
        // create dialogs
        this.dialogs = new DialogSet(this.dialogState);

        // add prompts that will be used by the main dialog
        this.dialogs.add(new ChoicePrompt(LOCATION_PROMPT));

        this.dialogs.add(new WaterfallDialog(WEATHER_DIALOG, [
            this.promptForLocation.bind(this),
            this.getWeather.bind(this)
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

            // If the bot hat not yet responded, continue processing the current dialog
            await dc.continueDialog();

            if(!turnContext.responded){
                // get state property
                const user = await this.userProfile.get(dc.context, {});

                await dc.beginDialog(WEATHER_DIALOG);
            }

            await this.userState.saveChanges(turnContext);
            await this.conversationState.saveChanges(turnContext);   
        } else if (turnContext.activity.type === ActivityTypes.ConversationUpdate){
            await this.sendWelcomeMessage(turnContext);
        } else {
            this.sendActivity(`[${ turnContext.activity.type } event detected]`);
        }
    }

    async sendWelcomeMessage(turnContext) {
        const message = MessageFactory.suggestedActions(['查詢天氣'], "歡迎來到個人小幫手!");

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

    async promptForLocation(step) {
        return await step.prompt(LOCATION_PROMPT, '請選擇城市', ['臺北市', '新北市', '臺中市']);
    }

    async getWeather(step) {
        const user = await this.userProfile.get(step.context, {});
        user.location = step.result.value;

        await this.userProfile.set(step.context, user);

        const reply = await this.getData(user.location);
        await step.context.sendActivity(reply);
 
        return await step.endDialog();
     }

    getData(location) {
        const params = {
            Authorization: 'CWB-05BB39AF-5A44-4DB6-BB74-D3789295B4FE',
            format: 'JSON',
            locationName: location,
            elementName: 'Wx,PoP,MinT,MaxT'
        };

        return new Promise(function (resolve, reject) {
            request({ url: 'https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-C0032-001', qs: params },
                function (err, res, body) {
                    if (!err && res.statusCode == 200) {
                        const data = JSON.parse(body);
                        const weatherElement = data.records.location[0].weatherElement;
                        const weather = weatherElement[0].time[0].parameter.parameterName;
                        const rain = weatherElement[1].time[0].parameter.parameterName;
                        const minTemperture = weatherElement[2].time[0].parameter.parameterName;
                        const maxTemperture = weatherElement[3].time[0].parameter.parameterName;
                        const startTime = weatherElement[0].time[0].startTime.slice(11, 19);
                        const endTime = weatherElement[0].time[0].endTime.slice(11, 19);
                        const tempertureUnit = String.fromCharCode(8451); //%

                        const reply = `${params.locationName}
                            時間: ${startTime} 至 ${endTime}
                            ${weather}, 降雨機率: ${rain}%, 氣溫: ${minTemperture}${tempertureUnit} ~ ${maxTemperture}${tempertureUnit}
                        `;
                        resolve(reply);
                    } else {
                        reject(error);
                    }
                }
            );
        })
    }
}

module.exports.MyBot = MyBot;
