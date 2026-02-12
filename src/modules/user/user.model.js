const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  first_name: {
    type: String,
    required: true,
    trim: true
  },
  last_name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  registered_at: {
    type: Date,
    default: Date.now
  },
  user_type: {
    type: String,
    enum: ['admin', 'brand', 'shop', 'buyer'],
    required: true
  },
  profile_photo: {
    type: String
  },
  current_status: {
    status: {
      type: String,
      enum: ['active', 'suspended', 'blocked'],
      default: 'active'
    },
    reason: String,
    updated_at: Date
  },
  status_history: [{
    status: {
      type: String,
      enum: ['active', 'suspended', 'blocked']
    },
    reason: String,
    updated_at: Date
  }],
  update_history: [{
    email: String,
    password: String,
    first_name: String,
    last_name: String,
    phone: String,
    profile_photo: String,
    updated_at: Date
  }]
}, {
  timestamps: true,
  collection: 'users'
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Don't return password in JSON
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
