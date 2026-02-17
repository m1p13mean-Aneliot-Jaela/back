const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const employeeSchema = new mongoose.Schema({
  // Identité
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
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  
  // Clé étrangère - le shop parent
  shop_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  },
  shop_name: {
    type: String
  },
  
  // Rôle
  role: {
    type: String,
    enum: ['MANAGER_SHOP', 'STAFF'],
    default: 'STAFF'
  },
  
  // Statut
  active: {
    type: Boolean,
    default: true
  },
  
  // Dates
  joined_at: {
    type: Date,
    default: Date.now
  },
  last_login: {
    type: Date
  },
  
  // Historique des modifications
  update_history: [{
    first_name: String,
    last_name: String,
    email: String,
    phone: String,
    role: String,
    active: Boolean,
    updated_at: Date,
    updated_by: {
      user_id: mongoose.Schema.Types.ObjectId,
      first_name: String,
      last_name: String
    }
  }]
}, {
  timestamps: true,
  collection: 'employees'
});

// Index pour recherche rapide
employeeSchema.index({ shop_id: 1 });
employeeSchema.index({ email: 1 }, { unique: true });
employeeSchema.index({ role: 1 });
employeeSchema.index({ active: 1 });

// Hash password before saving
employeeSchema.pre('save', async function(next) {
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
employeeSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Don't return password in JSON
employeeSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;
