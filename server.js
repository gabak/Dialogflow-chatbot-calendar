const express = require("express");
const { google } = require("googleapis");
const bodyParser = require("body-parser");
const fs = require("fs");

const app = express();
app.use(bodyParser.json()); // Parse JSON requests

// Load Google Calendar credentials
const CREDENTIALS = JSON.parse(fs.readFileSync("calendar-credentials.json"));

const SCOPES = ["https://www.googleapis.com/auth/calendar"];
const auth = new google.auth.JWT(
  CREDENTIALS.client_email,
  null,
  CREDENTIALS.private_key,
  SCOPES
);

const calendar = google.calendar({ version: "v3", auth });

// ✅ Root route handler
app.get("/", (req, res) => {
  res.send("Hello! Your webhook server is running.");
});

// ✅ Webhook route for booking appointment
app.post("/webhook", async (req, res) => {
    console.log("📩 Full Request Body:", JSON.stringify(req.body, null, 2));

    if (!req.body.sessionInfo || !req.body.sessionInfo.parameters) {
        console.error("❌ Error: Missing sessionInfo or parameters.");
        return res.status(400).json({ fulfillmentText: "❌ Invalid request format. Please provide valid parameters." });
    }

    const params = req.body.sessionInfo.parameters;

    // Extract parameters
    const name = params.name?.original || "Unknown";
    const phone = params.phone || "N/A";
    const age = params.age || "N/A";
    const sickness = params.sickness || "N/A";
    const symptoms = params.symptoms || "N/A";

    // Extract date and time
    const dateObj = params.date || params["date-time"]?.date;
    const timeObj = params.time || params["date-time"]?.time;

    if (!dateObj || !timeObj) {
        console.error("❌ Missing date or time.");
        return res.json({ fulfillmentText: "❌ Please provide a valid date and time for your appointment." });
    }

    const startDateTime = new Date(
        dateObj.year,
        dateObj.month - 1,  
        dateObj.day,
        timeObj.hours || 10,  
        timeObj.minutes || 0
    ).toISOString();

    const endDateTime = new Date(new Date(startDateTime).getTime() + 30 * 60000).toISOString();

    console.log("📅 Appointment Start:", startDateTime);
    console.log("📅 Appointment End:", endDateTime);

    try {
        const event = {
            summary: `Doctor Appointment - ${name}`,
            description: `📞 Phone: ${phone}\n🆔 Age: ${age}\n🤕 Sickness: ${sickness}\n📝 Symptoms: ${symptoms}`,
            start: { dateTime: startDateTime, timeZone: "UTC" },
            end: { dateTime: endDateTime, timeZone: "UTC" },
        };

        const response = await calendar.events.insert({
            calendarId: "b6da19f14ba7c314e015b350e395e331555c77af54bdeb964ad45a8e5117bc50@group.calendar.google.com",
            resource: event,
        });

        console.log("✅ Event created:", response.data);
        res.json({ fulfillmentText: `✅ Appointment booked for ${name} on ${dateObj.year}-${dateObj.month}-${dateObj.day} at ${timeObj.hours}:${timeObj.minutes}.` });
    } catch (error) {
        console.error("❌ Error creating event:", error.response?.data || error.message);
        res.json({ fulfillmentText: "❌ Failed to book appointment. Please try again." });
    }
});





// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Webhook server running on http://localhost:${PORT}`);
});
