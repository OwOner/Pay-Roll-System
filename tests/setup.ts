import { config } from 'dotenv'
import path from 'path'

// Load .env.local for test environment
config({ path: path.resolve(__dirname, '../.env.local') })
