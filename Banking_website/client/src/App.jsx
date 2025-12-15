import React from 'react';
import { Button, Typography, Container } from '@mui/material';
import './App.css';

function App() {
  return (
    <Container className="min-h-screen flex flex-col items-center justify-center">
      {/* Material UI Component with Tailwind Styling */}
      <Typography 
        variant="h4" 
        className="mb-6 text-blue-600 font-bold"
      >
        Material UI + Tailwind Test
      </Typography>
      
      <div className="flex gap-4">
        {/* Pure Material UI Button */}
        <Button variant="contained" color="primary">
          MUI Button
        </Button>
        
        {/* Material UI Button with Tailwind CSS */}
        <Button 
          variant="contained" 
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          Tailwind Styled
        </Button>
      </div>
      
      {/* Pure Tailwind CSS Div */}
      <div className="mt-8 p-4 bg-green-100 border border-green-400 rounded-lg">
        <p className="text-green-800 font-semibold">
          ✅ If you see colored buttons and this green box, both are working!
        </p>
      </div>
    </Container>
  );
}

export default App;