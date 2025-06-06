import axios from 'axios';

const API_URL = 'http://localhost:3000';

async function testEndpoints() {
  try {
    // 1. Login as admin
    console.log('Testing login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123',
    });
    
    const token = loginResponse.data.access_token;
    console.log('Login successful!');

    // 2. Create a new user
    console.log('\nCreating new user...');
    const newUser = {
      name: 'Test Employee',
      email: 'employee@example.com',
      password: 'employee123',
      role: 'EMPLOYEE',
    };

    const createUserResponse = await axios.post(
      `${API_URL}/users`,
      newUser,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log('User created successfully:', createUserResponse.data);

    // 3. Get all users
    console.log('\nFetching all users...');
    const usersResponse = await axios.get(`${API_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('Users fetched successfully:', usersResponse.data);

  } catch (error) {
    if (error.response) {
      console.error('Error response:', {
        status: error.response.status,
        data: error.response.data,
      });
    } else {
      console.error('Error:', error.message);
    }
  }
}

testEndpoints(); 