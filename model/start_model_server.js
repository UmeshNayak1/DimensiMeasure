import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name correctly in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PYTHON_PATH = 'python';
const MODEL_API_SCRIPT = path.join(__dirname, 'api.py');
const MODEL_API_PORT = process.env.PYTHON_API_PORT || 5001;

// Start the Python model server
function startModelServer() {
  console.log(`Starting model server on port ${MODEL_API_PORT}...`);
  
  // Set environment variables for the Python process
  const env = Object.assign({}, process.env, {
    PYTHON_API_PORT: MODEL_API_PORT
  });
  
  // Spawn the Python process
  const pythonProcess = spawn(PYTHON_PATH, [MODEL_API_SCRIPT], {
    env,
    stdio: 'pipe'
  });
  
  // Handle stdout
  pythonProcess.stdout.on('data', (data) => {
    console.log(`[Model Server] ${data.toString().trim()}`);
  });
  
  // Handle stderr
  pythonProcess.stderr.on('data', (data) => {
    console.error(`[Model Server Error] ${data.toString().trim()}`);
  });
  
  // Handle process exit
  pythonProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(`Model server exited with code ${code}`);
    }
  });
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    pythonProcess.kill();
    process.exit(1);
  });
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.log('Stopping model server...');
    pythonProcess.kill();
    process.exit(0);
  });
  
  return pythonProcess;
}

// If this script is run directly, start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  startModelServer();
}

// Export the function for use in other modules
export { startModelServer };