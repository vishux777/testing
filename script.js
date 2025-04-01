document.addEventListener("DOMContentLoaded", function () {
    const categorizeBtn = document.getElementById("categorize-btn");
    const queryBtn = document.getElementById("query-btn");
    const descriptionInput = document.getElementById("expense-description");
    const queryInput = document.getElementById("query-text");
    const categoryResult = document.getElementById("category-result");
    const queryResult = document.getElementById("query-result");
    const BACKEND_URL = "YOUR_BACKEND_URL"; // Replace with actual backend URL

    categorizeBtn.addEventListener("click", async function () {
        const description = descriptionInput.value.trim();
        if (!description) {
            categoryResult.innerText = "Please enter an expense description.";
            return;
        }
        try {
            const response = await fetch(`${BACKEND_URL}/categorize`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ description })
            });
            const data = await response.json();
            categoryResult.innerText = `Category: ${data.category}`;
        } catch (error) {
            categoryResult.innerText = "Error categorizing expense. Try again.";
        }
    });

    queryBtn.addEventListener("click", async function () {
        const query = queryInput.value.trim();
        if (!query) {
            queryResult.innerText = "Please enter a question.";
            return;
        }
        try {
            const response = await fetch(`${BACKEND_URL}/query`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query })
            });
            const data = await response.json();
            queryResult.innerText = `Response: ${data.response}`;
        } catch (error) {
            queryResult.innerText = "Error processing query. Try again.";
        }
    });
});