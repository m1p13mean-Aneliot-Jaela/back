const jwt = require('jsonwebtoken');
const config = require('../../config/env');
const userRepository = require('../user/user.repository');
const { ValidationError, UnauthorizedError, ForbiddenError } = require('../../shared/errors/custom-errors');

class AuthService {
  generateAccessToken(user) {
    const payload = {
      id: user._id,
      email: user.email,
      user_type: user.user_type,
      status: user.current_status?.status || 'active'
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    });
  }

  generateRefreshToken(user) {
    const payload = {
      id: user._id,
      email: user.email
    };

    return jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn
    });
  }

  verifyAccessToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Token expired');
      }
      throw new UnauthorizedError('Invalid token');
    }
  }

  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, config.jwt.refreshSecret);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Refresh token expired');
      }
      throw new UnauthorizedError('Invalid refresh token');
    }
  }

  async signup(signupData) {
    const { email, password, first_name, last_name, phone } = signupData;

    // Only buyers can signup, other user types are created by admin
    const user_type = 'buyer';

    // Check if user already exists
    const existingUser = await userRepository.exists(email);
    if (existingUser) {
      throw new ValidationError('User with this email already exists');
    }

    // Create user
    const userData = {
      email,
      password,
      first_name,
      last_name,
      phone,
      user_type,
      registered_at: new Date(),
      current_status: {
        status: 'active',
        updated_at: new Date()
      }
    };

    const user = await userRepository.create(userData);

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      user: {
        id: user._id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        user_type: user.user_type,
        phone: user.phone,
        profile_photo: user.profile_photo
      },
      tokens: {
        accessToken,
        refreshToken
      }
    };
  }

  async login(email, password) {
    // Find user
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if user is active
    if (user.current_status?.status !== 'active') {
      throw new ForbiddenError(`Account is ${user.current_status?.status}. ${user.current_status?.reason || ''}`);
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      user: {
        id: user._id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        user_type: user.user_type,
        phone: user.phone,
        profile_photo: user.profile_photo
      },
      tokens: {
        accessToken,
        refreshToken
      }
    };
  }

  async refreshTokens(refreshToken) {
    // Verify refresh token
    const decoded = this.verifyRefreshToken(refreshToken);

    // Get user
    const user = await userRepository.findById(decoded.id);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Check if user is active
    if (user.current_status?.status !== 'active') {
      throw new ForbiddenError('Account is not active');
    }

    // Generate new tokens
    const newAccessToken = this.generateAccessToken(user);
    const newRefreshToken = this.generateRefreshToken(user);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  }

  async logout(userId) {
    // In a production app, you might want to blacklist the token
    // or store refresh tokens in DB and remove them on logout
    // For now, we'll just return success
    return { success: true };
  }

  async validateToken(token) {
    const decoded = this.verifyAccessToken(token);
    const user = await userRepository.findById(decoded.id);
    
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (user.current_status?.status !== 'active') {
      throw new ForbiddenError('Account is not active');
    }

    return {
      id: user._id,
      email: user.email,
      user_type: user.user_type,
      status: user.current_status?.status
    };
  }
}

module.exports = new AuthService();
