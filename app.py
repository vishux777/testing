<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Expense Categorization</title>
    <script>
        async function categorizeExpense() {
            const description = document.getElementById("description").value;
            const response = await fetch("https://your-streamlit-app-url.com", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: description })
            });
            const result = await response.json();
            document.getElementById("categoryResult").innerText = "Category: " + result.category;
        }
    </script>
</head>
<body>
    <h1>Expense Categorization</h1>
    <input type="text" id="description" placeholder="Enter expense description">
    <button onclick="categorizeExpense()">Categorize</button>
    <p id="categoryResult"></p>
</body>
</html>
