const request = require('supertest');
const { Test } = require('@nestjs/testing');
const { AppModule } = require('./dist/app.module');
const { ValidationPipe } = require('@nestjs/common');

async function testAPI() {
  console.log('🧪 Starting API Test...');
  
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(new ValidationPipe());
  await app.init();

  console.log('✅ App initialized');

  try {
    // Test health endpoint
    console.log('📋 Testing health endpoint...');
    const healthResponse = await request(app.getHttpServer())
      .get('/')
      .expect(200);
    console.log('✅ Health check passed:', healthResponse.text);

    // Test user registration
    console.log('📋 Testing user registration...');
    const timestamp = Date.now();
    const newUser = {
      email: `test-${timestamp}@example.com`,
      password: 'password123',
      firstName: 'Test',
      lastName: 'User'
    };

    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(newUser);

    console.log('📊 Registration response status:', registerResponse.status);
    console.log('📊 Registration response body:', JSON.stringify(registerResponse.body, null, 2));

    if (registerResponse.status === 201) {
      console.log('✅ User registration successful');
      
      // Test login
      console.log('📋 Testing user login...');
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: newUser.email,
          password: newUser.password
        });

      console.log('📊 Login response status:', loginResponse.status);
      console.log('📊 Login response body:', JSON.stringify(loginResponse.body, null, 2));

      if (loginResponse.status === 200) {
        console.log('✅ User login successful');
        console.log('🔐 JWT Token generated:', loginResponse.body.access_token ? 'Yes' : 'No');
        console.log('🔒 Password exposed in response:', loginResponse.body.user.password ? 'Yes (BAD)' : 'No (GOOD)');
      } else {
        console.log('❌ User login failed');
      }
    } else {
      console.log('❌ User registration failed');
    }

  } catch (error) {
    console.error('❌ API Test failed:', error.message);
  }

  await app.close();
  console.log('🏁 API Test completed');
}

testAPI().catch(console.error);
