# Ether State Analysis Project

This project is a collection of scripts that fetch and analyze data related to Ethereum validators. The data is fetched from various APIs and processed to calculate various metrics such as waiting times, churn rates, and staking percentages.

# Files

# index.html

This is the main HTML file that displays the data in a graphical format using Chart.js. It fetches data from the /entryExitData endpoint and displays it in a line chart.

# cron.js

This is a Node.js script that fetches data from various APIs, processes it, and stores it in a JSON file. It calculates various metrics such as waiting times, churn rates, and staking percentages. It also updates the historical data file with the latest data.

# app.js

This is the main server file. It sets up an Express.js server that serves the index.html file and provides an endpoint (/entryExitData) to fetch the entry and exit data.

# historicalData.json

This is a JSON file that stores historical data about Ethereum validators. The data includes date, number of validators, entry queue size, entry wait time, exit queue size, exit wait time, churn rate, Ethereum supply, amount staked, staking percentage, and APR.

# package.json

This file contains the metadata of the project and its dependencies. It also includes scripts to start the project.

# Dependencies

The project uses the following dependencies:

- axios: For making HTTP requests to fetch data from APIs.
- chart.js: For creating charts to visualize the data.
- dotenv: For loading environment variables from a .env file.
- express: For setting up the server.
- moment: For handling dates and times.

# Usage

1. Install the dependencies by running npm install.
2. Create a .env file in the root directory of the project and add your API key for the Beaconcha.in API as API_KEY.
3. Run the cron.js script regularly (e.g., daily) to fetch the latest data and update the historical data file. You can do this by setting up a cron job or similar task scheduler.
4. Start the server by running npm start. This will start the server on the port specified in your .env file or port 3000 if no port is specified.
5. Open your web browser and navigate to http://localhost:3000/entryExitData to view the data in a graphical format. Replace <port> with the port number your server is running on.

# Screenshots

- This graph shows ethereum validators start time and end time difference with historical data
<img width="745" alt="Screenshot 2023-12-10 at 10 44 54 PM" src="https://github.com/gdg4dev/ether-state-analysis/assets/23173443/26a8a29e-f0e1-4a7c-a90d-cd824c3ba651">
