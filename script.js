// Use relative URL when testing locally, absolute URL in production
const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const API_URL = isLocalhost ? "http://localhost:5000" : "https://your-deployed-api.com";

let chatHistory = [];

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    // Set current year in footer
    document.getElementById('current-year').textContent = new Date().getFullYear();
    
    // Check if API is available
    checkApiStatus();
    
    // Load chat history from localStorage if available
    loadChatHistory();
});

async function checkApiStatus() {
    try {
        const statusIndicator = document.createElement('div');
        statusIndicator.id = 'api-status';
        statusIndicator.className = 'api-status checking';
        statusIndicator.innerHTML = 'Checking API connection...';
        document.querySelector('.main h1').after(statusIndicator);
        
        const response = await fetch(`${API_URL}/`, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });
        
        if (response.ok) {
            statusIndicator.className = 'api-status connected';
            statusIndicator.innerHTML = 'API Connected <i class="fas fa-check-circle"></i>';
            setTimeout(() => {
                statusIndicator.style.opacity = '0';
                setTimeout(() => statusIndicator.remove(), 500);
            }, 3000);
        } else {
            throw new Error("API not responding");
        }
    } catch (error) {
        const statusIndicator = document.getElementById('api-status');
        if (statusIndicator) {
            statusIndicator.className = 'api-status error';
            statusIndicator.innerHTML = 'API Not Connected <i class="fas fa-exclamation-circle"></i>';
        }
        console.error("API status check failed:", error);
    }
}

async function categorizeExpense() {
    const expenseInput = document.getElementById("expense-desc");
    const expenseDesc = expenseInput.value.trim();
    
    if (!expenseDesc) {
        showToast("Please enter an expense description.");
        return;
    }

    addMessage("You: " + expenseDesc, "user");
    
    // Show loading indicator
    const loadingMessage = addMessage("Bot: Categorizing your expense...", "bot loading");
    
    expenseInput.value = ""; // Clear input after sending

    try {
        const response = await fetch(`${API_URL}/categorize`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ description: expenseDesc })
        });

        // Remove loading message
        loadingMessage.remove();
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to get response from server.");
        }

        const data = await response.json();
        
        // Create a nicely formatted response
        const botResponse = `${data.message || "I've categorized this as:"} <span class="category-tag">${data.category}</span>`;
        addMessage("Bot: " + botResponse, "bot", true);
        
        // Add category icon based on category
        const messageElement = document.querySelector('.chat-message.bot:last-child');
        addCategoryIcon(messageElement, data.category);
        
        // Save to chat history
        saveChatItem(expenseDesc, botResponse);
    } catch (error) {
        addMessage("Bot: Sorry, I couldn't categorize that expense. " + error.message, "bot error");
    }
}

async function sendQuery() {
    const queryInput = document.getElementById("query-input");
    const query = queryInput.value.trim();

    if (!query) {
        showToast("Please enter a valid query.");
        return;
    }

    addMessage("You: " + query, "user");
    
    // Show typing indicator
    const loadingMessage = addMessage("Bot: Thinking...", "bot loading");
    
    queryInput.value = ""; // Clear input after sending

    try {
        const response = await fetch(`${API_URL}/categorize_query`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query })
        });

        // Remove loading message
        loadingMessage.remove();
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to get response from server.");
        }

        const data = await response.json();
        addMessage("Bot: " + (data.response || "I'm not sure how to answer that."), "bot");
        
        // Save to chat history
        saveChatItem(query, data.response || "I'm not sure how to answer that.");
    } catch (error) {
        addMessage("Bot: Sorry, I couldn't process your query. " + error.message, "bot error");
    }
}

function addMessage(text, sender, isHTML = false) {
    const chatbox = document.getElementById("chatbox");
    
    // Remove welcome message if it exists
    const welcomeMessage = document.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }
    
    const messageDiv = document.createElement("div");
    messageDiv.className = `chat-message ${sender}`;
    
    if (isHTML) {
        messageDiv.innerHTML = text;
    } else {
        messageDiv.textContent = text;
    }
    
    chatbox.appendChild(messageDiv);
    chatbox.scrollTop = chatbox.scrollHeight;
    
    return messageDiv;
}

