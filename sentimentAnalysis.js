// Import the Google APIs library
const { google } = require('googleapis');
const fetch = require('node-fetch'); // Ensure you have this installed

// Your Google Sheets API key
const apiKey = '';

// Your Google Sheet ID
const spreadsheetId = '';

// Specify the range of data to fetch (adjust as necessary)
const range = 'Form Responses 1!A2:G10';

// Initialize the Google Sheets API client
async function fetchData() {
  const sheets = google.sheets({ version: 'v4', auth: apiKey });

  try {
    // Fetch the data from the specified spreadsheet and range
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: range,
    });

    // Extract the data
    const rows = response.data.values;
    //console.log("rows", rows)
    if (rows.length) {
      console.log('Data from Google Sheets:');
      // Convert rows to JSON format
      const jsonData = rows.map(row => ({
        userName: row[1], // Assuming index 1 is 'userName'
        ratingOfExperience: row[4], // Assuming index 4 is 'ratingOfExperience'
        feedback: row[5], // Assuming index 5 is 'feedback'
        suggestionForImprovement: row[6] // Assuming index 6 is 'suggestionForImprovement'
      }));

      //console.log(JSON.stringify(jsonData, null, 2)); // Log the JSON data

      // Pass the JSON data to the Gemini API call
      const promptText = `
        Gemini, you are a Sentiment Analysis Expert.
        You are given feedback form data in JSON format.
        Your task is to give a sentiment analysis value for each entry.

        The sentiment analysis score should range from 1 to 100 inclusive.
        The sentiment text should be any of the four values: Bad, Moderate, Good, Perfect.
        The condition for sentiment text are,
          1 <= sentimentAnalysisScore < 30 => Bad,
          30 <= sentimentAnalysisScore < 60 => Moderate,
          60 <= sentimentAnalysisScore < 90 => Good,
          90 <= sentimentAnalysisScore <= 100 => Perfect,
        The professional ai feedback should be inferred from 'feedback' key to generate professional and technical feedback understandable by technical team

        Only predict sentimentAnalysisScore, sentimentText, professionalAiFeedback. Keep the other fields the same.

        Output format should be in JSON like this: 
        [
          { userName: '', ratingOfExperience: '', feedback: '', suggestionForImprovement: '', sentimentAnalysisScore: '', sentimentText: '', professionalAiFeedback: '' },
          { userName: '', ratingOfExperience: '', feedback: '', suggestionForImprovement: '', sentimentAnalysisScore: '', sentimentText: '', professionalAiFeedback: '' }
        ]
        Here is the feedback form data JSON: ${JSON.stringify(jsonData)}
      `;// Need to address tone of feedback for sentiment score instead of simple condition from sentimentAnalysisScore

      await getGeminiResponse(promptText);
    } else {
      console.log('No data found.');
    }
  } catch (err) {
    console.error('Error fetching data from Google Sheets:', err);
  }
}

async function getGeminiResponse(promptText) {
  const apiKey = ""; // Replace with your actual API key
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: promptText,
          },
        ],
      },
    ],
  };

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Error: ${response.status} ${response.statusText}. Details: ${errorBody}`);
    }

    const data = await response.json();

    // Extract and log the reply content
    if (data.candidates && data.candidates.length > 0) {
      const reply = data.candidates[0].content; // Adjust according to the API response structure
      const fullReply = reply.parts[0].text;
      console.log(fullReply);
      
    } else {
      console.log("No reply found.");
    }
  } catch (error) {
    console.error("Error fetching response from Gemini:", error);
  }
}

// Fetch and log the data
fetchData();
