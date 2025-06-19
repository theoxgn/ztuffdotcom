const midtransClient = require('midtrans-client');
const { Order, User } = require('../models');

// Initialize Midtrans Snap
const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY
});

class PaymentController {
  
  // Helper function to extract payment info from Midtrans result
  extractPaymentInfo(paymentResult) {
    const paymentType = paymentResult.payment_type;
    let paymentInfo = {};

    switch (paymentType) {
      case 'bank_transfer':
        if (paymentResult.va_numbers && paymentResult.va_numbers.length > 0) {
          paymentInfo = {
            bank: paymentResult.va_numbers[0].bank,
            va_number: paymentResult.va_numbers[0].va_number,
            account_number: paymentResult.va_numbers[0].va_number
          };
        }
        break;

      case 'echannel':
        paymentInfo = {
          bill_info: paymentResult.bill_info,
          biller_code: paymentResult.biller_code,
          bill_key: paymentResult.bill_key
        };
        break;

      case 'permata':
        paymentInfo = {
          permata_va_number: paymentResult.permata_va_number
        };
        break;

      case 'bca':
        paymentInfo = {
          va_number: paymentResult.va_numbers?.[0]?.va_number,
          bank: 'bca'
        };
        break;

      case 'bni':
        paymentInfo = {
          va_number: paymentResult.va_numbers?.[0]?.va_number,
          bank: 'bni'
        };
        break;

      case 'bri':
        paymentInfo = {
          va_number: paymentResult.va_numbers?.[0]?.va_number,
          bank: 'bri'
        };
        break;

      case 'gopay':
        paymentInfo = {
          qr_code: paymentResult.qr_code,
          deeplink_redirect: paymentResult.deeplink_redirect,
          checkout_redirect_url: paymentResult.checkout_redirect_url
        };
        break;

      case 'qris':
        paymentInfo = {
          qr_code: paymentResult.qr_code,
          qr_code_url: paymentResult.qr_code_url
        };
        break;

      case 'shopeepay':
        paymentInfo = {
          checkout_redirect_url: paymentResult.checkout_redirect_url,
          deeplink_redirect: paymentResult.deeplink_redirect
        };
        break;

      case 'dana':
        paymentInfo = {
          checkout_redirect_url: paymentResult.checkout_redirect_url,
          deeplink_redirect: paymentResult.deeplink_redirect
        };
        break;

      case 'linkaja':
        paymentInfo = {
          checkout_redirect_url: paymentResult.checkout_redirect_url,
          deeplink_redirect: paymentResult.deeplink_redirect
        };
        break;

      case 'credit_card':
        paymentInfo = {
          card_type: paymentResult.card_type,
          bank: paymentResult.bank,
          masked_card: paymentResult.masked_card,
          approval_code: paymentResult.approval_code,
          eci: paymentResult.eci
        };
        break;

      case 'cstore':
        paymentInfo = {
          store: paymentResult.store,
          payment_code: paymentResult.payment_code,
          merchant_id: paymentResult.merchant_id
        };
        break;

      case 'akulaku':
        paymentInfo = {
          checkout_redirect_url: paymentResult.checkout_redirect_url
        };
        break;

      default:
        paymentInfo = {
          raw_response: paymentResult
        };
    }

    return {
      payment_type: paymentType,
      payment_info: paymentInfo,
      midtrans_order_id: paymentResult.order_id,
      midtrans_transaction_id: paymentResult.transaction_id,
      midtrans_transaction_status: paymentResult.transaction_status
    };
  }
  async createSnapToken(req, res) {
    try {
      const {
        shipping_address,
        shipping_city,
        shipping_province,
        shipping_postal_code,
        shipping_cost,
        courier,
        courier_service,
        courier_name,
        shipping_etd,
        destination_id,
        total_weight,
        notes,
        items
      } = req.body;

      const userId = req.user.id;
      
      const { Product, ProductVariation } = require('../models');
      
      // Calculate subtotal from items
      let subtotal = 0;
      const itemDetails = [];
      
      for (const item of items) {
        let product, price, productName;
        
        if (item.variation_id) {
          const variation = await ProductVariation.findByPk(item.variation_id, {
            include: [{ model: Product, as: 'product' }]
          });
          if (variation) {
            price = variation.price;
            product = variation.product;
            productName = `${product.name} (${variation.size || ''} ${variation.color || ''})`.trim();
          }
        } else {
          product = await Product.findByPk(item.product_id);
          if (product) {
            price = product.price;
            productName = product.name;
          }
        }
        
        if (price && product) {
          subtotal += price * item.quantity;
          itemDetails.push({
            id: item.product_id,
            price: Math.round(price),
            quantity: item.quantity,
            name: productName
          });
        }
      }

      const total = subtotal + parseFloat(shipping_cost);
      
      // Generate unique order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create Midtrans transaction parameter
      const parameter = {
        transaction_details: {
          order_id: orderNumber,
          gross_amount: Math.round(total)
        },
        customer_details: {
          first_name: req.user.name,
          email: req.user.email,
          phone: req.user.phone || '',
          billing_address: {
            first_name: req.user.name,
            address: shipping_address,
            city: shipping_city,
            postal_code: shipping_postal_code,
            country_code: 'IDN'
          },
          shipping_address: {
            first_name: req.user.name,
            address: shipping_address,
            city: shipping_city,
            postal_code: shipping_postal_code,
            country_code: 'IDN'
          }
        },
        item_details: [
          ...itemDetails,
          {
            id: 'shipping',
            price: Math.round(shipping_cost),
            quantity: 1,
            name: `Shipping (${courier_name} - ${courier_service})`
          }
        ],
        callbacks: {
          finish: `${process.env.FRONTEND_URL}/checkout/success`,
          unfinish: `${process.env.FRONTEND_URL}/checkout/unfinish`,
          error: `${process.env.FRONTEND_URL}/checkout/error`
        }
      };

      // Create snap token
      const transaction = await snap.createTransaction(parameter);

      // Store order data in session or temporary storage (optional)
      // For now, we'll return the order data along with snap token
      const orderData = {
        order_number: orderNumber,
        user_id: userId,
        subtotal: subtotal,
        total: total,
        shipping_cost: shipping_cost,
        shipping_address,
        shipping_city,
        shipping_province,
        shipping_postal_code,
        courier,
        courier_service,
        courier_name,
        shipping_etd,
        destination_id,
        total_weight,
        notes,
        items
      };

      res.json({
        success: true,
        data: {
          snap_token: transaction.token,
          redirect_url: transaction.redirect_url,
          order_data: orderData
        }
      });

    } catch (error) {
      console.error('Error creating snap token:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create payment token',
        error: error.message
      });
    }
  }

  async saveOrder(req, res) {
    try {
      const { order_data, payment_result } = req.body;
      
      // Allow saving order when payment method is selected (201) or payment is successful (200)
      if (!payment_result || (payment_result.status_code !== '200' && payment_result.status_code !== '201')) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payment status'
        });
      }

      // Check if order already exists
      const existingOrder = await Order.findOne({
        where: { order_number: order_data.order_number }
      });

      if (existingOrder) {
        // Update existing order status if needed
        const orderStatus = payment_result.status_code === '200' ? 'paid' : 'pending';
        const paymentDate = payment_result.status_code === '200' ? new Date() : null;
        
        // Extract payment information from Midtrans result
        const paymentData = this.extractPaymentInfo(payment_result);
        
        await existingOrder.update({
          status: orderStatus,
          payment_date: paymentDate,
          payment_type: paymentData.payment_type,
          payment_info: paymentData.payment_info,
          midtrans_order_id: paymentData.midtrans_order_id,
          midtrans_transaction_id: paymentData.midtrans_transaction_id,
          midtrans_transaction_status: paymentData.midtrans_transaction_status
        });

        // Check if order items exist, if not create them
        const { OrderItem } = require('../models');
        const existingItems = await OrderItem.findAll({
          where: { order_id: existingOrder.id }
        });

        if (existingItems.length === 0) {
          // Create order items if they don't exist
          const { Product, ProductVariation } = require('../models');
          
          for (const item of order_data.items) {
            let price = 0;
            
            if (item.variation_id) {
              const variation = await ProductVariation.findByPk(item.variation_id);
              if (variation) {
                price = variation.price;
              }
            } else {
              const product = await Product.findByPk(item.product_id);
              if (product) {
                price = product.price;
              }
            }
            
            const total = price * item.quantity;
            
            await OrderItem.create({
              order_id: existingOrder.id,
              product_id: item.product_id,
              variation_id: item.variation_id || null,
              quantity: item.quantity,
              price: price,
              total: total
            });
          }
        }

        return res.json({
          success: true,
          data: {
            order: existingOrder,
            message: 'Order updated successfully'
          }
        });
      }

      // Determine order status based on payment result
      const orderStatus = payment_result.status_code === '200' ? 'paid' : 'pending';
      const paymentDate = payment_result.status_code === '200' ? new Date() : null;

      // Extract payment information from Midtrans result
      const paymentData = this.extractPaymentInfo(payment_result);

      // Create order
      const order = await Order.create({
        order_number: order_data.order_number,
        user_id: order_data.user_id,
        subtotal: order_data.subtotal,
        total: order_data.total,
        shipping_cost: order_data.shipping_cost,
        total_weight: order_data.total_weight,
        shipping_address: order_data.shipping_address,
        shipping_city: order_data.shipping_city,
        shipping_province: order_data.shipping_province,
        shipping_postal_code: order_data.shipping_postal_code,
        courier: order_data.courier,
        courier_service: order_data.courier_service,
        courier_name: order_data.courier_name,
        shipping_etd: order_data.shipping_etd,
        destination_id: order_data.destination_id,
        notes: order_data.notes,
        status: orderStatus,
        payment_date: paymentDate,
        payment_type: paymentData.payment_type,
        payment_info: paymentData.payment_info,
        midtrans_order_id: paymentData.midtrans_order_id,
        midtrans_transaction_id: paymentData.midtrans_transaction_id,
        midtrans_transaction_status: paymentData.midtrans_transaction_status
      });

      // Create order items with correct pricing
      const { Product, ProductVariation, OrderItem } = require('../models');
      
      for (const item of order_data.items) {
        let price = 0;
        
        if (item.variation_id) {
          const variation = await ProductVariation.findByPk(item.variation_id);
          if (variation) {
            price = variation.price;
          }
        } else {
          const product = await Product.findByPk(item.product_id);
          if (product) {
            price = product.price;
          }
        }
        
        const total = price * item.quantity;
        
        await OrderItem.create({
          order_id: order.id,
          product_id: item.product_id,
          variation_id: item.variation_id || null,
          quantity: item.quantity,
          price: price,
          total: total
        });
      }

      res.json({
        success: true,
        data: {
          order: order,
          message: 'Order created successfully'
        }
      });

    } catch (error) {
      console.error('Error saving order:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save order',
        error: error.message
      });
    }
  }

  async handleNotification(req, res) {
    try {
      console.log('=== WEBHOOK NOTIFICATION RECEIVED ===');
      console.log('Headers:', req.headers);
      console.log('Body:', JSON.stringify(req.body, null, 2));
      
      const notification = new midtransClient.Snap({
        isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
        serverKey: process.env.MIDTRANS_SERVER_KEY
      });

      const statusResponse = await notification.transaction.notification(req.body);
      const orderId = statusResponse.order_id;
      const transactionStatus = statusResponse.transaction_status;
      const fraudStatus = statusResponse.fraud_status;

      console.log(`=== PROCESSING NOTIFICATION ===`);
      console.log(`Order ID: ${orderId}`);
      console.log(`Transaction Status: ${transactionStatus}`);
      console.log(`Fraud Status: ${fraudStatus}`);
      console.log(`Full Response:`, JSON.stringify(statusResponse, null, 2));

      // Find order by order_number
      const order = await Order.findOne({
        where: { order_number: orderId }
      });

      if (!order) {
        console.log(`ERROR: Order not found for ID: ${orderId}`);
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      console.log(`Found order: ${order.id}, Current status: ${order.status}`);

      // Extract payment information from notification
      const paymentData = this.extractPaymentInfo(statusResponse);
      console.log(`Extracted payment data:`, JSON.stringify(paymentData, null, 2));

      let newStatus = order.status;
      let updateData = {
        payment_type: paymentData.payment_type,
        payment_info: paymentData.payment_info,
        midtrans_transaction_id: paymentData.midtrans_transaction_id,
        midtrans_transaction_status: paymentData.midtrans_transaction_status
      };

      // Handle different transaction statuses
      if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
        if (fraudStatus === 'challenge') {
          newStatus = 'pending';
          console.log('Payment captured but flagged for fraud review');
        } else if (fraudStatus === 'accept' || !fraudStatus) {
          newStatus = 'paid';
          updateData.payment_date = new Date();
          console.log('Payment successful - marking as paid');
        }
      } else if (transactionStatus === 'cancel' || transactionStatus === 'deny' || transactionStatus === 'expire') {
        newStatus = 'cancelled';
        console.log(`Payment failed/cancelled: ${transactionStatus}`);
      } else if (transactionStatus === 'pending') {
        newStatus = 'pending';
        console.log('Payment still pending');
      }

      updateData.status = newStatus;

      await order.update(updateData);
      console.log(`Order updated successfully. New status: ${newStatus}`);

      // Send success response to Midtrans
      res.status(200).json({ 
        success: true,
        message: 'Notification processed successfully' 
      });

    } catch (error) {
      console.error('=== WEBHOOK ERROR ===');
      console.error('Error details:', error);
      console.error('Stack trace:', error.stack);
      
      res.status(500).json({
        success: false,
        message: 'Failed to handle notification',
        error: error.message
      });
    }
  }

  // Manual payment status check (untuk development tanpa webhook)
  async checkPaymentStatus(req, res) {
    try {
      const { orderId } = req.params;
      
      const order = await Order.findOne({
        where: { order_number: orderId }
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Check payment status dari Midtrans
      const snap = new midtransClient.Snap({
        isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
        serverKey: process.env.MIDTRANS_SERVER_KEY,
        clientKey: process.env.MIDTRANS_CLIENT_KEY
      });

      const statusResponse = await snap.transaction.status(orderId);
      console.log('Manual status check result:', JSON.stringify(statusResponse, null, 2));

      // Update order status berdasarkan response
      const paymentData = this.extractPaymentInfo(statusResponse);
      let newStatus = order.status;
      let updateData = {
        payment_type: paymentData.payment_type,
        payment_info: paymentData.payment_info,
        midtrans_transaction_id: paymentData.midtrans_transaction_id,
        midtrans_transaction_status: paymentData.midtrans_transaction_status
      };

      if (statusResponse.transaction_status === 'capture' || statusResponse.transaction_status === 'settlement') {
        if (!statusResponse.fraud_status || statusResponse.fraud_status === 'accept') {
          newStatus = 'paid';
          updateData.payment_date = new Date();
        }
      } else if (['cancel', 'deny', 'expire'].includes(statusResponse.transaction_status)) {
        newStatus = 'cancelled';
      }

      if (newStatus !== order.status) {
        updateData.status = newStatus;
        await order.update(updateData);
        console.log(`Order ${orderId} status updated to: ${newStatus}`);
      }

      res.json({
        success: true,
        data: {
          order_id: orderId,
          current_status: newStatus,
          midtrans_status: statusResponse.transaction_status,
          fraud_status: statusResponse.fraud_status,
          updated: newStatus !== order.status
        }
      });

    } catch (error) {
      console.error('Error checking payment status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check payment status',
        error: error.message
      });
    }
  }

  async getPaymentInfo(req, res) {
    try {
      const { orderId } = req.params;
      
      const order = await Order.findByPk(orderId, {
        attributes: [
          'id', 'order_number', 'status', 'total', 'payment_type', 
          'payment_info', 'midtrans_order_id', 'midtrans_transaction_id', 
          'midtrans_transaction_status', 'payment_date', 'createdAt'
        ]
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Check if user owns this order
      if (order.user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.json({
        success: true,
        data: {
          order_id: order.id,
          order_number: order.order_number,
          status: order.status,
          total: order.total,
          payment_type: order.payment_type,
          payment_info: order.payment_info,
          midtrans_order_id: order.midtrans_order_id,
          midtrans_transaction_id: order.midtrans_transaction_id,
          midtrans_transaction_status: order.midtrans_transaction_status,
          payment_date: order.payment_date,
          created_at: order.createdAt
        }
      });

    } catch (error) {
      console.error('Error getting payment info:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get payment info'
      });
    }
  }
}

module.exports = new PaymentController();