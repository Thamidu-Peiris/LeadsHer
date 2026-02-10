require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');
const MentorProfile = require('../models/MentorProfile');

// Sample mentor data
const mentorData = [
  {
    user: {
      name: 'Sarah Johnson',
      email: 'sarah.johnson@leadsher.com',
      password: 'password123',
      role: 'Mentor',
      bio: 'Tech executive with 15 years of experience in leading diverse teams. Passionate about empowering women in technology.',
    },
    profile: {
      expertise: ['Leadership', 'Technology', 'Strategic Planning'],
      yearsOfExperience: 15,
      industries: ['Technology', 'Software Development', 'SaaS'],
      mentoringAreas: ['Career Development', 'Technical Leadership', 'Work-Life Balance'],
      availability: {
        maxMentees: 3,
        preferredTime: ['Weekday Evenings', 'Weekend Mornings'],
        timezone: 'America/New_York',
      },
      bio: 'As a CTO with 15 years of experience, I have led teams of 50+ engineers and successfully launched multiple products. I am passionate about helping women break through the glass ceiling in tech.',
      achievements: [
        'CTO at Fortune 500 company',
        'TEDx Speaker on Women in Tech',
        'Published author - "Leading with Authenticity"',
      ],
      isVerified: true,
    },
  },
  {
    user: {
      name: 'Maria Rodriguez',
      email: 'maria.rodriguez@leadsher.com',
      password: 'password123',
      role: 'Mentor',
      bio: 'Marketing strategist and entrepreneur. Built and sold two successful startups.',
    },
    profile: {
      expertise: ['Marketing', 'Entrepreneurship', 'Digital Strategy'],
      yearsOfExperience: 12,
      industries: ['Marketing', 'E-commerce', 'Startups'],
      mentoringAreas: ['Business Strategy', 'Marketing', 'Entrepreneurship'],
      availability: {
        maxMentees: 2,
        preferredTime: ['Weekday Afternoons'],
        timezone: 'America/Los_Angeles',
      },
      bio: 'Serial entrepreneur with two successful exits. I specialize in helping women build and scale their businesses from idea to acquisition.',
      achievements: [
        'Founded and sold 2 companies',
        'Forbes 30 Under 30',
        'Keynote speaker at SXSW',
      ],
      isVerified: true,
    },
  },
  {
    user: {
      name: 'Dr. Emily Chen',
      email: 'emily.chen@leadsher.com',
      password: 'password123',
      role: 'Mentor',
      bio: 'Healthcare executive and medical researcher. Advocate for women in STEM.',
    },
    profile: {
      expertise: ['Healthcare', 'Research', 'Leadership'],
      yearsOfExperience: 20,
      industries: ['Healthcare', 'Biotechnology', 'Pharmaceuticals'],
      mentoringAreas: ['Career Development', 'Research', 'Academic Leadership'],
      availability: {
        maxMentees: 3,
        preferredTime: ['Weekend Mornings', 'Weekday Early Mornings'],
        timezone: 'America/Chicago',
      },
      bio: 'Board-certified physician and healthcare executive with 20 years of experience. I mentor women pursuing careers in healthcare and biotech.',
      achievements: [
        'Chief Medical Officer at major hospital',
        'Published 50+ research papers',
        'NIH Grant recipient',
      ],
      isVerified: true,
    },
  },
  {
    user: {
      name: 'Jessica Williams',
      email: 'jessica.williams@leadsher.com',
      password: 'password123',
      role: 'Mentor',
      bio: 'Financial advisor and investment strategist. Expert in wealth building for women.',
    },
    profile: {
      expertise: ['Finance', 'Investment', 'Wealth Management'],
      yearsOfExperience: 10,
      industries: ['Finance', 'Banking', 'Investment'],
      mentoringAreas: ['Financial Planning', 'Investment Strategy', 'Career Development'],
      availability: {
        maxMentees: 3,
        preferredTime: ['Weekday Evenings'],
        timezone: 'America/New_York',
      },
      bio: 'CFP and wealth management expert helping women take control of their financial futures and build generational wealth.',
      achievements: [
        'Certified Financial Planner',
        'Managing $500M+ in assets',
        'Featured in Wall Street Journal',
      ],
      isVerified: true,
    },
  },
  {
    user: {
      name: 'Aisha Patel',
      email: 'aisha.patel@leadsher.com',
      password: 'password123',
      role: 'Mentor',
      bio: 'Data scientist and AI researcher. Advocate for diversity in artificial intelligence.',
    },
    profile: {
      expertise: ['Data Science', 'Artificial Intelligence', 'Machine Learning'],
      yearsOfExperience: 8,
      industries: ['Technology', 'AI/ML', 'Data Analytics'],
      mentoringAreas: ['Technical Skills', 'Career Transition', 'Research'],
      availability: {
        maxMentees: 2,
        preferredTime: ['Weekday Evenings', 'Weekend Afternoons'],
        timezone: 'America/Los_Angeles',
      },
      bio: 'Lead data scientist specializing in AI ethics and fairness. I help women transition into data science and AI careers.',
      achievements: [
        'PhD in Computer Science',
        'Speaker at NeurIPS',
        'Published AI researcher',
      ],
      isVerified: true,
    },
  },
];

// Sample mentee data
const menteeData = [
  {
    name: 'Rachel Thompson',
    email: 'rachel.thompson@example.com',
    password: 'password123',
    role: 'Mentee',
    bio: 'Aspiring software engineer looking to transition into tech leadership.',
  },
  {
    name: 'Lisa Anderson',
    email: 'lisa.anderson@example.com',
    password: 'password123',
    role: 'Mentee',
    bio: 'Marketing professional seeking guidance on starting my own business.',
  },
  {
    name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    password: 'password123',
    role: 'Mentee',
    bio: 'Medical student interested in healthcare leadership and research.',
  },
];

const seedDatabase = async () => {
  try {
    await connectDB();

    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await MentorProfile.deleteMany({});

    console.log('👥 Creating mentors...');
    for (const mentor of mentorData) {
      // Create user
      const user = await User.create({
        name: mentor.user.name,
        email: mentor.user.email,
        password: mentor.user.password,
        role: mentor.user.role,
        bio: mentor.user.bio,
      });

      // Create mentor profile
      await MentorProfile.create({
        user: user._id,
        ...mentor.profile,
      });

      console.log(`✅ Created mentor: ${user.name}`);
    }

    console.log('\n👤 Creating mentees...');
    for (const mentee of menteeData) {
      const user = await User.create(mentee);
      console.log(`✅ Created mentee: ${user.name}`);
    }

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📝 Test Credentials:');
    console.log('-------------------');
    console.log('Mentors:');
    mentorData.forEach(m => {
      console.log(`  Email: ${m.user.email} | Password: password123`);
    });
    console.log('\nMentees:');
    menteeData.forEach(m => {
      console.log(`  Email: ${m.email} | Password: password123`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seeder
seedDatabase();
