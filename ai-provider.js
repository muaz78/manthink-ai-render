require('dotenv').config();

const API_KEY = process.env.XAI_API_KEY;

async function askAI(message) {
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
            model: "grok-4",
            messages: [
                {
                    role: "user",
                    content: message
                }
            ]
        })
    });

    const data = await response.json();

    return data.choices[0].message.content;
}

module.exports = { askAI };