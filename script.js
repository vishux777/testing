// Configure the API URL - Points to the Streamlit deployment
const API_URL = "https://smartspend.streamlit.app"; // Streamlit deployment URL

// Chat history storage
let chatHistory = [];

// Application state
let isLightMode = false;

document.addEventListener('DOMContentLoaded', function() {
    // Set current year in footer
    document.getElementById('current-year').textContent = new Date().getFullYear();
    
    // Load saved theme preference
    loadThemePreference();
    
    // Load chat history
    loadChatHistory();
    
    // Set up event listeners
    setupEventListeners();
    
    // Check API status
    checkApiStatus();
});

function setupEventListeners() {
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
    
    // New chat button functionality
    document.querySelector('.new-chat').addEventListener('click', function() {
        resetChat();
    });
    
    // Dark/Light mode toggle
    document.getElementById('dark-mode-toggle').addEventListener('click', toggleTheme);
}

function toggleTheme() {
    isLightMode = !isLightMode;
    
    if (isLightMode) {
        document.body.classList.add('light-mode');
        document.getElementById('dark-mode-toggle').innerHTML = '<i class="fas fa-sun"></i> Light Mode';
    } else {
        document.body.classList.remove('light-mode');
        document.getElementById('dark-mode-toggle').innerHTML = '<i class="fas fa-moon"></i> Dark Mode';
    }
    
    // Save preference to localStorage
    localStorage.setItem('smartspend-theme', isLightMode ? 'light' : 'dark');
}

function loadThemePreference() {
    const savedTheme = localStorage.getItem('smartspend-theme');
    
    if (savedTheme) {
        isLightMode = savedTheme === 'light';
        
        if (isLightMode) {
            document.body.classList.add('light-mode');
            document.getElementById('dark-mode-toggle').innerHTML = '<i class="fas fa-sun"></i> Light Mode';
        } else {
            document.body.classList.remove('light-mode');
            document.getElementById('dark-mode-toggle').innerHTML = '<i class="fas fa-moon"></i> Dark Mode';
        }
    }
}

function resetChat() {
    document.getElementById('chatbox').innerHTML = `
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
    document.getElementById('expense-desc').value = '';
    document.getElementById('query-input').value = '';
    
    // Add a new entry to history
    addToHistory();
}

async function checkApiStatus() {
    try {
        const statusIndicator = document.getElementById('api-status');
        if (!statusIndicator) return;
        
        statusIndicator.className = 'status-checking';
        statusIndicator.textContent = 'Checking API connection...';
        
        // Try to reach the API endpoint
        const response = await fetch(`${API_URL}/`, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });
        
        if (response.ok) {
            statusIndicator.className = 'status-online';
            statusIndicator.innerHTML = '<i class="fas fa-circle"></i> API online';
        } else {
            throw new Error("API not responding");
        }
    } catch (error) {
        console.error("API status check failed:", error);
        const statusIndicator = document.getElementById('api-status');
        if (statusIndicator) {
            statusIndicator.className = 'status-offline';
            statusIndicator.innerHTML = '<i class="fas fa-times-circle"></i> API offline';
        }
    }
}

async function categorizeExpense() {
    const expenseInput = document.getElementById("expense-desc");
    const expenseDesc = expenseInput.value.trim();
    
    if (!expenseDesc) {
        showToast("Please enter an expense description.");
        return;
    }

    // Show loading overlay
    document.getElementById('loading-overlay').classList.remove('hidden');
    
    // Add user message
    addMessage(`You: ${expenseDesc}`, "user");
    
    try {
        const response = await fetch(`${API_URL}/categorize`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ description: expenseDesc })
        });
        
        // Hide loading overlay
        document.getElementById('loading-overlay').classList.add('hidden');
        
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

        // Parse response
        const data = await response.json();
        const category = data.category || getDefaultCategory(expenseDesc);
        const botResponse = `${data.message || "I've categorized this as:"} <span class="category-tag">${category}</span>`;
        
        addMessage("Bot: " + botResponse, "bot", true);
        
        const messageElement = document.querySelector('.chat-message.bot:last-child');
        addCategoryIcon(messageElement, category);
        saveChatItem(expenseDesc, botResponse);
        
        // Clear input field
        expenseInput.value = "";
    } catch (error) {
        console.error("Categorization error:", error);
        
        // Hide loading overlay
        document.getElementById('loading-overlay').classList.add('hidden');
        
        // Fallback to basic categorization
        const category = getDefaultCategory(expenseDesc);
        const botResponse = `I've categorized this as: <span class="category-tag">${category}</span>`;
        addMessage("Bot: " + botResponse, "bot", true);
        
        const messageElement = document.querySelector('.chat-message.bot:last-child');
        if (messageElement) addCategoryIcon(messageElement, category);
        saveChatItem(expenseDesc, botResponse);
        
        // Clear input field
        expenseInput.value = "";
    }
}

