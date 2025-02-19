import speedTest from "speedtest-net";
import { InfluxDB, Point } from "@influxdata/influxdb-client";
import { schedule } from "node-cron";
import { exec } from "child_process";

// InfluxDB Configuration
const INFLUX_URL = "http://localhost:8086"; // InfluxDB URL
const INFLUX_TOKEN = "your-influxdb-token"; // Replace with your token
const INFLUX_ORG = "your-org"; // Replace with your organization
const INFLUX_BUCKET = "speedtest"; // Replace with your bucket name
const INFLUX_SPEED_MEASUREMENT = "internet_speed";
const INFLUX_PING_MEASUREMENT = "ping_latency";

const client = new InfluxDB({ url: INFLUX_URL, token: INFLUX_TOKEN });
const writeApi = client.getWriteApi(INFLUX_ORG, INFLUX_BUCKET, "s");

async function runSpeedTest() {
  console.log(`[${new Date().toISOString()}] Running speed test...`);
  try {
    const result = await speedTest({ acceptLicense: true, acceptGdpr: true });
    const downloadSpeed = result.download.bandwidth / 125000;
    const uploadSpeed = result.upload.bandwidth / 125000;
    const ping = result.ping.latency;
    const jitter = result.ping.jitter;
    const isp = result.isp;
    const serverName = result.server.name;

    console.log(`Speedtest result: ${downloadSpeed.toFixed(2)} Mbps down, ${uploadSpeed.toFixed(2)} Mbps up, ${ping} ms ping`);

    const point = new Point(INFLUX_SPEED_MEASUREMENT)
      .stringField("isp", isp)
      .stringField("server", serverName)
      .floatField("download_speed_mbps", downloadSpeed)
      .floatField("upload_speed_mbps", uploadSpeed)
      .floatField("ping_ms", ping)
      .floatField("jitter_ms", jitter);

    writeApi.writePoint(point);
    await writeApi.flush();
    console.log(`[${new Date().toISOString()}] Data written to InfluxDB`);
  } catch (error) {
    console.error("Error running speed test:", error);
    try {
      const point = new Point(INFLUX_SPEED_MEASUREMENT)
        .stringField("isp", "none")
        .stringField("server", "none")
        .floatField("download_speed_mbps", 0)
        .floatField("upload_speed_mbps", 0)
        .floatField("ping_ms", 0)
        .floatField("jitter_ms", 0);
      writeApi.writePoint(point);
      await writeApi.flush();
      console.log(`[${new Date().toISOString()}] Empty data written to InfluxDB`);
    } catch (error) {
      console.error("Error writing empty data to InfluxDB:", error);
    }
  }
}

async function runPingTest() {
  console.log(`[${new Date().toISOString()}] Running ping test...`);
  const hosts = ["1.1.1.1", "google.com", "icloud.com", "8.8.8.8", "amazon.com"];

  for (const host of hosts) {
    exec(`ping -c 5 ${host}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error pinging ${host}:`, stderr.trim());
        writePingResult(host, 0, 100);
        return;
      }
      const matches = stdout.match(/time=(\d+\.\d+)/g);
      const packetLossMatch = stdout.match(/(\d+)% packet loss/);
      const packetLoss = packetLossMatch ? parseFloat(packetLossMatch[1]) : 0;

      if (matches) {
        const latencies = matches.map(m => parseFloat(m.split("=")[1]));
        const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
        console.log(`Ping to ${host}: ${avgLatency.toFixed(2)} ms, Packet Loss: ${packetLoss}%`);
        writePingResult(host, avgLatency, packetLoss);
      } else {
        console.warn(`No latency data for ${host}`);
        writePingResult(host, 0, 100);
      }
    });
  }
}

function writePingResult(host, latency, packetLoss) {
  const point = new Point(INFLUX_PING_MEASUREMENT)
    .tag("host", host)
    .floatField("latency_ms", latency)
    .floatField("packet_loss_percent", packetLoss);
  writeApi.writePoint(point);
  writeApi.flush().then(() => console.log(`[${new Date().toISOString()}] Ping data written to InfluxDB for ${host}`));
}

// Schedule the speed test every 15 minutes
schedule("2,17,32,47 * * * *", runSpeedTest);

// Schedule the ping test every minute
schedule("* * * * *", runPingTest);

console.log("Speedtest cron job scheduled every 15 minutes.");
console.log("Ping test cron job scheduled every minute.");
