import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, LoginResponseDto } from './dto/auth.dto';
import { CreateUserDto } from '../users/dto/user.dto';
import { User } from '../users/user.entity';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ 
    summary: 'Register a new user',
    description: 'Create a new user account with email, password, first name, and last name'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'User registered successfully', 
    type: User 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - validation errors' 
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Conflict - user already exists' 
  })
  async register(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Login user',
    description: 'Authenticate user with email and password to receive JWT token'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful - returns JWT token and user information',
    type: LoginResponseDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - invalid email or password' 
  })
  @ApiBody({
    type: LoginDto,
    description: 'User login credentials',
    examples: {
      adminLogin: {
        summary: 'Admin Login',
        description: 'Login as admin user',
        value: {
          email: 'admin@movieapp.com',
          password: 'admin123'
        }
      },
      userLogin: {
        summary: 'Regular User Login',
        description: 'Login as regular user',
        value: {
          email: 'user@example.com',
          password: 'user123'
        }
      }
    }
  })
  async login(
    @Body() loginDto: LoginDto,
  ): Promise<{ access_token: string; user: User }> {
    return this.authService.login(loginDto);
  }
}