const { ShopProfile } = require('./shop.model');
const { NotFoundError, ValidationError } = require('../../shared/errors/custom-errors');

class ShopService {
  // Get shop profile by ID
  async getProfile(shopId) {
    const profile = await ShopProfile.findOne({ shop_id: shopId });
    if (!profile) {
      // Auto-create profile if not exists
      return this.createDefaultProfile(shopId);
    }
    return profile;
  }

  // Create default profile
  async createDefaultProfile(shopId) {
    const profile = new ShopProfile({
      shop_id: shopId,
      name: 'Ma Boutique',
      location: {
        country: 'MG'
      },
      business_hours: {
        monday: { open: '08:00', close: '18:00', closed: false },
        tuesday: { open: '08:00', close: '18:00', closed: false },
        wednesday: { open: '08:00', close: '18:00', closed: false },
        thursday: { open: '08:00', close: '18:00', closed: false },
        friday: { open: '08:00', close: '18:00', closed: false },
        saturday: { open: '08:00', close: '12:00', closed: false },
        sunday: { open: '08:00', close: '18:00', closed: true }
      },
      contact: {},
      social_media: {},
      settings: {
        currency: 'MGA',
        timezone: 'Indian/Antananarivo',
        language: 'fr'
      }
    });
    await profile.save();
    return profile;
  }

  // Update shop profile
  async updateProfile(shopId, data) {
    let profile = await ShopProfile.findOne({ shop_id: shopId });
    
    if (!profile) {
      // Create if not exists
      profile = new ShopProfile({
        shop_id: shopId,
        ...data
      });
    } else {
      // Update existing
      Object.assign(profile, data);
    }

    await profile.save();
    return profile;
  }

  // Partial update (PATCH)
  async patchProfile(shopId, data) {
    const profile = await ShopProfile.findOne({ shop_id: shopId });
    if (!profile) {
      throw new NotFoundError('Profil boutique non trouvé');
    }

    // Deep merge for nested objects
    if (data.location) {
      profile.location = { ...profile.location, ...data.location };
    }
    if (data.business_hours) {
      Object.assign(profile.business_hours, data.business_hours);
    }
    if (data.contact) {
      profile.contact = { ...profile.contact, ...data.contact };
    }
    if (data.social_media) {
      profile.social_media = { ...profile.social_media, ...data.social_media };
    }
    if (data.settings) {
      profile.settings = { ...profile.settings, ...data.settings };
    }

    // Simple fields
    const simpleFields = ['name', 'logo', 'description', 'is_active'];
    simpleFields.forEach(field => {
      if (data[field] !== undefined) {
        profile[field] = data[field];
      }
    });

    await profile.save();
    return profile;
  }

  // Update logo
  async updateLogo(shopId, logoUrl) {
    const profile = await ShopProfile.findOneAndUpdate(
      { shop_id: shopId },
      { logo: logoUrl, updated_at: new Date() },
      { new: true, upsert: true }
    );
    return profile;
  }

  // Update location (with coordinates from Google Maps)
  async updateLocation(shopId, locationData) {
    const profile = await ShopProfile.findOne({ shop_id: shopId });
    if (!profile) {
      throw new NotFoundError('Profil boutique non trouvé');
    }

    profile.location = {
      ...profile.location,
      ...locationData
    };

    await profile.save();
    return profile;
  }

  // Update business hours
  async updateBusinessHours(shopId, hoursData) {
    const profile = await ShopProfile.findOne({ shop_id: shopId });
    if (!profile) {
      throw new NotFoundError('Profil boutique non trouvé');
    }

    Object.assign(profile.business_hours, hoursData);
    await profile.save();
    return profile;
  }

  // Check if shop is currently open
  async isShopOpen(shopId) {
    const profile = await ShopProfile.findOne({ shop_id: shopId });
    if (!profile) return null;

    const now = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = dayNames[now.getDay()];
    const dayHours = profile.business_hours?.[currentDay];

    if (!dayHours || dayHours.closed) {
      return { open: false, reason: 'closed' };
    }

    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [openHour, openMin] = dayHours.open.split(':').map(Number);
    const [closeHour, closeMin] = dayHours.close.split(':').map(Number);
    const openTime = openHour * 60 + openMin;
    const closeTime = closeHour * 60 + closeMin;

    const isOpen = currentTime >= openTime && currentTime < closeTime;
    return {
      open: isOpen,
      hours: dayHours,
      next_open: !isOpen ? dayHours.open : null
    };
  }

  // Get shops near location (for customer discovery)
  async getShopsNearLocation(latitude, longitude, maxDistance = 10000) {
    // maxDistance in meters (default 10km)
    const shops = await ShopProfile.find({
      is_active: true,
      'location.latitude': { $exists: true },
      'location.longitude': { $exists: true }
    }).lean();

    // Calculate distance and filter
    const shopsWithDistance = shops.map(shop => {
      const distance = this.calculateDistance(
        latitude, longitude,
        shop.location.latitude, shop.location.longitude
      );
      return { ...shop, distance };
    });

    return shopsWithDistance
      .filter(s => s.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance);
  }

  // Calculate distance using Haversine formula
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }
}

module.exports = new ShopService();
