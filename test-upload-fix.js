const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

async function testUpload() {
  try {
    // Create test data
    const movieData = {
      title: "Test Movie Frontend Fix",
      description: "Testing frontend upload fix",
      tagline: "Test tagline",
      releaseYear: 2024,
      releaseDate: "2024-01-01",
      type: "movie",
      contentRating: "PG-13",
      director: "Test Director",
      duration: 120,
      trailer: "https://example.com/trailer",
      cast: ["Actor 1", "Actor 2"],
      writers: ["Writer 1"],
      producers: ["Producer 1"],
      genreIds: []
    };

    // Create FormData exactly like frontend
    const formData = new FormData();
    
    // Add movie data as JSON string (exactly like frontend)
    formData.append('movieData', JSON.stringify(movieData));
    
    // Add test files
    if (fs.existsSync('./backend/test-video.mp4')) {
      formData.append('video', fs.createReadStream('./backend/test-video.mp4'));
    } else {
      console.log('Video file not found, skipping...');
      return;
    }
    
    if (fs.existsSync('./backend/test-thumbnail.jpg')) {
      formData.append('thumbnail', fs.createReadStream('./backend/test-thumbnail.jpg'));
    } else {
      console.log('Thumbnail file not found, skipping...');
      return;
    }

    console.log('Sending upload request...');
    
    const response = await axios.post('http://localhost:3001/api/movies/upload', formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': 'Bearer your-admin-token-here' // Replace with actual token
      },
      timeout: 30000
    });

    console.log('Upload successful:', response.data);
    
  } catch (error) {
    console.error('Upload failed:', error.response?.data || error.message);
  }
}

testUpload();
