document.addEventListener("DOMContentLoaded", function () {
    const expenseInput = document.getElementById("expenseInput");
    const categorizeBtn = document.getElementById("categorizeBtn");
    const chatBox = document.getElementById("chatBox");
    const userInput = document.getElementById("userInput");
    const sendBtn = document.getElementById("sendBtn");

    // Function to categorize expense
    async function categorizeExpense() {
        const expenseText = expenseInput.value.trim();
        if (!expenseText) {
            alert("Please enter an expense description.");
            return;
        }

        appendMessage("User", expenseText);

        try {
            const response = await fetch("https://api.mistral.ai/v1/categorize", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer Ynd1YZuLjwM02OPQVs3wInK4dNtXwFbT"
                },
                body: JSON.stringify({ query: expenseText })
            });

            const data = await response.json();
            appendMessage("Bot", `Category: ${data.category || "Unknown"}`);
        } catch (error) {
            appendMessage("Bot", "Error categorizing expense.");
            console.error("API Error:", error);
        }

        expenseInput.value = "";
    }

    // Function to handle chat input
    async function sendMessage() {
        const userMessage = userInput.value.trim();
        if (!userMessage) return;

        appendMessage("User", userMessage);

        try {
            const response = await fetch("https://api.mistral.ai/v1/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer Ynd1YZuLjwM02OPQVs3wInK4dNtXwFbT"
                },
                body: JSON.stringify({ query: userMessage })
            });

            const data = await response.json();
            appendMessage("Bot", data.response || "I couldn't understand that.");
        } catch (error) {
            appendMessage("Bot", "Error fetching response.");
            console.error("Chat Error:", error);
        }

        userInput.value = "";
    }

    // Function to append messages to chat box
    function appendMessage(sender, text) {
        const messageDiv = document.createElement("div");
        messageDiv.innerHTML = `<strong>${sender}:</strong> ${text}`;
        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // Event listeners
    categorizeBtn.addEventListener("click", categorizeExpense);
    sendBtn.addEventListener("click", sendMessage);
});
