# Speedtest to InfluxDB

This is a Node.js script that automatically runs an internet speed test every 15 minutes and writes the results to an InfluxDB database.

## Features
✅ Runs a speed test using `speedtest-net`
✅ Logs download speed, upload speed, ping, and jitter to InfluxDB
✅ Uses `node-cron` to run the test every 15 minutes
✅ Runs once immediately when started

## Requirements

- **Node.js**
- **InfluxDB** (running locally or on a server)
- An **InfluxDB API Token** with write access

## Installation

1. **Clone this repository**
```sh
git clone https://github.com/yourusername/speedtest-to-influxdb.git
cd speedtest-to-influxdb
```

2. **Install dependencies**
```sh
npm install
```

3. **Configure InfluxDB**

* Open `speedtest-to-influxdb.js`

* Set your InfluxDB details:
```js
const INFLUX_URL = 'http://localhost:8086';  // InfluxDB URL
const INFLUX_TOKEN = 'your-influxdb-token';  // Replace with your token
const INFLUX_ORG = 'your-org';               // Replace with your organization
const INFLUX_BUCKET = 'speedtest';           // Replace with your bucket name
```

## Usage

To start the script, run:

```sh
npm start
```

or directly:

```sh
node speedtest-to-influxdb.js
```
