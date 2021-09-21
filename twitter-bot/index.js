require("dotenv").config();

const twit = require('./twit');
const fs = require('fs');
const path = require('path');
const T = require("./twit");
const paramsPath = path.join(__dirname, 'params.json');



function writeParams(data){
    console.log('Writing params...', data);
    return fs.writeFileSync(paramsPath, JSON.stringify(data));
}

function readParams(){
    console.log('Reading params...');
    const data = fs.readFileSync(paramsPath);
    return JSON.parse(data.toString());
}

function getTweets(since_id){
    return new Promise((resolve,reject) => {
        let params = {
            q: "@BotSocialCredit",
            count: 10,
        };
        if (since_id){
            params.since_id = since_id;

        }
        console.log('Getting tweets...', params)
        twit.get("search/tweets", params,(err,data) => {
            if(err){
                return reject(err);
            }
            return resolve(data);
        });
    });
}

function likePost(id){
    return new Promise ((resolve, reject) => {
        let params = {
            id,
        };
        twit.post("favorites/create" , params, (err,data) => {
            if(err){
                return reject(err);
            }
            return resolve(data);
        });
    });
}

function retweetPost(id){
    return new Promise ((resolve, reject) => {
        let params = {
            id,
        };
        twit.post("statuses/retweet/:id" , params, (err,data) => {
            if(err){
                return reject(err);
            }
            return resolve(data);
        });
    });
}

function replyPost(id){
    let textToReply = "Testing reply feature ";
    return new Promise ((resolve,reject) =>{
        let params={
            id,
        };
        twit.post("statuses/update",{status: textToReply, in_reply_to_status_id: id},(err,data) => {
            if (err){
                console.log("Error! Couldnt reply.");
                return reject(err);
            }
            return resolve(data);
        });
    });
}

function pickRandomImg(){
    return Math.floor(Math.random()* 4);
}

async function uploadRandomImg(id){


    let image_path = path.join(__dirname, "/images/" + pickRandomImg() + ".jpg")
    let b64content = fs.readFileSync(image_path, { encoding: 'base64'});
    console.log("Picked the image, uploading...");
    twit.post("media/upload", {media_data: b64content}, (err,data)=>{
    if (err){
            console.log("Error! Couldnt upload.");
            console.log(err);
            }
            else{
                console.log("Uploaded. Now tweeting...");
                twit.post("statuses/update", {media_ids: new Array(data.media_id_string)},{status:image_path, in_reply_to_status_id: id},(err,data) =>{
                if(err){
                    console.log("Error");
                    console.log(err)
                }
                else{
                    console.log("Sucessfully replied.")
                    console.log(data);
                }
            });
        }
    })
}

async function uploadRandomImgResponse(id, replyTweet){


    let image_path = path.join(__dirname, "/images/" + pickRandomImg() + ".jpg")
    let b64content = fs.readFileSync(image_path, { encoding: 'base64'});

    return new Promise((resolve,reject) => {
        let params={
            id,
        };


    console.log("Picked the image, uploading...");
    twit.post("media/upload", {media_data: b64content}, (err,data)=>{
    if (err){
            console.log("Error! Couldnt upload.");
            return reject(err)
            }
            else{
                let mediaIdStr = data.media_id_string
                let altText = "AltText"
                let meta_params = {media_id:mediaIdStr,altText:{text:altText}}
                console.log("Uploaded. Now tweeting...");
                twit.post("media/metadata/create",meta_params,(err,data) =>{
                    if (!err){
                        let pararams = {status:"@" + replyTweet.user.screen_name + ", here is your credit score", media_ids: [mediaIdStr]}
                        twit.post("statuses/update", pararams,(err,data) =>{
                            if(err){
                                console.log("Error");
                                return reject(err);
                            }
                            else{
                                console.log("Sucessfully replied.")
                                return resolve(data);
                    }
                })
                
                }
            });
        }
    })
})
}


async function main(){
    try{
        const params = readParams();
        const data = await getTweets(params.since_id);
        const tweets = data.statuses;
        console.log('We got the tweets',tweets.length);
        for await(let tweet of tweets){
            try{
                await likePost(tweet.id_str);
                await uploadRandomImgResponse(tweet.id_str);
                console.log('Successfully liked and replied tweet ' + tweet.id_str);
                
            }catch(e){
                console.log('Could not like tweet, most likely already liked ' + tweet.id_str);
            }

            params.since_id = tweet.id_str;
        }
        writeParams(params);
    }
        catch(e){
            console.error(e);
        }
}

console.log('Starting bot. Get ready');

setInterval(main,10000);