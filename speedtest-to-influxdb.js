import speedTest from "speedtest-net";
import { InfluxDB, Point } from "@influxdata/influxdb-client";
import { schedule } from "node-cron";

// InfluxDB Configuration
const INFLUX_URL = "http://localhost:8086"; // InfluxDB URL
const INFLUX_TOKEN = "your-influxdb-token"; // Replace with your token
const INFLUX_ORG = "your-org"; // Replace with your organization
const INFLUX_BUCKET = "speedtest"; // Replace with your bucket name
const INFLUX_MEASUREMENT_NAME = "internet_speed"; // Replace with your measurement name

const client = new InfluxDB({ url: INFLUX_URL, token: INFLUX_TOKEN });
const writeApi = client.getWriteApi(INFLUX_ORG, INFLUX_BUCKET, "s");

async function runSpeedTest() {
  console.log(`[${new Date().toISOString()}] Running speed test...`);

  try {
    const result = await speedTest({
      acceptLicense: true,
      acceptGdpr: true,
    });

    // Convert speeds from bits/sec to Mbps
    const downloadSpeed = result.download.bandwidth / 125000;
    const uploadSpeed = result.upload.bandwidth / 125000;
    const ping = result.ping.latency;
    const jitter = result.ping.jitter;
    const isp = result.isp;
    const serverName = result.server.name;

    console.log(
      `Speedtest result: ${downloadSpeed.toFixed(2)} Mbps down, ${uploadSpeed.toFixed(2)} Mbps up, ${ping} ms ping`,
    );

    // Create an InfluxDB data point
    const point = new Point(INFLUX_MEASUREMENT_NAME)
      .tag("isp", isp)
      .tag("server", serverName)
      .floatField("download_speed_mbps", downloadSpeed)
      .floatField("upload_speed_mbps", uploadSpeed)
      .floatField("ping_ms", ping)
      .floatField("jitter_ms", jitter);

    // Write data to InfluxDB
    writeApi.writePoint(point);
    await writeApi.flush();

    console.log(`[${new Date().toISOString()}] Data written to InfluxDB`);
  } catch (error) {
    console.error("Error running speed test:", error);
  }
}

// Schedule the speed test every 15 minutes using cron (runs at minute 0, 15, 30, and 45 of every hour)
schedule("0,15,30,45 * * * *", () => {
  runSpeedTest();
});

console.log("Speedtest cron job scheduled every 15 minutes.");
