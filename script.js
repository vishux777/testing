async function categorizeExpense() {
  const expenseDesc = document.getElementById("expense-desc").value;
  if (!expenseDesc) return alert("Please enter an expense description.");

  addMessage("You: " + expenseDesc, "user");

  try {
      const response = await fetch("http://127.0.0.1:5000/categorize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description: expenseDesc })
      });

      const data = await response.json();
      addMessage("Bot: " + data.category, "bot");
  } catch (error) {
      addMessage("Bot: Error processing request.", "bot");
  }
}

async function sendQuery() {
  const query = document.getElementById("query-input").value;
  if (!query) return;

  addMessage("You: " + query, "user");

  try {
      const response = await fetch("http://127.0.0.1:5000/categorize_query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query })
      });

      const data = await response.json();
      addMessage("Bot: " + data.response, "bot");
  } catch (error) {
      addMessage("Bot: Error processing request.", "bot");
  }
}

function addMessage(text, sender) {
  const chatbox = document.getElementById("chatbox");
  const messageDiv = document.createElement("div");
  messageDiv.className = "chat-message";
  messageDiv.textContent = text;
  chatbox.appendChild(messageDiv);
  chatbox.scrollTop = chatbox.scrollHeight;
}
