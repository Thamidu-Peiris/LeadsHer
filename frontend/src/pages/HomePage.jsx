import Hero           from '../components/home/Hero';
import StatsBar        from '../components/home/StatsBar';
import FeaturedStories from '../components/home/FeaturedStories';
import HowItWorks      from '../components/home/HowItWorks';
import MentorSpotlight from '../components/home/MentorSpotlight';
import UpcomingEvents  from '../components/home/UpcomingEvents';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <StatsBar />
      <FeaturedStories />
      <HowItWorks />
      <MentorSpotlight />
      <UpcomingEvents />
    </main>
  );
}
