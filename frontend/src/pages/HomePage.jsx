import Hero            from '../components/home/Hero';
import StatsSection    from '../components/home/StatsSection';
import FeaturedStories from '../components/home/FeaturedStories';
import HowItWorks      from '../components/home/HowItWorks';
import MentorSpotlight from '../components/home/MentorSpotlight';
import UpcomingEvents  from '../components/home/UpcomingEvents';
import CallToAction    from '../components/home/CallToAction';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <StatsSection />
      <FeaturedStories />
      <HowItWorks />
      <MentorSpotlight />
      <UpcomingEvents />
      <CallToAction />
    </main>
  );
}
