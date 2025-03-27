const API_URL = "https://testing-production-808c.up.railway.app"; // Update with your backend URL

document.addEventListener("DOMContentLoaded", function () {
    const queryInput = document.getElementById("query-input");
    const sendButton = document.getElementById("send-btn");
    const chatBox = document.getElementById("chatbox");
    const expenseForm = document.getElementById("expense-form");

    // Function to send user query to API
    async function sendMessage() {
        const userQuery = queryInput.value.trim();
        if (userQuery === "") return;

        // Add user query to chat
        addMessage("You", userQuery);
        queryInput.value = ""; // Clear input field

        try {
            const response = await fetch(`${API_URL}/ask`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ query: userQuery }),
            });

            if (!response.ok) {
                throw new Error(`HTTP Error! Status: ${response.status}`);
            }

            const data = await response.json();
            addMessage("Bot", data.response || "No response received.");
        } catch (error) {
            console.error("Error:", error);
            addMessage("Bot", "⚠️ Error processing request.");
        }
    }

    // Function to add messages to chatbox
    function addMessage(sender, text) {
        const messageElement = document.createElement("div");
        messageElement.classList.add("message");

        if (sender === "You") {
            messageElement.classList.add("user-message");
        } else {
            messageElement.classList.add("bot-message");
        }

        const timestamp = new Date().toLocaleTimeString();
        messageElement.innerHTML = `<strong>${sender}:</strong> ${text} <br> <small>${timestamp}</small>`;
        
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll to latest message
    }

    // Event Listeners
    sendButton.addEventListener("click", sendMessage);
    queryInput.addEventListener("keypress", function (event) {
        if (event.key === "Enter") sendMessage();
    });

    // Expense Form Submission
    expenseForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const formData = new FormData(expenseForm);
        const expenseData = {};
        formData.forEach((value, key) => {
            expenseData[key] = value;
        });

        try {
            const response = await fetch(`${API_URL}/categorize`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(expenseData),
            });

            if (!response.ok) {
                throw new Error(`HTTP Error! Status: ${response.status}`);
            }

            const data = await response.json();
            addMessage("Bot", `Category: ${data.category || "Unknown"}`);
        } catch (error) {
            console.error("Error:", error);
            addMessage("Bot", "⚠️ Error categorizing expense.");
        }
    });
});