function getDefaultCategory(description) {
    // Simple fallback categorization for offline mode
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

    // Show loading overlay
    document.getElementById('loading-overlay').classList.remove('hidden');
    
    // Add user message
    addMessage(`You: ${query}`, "user");
    
    try {
        const response = await fetch(`${API_URL}/query`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ query })
        });
        
        // Hide loading overlay
        document.getElementById('loading-overlay').classList.add('hidden');
        
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
        
        // Clear input field
        queryInput.value = "";
    } catch (error) {
        console.error("Query error:", error);
        
        // Hide loading overlay
        document.getElementById('loading-overlay').classList.add('hidden');
        
        const fallbackResponse = "I'm currently unable to process your query. Please check your internet connection and try again.";
        addMessage("Bot: " + fallbackResponse, "bot error");
        saveChatItem(query, fallbackResponse);
        
        // Clear input field
        queryInput.value = "";
    }
}

function addMessage(text, sender, isHTML = false) {
    const chatbox = document.getElementById("chatbox");
    if (!chatbox) return null;
    
    // Remove welcome message if it exists
    const welcomeMessage = document.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }
    
    // Create message element
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
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = 'toast show';
    
    // After 3 seconds, remove the show class
    setTimeout(() => {
        toast.className = toast.className.replace("show", "");
    }, 3000);
}

function saveChatItem(question, answer) {
    const timestamp = new Date();
    
    // Add to chat history
    chatHistory.push({
        question,
        answer,
        timestamp: timestamp.toISOString()
    });
    
    // Keep only the last 10 items for better performance
    if (chatHistory.length > 10) {
        chatHistory = chatHistory.slice(-10);
    }
    
    // Save to localStorage
    localStorage.setItem('smartspend-chat-history', JSON.stringify(chatHistory));
    
    // Update sidebar
    updateChatHistorySidebar();
}

function loadChatHistory() {
    try {
        const savedHistory = localStorage.getItem('smartspend-chat-history');
        if (savedHistory) {
            chatHistory = JSON.parse(savedHistory);
            updateChatHistorySidebar();
        }
    } catch (e) {
        console.error("Error loading chat history:", e);
        // Clear potentially corrupted data
        localStorage.removeItem('smartspend-chat-history');
        chatHistory = [];
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
    
    // Display chat history in sidebar
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
            
            // If it's a categorization, add the icon
            if (item.answer.includes('category-tag')) {
                const messageElement = document.querySelector('.chat-message.bot');
                if (messageElement) {
                    // Extract category from the answer
                    const categoryMatch = item.answer.match(/category-tag">(.*?)<\/span>/);
                    if (categoryMatch && categoryMatch[1]) {
                        addCategoryIcon(messageElement, categoryMatch[1]);
                    }
                }
            }
        }
    }
}

function addToHistory() {
    const now = new Date();
    const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    // Create a new empty chat entry
    chatHistory.unshift({
        question: "New Chat",
        answer: "",
        timestamp: now.toISOString()
    });
    
    // Keep only the last 10 items
    if (chatHistory.length > 10) {
        chatHistory = chatHistory.slice(0, 10);
    }
    
    // Save to localStorage
    localStorage.setItem('smartspend-chat-history', JSON.stringify(chatHistory));
    
    // Update sidebar
    updateChatHistorySidebar();
}

function useExample(text) {
    document.getElementById('expense-desc').value = text;
    categorizeExpense();
}