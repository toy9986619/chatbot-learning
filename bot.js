// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityTypes, MessageFactory, TurnContext } = require('botbuilder');
const request = require('request');

// Define property name
const CONVERSATION_DATA_PROPERTY = 'conversionData';
const USER_PROFILE_PROPERTY = 'userData';

class MyBot {

    constructor(conversationState, userState) {
        // Create the state property accessors
        this.conversationData = conversationState.createProperty(CONVERSATION_DATA_PROPERTY);
        this.userProfile = userState.createProperty(USER_PROFILE_PROPERTY);

        // The state management object
        this.conversationState = conversationState;
        this.userState = userState;
    }

    /**
     *
     * @param {TurnContext} on turn context object.
     */
    async onTurn(turnContext) {
        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        if (turnContext.activity.type === ActivityTypes.Message) {
            // get state property
            const userProfile = await this.userProfile.get(turnContext, {});
            const conversationData = await this.conversationData.get(
                turnContext, { promptedForUserChoice: false });
            const vaildCommands = ['天氣'];
            
            // set command
            if(!conversationData.command && vaildCommands.includes(turnContext.activity.text)){
                conversationData.command = turnContext.activity.text;
            } else {
                await turnContext.sendActivity(`你傳送了 ${turnContext.activity.text}`);
            }

            // check weather
            if (conversationData.command == '天氣') {
                // ask flag
                if (conversationData.promptedForUserChoice) {
                    userProfile.location = turnContext.activity.text;
                    const reply = await this.getWeather(userProfile);

                    await turnContext.sendActivity(reply);
                    conversationData.command = null;
                    conversationData.promptedForUserChoice = false;
                } else {
                    await this.sendAreaOption(turnContext);

                    // don't ask again
                    conversationData.promptedForUserChoice = true;
                }

                // update user profile and state
                await this.userProfile.set(turnContext, userProfile)
                await this.userState.saveChanges(turnContext);
            }

            // update conversation data and state
            await this.conversationData.set(turnContext, conversationData);
            await this.conversationState.saveChanges(turnContext);
        } else {
            await turnContext.sendActivity(`[${turnContext.activity.type} event detected]`);
        }
    }

    async sendWelcomeMessage(turnContext) {
        const message = "歡迎來到天氣查詢";
        await turnContext.sendActivity(message);
        await sendAreaOption(turnContext);
    }

    async sendAreaOption(turnContext) {
        const reply = MessageFactory.suggestedActions(['臺北市', '新北市', '臺中市'], '請選擇城市');
        await turnContext.sendActivity(reply);
    }

    getData(userProfile) {
        const params = {
            Authorization: 'CWB-05BB39AF-5A44-4DB6-BB74-D3789295B4FE',
            format: 'JSON',
            locationName: userProfile.location,
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
                        const tempertureUnit = String.fromCharCode(8451);

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

    async getWeather(userProfile) {
        let result = await this.getData(userProfile);
        return result;
    }
}

module.exports.MyBot = MyBot;
