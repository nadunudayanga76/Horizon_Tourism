const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const managers = [
  {
    name: 'Residence Manager',
    email: 'residence@horizon.com',
    password: 'manager123',
    role: 'residence_manager',
    phone: '0110000001'
  },
  {
    name: 'Reservation Manager',
    email: 'reservation@horizon.com',
    password: 'manager123',
    role: 'reservation_manager',
    phone: '0110000002'
  },
  {
    name: 'Transport Manager',
    email: 'transport@horizon.com',
    password: 'manager123',
    role: 'transport_manager',
    phone: '0110000003'
  },
  {
    name: 'Tour Guide Manager',
    email: 'guide@horizon.com',
    password: 'manager123',
    role: 'guide_manager',
    phone: '0110000004'
  },
  {
    name: 'Payment Manager',
    email: 'payment@horizon.com',
    password: 'manager123',
    role: 'payment_manager',
    phone: '0110000005'
  },
  {
    name: 'Feedback Manager',
    email: 'feedback@horizon.com',
    password: 'manager123',
    role: 'feedback_manager',
    phone: '0110000006'
  }
];

const seedManagers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    for (const manager of managers) {
      const exists = await User.findOne({ email: manager.email });
      if (!exists) {
        await User.create(manager);
        console.log(`Created: ${manager.name}`);
      } else {
        console.log(`Exists: ${manager.name}`);
      }
    }

    console.log('All Managers Created Successfully!');
    process.exit();
  } catch (error) {
    console.error('Error seeding managers:', error);
    process.exit(1);
  }
};

seedManagers();
