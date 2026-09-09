const Manager = require('../models/Manager');
const generateToken = require('../utils/generateToken');

/**
 * @desc    Authenticate Manager & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginManager = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Auto-seed initial admin manager if database has 0 managers
    try {
      const managerCount = await Manager.countDocuments();
      if (managerCount === 0) {
        await Manager.create({
          name: 'System Admin',
          email: cleanEmail,
          password: password,
        });
      }
    } catch (seedErr) {
      console.warn('[Auto-seed Warning]', seedErr.message);
    }

    let manager = await Manager.findOne({ email: cleanEmail });

    if (manager && (await manager.matchPassword(password))) {
      const token = generateToken(manager._id);

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        manager: {
          id: manager._id,
          name: manager.name,
          email: manager.email,
          phone: manager.phone || '',
          profileImage: manager.profileImage || '',
          company: 'PixxTechnologies',
        },
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  } catch (error) {
    console.error('[Login Controller Error]', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during login',
    });
  }
};

/**
 * @desc    Get current logged in Manager profile
 * @route   GET /api/auth/me
 * @access  Private (Protected)
 */
const getMe = async (req, res) => {
  try {
    const manager = req.manager;
    return res.status(200).json({
      success: true,
      manager: {
        id: manager._id,
        name: manager.name,
        email: manager.email,
        phone: manager.phone || '',
        profileImage: manager.profileImage || '',
        company: 'PixxTechnologies',
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error fetching profile',
    });
  }
};

/**
 * @desc    Logout Manager
 * @route   POST /api/auth/logout
 * @access  Public
 */
const logoutManager = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

/**
 * @desc    Seed initial default manager account if database is empty
 */
const seedInitialManager = async () => {
  try {
    const count = await Manager.countDocuments();
    if (count === 0) {
      const defaultManager = await Manager.create({
        name: 'Pixx Manager',
        email: 'manager@pixxtechnologies.com',
        password: 'admin123',
        phone: '+92 300 0000000',
      });
      console.log(`[Seed Success] Created default manager: ${defaultManager.email} / admin123`);
    }
  } catch (error) {
    console.error('[Seed Error] Failed to seed initial manager:', error.message);
  }
};

module.exports = {
  loginManager,
  getMe,
  logoutManager,
  seedInitialManager,
};
