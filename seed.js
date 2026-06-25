require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const Property = require('./models/Property');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/realestate';

const sampleProperties = [
  {
    title: '3 BHK Luxury Apartment in Malviya Nagar',
    description: 'Spacious 3 BHK apartment with modern interiors, modular kitchen, and stunning city views. Located in the heart of Malviya Nagar with easy access to schools, hospitals, and shopping malls. Society has 24/7 security, swimming pool, and gym.',
    price: 8500000, priceType: 'total', type: 'buy', propertyCategory: 'apartment',
    location: { area: 'Malviya Nagar', city: 'Jaipur', state: 'Rajasthan', pincode: '302017' },
    bedrooms: 3, bathrooms: 2, area: 1450, status: 'available', featured: true,
    contactNumber: '+919876543210', whatsappNumber: '+919876543210',
    amenities: ['Parking', 'Lift', 'Swimming Pool', 'Gym', '24/7 Security', 'Power Backup'],
    photos: []
  },
  {
    title: '2 BHK Flat for Rent — Vaishali Nagar',
    description: 'Well-maintained 2 BHK flat available for rent in Vaishali Nagar. Fully furnished with AC, sofa set, and refrigerator. Ideal for working professionals and small families. Near metro station and market.',
    price: 18000, priceType: 'per_month', type: 'rent', propertyCategory: 'apartment',
    location: { area: 'Vaishali Nagar', city: 'Jaipur', state: 'Rajasthan', pincode: '302021' },
    bedrooms: 2, bathrooms: 2, area: 950, status: 'available', featured: true,
    contactNumber: '+919876543211', whatsappNumber: '+919876543211',
    amenities: ['Furnished', 'AC', 'Parking', 'Security'],
    photos: []
  },
  {
    title: 'Commercial Shop for Sale — C-Scheme Market',
    description: 'Prime location commercial shop available for sale in C-Scheme main market. Ground floor, excellent footfall area. Suitable for showroom, restaurant, or retail outlet. Corner shop with two entry points.',
    price: 12500000, priceType: 'total', type: 'sell', propertyCategory: 'commercial',
    location: { area: 'C-Scheme', city: 'Jaipur', state: 'Rajasthan', pincode: '302001' },
    bedrooms: 0, bathrooms: 1, area: 600, status: 'available', featured: true,
    contactNumber: '+919876543212', whatsappNumber: '+919876543212',
    amenities: ['Corner Plot', 'Main Road Facing', 'Parking'],
    photos: []
  },
  {
    title: '4 BHK Villa with Private Pool — Ajmer Road',
    description: 'Stunning 4 BHK independent villa with private swimming pool, landscaped garden, and servant quarters. Ultra-premium construction with Italian marble flooring and German modular kitchen. Gated community.',
    price: 32000000, priceType: 'total', type: 'buy', propertyCategory: 'villa',
    location: { area: 'Ajmer Road', city: 'Jaipur', state: 'Rajasthan', pincode: '302006' },
    bedrooms: 4, bathrooms: 4, area: 4500, status: 'available', featured: false,
    contactNumber: '+919876543213', whatsappNumber: '+919876543213',
    amenities: ['Private Pool', 'Garden', 'Servant Quarter', 'Terrace', '3 Car Parking', 'CCTV'],
    photos: []
  },
  {
    title: 'Residential Plot 200 Sq Yd — Jagatpura',
    description: 'RERA approved residential plot in Jagatpura development area. Clear title with all documents ready. Adjacent to planned 6-lane highway. Excellent investment opportunity with quick appreciation.',
    price: 4200000, priceType: 'total', type: 'buy', propertyCategory: 'plot',
    location: { area: 'Jagatpura', city: 'Jaipur', state: 'Rajasthan', pincode: '302025' },
    bedrooms: 0, bathrooms: 0, area: 1800, status: 'available', featured: false,
    contactNumber: '+919876543214',
    amenities: ['RERA Approved', 'Clear Title', 'Corner Plot'],
    photos: []
  },
  {
    title: '1 BHK Studio Apartment for Rent — Sindhi Camp',
    description: 'Compact and affordable 1 BHK studio apartment near Sindhi Camp bus stand. Semi-furnished with built-in wardrobe and kitchen. Suitable for bachelors and students.',
    price: 8500, priceType: 'per_month', type: 'rent', propertyCategory: 'apartment',
    location: { area: 'Sindhi Camp', city: 'Jaipur', state: 'Rajasthan', pincode: '302001' },
    bedrooms: 1, bathrooms: 1, area: 450, status: 'available', featured: false,
    contactNumber: '+919876543215',
    amenities: ['Semi-Furnished', 'Water 24/7', 'Near Bus Stand'],
    photos: []
  },
  {
    title: '3 BHK Independent House — Mansarovar',
    description: 'Beautiful independent 3 BHK house in quiet Mansarovar locality. Has large terrace, front garden, and stilt parking. 2 floors — can be rented out upper portion for extra income.',
    price: 7800000, priceType: 'total', type: 'sell', propertyCategory: 'house',
    location: { area: 'Mansarovar', city: 'Jaipur', state: 'Rajasthan', pincode: '302020' },
    bedrooms: 3, bathrooms: 3, area: 2200, status: 'available', featured: false,
    contactNumber: '+919876543216', whatsappNumber: '+919876543216',
    amenities: ['Terrace', 'Garden', 'Parking', 'Separate Entrance'],
    photos: []
  },
  {
    title: 'PG / Hostel for Girls — Near Amity University',
    description: 'Safe and secure PG accommodation for girls near Amity University Jaipur. AC rooms available. Meals, WiFi, laundry included. 24/7 security and warden on premises.',
    price: 7000, priceType: 'per_month', type: 'rent', propertyCategory: 'pg',
    location: { area: 'Kant Kalwar', city: 'Jaipur', state: 'Rajasthan', pincode: '303002' },
    bedrooms: 1, bathrooms: 1, area: 0, status: 'available', featured: false,
    contactNumber: '+919876543217', whatsappNumber: '+919876543217',
    amenities: ['AC Rooms', 'WiFi', 'Meals', 'Laundry', 'Warden', 'CCTV'],
    photos: []
  },
  {
    title: '2 BHK Flat Sold — Pratap Nagar',
    description: 'Well-located 2 BHK in Pratap Nagar. Already sold — contact for similar listings in the area.',
    price: 5200000, priceType: 'total', type: 'buy', propertyCategory: 'apartment',
    location: { area: 'Pratap Nagar', city: 'Jaipur', state: 'Rajasthan', pincode: '302033' },
    bedrooms: 2, bathrooms: 2, area: 1100, status: 'sold', featured: false,
    contactNumber: '+919876543218',
    amenities: ['Parking', 'Lift'],
    photos: []
  },
  {
    title: 'Office Space for Rent — Tonk Road IT Park',
    description: 'Fully equipped 1200 sq ft office space in Tonk Road IT corridor. Open plan layout with 25+ workstations, conference room, and reception. High-speed fiber internet included.',
    price: 35000, priceType: 'per_month', type: 'rent', propertyCategory: 'commercial',
    location: { area: 'Tonk Road', city: 'Jaipur', state: 'Rajasthan', pincode: '302018' },
    bedrooms: 0, bathrooms: 2, area: 1200, status: 'available', featured: false,
    contactNumber: '+919876543219', whatsappNumber: '+919876543219',
    amenities: ['Fiber Internet', 'Conference Room', 'Reception', 'Parking', 'Power Backup', 'AC'],
    photos: []
  },
  {
    title: '3 BHK Apartment — Sirsi Road Near Metro',
    description: 'Modern 3 BHK apartment adjacent to Sirsi Road metro station. Excellent connectivity. Society with clubhouse, kids play area, and jogging track. East-facing with great ventilation.',
    price: 6800000, priceType: 'total', type: 'buy', propertyCategory: 'apartment',
    location: { area: 'Sirsi Road', city: 'Jaipur', state: 'Rajasthan', pincode: '302012' },
    bedrooms: 3, bathrooms: 2, area: 1380, status: 'available', featured: false,
    contactNumber: '+919876543220',
    amenities: ['Metro Nearby', 'Clubhouse', 'Kids Play Area', 'Jogging Track', 'Visitor Parking'],
    photos: []
  },
  {
    title: '500 Sq Yd Commercial Plot — Sitapura Industrial',
    description: 'Industrial plot available in Sitapura RIICO area. Suitable for factory, warehouse, or commercial complex. Road facing with full electricity and water connection available.',
    price: 9500000, priceType: 'total', type: 'sell', propertyCategory: 'plot',
    location: { area: 'Sitapura', city: 'Jaipur', state: 'Rajasthan', pincode: '302022' },
    bedrooms: 0, bathrooms: 0, area: 4500, status: 'available', featured: false,
    contactNumber: '+919876543221', whatsappNumber: '+919876543221',
    amenities: ['RIICO Area', 'Road Facing', 'Electricity Available'],
    photos: []
  },
  {
    title: '2 BHK Furnished Flat for Rent — Shyam Nagar',
    description: 'Fully furnished 2 BHK flat with premium furniture, modular kitchen, AC in all rooms. Perfect for corporate employees. 5 min from Jaipur International Airport.',
    price: 22000, priceType: 'per_month', type: 'rent', propertyCategory: 'apartment',
    location: { area: 'Shyam Nagar', city: 'Jaipur', state: 'Rajasthan', pincode: '302019' },
    bedrooms: 2, bathrooms: 2, area: 1050, status: 'available', featured: false,
    contactNumber: '+919876543222',
    amenities: ['Fully Furnished', 'AC All Rooms', 'Near Airport', 'Parking', 'Security'],
    photos: []
  },
  {
    title: 'Luxury 5 BHK Kothi — Civil Lines',
    description: 'Prestigious 5 BHK kothi in the upscale Civil Lines area. Heritage property with modern renovation. Large drawing room, separate dining, home theatre room, and wine cellar. Rare find.',
    price: 55000000, priceType: 'total', type: 'sell', propertyCategory: 'villa',
    location: { area: 'Civil Lines', city: 'Jaipur', state: 'Rajasthan', pincode: '302006' },
    bedrooms: 5, bathrooms: 5, area: 6000, status: 'available', featured: false,
    contactNumber: '+919876543223', whatsappNumber: '+919876543223',
    amenities: ['Heritage Property', 'Home Theatre', 'Garden', '4 Parking', 'Servant Quarters', 'CCTV'],
    photos: []
  },
  {
    title: '1 BHK Flat for Rent — Bais Godam Station Road',
    description: 'Affordable 1 BHK on station road. Excellent for daily commuters. Ground floor with small garden. Well-maintained building. Water and electricity charges extra.',
    price: 7500, priceType: 'per_month', type: 'rent', propertyCategory: 'apartment',
    location: { area: 'Bais Godam', city: 'Jaipur', state: 'Rajasthan', pincode: '302006' },
    bedrooms: 1, bathrooms: 1, area: 480, status: 'available', featured: false,
    contactNumber: '+919876543224',
    amenities: ['Ground Floor', 'Near Station'],
    photos: []
  },
  {
    title: '3 BHK Flat — Nirman Nagar Builder Floor',
    description: 'Spacious builder floor in Nirman Nagar. Independent entrance, large balcony overlooking park. Separate power meter. Good ventilation. Ready to move in.',
    price: 6200000, priceType: 'total', type: 'buy', propertyCategory: 'house',
    location: { area: 'Nirman Nagar', city: 'Jaipur', state: 'Rajasthan', pincode: '302019' },
    bedrooms: 3, bathrooms: 2, area: 1600, status: 'available', featured: false,
    contactNumber: '+919876543225',
    amenities: ['Park Facing', 'Balcony', 'Separate Entrance', 'Ready to Move'],
    photos: []
  },
  {
    title: 'Showroom for Rent — Gopalpura Bypass',
    description: 'Premium showroom space on Gopalpura Bypass main road. Ground floor, glass facade, high ceiling. 3000 sq ft. Ideal for automobile showroom, furniture store, or electronics.',
    price: 90000, priceType: 'per_month', type: 'rent', propertyCategory: 'commercial',
    location: { area: 'Gopalpura Bypass', city: 'Jaipur', state: 'Rajasthan', pincode: '302018' },
    bedrooms: 0, bathrooms: 2, area: 3000, status: 'available', featured: false,
    contactNumber: '+919876543226', whatsappNumber: '+919876543226',
    amenities: ['Main Road Facing', 'High Ceiling', 'Glass Facade', 'Parking', '3 Phase Power'],
    photos: []
  },
  {
    title: '2 BHK Ready-to-Move — Chitrakoot Scheme',
    description: 'Vastu-compliant 2 BHK apartment in Chitrakoot. East-facing with ample sunlight. Society with garden, security, and CC camera. School and hospital within 1 km.',
    price: 4800000, priceType: 'total', type: 'buy', propertyCategory: 'apartment',
    location: { area: 'Chitrakoot', city: 'Jaipur', state: 'Rajasthan', pincode: '302021' },
    bedrooms: 2, bathrooms: 2, area: 1050, status: 'available', featured: false,
    contactNumber: '+919876543227',
    amenities: ['Vastu Compliant', 'Garden', 'Security', 'CCTV', 'Ready to Move'],
    photos: []
  },
  {
    title: 'Agricultural Land 10 Bigha — Amer Road',
    description: '10 bigha agricultural land on Amer Road near Delhi Highway. Water source available. Suitable for farmhouse development or agricultural use. Scenic location near Aravalli hills.',
    price: 15000000, priceType: 'total', type: 'sell', propertyCategory: 'plot',
    location: { area: 'Amer Road', city: 'Jaipur', state: 'Rajasthan', pincode: '302028' },
    bedrooms: 0, bathrooms: 0, area: 25000, status: 'available', featured: false,
    contactNumber: '+919876543228', whatsappNumber: '+919876543228',
    amenities: ['Water Source', 'Near Highway', 'Scenic View'],
    photos: []
  },
  {
    title: 'PG for Boys — Near JNU Jaipur Campus',
    description: 'Budget PG accommodation for male students near JNU Jaipur. 3-sharing and 2-sharing rooms. WiFi, mess, and laundry included. Strict curfew 11 PM for safety.',
    price: 5500, priceType: 'per_month', type: 'rent', propertyCategory: 'pg',
    location: { area: 'JNU Road', city: 'Jaipur', state: 'Rajasthan', pincode: '302029' },
    bedrooms: 1, bathrooms: 1, area: 0, status: 'available', featured: false,
    contactNumber: '+919876543229',
    amenities: ['WiFi', 'Mess', 'Laundry', 'Security'],
    photos: []
  },
  {
    title: '4 BHK Penthouse — Jawahar Circle',
    description: 'Exclusive duplex penthouse with 360-degree view of Jaipur city. Private rooftop, jacuzzi, and home automation system. Only one unit in the building. Ultra-luxury living.',
    price: 42000000, priceType: 'total', type: 'buy', propertyCategory: 'apartment',
    location: { area: 'Jawahar Circle', city: 'Jaipur', state: 'Rajasthan', pincode: '302018' },
    bedrooms: 4, bathrooms: 4, area: 5000, status: 'available', featured: false,
    contactNumber: '+919876543230', whatsappNumber: '+919876543230',
    amenities: ['Penthouse', 'Rooftop', 'Jacuzzi', 'Home Automation', 'City View', '3 Parking'],
    photos: []
  },
  {
    title: '2 BHK Flat Rented — Bajaj Nagar',
    description: 'This property has been rented. Contact for similar available properties in Bajaj Nagar area.',
    price: 14000, priceType: 'per_month', type: 'rent', propertyCategory: 'apartment',
    location: { area: 'Bajaj Nagar', city: 'Jaipur', state: 'Rajasthan', pincode: '302015' },
    bedrooms: 2, bathrooms: 1, area: 900, status: 'rented', featured: false,
    contactNumber: '+919876543231',
    amenities: ['Parking'],
    photos: []
  },
  {
    title: 'Studio Apartment for Rent — IT Hub Raja Park',
    description: 'Compact studio apartment near Raja Park IT companies. Fully furnished with high-speed internet. Ideal for software engineers and startup employees. Month-to-month lease available.',
    price: 12000, priceType: 'per_month', type: 'rent', propertyCategory: 'apartment',
    location: { area: 'Raja Park', city: 'Jaipur', state: 'Rajasthan', pincode: '302004' },
    bedrooms: 1, bathrooms: 1, area: 380, status: 'available', featured: false,
    contactNumber: '+919876543232', whatsappNumber: '+919876543232',
    amenities: ['Furnished', 'High Speed WiFi', 'AC', 'Flexible Lease'],
    photos: []
  },
  {
    title: '3 BHK Flat — Niwaru Road Affordable Housing',
    description: 'Under PMAY affordable housing scheme. Subsidized interest rates available. Modern amenities at an unbeatable price. Book now — limited units remaining.',
    price: 3200000, priceType: 'total', type: 'buy', propertyCategory: 'apartment',
    location: { area: 'Niwaru Road', city: 'Jaipur', state: 'Rajasthan', pincode: '302012' },
    bedrooms: 3, bathrooms: 2, area: 1150, status: 'available', featured: false,
    contactNumber: '+919876543233',
    amenities: ['PMAY Eligible', 'Home Loan Available', 'Parking', 'Security'],
    photos: []
  },
  {
    title: 'Industrial Warehouse — EPIP Zone Sitapura',
    description: 'Large 10,000 sq ft warehouse in EPIP Zone Sitapura for rent. Loading/unloading dock, 3-phase power, ample truck movement space. Ideal for manufacturing or storage.',
    price: 150000, priceType: 'per_month', type: 'rent', propertyCategory: 'commercial',
    location: { area: 'EPIP Zone Sitapura', city: 'Jaipur', state: 'Rajasthan', pincode: '302022' },
    bedrooms: 0, bathrooms: 2, area: 10000, status: 'available', featured: false,
    contactNumber: '+919876543234', whatsappNumber: '+919876543234',
    amenities: ['Loading Dock', '3 Phase Power', 'Truck Access', 'Security', 'CCTV'],
    photos: []
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Create admin
    const existing = await Admin.findOne({ username: 'admin' });
    if (!existing) {
      const admin = new Admin({
        username: process.env.ADMIN_USERNAME || 'admin',
        password: process.env.ADMIN_PASSWORD || 'admin123'
      });
      await admin.save();
      console.log('✅ Admin created — username: admin, password: admin123');
    } else {
      console.log('ℹ️  Admin already exists, skipping...');
    }

    // Clear old properties
    await Property.deleteMany({});
    console.log('🗑️  Old properties cleared');

    // Insert sample data
    await Property.insertMany(sampleProperties);
    console.log(`✅ ${sampleProperties.length} sample properties added`);

    console.log('\n🎉 Seed complete!');
    console.log('   Run: node server.js');
    console.log('   Admin: http://localhost:3000/admin/login\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
}

seed();
