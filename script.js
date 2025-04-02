// Configure the API URL - change this to your Streamlit deployment URL when deployed
//const API_URL = "http://localhost:8501"; // Default for local development
const API_URL = "https://smartspend.streamlit.app/"; // Uncomment and change this when deployed

let chatHistory = [];

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('current-year').textContent = new Date().getFullYear();
    checkApiStatus();
    loadChatHistory();
});

async function checkApiStatus() {
    try {
        const statusIndicator = document.getElementById('api-status');
        if (!statusIndicator) return;
        
        statusIndicator.className = 'status-checking';
        statusIndicator.textContent = 'Checking API connection...';
        
        // Try to reach the Streamlit app
        const response = await fetch(`${API_URL}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            mode: 'cors' // Important for cross-origin requests
        });
        
        if (response.ok) {
            statusIndicator.className = 'status-online';
            statusIndicator.innerHTML = 'API online';
        } else {
            throw new Error("API not responding");
        }
    } catch (error) {
        const statusIndicator = document.getElementById('api-status');
        if (statusIndicator) {
            statusIndicator.className = 'status-offline';
            statusIndicator.innerHTML = 'API offline';
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
    const loadingMessage = addMessage("Bot: Categorizing your expense...", "bot loading");
    expenseInput.value = "";

    try {
        // For Streamlit, we'll send data to the backend and parse the response
        // Direct API calls to Streamlit can be tricky, so we might need to adjust this
        const response = await fetch(`${API_URL}/categorize`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ description: expenseDesc }),
            mode: 'cors'
        });

        if (loadingMessage) loadingMessage.remove();
        
        if (!response.ok) {
            // Fall back to local processing if API fails
            const category = getDefaultCategory(expenseDesc);
            const botResponse = `I've categorized this as: <span class="category-tag">${category}</span>`;
            addMessage("Bot: " + botResponse, "bot", true);
            
            const messageElement = document.querySelector('.chat-message.bot:last-child');
            addCategoryIcon(messageElement, category);
            saveChatItem(expenseDesc, botResponse);
            return;
        }

        // Parse Streamlit response
        const data = await response.json();
        const category = data.category || getDefaultCategory(expenseDesc);
        const botResponse = `${data.message || "I've categorized this as:"} <span class="category-tag">${category}</span>`;
        addMessage("Bot: " + botResponse, "bot", true);
        
        const messageElement = document.querySelector('.chat-message.bot:last-child');
        addCategoryIcon(messageElement, category);
        saveChatItem(expenseDesc, botResponse);
    } catch (error) {
        console.error("Categorization error:", error);
        // Fallback to basic categorization
        const category = getDefaultCategory(expenseDesc);
        const botResponse = `I've categorized this as: <span class="category-tag">${category}</span>`;
        addMessage("Bot: " + botResponse, "bot", true);
        
        const messageElement = document.querySelector('.chat-message.bot:last-child');
        if (messageElement) addCategoryIcon(messageElement, category);
        saveChatItem(expenseDesc, botResponse);
    }
}

function getDefaultCategory(description) {
    // Simple fallback categorization when API is unavailable
    const desc = description.toLowerCase();
    if (desc.includes("restaurant") || desc.includes("food") || desc.includes("dinner") || 
        desc.includes("lunch") || desc.includes("breakfast") || desc.includes("coffee")) {
        return "food";
    } else if (desc.includes("uber") || desc.includes("taxi") || desc.includes("bus") || 
               desc.includes("train") || desc.includes("gas") || desc.includes("car")) {
        return "transportation";
    } else if (desc.includes("rent") || desc.includes("mortgage") || desc.includes("home")) {
        return "housing";
    } else if (desc.includes("electricity") || desc.includes("water") || desc.includes("bill") || 
               desc.includes("internet") || desc.includes("phone") || desc.includes("gas bill")) {
        return "utilities";
    } else if (desc.includes("movie") || desc.includes("netflix") || desc.includes("spotify") || 
               desc.includes("concert") || desc.includes("game")) {
        return "entertainment";
    } else if (desc.includes("amazon") || desc.includes("mall") || desc.includes("store") || 
               desc.includes("buy") || desc.includes("purchase")) {
        return "shopping";
    } else if (desc.includes("doctor") || desc.includes("medicine") || desc.includes("hospital") || 
               desc.includes("health")) {
        return "health";
    } else if (desc.includes("course") || desc.includes("book") || desc.includes("tuition") || 
               desc.includes("class") || desc.includes("school")) {
        return "education";
    } else if (desc.includes("hotel") || desc.includes("flight") || desc.includes("vacation") || 
               desc.includes("trip") || desc.includes("travel")) {
        return "travel";
    } else {
        return "other";
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
    const loadingMessage = addMessage("Bot: Thinking...", "bot loading");
    queryInput.value = "";

    try {
        const response = await fetch(`${API_URL}/query`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query }),
            mode: 'cors'
        });

        if (loadingMessage) loadingMessage.remove();
        
        if (!response.ok) {
            // Fallback response
            const fallbackResponse = "I'm currently unable to process your query due to connection issues. Please try again later.";
            addMessage("Bot: " + fallbackResponse, "bot");
            saveChatItem(query, fallbackResponse);
            return;
        }

        const data = await response.json();
        const botResponse = data.response || "I'm not sure how to answer that.";
        addMessage("Bot: " + botResponse, "bot");
        saveChatItem(query, botResponse);
    } catch (error) {
        const fallbackResponse = "I'm currently unable to process your query. Please check your internet connection and try again.";
        addMessage("Bot: " + fallbackResponse, "bot error");
        saveChatItem(query, fallbackResponse);
    }
}

