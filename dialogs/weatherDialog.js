// import dialog
const { ComponentDialog, ChoicePrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const fetch = require('node-fetch');
const { URL, URLSearchParams } = require('url');

const LOCATION_PROMPT = 'location_prompt';

class WeatherDialog extends ComponentDialog {
    constructor(dialogId){
        super(dialogId);

        this.initialDialogId = dialogId;

        this.addDialog(new ChoicePrompt(LOCATION_PROMPT));
        
        this.addDialog(new WaterfallDialog(dialogId, [
            async function(step) {
                return await step.prompt(LOCATION_PROMPT, '請選擇城市', ['臺北市', '新北市', '臺中市']);
            },

            async function(step) {
                // const user = await this.userProfile.get(step.context, {});
                // user.location = step.result.value;
        
                // await this.userProfile.set(step.context, user);
                const location = step.result.value;
                const url = new URL('https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-C0032-001');
                const params = {
                    Authorization: 'CWB-05BB39AF-5A44-4DB6-BB74-D3789295B4FE',
                    format: 'JSON',
                    locationName: location,
                    elementName: 'Wx,PoP,MinT,MaxT'
                };
                url.search = new URLSearchParams(params);

                let reply = null;

                await fetch(url)
                    .then(res => res.json())
                    .then(jsonData => {
                        const weatherElement = jsonData.records.location[0].weatherElement;
                        const weather = weatherElement[0].time[0].parameter.parameterName;
                        const rain = weatherElement[1].time[0].parameter.parameterName;
                        const minTemperture = weatherElement[2].time[0].parameter.parameterName;
                        const maxTemperture = weatherElement[3].time[0].parameter.parameterName;
                        const startTime = weatherElement[0].time[0].startTime.slice(11, 19);
                        const endTime = weatherElement[0].time[0].endTime.slice(11, 19);
                        const tempertureUnit = String.fromCharCode(8451); //%
            
                        reply = `${params.locationName}
                            時間: ${startTime} 至 ${endTime}
                            ${weather}, 降雨機率: ${rain}%, 氣溫: ${minTemperture}${tempertureUnit} ~ ${maxTemperture}${tempertureUnit}
                        `;
                    })
                    .catch(err => console.log(err));
                await step.context.sendActivity(reply);
         
                return await step.endDialog();
             }
        ]));
    }
}

exports.WeatherDialog = WeatherDialog;