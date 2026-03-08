import express from 'express';
import { createServer as createViteServer } from 'vite';
import db from './database.js';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cors());

  // --- API Routes ---

  // Register
  app.post('/api/register', (req, res) => {
    const { username, password, email } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    try {
      // Check if user already exists
      const existingUser = db.prepare('SELECT * FROM user WHERE username = ?').get(username);
      if (existingUser) {
        return res.status(409).json({ success: false, message: 'Username already exists' });
      }

      const user_id = uuidv4();
      
      db.prepare('INSERT INTO user (user_id, username, password, email) VALUES (?, ?, ?, ?)').run(
        user_id,
        username,
        password,
        email || null
      );

      res.json({ success: true, user: { user_id, username } });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // Login
  app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    try {
      const user = db.prepare('SELECT * FROM user WHERE username = ?').get(username) as any;
      if (user && user.password === password) {
        res.json({ success: true, user: { user_id: user.user_id, username: user.username } });
      } else {
        res.status(401).json({ success: false, message: 'Invalid username or password' });
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // Get prompts (mocked)
  app.get('/api/prompts', (req, res) => {
    res.json([
      {
        id: 'prompt_1',
        title: 'Education',
        text: 'Some people think that all university students should study whatever they like. Others believe that they should only be allowed to study subjects that will be useful in the future, such as those related to science and technology. Discuss both these views and give your own opinion.'
      },
      {
        id: 'prompt_2',
        title: 'Environment',
        text: 'Global warming is one of the most serious issues that the world is facing today. What are the causes of global warming and what measures can governments and individuals take to tackle the issue?'
      },
      {
        id: 'prompt_3',
        title: 'Technology',
        text: 'In the future, nobody will buy printed newspapers or books because they will be able to read everything they want online without paying. To what extent do you agree or disagree with this statement?'
      }
    ]);
  });

  // Submit writing
  app.post('/api/submit', async (req, res) => {
    const { user_id, content, time, prompt_text } = req.body;
    
    if (!user_id || !content) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const writing_id = uuidv4();
    
    try {
      // 1. Save writing to database
      db.prepare('INSERT INTO writing (writing_id, user_id, writing_content, writing_time, prompt_text) VALUES (?, ?, ?, ?, ?)').run(
        writing_id,
        user_id,
        content,
        time || 0,
        prompt_text || null
      );

      // 2. Call n8n webhook
      const webhookUrl = process.env.N8N_WEBHOOK_URL;
      let scoreData = null;
      let debugInfo = '';

      if (webhookUrl) {
        console.log(`Calling webhook URL: ${webhookUrl}`);
        try {
          const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id, content, writing_id, prompt_text })
          });
          
          if (response.ok) {
            const textResponse = await response.text();
            debugInfo = `Raw response from n8n:\n${textResponse}`;
            try {
              const parsedData = textResponse ? JSON.parse(textResponse) : null;
              
              // Handle n8n array format: [{ output: { TA_score: 7, ... } }]
              if (Array.isArray(parsedData) && parsedData.length > 0) {
                if (parsedData[0].output) {
                  scoreData = parsedData[0].output;
                } else {
                  scoreData = parsedData[0];
                }
              } else if (parsedData && parsedData.output) {
                // Handle n8n object format: { output: { TA_score: 7, ... } }
                scoreData = parsedData.output;
              } else {
                scoreData = parsedData;
              }
            } catch (parseError) {
              console.error('Failed to parse webhook response as JSON:', parseError);
              console.error('Raw response was:', textResponse);
              scoreData = null;
            }
          } else {
            const errorText = await response.text();
            debugInfo = `Webhook returned error: ${response.status}\n${errorText}`;
            console.error('Webhook returned error:', response.status, errorText);
          }
        } catch (webhookError: any) {
          debugInfo = `Failed to call webhook: ${webhookError.message}`;
          console.error('Failed to call webhook:', webhookError);
        }
      } else {
        debugInfo = 'N8N_WEBHOOK_URL environment variable is not set.';
      }

      // 3. If webhook failed or not configured, generate mock score
      if (!scoreData || (!scoreData.TA_Score && !scoreData.TA_score)) {
        scoreData = {
          TA_Score: (Math.random() * 4 + 5).toFixed(1),
          CC_Score: (Math.random() * 4 + 5).toFixed(1),
          LR_Score: (Math.random() * 4 + 5).toFixed(1),
          GRA_score: (Math.random() * 4 + 5).toFixed(1),
          comment: `This is a mock comment because the n8n webhook URL is not configured, failed to respond, or returned invalid data.\n\n--- DEBUG INFO ---\n${debugInfo}\n------------------`
        };
      }

      // 4. Save score to database
      const score_id = uuidv4();
      db.prepare('INSERT INTO score (score_id, writing_id, TA_score, CC_score, LR_score, GRA_score, Comment) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
        score_id,
        writing_id,
        parseFloat(scoreData.TA_Score || scoreData.TA_score),
        parseFloat(scoreData.CC_Score || scoreData.CC_score),
        parseFloat(scoreData.LR_Score || scoreData.LR_score),
        parseFloat(scoreData.GRA_score || scoreData.GRA_Score),
        scoreData.comment || scoreData.Comment
      );

      res.json({ success: true, writing_id });
    } catch (error) {
      console.error('Submit error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // Get result
  app.get('/api/results/:writing_id', (req, res) => {
    const { writing_id } = req.params;
    try {
      const writing = db.prepare('SELECT * FROM writing WHERE writing_id = ?').get(writing_id) as any;
      const score = db.prepare('SELECT * FROM score WHERE writing_id = ?').get(writing_id) as any;
      
      if (writing && score) {
        res.json({ success: true, writing, score });
      } else {
        res.status(404).json({ success: false, message: 'Result not found' });
      }
    } catch (error) {
      console.error('Get result error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