function addMessage(text, sender, isHTML = false) {
    const chatbox = document.getElementById("chatbox");
    if (!chatbox) return null;
    
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
    if (!messageElement) return;
    
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
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        document.body.appendChild(toast);
    }
    
    toast.textContent = message;
    toast.className = 'show';
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
    
    if (chatHistory.length > 10) {
        chatHistory = chatHistory.slice(-10);
    }
    
    localStorage.setItem('expenseBotChatHistory', JSON.stringify(chatHistory));
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
    if (!historyContainer) return;
    
    historyContainer.innerHTML = '';
    
    if (chatHistory.length === 0) {
        const emptyHistory = document.createElement('div');
        emptyHistory.className = 'empty-history';
        emptyHistory.innerHTML = '<i class="fas fa-comment-slash"></i> No history yet';
        historyContainer.appendChild(emptyHistory);
        return;
    }
    
    chatHistory.forEach((item, index) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        const date = new Date(item.timestamp);
        const formattedTime = `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
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
        const chatbox = document.getElementById('chatbox');
        if (chatbox) {
            chatbox.innerHTML = '';
            addMessage("You: " + item.question, "user");
            addMessage("Bot: " + item.answer, "bot", true);
        }
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    const newChatButton = document.querySelector('.new-chat');
    if (newChatButton) {
        newChatButton.addEventListener('click', function() {
            const chatbox = document.getElementById('chatbox');
            if (chatbox) {
                chatbox.innerHTML = `
                    <div class="welcome-message">
                        <div class="welcome-icon"><i class="fas fa-hand-wave"></i></div>
                        <h3>Welcome to SmartSpend Assistant!</h3>
                        <p>I can help you categorize your expenses or answer questions about expense management.</p>
                        <div class="suggestion-chips">
                            <div class="chip" onclick="useExample('Dinner at an Italian restaurant')">Dinner at restaurant</div>
                            <div class="chip" onclick="useExample('Monthly Netflix subscription')">Netflix subscription</div>
                            <div class="chip" onclick="useExample('Uber ride to airport')">Uber ride</div>
                        </div>
                    </div>
                `;
            }
            
            const expenseDesc = document.getElementById('expense-desc');
            if (expenseDesc) expenseDesc.value = '';
            
            const queryInput = document.getElementById('query-input');
            if (queryInput) queryInput.value = '';
        });
    }

    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', function() {
            document.body.classList.toggle('light-mode');
            const icon = this.querySelector('i');
            if (document.body.classList.contains('light-mode')) {
                icon.className = 'fas fa-sun';
                this.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
            } else {
                icon.className = 'fas fa-moon';
                this.innerHTML = '<i class="fas fa-moon"></i> Dark Mode';
            }
        });
    }

    const expenseDesc = document.getElementById('expense-desc');
    if (expenseDesc) {
        expenseDesc.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                categorizeExpense();
            }
        });
    }

    const queryInput = document.getElementById('query-input');
    if (queryInput) {
        queryInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendQuery();
            }
        });
    }
});

// Helper function for example chips
function useExample(text) {
    const expenseDesc = document.getElementById('expense-desc');
    if (expenseDesc) {
        expenseDesc.value = text;
        categorizeExpense();
    }
}