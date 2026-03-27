require('dotenv').config({ path: require('path').resolve(__dirname, '../../../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI;

const users = [
  {
    name: 'Admin User',
    email: 'admin@leadsher.com',
    password: 'Admin@1234',
    role: 'admin',
    bio: 'Platform administrator for LeadsHer.',
    industry: 'Technology',
    experienceLevel: 'executive',
    expertise: ['Platform Management', 'Administration'],
    location: 'Colombo, Sri Lanka',
    isEmailVerified: true,
  },
  {
    name: 'Sarah Mentor',
    email: 'mentor@leadsher.com',
    password: 'Mentor@1234',
    role: 'mentor',
    bio: 'Experienced software engineer with 10+ years in the industry, passionate about empowering women in tech.',
    industry: 'Technology',
    experienceLevel: 'senior',
    expertise: ['Software Engineering', 'Leadership', 'Career Development'],
    location: 'Colombo, Sri Lanka',
    linkedin: 'https://linkedin.com/in/sarah-mentor',
    isEmailVerified: true,
  },
  {
    name: 'Emily Mentee',
    email: 'mentee@leadsher.com',
    password: 'Mentee@1234',
    role: 'mentee',
    bio: 'Aspiring software developer looking for guidance and mentorship.',
    industry: 'Technology',
    experienceLevel: 'entry',
    expertise: ['JavaScript', 'React'],
    location: 'Kandy, Sri Lanka',
    isEmailVerified: true,
  },
];

async function seed() {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI is not set in .env');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  for (const userData of users) {
    const existing = await User.findOne({ email: userData.email });
    if (existing) {
      console.log(`[SKIP] ${userData.role} already exists: ${userData.email}`);
      continue;
    }
    const user = new User(userData);
    await user.save();
    console.log(`[CREATED] ${userData.role}: ${userData.email} / password: ${userData.password}`);
  }

  await mongoose.disconnect();
  console.log('Done.');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
