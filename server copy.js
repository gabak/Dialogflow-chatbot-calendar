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
    try {
        console.log("📩 Full Request Body:", JSON.stringify(req.body, null, 2));

        // Safely extract sessionInfo
        const sessionInfo = req.body.sessionInfo || {};
        const params = sessionInfo.parameters || {};

        if (Object.keys(params).length === 0) {
            throw new Error("Missing parameters in sessionInfo");
        }

        console.log("✅ Extracted Parameters:", params);

        // Extract user details
        const name = params.name?.name || params.name || "Unknown";
        const phone = params.phone || "N/A";
        const age = params.age || "N/A";
        const sickness = params.sickness || "N/A";
        const symptoms = params.symptoms || "N/A";
        const appointmentDate = params.date;
        const appointmentTime = params.time;

        if (!appointmentDate || !appointmentTime) {
            throw new Error("Missing date or time parameter");
        }

        // Format appointment start time
        const appointmentStart = new Date(
            appointmentDate.year,
            appointmentDate.month - 1,
            appointmentDate.day,
            appointmentTime.hours,
            appointmentTime.minutes
        );

        // Set appointment end time (e.g., 30 minutes later)
        const appointmentEnd = new Date(appointmentStart.getTime() + 30 * 60000);

        console.log("📅 Appointment Start:", appointmentStart.toISOString());
        console.log("📅 Appointment End:", appointmentEnd.toISOString());

        // Respond back to Dialogflow
        res.json({
            fulfillmentText: `✅ Your appointment has been booked, ${name}! 📅 Date: ${appointmentDate.year}-${appointmentDate.month}-${appointmentDate.day} ⏰ Time: ${appointmentTime.hours}:${appointmentTime.minutes}`
        });

    } catch (error) {
        console.error("❌ Error:", error.message);
        res.json({
            fulfillmentText: "❌ Something went wrong. Please check your request format."
        });
    }
});




// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Webhook server running on http://localhost:${PORT}`);
});
