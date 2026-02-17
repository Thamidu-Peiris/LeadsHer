require('dotenv').config({ path: process.env.DOTENV_PATH || '../../../../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');

// Import models
const User = require('../models/User');
const MentorProfile = require('../models/MentorProfile');

const seedMentors = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await MentorProfile.deleteMany({});
    await User.deleteMany({});
    console.log('Cleared existing data');

    // Create sample mentors
    const mentors = [
      {
        user: {
          name: 'Sarah Johnson',
          email: 'sarah.johnson@leadsher.com',
          password: 'password123',
          role: 'mentor',
          bio: 'Senior Software Engineer with 12+ years of experience in full-stack development.',
        },
        profile: {
          expertise: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'AWS'],
          yearsOfExperience: 12,
          industries: ['Technology', 'SaaS', 'E-commerce'],
          mentoringAreas: ['Career Development', 'Technical Skills', 'Leadership'],
          bio: 'Passionate about helping women break into tech and advance their careers.',
          availability: { maxMentees: 3, preferredSchedule: 'Weekday evenings' },
          achievements: ['Led team of 20 engineers at Fortune 500', 'Published 3 tech books', 'TEDx Speaker'],
        },
      },
      {
        user: {
          name: 'Maria Rodriguez',
          email: 'maria.rodriguez@leadsher.com',
          password: 'password123',
          role: 'mentor',
          bio: 'Product Manager turned VP of Product at a leading fintech company.',
        },
        profile: {
          expertise: ['Product Management', 'Agile', 'Data Analytics', 'UX Research'],
          yearsOfExperience: 10,
          industries: ['Fintech', 'Banking', 'Insurance'],
          mentoringAreas: ['Product Strategy', 'Career Transition', 'Work-Life Balance'],
          bio: 'Helping aspiring product managers navigate their career path.',
          availability: { maxMentees: 2, preferredSchedule: 'Weekends' },
          achievements: ['Grew product revenue by 300%', 'Forbes 30 Under 30', 'Mentor of the Year 2023'],
        },
      },
      {
        user: {
          name: 'Dr. Emily Chen',
          email: 'emily.chen@leadsher.com',
          password: 'password123',
          role: 'mentor',
          bio: 'AI Research Scientist with a PhD in Machine Learning.',
        },
        profile: {
          expertise: ['Machine Learning', 'Python', 'Deep Learning', 'NLP', 'Computer Vision'],
          yearsOfExperience: 8,
          industries: ['AI/ML', 'Healthcare', 'Research'],
          mentoringAreas: ['Research Skills', 'Technical Skills', 'Academic Career'],
          bio: 'Dedicated to increasing diversity in AI research and development.',
          availability: { maxMentees: 2, preferredSchedule: 'Flexible' },
          achievements: ['Published 25+ papers in top AI conferences', 'Google AI Research Award', 'Built AI system used by 1M+ users'],
        },
      },
      {
        user: {
          name: 'Jessica Williams',
          email: 'jessica.williams@leadsher.com',
          password: 'password123',
          role: 'mentor',
          bio: 'Startup founder and angel investor with expertise in scaling businesses.',
        },
        profile: {
          expertise: ['Entrepreneurship', 'Fundraising', 'Marketing', 'Business Strategy'],
          yearsOfExperience: 15,
          industries: ['Startups', 'Venture Capital', 'Marketing'],
          mentoringAreas: ['Entrepreneurship', 'Fundraising', 'Leadership'],
          bio: 'Committed to supporting women entrepreneurs on their journey.',
          availability: { maxMentees: 4, preferredSchedule: 'Mornings' },
          achievements: ['Founded 3 successful startups', 'Invested in 20+ women-led startups', 'Inc. Magazine Top 50 Women in Business'],
        },
      },
      {
        user: {
          name: 'Aisha Patel',
          email: 'aisha.patel@leadsher.com',
          password: 'password123',
          role: 'mentor',
          bio: 'Cybersecurity expert and CISO at a major healthcare organization.',
        },
        profile: {
          expertise: ['Cybersecurity', 'Cloud Security', 'Compliance', 'Risk Management'],
          yearsOfExperience: 11,
          industries: ['Healthcare', 'Cybersecurity', 'Government'],
          mentoringAreas: ['Career Development', 'Technical Skills', 'Industry Transitions'],
          bio: 'Advocating for more women in cybersecurity through mentorship and education.',
          availability: { maxMentees: 3, preferredSchedule: 'Weekday afternoons' },
          achievements: ['CISO of the Year 2022', 'Built security program protecting 10M patient records', 'Women in Cyber Award'],
        },
      },
    ];

    // Create sample mentees
    const mentees = [
      {
        name: 'Rachel Thompson',
        email: 'rachel.thompson@leadsher.com',
        password: 'password123',
        role: 'mentee',
        bio: 'Junior developer looking to grow in full-stack development.',
      },
      {
        name: 'Lisa Anderson',
        email: 'lisa.anderson@leadsher.com',
        password: 'password123',
        role: 'mentee',
        bio: 'Career changer transitioning from marketing to product management.',
      },
      {
        name: 'Priya Sharma',
        email: 'priya.sharma@leadsher.com',
        password: 'password123',
        role: 'mentee',
        bio: 'Computer science student interested in AI and machine learning.',
      },
    ];

    // Create mentor users and profiles
    for (const mentorData of mentors) {
      const user = await User.create(mentorData.user);
      const profile = await MentorProfile.create({
        user: user._id,
        ...mentorData.profile,
        isVerified: true,
        isAvailable: true,
      });
      console.log(`Created mentor: ${user.name} (${user.email})`);
    }

    // Create mentee users
    for (const menteeData of mentees) {
      const user = await User.create(menteeData);
      console.log(`Created mentee: ${user.name} (${user.email})`);
    }

    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@leadsher.com',
      password: 'admin123',
      role: 'admin',
      bio: 'Platform administrator',
    });
    console.log(`Created admin: ${admin.name} (${admin.email})`);

    console.log('\n--- Seed Complete ---');
    console.log('Mentors: 5');
    console.log('Mentees: 3');
    console.log('Admin: 1');
    console.log('\nTest credentials:');
    console.log('  Mentors: sarah.johnson@leadsher.com / password123');
    console.log('  Mentees: rachel.thompson@leadsher.com / password123');
    console.log('  Admin: admin@leadsher.com / admin123');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedMentors();
