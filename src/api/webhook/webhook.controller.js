import crypto from 'crypto'
import { getTask, getStoriesFromTask, getUsersInATeam, updateTask } from '../../config/asana.js';
import { calculateFirstResponseTime } from '../../util/firstResponseTime.js'

// Global variable to store the x-hook-secret
// Read more about the webhook "handshake" here: https://developers.asana.com/docs/webhooks-guide#the-webhook-handshake
let secret = process.env.WEBHOOK_SECRET;

// Local endpoint for receiving events

export async function webhookHandler(req, res) {
    console.log(req.body);
    if (req.headers["x-hook-secret"]) {
      console.log("This is a new webhook");
      secret = req.headers["x-hook-secret"];
  
      res.setHeader("X-Hook-Secret", secret);
      res.sendStatus(200);
    } else if (req.headers["x-hook-signature"]) {
      const computedSignature = crypto
        .createHmac("SHA256", secret)
        .update(JSON.stringify(req.body))
        .digest("hex");
  
      if (
        !crypto.timingSafeEqual(
          Buffer.from(req.headers["x-hook-signature"]),
          Buffer.from(computedSignature)
        )
      ) {
        // Fail
        res.sendStatus(401);
      } else {
        // Success
        const data = req.body.events
        
        res.sendStatus(200);
        console.log(`Events on ${Date()}:`);
  
        // Notification of new comment added
        console.log("New event created:\n", data);
        if (!data[0]) return console.log("No data");
  
        const {gid: storyParentId = null} = data[0]?.parent || {}
        const {gid: storyId} = data[0].resource
  
        if (!storyParentId) return console.log({message: "No parent. It's possible a comment edit", data})
        
        const task = await getTask(storyParentId)
  
        const {custom_fields: customFields, parent, created_at: cratedAt} = task.data;
  
        if (parent) {
          return console.log("It's a subtask")
        }
  
        const isFRT = customFields.find((i) => i.gid === process.env.FRT_CUSTOM_FIELD_ID);
  
        if (!isFRT) return console.log("No FRT set. No further actions")
        
        if (isFRT.text_value) {
          return console.log(`FRT is set: ${isFRT.text_value}. No further actions`)
        } else {
          const stories = await getStoriesFromTask(storyParentId)
          const team = await getUsersInATeam(process.env.DEDICATED_SUPPORT_GID)
  
          const {firstResponseTime} = calculateFirstResponseTime(stories, team, cratedAt);
  
          if (firstResponseTime) {
            const { data } = await updateTask(storyParentId, firstResponseTime)
            console.log(`First Response Time set successfully (${firstResponseTime}) on task "${data.name}" (${data.gid})`);
          }
        }
        
      }
    } else {
      console.error("Something went wrong!");
    }
  };