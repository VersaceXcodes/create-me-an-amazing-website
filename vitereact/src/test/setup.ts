import '@testing-library/jest-dom';
import { beforeAll } from 'vitest';
import axios from 'axios';

// Wait for backend server to be ready before running tests
beforeAll(async () => {
  const maxRetries = 30;
  const retryDelay = 1000; // 1 second
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      await axios.get('http://localhost:3000/', { timeout: 2000 });
      console.log('✓ Backend server is ready');
      return;
    } catch {
      if (i === maxRetries - 1) {
        throw new Error('Backend server is not responding after 30 seconds');
      }
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
}, 35000);