function addCategoryIcon(messageElement, category) {
    const iconMap = {
        "food": "fa-utensils",
        "transportation": "fa-car",
        "housing": "fa-home",
        "utilities": "fa-bolt",
        "entertainment": "fa-film",
        "shopping": "fa-shopping-bag",
        "travel": "fa-plane",
        "health": "fa-heartbeat",
        "education": "fa-graduation-cap",
        "other": "fa-question-circle"
    };
    
    const iconClass = iconMap[category] || "fa-tag";
    const icon = document.createElement('i');
    icon.className = `fas ${iconClass} category-icon`;
    messageElement.prepend(icon);
}

function showToast(message) {
    // Create toast if it doesn't exist
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        document.body.appendChild(toast);
    }
    
    // Set message and show
    toast.textContent = message;
    toast.className = 'show';
    
    // Hide after 3 seconds
    setTimeout(() => {
        toast.className = '';
    }, 3000);
}

function saveChatItem(question, answer) {
    const timestamp = new Date();
    chatHistory.push({
        question,
        answer,
        timestamp: timestamp.toISOString()
    });
    
    // Keep only last 10 conversations
    if (chatHistory.length > 10) {
        chatHistory = chatHistory.slice(-10);
    }
    
    // Save to localStorage
    localStorage.setItem('expenseBotChatHistory', JSON.stringify(chatHistory));
    
    // Update sidebar history
    updateChatHistorySidebar();
}

function loadChatHistory() {
    try {
        const savedHistory = localStorage.getItem('expenseBotChatHistory');
        if (savedHistory) {
            chatHistory = JSON.parse(savedHistory);
            updateChatHistorySidebar();
        }
    } catch (e) {
        console.error("Error loading chat history:", e);
    }
}

function updateChatHistorySidebar() {
    const historyContainer = document.getElementById('chat-history');
    historyContainer.innerHTML = '';
    
    if (chatHistory.length === 0) {
        const emptyHistory = document.createElement('div');
        emptyHistory.className = 'empty-history';
        emptyHistory.innerHTML = '<i class="fas fa-comment-slash"></i> No history yet';
        historyContainer.appendChild(emptyHistory);
        return;
    }
    
    // Add each history item to sidebar
    chatHistory.forEach((item, index) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        // Format timestamp
        const date = new Date(item.timestamp);
        const formattedTime = `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
        
        // Truncate question if too long
        const shortQuestion = item.question.length > 20 
            ? item.question.substring(0, 20) + '...' 
            : item.question;
            
        historyItem.innerHTML = `<i class="fas fa-comment"></i> ${shortQuestion}`;
        historyItem.title = item.question;
        historyItem.dataset.index = index;
        
        historyItem.addEventListener('click', () => loadChatFromHistory(index));
        
        historyContainer.appendChild(historyItem);
    });
}

function loadChatFromHistory(index) {
    if (index >= 0 && index < chatHistory.length) {
        const item = chatHistory[index];
        
        // Clear chatbox
        document.getElementById('chatbox').innerHTML = '';
        
        // Add the conversation
        addMessage("You: " + item.question, "user");
        addMessage("Bot: " + item.answer, "bot", true);
    }
}

// Initialize the New Chat functionality
document.querySelector('.new-chat').addEventListener('click', function() {
    // Clear the chatbox
    document.getElementById('chatbox').innerHTML = `
        <div class="welcome-message">
            <h3>Welcome to Expense Categorizer!</h3>
            <p>I can help you categorize your expenses or answer questions about expense management.</p>
            <p>Try entering an expense like "Dinner at a restaurant" or ask me something!</p>
        </div>
    `;
    
    // Clear input fields
    document.getElementById('expense-desc').value = '';
    document.getElementById('query-input').value = '';
});

// Handle Enter key press in input fields
document.getElementById('expense-desc').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        categorizeExpense();
    }
});

document.getElementById('query-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendQuery();
    }
});