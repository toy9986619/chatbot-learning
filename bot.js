// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityTypes, MessageFactory, TurnContext} = require('botbuilder');
const request = require('request');

class MyBot {
    /**
     *
     * @param {TurnContext} on turn context object.
     */
    async onTurn(turnContext) {
        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        if (turnContext.activity.type === ActivityTypes.Message) {
            if(turnContext.activity.text != "天氣"){
                await turnContext.sendActivity(`You said '${ turnContext.activity.text }'`);
            }else{
                await this.getWeather(turnContext);
            }
            
        } else {
            await turnContext.sendActivity(`[${ turnContext.activity.type } event detected]`);
        }
    }

    getData(){
        const params = {
            Authorization: 'CWB-05BB39AF-5A44-4DB6-BB74-D3789295B4FE',
            format: 'JSON',
            locationName: '臺北市'
        };
        
        return new Promise(function(resolve, reject) {
            request({url: 'https://opendata.cwb.gov.tw/fileapi/v1/opendataapi/F-C0032-001', qs: params}, 
                function(err, res, body){
                    if(!err && res.statusCode == 200){
                        let data = JSON.parse(body);
                        let weather = data.cwbopendata.dataset.location[0].weatherElement[0].time[0].parameter.parameterName;
                        resolve(weather);
                    }else {
                        reject(error);
                    }
                }
            );
        })
    }

    async getWeather(turnContext) {
        if (turnContext.activity.type === ActivityTypes.Message) {
            let result = 'default';

            result = await this.getData();

            await turnContext.sendActivity(result);
        } else{
            await turnContext.sendActivity('get Weather error!');
        }
    }

    
}

module.exports.MyBot = MyBot;
