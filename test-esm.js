// Simple test to verify ES modules are working
console.log('ES Modules test started');

// Test dynamic import
import('express').then(express => {
  console.log('Express module loaded successfully');
}).catch(err => {
  console.error('Failed to load express:', err);
});

// Test direct import
try {
  import jwt from 'jsonwebtoken';
  console.log('JWT module loaded successfully');
} catch (err) {
  console.error('Failed to load JWT:', err);
}
