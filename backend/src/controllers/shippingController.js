const axios = require('axios');

const KOMERCE_API_BASE_URL = process.env.KOMERCE_API_BASE_URL || 'https://api.komerce.id';
const KOMERCE_API_KEY = process.env.KOMERCE_API_KEY;
const RAJAONGKIR_API_KEY = process.env.RAJAONGKIR_API_KEY;

class ShippingController {
  async searchDestination(req, res) {
    try {
      const { search, limit = 10, offset = 0 } = req.query;

      if (!search) {
        return res.status(400).json({
          success: false,
          message: 'Parameter search is required'
        });
      }

      const response = await axios.get(`https://rajaongkir.komerce.id/api/v1/destination/domestic-destination`, {
        params: {
          search: search,
          limit: parseInt(limit),
          offset: parseInt(offset)
        },
        headers: {
          'key': RAJAONGKIR_API_KEY,
          'Content-Type': 'application/json'
        }
      });

      res.json({
        success: true,
        data: response.data
      });
    } catch (error) {
      console.error('Error searching destination:', error.response?.data || error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to search destination',
        error: error.response?.data || error.message
      });
    }
  }

  async getProvinces(req, res) {
    try {
      const response = await axios.get(`${KOMERCE_API_BASE_URL}/rajaongkir/search-destination`, {
        params: {
          q: '',
          api_key: RAJAONGKIR_API_KEY
        },
        headers: {
          'Authorization': `Bearer ${KOMERCE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const provinces = response.data.filter(item => item.type === 'province');

      res.json({
        success: true,
        data: provinces
      });
    } catch (error) {
      console.error('Error fetching provinces:', error.response?.data || error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch provinces',
        error: error.response?.data || error.message
      });
    }
  }

  async getCities(req, res) {
    try {
      const { province } = req.query;
      
      let searchQuery = '';
      if (province) {
        searchQuery = province;
      }

      const response = await axios.get(`${KOMERCE_API_BASE_URL}/rajaongkir/search-destination`, {
        params: {
          q: searchQuery,
          api_key: RAJAONGKIR_API_KEY
        },
        headers: {
          'Authorization': `Bearer ${KOMERCE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const cities = response.data.filter(item => item.type === 'city');

      res.json({
        success: true,
        data: cities
      });
    } catch (error) {
      console.error('Error fetching cities:', error.response?.data || error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch cities',
        error: error.response?.data || error.message
      });
    }
  }

  async calculateShippingCost(req, res) {
    try {
      const { origin, destination, weight, courier, price = 'lowest' } = req.body;

      if (!origin || !destination || !weight || !courier) {
        return res.status(400).json({
          success: false,
          message: 'Missing required parameters: origin, destination, weight, courier'
        });
      }

      const payload = {
        Origin: String(origin),
        Destination: String(destination),
        Weight: parseInt(weight),
        Courier: courier,
        Price: price
      };

      console.log('Sending payload:', payload);

      const response = await axios.post(`https://rajaongkir.komerce.id/api/v1/calculate/domestic-cost`, new URLSearchParams({
        origin: String(origin),
        destination: String(destination),
        weight: String(weight),
        courier: courier,
        price: price
      }), {
        headers: {
          'key': RAJAONGKIR_API_KEY,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      res.json({
        success: true,
        data: response.data
      });
    } catch (error) {
      console.error('Error calculating shipping cost:', error.response?.data || error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to calculate shipping cost',
        error: error.response?.data || error.message
      });
    }
  }

  async getSupportedCouriers(req, res) {
    try {
      const couriers = [
        { code: 'jne', name: 'JNE' },
        { code: 'pos', name: 'POS Indonesia' },
        { code: 'tiki', name: 'TIKI' }
      ];

      res.json({
        success: true,
        data: couriers
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch supported couriers'
      });
    }
  }
}

module.exports = new ShippingController();