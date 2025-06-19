const { Setting } = require('../models');

class SettingController {
  async getSettings(req, res) {
    try {
      const settings = await Setting.findAll();
      
      const settingsObject = {};
      settings.forEach(setting => {
        settingsObject[setting.key] = setting.value;
      });

      res.json({
        success: true,
        data: settingsObject
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch settings'
      });
    }
  }

  async getSetting(req, res) {
    try {
      const { key } = req.params;
      const setting = await Setting.findOne({ where: { key } });

      if (!setting) {
        return res.status(404).json({
          success: false,
          message: 'Setting not found'
        });
      }

      res.json({
        success: true,
        data: setting
      });
    } catch (error) {
      console.error('Error fetching setting:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch setting'
      });
    }
  }

  async updateSetting(req, res) {
    try {
      const { key } = req.params;
      const { value, description } = req.body;

      const [setting, created] = await Setting.findOrCreate({
        where: { key },
        defaults: { key, value, description }
      });

      if (!created) {
        await setting.update({ value, description });
      }

      res.json({
        success: true,
        message: created ? 'Setting created successfully' : 'Setting updated successfully',
        data: setting
      });
    } catch (error) {
      console.error('Error updating setting:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update setting'
      });
    }
  }

  async updateMultipleSettings(req, res) {
    try {
      const { settings } = req.body;

      for (const [key, value] of Object.entries(settings)) {
        await Setting.findOrCreate({
          where: { key },
          defaults: { key, value }
        }).then(([setting, created]) => {
          if (!created) {
            return setting.update({ value });
          }
        });
      }

      res.json({
        success: true,
        message: 'Settings updated successfully'
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update settings'
      });
    }
  }

  async getShippingOrigin(req, res) {
    try {
      const setting = await Setting.findOne({ 
        where: { key: 'shipping_origin_id' } 
      });

      if (!setting) {
        return res.status(404).json({
          success: false,
          message: 'Shipping origin not configured'
        });
      }

      res.json({
        success: true,
        data: {
          origin_id: setting.value
        }
      });
    } catch (error) {
      console.error('Error fetching shipping origin:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch shipping origin'
      });
    }
  }
}

module.exports = new SettingController();