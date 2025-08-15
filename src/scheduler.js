import { spawn } from 'child_process';
import fs from 'fs';

const {
  CHECK_INTERVAL_HOURS = "24",
  LOG_FILE = "scheduler.log"
} = process.env;

// Logga med timestamp
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  
  // Spara till log-fil
  fs.appendFileSync(LOG_FILE, logMessage + '\n');
}

// Kör schemalagd AI-agent
async function runScheduledAI() {
  return new Promise((resolve, reject) => {
    log('🤖 Starting scheduled AI agent...');
    
    const child = spawn('node', ['src/scheduledAI.js'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let output = '';
    let errorOutput = '';
    
    child.stdout.on('data', (data) => {
      const message = data.toString();
      output += message;
      log(`AI Agent: ${message.trim()}`);
    });
    
    child.stderr.on('data', (data) => {
      const message = data.toString();
      errorOutput += message;
      log(`AI Agent Error: ${message.trim()}`);
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        log('✅ Scheduled AI agent completed successfully');
        resolve(output);
      } else {
        log(`❌ Scheduled AI agent failed with code ${code}`);
        reject(new Error(`AI agent failed: ${errorOutput}`));
      }
    });
    
    child.on('error', (error) => {
      log(`❌ Failed to start AI agent: ${error.message}`);
      reject(error);
    });
  });
}

// Huvudschemaläggare
async function startScheduler() {
  log('🚀 Starting AI Product Agent Scheduler...');
  log(`⏰ Will run every ${CHECK_INTERVAL_HOURS} hours`);
  log(`📝 Logs saved to: ${LOG_FILE}`);
  
  const intervalMs = parseInt(CHECK_INTERVAL_HOURS) * 60 * 60 * 1000;
  
  // Kör första gången direkt
  try {
    await runScheduledAI();
  } catch (error) {
    log(`❌ First run failed: ${error.message}`);
  }
  
  // Schemalägg framtida körningar
  setInterval(async () => {
    try {
      await runScheduledAI();
    } catch (error) {
      log(`❌ Scheduled run failed: ${error.message}`);
    }
  }, intervalMs);
  
  log(`✅ Scheduler running. Next run in ${CHECK_INTERVAL_HOURS} hours`);
  
  // Håll processen igång
  process.on('SIGINT', () => {
    log('🛑 Scheduler stopped by user');
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    log('🛑 Scheduler stopped by system');
    process.exit(0);
  });
}

// Starta schemaläggaren
startScheduler().catch(error => {
  log(`❌ Fatal scheduler error: ${error.message}`);
  process.exit(1);
});
