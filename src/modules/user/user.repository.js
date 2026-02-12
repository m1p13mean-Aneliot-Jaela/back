const User = require('./user.model');

class UserRepository {
  async create(userData) {
    const user = new User(userData);
    return user.save();
  }

  async findById(id) {
    return User.findById(id).select('-password');
  }

  async findByEmail(email) {
    return User.findOne({ email: email.toLowerCase() });
  }

  async findAll(filters = {}, options = {}) {
    const { page = 1, limit = 10, sort = { registered_at: -1 } } = options;
    const skip = (page - 1) * limit;

    const query = User.find(filters)
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const users = await query.exec();
    const total = await User.countDocuments(filters);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async update(id, updateData) {
    // Store update history
    const user = await User.findById(id);
    if (user && updateData) {
      const historyEntry = {
        updated_at: new Date()
      };
      
      ['email', 'first_name', 'last_name', 'phone', 'profile_photo'].forEach(field => {
        if (updateData[field]) {
          historyEntry[field] = updateData[field];
        }
      });

      if (Object.keys(historyEntry).length > 1) {
        if (!user.update_history) user.update_history = [];
        user.update_history.push(historyEntry);
      }
    }

    return User.findByIdAndUpdate(
      id,
      { ...updateData, $push: user?.update_history ? { update_history: user.update_history[user.update_history.length - 1] } : {} },
      { new: true, runValidators: true }
    ).select('-password');
  }

  async updateStatus(id, status, reason = '') {
    const user = await User.findById(id);
    if (!user) return null;

    const statusUpdate = {
      status,
      reason,
      updated_at: new Date()
    };

    user.current_status = statusUpdate;
    if (!user.status_history) user.status_history = [];
    user.status_history.push(statusUpdate);

    return user.save();
  }

  async delete(id) {
    return User.findByIdAndDelete(id);
  }

  async exists(email) {
    const user = await User.findOne({ email: email.toLowerCase() });
    return !!user;
  }

  async count(filters = {}) {
    return User.countDocuments(filters);
  }
}

module.exports = new UserRepository();
